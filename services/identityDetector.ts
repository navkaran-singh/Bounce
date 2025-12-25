/**
 * Identity Detector - Local Fallback for Identity Classification
 * 
 * Used when:
 * - AI output is missing/invalid
 * - User edits identity later
 * - Mixed/ambiguous goals need classification
 * 
 * This is a lightweight heuristic, not a replacement for AI classification.
 */

import { IdentityType } from '../types';

// Keywords indicating RECOVERY identity (stop/reduce/fix something)
const RECOVERY_KEYWORDS = [
    'stop', 'reduce', 'quit', 'break', 'fix', 'control',
    'avoid', 'less', 'cut', 'recover', 'overcome', 'end',
    'no more', 'get rid', 'eliminate', 'limit', 'manage'
];

// Patterns indicating CHARACTER identity (be/become + adjective)
const CHARACTER_PATTERNS = [
    /^be\s+(more\s+)?(\w+)/i,           // "be calm", "be more patient"
    /^become\s+(a\s+|an\s+)?(\w+)/i,    // "become disciplined", "become a leader"
    /^stay\s+(\w+)/i,                    // "stay focused"
    /^remain\s+(\w+)/i,                  // "remain calm"
];

// Verbs indicating SKILL identity (get better at something)
const SKILL_VERBS = [
    'run', 'throw', 'lift', 'write', 'code', 'play', 'practice',
    'study', 'learn', 'read', 'speak', 'cook', 'build', 'draw',
    'paint', 'swim', 'dance', 'sing', 'design', 'develop',
    'program', 'train', 'improve', 'master', 'perfect'
];

/**
 * Detect identity type from identity string and habits
 * Returns null if detection is ambiguous/uncertain (let weekly review ask)
 */
export function detectIdentityType(
    identity: string,
    habits: string[] = []
): IdentityType | null {
    const identityLower = identity.toLowerCase().trim();
    const habitsLower = habits.map(h => h.toLowerCase());
    const allText = [identityLower, ...habitsLower].join(' ');

    // PRIORITY 1: Check for RECOVERY keywords (most specific)
    const hasRecoveryKeyword = RECOVERY_KEYWORDS.some(keyword =>
        identityLower.includes(keyword)
    );
    if (hasRecoveryKeyword) {
        if (import.meta.env.DEV) console.log('🔍 [DETECTOR] Detected RECOVERY identity:', identity);
        return 'RECOVERY';
    }

    // PRIORITY 2: Check for CHARACTER patterns (be/become + adjective)
    const matchesCharacterPattern = CHARACTER_PATTERNS.some(pattern =>
        pattern.test(identityLower)
    );
    if (matchesCharacterPattern) {
        if (import.meta.env.DEV) console.log('🔍 [DETECTOR] Detected CHARACTER identity:', identity);
        return 'CHARACTER';
    }

    // PRIORITY 3: Check for SKILL verbs in identity or habits
    const hasSkillVerb = SKILL_VERBS.some(verb =>
        allText.includes(verb)
    );
    if (hasSkillVerb) {
        if (import.meta.env.DEV) console.log('🔍 [DETECTOR] Detected SKILL identity:', identity);
        return 'SKILL';
    }

    // Ambiguous - return null, let weekly review clarify
    if (import.meta.env.DEV) console.log('🔍 [DETECTOR] Could not detect identity type for:', identity);
    return null;
}

/**
 * Get friendly label for identity type
 */
export function getIdentityTypeLabel(type: IdentityType): string {
    switch (type) {
        case 'SKILL': return 'Learning a Skill';
        case 'CHARACTER': return 'Becoming a Type of Person';
        case 'RECOVERY': return 'Recovering from Something';
    }
}

/**
 * Get emoji for identity type
 */
export function getIdentityTypeEmoji(type: IdentityType): string {
    switch (type) {
        case 'SKILL': return '🎯';
        case 'CHARACTER': return '🧘';
        case 'RECOVERY': return '🌱';
    }
}
