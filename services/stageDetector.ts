/**
 * Stage Detector - Identity Evolution Stage Detection Engine
 * 
 * Detects stage transitions based on:
 * - Weekly completion rates
 * - Streak length
 * - Momentum score
 * - Zero day patterns
 * - Energy usage patterns
 * 
 * Stage transitions vary by identity type (SKILL, CHARACTER, RECOVERY)
 */

import { IdentityType, IdentityStage, DailyLog } from '../types';

export interface WeeklyStats {
    weekStart: string;        // ISO date
    weeklyCompletionRate: number;  // 0-100 (% of days with ≥1 habit)
    habitCompletionRate: number;   // 0-100 (% of expected habits done)
    daysActive: number;       // Days with at least 1 completion
    totalCompletions: number; // Total habits completed
    hadZeroDay: boolean;      // Any day with 0 completions
    zeroCount: number;        // Count of zero days
    avgDailyMomentum: number; // Average momentum score across the week
    highEnergyDays: number;   // Days with high energy selection
}

export interface StageDetectionResult {
    newStage: IdentityStage;
    changed: boolean;
    reason: string;  // Human-readable explanation
}

/**
 * Calculate weekly stats from history for last N weeks
 */
export function calculateWeeklyStats(
    history: Record<string, DailyLog>,
    weeksBack: number = 3
): WeeklyStats[] {
    const stats: WeeklyStats[] = [];
    const now = new Date();

    for (let week = 0; week < weeksBack; week++) {
        // Get start and end of this week (going backwards)
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (week * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        let daysActive = 0;
        let totalCompletions = 0;
        let hadZeroDay = false;
        let zeroCount = 0;
        let totalMomentum = 0;
        let highEnergyDays = 0;

        // Count through each day of the week
        for (let d = 0; d < 7; d++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(currentDay.getDate() + d);
            const dateKey = currentDay.toISOString().split('T')[0];

            const log = history[dateKey];
            const completions = log?.completedIndices?.length || 0;
            const dailyScore = log?.dailyScore || 0;

            if (completions > 0) {
                daysActive++;
                totalCompletions += completions;
            } else {
                hadZeroDay = true;
                zeroCount++;
            }

            totalMomentum += dailyScore;

            // Track high energy usage
            if (log?.energy === 'high') {
                highEnergyDays++;
            }
        }

        const weeklyCompletionRate = (daysActive / 7) * 100;
        const expectedHabits = 7 * 3; // 7 days * 3 habits expected
        const habitCompletionRate = (totalCompletions / expectedHabits) * 100;
        const avgDailyMomentum = totalMomentum / 7;

        stats.push({
            weekStart: weekStart.toISOString().split('T')[0],
            weeklyCompletionRate,
            habitCompletionRate,
            daysActive,
            totalCompletions,
            hadZeroDay,
            zeroCount,
            avgDailyMomentum,
            highEnergyDays
        });
    }

    return stats;
}


/**
 * Detect stage transition based on identity type and recent stats
 */
export function detectStageTransition(
    identityType: IdentityType,
    currentStage: IdentityStage,
    weeksInStage: number,
    recentStats: WeeklyStats[],
    streak: number = 0
): StageDetectionResult {
    // Need at least 2 weeks of data
    if (recentStats.length < 2) {
        return { newStage: currentStage, changed: false, reason: 'Not enough data yet' };
    }

    const [thisWeek, lastWeek, twoWeeksAgo] = recentStats;

    // Check for regression first (applies to all types)
    const twoWeeksBelow40 = thisWeek.weeklyCompletionRate < 40 && lastWeek.weeklyCompletionRate < 40;

    switch (identityType) {
        case 'SKILL':
            return detectSkillStageTransition(currentStage, weeksInStage, recentStats, streak, twoWeeksBelow40);
        case 'CHARACTER':
            return detectCharacterStageTransition(currentStage, weeksInStage, recentStats, streak, twoWeeksBelow40);
        case 'RECOVERY':
            return detectRecoveryStageTransition(currentStage, weeksInStage, recentStats, streak, twoWeeksBelow40);
        default:
            return { newStage: currentStage, changed: false, reason: 'Unknown identity type' };
    }
}

/**
 * SKILL identity stage transitions
 * Focus: Progressive overload, measurable improvement
 * Uses: completion rate, streak, momentum, high energy usage
 */
function detectSkillStageTransition(
    currentStage: IdentityStage,
    weeksInStage: number,
    stats: WeeklyStats[],
    streak: number,
    shouldRegress: boolean
): StageDetectionResult {
    const [thisWeek, lastWeek] = stats;
    const twoWeeksAgo = stats[2];

    // REGRESSION: 2 weeks < 40% → back to INITIATION
    if (shouldRegress && currentStage !== 'INITIATION') {
        return {
            newStage: 'INITIATION',
            changed: true,
            reason: "Activity dropped significantly. Let's simplify and rebuild."
        };
    }

    // Check for strong momentum signal (avg > 2 means mostly high habits)
    const highMomentum = thisWeek.avgDailyMomentum >= 2;
    const highEnergyUsage = thisWeek.highEnergyDays >= 4;

    switch (currentStage) {
        case 'INITIATION':
            // → INTEGRATION: 2 consecutive weeks ≥ 60%, no zero days
            const twoWeeksAbove60 = thisWeek.weeklyCompletionRate >= 60 && lastWeek.weeklyCompletionRate >= 60;
            const noZeroWeeks = !thisWeek.hadZeroDay && !lastWeek.hadZeroDay;

            if (twoWeeksAbove60 && noZeroWeeks) {
                return {
                    newStage: 'INTEGRATION',
                    changed: true,
                    reason: 'Consistent practice established. You\'re building real momentum.'
                };
            }
            break;

        case 'INTEGRATION':
            // → EXPANSION: 2 weeks ≥ 80% OR streak ≥ 10 OR high momentum + high energy
            const twoWeeksAbove80 = thisWeek.weeklyCompletionRate >= 80 && lastWeek.weeklyCompletionRate >= 80;

            if (twoWeeksAbove80 || streak >= 10 || (highMomentum && highEnergyUsage)) {
                return {
                    newStage: 'EXPANSION',
                    changed: true,
                    reason: 'Your habits are feeling automatic. Ready to level up?'
                };
            }
            break;

        case 'EXPANSION':
            // → MAINTENANCE: 4+ weeks stable (≥ 70%), checking multiple weeks
            const fourStableWeeks = weeksInStage >= 4 &&
                thisWeek.weeklyCompletionRate >= 70 &&
                lastWeek.weeklyCompletionRate >= 70;

            if (fourStableWeeks) {
                return {
                    newStage: 'MAINTENANCE',
                    changed: true,
                    reason: 'This skill is part of you now. Focus on sustainability.'
                };
            }
            break;

        case 'MAINTENANCE':
            // Stay in maintenance unless regressing
            break;
    }

    return { newStage: currentStage, changed: false, reason: 'Keep going at current pace' };

}

/**
 * CHARACTER identity stage transitions
 * Focus: Depth, reflection, emotional congruence
 * Uses: streak, completion rate, consistency
 */
function detectCharacterStageTransition(
    currentStage: IdentityStage,
    weeksInStage: number,
    stats: WeeklyStats[],
    streak: number,
    shouldRegress: boolean
): StageDetectionResult {
    const [thisWeek, lastWeek, twoWeeksAgo] = stats;

    // REGRESSION: Gentle - only go back one stage, not all the way
    if (shouldRegress && currentStage !== 'INITIATION') {
        const gentleRegression: Record<IdentityStage, IdentityStage> = {
            'MAINTENANCE': 'EXPANSION',
            'EXPANSION': 'INTEGRATION',
            'INTEGRATION': 'INITIATION',
            'INITIATION': 'INITIATION'
        };
        return {
            newStage: gentleRegression[currentStage],
            changed: true,
            reason: "Character building takes time. Let's reconnect with the basics."
        };
    }

    // Check for 3 weeks of data for deeper analysis
    const hasThreeWeeks = stats.length >= 3 && twoWeeksAgo;
    const threeWeeksAbove65 = hasThreeWeeks &&
        thisWeek.weeklyCompletionRate >= 65 &&
        lastWeek.weeklyCompletionRate >= 65 &&
        twoWeeksAgo.weeklyCompletionRate >= 65;

    switch (currentStage) {
        case 'INITIATION':
            // → INTEGRATION: streak ≥ 7 OR 2 weeks ≥ 50%
            const twoWeeksAbove50 = thisWeek.weeklyCompletionRate >= 50 && lastWeek.weeklyCompletionRate >= 50;

            if (streak >= 7 || twoWeeksAbove50) {
                return {
                    newStage: 'INTEGRATION',
                    changed: true,
                    reason: 'You\'re showing up consistently. This identity is taking root.'
                };
            }
            break;

        case 'INTEGRATION':
            // → EXPANSION: streak ≥ 14 OR 3 weeks ≥ 65%
            if (streak >= 14 || threeWeeksAbove65) {
                return {
                    newStage: 'EXPANSION',
                    changed: true,
                    reason: 'This identity feels natural. Ready to go deeper?'
                };
            }
            break;

        case 'EXPANSION':
            // → MAINTENANCE: 4+ stable weeks with no zero days
            const fourStableWeeks = weeksInStage >= 4 &&
                thisWeek.weeklyCompletionRate >= 65 &&
                !thisWeek.hadZeroDay;

            if (fourStableWeeks) {
                return {
                    newStage: 'MAINTENANCE',
                    changed: true,
                    reason: 'You\'ve become this person. Now just maintain the essence.'
                };
            }
            break;

        case 'MAINTENANCE':
            break;
    }

    return { newStage: currentStage, changed: false, reason: 'Continue building this identity' };
}


/**
 * RECOVERY identity stage transitions
 * Focus: Gentle progress, relapse resilience, stabilization
 * NEVER hard-regresses - always supportive messaging
 * Uses: zero count, days active, streak, stability
 */
function detectRecoveryStageTransition(
    currentStage: IdentityStage,
    weeksInStage: number,
    stats: WeeklyStats[],
    streak: number,
    shouldRegress: boolean
): StageDetectionResult {
    const [thisWeek, lastWeek, twoWeeksAgo] = stats;

    // RECOVERY: NEVER hard-drop stage aggressively
    // Keep user in stage with supportive messaging instead
    // This prevents discouragement during vulnerable periods

    // Check for rebound patterns (zero days decreasing)
    const quickerRebound = lastWeek && thisWeek.zeroCount < lastWeek.zeroCount;
    const reducedMisses = thisWeek.zeroCount <= 2 && (!lastWeek || lastWeek.zeroCount <= 3);

    // Check for 3 stable weeks
    const hasThreeWeeks = stats.length >= 3 && twoWeeksAgo;
    const threeVeryStableWeeks = hasThreeWeeks &&
        thisWeek.daysActive >= 5 &&
        lastWeek.daysActive >= 5 &&
        twoWeeksAgo.daysActive >= 5;

    switch (currentStage) {
        case 'INITIATION':
            // → INTEGRATION: fewer misses + rebound pattern + 2 stable weeks
            const twoStableWeeks = thisWeek.daysActive >= 4 && lastWeek.daysActive >= 3;

            if ((reducedMisses && quickerRebound) || twoStableWeeks) {
                return {
                    newStage: 'INTEGRATION',
                    changed: true,
                    reason: 'Your recovery rhythm is forming. Gentle progress.'
                };
            }
            break;

        case 'INTEGRATION':
            // → EXPANSION: 3 very stable weeks (rare for recovery)
            if (threeVeryStableWeeks && streak >= 14) {
                return {
                    newStage: 'EXPANSION',
                    changed: true,
                    reason: 'You\'ve been remarkably stable. Ready for gentle growth?'
                };
            }
            // If struggling, STAY in Integration - never drop to Initiation
            if (shouldRegress) {
                return {
                    newStage: 'INTEGRATION', // Don't drop, just stay
                    changed: false,
                    reason: 'Recovery has ups and downs. Stay with the process.'
                };
            }
            break;

        case 'EXPANSION':
            // → MAINTENANCE: 4+ stable weeks
            if (weeksInStage >= 4 && thisWeek.weeklyCompletionRate >= 65 && thisWeek.zeroCount <= 1) {
                return {
                    newStage: 'MAINTENANCE',
                    changed: true,
                    reason: 'You\'ve built lasting change. Focus on sustaining it.'
                };
            }
            // If struggling, stay in Expansion
            if (shouldRegress) {
                return {
                    newStage: 'EXPANSION',
                    changed: false,
                    reason: 'Growth isn\'t linear. Keep going at your pace.'
                };
            }
            break;

        case 'MAINTENANCE':
            // If really struggling in maintenance, gentle step back to expansion
            if (shouldRegress) {
                return {
                    newStage: 'EXPANSION',
                    changed: true,
                    reason: 'A step back to refocus. You\'ve done this before.'
                };
            }
            break;
    }

    return { newStage: currentStage, changed: false, reason: 'Continue your recovery journey' };
}


/**
 * Get friendly label for identity stage
 */
export function getStageLabel(stage: IdentityStage): string {
    switch (stage) {
        case 'INITIATION': return 'Getting Started';
        case 'INTEGRATION': return 'Building Rhythm';
        case 'EXPANSION': return 'Ready to Grow';
        case 'MAINTENANCE': return 'Sustaining';
    }
}

/**
 * Get emoji for identity stage
 */
export function getStageEmoji(stage: IdentityStage): string {
    switch (stage) {
        case 'INITIATION': return '🌱';
        case 'INTEGRATION': return '🌿';
        case 'EXPANSION': return '🌳';
        case 'MAINTENANCE': return '🏔️';
    }
}
