
import { create } from 'zustand';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';
import { supabase } from './services/supabase';

// Helper to get persist data
const loadState = () => {
  try {
    const serialized = localStorage.getItem('bounce_state');
    if (!serialized) return undefined;
    return JSON.parse(serialized);
  } catch (e) {
    return undefined;
  }
};

const saveState = (state: Partial<UserState>) => {
  try {
    const { identity, microHabits, habitRepository, energyTime, resilienceScore, streak, shields, lastCompletedDate, missedYesterday, isFrozen, resilienceStatus, theme, dailyCompletedIndices, history, totalCompletions, soundEnabled, soundType, soundVolume, goal, dismissedTooltips, isPremium, weeklyInsights, currentEnergyLevel } = state;
    const dataToSave = { identity, microHabits, habitRepository, energyTime, resilienceScore, streak, shields, lastCompletedDate, missedYesterday, isFrozen, resilienceStatus, theme, dailyCompletedIndices, history, totalCompletions, soundEnabled, soundType, soundVolume, goal, dismissedTooltips, isPremium, weeklyInsights, currentEnergyLevel };
    localStorage.setItem('bounce_state', JSON.stringify(dataToSave));

    // Trigger Background Sync if logged in
    // We use the store's sync action if available, but here we are outside the hook.
    // We can call a standalone sync function or just rely on the store action calling it.
    // Ideally, the actions call set() which calls saveState().
    // We can't easily access the store instance here to call syncToSupabase.
    // So we will implement syncToSupabase as a standalone function and call it here.
    backgroundSync(dataToSave as UserState);

  } catch (e) {
    // Ignore write errors
  }
};

let isSyncing = false;
const backgroundSync = async (state: UserState) => {
  if (isSyncing) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  isSyncing = true;
  try {
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
        energyTime: state.energyTime
      },
      updated_at: new Date().toISOString()
    });

    // 2. Habits (Simple Replace)
    // Only if habits changed? For now, just do it.
    // To avoid constant deletes, maybe we can check if it matches?
    // For v1, we just upsert.
    // Actually, let's skip habits sync on every keystroke.
    // Maybe only sync habits if microHabits changed.
    // We'll leave it for now.

  } catch (e) {
    console.error("Sync failed", e);
  } finally {
    isSyncing = false;
  }
};

export const useStore = create<UserState>((set, get) => ({
  currentView: 'onboarding',

  isPremium: false, // Default to true for demo purposes
  user: null,

  theme: 'dark', // Default
  soundEnabled: false,
  soundType: 'rain',
  soundVolume: 0.5,

  identity: '',
  microHabits: [],
  habitRepository: { high: [], medium: [], low: [] },
  currentHabitIndex: 0,
  energyTime: '',
  currentEnergyLevel: null,

  goal: { type: 'weekly', target: 3 }, // Default goal: 3 times a week
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

  // Hydrate from local storage if available
  ...loadState(),

  setTheme: (theme) => {
    set({ theme });
    saveState(get());
  },

  toggleSound: () => {
    set((state) => {
      const newState = { soundEnabled: !state.soundEnabled };
      saveState({ ...state, ...newState });
      return newState;
    });
  },

  setSoundType: (soundType) => {
    set({ soundType });
    saveState(get());
  },

  setSoundVolume: (soundVolume) => {
    set({ soundVolume });
    saveState(get());
  },

  setIdentity: (identity) => {
    set({ identity });
    saveState(get());
  },

  setGoal: (target) => {
    set({ goal: { type: 'weekly', target } });
    saveState(get());
  },

  dismissTooltip: (id) => {
    set((state) => {
      if (state.dismissedTooltips.includes(id)) return state;
      const newDismissed = [...state.dismissedTooltips, id];
      const newState = { ...state, dismissedTooltips: newDismissed };
      saveState(newState);
      return newState;
    });
  },

  setMicroHabits: (microHabits) => {
    set({ microHabits, currentHabitIndex: 0 });
    saveState(get());
  },

  setHabitsWithLevels: (habitRepository) => {
    set({
      habitRepository,
      microHabits: habitRepository.high, // Default to high energy
      currentEnergyLevel: 'high',
      currentHabitIndex: 0
    });
    saveState(get());
  },

  addMicroHabit: (habit) => {
    set((state) => {
      const newHabits = [...state.microHabits, habit];
      const newState = { ...state, microHabits: newHabits };
      saveState(newState);
      return { microHabits: newHabits };
    });
  },

  cycleMicroHabit: () => {
    set((state) => ({
      currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length
    }));
  },

  setEnergyTime: (energyTime) => {
    set({ energyTime });
    saveState(get());
  },

  setEnergyLevel: (level) => {
    const state = get();
    console.log(`Setting Energy Level: ${level}`, state.habitRepository);
    let newHabits = [...state.microHabits];

    if (state.habitRepository && state.habitRepository[level] && state.habitRepository[level].length > 0) {
      newHabits = state.habitRepository[level];
    } else {
      if (level === 'low') {
        newHabits = state.microHabits.map(h => h.includes("Easy") ? h : `${h} (Tiny Version)`);
      } else if (level === 'high') {
        newHabits = state.microHabits.map(h => h.includes("Bonus") ? h : `${h} + Bonus`);
      }
    }

    set({ currentEnergyLevel: level, microHabits: newHabits, currentHabitIndex: 0 });
    saveState(get());
  },

  completeDailyBounce: () => {
    // Logic moved to useResilienceEngine
  },

  updateResilience: (updates) => {
    set((state) => {
      let newHistory = { ...state.history };

      if (updates.dailyCompletedIndices && updates.lastCompletedDate) {
        const dateKey = new Date(updates.lastCompletedDate).toISOString().split('T')[0];
        const existingLog = newHistory[dateKey] || { date: dateKey, completedIndices: [] };

        newHistory[dateKey] = {
          ...existingLog,
          completedIndices: updates.dailyCompletedIndices
        };
      }

      const newState = { ...state, ...updates, history: newHistory };
      saveState(newState);
      return newState;
    });
  },

  logReflection: (dateIso, energy, note) => {
    set((state) => {
      const dateKey = dateIso.split('T')[0];
      const newHistory = { ...state.history };
      const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };

      newHistory[dateKey] = {
        ...existing,
        energy,
        note
      };

      const newState = { ...state, history: newHistory };
      saveState(newState);
      return newState;
    });
  },

  setDailyIntention: (dateIso, intention) => {
    set((state) => {
      const dateKey = dateIso.split('T')[0];
      const newHistory = { ...state.history };
      const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };

      newHistory[dateKey] = {
        ...existing,
        intention
      };

      const newState = { ...state, history: newHistory };
      saveState(newState);
      return newState;
    });
  },

  toggleFreeze: (active) => {
    const newStatus: ResilienceStatus = active ? 'FROZEN' : 'ACTIVE';
    set({
      isFrozen: active,
      freezeExpiry: active ? Date.now() + 24 * 60 * 60 * 1000 : null,
      resilienceStatus: newStatus
    });
    saveState(get());
  },

  saveUndoState: () => {
    const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
    set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
  },

  restoreUndoState: () => {
    const { undoState } = get();
    if (undoState) {
      const newState = { ...undoState, undoState: null };
      set(newState);
      saveState({ ...get(), ...newState });
    }
  },

  setView: (view) => set({ currentView: view }),

  resetProgress: () => {
    const resetState = {
      identity: '',
      microHabits: [],
      habitRepository: { high: [], medium: [], low: [] },
      currentHabitIndex: 0,
      energyTime: '',
      resilienceScore: 50,
      resilienceStatus: 'ACTIVE' as const,
      streak: 0,
      shields: 0,
      totalCompletions: 0,
      lastCompletedDate: null,
      missedYesterday: false,
      dailyCompletedIndices: [],
      history: {},
      weeklyInsights: [],
      currentView: 'onboarding' as const,
      undoState: null,
      goal: { type: 'weekly' as const, target: 3 },
      dismissedTooltips: [],
      currentEnergyLevel: null
    };
    set(resetState);
    saveState(resetState);
  },

  importData: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data && data.resilienceScore !== undefined && data.history) {
        set((state) => {
          const newState = { ...state, ...data };
          saveState(newState);
          return newState;
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  generateWeeklyReview: () => {
    set(state => {
      const id = Date.now().toString();
      const newInsight: WeeklyInsight = {
        id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        story: [
          "This week was a rollercoaster! 🎢",
          "You crushed Monday with high energy ⚡",
          "But Wednesday... we saw a dip. It happens. 📉",
          "We noticed you bounce back stronger on Fridays."
        ],
        pattern: "Energy slump mid-week",
        suggestion: "Auto-switching Wednesday habit to 'Micro-Mode' (1 min)",
        viewed: false
      };
      const newState = { ...state, weeklyInsights: [...state.weeklyInsights, newInsight] };
      saveState(newState);
      return newState;
    });
  },

  markReviewViewed: (id) => {
    set(state => {
      const updated = state.weeklyInsights.map(i => i.id === id ? { ...i, viewed: true } : i);
      saveState({ ...state, weeklyInsights: updated });
      return { weeklyInsights: updated };
    });
  },

  handleVoiceLog: (text, type) => {
    const state = get();
    if (type === 'intention') {
      const now = new Date().toISOString();
      state.setDailyIntention(now, text);
    } else if (type === 'habit') {
      const newHabits = [...state.microHabits];
      newHabits[state.currentHabitIndex] = text;
      state.setMicroHabits(newHabits);
    }
  },

  // --- SUPABASE ACTIONS ---

  initializeAuth: () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ user: session?.user || null });

      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();

        if (profile) {
          // Existing User: Load Cloud Data
          get().loadFromSupabase();
        } else {
          // New User: Push Local Data
          get().syncToSupabase();
        }
      }
    });
  },

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
        energyTime: state.energyTime
      },
      updated_at: new Date().toISOString()
    });

    // 2. Habits (Replace)
    await supabase.from('habits').delete().eq('user_id', user.id);
    const habitsToInsert = state.microHabits.map(h => ({
      user_id: user.id,
      content: h,
      category: 'current'
    }));
    if (habitsToInsert.length > 0) {
      await supabase.from('habits').insert(habitsToInsert);
    }

    // 3. Logs (Full History Sync - Heavy but simple for v1)
    // We iterate over history keys
    const logsToUpsert = Object.values(state.history).map(log => ({
      user_id: user.id,
      date: log.date,
      completed_indices: log.completedIndices,
      note: log.note,
      energy_rating: log.energy,
      intention: log.intention
    }));

    // Upsert in batches if needed, but for now just one go
    if (logsToUpsert.length > 0) {
      // Supabase upsert requires conflict target
      // We need a unique constraint on (user_id, date) in the table?
      // I didn't add it in SQL. I should have.
      // For now, I'll delete logs for these dates first? No, that's dangerous.
      // I'll assume the user runs the SQL I provided which uses UUID primary key.
      // But upsert needs to know which row to update.
      // I should modify SQL to add unique constraint on (user_id, date).
      // Or I can just insert and ignore duplicates? No.
      // I will update the SQL schema to include the constraint.
      // For now, let's just try upserting with 'id' if we had it, but we don't store log IDs locally.
      // I will skip log sync for this step to avoid errors, or try to match by date.
      // Actually, I'll add the constraint in the SQL file I created earlier?
      // I didn't. I should update the SQL file.
      // But I can't update the SQL file easily if the user already ran it.
      // I'll assume I can just insert for now.
      // Wait, if I insert duplicates, history will be messy.
      // I'll use a delete-then-insert strategy for logs too, for the specific dates in history.
      // It's inefficient but works.
      const dates = logsToUpsert.map(l => l.date);
      await supabase.from('logs').delete().eq('user_id', user.id).in('date', dates);
      await supabase.from('logs').insert(logsToUpsert);
    }
  },

  loadFromSupabase: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // CRITICAL: Set user in store
    set({ user });
    if (!user) return;

    // 1. Profile
    // CHANGE: Ensure we select all columns (*) or explicitly add is_premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({
        identity: profile.identity || '',
        resilienceScore: profile.resilience_score,
        // 👇 ADD THIS LINE 👇
        isPremium: profile.is_premium ?? false,
        // 👆 This syncs the DB status to your UI
        streak: profile.streak,
        shields: profile.shields,
        theme: profile.settings?.theme || 'dark',
        soundEnabled: profile.settings?.soundEnabled || false,
        soundType: profile.settings?.soundType || 'rain',
        soundVolume: profile.settings?.soundVolume || 0.5,
        goal: profile.settings?.goal || { type: 'weekly', target: 3 },
        energyTime: profile.settings?.energyTime || ''
      });
    }

    // 2. Habits
    const { data: habits } = await supabase.from('habits').select('content').eq('user_id', user.id).eq('category', 'current');
    if (habits && habits.length > 0) {
      set({ microHabits: habits.map(h => h.content) });
    }

    // 3. Logs
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
      set({ history: newHistory });
    }

    // Save to local storage to keep them in sync
    saveState(get());
  }

}));
