
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, DailyLog, AppUser, WeeklyInsight } from './types';
import { Preferences } from '@capacitor/preferences';
import { auth, db, doc, getDoc, serverTimestamp, writeBatch, onAuthStateChanged, User, collection, getDocs } from './services/firebase';

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

// Helper to convert Firebase User to AppUser
const toAppUser = (firebaseUser: User | null): AppUser | null => {
  if (!firebaseUser) return null;
  return { uid: firebaseUser.uid, email: firebaseUser.email };
};

interface ExtendedUserState extends UserState {
  lastUpdated: number;
  lastSync: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  completeHabit: (habitIndex: number) => void;
  syncToFirebase: (forceSync?: boolean) => Promise<void>;
  loadFromFirebase: () => Promise<void>;
  handleFirstSync: () => Promise<void>;
  downloadFromFirebase: (cloudData: any) => Promise<void>;
  ensureUserDocAndLoad: () => Promise<void>;
  initializeAuth: () => () => void;
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
      setGoal: (target) => {
        set({ goal: { type: 'weekly', target }, lastUpdated: Date.now() });
        // Sync to Firebase immediately
        get().syncToFirebase();
      },
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
      completeDailyBounce: () => { },

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
      restoreUndoState: () => {
        const state = get();
        const { undoState } = state;
        if (!undoState) return;
        
        // Check if we're undoing the only habit of the day (streak should decrease)
        const today = new Date().toISOString().split('T')[0];
        const wasFirstHabitOfDay = state.lastCompletedDate?.split('T')[0] === today && 
                                   undoState.dailyCompletedIndices?.length === 0;
        
        // If undoing the only habit of today, decrease streak
        const newStreak = wasFirstHabitOfDay ? Math.max(0, (undoState.streak ?? state.streak) - 1) : (undoState.streak ?? state.streak);
        
        // Update history to remove today's completions if undoing all
        const newHistory = { ...undoState.history };
        if (wasFirstHabitOfDay && newHistory[today]) {
          newHistory[today] = { ...newHistory[today], completedIndices: [] };
        }
        
        set({
          resilienceScore: undoState.resilienceScore ?? state.resilienceScore,
          resilienceStatus: undoState.resilienceStatus ?? state.resilienceStatus,
          streak: newStreak,
          shields: undoState.shields ?? state.shields,
          totalCompletions: undoState.totalCompletions ?? state.totalCompletions,
          lastCompletedDate: undoState.lastCompletedDate ?? null,
          missedYesterday: undoState.missedYesterday ?? false,
          dailyCompletedIndices: undoState.dailyCompletedIndices ?? [],
          history: newHistory,
          undoState: null,
          lastUpdated: Date.now()
        });
        
        // Sync to Firebase
        get().syncToFirebase();
      },
      setView: (view) => set({ currentView: view }),
      resetProgress: () => set({ identity: '', microHabits: [], habitRepository: { high: [], medium: [], low: [] }, currentHabitIndex: 0, energyTime: '', resilienceScore: 50, resilienceStatus: 'ACTIVE', streak: 0, shields: 0, totalCompletions: 0, lastCompletedDate: null, missedYesterday: false, dailyCompletedIndices: [], history: {}, weeklyInsights: [], currentView: 'onboarding', undoState: null, goal: { type: 'weekly', target: 3 }, dismissedTooltips: [], currentEnergyLevel: null, lastUpdated: Date.now() }),
      importData: (jsonString) => { try { const data = JSON.parse(jsonString); if (data?.resilienceScore !== undefined) { set((state) => ({ ...state, ...data, lastUpdated: Date.now() })); return true; } return false; } catch { return false; } },
      generateWeeklyReview: () => set(state => ({ weeklyInsights: [...state.weeklyInsights, { id: Date.now().toString(), startDate: new Date(Date.now() - 604800000).toISOString(), endDate: new Date().toISOString(), story: ['Week complete!'], pattern: 'Check', suggestion: 'Keep going.', viewed: false }] })),
      markReviewViewed: (id) => set(state => ({ weeklyInsights: state.weeklyInsights.map(i => i.id === id ? { ...i, viewed: true } : i) })),
      handleVoiceLog: (text, type) => { const state = get(); if (type === 'intention') state.setDailyIntention(new Date().toISOString(), text); else if (type === 'habit') state.addMicroHabit(text); },

      // Auth listener - called on sign in/out
      initializeAuth: () => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
          const state = get();
          
          if (firebaseUser) {
            // User signed in
            const isNewLogin = state.user?.uid !== firebaseUser.uid;
            if (isNewLogin) {
              console.log("[AUTH] User signed in:", firebaseUser.email);
              set({ user: toAppUser(firebaseUser) });
              
              // Determine if this is Sign Up (new account) or Log In (existing account)
              await get().handleFirstSync();
            }
          } else {
            // User signed out
            console.log("[AUTH] User signed out");
            set({ user: null });
          }
        });
      },

      // Handle first sync after sign in - determines Sign Up vs Log In
      handleFirstSync: async () => {
        const state = get();
        if (!state.user) return;

        try {
          console.log("[SYNC] Checking if new or existing account...");
          const userRef = doc(db, 'users', state.user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // SIGN UP: No cloud data exists - this is a NEW account
            // Upload local data to cloud (preserve guest progress)
            console.log("[SYNC] NEW ACCOUNT - uploading local data to cloud");
            await get().syncToFirebase(true);
          } else {
            // LOG IN: Cloud data exists - this is an EXISTING account
            // Check if cloud has real data (identity set)
            const cloudData = userSnap.data();
            const cloudHasRealData = cloudData.identity && cloudData.identity.trim() !== '';
            
            if (cloudHasRealData) {
              // EXISTING account with data - download cloud data (overwrite local)
              console.log("[SYNC] EXISTING ACCOUNT - downloading cloud data");
              await get().downloadFromFirebase(cloudData);
            } else {
              // Account exists but empty - upload local data
              console.log("[SYNC] EMPTY ACCOUNT - uploading local data");
              await get().syncToFirebase(true);
            }
          }
          
          set({ lastSync: Date.now() });
        } catch (error) {
          console.error("[SYNC] First sync error:", error);
        }
      },

      // Download cloud data to local (for existing accounts)
      downloadFromFirebase: async (cloudData: any) => {
        const state = get();
        if (!state.user) return;

        try {
          const { settings, ...profile } = cloudData;
          
          // Load logs/history
          const logsCollectionRef = collection(db, 'users', state.user.uid, 'logs');
          const logsSnapshot = await getDocs(logsCollectionRef);
          const history: Record<string, DailyLog> = {};
          logsSnapshot.forEach(logDoc => {
            history[logDoc.id] = logDoc.data() as DailyLog;
          });

          // Get today's completed indices
          const today = new Date().toISOString().split('T')[0];
          const todayLog = history[today];
          const todayCompletedIndices = todayLog?.completedIndices || [];

          // Use cloud's lastUpdated timestamp to keep sync state consistent
          const cloudLastUpdated = profile.lastUpdated || Date.now();

          // Apply cloud data to local state
          set({
            identity: profile.identity || '',
            resilienceScore: profile.resilienceScore ?? 50,
            streak: profile.streak ?? 0,
            shields: profile.shields ?? 0,
            totalCompletions: profile.totalCompletions ?? 0,
            dailyCompletedIndices: todayCompletedIndices,
            lastCompletedDate: profile.lastCompletedDate || null,
            theme: settings?.theme || state.theme,
            soundEnabled: settings?.soundEnabled ?? state.soundEnabled,
            goal: settings?.goal || state.goal,
            energyTime: settings?.energyTime || '',
            habitRepository: settings?.habitRepository || { high: [], medium: [], low: [] },
            microHabits: settings?.habitRepository?.high || [],
            history,
            currentView: profile.identity ? 'dashboard' : 'onboarding',
            lastSync: Date.now(),
            lastUpdated: cloudLastUpdated, // Preserve cloud timestamp
          });
          
          console.log("[SYNC] Cloud data downloaded successfully, lastUpdated:", cloudLastUpdated);
        } catch (error) {
          console.error("[SYNC] Download error:", error);
        }
      },

      // Legacy alias
      ensureUserDocAndLoad: async () => {
        await get().handleFirstSync();
      },

      syncToFirebase: async (forceSync = false) => {
        const state = get();
        if (!state.user || !state._hasHydrated) return;

        // Skip if no local changes (unless forced)
        if (!forceSync && state.lastUpdated <= state.lastSync) return;

        try {
          const userRef = doc(db, 'users', state.user.uid);
          const batch = writeBatch(db);

          const userProfile = {
            identity: state.identity,
            resilienceScore: state.resilienceScore,
            streak: state.streak,
            shields: state.shields,
            lastCompletedDate: state.lastCompletedDate,
            totalCompletions: state.totalCompletions,
            settings: {
              theme: state.theme,
              soundEnabled: state.soundEnabled,
              goal: state.goal,
              energyTime: state.energyTime,
              habitRepository: state.habitRepository,
            },
            lastUpdated: state.lastUpdated, // Store numeric timestamp for cross-device sync
            updatedAt: serverTimestamp(),
          };
          batch.set(userRef, userProfile, { merge: true });

          for (const dateKey in state.history) {
            const logRef = doc(db, 'users', state.user.uid, 'logs', dateKey);
            batch.set(logRef, state.history[dateKey], { merge: true });
          }

          await batch.commit();
          set({ lastSync: Date.now() });
          console.log("[SYNC] Uploaded to Firebase, lastUpdated:", state.lastUpdated);
        } catch (error) {
          console.error("Firebase Sync Error:", error);
        }
      },

      // Used for app restart - compares timestamps and syncs appropriately
      // ONLY runs for logged-in users on page reload, NOT for guest→cloud transitions
      loadFromFirebase: async () => {
        const state = get();
        if (!state.user) {
          console.log("[LOAD] No user, skipping cloud check");
          return;
        }

        try {
          console.log("[LOAD] Checking cloud vs local timestamps for user:", state.user.uid);
          const userRef = doc(db, 'users', state.user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const cloudData = userSnap.data();
            const cloudLastUpdated = cloudData.lastUpdated || 0;
            const localLastUpdated = state.lastUpdated || 0;

            console.log("[LOAD] Cloud lastUpdated:", cloudLastUpdated);
            console.log("[LOAD] Local lastUpdated:", localLastUpdated);
            console.log("[LOAD] Difference (cloud - local):", cloudLastUpdated - localLastUpdated);

            if (cloudLastUpdated > localLastUpdated) {
              // Cloud is newer - download from cloud
              console.log("[LOAD] Cloud is NEWER by", cloudLastUpdated - localLastUpdated, "ms - downloading...");
              await get().downloadFromFirebase(cloudData);
            } else if (localLastUpdated > cloudLastUpdated) {
              // Local is newer - upload to cloud
              console.log("[LOAD] Local is NEWER by", localLastUpdated - cloudLastUpdated, "ms - uploading...");
              await get().syncToFirebase(true);
            } else {
              console.log("[LOAD] Timestamps are EQUAL - already in sync");
            }
          } else {
            // No cloud data - upload local
            console.log("[LOAD] No cloud document exists - uploading local...");
            await get().syncToFirebase(true);
          }
        } catch (error) {
          console.error("[LOAD] Error checking sync:", error);
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
        weeklyInsights: state.weeklyInsights,
        goal: state.goal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // After rehydration, initialize auth listener
          state.initializeAuth();
          // If user is already logged in (from persisted state), check for cloud updates
          // Use setTimeout to ensure this runs after auth state is confirmed
          if (state.user) {
            setTimeout(() => {
              const currentState = useStore.getState();
              if (currentState.user) {
                console.log("[REHYDRATE] User logged in, checking cloud sync...");
                console.log("[REHYDRATE] Local lastUpdated before check:", currentState.lastUpdated);
                currentState.loadFromFirebase();
              }
            }, 500);
          }
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
