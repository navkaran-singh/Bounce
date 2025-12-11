
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserState, DailyLog, AppUser, WeeklyInsight, IdentityProfile } from './types';
import { Preferences } from '@capacitor/preferences';
import { auth, db, doc, getDoc, serverTimestamp, writeBatch, onAuthStateChanged, User, collection, getDocs } from './services/firebase';
import { calculateWeeklyStats, detectStageTransition } from './services/stageDetector';
import { generateEvolutionSuggestion } from './services/evolutionEngine';
import { generateWeeklyEvolutionPlan } from './services/ai';


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
  activatePremium: (expiryDate: number) => void;
}

export const useStore = create<ExtendedUserState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      currentView: 'onboarding',
      isPremium: false,
      premiumExpiryDate: null,
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
      dailyPlanMessage: null,
      goal: { type: 'weekly', target: 3 },
      dismissedTooltips: [],
      resilienceScore: 50,
      resilienceStatus: 'ACTIVE',
      streak: 0,
      shields: 1, // All users start with 1 free shield
      totalCompletions: 0,
      lastCompletedDate: null,
      lastDailyPlanDate: null,
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

      // Weekly Review (Sunday Ritual)
      weeklyReview: null,
      lastWeeklyReviewDate: null,

      // Identity Evolution Engine
      identityProfile: {
        type: null,
        stage: 'INITIATION',
        stageEnteredAt: null,
        weeksInStage: 0,
      },
      lastEvolutionSuggestion: null,

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
          lastDailyPlanDate: null,
          totalCompletions: 0,
          weeklyInsights: [],
          weeklyReview: null,
          lastWeeklyReviewDate: null,
          undoState: null,
          goal: { type: 'weekly', target: 3 },
          isPremium: false,
          premiumExpiryDate: null,
        });
        // Clear all storage
        await Preferences.remove({ key: 'bounce_state' });
        localStorage.clear();
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
      dismissDailyPlanMessage: () => set({ dailyPlanMessage: null }),
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
      setWeeklyReview: (update) => set((state) => ({
        weeklyReview: state.weeklyReview ? { ...state.weeklyReview, ...update } : null
      })),
      completeDailyBounce: () => { },

      completeHabit: (habitIndex) => {
        const state = get();
        if (state.dailyCompletedIndices.includes(habitIndex)) return;

        // 🔥 SNAPSHOT: Capture the actual habit text at completion time
        const habitName = state.microHabits[habitIndex];
        if (!habitName) {
          console.warn("[HABIT] Invalid habit index:", habitIndex);
          return;
        }

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

        // Get existing completed habit names for today (or initialize)
        const existingLog = newHistory[dateKey] || { date: dateKey, completedIndices: [], completedHabitNames: [] };
        const existingNames = existingLog.completedHabitNames || [];

        // Add the new habit name (avoid duplicates)
        const newHabitNames = existingNames.includes(habitName)
          ? existingNames
          : [...existingNames, habitName];

        // Update history with both indices and names
        newHistory[dateKey] = {
          ...existingLog,
          date: dateKey,
          completedIndices: newIndices,
          completedHabitNames: newHabitNames
        };

        console.log("[HABIT] Snapshotted habit:", habitName, "for date:", dateKey);

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
          shields: earnedShield ? Math.min(3, (state.shields || 0) + 1) : state.shields, // Cap at 3
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
      checkNewDay: async () => {
        const state = get();
        if (!state._hasHydrated) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        console.log("🌅 [CHECK NEW DAY] Starting new day check for:", today);

        // 1. Check if 'dailyCompletedIndices' belongs to a previous day
        // We look at 'lastCompletedDate'. If it's not today, the daily indices are stale.
        const lastCompleted = state.lastCompletedDate ? state.lastCompletedDate.split('T')[0] : null;
        console.log("🌅 [CHECK NEW DAY] Last completed date:", lastCompleted);

        const hasStaleHabits = state.dailyCompletedIndices.length > 0 && lastCompleted !== today;
        const isStuckBounced = state.resilienceStatus === 'BOUNCED' && lastCompleted !== today;

        if (hasStaleHabits || isStuckBounced) {
          console.log("🌅 [CHECK NEW DAY] Cleaning up stale state...");

          set({
            // Clear habits if they are from yesterday
            dailyCompletedIndices: hasStaleHabits ? [] : state.dailyCompletedIndices,

            // Reset 'BOUNCED' status back to 'ACTIVE' (Blue) for the new day
            // But KEEP 'RECOVERING' or 'CRACKED' because those need action!
            resilienceStatus: isStuckBounced ? 'ACTIVE' : state.resilienceStatus,

            lastUpdated: Date.now()
          });
        }

        // 2. SMART DAILY PLANNER (Premium Only)
        // Generate new habits based on yesterday's performance
        console.log("🌅 [CHECK NEW DAY] Premium status:", state.isPremium);
        console.log("🌅 [CHECK NEW DAY] Last completed:", lastCompleted, "Today:", today);
        console.log("🌅 [CHECK NEW DAY] Last daily plan date:", state.lastDailyPlanDate);

        if (state.isPremium && lastCompleted && lastCompleted !== today) {
          // 🛑 GUARD: Check if we already generated a plan today
          if (state.lastDailyPlanDate === today) {
            console.log("📊 [SMART PLANNER] ⏭️ Skipping - plan already generated today");
            return;
          }

          console.log("📊 [SMART PLANNER] ✅ Analyzing yesterday's performance...");

          // Get yesterday's date
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = yesterday.toISOString().split('T')[0];
          console.log("📊 [SMART PLANNER] Yesterday's date key:", yesterdayKey);

          // Retrieve yesterday's completed habits
          const yesterdayLog = state.history[yesterdayKey];

          // 🔥 SOURCE OF TRUTH: Use completedHabitNames (snapshot) instead of indices
          let completedHabits: string[] = [];

          if (yesterdayLog?.completedHabitNames && yesterdayLog.completedHabitNames.length > 0) {
            // NEW DATA: Use the snapshotted habit names
            completedHabits = yesterdayLog.completedHabitNames;
            console.log("📊 [ENERGY AUDIT] Using snapshotted habit names:", completedHabits);
          } else if (yesterdayLog?.completedIndices && yesterdayLog.completedIndices.length > 0) {
            // LEGACY FALLBACK: Map indices using current microHabits (best guess)
            const completedIndices = yesterdayLog.completedIndices;
            completedHabits = completedIndices.map(idx => state.microHabits[idx]).filter(Boolean);
            console.log("📊 [ENERGY AUDIT] ⚠️ Legacy data - mapping indices:", completedIndices, "→", completedHabits);
          } else {
            console.log("📊 [ENERGY AUDIT] No completions found for yesterday");
          }

          // ENERGY AUDIT: Weighted scoring system (out of 3 expected habits)
          const EXPECTED_HABITS = 3;
          let totalScore = 0;
          const energyBreakdown: { habit: string; level: string; points: number; completed: boolean }[] = [];

          // Score each completed habit
          for (const habitName of completedHabits) {
            // Check which energy level this habit belongs to
            if (state.habitRepository.high.includes(habitName)) {
              totalScore += 3;
              energyBreakdown.push({ habit: habitName, level: 'HIGH', points: 3, completed: true });
            } else if (state.habitRepository.medium.includes(habitName)) {
              totalScore += 2;
              energyBreakdown.push({ habit: habitName, level: 'MEDIUM', points: 2, completed: true });
            } else if (state.habitRepository.low.includes(habitName)) {
              totalScore += 1;
              energyBreakdown.push({ habit: habitName, level: 'LOW', points: 1, completed: true });
            } else {
              // Habit not found in any repository (possibly from old data)
              console.warn("📊 [ENERGY AUDIT] ⚠️ Habit not found in repository:", habitName);
            }
          }

          // Calculate average score (out of 3 possible habits)
          const averageScore = totalScore / EXPECTED_HABITS;

          console.log("📊 [ENERGY AUDIT] Energy breakdown:", energyBreakdown);
          console.log("📊 [ENERGY AUDIT] Total Score:", totalScore, "/ 9 possible");
          console.log("📊 [ENERGY AUDIT] Average Score:", averageScore.toFixed(2), "/ 3.0");
          console.log("📊 [ENERGY AUDIT] Completed:", completedHabits.length, "/", EXPECTED_HABITS, "habits");

          // 🔥 PERSIST DAILY SCORE: Write the calculated score to yesterday's history log
          // This makes it immutable and efficient for weekly reviews
          const historyUpdate = { ...state.history };
          if (historyUpdate[yesterdayKey]) {
            historyUpdate[yesterdayKey] = {
              ...historyUpdate[yesterdayKey],
              dailyScore: averageScore
            };
            console.log("📊 [ENERGY AUDIT] ✅ Persisted daily score:", averageScore.toFixed(2), "for", yesterdayKey);
          }

          // DETERMINE MODE based on weighted average
          let mode: 'GROWTH' | 'STEADY' | 'RECOVERY';

          if (averageScore >= 2.2) {
            // Mostly High/Medium energy (e.g., 2 High + 1 Med, or 3 Med, or 2 High + 1 Low)
            mode = 'GROWTH';
            console.log("📊 [ENERGY AUDIT] Calculated Mode: 🟢 GROWTH (Average >= 2.2 - Strong performance)");
          } else if (averageScore >= 1.5) {
            // Mixed performance or consistent Low (e.g., 1 High + 1 Med + 1 Low, or 3 Low + 1 Med)
            mode = 'STEADY';
            console.log("📊 [ENERGY AUDIT] Calculated Mode: 🟡 STEADY (Average >= 1.5 - Consistent performance)");
          } else {
            // Mostly missed or only Low energy (e.g., 0-1 completions, or only Low habits)
            mode = 'RECOVERY';
            console.log("📊 [ENERGY AUDIT] Calculated Mode: 🔴 RECOVERY (Average < 1.5 - Need support)");
          }

          // CALL AI TO GENERATE NEW HABITS (FULL SPECTRUM)
          try {
            console.log("📊 [SMART PLANNER] Calling AI service for full spectrum...");
            const { generateDailyAdaptation } = await import('./services/ai');
            const newRepository = await generateDailyAdaptation(
              state.identity,
              state.identityProfile?.type || 'SKILL',      // Identity type for context
              state.identityProfile?.stage || 'INITIATION', // Stage for difficulty scaling
              mode,
              state.habitRepository
            );

            // Validate the returned repository
            if (
              newRepository &&
              newRepository.high?.length === 3 &&
              newRepository.medium?.length === 3 &&
              newRepository.low?.length === 3
            ) {
              console.log("📊 [SMART PLANNER] ✅ New repository generated:", newRepository);
              console.log("📊 [SMART PLANNER] Old repository:", state.habitRepository);

              // AUTO-SWITCH ENERGY LEVEL based on mode
              let defaultEnergyLevel: 'high' | 'medium' | 'low';
              let defaultHabits: string[];
              let planMessage: string;

              // Use AI-generated toast message (personalized and encouraging)
              planMessage = newRepository.toastMessage;

              if (mode === 'GROWTH') {
                defaultEnergyLevel = 'high';
                defaultHabits = newRepository.high;
                console.log("📊 [SMART PLANNER] Setting HIGH energy as default (Growth mode)");
              } else if (mode === 'RECOVERY') {
                defaultEnergyLevel = 'low';
                defaultHabits = newRepository.low;
                console.log("📊 [SMART PLANNER] Setting LOW energy as default (Recovery mode)");
              } else {
                defaultEnergyLevel = 'medium';
                defaultHabits = newRepository.medium;
                console.log("📊 [SMART PLANNER] Setting MEDIUM energy as default (Steady mode)");
              }

              console.log("📊 [SMART PLANNER] AI Toast Message:", planMessage);

              set({
                habitRepository: { high: newRepository.high, medium: newRepository.medium, low: newRepository.low },
                microHabits: defaultHabits,
                currentEnergyLevel: defaultEnergyLevel,
                currentHabitIndex: 0,
                dailyPlanMessage: planMessage,
                lastDailyPlanDate: today, // 🔥 CRITICAL: Mark that we generated a plan today
                history: historyUpdate, // 🔥 PERSIST: Save the daily score to history
                lastUpdated: Date.now()
              });

              console.log("📊 [SMART PLANNER] ✅ Set lastDailyPlanDate to:", today);

              // CRITICAL: Force sync to Firebase
              console.log("☁️ [CHECK NEW DAY] Forcing Firebase sync...");
              await get().syncToFirebase(true);
              console.log("☁️ [CHECK NEW DAY] ✅ Forced sync complete.");
            } else {
              console.warn("📊 [SMART PLANNER] ⚠️ Invalid repository returned, keeping current");
            }
          } catch (error) {
            console.error("📊 [SMART PLANNER] ❌ Error generating habits:", error);
          }
        } else {
          if (!state.isPremium) {
            console.log("📊 [SMART PLANNER] ⏭️ Skipped (Not Premium) - using emotion messages");

            // FREE USER: Show pre-written emotion message based on yesterday's performance
            if (lastCompleted && lastCompleted !== today) {
              try {
                const { getEmotionMessage } = await import('./data/emotionMessages');

                // Calculate yesterday's completion percentage
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = yesterday.toISOString().split('T')[0];
                const yesterdayLog = state.history[yesterdayKey];

                const completedCount = yesterdayLog?.completedHabitNames?.length || 0;
                const expectedCount = 3; // We expect 3 habits per day
                const completionPercent = (completedCount / expectedCount) * 100;

                // Get yesterday's energy level if available
                const yesterdayEnergy = yesterdayLog?.energy || null;

                // Get identity stage for stage-aware messages
                const identityStage = state.identityProfile?.stage || null;

                const emotionMessage = getEmotionMessage(completionPercent, state.streak, state.missedYesterday, yesterdayEnergy, identityStage);

                console.log("💬 [EMOTION] Free user message:", emotionMessage);


                set({
                  dailyPlanMessage: emotionMessage,
                  lastDailyPlanDate: today,
                  lastUpdated: Date.now()
                });
              } catch (error) {
                console.error("💬 [EMOTION] Error loading emotion messages:", error);
              }
            }
          } else if (!lastCompleted) {
            console.log("📊 [SMART PLANNER] ⏭️ Skipped (No previous completion date)");
          } else if (lastCompleted === today) {
            console.log("📊 [SMART PLANNER] ⏭️ Skipped (Already ran today)");
          }
        }
      },

      activatePremium: (expiryDate: number) => {
        const state = get();
        console.log("💎 [STORE] Activating Premium via API Success...");

        // FIRST TIME BONUS: Give +1 shield on first premium upgrade
        const isFirstTimeUpgrade = !state.isPremium;
        const bonusShield = isFirstTimeUpgrade ? 1 : 0;

        if (isFirstTimeUpgrade) {
          console.log("🛡️ [STORE] First time upgrade! Granting +1 bonus shield");
        }

        set({
          isPremium: true,
          premiumExpiryDate: expiryDate,
          shields: Math.min(3, (state.shields || 0) + bonusShield), // Cap at 3
          dailyPlanMessage: isFirstTimeUpgrade
            ? "🎉 Welcome to Premium! +1 Shield granted. Your AI Brain is now active."
            : "🎉 Premium renewed! Your AI Brain continues.",
          lastUpdated: Date.now()
        });

        // Trigger the AI Brain immediately
        get().checkNewDay();

        // Force a sync (Now we upload TRUE to cloud, which matches the server)
        get().syncToFirebase(true);
      },

      // Identity Evolution Engine Actions
      setIdentityProfile: (profile) => {
        const currentProfile = get().identityProfile;
        set({
          identityProfile: { ...currentProfile, ...profile },
          lastUpdated: Date.now()
        });
        console.log("🧬 [IDENTITY] Profile updated:", { ...currentProfile, ...profile });
      },

      setLastEvolutionSuggestion: (suggestion) => {
        set({
          lastEvolutionSuggestion: suggestion,
          lastUpdated: Date.now()
        });
        console.log("🌱 [EVOLUTION] Suggestion updated:", suggestion);
      },

      applyEvolutionPlan: async () => {
        const state = get();
        const { identity, identityProfile, lastEvolutionSuggestion, habitRepository, isPremium } = state;

        // Safety checks
        if (!isPremium) {
          console.warn("🌱 [EVOLUTION] Premium required for auto-apply");
          return { success: false, narrative: "Premium feature" };
        }

        if (!identity || !identityProfile.type || !lastEvolutionSuggestion) {
          console.warn("🌱 [EVOLUTION] Missing required data for evolution");
          return { success: false, narrative: "Not enough data to evolve habits." };
        }

        console.log("🌱 [EVOLUTION] Applying evolution plan...");

        try {
          const result = await generateWeeklyEvolutionPlan(
            identity,
            identityProfile.type,
            identityProfile.stage,
            lastEvolutionSuggestion.type,
            habitRepository
          );

          // Update habit repository with evolved habits
          set({
            habitRepository: {
              high: result.high,
              medium: result.medium,
              low: result.low
            },
            lastUpdated: Date.now()
          });

          console.log("🌱 [EVOLUTION] ✅ Habits evolved:", result);
          return { success: true, narrative: result.narrative };
        } catch (error) {
          console.error("🌱 [EVOLUTION] ❌ Error applying evolution:", error);
          return { success: false, narrative: "Something went wrong. Your habits remain unchanged." };
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
      resetProgress: () => set({ identity: '', microHabits: [], habitRepository: { high: [], medium: [], low: [] }, currentHabitIndex: 0, energyTime: '', resilienceScore: 50, resilienceStatus: 'ACTIVE', streak: 0, shields: 0, totalCompletions: 0, lastCompletedDate: null, lastDailyPlanDate: null, missedYesterday: false, dailyCompletedIndices: [], history: {}, weeklyInsights: [], weeklyReview: null, lastWeeklyReviewDate: null, currentView: 'onboarding', undoState: null, goal: { type: 'weekly', target: 3 }, dismissedTooltips: [], currentEnergyLevel: null, lastUpdated: Date.now() }),
      importData: (jsonString) => { try { const data = JSON.parse(jsonString); if (data?.resilienceScore !== undefined) { set((state) => ({ ...state, ...data, lastUpdated: Date.now() })); return true; } return false; } catch { return false; } },
      generateWeeklyReview: () => set(state => ({ weeklyInsights: [...state.weeklyInsights, { id: Date.now().toString(), startDate: new Date(Date.now() - 604800000).toISOString(), endDate: new Date().toISOString(), story: ['Week complete!'], pattern: 'Check', suggestion: 'Keep going.', viewed: false }] })),
      markReviewViewed: (id) => set(state => ({ weeklyInsights: state.weeklyInsights.map(i => i.id === id ? { ...i, viewed: true } : i) })),

      // SUNDAY RITUAL: Weekly Review with Momentum Score
      checkWeeklyReview: async () => {
        const state = get();
        if (!state._hasHydrated) return;

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday

        console.log("📅 [WEEKLY REVIEW] Checking if review is needed...");
        console.log("📅 [WEEKLY REVIEW] Day of week:", dayOfWeek, "(0=Sun, 1=Mon)");

        // 1. TRIGGER GUARD: Only run on Sunday (0) or Monday (1)
        if (dayOfWeek !== 0 && dayOfWeek !== 1) {
          console.log("📅 [WEEKLY REVIEW] ⏭️ Not Sunday/Monday - skipping");
          return;
        }

        // 2. PREVENT DOUBLE TRIGGER: Check if we already ran within last 4 days
        if (state.lastWeeklyReviewDate) {
          const today = now.toISOString().split('T')[0];
          const lastReviewDate = new Date(state.lastWeeklyReviewDate + 'T00:00:00'); // Ensure consistent parsing
          const todayDate = new Date(today + 'T00:00:00');
          const daysSinceLastReview = Math.floor((todayDate.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));

          console.log("📅 [WEEKLY REVIEW] Last review date:", state.lastWeeklyReviewDate);
          console.log("📅 [WEEKLY REVIEW] Today:", today);
          console.log("📅 [WEEKLY REVIEW] Days since last review:", daysSinceLastReview);

          if (daysSinceLastReview < 4) {
            console.log("📅 [WEEKLY REVIEW] ⏭️ Already ran within last 4 days - skipping");
            return;
          }
        }

        console.log("📅 [WEEKLY REVIEW] ✅ Generating weekly review...");

        // 3. THE 7-DAY LOOP: Calculate Momentum Score (OPTIMIZED - uses persisted dailyScore)
        const DAYS_TO_ANALYZE = 7;
        let weeklyMomentumScore = 0;
        let totalCompletions = 0;
        const missedHabits: Record<string, number> = {};
        const dailyScores: { date: string; score: number; completions: number }[] = [];

        const endDate = new Date(now);
        endDate.setHours(0, 0, 0, 0);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (DAYS_TO_ANALYZE - 1));

        console.log("📅 [WEEKLY REVIEW] Analyzing period:", startDate.toISOString().split('T')[0], "to", endDate.toISOString().split('T')[0]);

        // 🔥 OPTIMIZED: Simply sum the persisted daily scores
        for (let i = 0; i < DAYS_TO_ANALYZE; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);
          const dateKey = currentDate.toISOString().split('T')[0];

          const dailyLog = state.history[dateKey];

          // Use the persisted dailyScore (calculated once in checkNewDay)
          let dailyScore = dailyLog?.dailyScore;

          // 🛡️ SAFETY NET: If score is missing (Legacy Data), calculate it on the fly
          if (dailyScore === undefined && dailyLog?.completedHabitNames) {
            let tempScore = 0;
            for (const name of dailyLog.completedHabitNames) {
              if (state.habitRepository.high.includes(name)) tempScore += 3;
              else if (state.habitRepository.medium.includes(name)) tempScore += 2;
              else if (state.habitRepository.low.includes(name)) tempScore += 1;
            }
            dailyScore = tempScore / 3; // Calculate average
          }

          // Default to 0 if still nothing
          weeklyMomentumScore += (dailyScore || 0);

          // Count completions
          const dailyCompletions = dailyLog?.completedHabitNames?.length || 0;
          totalCompletions += dailyCompletions;

          dailyScores.push({ date: dateKey, score: dailyScore, completions: dailyCompletions });

          // Track missed habits (if we have data for this day)
          if (dailyLog?.completedHabitNames) {
            const completedNames = dailyLog.completedHabitNames;
            const expectedHabits = state.habitRepository.high.concat(state.habitRepository.medium, state.habitRepository.low);

            // Count misses for habits that existed but weren't completed
            for (const habitName of expectedHabits) {
              if (!completedNames.includes(habitName)) {
                missedHabits[habitName] = (missedHabits[habitName] || 0) + 1;
              }
            }
          }
        }

        console.log("📅 [WEEKLY REVIEW] Daily scores:", dailyScores);
        console.log("📅 [WEEKLY REVIEW] Weekly Momentum Score:", weeklyMomentumScore.toFixed(2), "/ 21.0");
        console.log("📅 [WEEKLY REVIEW] Total completions:", totalCompletions);

        // 4. THE CLASSIFICATION: Determine Persona
        let persona: 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';

        if (weeklyMomentumScore > 18.0) {
          persona = 'TITAN';
          console.log("📅 [WEEKLY REVIEW] Persona: 🏆 TITAN (Score > 18.0 - Exceptional performance)");
        } else if (weeklyMomentumScore > 12.0) {
          persona = 'GRINDER';
          console.log("📅 [WEEKLY REVIEW] Persona: 💪 GRINDER (Score > 12.0 - Strong consistency)");
        } else if (weeklyMomentumScore > 6.0) {
          persona = 'SURVIVOR';
          console.log("📅 [WEEKLY REVIEW] Persona: 🌱 SURVIVOR (Score > 6.0 - Showing up)");
        } else {
          persona = 'GHOST';
          console.log("📅 [WEEKLY REVIEW] Persona: 👻 GHOST (Score <= 6.0 - Need reconnection)");
        }

        // 5. PREMIUM WEEKLY SHIELD: Grant +1 shield to premium users every week
        let weeklyShieldBonus = 0;
        if (state.isPremium) {
          weeklyShieldBonus = 1;
          console.log("🛡️ [WEEKLY REVIEW] Premium user - granting +1 weekly shield");
        }

        // 6. IDENTITY EVOLUTION ENGINE (if identityType is set)
        let identityType = state.identityProfile?.type || null;
        let identityStage = state.identityProfile?.stage || 'INITIATION';
        let stageReason = '';
        let evolutionSuggestion = null;

        // Edge case: Skip evolution engine if no identity or habit repository is set
        if (identityType && state.identity && state.habitRepository?.high?.length > 0) {
          try {
            console.log("🧬 [IDENTITY] Running evolution engine for:", identityType, "at stage:", identityStage);

            // Calculate weekly stats for stage detection
            const weeklyStats = calculateWeeklyStats(state.history, 3);
            console.log("🧬 [IDENTITY] Weekly stats:", weeklyStats);

            // Detect stage transition
            const transition = detectStageTransition(
              identityType,
              identityStage,
              state.identityProfile?.weeksInStage || 0,
              weeklyStats,
              state.streak
            );

            if (transition.changed) {
              console.log("🧬 [IDENTITY] Stage transition:", identityStage, "->", transition.newStage);
              identityStage = transition.newStage;
              stageReason = transition.reason;
            } else {
              stageReason = transition.reason;
            }

            // Generate evolution suggestion
            evolutionSuggestion = generateEvolutionSuggestion(
              identityType,
              identityStage,
              {
                weeklyCompletionRate: weeklyStats[0]?.weeklyCompletionRate || 0,
                streak: state.streak,
                momentum: weeklyMomentumScore
              }
            );
            console.log("🌱 [EVOLUTION] Generated suggestion:", evolutionSuggestion);
          } catch (error) {
            console.error("🧬 [IDENTITY] ❌ Evolution engine error - using defaults:", error);
            // Graceful fallback - don't block weekly review
            stageReason = "Your identity journey continues.";
            evolutionSuggestion = null;
          }
        } else if (identityType) {
          console.log("🧬 [IDENTITY] ⚠️ Skipping evolution - missing identity or habits");
          stageReason = "Set up your habits to unlock evolution insights.";
        }


        // 7. STATE UPDATE: Make review available + add shields + update identity
        const newIdentityProfile: IdentityProfile = {
          type: identityType,
          stage: identityStage,
          stageEnteredAt: state.identityProfile?.stageEnteredAt || null,
          weeksInStage: (state.identityProfile?.weeksInStage || 0) + 1
        };

        // If stage changed, reset weeksInStage and set new stageEnteredAt
        if (identityType && identityStage !== state.identityProfile?.stage) {
          newIdentityProfile.stageEnteredAt = new Date().toISOString().split('T')[0];
          newIdentityProfile.weeksInStage = 0;
        }

        // 8. CALCULATE IDENTITY PROGRESS & BRANCHING
        let progressionPercent = 0;
        let identityBranching: { showBranching: boolean; options: string[]; reason?: string } = { showBranching: false, options: [] };

        if (identityType) {
          const { computeIdentityProgress, detectIdentityBranching } = await import('./services/evolutionEngine');
          const weeksInStage = newIdentityProfile.weeksInStage;
          const hasGoodStats = weeklyMomentumScore >= 10;

          progressionPercent = computeIdentityProgress(identityType, identityStage, weeksInStage, hasGoodStats);
          identityBranching = detectIdentityBranching(
            state.identity || '',
            identityType,
            identityStage,
            weeksInStage
          );

          console.log("📊 [IDENTITY PROGRESS]", progressionPercent + "%", "| Branching:", identityBranching.showBranching);
        }

        set({
          weeklyReview: {
            // Preserve all existing core fields
            available: true,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalCompletions,
            weeklyMomentumScore,
            persona,
            missedHabits,
            // Identity Evolution fields (extend, not overwrite)
            identityType: identityType || null,
            identityStage: identityStage || null,
            evolutionSuggestion: evolutionSuggestion || null,
            stageReason: stageReason || null,
            // NEW: Identity Progress fields
            progressionPercent,
            weeksInStage: newIdentityProfile.weeksInStage,
            identityBranching
          },
          // Only update identityProfile if we have a valid type
          ...(identityType ? { identityProfile: newIdentityProfile } : {}),
          lastEvolutionSuggestion: evolutionSuggestion || null,
          shields: Math.min(3, (state.shields || 0) + weeklyShieldBonus), // Cap at 3
          lastUpdated: Date.now()
        });



        console.log("📅 [WEEKLY REVIEW] ✅ Review is now available for user");
      },

      completeWeeklyReview: () => {
        const state = get();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        console.log("📅 [WEEKLY REVIEW] User completed review - marking as viewed");
        console.log("📅 [WEEKLY REVIEW] Setting lastWeeklyReviewDate to:", today);

        set({
          weeklyReview: null, // Clear the review completely
          lastWeeklyReviewDate: today, // Lock with today's date
          lastUpdated: Date.now()
        });

        // Force immediate sync to Firebase to persist the lock
        console.log("☁️ [WEEKLY REVIEW] Forcing Firebase sync to lock review...");
        get().syncToFirebase(true);
        console.log("☁️ [WEEKLY REVIEW] ✅ Review locked and synced.");
      },

      // WEEKLY ROUTINE OPTIMIZATION: Level Up or Reset based on performance
      optimizeWeeklyRoutine: async (type: 'LEVEL_UP' | 'RESET') => {
        const state = get();

        console.log("🔧 [ROUTINE OPTIMIZER] Starting optimization:", type);

        // Determine the mode for AI generation
        const mode = type === 'LEVEL_UP' ? 'GROWTH' : 'RECOVERY';

        try {
          // Reuse our powerful AI adaptation function
          const { generateDailyAdaptation } = await import('./services/ai');

          console.log("🔧 [ROUTINE OPTIMIZER] Calling AI with mode:", mode);

          const newRepository = await generateDailyAdaptation(
            state.identity,
            mode,
            state.habitRepository
          );

          // Validate the returned repository
          if (
            newRepository &&
            newRepository.high?.length === 3 &&
            newRepository.medium?.length === 3 &&
            newRepository.low?.length === 3
          ) {
            console.log("🔧 [ROUTINE OPTIMIZER] ✅ New repository generated:", newRepository);

            // Determine default energy level based on optimization type
            let defaultEnergyLevel: 'high' | 'medium' | 'low';
            let defaultHabits: string[];
            let message: string;

            if (type === 'LEVEL_UP') {
              defaultEnergyLevel = 'high';
              defaultHabits = newRepository.high;
              message = "🚀 Routine leveled up! Your habits have been optimized for growth.";
            } else {
              defaultEnergyLevel = 'low';
              defaultHabits = newRepository.low;
              message = "🌱 Routine reset! Your habits have been simplified for a fresh start.";
            }

            console.log("🔧 [ROUTINE OPTIMIZER] Setting default energy:", defaultEnergyLevel);

            set({
              habitRepository: newRepository,
              microHabits: defaultHabits,
              currentEnergyLevel: defaultEnergyLevel,
              currentHabitIndex: 0,
              dailyPlanMessage: message,
              lastUpdated: Date.now()
            });

            // Force sync to Firebase
            console.log("☁️ [ROUTINE OPTIMIZER] Forcing Firebase sync...");
            await get().syncToFirebase(true);
            console.log("☁️ [ROUTINE OPTIMIZER] ✅ Sync complete.");
          } else {
            console.warn("🔧 [ROUTINE OPTIMIZER] ⚠️ Invalid repository returned");
          }
        } catch (error) {
          console.error("🔧 [ROUTINE OPTIMIZER] ❌ Error optimizing routine:", error);
        }
      },

      // PREMIUM SUBSCRIPTION MANAGEMENT
      // ⚠️ SECURITY NOTE: The `upgradeToPremium` action has been REMOVED.
      // Premium status is now set ONLY by the secure serverless function 
      // at /api/verify-payment.ts after verifying payment with Dodo Payments API.
      // This prevents users from setting isPremium:true via browser console.

      checkSubscriptionStatus: () => {
        const state = get();

        if (!state._hasHydrated) return;

        // Only check if user is marked as premium
        if (state.isPremium && state.premiumExpiryDate) {
          const now = Date.now();

          console.log("💎 [PREMIUM] Checking subscription status...");
          console.log("💎 [PREMIUM] Expiry date:", new Date(state.premiumExpiryDate).toISOString());
          console.log("💎 [PREMIUM] Current time:", new Date(now).toISOString());

          // Check if subscription has expired
          if (now > state.premiumExpiryDate) {
            console.log("💎 [PREMIUM] ⚠️ Subscription expired!");

            set({
              isPremium: false,
              premiumExpiryDate: null,
              dailyPlanMessage: "⏰ Subscription Expired. Renew to keep your AI Brain active.",
              lastUpdated: Date.now()
            });

            // Force sync to Firebase
            get().syncToFirebase(true);
          } else {
            const daysRemaining = Math.ceil((state.premiumExpiryDate - now) / (1000 * 60 * 60 * 24));
            console.log("💎 [PREMIUM] ✅ Active -", daysRemaining, "days remaining");
          }
        }
      },

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
            premiumExpiryDate: profile.premiumExpiryDate || null,
            // Recovery Mode
            recoveryMode: profile.recoveryMode ?? false,
            consecutiveMisses: profile.consecutiveMisses ?? 0,
            lastMissedDate: profile.lastMissedDate ?? null,
            dailyCompletedIndices: todayCompletedIndices,
            lastCompletedDate: profile.lastCompletedDate || null,
            lastDailyPlanDate: profile.lastDailyPlanDate || null,
            weeklyReview: profile.weeklyReview || null,
            lastWeeklyReviewDate: profile.lastWeeklyReviewDate || null,
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
            lastDailyPlanDate: state.lastDailyPlanDate,
            totalCompletions: state.totalCompletions,
            isPremium: state.isPremium,
            premiumExpiryDate: state.premiumExpiryDate,
            // Recovery Mode
            recoveryMode: state.recoveryMode,
            consecutiveMisses: state.consecutiveMisses,
            lastMissedDate: state.lastMissedDate,
            // Weekly Review
            weeklyReview: state.weeklyReview,
            lastWeeklyReviewDate: state.lastWeeklyReviewDate,
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

            console.log("[LOAD] Cloud TS:", cloudLastUpdated, "Local TS:", localLastUpdated);

            // 🛡️ SECURITY CHECK: Always respect Cloud Premium status if it exists and is valid
            // This prevents a local state glitch from overwriting a paid subscription
            const cloudIsPremium = cloudData.isPremium === true;
            const cloudExpiry = cloudData.premiumExpiryDate || 0;
            const isCloudValid = cloudIsPremium && cloudExpiry > Date.now();

            if (cloudLastUpdated > localLastUpdated) {
              // Cloud is newer - download everything
              console.log("[LOAD] Cloud is newer - downloading...");
              await get().downloadFromFirebase(cloudData);
            } else if (localLastUpdated > cloudLastUpdated) {
              // Local is newer - usually we upload local...
              // BUT if Cloud has a valid subscription and Local doesn't, we must PRESERVE the Cloud subscription
              if (isCloudValid && !state.isPremium) {
                console.log("🛡️ [LOAD] Conflict detected: Local is newer but lost Premium. Restoring from Cloud.");

                // Merge Cloud Premium into Local State BEFORE uploading
                set({
                  isPremium: true,
                  premiumExpiryDate: cloudExpiry,
                  dailyPlanMessage: "💎 Premium restored from cloud sync.",
                  lastUpdated: Date.now() // Update local timestamp to be the winner
                });

                // Now upload the merged state (Local Habits + Cloud Premium)
                await get().syncToFirebase(true);
              } else {
                console.log("[LOAD] Local is newer - uploading...");
                await get().syncToFirebase(true);
              }
            } else {
              console.log("[LOAD] Already in sync");
            }
          } else {
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
        currentEnergyLevel: state.currentEnergyLevel,
        dailyPlanMessage: state.dailyPlanMessage,
        history: state.history,
        resilienceScore: state.resilienceScore,
        resilienceStatus: state.resilienceStatus,
        streak: state.streak,
        shields: state.shields,
        lastUpdated: state.lastUpdated,
        lastSync: state.lastSync,
        dailyCompletedIndices: state.dailyCompletedIndices,
        lastCompletedDate: state.lastCompletedDate,
        lastDailyPlanDate: state.lastDailyPlanDate,
        currentView: state.currentView,
        weeklyInsights: state.weeklyInsights,
        goal: state.goal,
        totalCompletions: state.totalCompletions,
        isPremium: state.isPremium,
        premiumExpiryDate: state.premiumExpiryDate,
        // Recovery Mode fields
        recoveryMode: state.recoveryMode,
        consecutiveMisses: state.consecutiveMisses,
        lastMissedDate: state.lastMissedDate,
        // Weekly Review fields
        weeklyReview: state.weeklyReview,
        lastWeeklyReviewDate: state.lastWeeklyReviewDate,
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

            // 0. Check subscription status first
            store.checkSubscriptionStatus();

            // 1. First, clean up yesterday's mess (Fixes Orb Color & Ghost Habits)
            store.checkNewDay();

            // 2. Then, check if we missed yesterday entirely (Fixes Recovery Mode)
            store.checkMissedDay();

            // 3. Check if it's Sunday/Monday and generate weekly review
            store.checkWeeklyReview();

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
