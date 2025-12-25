/**
 * Evolution Suggestion Engine
 * 
 * Generates stage-appropriate evolution suggestions
 * based on identity type and current stage.
 * 
 * These suggestions help users evolve their habits
 * at the right pace for their journey.
 */

import { IdentityType, IdentityStage, EvolutionSuggestion, EvolutionSuggestionType, EvolutionOption, EvolutionOptionId, IdentityProfile } from '../types';

/**
 * 📊 STAGE INFO - Metadata for each identity stage
 */
export const STAGE_INFO: Record<IdentityStage, {
    label: string;
    description: string;
    length: number; // Expected weeks in this stage
}> = {
    INITIATION: {
        label: "Initiation",
        description: "You're building the foundation of your identity.",
        length: 3
    },
    INTEGRATION: {
        label: "Integration",
        description: "Your habits are stabilizing and becoming reliable.",
        length: 4
    },
    EXPANSION: {
        label: "Expansion",
        description: "You're exploring variations and expanding your skill.",
        length: 6
    },
    MAINTENANCE: {
        label: "Maintenance",
        description: "You've embodied the identity. This stage focuses on refinement.",
        length: 12
    }
};

/**
 * 🗺️ IDENTITY STAGES ORDERED - For the Evolution Map visualization
 */
export const IDENTITY_STAGES_ORDERED: IdentityStage[] = [
    "INITIATION",
    "INTEGRATION",
    "EXPANSION",
    "MAINTENANCE"
];

interface EvolutionContext {
    weeklyCompletionRate: number;
    streak: number;
    momentum: number;  // weeklyMomentumScore
}

/**
 * EVOLUTION EFFECT ENGINE
 * Calculates what changes should be applied when user selects an evolution option
 */
export interface EvolutionEffectResult {
    // Stage changes
    newStage?: IdentityStage;
    resetWeeksInStage?: boolean;

    // Habit difficulty changes
    difficultyLevel?: 'harder' | 'easier' | 'minimal' | 'same';

    // Special flags
    isFreshStart?: boolean;
    triggerIdentityChange?: boolean;
    isRescueMode?: boolean;  // 🛡️ Ghost Loop Protection: Atomic Rescue mode

    // UI feedback
    message: string;
}

export function calculateEvolutionEffects(
    option: EvolutionOption,
    currentProfile: IdentityProfile | null
): EvolutionEffectResult {
    const result: EvolutionEffectResult = {
        message: `Applied: ${option.label}`
    };

    // Handle stage change
    if (option.impact.stageChange) {
        result.newStage = option.impact.stageChange;
        result.resetWeeksInStage = true;
        result.message = `Stage reset to ${option.impact.stageChange}. Starting fresh.`;
    }

    // Handle difficulty adjustment
    if (option.impact.difficultyAdjustment !== undefined) {
        if (option.impact.difficultyAdjustment >= 1) {
            result.difficultyLevel = 'harder';
            result.message = `Habits leveled up. You're ready for more.`;
        } else if (option.impact.difficultyAdjustment === -1) {
            result.difficultyLevel = 'easier';
            result.message = `Habits eased. Focus on consistency.`;
        } else if (option.impact.difficultyAdjustment <= -2) {
            result.difficultyLevel = 'minimal';
            result.message = `Minimal mode activated. Just show up.`;
        } else {
            result.difficultyLevel = 'same';
        }
    }

    // Handle identity shift
    if (option.impact.identityShift) {
        result.triggerIdentityChange = true;
        result.message = `Ready to explore a new identity.`;
    }

    // Handle Fresh Start - check impact.isFreshStart OR option ID contains FRESH_START
    // 🛠️ FIX: Previously only checked 'FRESH_START_WEEK', now checks impact flag too
    if (option.impact.isFreshStart || option.id.includes('FRESH_START')) {
        result.isFreshStart = true;
        result.newStage = 'INITIATION';
        result.resetWeeksInStage = true;
        result.difficultyLevel = 'minimal';
        result.message = `Fresh start activated. No judgment, just begin again.`;
    }

    // 🛡️ Handle Atomic Rescue (Ghost Loop Protection)
    if (option.id === 'ATOMIC_RESCUE' || option.impact.isRescueMode) {
        result.difficultyLevel = 'minimal';
        result.isRescueMode = true;
        result.message = `Atomic Rescue activated. Just one tiny habit this week. You're rebuilding, not restarting.`;
    }

    // 🛡️ Handle Pullback Recovery (Overreach Detection)
    if (option.id === 'PULLBACK_RECOVERY') {
        result.difficultyLevel = 'easier';
        result.message = `Recovery pullback activated. You pushed hard — now let's recover wisely.`;
    }

    return result;
}

/**
 * HABIT DIFFICULTY ADJUSTMENT ENGINE
 * Adjusts habit repository based on difficulty level
 */
export function adjustHabitRepository(
    repo: { high: string[], medium: string[], low: string[] },
    adjustment: number,
    identityType?: IdentityType
): { high: string[], medium: string[], low: string[] } {
    if (import.meta.env.DEV) console.log(`🔧 [EVOLUTION] Adjusting habits by ${adjustment}`);

    if (adjustment === 0) {
        return { ...repo };
    }

    // +1 = INCREASE DIFFICULTY (promote habits up)
    if (adjustment >= 1) {
        return increaseHabitDifficulty(repo, identityType);
    }

    // -1 or less = REDUCE DIFFICULTY (demote habits down)
    if (adjustment <= -1) {
        return reduceHabitDifficulty(repo, adjustment);
    }

    return { ...repo };
}

/**
 * Increase difficulty: Promote habits up levels
 */
function increaseHabitDifficulty(
    repo: { high: string[], medium: string[], low: string[] },
    identityType?: IdentityType
): { high: string[], medium: string[], low: string[] } {
    // Promote medium → high (take first medium habit)
    const promotedToHigh = repo.medium.length > 0 ? [repo.medium[0]] : [];

    // Promote low → medium (take first low habit, upgrade it)
    const promotedToMedium = repo.low.length > 0 ? [upgradeHabitText(repo.low[0])] : [];

    // Build new high array: keep existing + add promoted, cap at 3
    const newHigh = [...repo.high, ...promotedToHigh]
        .filter((h, i, a) => a.indexOf(h) === i) // Remove duplicates
        .slice(0, 3);

    // Build new medium: keep remaining medium + promoted from low
    const newMedium = [...repo.medium.slice(1), ...promotedToMedium]
        .filter((h, i, a) => a.indexOf(h) === i)
        .slice(0, 3);

    // Build new low: keep remaining low habits
    const newLow = repo.low.slice(1).slice(0, 3);

    // For SKILL type, add a mastery habit if we have room
    if (identityType === 'SKILL' && newHigh.length < 3) {
        newHigh.push('Deep focus session');
    }

    // Ensure each level has at least 1 habit
    const result = {
        high: newHigh.length > 0 ? newHigh : repo.high.slice(0, 3),
        medium: newMedium.length > 0 ? newMedium : repo.medium.slice(0, 3),
        low: newLow.length > 0 ? newLow : repo.low.slice(0, 3)
    };

    if (import.meta.env.DEV) console.log('🔧 [EVOLUTION] Habits increased:', result);
    return result;
}

/**
 * Reduce difficulty: Demote habits down levels, simplify text
 */
function reduceHabitDifficulty(
    repo: { high: string[], medium: string[], low: string[] },
    adjustment: number
): { high: string[], medium: string[], low: string[] } {
    // Demote high → medium (simplify first high habit)
    const demotedToMedium = repo.high.length > 0 ? [simplifyHabitText(repo.high[0])] : [];

    // Demote medium → low (make tiny version)
    const demotedToLow = repo.medium.length > 0 ? [makeTinyHabit(repo.medium[0])] : [];

    // For minimal mode (adjustment <= -2), make everything tiny
    if (adjustment <= -2) {
        return {
            high: repo.low.map(h => h), // Use low habits as high
            medium: repo.low.map(h => makeTinyHabit(h)),
            low: repo.low.map(h => makeMinimalHabit(h))
        };
    }

    const result = {
        high: [...repo.high.slice(1), ...demotedToMedium]
            .filter((h, i, a) => a.indexOf(h) === i)
            .slice(0, 3),
        medium: [...repo.medium.slice(1), ...demotedToLow, ...demotedToMedium]
            .filter((h, i, a) => a.indexOf(h) === i)
            .slice(0, 3),
        low: [...repo.low, ...demotedToLow]
            .filter((h, i, a) => a.indexOf(h) === i)
            .slice(0, 3)
    };

    // Ensure each level has habits
    if (result.high.length === 0) result.high = repo.medium.slice(0, 3);
    if (result.medium.length === 0) result.medium = repo.low.slice(0, 3);
    if (result.low.length === 0) result.low = ['Just show up'];

    if (import.meta.env.DEV) console.log('🔧 [EVOLUTION] Habits reduced:', result);
    return result;
}

// Helper: Upgrade habit text (make it more challenging)
function upgradeHabitText(habit: string): string {
    return habit
        .replace(/(\d+)\s?min/gi, (_, n) => `${Math.min(60, parseInt(n) * 2)} min`)
        .replace(/(\d+)\s?m\b/gi, (_, n) => `${Math.min(60, parseInt(n) * 2)}m`)
        .replace(/1 /g, '3 ')
        .replace(/open/gi, 'Complete');
}

// Helper: Simplify habit text (reduce intensity)
function simplifyHabitText(habit: string): string {
    return habit
        .replace(/(\d+)\s?min/gi, (_, n) => `${Math.max(5, Math.floor(parseInt(n) / 2))} min`)
        .replace(/(\d+)\s?m\b/gi, (_, n) => `${Math.max(5, Math.floor(parseInt(n) / 2))}m`)
        .replace(/complete/gi, 'Work on')
        .replace(/finish/gi, 'Start');
}

// Helper: Make tiny 2-minute version
function makeTinyHabit(habit: string): string {
    const words = habit.split(' ');
    if (words.length <= 2) return habit;

    // Keep verb + first noun, add "for 2 min" if not already time-based
    const hasTime = /\d+\s?(min|m|sec|s)\b/i.test(habit);
    if (hasTime) {
        return habit.replace(/\d+\s?(min|m)\b/gi, '2 min');
    }
    return `${words.slice(0, 2).join(' ')} (2 min)`;
}

// Helper: Make minimal "just start" version
function makeMinimalHabit(habit: string): string {
    const verbs = ['Open', 'Look at', 'Touch', 'Set up'];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

    // Extract the main noun/object
    const words = habit.split(' ').filter(w => w.length > 3);
    const noun = words[words.length - 1] || 'it';

    return `${randomVerb} ${noun}`;
}

/**
 * 🌀 NOVELTY INJECTION - Apply small variations to habits
 * For premium users: handled by AI (we just mark it)
 * For free users: deterministic novelty suffix
 */
export function applyNoveltyToHabits(
    repo: { high: string[], medium: string[], low: string[] },
    isPremium: boolean
): { high: string[], medium: string[], low: string[] } {
    if (import.meta.env.DEV) console.log("🌀 [NOVELTY] Applying novelty to habits, isPremium:", isPremium);

    // Premium users: AI handles novelty via prompt, we don't modify
    if (isPremium) {
        if (import.meta.env.DEV) console.log("🌀 [NOVELTY] Premium user - AI will handle novelty");
        return repo;
    }

    // Free users: Add simple deterministic novelty
    const noveltyPhrases = [
        " (try a new variation)",
        " (at a different time)",
        " (in a new location)",
        " (with a twist)",
        " (fresh approach)"
    ];

    // Pick a random phrase
    const phrase = noveltyPhrases[Math.floor(Math.random() * noveltyPhrases.length)];

    const newRepo = {
        high: [...repo.high],
        medium: [...repo.medium],
        low: [...repo.low]
    };

    // Add novelty to first high habit
    if (newRepo.high.length > 0 && !newRepo.high[0].includes("(")) {
        newRepo.high[0] = newRepo.high[0] + phrase;
        if (import.meta.env.DEV) console.log("🌀 [NOVELTY] ✅ Applied novelty:", newRepo.high[0]);
    }

    return newRepo;
}

/**
 * FRESH START - Generate INITIATION level habits
 */
export function generateInitiationHabits(
    identityType: IdentityType,
    identity: string
): { high: string[], medium: string[], low: string[] } {
    if (import.meta.env.DEV) console.log('🌱 [FRESH START] Generating initiation habits for:', identityType);

    // Extract key word from identity
    const idLower = identity.toLowerCase();

    // Default initiation habits by type
    const templates: Record<IdentityType, { high: string[], medium: string[], low: string[] }> = {
        'SKILL': {
            high: ['Practice core skill for 15 min', 'Study technique for 10 min', 'Create one small output'],
            medium: ['Practice for 5 min', 'Review notes', 'Watch 1 tutorial'],
            low: ['Open your tools', 'Set a timer', 'Think about it for 1 min']
        },
        'CHARACTER': {
            high: ['Practice trait in real situation', 'Journal about progress', 'Set 3 daily reminders'],
            medium: ['Catch 1 moment to practice', 'Reflect for 5 min', 'Read 1 page on topic'],
            low: ['Notice 1 opportunity', 'Take 3 breaths', 'Set intention']
        },
        'RECOVERY': {
            high: ['Complete morning ritual', 'Avoid 1 trigger', 'Connect with support'],
            medium: ['5-min grounding exercise', 'Check in with feelings', 'Drink water'],
            low: ['Notice urges without acting', 'Breathe', 'Acknowledge progress']
        }
    };

    // Customize based on identity text
    const base = templates[identityType] || templates['SKILL'];

    if (idLower.includes('write')) {
        return {
            high: ['Write for 15 min', 'Edit 1 paragraph', 'Outline next piece'],
            medium: ['Write 1 sentence', 'Read for 5 min', 'Brainstorm ideas'],
            low: ['Open document', 'Read last sentence', 'Think about writing']
        };
    }

    if (idLower.includes('exercise') || idLower.includes('fit') || idLower.includes('run')) {
        return {
            high: ['Workout for 15 min', 'Go for a walk', 'Stretch routine'],
            medium: ['5 min movement', '10 pushups', 'Walk around block'],
            low: ['Put on workout shoes', 'Stand up', 'Stretch for 1 min']
        };
    }

    if (idLower.includes('read')) {
        return {
            high: ['Read for 20 min', 'Finish 1 chapter', 'Take notes'],
            medium: ['Read 5 pages', 'Highlight key ideas', 'Review bookmarks'],
            low: ['Open book', 'Read 1 page', 'Pick up book']
        };
    }

    return base;
}

type WeeklyPersona = 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';

/**
 * PERSONA-AWARE EVOLUTION OPTIONS GENERATOR
 * Returns an array of options based on persona + stage
 */
export function generatePersonaEvolutionOptions(
    persona: WeeklyPersona,
    stage: IdentityStage,
    identity: string,
    consecutiveGhostWeeks: number = 0,
    consecutiveDifficultyUps: number = 0
): EvolutionOption[] {
    switch (persona) {
        case 'TITAN':
            return getTitanOptions(stage, identity, consecutiveDifficultyUps);
        case 'GRINDER':
            return getGrinderOptions(stage);
        case 'SURVIVOR':
            return getSurvivorOptions(stage);
        case 'GHOST':
            return getGhostOptions(identity, consecutiveGhostWeeks);
    }
}

// === TITAN: Crushing it - Push harder ===
function getTitanOptions(stage: IdentityStage, identity: string, consecutiveDifficultyUps: number = 0): EvolutionOption[] {
    const options: EvolutionOption[] = [];

    // 🛡️ TITAN SATURATION: After 3 consecutive difficulty increases, replace it with variation
    if (consecutiveDifficultyUps >= 3) {
        if (import.meta.env.DEV) console.log("🏆 [TITAN SATURATION] Max difficulty reached - offering variation instead");
        options.push({
            id: 'VARIATION_WEEK',
            label: '🔄 Variation Week',
            description: 'You\'ve pushed hard 3 weeks in a row. Same intensity, new angles.',
            impact: { difficultyAdjustment: 0 }
        });
    } else {
        options.push({
            id: 'INCREASE_DIFFICULTY',
            label: 'Level Up',
            description: 'Increase habit intensity by 15-25%. You\'re ready.',
            impact: { difficultyAdjustment: 1 }
        });
    }

    options.push(
        {
            id: 'ADD_VARIATION',
            label: 'Add Variation',
            description: 'Same difficulty, new angles. Keep it fresh.',
            impact: { difficultyAdjustment: 0 }
        },
        {
            id: 'START_MASTERY_WEEK',
            label: 'Mastery Week',
            description: 'Focus on perfecting technique, not just showing up.',
            impact: { difficultyAdjustment: 0 }
        }
    );

    // At EXPANSION or MAINTENANCE, offer identity branching
    if (stage === 'EXPANSION' || stage === 'MAINTENANCE') {
        options.push({
            id: 'BRANCH_IDENTITY',
            label: 'Branch Out',
            description: `Expand "${identity}" into new territory.`,
            impact: { difficultyAdjustment: 0 }
        });
    }

    return options;
}

// === GRINDER: Consistent but might burn out ===
function getGrinderOptions(stage: IdentityStage): EvolutionOption[] {
    return [
        {
            id: 'MAINTAIN',
            label: 'Keep This Pace',
            description: 'You\'re in a good rhythm. Don\'t fix what works.',
            impact: { difficultyAdjustment: 0 }
        },
        {
            id: 'TECHNIQUE_WEEK',
            label: 'Technique Focus',
            description: 'Same habits, but focus on doing them better.',
            impact: { difficultyAdjustment: 0 }
        },
        {
            id: 'SOFTER_HABIT',
            label: 'Ease Up a Bit',
            description: 'Reduce intensity to prevent burnout.',
            impact: { difficultyAdjustment: -1 }
        },
        {
            id: 'REDUCE_SCOPE',
            label: 'Simplify',
            description: 'Keep only 2 habits. Quality over quantity.',
            impact: { difficultyAdjustment: -1 }
        }
    ];
}

// === SURVIVOR: Hanging on ===
function getSurvivorOptions(stage: IdentityStage): EvolutionOption[] {
    return [
        {
            id: 'MAINTAIN',
            label: 'Keep Showing Up',
            description: 'You\'re here. That\'s what matters right now.',
            impact: { difficultyAdjustment: 0 }
        },
        {
            id: 'SOFTER_HABIT',
            label: 'Make It Easier',
            description: 'Reduce friction. Even tiny counts.',
            impact: { difficultyAdjustment: -1 }
        },
        {
            id: 'REST_WEEK',
            label: 'Rest Week',
            description: 'Reduce by 30%. You need to recharge.',
            impact: { difficultyAdjustment: -1 }
        },
        {
            id: 'REDUCE_DIFFICULTY',
            label: 'Minimal Mode',
            description: 'Only low-energy habits this week.',
            impact: { difficultyAdjustment: -2 }
        }
    ];
}

// === GHOST: Needs recovery - special compassionate options ===
function getGhostOptions(identity: string, consecutiveGhostWeeks: number = 0): EvolutionOption[] {
    // 🛡️ GHOST LOOP PROTECTION: After 2 consecutive ghost weeks, offer Atomic Rescue
    if (consecutiveGhostWeeks >= 2) {
        if (import.meta.env.DEV) console.log("👻 [ATOMIC RESCUE] Offering rescue options for user in ghost loop");
        return [
            {
                id: 'ATOMIC_RESCUE',
                label: '🆘 Atomic Rescue',
                description: 'Just ONE tiny habit this week. We reset the pressure, not your identity.',
                impact: { difficultyAdjustment: -2, isRescueMode: true }
            },
            {
                id: 'SOFTER_WEEK',
                label: '🛋️ Softer Week',
                description: 'Ultra-gentle habits. Focus on stability.',
                impact: { difficultyAdjustment: -2 }
            },
            {
                id: 'REDUCE_DIFFICULTY',
                label: '📉 Minimal Mode',
                description: 'Only the easiest habits. No pressure.',
                impact: { difficultyAdjustment: -2 }
            }
        ];
    }

    // Standard GHOST options (Fresh Start available for first-time ghosts)
    // Note: CHANGE_IDENTITY is handled by separate UI button for all personas
    return [
        {
            id: 'FRESH_START_WEEK',
            label: '🌱 Fresh Start',
            description: 'Wipe the slate. Begin again with no judgment.',
            impact: { stageChange: 'INITIATION', difficultyAdjustment: -2, isFreshStart: true }
        },
        {
            id: 'SOFTER_WEEK',
            label: '🛋️ Softer Week',
            description: 'Ultra-gentle habits. Just exist.',
            impact: { difficultyAdjustment: -2 }
        },
        {
            id: 'REDUCE_DIFFICULTY',
            label: '📉 Reduce Everything',
            description: 'Minimum viable habits only.',
            impact: { difficultyAdjustment: -2 }
        }
    ];
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
