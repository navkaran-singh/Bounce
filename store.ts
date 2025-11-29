import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';
import { Preferences } from '@capacitor/preferences';

const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

interface ExtendedUserState extends UserState {
  lastUpdated: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  completeHabit: (habitIndex: number) => void;
}

export const useStore = create<ExtendedUserState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
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

      logout: async () => {
        set({ user: null, identity: '', microHabits: [], habitRepository: { high: [], medium: [], low: [] }, history: {}, streak: 0, resilienceScore: 50, currentView: 'onboarding', lastUpdated: 0 });
        await Preferences.remove({ key: 'bounce_state' });
      },
      getExportData: () => JSON.stringify({ ...get(), timestamp: new Date().toISOString() }, null, 2),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundType: (soundType) => set({ soundType }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setIdentity: (identity) => set({ identity, lastUpdated: Date.now() }),
      setGoal: (target) => set({ goal: { type: 'weekly', target }, lastUpdated: Date.now() }),
      dismissTooltip: (id) => set((state) => state.dismissedTooltips.includes(id) ? state : { dismissedTooltips: [...state.dismissedTooltips, id] }),
      setMicroHabits: (microHabits) => set({ microHabits, currentHabitIndex: 0, lastUpdated: Date.now() }),
      setHabitsWithLevels: (habitRepository) => set({ habitRepository, microHabits: habitRepository.high, currentEnergyLevel: 'high', currentHabitIndex: 0, lastUpdated: Date.now() }),
      addMicroHabit: (habit) => {
        const state = get();
        const level = state.currentEnergyLevel || 'medium';
        const newRepo = { ...state.habitRepository };
        if (!newRepo[level]) newRepo[level] = [];
        newRepo[level] = [...newRepo[level], habit];
        set({ microHabits: [...state.microHabits, habit], habitRepository: newRepo, lastUpdated: Date.now() });
      },
      cycleMicroHabit: () => set((state) => ({ currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length })),
      setEnergyTime: (energyTime) => set({ energyTime, lastUpdated: Date.now() }),
      setEnergyLevel: (level) => {
        const state = get();
        let newHabits = state.habitRepository?.[level]?.length > 0 ? state.habitRepository[level] : state.microHabits;
        set({ currentEnergyLevel: level, microHabits: newHabits, currentHabitIndex: 0, lastUpdated: Date.now() });
      },
      completeDailyBounce: () => {},

      completeHabit: (habitIndex) => {
        const state = get();
        if (state.dailyCompletedIndices.includes(habitIndex)) return;
        const newIndices = [...state.dailyCompletedIndices, habitIndex];
        const now = new Date().toISOString();
        const dateKey = now.split('T')[0];
        const newHistory = { ...state.history };
        newHistory[dateKey] = { date: dateKey, completedIndices: newIndices };
        const isNewDay = !state.lastCompletedDate || state.lastCompletedDate.split('T')[0] !== dateKey;
        set({ dailyCompletedIndices: newIndices, lastCompletedDate: now, streak: isNewDay ? state.streak + 1 : state.streak, resilienceScore: Math.min(100, state.resilienceScore + 5), history: newHistory, lastUpdated: Date.now() });
      },
      updateResilience: (updates) => {
        if (!get()._hasHydrated) return;
        set((state) => {
          if (updates.dailyCompletedIndices?.length === 0 && state.dailyCompletedIndices.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            if (state.lastCompletedDate?.split('T')[0] === today) {
              const { dailyCompletedIndices, ...safe } = updates;
              return { ...state, ...safe, lastUpdated: Date.now() };
            }
          }
          let newHistory = { ...state.history };
          if (updates.dailyCompletedIndices && updates.lastCompletedDate) {
            const dateKey = new Date(updates.lastCompletedDate).toISOString().split('T')[0];
            newHistory[dateKey] = { date: dateKey, completedIndices: updates.dailyCompletedIndices };
          }
          return { ...state, ...updates, history: newHistory, lastUpdated: Date.now() };
        });
      },
      logReflection: (dateIso, energy, note) => set((state) => {
        const dateKey = dateIso.split('T')[0];
        const newHistory = { ...state.history };
        newHistory[dateKey] = { ...newHistory[dateKey] || { date: dateKey, completedIndices: [] }, energy, note };
        return { history: newHistory, lastUpdated: Date.now() };
      }),
      setDailyIntention: (dateIso, intention) => set((state) => {
        const dateKey = dateIso.split('T')[0];
        const newHistory = { ...state.history };
        newHistory[dateKey] = { ...newHistory[dateKey] || { date: dateKey, completedIndices: [] }, intention };
        return { history: newHistory, lastUpdated: Date.now() };
      }),

      toggleFreeze: (active) => set({ isFrozen: active, freezeExpiry: active ? Date.now() + 86400000 : null, resilienceStatus: active ? 'FROZEN' : 'ACTIVE', lastUpdated: Date.now() }),
      saveUndoState: () => {
        const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
        set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
      },
      restoreUndoState: () => { const { undoState } = get(); if (undoState) set({ ...undoState, undoState: null, lastUpdated: Date.now() }); },
      setView: (view) => set({ currentView: view }),
      resetProgress: () => set({ identity: '', microHabits: [], habitRepository: { high: [], medium: [], low: [] }, currentHabitIndex: 0, energyTime: '', resilienceScore: 50, resilienceStatus: 'ACTIVE', streak: 0, shields: 0, totalCompletions: 0, lastCompletedDate: null, missedYesterday: false, dailyCompletedIndices: [], history: {}, weeklyInsights: [], currentView: 'onboarding', undoState: null, goal: { type: 'weekly', target: 3 }, dismissedTooltips: [], currentEnergyLevel: null, lastUpdated: Date.now() }),
      importData: (jsonString) => { try { const data = JSON.parse(jsonString); if (data?.resilienceScore !== undefined) { set((state) => ({ ...state, ...data, lastUpdated: Date.now() })); return true; } return false; } catch { return false; } },
      generateWeeklyReview: () => set(state => ({ weeklyInsights: [...state.weeklyInsights, { id: Date.now().toString(), startDate: new Date(Date.now() - 604800000).toISOString(), endDate: new Date().toISOString(), story: ['Week complete!'], pattern: 'Check', suggestion: 'Keep going.', viewed: false }] })),
      markReviewViewed: (id) => set(state => ({ weeklyInsights: state.weeklyInsights.map(i => i.id === id ? { ...i, viewed: true } : i) })),
      handleVoiceLog: (text, type) => { const state = get(); if (type === 'intention') state.setDailyIntention(new Date().toISOString(), text); else if (type === 'habit') state.addMicroHabit(text); },
      initializeAuth: () => {},
      syncToSupabase: async () => {},
      loadFromSupabase: async () => {}
    }),
    {
      name: 'bounce_state',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({ theme: state.theme, user: state.user, identity: state.identity, soundEnabled: state.soundEnabled, microHabits: state.microHabits, habitRepository: state.habitRepository, history: state.history, resilienceScore: state.resilienceScore, streak: state.streak, lastUpdated: state.lastUpdated, dailyCompletedIndices: state.dailyCompletedIndices, lastCompletedDate: state.lastCompletedDate, currentView: state.currentView, weeklyInsights: state.weeklyInsights }),
      onRehydrateStorage: () => (state) => { if (state) state.setHasHydrated(true); },
    }
  )
);
