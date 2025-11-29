
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, DailyLog, WeeklyInsight } from './types';
import { Preferences } from '@capacitor/preferences';
import { auth, db, doc, setDoc, getDoc, serverTimestamp, writeBatch, onAuthStateChanged, User } from './services/firebase';

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
  lastSync: number;
  _hasHydrated: boolean;
  user: User | null;
  setHasHydrated: (state: boolean) => void;
  completeHabit: (habitIndex: number) => void;
  syncToFirebase: (isNewUser?: boolean) => Promise<void>;
  loadFromFirebase: () => Promise<void>;
  initializeAuth: () => () => void; // Returns unsubscribe function
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
      lastSync: 0,
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
        await auth.signOut();
        set({ user: null, identity: '', microHabits: [], habitRepository: { high: [], medium: [], low: [] }, history: {}, streak: 0, resilienceScore: 50, currentView: 'onboarding', lastUpdated: 0, lastSync: 0 });
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
      
      initializeAuth: () => {
        return onAuthStateChanged(auth, (user) => {
          const state = get();
          if (user) {
            if (state.user?.uid !== user.uid) {
              set({ user });
              get().loadFromFirebase(); 
            }
          } else {
            set({ user: null });
          }
        });
      },

      syncToFirebase: async (isNewUser = false) => {
        const state = get();
        if (!state.user || !state._hasHydrated) return;

        // If it's a new user, we don't sync to firebase, we load from it.
        // The exception is when there's no data on firebase yet.
        if (isNewUser) {
          await state.loadFromFirebase();
          return;
        }

        if (state.lastUpdated <= state.lastSync && !isNewUser) return; // No local changes to sync

        try {
          const userRef = doc(db, 'users', state.user.uid);
          const batch = writeBatch(db);

          const userProfile = {
            identity: state.identity,
            resilienceScore: state.resilienceScore,
            streak: state.streak,
            shields: state.shields,
            settings: {
              theme: state.theme,
              soundEnabled: state.soundEnabled,
              goal: state.goal,
              energyTime: state.energyTime,
              habitRepository: state.habitRepository,
            },
            updatedAt: serverTimestamp(),
          };
          batch.set(userRef, userProfile, { merge: true });

          for (const dateKey in state.history) {
            const logRef = doc(db, 'users', state.user.uid, 'logs', dateKey);
            batch.set(logRef, state.history[dateKey], { merge: true });
          }

          await batch.commit();
          set({ lastSync: Date.now() });
        } catch (error) {
          console.error("Firebase Sync Error:", error);
          // Handle offline queuing implicitly via service worker or other PWA features
        }
      },

      loadFromFirebase: async () => {
        const state = get();
        if (!state.user) return;

        try {
          const userRef = doc(db, 'users', state.user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const remoteData = userSnap.data();
            const remoteTimestamp = remoteData.updatedAt?.toMillis() || 0;

            // On first sync for a new device, cloud wins.
            // Otherwise, local-first prevails.
            if (state.lastSync === 0 || remoteTimestamp > state.lastUpdated) {
              const { settings, ...profile } = remoteData;
              
              set({
                ...profile,
                ...(settings || {}),
                lastSync: Date.now(),
                lastUpdated: Date.now(), // to avoid immediate re-sync
              });

              // Now, get the logs
              // For simplicity, we're fetching all logs. In a real-world scenario, you might paginate this.
              const logsCollectionRef = collection(db, 'users', state.user.uid, 'logs');
              const logsSnapshot = await getDocs(logsCollectionRef);
              const newHistory = { ...state.history };
              logsSnapshot.forEach(logDoc => {
                newHistory[logDoc.id] = logDoc.data() as DailyLog;
              });
              set({ history: newHistory });

            } else {
              // Local is newer or equal, so push local to remote
              await state.syncToFirebase();
            }
          } else {
            // No remote data, so this is a first-time user on any device.
            // Push local data to remote.
            await state.syncToFirebase(true); // Special flag to indicate initial push
          }
        } catch (error) {
          console.error("Firebase Load Error:", error);
        }
      },
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
        lastSync: state.lastSync, 
        dailyCompletedIndices: state.dailyCompletedIndices, 
        lastCompletedDate: state.lastCompletedDate, 
        currentView: state.currentView, 
        weeklyInsights: state.weeklyInsights 
      }),
      onRehydrateStorage: () => (state) => { 
        if (state) {
          state.setHasHydrated(true);
          // After rehydration, initialize auth and perform initial sync
          state.initializeAuth();
        }
      },
    }
  )
);

// Auto-sync listener
useStore.subscribe(
  (state, prevState) => {
    if (state._hasHydrated && state.lastUpdated > prevState.lastUpdated) {
      // Debounce or throttle this call in a real app to avoid excessive writes
      useStore.getState().syncToFirebase();
    }
  }
);
