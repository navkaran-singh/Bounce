
import { create } from 'zustand';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';

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
  } catch (e) {
    // Ignore write errors
  }
};

export const useStore = create<UserState>((set, get) => ({
  currentView: 'onboarding',

  isPremium: true, // Default to true for demo purposes

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

  // --- NEW ACTION HERE ---
  addMicroHabit: (habit) => {
    set((state) => {
      // Create a new array with the old habits + the new one
      const newHabits = [...state.microHabits, habit];

      // Save to local storage
      const newState = { ...state, microHabits: newHabits };
      saveState(newState);

      return { microHabits: newHabits };
    });
  },
  // -----------------------

  cycleMicroHabit: () => {
    set((state) => ({
      currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length
    }));
  },

  setEnergyTime: (energyTime) => {
    set({ energyTime });
    saveState(get());
  },

  // Smart Energy Check-in Logic
  setEnergyLevel: (level) => {
    const state = get();
    let newHabits = [...state.microHabits];

    // If we have habits in the repository for this level, use them
    if (state.habitRepository && state.habitRepository[level] && state.habitRepository[level].length > 0) {
      newHabits = state.habitRepository[level];
    } else {
      // Fallback logic if repository is empty (legacy support)
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
      // If we are updating indices, we must also sync to History
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
      // We restore the state and clear the undoState
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
      // Simple validation
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

  // Premium Feature: Weekly AI Analysis
  generateWeeklyReview: () => {
    set(state => {
      const id = Date.now().toString();
      // Mock AI Analysis
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
    // Mock AI processing of voice
    const state = get();
    if (type === 'intention') {
      const now = new Date().toISOString();
      state.setDailyIntention(now, text);
    } else if (type === 'habit') {
      // Replace current habit variation with voice command
      const newHabits = [...state.microHabits];
      newHabits[state.currentHabitIndex] = text;
      state.setMicroHabits(newHabits);
    }
    // If note, handled by reflection modal usually, but we could add here
  }
}));
