import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, ResilienceStatus, DailyLog, WeeklyInsight } from './types';
import { Preferences } from '@capacitor/preferences';
import { auth, db, onAuthStateChanged, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, writeBatch } from './services/firebase';

// Helper function to download cloud data
const downloadCloudData = async (
  cloudData: any, 
  userId: string, 
  set: any,
  get: any
) => {
  // Load logs from subcollection
  const logsSnapshot = await getDocs(collection(db, 'users', userId, 'logs'));
  const history: Record<string, DailyLog> = {};
  logsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    history[docSnap.id] = {
      date: data.date,
      completedIndices: data.completedIndices || [],
      energy: data.energy,
      note: data.note,
      intention: data.intention
    };
  });

  const state = get();
  
  // Apply cloud data to local state
  set({
    identity: cloudData.identity || '',
    resilienceScore: cloudData.resilienceScore ?? 50,
    streak: cloudData.streak ?? 0,
    shields: cloudData.shields ?? 0,
    isPremium: cloudData.isPremium ?? false,
    theme: cloudData.settings?.theme || state.theme,
    soundEnabled: cloudData.settings?.soundEnabled ?? state.soundEnabled,
    goal: cloudData.settings?.goal || state.goal,
    energyTime: cloudData.settings?.energyTime || '',
    habitRepository: cloudData.settings?.habitRepository || { high: [], medium: [], low: [] },
    microHabits: cloudData.settings?.microHabits || [],
    lastCompletedDate: cloudData.settings?.lastCompletedDate || null,
    dailyCompletedIndices: cloudData.settings?.dailyCompletedIndices || [],
    history: Object.keys(history).length > 0 ? history : {},
    currentView: cloudData.identity ? 'dashboard' : 'onboarding',
    lastUpdated: Date.now()
  });

  console.log("[LOAD] ✅ Cloud data downloaded successfully");
};

// Native Storage Adapter (Capacitor Preferences)
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(`[STORAGE] Reading ${name}`);
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(`[STORAGE] Saving ${name}`);
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(`[STORAGE] Removing ${name}`);
    await Preferences.remove({ key: name });
  },
};

interface ExtendedUserState extends UserState {
  lastUpdated: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  completeHabit: (habitIndex: number) => void;
  syncToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
}

export const useStore = create<ExtendedUserState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => {
        console.log(`[STORE] Hydration: ${state}`);
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

      logout: async () => {
        console.log("[ACTION] Logging out - wiping all local data");
        try {
          await auth.signOut();
        } catch (e) {
          console.error("[AUTH] Sign out error:", e);
        }
        // Wipe ALL user data
        set({
          user: null,
          identity: '',
          microHabits: [],
          habitRepository: { high: [], medium: [], low: [] },
          history: {},
          streak: 0,
          shields: 0,
          totalCompletions: 0,
          resilienceScore: 50,
          resilienceStatus: 'ACTIVE',
          currentView: 'onboarding',
          lastUpdated: 0,
          dailyCompletedIndices: [],
          lastCompletedDate: null,
          missedYesterday: false,
          weeklyInsights: [],
          energyTime: '',
          currentEnergyLevel: null,
          currentHabitIndex: 0,
          goal: { type: 'weekly', target: 3 },
          dismissedTooltips: [],
          undoState: null,
          isFrozen: false,
          freezeExpiry: null
        });
        // Remove persisted storage
        await Preferences.remove({ key: 'bounce_state' });
        console.log("[ACTION] ✅ Local data wiped");
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
        get().syncToFirebase();
      },
      setGoal: (target) => {
        set({ goal: { type: 'weekly', target }, lastUpdated: Date.now() });
        get().syncToFirebase();
      },

      dismissTooltip: (id) => set((state) => {
        if (state.dismissedTooltips.includes(id)) return state;
        return { dismissedTooltips: [...state.dismissedTooltips, id] };
      }),

      setMicroHabits: (microHabits) => {
        set({ microHabits, currentHabitIndex: 0, lastUpdated: Date.now() });
        get().syncToFirebase();
      },

      setHabitsWithLevels: (habitRepository) => {
        set({
          habitRepository,
          microHabits: habitRepository.high,
          currentEnergyLevel: 'high',
          currentHabitIndex: 0,
          lastUpdated: Date.now()
        });
        get().syncToFirebase();
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
      },

      cycleMicroHabit: () => set((state) => ({
        currentHabitIndex: (state.currentHabitIndex + 1) % state.microHabits.length
      })),

      setEnergyTime: (energyTime) => set({ energyTime, lastUpdated: Date.now() }),

      setEnergyLevel: (level) => {
        const state = get();
        let newHabits = [...state.microHabits];
        if (state.habitRepository?.[level]?.length > 0) {
          newHabits = state.habitRepository[level];
        } else {
          if (level === 'low') newHabits = state.microHabits.map(h => h.includes("Easy") ? h : `${h} (Tiny)`);
          else if (level === 'high') newHabits = state.microHabits.map(h => h.includes("Bonus") ? h : `${h} + Bonus`);
        }
        set({ currentEnergyLevel: level, microHabits: newHabits, currentHabitIndex: 0, lastUpdated: Date.now() });
      },

      completeDailyBounce: () => { },

      completeHabit: (habitIndex) => {
        const state = get();
        if (state.dailyCompletedIndices.includes(habitIndex)) return;
        console.log(`[STORE] Completing habit: ${habitIndex}`);
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
        // Background sync to Firebase
        get().syncToFirebase();
      },

      updateResilience: (updates) => {
        if (!get()._hasHydrated) {
          console.warn("[STORE] Blocked - not hydrated");
          return;
        }
        set((state) => {
          if (updates.dailyCompletedIndices?.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            const lastActive = state.lastCompletedDate?.split('T')[0] || '';
            if (state.dailyCompletedIndices.length > 0 && lastActive === today) {
              console.warn(`[STORE] Blocked wipe`);
              const { dailyCompletedIndices, ...safeUpdates } = updates;
              return { ...state, ...safeUpdates, lastUpdated: Date.now() };
            }
          }
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
      },

      logReflection: (dateIso, energy, note) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, energy, note };
          return { ...state, history: newHistory, lastUpdated: Date.now() };
        });
      },

      setDailyIntention: (dateIso, intention) => {
        set((state) => {
          const dateKey = dateIso.split('T')[0];
          const newHistory = { ...state.history };
          const existing = newHistory[dateKey] || { date: dateKey, completedIndices: [] };
          newHistory[dateKey] = { ...existing, intention };
          return { ...state, history: newHistory, lastUpdated: Date.now() };
        });
      },

      toggleFreeze: (active) => {
        const newStatus: ResilienceStatus = active ? 'FROZEN' : 'ACTIVE';
        set({
          isFrozen: active,
          freezeExpiry: active ? Date.now() + 24 * 60 * 60 * 1000 : null,
          resilienceStatus: newStatus,
          lastUpdated: Date.now()
        });
      },

      saveUndoState: () => {
        const { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } = get();
        set({ undoState: { resilienceScore, resilienceStatus, streak, shields, totalCompletions, lastCompletedDate, missedYesterday, dailyCompletedIndices, history } });
      },

      restoreUndoState: () => {
        const { undoState } = get();
        if (undoState) set({ ...undoState, undoState: null, lastUpdated: Date.now() });
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
        lastUpdated: Date.now()
      }),

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data?.resilienceScore !== undefined) {
            set((state) => ({ ...state, ...data, lastUpdated: Date.now() }));
            return true;
          }
          return false;
        } catch { return false; }
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
        if (type === 'intention') state.setDailyIntention(new Date().toISOString(), text);
        else if (type === 'habit') state.addMicroHabit(text);
      },

      // Firebase Auth Listener
      initializeAuth: () => {
        console.log("[AUTH] Initializing Firebase auth listener");
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("[AUTH] State changed:", firebaseUser?.email || "signed out");
          
          if (firebaseUser) {
            // Convert Firebase User to our AppUser type
            const appUser = { id: firebaseUser.uid, email: firebaseUser.email || undefined };
            set({ user: appUser });
            
            // Load data from Firebase (first login sync)
            await get().loadFromFirebase();
          } else {
            set({ user: null });
          }
        });
        return unsubscribe;
      },

      // Sync local state TO Firebase (background, non-blocking)
      syncToFirebase: async () => {
        const state = get();
        if (!state.user) {
          console.log("[SYNC] No user, skipping");
          return;
        }

        try {
          console.log("[SYNC] Pushing to Firebase...");
          const userId = state.user.id;

          // 1. Sync user profile
          await setDoc(doc(db, 'users', userId), {
            identity: state.identity,
            resilienceScore: state.resilienceScore,
            streak: state.streak,
            shields: state.shields,
            isPremium: state.isPremium,
            settings: {
              theme: state.theme,
              soundEnabled: state.soundEnabled,
              soundType: state.soundType,
              goal: state.goal,
              energyTime: state.energyTime,
              habitRepository: state.habitRepository,
              microHabits: state.microHabits,
              lastCompletedDate: state.lastCompletedDate,
              dailyCompletedIndices: state.dailyCompletedIndices,
            },
            updatedAt: serverTimestamp()
          }, { merge: true });

          // 2. Sync logs (batch write for efficiency)
          const batch = writeBatch(db);
          const logsRef = collection(db, 'users', userId, 'logs');
          
          Object.entries(state.history).forEach(([date, log]) => {
            const logDoc = doc(logsRef, date);
            batch.set(logDoc, {
              date: log.date,
              completedIndices: log.completedIndices || [],
              energy: log.energy || null,
              note: log.note || null,
              intention: log.intention || null
            });
          });
          
          await batch.commit();
          console.log("[SYNC] ✅ Firebase sync complete");
        } catch (e) {
          console.error("[SYNC] Firebase error:", e);
          // Don't throw - sync failures shouldn't break the app
        }
      },

      // Load data FROM Firebase (smart sync on login)
      loadFromFirebase: async () => {
        const state = get();
        if (!state.user) return;

        try {
          console.log("[LOAD] Checking Firebase for existing data...");
          const userId = state.user.id;
          const userDoc = await getDoc(doc(db, 'users', userId));

          // Helper: Check if local data is "real" (user completed onboarding)
          const localHasRealData = state.identity && state.identity.trim() !== '' && state.microHabits.length > 0;
          
          if (!userDoc.exists()) {
            // NO CLOUD DATA - this is a brand new account
            if (localHasRealData) {
              // Local has data, upload it
              console.log("[LOAD] 🔼 New cloud account, uploading local data...");
              await get().syncToFirebase();
            } else {
              console.log("[LOAD] New user with no data yet");
            }
            return;
          }

          // CLOUD DATA EXISTS - this is an existing account
          const cloudData = userDoc.data();
          const cloudHasRealData = cloudData.identity && cloudData.identity.trim() !== '';
          
          console.log("[LOAD] Cloud identity:", cloudData.identity);
          console.log("[LOAD] Local identity:", state.identity);
          console.log("[LOAD] Cloud has real data:", cloudHasRealData);
          console.log("[LOAD] Local has real data:", localHasRealData);

          // RULE: If cloud has data, ALWAYS download it (cloud is source of truth for existing accounts)
          // This handles: returning user, guest signing into existing account, etc.
          if (cloudHasRealData) {
            console.log("[LOAD] 🔽 Existing account detected. Downloading cloud data (cloud wins)...");
            await downloadCloudData(cloudData, userId, set, get);
            return;
          }

          // Cloud exists but is empty, local has data → upload
          if (!cloudHasRealData && localHasRealData) {
            console.log("[LOAD] 🔼 Cloud empty, uploading local data...");
            await get().syncToFirebase();
            return;
          }

          // Both empty - nothing to do
          console.log("[LOAD] Both empty, nothing to sync");
          
        } catch (e) {
          console.error("[LOAD] Firebase error:", e);
        }
      },

      // Legacy aliases (for compatibility)
      syncToSupabase: async () => get().syncToFirebase(),
      loadFromSupabase: async () => get().loadFromFirebase()
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
  } catch { }
};
