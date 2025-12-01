
import { useEffect } from 'react';
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
    updateResilience,
    toggleFreeze,
    saveUndoState,
    restoreUndoState,
    microHabits,
    setMicroHabits,
    currentHabitIndex,
    generateWeeklyReview,
    weeklyInsights,
    isPremium,
    _hasHydrated  // 🛡️ ADD THIS
  } = store;

  // Check for missed days, daily resets, and Premium Automation
  useEffect(() => {
    // 🛡️ CRITICAL: Do NOT run any logic until store has loaded from disk
    if (!_hasHydrated) {
      console.log("[ENGINE] Waiting for hydration...");
      return;
    }
    if (isFrozen) return;

    const checkState = () => {
       const now = new Date();
       const last = lastCompletedDate ? new Date(lastCompletedDate) : null;
       const isToday = last && last.toDateString() === now.toDateString();
       
       // 1. Reset Daily Indices if it's a new day
       if (!isToday && dailyCompletedIndices.length > 0) {
           updateResilience({ dailyCompletedIndices: [] });
           
           // PREMIUM: Daily AI Micro-Deck Shuffle
           if (isPremium) {
                // Mock: Rotate habits slightly to keep it fresh
                // In real app, this would call LLM to generate fresh variations
           }
       }

       // 2. PREMIUM: Auto-Pivot Protocol (9PM Fallback)
       // If it's past 9 PM (21:00) and user hasn't completed task, swap to Emergency Habit
       if (!isToday && now.getHours() >= 21) {
           const emergencyHabit = "Emergency Bounce: 3 Deep Breaths";
           if (!microHabits.includes(emergencyHabit)) {
               const newHabits = [...microHabits];
               newHabits[currentHabitIndex] = emergencyHabit;
               setMicroHabits(newHabits);
           }
       }

       // 3. PREMIUM: Weekly Review (Sunday)
       if (now.getDay() === 0 && isPremium) { // 0 is Sunday
           // Check if we already generated one for this week
           const hasReviewForToday = weeklyInsights.some(w => 
               new Date(w.endDate).toDateString() === now.toDateString()
           );
           
           if (!hasReviewForToday) {
               generateWeeklyReview();
           }
       }

       if (!last) return;

       // 4. Check for missed streak
       const oneDay = 24 * 60 * 60 * 1000;
       const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
       const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
       
       const diffDays = (today.getTime() - lastDay.getTime()) / oneDay;

       if (diffDays > 1) {
           if (resilienceStatus !== 'CRACKED') {
               // Logic: Use Shield if available
               if ((shields || 0) > 0) {
                   updateResilience({
                       shields: (shields || 0) - 1,
                       missedYesterday: false
                   });
               } else {
                   updateResilience({
                       resilienceStatus: 'CRACKED',
                       resilienceScore: Math.max(0, resilienceScore - 10),
                       missedYesterday: true
                   });
               }
           }
       }
    };
    
    checkState();
    
    // Run check every minute to catch 9PM pivot
    const interval = setInterval(checkState, 60000);
    return () => clearInterval(interval);

  }, [_hasHydrated, lastCompletedDate, isFrozen, resilienceStatus, resilienceScore, updateResilience, dailyCompletedIndices, shields, isPremium]);

  const completeTask = (habitIndex: number) => {
    // Note: undoState is now saved inside completeHabit in store.ts
    // No need to call saveUndoState() here

    const now = new Date();
    const last = lastCompletedDate ? new Date(lastCompletedDate) : null;
    const isFirstToday = !last || last.toDateString() !== now.toDateString();

    // Determine Score Impact
    let newScore = resilienceScore;
    let newStatus = resilienceStatus;
    let newShields = shields || 0;
    
    let points = 5;
    
    if (resilienceStatus === 'CRACKED') {
        points = 15;
        newStatus = 'BOUNCED'; 
    } else {
        newStatus = 'ACTIVE';
    }

    newScore = Math.min(100, resilienceScore + points);

    const newIndices = [...dailyCompletedIndices];
    if (!newIndices.includes(habitIndex)) {
        newIndices.push(habitIndex);
    }

    const newStreak = isFirstToday ? streak + 1 : streak;

    // Earn Shield every 7 days
    if (isFirstToday && newStreak > 0 && newStreak % 7 === 0) {
        newShields += 1;
    }

    const newTotal = (totalCompletions || 0) + 1;

    updateResilience({
        resilienceScore: newScore,
        resilienceStatus: newStatus,
        lastCompletedDate: now.toISOString(),
        streak: newStreak,
        shields: newShields,
        missedYesterday: false,
        dailyCompletedIndices: newIndices,
        totalCompletions: newTotal
    });
  };

  const undo = () => {
      restoreUndoState();
  };

  const isCompletedToday = !!(lastCompletedDate && new Date(lastCompletedDate).toDateString() === new Date().toDateString());
  
  const isHabitCompleted = (index: number) => {
      return isCompletedToday && dailyCompletedIndices.includes(index);
  };

  // Calculate unlocked badges
  const earnedBadges = BADGES.filter(b => (totalCompletions || 0) >= b.requirement);
  const nextBadge = BADGES.find(b => (totalCompletions || 0) < b.requirement);

  return {
    state: {
      score: resilienceScore,
      status: resilienceStatus,
      isFrozen: isFrozen,
      streak: streak,
      shields: shields || 0,
      isCompletedToday,
      completedIndices: dailyCompletedIndices,
      totalCompletions: totalCompletions || 0,
      earnedBadges,
      nextBadge
    },
    actions: {
      completeTask,
      undo,
      toggleFreeze,
      isHabitCompleted
    }
  };
};
