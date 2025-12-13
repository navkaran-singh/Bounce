/**
 * Resonance Templates v8
 * 
 * First-person statements that help free users confirm stage readiness
 * These are shown during weekly review when a stage upgrade is suggested
 */

import { IdentityStage } from '../types';

export const RESONANCE_TEMPLATES: Record<IdentityStage, string[]> = {
    // INITIATION has no resonance statements (auto-promote to INTEGRATION)
    'INITIATION': [],

    // INTEGRATION → Ready to move to EXPANSION
    'INTEGRATION': [
        "It's starting to feel easier.",
        "I remember to do it more often now.",
        "I'm figuring out a rhythm.",
        "This doesn't feel as heavy anymore.",
        "I notice when I skip it."
    ],

    // EXPANSION → Ready to move to MAINTENANCE
    'EXPANSION': [
        "The routine feels manageable now.",
        "I feel curious about pushing a little further.",
        "I think I can handle more.",
        "This feels too easy lately.",
        "I'm ready for a new challenge."
    ],

    // MAINTENANCE → Already at final stage
    'MAINTENANCE': [
        "This is just part of who I am now.",
        "I don't need willpower anymore.",
        "It feels weird not doing this.",
        "This identity feels stable.",
        "I don't think about this much anymore."
    ]
};

/**
 * Get random resonance statements for a stage
 * 
 * @param stage The stage user is being promoted TO
 * @param count Number of statements to return (default 3)
 * @returns Array of resonance statement strings
 */
export function getRandomResonanceStatements(
    stage: IdentityStage,
    count: number = 3
): string[] {
    const templates = RESONANCE_TEMPLATES[stage];

    if (!templates || templates.length === 0) {
        return [];
    }

    // Shuffle and take first N
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, templates.length));
}
