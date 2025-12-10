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
