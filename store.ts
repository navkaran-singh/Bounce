
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

      // Recovery Mode (Resilience Engine 2.0)
      recoveryMode: false,
      consecutiveMisses: 0,
      lastMissedDate: null,

      logout: async () => {
        await auth.signOut();
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
          lastSync: 0,
          dailyCompletedIndices: [],
          lastCompletedDate: null,
          totalCompletions: 0,
          weeklyInsights: [],
          undoState: null,
          goal: { type: 'weekly', target: 3 },
        });
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

        // Capture current state for undo BEFORE making changes
        const undoSnapshot = {
          resilienceScore: state.resilienceScore,
          resilienceStatus: state.resilienceStatus,
          streak: state.streak,
          shields: state.shields,
          totalCompletions: state.totalCompletions,
          lastCompletedDate: state.lastCompletedDate,
          missedYesterday: state.missedYesterday,
          dailyCompletedIndices: [...state.dailyCompletedIndices],
          history: JSON.parse(JSON.stringify(state.history)) // Deep copy
        };

        const newIndices = [...state.dailyCompletedIndices, habitIndex];
        const now = new Date().toISOString();
        const dateKey = now.split('T')[0];
        const newHistory = { ...state.history };
        newHistory[dateKey] = { ...newHistory[dateKey], date: dateKey, completedIndices: newIndices };
        const isNewDay = !state.lastCompletedDate || state.lastCompletedDate.split('T')[0] !== dateKey;

        // Calculate new streak and check for shield earning
        const newStreak = isNewDay ? state.streak + 1 : state.streak;
        const earnedShield = isNewDay && newStreak > 0 && newStreak % 7 === 0;

        // Determine new status - completing a habit exits recovery/cracked state
        let newStatus: 'ACTIVE' | 'BOUNCED' = 'ACTIVE';
        let bonusPoints = 5;
        if (state.resilienceStatus === 'CRACKED' || state.resilienceStatus === 'RECOVERING') {
          newStatus = 'BOUNCED';
          bonusPoints = 15; // Bonus for bouncing back
        }

        // Single set call with both undoState and new values
        set({
          undoState: undoSnapshot,
          dailyCompletedIndices: newIndices,
          lastCompletedDate: now,
          streak: newStreak,
          shields: earnedShield ? (state.shields || 0) + 1 : state.shields,
          resilienceScore: Math.min(100, state.resilienceScore + bonusPoints),
          resilienceStatus: newStatus,
          totalCompletions: (state.totalCompletions || 0) + 1,
          history: newHistory,
          recoveryMode: false, // Clear recovery mode on completion
          missedYesterday: false,
          consecutiveMisses: 0,
          lastUpdated: Date.now()
        });

        console.log("[HABIT] Completed habit", habitIndex, "- undoState saved with streak:", undoSnapshot.streak);
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

      // Recovery Mode Actions (Resilience Engine 2.0)
      // Recovery Mode Actions (Resilience Engine 2.0)
      checkMissedDay: () => {
        const state = get();
        // If frozen, already recovering, or not hydrated, skip
        if (!state._hasHydrated || state.isFrozen) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 🛑 FIX: If we already flagged today as a missed day, don't do it again.
        // This stops the modal from reopening after reload if dismissed.
        if (state.lastMissedDate === today) return;

        const last = state.lastCompletedDate ? new Date(state.lastCompletedDate) : null;
        if (!last) return; // New user, no history

        const oneDay = 24 * 60 * 60 * 1000;
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        const diffDays = Math.floor((todayDate.getTime() - lastDay.getTime()) / oneDay);

        // If gap is greater than 1 day (meaning they missed yesterday)
        if (diffDays > 1) {
          const actualMisses = diffDays - 1;

          console.log(`[RECOVERY] Missed days detected: ${actualMisses}`);

          set({
            recoveryMode: true,
            consecutiveMisses: state.consecutiveMisses + 1,
            lastMissedDate: today, // Mark today as "handled"
            missedYesterday: true,
            resilienceStatus: 'RECOVERING',
            // Don't punish score too hard, just nudge it
            resilienceScore: Math.max(0, state.resilienceScore - (actualMisses > state.consecutiveMisses ? 5 : 0)),
            lastUpdated: Date.now()
          });
        }
      },

      // 🧹 NEW ACTION: Run this on app startup to clean up yesterday's state
      checkNewDay: () => {
        const state = get();
        if (!state._hasHydrated) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 1. Check if 'dailyCompletedIndices' belongs to a previous day
        // We look at 'lastCompletedDate'. If it's not today, the daily indices are stale.
        const lastCompleted = state.lastCompletedDate ? state.lastCompletedDate.split('T')[0] : null;

        const hasStaleHabits = state.dailyCompletedIndices.length > 0 && lastCompleted !== today;
        const isStuckBounced = state.resilienceStatus === 'BOUNCED' && lastCompleted !== today;

        if (hasStaleHabits || isStuckBounced) {
          console.log("[NEW DAY] Cleaning up stale state...");

          set({
            // Clear habits if they are from yesterday
            dailyCompletedIndices: hasStaleHabits ? [] : state.dailyCompletedIndices,

            // Reset 'BOUNCED' status back to 'ACTIVE' (Blue) for the new day
            // But KEEP 'RECOVERING' or 'CRACKED' because those need action!
            resilienceStatus: isStuckBounced ? 'ACTIVE' : state.resilienceStatus,

            lastUpdated: Date.now()
          });
        }
      },

      activateRecoveryMode: () => {
        set({
          recoveryMode: true,
          resilienceStatus: 'RECOVERING',
          lastUpdated: Date.now()
        });
      },

      dismissRecoveryMode: () => {
        set({
          recoveryMode: false,
          // resilienceStatus: 'ACTIVE',
          lastUpdated: Date.now()
        });
      },

      applyRecoveryOption: (option) => {
        const state = get();

        switch (option) {
          case 'one-minute-reset':
            // Set energy to low, filter for easiest habits
            const lowHabits = state.habitRepository?.low?.length > 0
              ? state.habitRepository.low
              : state.microHabits;
            set({
              recoveryMode: false,
              currentEnergyLevel: 'low',
              microHabits: lowHabits,
              currentHabitIndex: 0,
              resilienceStatus: 'ACTIVE',
              lastUpdated: Date.now()
            });
            console.log("[RECOVERY] One-minute reset applied - switched to low energy habits");
            break;

          case 'use-shield':
            if ((state.shields || 0) > 0) {
              set({
                recoveryMode: false,
                shields: state.shields - 1,
                streak: state.streak, // Preserve streak
                missedYesterday: false,
                consecutiveMisses: 0,
                resilienceStatus: 'ACTIVE',
                resilienceScore: Math.min(100, state.resilienceScore + 10), // Restore some score
                lastUpdated: Date.now()
              });
              console.log("[RECOVERY] Shield used - streak preserved");
            }
            break;

          case 'gentle-restart':
            set({
              recoveryMode: false,
              streak: 0,
              consecutiveMisses: 0,
              missedYesterday: false,
              resilienceStatus: 'BOUNCED',
              resilienceScore: 50, // Reset to baseline
              lastUpdated: Date.now()
            });
            console.log("[RECOVERY] Gentle restart - streak reset, badges preserved");
            break;
        }

        // Sync to Firebase
        get().syncToFirebase();
      },

      saveUndoState: () => {
        const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
        set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
      },
      restoreUndoState: () => {
        const state = get();
        const { undoState } = state;
        if (!undoState) {
          console.log("[UNDO] No undo state available");
          return;
        }

        console.log("[UNDO] Restoring state:", undoState);

        // Simply restore the previous state - the undo state already has the correct values
        // including the streak from before the habit was completed
        const today = new Date().toISOString().split('T')[0];
        const newHistory = { ...(undoState.history || state.history) };

        // Update today's history entry with the restored completed indices
        if (newHistory[today]) {
          newHistory[today] = {
            ...newHistory[today],
            completedIndices: undoState.dailyCompletedIndices ?? []
          };
        }

        set({
          resilienceScore: undoState.resilienceScore ?? state.resilienceScore,
          resilienceStatus: undoState.resilienceStatus ?? state.resilienceStatus,
          streak: undoState.streak ?? state.streak,
          shields: undoState.shields ?? state.shields,
          totalCompletions: undoState.totalCompletions ?? state.totalCompletions,
          lastCompletedDate: undoState.lastCompletedDate ?? null,
          missedYesterday: undoState.missedYesterday ?? false,
          dailyCompletedIndices: undoState.dailyCompletedIndices ?? [],
          history: newHistory,
          undoState: null,
          lastUpdated: Date.now()
        });

        console.log("[UNDO] State restored, new streak:", undoState.streak);

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
            resilienceStatus: profile.resilienceStatus ?? 'ACTIVE',
            streak: profile.streak ?? 0,
            shields: profile.shields ?? 0,
            totalCompletions: profile.totalCompletions ?? 0,
            isPremium: profile.isPremium ?? false,
            // Recovery Mode
            recoveryMode: profile.recoveryMode ?? false,
            consecutiveMisses: profile.consecutiveMisses ?? 0,
            lastMissedDate: profile.lastMissedDate ?? null,
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

          console.log("[SYNC] Cloud data downloaded successfully, history entries:", Object.keys(history).length);
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
            resilienceStatus: state.resilienceStatus,
            streak: state.streak,
            shields: state.shields,
            lastCompletedDate: state.lastCompletedDate,
            totalCompletions: state.totalCompletions,
            isPremium: state.isPremium,
            // Recovery Mode
            recoveryMode: state.recoveryMode,
            consecutiveMisses: state.consecutiveMisses,
            lastMissedDate: state.lastMissedDate,
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

          // Sync daily logs (anchors, notes, completions)
          for (const dateKey in state.history) {
            const logRef = doc(db, 'users', state.user.uid, 'logs', dateKey);
            batch.set(logRef, state.history[dateKey], { merge: true });
          }

          console.log("[SYNC] Syncing", Object.keys(state.history).length, "daily logs");

          await batch.commit();
          set({ lastSync: Date.now() });
          console.log("[SYNC] Uploaded to Firebase, lastUpdated:", state.lastUpdated);
        } catch (error) {
          console.error("Firebase Sync Error:", error);
        }
      },

      // Used for app restart - compares timestamps and syncs appropriately
      loadFromFirebase: async () => {
        const state = get();
        if (!state.user) return;

        try {
          console.log("[LOAD] Checking cloud vs local timestamps...");
          const userRef = doc(db, 'users', state.user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const cloudData = userSnap.data();
            const cloudLastUpdated = cloudData.lastUpdated || 0;
            const localLastUpdated = state.lastUpdated || 0;

            console.log("[LOAD] Cloud lastUpdated:", cloudLastUpdated, "Local lastUpdated:", localLastUpdated);

            if (cloudLastUpdated > localLastUpdated) {
              // Cloud is newer - download from cloud
              console.log("[LOAD] Cloud is newer - downloading...");
              await get().downloadFromFirebase(cloudData);
            } else if (localLastUpdated > cloudLastUpdated) {
              // Local is newer - upload to cloud
              console.log("[LOAD] Local is newer - uploading...");
              await get().syncToFirebase(true);
            } else {
              console.log("[LOAD] Already in sync");
            }
          } else {
            // No cloud data - upload local
            console.log("[LOAD] No cloud data - uploading local...");
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
        resilienceStatus: state.resilienceStatus,
        streak: state.streak,
        shields: state.shields,
        lastUpdated: state.lastUpdated,
        lastSync: state.lastSync,
        dailyCompletedIndices: state.dailyCompletedIndices,
        lastCompletedDate: state.lastCompletedDate,
        currentView: state.currentView,
        weeklyInsights: state.weeklyInsights,
        goal: state.goal,
        totalCompletions: state.totalCompletions,
        isPremium: state.isPremium,
        // Recovery Mode fields
        recoveryMode: state.recoveryMode,
        consecutiveMisses: state.consecutiveMisses,
        lastMissedDate: state.lastMissedDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migration: Calculate totalCompletions from history if it's 0 but history exists
          if (state.totalCompletions === 0 && state.history && Object.keys(state.history).length > 0) {
            let calculatedTotal = 0;
            for (const dateKey in state.history) {
              const log = state.history[dateKey];
              if (log.completedIndices && log.completedIndices.length > 0) {
                calculatedTotal += log.completedIndices.length;
              }
            }
            if (calculatedTotal > 0) {
              console.log("[MIGRATION] Calculated totalCompletions from history:", calculatedTotal);
              useStore.setState({ totalCompletions: calculatedTotal, lastUpdated: Date.now() });
            }
          }

          state.setHasHydrated(true);
          // After rehydration, initialize auth listener
          state.initializeAuth();
          // If user is already logged in (from persisted state), check for cloud updates
          if (state.user) {
            console.log("[REHYDRATE] User logged in, checking cloud sync...");
            state.loadFromFirebase();
          }

          // Check for missed days after hydration (triggers recovery mode if needed)
          // 🛑 UPDATE THIS TIMEOUT BLOCK
          setTimeout(() => {
            const store = useStore.getState();

            // 1. First, clean up yesterday's mess (Fixes Orb Color & Ghost Habits)
            store.checkNewDay();

            // 2. Then, check if we missed yesterday entirely (Fixes Recovery Mode)
            store.checkMissedDay();

          }, 1000);
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).useStore = useStore;
}

// Auto-sync listener
useStore.subscribe(
  (state, prevState) => {
    if (state._hasHydrated && state.lastUpdated > prevState.lastUpdated) {
      // Debounce or throttle this call in a real app to avoid excessive writes
      useStore.getState().syncToFirebase();
    }
  }
);
