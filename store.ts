import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';
import { supabase } from './services/supabase';
import { Preferences } from '@capacitor/preferences';

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      currentView: 'onboarding',
      isPremium: false,
      user: null,

      setUser: (user) => set({ user }),

      theme: 'dark',
      soundEnabled: false,
      soundType: 'rain',
      soundVolume: 0.5,

      identity: '',
      microHabits: [],
      habitRepository: { high: [], medium: [], low: [] },
      currentHabitIndex: 0,
      energyTime: '',
      currentEnergyLevel: null,

      goal: { type: 'weekly', target: 3 },
      dismissedTooltips: [],

      resilienceScore: 50,
      resilienceStatus: 'ACTIVE',
      streak: 0,
      shields: 0,
      totalCompletions: 0,
      lastCompletedDate: null,
      missedYesterday: false,
      dailyCompletedIndices: [],

      history: {},
      weeklyInsights: [],

      undoState: null,
      isFrozen: false,
      freezeExpiry: null,

      // --- ACTIONS ---

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          identity: '',
          microHabits: [],
          habitRepository: { high: [], medium: [], low: [] },
          history: {},
          streak: 0,
          resilienceScore: 60,
          currentView: 'onboarding',
        });
        localStorage.removeItem('bounce_state');
      },

      getExportData: () => {
        const state = get();
        const data = {
          identity: state.identity,
          microHabits: state.microHabits,
          habitRepository: state.habitRepository,
          history: state.history,
          resilienceScore: state.resilienceScore,
          streak: state.streak,
          timestamp: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
      },

      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundType: (soundType) => set({ soundType }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),

      setIdentity: (identity) => {
        set({ identity });
        get().syncToSupabase();
      },

      setGoal: (target) => {
        set({ goal: { type: 'weekly', target } });
        get().syncToSupabase();
      },

      dismissTooltip: (id) => set((state) => {
        if (state.dismissedTooltips.includes(id)) return state;
        return { dismissedTooltips: [...state.dismissedTooltips, id] };
      }),

      setMicroHabits: (microHabits) => {
        set({ microHabits, currentHabitIndex: 0 });
        get().syncToSupabase();
      },

      setHabitsWithLevels: (habitRepository) => {
        set({
          habitRepository,
          microHabits: habitRepository.high,
          currentEnergyLevel: 'high',
          currentHabitIndex: 0
        });
        get().syncToSupabase();
      },

      addMicroHabit: (habit) => {
        const state = get();
        const currentLevel = state.currentEnergyLevel || 'medium';
        const newMicroHabits = [...state.microHabits, habit];
        const newRepo = { ...state.habitRepository };
        if (!newRepo[currentLevel]) newRepo[currentLevel] = [];
        newRepo[currentLevel] = [...newRepo[currentLevel], habit];

        set({
          microHabits: newMicroHabits,
          habitRepository: newRepo
        });
        get().syncToSupabase();
      },

      cycleMicroHabit: () => set((state) => ({
        currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length
      })),

      setEnergyTime: (energyTime) => {
        set({ energyTime });
        get().syncToSupabase();
      },

      setEnergyLevel: (level) => {
        const state = get();
        let newHabits = [...state.microHabits];
        if (state.habitRepository && state.habitRepository[level] && state.habitRepository[level].length > 0) {
          newHabits = state.habitRepository[level];
        } else {
          if (level === 'low') newHabits = state.microHabits.map(h => h.includes("Easy") ? h : `${h} (Tiny Version)`);
          else if (level === 'high') newHabits = state.microHabits.map(h => h.includes("Bonus") ? h : `${h} + Bonus`);
        }
        set({ currentEnergyLevel: level, microHabits: newHabits, currentHabitIndex: 0 });
        get().syncToSupabase();
      },

      completeDailyBounce: () => { },

      updateResilience: (updates) => {
        set((state) => {
          let newHistory = { ...state.history };
          if (updates.dailyCompletedIndices && updates.lastCompletedDate) {
            const dateKey = new Date(updates.lastCompletedDate).toISOString().split('T')[0];
            const existingLog = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
            newHistory[dateKey] = { ...existingLog, completedIndices: updates.dailyCompletedIndices };
          }
          if (updates.resilienceScore !== undefined) {
            updateWidgetData(updates.resilienceScore, updates.streak || state.streak);
          }
          return { ...state, ...updates, history: newHistory };
        });
        get().syncToSupabase();
      },

      logReflection: (dateIso, energy, note) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, energy, note };
          return { ...state, history: newHistory };
        });
        get().syncToSupabase();
      },

      setDailyIntention: (dateIso, intention) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, intention };
          return { ...state, history: newHistory };
        });
        get().syncToSupabase();
      },

      toggleFreeze: (active) => {
        const newStatus: ResilienceStatus = active ? 'FROZEN' : 'ACTIVE';
        set({ isFrozen: active, freezeExpiry: active ? Date.now() + 24 * 60 * 60 * 1000 : null, resilienceStatus: newStatus });
        get().syncToSupabase();
      },

      saveUndoState: () => {
        const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
        set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
      },

      restoreUndoState: () => {
        const { undoState } = get();
        if (undoState) {
          set({ ...undoState, undoState: null });
        }
        get().syncToSupabase();
      },

      setView: (view) => set({ currentView: view }),

      resetProgress: () => set({
        identity: '',
        microHabits: [],
        habitRepository: { high: [], medium: [], low: [] },
        currentHabitIndex: 0,
        energyTime: '',
        resilienceScore: 50,
        resilienceStatus: 'ACTIVE',
        streak: 0,
        shields: 0,
        totalCompletions: 0,
        lastCompletedDate: null,
        missedYesterday: false,
        dailyCompletedIndices: [],
        history: {},
        weeklyInsights: [],
        currentView: 'onboarding',
        undoState: null,
        goal: { type: 'weekly', target: 3 },
        dismissedTooltips: [],
        currentEnergyLevel: null
      }),

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data && data.resilienceScore !== undefined) {
            set((state) => ({ ...state, ...data }));
            get().syncToSupabase();
            return true;
          }
          return false;
        } catch (e) { return false; }
      },

      generateWeeklyReview: () => set(state => {
        const id = Date.now().toString();
        const newInsight: WeeklyInsight = {
          id,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          story: ["You survived the week! ⚡"],
          pattern: "Consistency Check",
          suggestion: "Keep bouncing.",
          viewed: false
        };
        return { ...state, weeklyInsights: [...state.weeklyInsights, newInsight] };
      }),

      markReviewViewed: (id) => set(state => ({
        weeklyInsights: state.weeklyInsights.map(i => i.id === id ? { ...i, viewed: true } : i)
      })),

      handleVoiceLog: (text, type) => {
        const state = get();
        if (type === 'intention') {
          const now = new Date().toISOString();
          state.setDailyIntention(now, text);
        } else if (type === 'habit') {
          state.addMicroHabit(text);
        }
      },

      // --- SUPABASE SYNC ---
      initializeAuth: () => { },

      syncToSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const state = get();

        // 1. Profile
        await supabase.from('profiles').upsert({
          id: user.id,
          identity: state.identity,
          resilience_score: state.resilienceScore,
          streak: state.streak,
          shields: state.shields,
          settings: {
            theme: state.theme,
            soundEnabled: state.soundEnabled,
            soundType: state.soundType,
            soundVolume: state.soundVolume,
            goal: state.goal,
            energyTime: state.energyTime,
            habitRepository: state.habitRepository
          },
          updated_at: new Date().toISOString()
        });

        // 2. Habits
        await supabase.from('habits').delete().eq('user_id', user.id);
        const habitsToInsert = state.microHabits.map(h => ({
          user_id: user.id,
          content: h,
          category: 'current'
        }));
        if (habitsToInsert.length > 0) {
          await supabase.from('habits').insert(habitsToInsert);
        }

        // 3. Logs (Keeping your existing working logic)
        const logsToUpsert = Object.values(state.history).map(log => ({
          user_id: user.id,
          date: log.date,
          completed_indices: log.completedIndices,
          note: log.note,
          energy_rating: log.energy,
          intention: log.intention
        }));

        if (logsToUpsert.length > 0) {
          const dates = logsToUpsert.map(l => l.date);
          await supabase.from('logs').delete().eq('user_id', user.id).in('date', dates);
          await supabase.from('logs').insert(logsToUpsert);
        }
      },

      loadFromSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        set({ user });
        if (!user) return;

        // 1. Profile (Streak, Score, Identity)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          set({
            identity: profile.identity || '',
            resilienceScore: profile.resilience_score,
            isPremium: profile.is_premium ?? false,
            streak: profile.streak,
            shields: profile.shields,
            theme: profile.settings?.theme || 'dark',
            soundEnabled: profile.settings?.soundEnabled || false,
            soundType: profile.settings?.soundType || 'rain',
            soundVolume: profile.settings?.soundVolume || 0.5,
            goal: profile.settings?.goal || { type: 'weekly', target: 3 },
            energyTime: profile.settings?.energyTime || '',
            habitRepository: profile.settings?.habitRepository || { high: [], medium: [], low: [] }
          });
          updateWidgetData(profile.resilience_score, profile.streak);
        }

        // 2. Habits
        const { data: habits } = await supabase.from('habits').select('content').eq('user_id', user.id).eq('category', 'current');
        if (habits && habits.length > 0) {
          set({ microHabits: habits.map(h => h.content) });
        }

        // 3. Logs (History & Today's Checkmarks)
        const { data: logs } = await supabase.from('logs').select('*').eq('user_id', user.id);
        if (logs) {
          const newHistory: Record<string, DailyLog> = {};
          logs.forEach(log => {
            newHistory[log.date] = {
              date: log.date,
              completedIndices: log.completed_indices || [],
              energy: log.energy_rating as any,
              note: log.note,
              intention: log.intention
            };
          });

          // 👇 THE FIX IS HERE
          const todayKey = new Date().toISOString().split('T')[0];
          const todaysLog = newHistory[todayKey];

          // If we find a log for today AND it has completed items:
          if (todaysLog && todaysLog.completedIndices && todaysLog.completedIndices.length > 0) {
            console.log("Restoring today's progress...", todaysLog.completedIndices);
            set({
              history: newHistory,
              dailyCompletedIndices: todaysLog.completedIndices,
              // ✅ CRITICAL: Tell the engine "We are already done for today"
              // This prevents the streak from double-counting or resetting incorrectly
              lastCompletedDate: todayKey,
              currentEnergyLevel: todaysLog.energy || null
            });
          } else {
            // If no habits done today, ensure we are clean
            set({
              history: newHistory,
              dailyCompletedIndices: [],
              // Do NOT set lastCompletedDate to todayKey here
            });
          }
        }
      }
    }),
    {
      name: 'bounce_state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        identity: state.identity,
        soundEnabled: state.soundEnabled,
        microHabits: state.microHabits,
        habitRepository: state.habitRepository,
        history: state.history,
        resilienceScore: state.resilienceScore,
        streak: state.streak
      }),
    }
  )
);

const updateWidgetData = async (score: number, streak: number) => {
  try {
    await Preferences.set({ key: 'resilience_score', value: score.toString() });
    await Preferences.set({ key: 'streak', value: streak.toString() });
  } catch (e) { }
};