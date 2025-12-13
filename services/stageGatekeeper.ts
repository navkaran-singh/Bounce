/**
 * Stage Gatekeeper v8 - Hybrid Stage Progression System
 * 
 * Philosophy:
 * - No demotions (stages only go forward)
 * - INITIATION → INTEGRATION is automatic
 * - EXPANSION and MAINTENANCE are suggested, require user confirmation
 * - System unlocks stages, user confirms them
 */

import { IdentityProfile, IdentityStage, IdentityType } from '../types';
import { WeeklyStats } from './stageDetector';

/**
 * Check if user is eligible for a stage upgrade
 * 
 * @param profile Current identity profile
 * @param stats Weekly stats for the most recent week  
 * @returns The next eligible stage, or null if not eligible
 */
export function checkStageEligibility(
    profile: IdentityProfile,
    stats: WeeklyStats
): IdentityStage | null {
    const { stage, weeksInStage, type } = profile;

    // Already at max stage - no upgrade possible
    if (stage === 'MAINTENANCE') {
        return null;
    }

    // Convert weeklyCompletionRate from 0-100 to 0-1 for threshold comparison
    const completionRate = stats.weeklyCompletionRate / 100;

    console.log(`🚪 [GATEKEEPER] Checking eligibility: stage=${stage}, weeks=${weeksInStage}, rate=${(completionRate * 100).toFixed(1)}%, type=${type}`);

    switch (stage) {
        case 'INITIATION':
            return checkInitiationToIntegration(weeksInStage, completionRate);

        case 'INTEGRATION':
            return checkIntegrationToExpansion(type, weeksInStage, completionRate);

        case 'EXPANSION':
            return checkExpansionToMaintenance(type, weeksInStage, completionRate);

        default:
            return null;
    }
}

/**
 * INITIATION → INTEGRATION (Auto-eligible)
 * 
 * Threshold: weeksInStage >= 3 OR completionRate >= 30%
 */
function checkInitiationToIntegration(
    weeksInStage: number,
    completionRate: number
): IdentityStage | null {
    // Time-based: survived 3+ weeks
    if (weeksInStage >= 3) {
        console.log(`🚪 [GATEKEEPER] ✅ INITIATION → INTEGRATION (time: ${weeksInStage} weeks >= 3)`);
        return 'INTEGRATION';
    }

    // Performance-based: 30%+ completion rate
    if (completionRate >= 0.30) {
        console.log(`🚪 [GATEKEEPER] ✅ INITIATION → INTEGRATION (rate: ${(completionRate * 100).toFixed(1)}% >= 30%)`);
        return 'INTEGRATION';
    }

    console.log(`🚪 [GATEKEEPER] ❌ Not eligible for INTEGRATION (weeks=${weeksInStage}, rate=${(completionRate * 100).toFixed(1)}%)`);
    return null;
}

/**
 * INTEGRATION → EXPANSION (Performance Gate)
 * 
 * Thresholds vary by identity type:
 * - SKILL: completionRate >= 60%
 * - CHARACTER: completionRate >= 50%
 * - RECOVERY: weeksInStage >= 6 AND completionRate >= 40%
 */
function checkIntegrationToExpansion(
    type: IdentityType | null,
    weeksInStage: number,
    completionRate: number
): IdentityStage | null {
    // Default to SKILL if type is null
    const identityType = type || 'SKILL';

    switch (identityType) {
        case 'SKILL':
            if (completionRate >= 0.60) {
                console.log(`🚪 [GATEKEEPER] ✅ INTEGRATION → EXPANSION (SKILL: ${(completionRate * 100).toFixed(1)}% >= 60%)`);
                return 'EXPANSION';
            }
            break;

        case 'CHARACTER':
            if (completionRate >= 0.50) {
                console.log(`🚪 [GATEKEEPER] ✅ INTEGRATION → EXPANSION (CHARACTER: ${(completionRate * 100).toFixed(1)}% >= 50%)`);
                return 'EXPANSION';
            }
            break;

        case 'RECOVERY':
            // RECOVERY requires BOTH time AND performance (single source of truth)
            if (weeksInStage >= 6 && completionRate >= 0.40) {
                console.log(`🚪 [GATEKEEPER] ✅ INTEGRATION → EXPANSION (RECOVERY: ${weeksInStage} weeks >= 6, ${(completionRate * 100).toFixed(1)}% >= 40%)`);
                return 'EXPANSION';
            }
            break;
    }

    console.log(`🚪 [GATEKEEPER] ❌ Not eligible for EXPANSION (type=${identityType}, weeks=${weeksInStage}, rate=${(completionRate * 100).toFixed(1)}%)`);
    return null;
}

/**
 * EXPANSION → MAINTENANCE (Consistency Gate)
 * 
 * Thresholds vary by identity type:
 * - SKILL: weeksInStage >= 8 AND avgRate >= 55%
 * - CHARACTER: weeksInStage >= 8 AND avgRate >= 50%
 * - RECOVERY: weeksInStage >= 12 AND avgRate >= 45%
 */
function checkExpansionToMaintenance(
    type: IdentityType | null,
    weeksInStage: number,
    completionRate: number
): IdentityStage | null {
    // Default to SKILL if type is null
    const identityType = type || 'SKILL';

    switch (identityType) {
        case 'SKILL':
            if (weeksInStage >= 8 && completionRate >= 0.55) {
                console.log(`🚪 [GATEKEEPER] ✅ EXPANSION → MAINTENANCE (SKILL: ${weeksInStage} weeks >= 8, ${(completionRate * 100).toFixed(1)}% >= 55%)`);
                return 'MAINTENANCE';
            }
            break;

        case 'CHARACTER':
            if (weeksInStage >= 8 && completionRate >= 0.50) {
                console.log(`🚪 [GATEKEEPER] ✅ EXPANSION → MAINTENANCE (CHARACTER: ${weeksInStage} weeks >= 8, ${(completionRate * 100).toFixed(1)}% >= 50%)`);
                return 'MAINTENANCE';
            }
            break;

        case 'RECOVERY':
            if (weeksInStage >= 12 && completionRate >= 0.45) {
                console.log(`🚪 [GATEKEEPER] ✅ EXPANSION → MAINTENANCE (RECOVERY: ${weeksInStage} weeks >= 12, ${(completionRate * 100).toFixed(1)}% >= 45%)`);
                return 'MAINTENANCE';
            }
            break;
    }

    console.log(`🚪 [GATEKEEPER] ❌ Not eligible for MAINTENANCE (type=${identityType}, weeks=${weeksInStage}, rate=${(completionRate * 100).toFixed(1)}%)`);
    return null;
}

/**
 * Get a message for automatic INITIATION → INTEGRATION promotion
 */
export function getAutoPromotionMessage(): string {
    return "You've built a foundation. Things should feel lighter now.";
}

/**
 * Get a message for suggested stage upgrade (user must confirm)
 */
export function getSuggestedUpgradeMessage(suggestedStage: IdentityStage): string {
    switch (suggestedStage) {
        case 'EXPANSION':
            return "You're ready to grow. Ready to level up?";
        case 'MAINTENANCE':
            return "This identity feels stable. Ready to lock it in?";
        default:
            return "You're making progress!";
    }
}
