/**
 * Evolution Suggestion Engine
 * 
 * Generates stage-appropriate evolution suggestions
 * based on identity type and current stage.
 * 
 * These suggestions help users evolve their habits
 * at the right pace for their journey.
 */

import { IdentityType, IdentityStage, EvolutionSuggestion, EvolutionSuggestionType } from '../types';

interface EvolutionContext {
    weeklyCompletionRate: number;
    streak: number;
    momentum: number;  // weeklyMomentumScore
}

/**
 * Generate an evolution suggestion based on identity type, stage, and recent stats
 */
export function generateEvolutionSuggestion(
    identityType: IdentityType,
    stage: IdentityStage,
    stats: EvolutionContext
): EvolutionSuggestion {
    const today = new Date().toISOString().split('T')[0];

    switch (identityType) {
        case 'SKILL':
            return generateSkillSuggestion(stage, stats, today);
        case 'CHARACTER':
            return generateCharacterSuggestion(stage, stats, today);
        case 'RECOVERY':
            return generateRecoverySuggestion(stage, stats, today);
        default:
            return {
                type: 'MAINTAIN',
                message: 'Keep doing what you\'re doing.',
                createdAt: today,
                applied: false
            };
    }
}

/**
 * SKILL identity suggestions
 * Focus: Progressive difficulty, variations, technique
 */
function generateSkillSuggestion(
    stage: IdentityStage,
    stats: EvolutionContext,
    today: string
): EvolutionSuggestion {
    switch (stage) {
        case 'INITIATION':
            return {
                type: 'MAINTAIN',
                message: 'Keep habits tiny for now. Consistency beats intensity at this stage.',
                createdAt: today,
                applied: false
            };

        case 'INTEGRATION':
            if (stats.weeklyCompletionRate >= 70) {
                return {
                    type: 'ADD_VARIATION',
                    message: 'You\'re stable! Consider adding a small variation to keep things fresh.',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'MAINTAIN',
                message: 'Focus on making this feel automatic before adding more.',
                createdAt: today,
                applied: false
            };

        case 'EXPANSION':
            if (stats.weeklyCompletionRate >= 80) {
                return {
                    type: 'INCREASE_DIFFICULTY',
                    message: 'Your current habits look too easy now — that means you\'ve grown. Want to raise the bar gently?',
                    createdAt: today,
                    applied: false
                };
            }
            if (stats.streak >= 14) {
                return {
                    type: 'SHIFT_IDENTITY',
                    message: 'You\'ve mastered the basics. Ready to evolve your identity scope?',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'TECHNIQUE_WEEK',
                message: 'This week, focus on quality over quantity. Refine your technique.',
                createdAt: today,
                applied: false
            };

        case 'MAINTENANCE':
            if (stats.momentum > 15) {
                return {
                    type: 'REST_WEEK',
                    message: 'High momentum maintained! Consider a lighter week to sustain long-term.',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'MAINTAIN',
                message: 'You\'ve arrived. Keep the rhythm, no need to push harder.',
                createdAt: today,
                applied: false
            };
    }
}

/**
 * CHARACTER identity suggestions
 * Focus: Reflection, depth, context expansion
 */
function generateCharacterSuggestion(
    stage: IdentityStage,
    stats: EvolutionContext,
    today: string
): EvolutionSuggestion {
    switch (stage) {
        case 'INITIATION':
            return {
                type: 'MAINTAIN',
                message: 'Character builds slowly. Stay gentle with yourself this week.',
                createdAt: today,
                applied: false
            };

        case 'INTEGRATION':
            return {
                type: 'ADD_REFLECTION',
                message: 'Add a moment of reflection to your practice. How does this identity feel?',
                createdAt: today,
                applied: false
            };

        case 'EXPANSION':
            if (stats.weeklyCompletionRate >= 65) {
                return {
                    type: 'DEEPEN_CONTEXT',
                    message: 'This identity is stabilizing. Want to bring it into harder moments — like stress or social situations?',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'EMOTIONAL_WEEK',
                message: 'This week, notice the emotions that arise. Character growth lives in awareness.',
                createdAt: today,
                applied: false
            };

        case 'MAINTENANCE':
            return {
                type: 'MAINTAIN',
                message: 'You\'ve become this person. Just maintain the essence.',
                createdAt: today,
                applied: false
            };
    }
}

/**
 * RECOVERY identity suggestions
 * Focus: Gentleness, friction removal, stabilization
 */
function generateRecoverySuggestion(
    stage: IdentityStage,
    stats: EvolutionContext,
    today: string
): EvolutionSuggestion {
    switch (stage) {
        case 'INITIATION':
            if (stats.weeklyCompletionRate < 50) {
                return {
                    type: 'SOFTER_HABIT',
                    message: 'Recovery is hard. Make your habits even softer this week.',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'STABILIZATION_WEEK',
                message: 'Keep next week soft and predictable. Stability is the goal.',
                createdAt: today,
                applied: false
            };

        case 'INTEGRATION':
            if (stats.streak >= 7) {
                return {
                    type: 'FRICTION_REMOVAL',
                    message: 'Good rhythm! Identify one friction point to remove this week.',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'STABILIZATION_WEEK',
                message: 'Your recovery rhythm is forming. Let\'s keep next week soft and predictable.',
                createdAt: today,
                applied: false
            };

        case 'EXPANSION':
            if (stats.weeklyCompletionRate >= 70) {
                return {
                    type: 'RELAPSE_PATTERN',
                    message: 'You\'re stable. Let\'s identify patterns that might trigger setbacks.',
                    createdAt: today,
                    applied: false
                };
            }
            return {
                type: 'STABILIZATION_WEEK',
                message: 'Continue the gentle pace. Recovery doesn\'t need to rush.',
                createdAt: today,
                applied: false
            };

        case 'MAINTENANCE':
            return {
                type: 'MAINTAIN',
                message: 'You\'ve built lasting change. Focus on sustaining, not expanding.',
                createdAt: today,
                applied: false
            };
    }
}

/**
 * Get human-friendly title for suggestion type
 */
export function getSuggestionTitle(type: EvolutionSuggestionType): string {
    switch (type) {
        case 'INCREASE_DIFFICULTY': return 'Level Up';
        case 'ADD_VARIATION': return 'Add Variety';
        case 'SHIFT_IDENTITY': return 'Evolve Identity';
        case 'TECHNIQUE_WEEK': return 'Refine Technique';
        case 'ADD_REFLECTION': return 'Add Reflection';
        case 'DEEPEN_CONTEXT': return 'Deepen Practice';
        case 'EMOTIONAL_WEEK': return 'Emotional Awareness';
        case 'SOFTER_HABIT': return 'Soften Habits';
        case 'FRICTION_REMOVAL': return 'Remove Friction';
        case 'STABILIZATION_WEEK': return 'Stabilize';
        case 'RELAPSE_PATTERN': return 'Pattern Analysis';
        case 'REST_WEEK': return 'Rest Week';
        case 'MAINTAIN': return 'Keep Going';
    }
}

/**
 * Compute identity progress as a percentage (0-100)
 * Based on stage and weeks spent in that stage
 */
export function computeIdentityProgress(
    identityType: IdentityType,
    stage: IdentityStage,
    weeksInStage: number,
    hasGoodStats: boolean
): number {
    // Stage weights (cumulative progress)
    const stageProgress: Record<IdentityStage, number> = {
        'INITIATION': 0,
        'INTEGRATION': 25,
        'EXPANSION': 50,
        'MAINTENANCE': 75
    };

    // Expected weeks per stage (varies by type)
    const expectedWeeks: Record<IdentityType, Record<IdentityStage, number>> = {
        'SKILL': { 'INITIATION': 2, 'INTEGRATION': 4, 'EXPANSION': 6, 'MAINTENANCE': 8 },
        'CHARACTER': { 'INITIATION': 3, 'INTEGRATION': 5, 'EXPANSION': 8, 'MAINTENANCE': 10 },
        'RECOVERY': { 'INITIATION': 4, 'INTEGRATION': 6, 'EXPANSION': 10, 'MAINTENANCE': 12 }
    };

    const baseProgress = stageProgress[stage];
    const weeksForStage = expectedWeeks[identityType]?.[stage] || 4;

    // Progress within current stage (0-25%)
    const stageInternalProgress = Math.min(25, (weeksInStage / weeksForStage) * 25);

    // Bonus for good performance
    const performanceBonus = hasGoodStats ? 5 : 0;

    return Math.min(100, Math.round(baseProgress + stageInternalProgress + performanceBonus));
}

/**
 * Detect if user should see identity branching options
 * Shows at EXPANSION stage after 3+ weeks with good performance
 */
export function detectIdentityBranching(
    identity: string,
    identityType: IdentityType,
    stage: IdentityStage,
    weeksInStage: number
): { showBranching: boolean; options: string[]; reason?: string } {
    // Only show branching at EXPANSION stage after 3+ weeks
    if (stage !== 'EXPANSION' || weeksInStage < 3) {
        return { showBranching: false, options: [] };
    }

    // Generate branching options based on identity type
    const branchingOptions: Record<IdentityType, string[]> = {
        'SKILL': [
            `Deepen ${identity} (Mastery path)`,
            `Expand to related skill`,
            `Teach ${identity} to others`
        ],
        'CHARACTER': [
            `Apply ${identity} in harder contexts`,
            `Add complementary trait`,
            `Lead by example`
        ],
        'RECOVERY': [
            `Strengthen daily rituals`,
            `Build support network`,
            `Help others in recovery`
        ]
    };

    return {
        showBranching: true,
        options: branchingOptions[identityType] || [],
        reason: `You've been in Expansion for ${weeksInStage} weeks. Ready to branch out?`
    };
}
