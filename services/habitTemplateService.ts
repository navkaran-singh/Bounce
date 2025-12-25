/**
 * HABIT TEMPLATE SERVICE
 * Provides template-based habit generation from habitTemplates.json
 * 🛡️ COST SAFETY: Replaces AI calls with pre-defined templates
 */

import habitTemplatesData from '../data/habitTemplates.json';
import { IdentityType } from '../types';

// Type definitions for the JSON structure
interface HabitSet {
    high: string[];
    medium: string[];
    low: string[];
}

interface HabitTemplate {
    identityType: IdentityType;
    displayName: string;
    keywords: string[];
    habits: HabitSet;
}

interface HabitTemplates {
    version: string;
    templates: {
        SKILL: Record<string, HabitTemplate>;
        CHARACTER: Record<string, HabitTemplate>;
        RECOVERY: Record<string, HabitTemplate>;
    };
    fallback: HabitSet;
}

// Cast the imported JSON to our type
const habitTemplates = habitTemplatesData as HabitTemplates;

/**
 * Find the best matching template for a given identity string
 * Uses keyword matching to find the most relevant template
 */
export function findHabitTemplate(identity: string): {
    template: HabitTemplate | null;
    identityType: IdentityType | null;
    matchedKeyword: string | null;
} {
    const normalizedIdentity = identity.toLowerCase().trim();

    // Search through all identity types
    for (const type of ['SKILL', 'CHARACTER', 'RECOVERY'] as const) {
        const templates = habitTemplates.templates[type];

        for (const [key, template] of Object.entries(templates)) {
            // Check if any keyword matches
            for (const keyword of template.keywords) {
                if (normalizedIdentity.includes(keyword.toLowerCase())) {
                    if (import.meta.env.DEV) console.log(`📋 [TEMPLATE] Found match: "${key}" via keyword "${keyword}"`);
                    return {
                        template,
                        identityType: type,
                        matchedKeyword: keyword
                    };
                }
            }
        }
    }

    if (import.meta.env.DEV) console.log(`📋 [TEMPLATE] No match found for: "${identity}"`);
    return {
        template: null,
        identityType: null,
        matchedKeyword: null
    };
}

/**
 * Get habits from template, with fallback if no match found
 */
export function getHabitsFromTemplate(identity: string): {
    high: string[];
    medium: string[];
    low: string[];
    identityType: IdentityType | null;
    identityReason: string;
    isTemplateMatch: boolean;
} {
    const { template, identityType, matchedKeyword } = findHabitTemplate(identity);

    if (template) {
        if (import.meta.env.DEV) console.log(`📋 [TEMPLATE] Using template: ${template.displayName} (${identityType})`);
        return {
            high: [...template.habits.high],
            medium: [...template.habits.medium],
            low: [...template.habits.low],
            identityType,
            identityReason: `Matched template "${template.displayName}" via keyword "${matchedKeyword}"`,
            isTemplateMatch: true
        };
    }

    // Return fallback habits if no template match
    if (import.meta.env.DEV) console.log(`📋 [TEMPLATE] Using fallback habits`);
    return {
        high: [...habitTemplates.fallback.high],
        medium: [...habitTemplates.fallback.medium],
        low: [...habitTemplates.fallback.low],
        identityType: null,
        identityReason: 'No matching template found - using general fallback',
        isTemplateMatch: false
    };
}

/**
 * Check if a template exists for the given identity
 */
export function hasTemplateMatch(identity: string): boolean {
    const { template } = findHabitTemplate(identity);
    return template !== null;
}

/**
 * Get all available template keywords (useful for debugging)
 */
export function getAllTemplateKeywords(): string[] {
    const keywords: string[] = [];

    for (const type of ['SKILL', 'CHARACTER', 'RECOVERY'] as const) {
        const templates = habitTemplates.templates[type];
        for (const template of Object.values(templates)) {
            keywords.push(...template.keywords);
        }
    }

    return keywords;
}
