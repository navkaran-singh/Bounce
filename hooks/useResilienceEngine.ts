import { useStore } from '../store';
import { Badge } from '../types';

export const BADGES: Badge[] = [
  { id: 'spark', label: 'Spark', icon: '✨', unlocked: false, requirement: 1 },
  { id: 'flame', label: 'Flame', icon: '🔥', unlocked: false, requirement: 3 },
  { id: 'beacon', label: 'Beacon', icon: '💡', unlocked: false, requirement: 7 },
  { id: 'star', label: 'Star', icon: '⭐', unlocked: false, requirement: 14 },
  { id: 'nova', label: 'Nova', icon: '🌟', unlocked: false, requirement: 30 },
  { id: 'luminary', label: 'Luminary', icon: '☀️', unlocked: false, requirement: 100 },
];

/**
 * useResilienceEngine - PURE STATELESS HOOK
 * 
 * This hook is now a thin wrapper that:
 * 1. Reads state from the Zustand store (single source of truth)
 * 2. Computes derived values (badges, status checks)
 * 3. Returns actions that delegate to store actions
 * 
 * All state mutations happen in store.ts
 */
export const useResilienceEngine = () => {
  const store = useStore();

  const {
    resilienceScore,
    resilienceStatus,
    lastCompletedDate,
    isFrozen,
    streak,
    shields,
    totalCompletions,
    dailyCompletedIndices = [],
    restoreUndoState,
    toggleFreeze,
    recoveryMode,
    consecutiveMisses,
    completeHabit,
    applyRecoveryOption,
    dismissRecoveryMode,
  } = store;

  // Derived: Is today completed?
  const isCompletedToday = !!(
    lastCompletedDate &&
    new Date(lastCompletedDate).toDateString() === new Date().toDateString()
  );

  // Derived: Check if specific habit is completed
  const isHabitCompleted = (index: number) => {
    return dailyCompletedIndices.includes(index);
  };

  // Derived: Calculate unlocked badges based on totalCompletions
  const earnedBadges = BADGES.filter(b => (totalCompletions || 0) >= b.requirement);
  const nextBadge = BADGES.find(b => (totalCompletions || 0) < b.requirement);

  // Derived: Should show "Never Miss Twice" warning?
  const shouldShowNeverMissTwice = () => {
    if (isCompletedToday || dailyCompletedIndices.length > 0) return false;
    if (streak === 0) return false;
    const hour = new Date().getHours();
    return hour >= 19; // After 7 PM
  };

  // Derived: Get difficulty adjustment message
  const getDifficultyMessage = () => {
    if (recoveryMode) return "Difficulty adjusted — healing in progress.";
    if (resilienceStatus === 'BOUNCED') return "🎉 You bounced back! +15 Resilience Bonus";
    if (resilienceStatus === 'RECOVERING') return "Complete one habit to bounce back.";
    if (resilienceStatus === 'CRACKED') return "Time to bounce back. You've got this.";
    return null;
  };

  // Action: Complete a task (delegates to store)
  const completeTask = (habitIndex: number) => {
    completeHabit(habitIndex);
  };

  // Action: Undo last completion
  const undo = () => {
    restoreUndoState();
  };

  return {
    state: {
      score: resilienceScore,
      status: resilienceStatus,
      isFrozen,
      streak,
      shields: shields || 0,
      isCompletedToday,
      completedIndices: dailyCompletedIndices,
      totalCompletions: totalCompletions || 0,
      earnedBadges,
      nextBadge,
      // Recovery Mode state
      recoveryMode,
      consecutiveMisses,
      shouldShowNeverMissTwice: shouldShowNeverMissTwice(),
      difficultyMessage: getDifficultyMessage(),
    },
    actions: {
      completeTask,
      undo,
      toggleFreeze,
      isHabitCompleted,
      // Recovery Mode actions
      applyRecoveryOption,
      dismissRecoveryMode,
    }
  };
};
