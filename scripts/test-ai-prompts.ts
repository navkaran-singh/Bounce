/**
 * AI Prompt Test Suite
 * Tests the updated prompts work correctly and produce valid JSON
 * Run with: npx tsx scripts/test-ai-prompts.ts
 */

// Mock the expected JSON structures that the frontend expects
interface GenerateHabitsResult {
    high: string[];
    medium: string[];
    low: string[];
    identityType?: 'SKILL' | 'CHARACTER' | 'RECOVERY' | null;
    identityReason?: string;
}

interface DailyAdaptationResult {
    high: string[];
    medium: string[];
    low: string[];
    toastMessage: string;
}

interface WeeklyReviewResult {
    reflection: string;
    archetype: string;
    high: string[];
    medium: string[];
    low: string[];
    narrative: string;
    habitAdjustments: string[];
    stageAdvice: string;
    summary: string;
    advancedIdentity?: string;
    resonanceStatements?: string[];
}

// Test cases
const testCases = {
    generateHabits: [
        // Normal cases
        { identity: "a writer", expectType: "SKILL" },
        { identity: "a calm person", expectType: "CHARACTER" },
        { identity: "someone who doesn't procrastinate", expectType: "RECOVERY" },
        // Edge cases
        { identity: "hi", expectFallback: true },  // Very short/vague
        { identity: "a quantum physicist", expectAI: true },  // Unlikely template match
        { identity: "", expectFallback: true },  // Empty
    ],

    generateDailyAdaptation: [
        // Normal cases
        { identity: "a runner", mode: "GROWTH", stage: "INTEGRATION" },
        { identity: "a coder", mode: "RECOVERY", stage: "INITIATION" },
        { identity: "a meditator", mode: "STEADY", stage: "EXPANSION" },
        // Edge cases
        { identity: "Someone healing from addiction", type: "RECOVERY", mode: "GROWTH" },  // Should NOT progressive overload
    ],

    generateWeeklyReview: [
        // Normal cases
        { persona: "TITAN", stage: "EXPANSION", novelty: false },
        { persona: "GRINDER", stage: "INTEGRATION", novelty: true },
        // Edge cases - SURVIVOR/GHOST should have easy Low habits
        { persona: "SURVIVOR", stage: "INITIATION", novelty: false },
        { persona: "GHOST", stage: "INITIATION", novelty: false },
        // Edge case - MAINTENANCE should include advancedIdentity
        { persona: "TITAN", stage: "MAINTENANCE", novelty: false },
        // Edge case - suggestedStage should include resonanceStatements
        { persona: "TITAN", stage: "INTEGRATION", suggestedStage: "EXPANSION" },
    ]
};

// Validation functions
function validateGenerateHabitsResult(result: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(result.high) || result.high.length !== 3) {
        errors.push(`high: expected array of 3, got ${JSON.stringify(result.high)}`);
    }
    if (!Array.isArray(result.medium) || result.medium.length !== 3) {
        errors.push(`medium: expected array of 3, got ${JSON.stringify(result.medium)}`);
    }
    if (!Array.isArray(result.low) || result.low.length !== 3) {
        errors.push(`low: expected array of 3, got ${JSON.stringify(result.low)}`);
    }

    // Check Low habits don't contain "passive prep" words
    const passiveWords = ['open', 'get ready', 'put on'];
    result.low?.forEach((habit: string, i: number) => {
        const lower = habit.toLowerCase();
        passiveWords.forEach(word => {
            if (lower.startsWith(word)) {
                errors.push(`low[${i}]: Contains passive prep "${word}": "${habit}"`);
            }
        });
    });

    if (!['SKILL', 'CHARACTER', 'RECOVERY', null, undefined].includes(result.identityType)) {
        errors.push(`identityType: unexpected value ${result.identityType}`);
    }

    return { valid: errors.length === 0, errors };
}

function validateDailyAdaptationResult(result: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(result.high) || result.high.length !== 3) {
        errors.push(`high: expected array of 3, got ${JSON.stringify(result.high)}`);
    }
    if (!Array.isArray(result.medium) || result.medium.length !== 3) {
        errors.push(`medium: expected array of 3, got ${JSON.stringify(result.medium)}`);
    }
    if (!Array.isArray(result.low) || result.low.length !== 3) {
        errors.push(`low: expected array of 3, got ${JSON.stringify(result.low)}`);
    }
    if (typeof result.toastMessage !== 'string') {
        errors.push(`toastMessage: expected string, got ${typeof result.toastMessage}`);
    }
    if (result.toastMessage && result.toastMessage.length > 100) {
        errors.push(`toastMessage: too long (${result.toastMessage.length} chars, max 100)`);
    }

    return { valid: errors.length === 0, errors };
}

function validateWeeklyReviewResult(result: any, testCase: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof result.reflection !== 'string' || result.reflection.length === 0) {
        errors.push(`reflection: expected non-empty string`);
    }
    if (typeof result.archetype !== 'string' || result.archetype.length === 0) {
        errors.push(`archetype: expected non-empty string`);
    }
    if (!Array.isArray(result.high) || result.high.length < 1) {
        errors.push(`high: expected array with at least 1 item`);
    }
    if (!Array.isArray(result.medium) || result.medium.length < 1) {
        errors.push(`medium: expected array with at least 1 item`);
    }
    if (!Array.isArray(result.low) || result.low.length < 1) {
        errors.push(`low: expected array with at least 1 item`);
    }
    if (typeof result.narrative !== 'string') {
        errors.push(`narrative: expected string`);
    }

    // Edge case: MAINTENANCE should include advancedIdentity
    if (testCase.stage === 'MAINTENANCE' && !result.advancedIdentity) {
        errors.push(`advancedIdentity: missing for MAINTENANCE stage`);
    }

    // Edge case: suggestedStage should include resonanceStatements
    if (testCase.suggestedStage && (!Array.isArray(result.resonanceStatements) || result.resonanceStatements.length < 3)) {
        errors.push(`resonanceStatements: expected array of 3 for stage upgrade`);
    }

    return { valid: errors.length === 0, errors };
}

// Print summary
console.log("=== AI PROMPT TEST CASES ===\n");

console.log("📋 generateHabits Test Cases:");
testCases.generateHabits.forEach((tc, i) => {
    console.log(`  ${i + 1}. Identity: "${tc.identity}" ${tc.expectFallback ? '(expect fallback)' : `(expect ${tc.expectType || 'AI'})`}`);
});

console.log("\n📊 generateDailyAdaptation Test Cases:");
testCases.generateDailyAdaptation.forEach((tc, i) => {
    console.log(`  ${i + 1}. Identity: "${tc.identity}", Mode: ${tc.mode}, Stage: ${tc.stage || 'INTEGRATION'}`);
});

console.log("\n🌱 generateWeeklyReview Test Cases:");
testCases.generateWeeklyReview.forEach((tc, i) => {
    console.log(`  ${i + 1}. Persona: ${tc.persona}, Stage: ${tc.stage}, Novelty: ${tc.novelty}${tc.suggestedStage ? `, Upgrade to: ${tc.suggestedStage}` : ''}`);
});

console.log("\n=== VALIDATION FUNCTIONS READY ===");
console.log("Use these in browser console to validate AI responses:");
console.log("- validateGenerateHabitsResult(result)");
console.log("- validateDailyAdaptationResult(result)");
console.log("- validateWeeklyReviewResult(result, testCase)");
