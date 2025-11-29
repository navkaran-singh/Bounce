import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';
import { supabase } from './services/supabase';
import { Preferences } from '@capacitor/preferences';

// ✅ DEBUG NATIVE STORAGE ADAPTER
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(`[STORAGE READ] Reading ${name} from Native Disk`);
    const { value } = await Preferences.get({ key: name });
    if (value) {
      try {
        const parsed = JSON.parse(value);
        // Log what we found so we know if disk was correct
        console.log("🔍 [STORAGE DATA] Indices on Disk:", parsed.state?.dailyCompletedIndices);
      } catch (e) { }
    } else {
      console.log(`[STORAGE READ] Result: Null`);
    }
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      // Log what we are about to save so we catch the overwrite
      console.log(`💾 [STORAGE WRITE] Saving. Indices:`, parsed.state?.dailyCompletedIndices);
    } catch (e) {
      console.log(`💾 [STORAGE WRITE] Saving (Unparseable)`);
    }
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(`[STORAGE DELETE] Removing ${name}`);
    await Preferences.remove({ key: name });
  },
};

interface ExtendedUserState extends UserState {
  lastUpdated: number;
  _hasHydrated: boolean;
  hasSyncedOnce: boolean;
  setHasHydrated: (state: boolean) => void;
  loadFromSupabase: (isFirstLogin?: boolean) => Promise<void>;
  completeHabit: (habitIndex: number) => void;
}

export const useStore = create<ExtendedUserState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      _hasHydrated: false,
      hasSyncedOnce: false,
      setHasHydrated: (state) => {
        console.log(`[STORE] Hydration Status Changed to: ${state}`);
        set({ _hasHydrated: state });
      },

      currentView: 'onboarding',
      isPremium: false,
      user: null,
      lastUpdated: 0,
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
        console.log("🛑 [ACTION] LOGGING OUT.");
        set({
          user: null,
          identity: '',
          microHabits: [],
          habitRepository: { high: [], medium: [], low: [] },
          history: {},
          streak: 0,
          resilienceScore: 50,
          currentView: 'onboarding',
          lastUpdated: 0,
          hasSyncedOnce: false
        });

        await Preferences.remove({ key: 'bounce_state' });
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        try { await supabase.auth.signOut(); } catch (e) { }
        window.location.reload();
      },

      getExportData: () => {
        const state = get();
        return JSON.stringify({ ...state, timestamp: new Date().toISOString() }, null, 2);
      },

      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundType: (soundType) => set({ soundType }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),

      setIdentity: (identity) => {
        set({ identity, lastUpdated: Date.now() });
        get().syncToSupabase();
      },

      setGoal: (target) => {
        set({ goal: { type: 'weekly', target }, lastUpdated: Date.now() });
        get().syncToSupabase();
      },

      dismissTooltip: (id) => set((state) => {
        if (state.dismissedTooltips.includes(id)) return state;
        return { dismissedTooltips: [...state.dismissedTooltips, id] };
      }),

      setMicroHabits: (microHabits) => {
        set({ microHabits, currentHabitIndex: 0, lastUpdated: Date.now() });
        get().syncToSupabase();
      },

      setHabitsWithLevels: (habitRepository) => {
        set({
          habitRepository,
          microHabits: habitRepository.high,
          currentEnergyLevel: 'high',
          currentHabitIndex: 0,
          lastUpdated: Date.now()
        });
        get().syncToSupabase();
      },

      addMicroHabit: (habit) => {
        const state = get();
        const currentLevel = state.currentEnergyLevel || 'medium';
        const newRepo = { ...state.habitRepository };
        if (!newRepo[currentLevel]) newRepo[currentLevel] = [];
        newRepo[currentLevel] = [...newRepo[currentLevel], habit];

        set({
          microHabits: [...state.microHabits, habit],
          habitRepository: newRepo,
          lastUpdated: Date.now()
        });
        get().syncToSupabase();
      },

      cycleMicroHabit: () => set((state) => ({
        currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length
      })),

      setEnergyTime: (energyTime) => {
        set({ energyTime, lastUpdated: Date.now() });
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
        set({ currentEnergyLevel: level, microHabits: newHabits, currentHabitIndex: 0, lastUpdated: Date.now() });
        get().syncToSupabase();
      },

      completeDailyBounce: () => { },

      completeHabit: (habitIndex) => {
        const state = get();
        if (state.dailyCompletedIndices.includes(habitIndex)) return;

        console.log(`✅ [STORE] Saving Habit Completion: Index ${habitIndex}`);

        const newIndices = [...state.dailyCompletedIndices, habitIndex];
        const now = new Date().toISOString();
        const dateKey = now.split('T')[0];

        const newHistory = { ...state.history };
        const existingLog = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
        newHistory[dateKey] = { ...existingLog, completedIndices: newIndices };

        const isNewDay = state.lastCompletedDate ? state.lastCompletedDate.split('T')[0] !== dateKey : true;
        const newStreak = isNewDay ? state.streak + 1 : state.streak;

        set({
          dailyCompletedIndices: newIndices,
          lastCompletedDate: now,
          streak: newStreak,
          resilienceScore: Math.min(100, state.resilienceScore + 5),
          history: newHistory,
          lastUpdated: Date.now()
        });

        get().syncToSupabase();
      },

      updateResilience: (updates) => {
        if (!get()._hasHydrated) {
          console.warn("🛑 [STORE] Blocked Engine Update (Not Hydrated Yet)");
          return;
        }

        set((state) => {
          // 🛡️ THE HARD GUARD 🛡️
          // This logic explicitly forbids overwriting today's progress with an empty array
          if (updates.dailyCompletedIndices && updates.dailyCompletedIndices.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            // Be robust: If lastCompletedDate exists, check it. If not, be cautious.
            const lastActive = state.lastCompletedDate ? state.lastCompletedDate.split('T')[0] : '';

            // IF we completed something today (Indices > 0 AND Date == Today)
            if (state.dailyCompletedIndices.length > 0 && lastActive === today) {
              console.warn(`🛡️ [STORE] BLOCKED WIPE. Engine tried to send [], but we have ${state.dailyCompletedIndices}.`);

              // Strip out the empty indices from the update
              const { dailyCompletedIndices, ...safeUpdates } = updates;
              return { ...state, ...safeUpdates, lastUpdated: Date.now() };
            }
          }

          // Normal update logic
          let newHistory = { ...state.history };
          if (updates.dailyCompletedIndices && updates.lastCompletedDate) {
            const dateKey = new Date(updates.lastCompletedDate).toISOString().split('T')[0];
            const existingLog = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
            newHistory[dateKey] = { ...existingLog, completedIndices: updates.dailyCompletedIndices };
          }

          if (updates.resilienceScore !== undefined) {
            updateWidgetData(updates.resilienceScore, updates.streak || state.streak);
          }

          return { ...state, ...updates, history: newHistory, lastUpdated: Date.now() };
        });
        get().syncToSupabase();
      },

      logReflection: (dateIso, energy, note) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, energy, note };
          return { ...state, history: newHistory, lastUpdated: Date.now() };
        });
        get().syncToSupabase();
      },

      setDailyIntention: (dateIso, intention) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, intention };
          return { ...state, history: newHistory, lastUpdated: Date.now() };
        });
        get().syncToSupabase();
      },

      toggleFreeze: (active) => {
        const newStatus: ResilienceStatus = active ? 'FROZEN' : 'ACTIVE';
        set({
          isFrozen: active,
          freezeExpiry: active ? Date.now() + 24 * 60 * 60 * 1000 : null,
          resilienceStatus: newStatus,
          lastUpdated: Date.now()
        });
        get().syncToSupabase();
      },

      saveUndoState: () => {
        const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
        set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
      },

      restoreUndoState: () => {
        const { undoState } = get();
        if (undoState) {
          set({ ...undoState, undoState: null, lastUpdated: Date.now() });
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
        currentEnergyLevel: null,
        lastUpdated: Date.now(),
        hasSyncedOnce: false
      }),

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data && data.resilienceScore !== undefined) {
            set((state) => ({ ...state, ...data, lastUpdated: Date.now() }));
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

      initializeAuth: () => { },

      syncToSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log("[SYNC] No user. Skipping upload.");
            return;
          }

          const state = get();
          console.log(`[SYNC] Uploading to cloud...`);
          console.log(`[SYNC] Identity: "${state.identity}", Score: ${state.resilienceScore}, Streak: ${state.streak}`);
          console.log(`[SYNC] Habits: ${state.microHabits.length}, History entries: ${Object.keys(state.history).length}`);

          const { error: profileError } = await supabase.from('profiles').upsert({
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
              habitRepository: state.habitRepository,
              lastUpdated: state.lastUpdated,
              lastCompletedDate: state.lastCompletedDate
            },
            updated_at: new Date().toISOString()
          });

          if (profileError) {
            console.error("[SYNC] Profile upsert error:", profileError);
          } else {
            console.log("[SYNC] ✅ Profile uploaded successfully.");
          }

          // Delete old habits and insert new ones
          await supabase.from('habits').delete().eq('user_id', user.id);
          const habitsToInsert = state.microHabits.map(h => ({
            user_id: user.id,
            content: h,
            category: 'current'
          }));
          if (habitsToInsert.length > 0) {
            const { error: habitsError } = await supabase.from('habits').insert(habitsToInsert);
            if (habitsError) {
              console.error("[SYNC] Habits insert error:", habitsError);
            } else {
              console.log(`[SYNC] ✅ ${habitsToInsert.length} habits uploaded.`);
            }
          }

          // Upsert logs
          const logsToUpsert = Object.values(state.history).map(log => ({
            user_id: user.id,
            date: log.date,
            completed_indices: log.completedIndices,
            note: log.note,
            energy_rating: log.energy,
            intention: log.intention
          }));
          if (logsToUpsert.length > 0) {
            const { error: logsError } = await supabase.from('logs').upsert(logsToUpsert);
            if (logsError) {
              console.error("[SYNC] Logs upsert error:", logsError);
            } else {
              console.log(`[SYNC] ✅ ${logsToUpsert.length} logs uploaded.`);
            }
          }

          if (!state.hasSyncedOnce) set({ hasSyncedOnce: true });
          console.log("[SYNC] ✅ Sync complete.");
          
        } catch (e) {
          console.error("[SYNC] Error:", e);
        }
      },

      loadFromSupabase: async (isFirstLogin = false) => {
        console.log(`[LOAD] ========== SYNC START ==========`);
        console.log(`[LOAD] isFirstLogin=${isFirstLogin}`);
        const state = get();
        console.log(`[LOAD] Current state: hasSyncedOnce=${state.hasSyncedOnce}, identity="${state.identity}"`);
        
        // 🛡️ Wrap everything in try-catch to prevent hangs
        try {
          const { data: { user } } = await supabase.auth.getUser();
          set({ user });
          if (!user) {
            console.log("[LOAD] No user. Returning.");
            return;
          }
          console.log(`[LOAD] User ID: ${user.id}`);

          // 🛡️ RULE 1: If we've already synced once AND this is NOT a first login, LOCAL IS MASTER.
          if (state.hasSyncedOnce && !isFirstLogin) {
            console.log("🟢 [LOAD] Already synced this session. Local is master. Skipping.");
            return;
          }

          // 🛡️ RULE 2: First time sync - need to check if account exists in cloud
          console.log("[LOAD] Fetching profile from cloud...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.log("[LOAD] Profile fetch error:", profileError.message);
          }
          
          console.log(`[LOAD] Cloud profile identity: "${profile?.identity || 'NULL'}"`);

          // 🛡️ CASE A: Account is NEW (no profile OR identity is "New Bouncer")
          // → Upload local state to cloud
          const isNewAccount = !profile || !profile.identity || profile.identity === 'New Bouncer';
          console.log(`[LOAD] Is new account? ${isNewAccount}`);
          
          if (isNewAccount) {
            console.log("🟢 [LOAD] NEW ACCOUNT (Sign Up). Uploading local data to cloud...");
            set({ hasSyncedOnce: true });
            // Upload local state to cloud
            await get().syncToSupabase();
            console.log("🟢 [LOAD] Upload complete.");
            return;
          }

          // 🛡️ CASE B: Account EXISTS (identity is NOT "New Bouncer")
          // → Download cloud state to local (ONLY on first login)
          console.log("🟠 [LOAD] EXISTING ACCOUNT (Log In). Downloading cloud data to local.");
          
          // Download profile data
          set({
            identity: profile.identity || '',
            resilienceScore: profile.resilience_score ?? 50,
            isPremium: profile.is_premium ?? false,
            streak: profile.streak ?? 0,
            shields: profile.shields ?? 0,
            theme: profile.settings?.theme || 'dark',
            soundEnabled: profile.settings?.soundEnabled || false,
            soundType: profile.settings?.soundType || 'rain',
            soundVolume: profile.settings?.soundVolume ?? 0.5,
            goal: profile.settings?.goal || { type: 'weekly', target: 3 },
            energyTime: profile.settings?.energyTime || '',
            habitRepository: profile.settings?.habitRepository || { high: [], medium: [], low: [] },
            lastCompletedDate: profile.settings?.lastCompletedDate || null,
            lastUpdated: Date.now(),
            hasSyncedOnce: true
          });
          
          updateWidgetData(profile.resilience_score ?? 50, profile.streak ?? 0);

          // Download habits
          const { data: habits } = await supabase
            .from('habits')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'current');
            
          if (habits && habits.length > 0) {
            console.log(`[LOAD] Downloaded ${habits.length} habits from cloud.`);
            set({ microHabits: habits.map(h => h.content) });
          }

          // Download logs/history
          const { data: logs } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', user.id);
            
          if (logs && logs.length > 0) {
            console.log(`[LOAD] Downloaded ${logs.length} logs from cloud.`);
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

            // Check if there's data for today
            const todayKey = new Date().toISOString().split('T')[0];
            const todaysLog = newHistory[todayKey];
            if (todaysLog && todaysLog.completedIndices && todaysLog.completedIndices.length > 0) {
              set({ dailyCompletedIndices: todaysLog.completedIndices });
            }
            set({ history: newHistory });
          }
          
          console.log("🟢 [LOAD] Cloud data downloaded successfully.");
          
        } catch (e) {
          console.error("[LOAD] Error:", e);
          // Don't block the app - just mark as synced and continue with local data
          set({ hasSyncedOnce: true });
        }
      }
    }),
    {
      name: 'bounce_state',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        identity: state.identity,
        soundEnabled: state.soundEnabled,
        microHabits: state.microHabits,
        habitRepository: state.habitRepository,
        history: state.history,
        resilienceScore: state.resilienceScore,
        streak: state.streak,
        lastUpdated: state.lastUpdated,
        dailyCompletedIndices: state.dailyCompletedIndices,
        lastCompletedDate: state.lastCompletedDate,
        currentView: state.currentView,
        weeklyInsights: state.weeklyInsights
        // 🛡️ NOTE: hasSyncedOnce is NOT persisted - it resets to false on every app start
        // This ensures first login always triggers the sync logic
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);

const updateWidgetData = async (score: number, streak: number) => {
  try {
    await Preferences.set({ key: 'resilience_score', value: score.toString() });
    await Preferences.set({ key: 'streak', value: streak.toString() });
  } catch (e) { }
};