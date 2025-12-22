/**
 * Payment System Test Harness
 * 
 * Automated edge-case tests for subscription/payment logic.
 * Uses the SAME pure functions as production to ensure behavior consistency.
 * 
 * Run: npx tsx tests/payment-test-harness.ts
 */

import {
    DodoSubscriptionData,
    UserSubscriptionState,
    WebhookPayload,
    calculateExpiryFromDodo,
    determineEffectiveStatus,
    computeSubscriptionUpdate,
    checkLocalExpiry,
    shouldSkipDueToCooldown,
    computeWebhookUpdate,
    checkInvariants,
    InvariantResult
} from '../services/subscription-logic';

// ============================================
// TEST INFRASTRUCTURE
// ============================================

let testsPassed = 0;
let testsFailed = 0;
const failures: string[] = [];

function test(name: string, fn: () => boolean | void): void {
    try {
        const result = fn();
        if (result === false) {
            testsFailed++;
            failures.push(name);
            console.log(`❌ [FAIL] ${name}`);
        } else {
            testsPassed++;
            console.log(`✅ [PASS] ${name}`);
        }
    } catch (error: any) {
        testsFailed++;
        failures.push(name);
        console.log(`❌ [FAIL] ${name} - Exception: ${error.message}`);
    }
}

function assertEqual<T>(actual: T, expected: T, msg: string): boolean {
    if (actual !== expected) {
        console.log(`   → Expected: ${expected}, Got: ${actual} (${msg})`);
        return false;
    }
    return true;
}

function assertTrue(condition: boolean, msg: string): boolean {
    if (!condition) {
        console.log(`   → Assertion failed: ${msg}`);
        return false;
    }
    return true;
}

// ============================================
// MOCK HELPERS
// ============================================

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const SIX_HOURS = 6 * HOUR_MS;

function createMockState(overrides: Partial<UserSubscriptionState> = {}): UserSubscriptionState {
    return {
        isPremium: false,
        premiumExpiryDate: null,
        subscriptionStatus: null,
        subscriptionId: null,
        lastSubscriptionCheck: null,
        ...overrides
    };
}

function createMockDodo(overrides: Partial<DodoSubscriptionData> = {}): DodoSubscriptionData {
    return {
        status: 'active',
        next_billing_date: null,
        current_period_end: null,
        cancelled_at: null,
        cancel_at_next_billing_date: false,
        ...overrides
    };
}

function toISOString(ms: number): string {
    return new Date(ms).toISOString();
}

// ============================================
// INVARIANT TESTS
// ============================================

console.log('\n=== INVARIANT TESTS ===\n');

test('INV_001: Expired subscription must have isPremium=false', () => {
    const now = Date.now();
    const expiredState = createMockState({
        isPremium: true, // Wrong! Should be false
        premiumExpiryDate: now - DAY_MS, // Expired yesterday
        subscriptionStatus: 'active'
    });

    const results = checkInvariants(expiredState, now);
    const inv001 = results.find(r => r.name === 'INV_001');
    return inv001 ? !inv001.passed : false; // Should FAIL the invariant
});

test('INV_001: checkLocalExpiry corrects expired state', () => {
    const now = Date.now();
    const state = createMockState({
        isPremium: true,
        premiumExpiryDate: now - DAY_MS,
        subscriptionStatus: 'active'
    });

    const { shouldRevoke, newState } = checkLocalExpiry(state, now);
    return shouldRevoke === true && newState.isPremium === false;
});

test('INV_002: Cancelled but not expired must have isPremium=true', () => {
    const now = Date.now();
    const cancelledState = createMockState({
        isPremium: true,
        premiumExpiryDate: now + DAY_MS, // Expires tomorrow
        subscriptionStatus: 'cancelled',
        subscriptionId: 'sub_test'
    });

    const results = checkInvariants(cancelledState, now);
    const inv002 = results.find(r => r.name === 'INV_002');
    return inv002 ? inv002.passed : true;
});

test('INV_003: Active subscription expiry matches next_billing_date', () => {
    const now = Date.now();
    const nextBilling = now + 30 * DAY_MS;

    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: toISOString(nextBilling)
    });

    const expiry = calculateExpiryFromDodo(dodo);
    return assertEqual(expiry, nextBilling, 'expiry should match next_billing_date');
});

test('INV_004: Expiry should use current_period_end as fallback', () => {
    const now = Date.now();
    const periodEnd = now + 7 * DAY_MS;

    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: null,
        current_period_end: toISOString(periodEnd)
    });

    const expiry = calculateExpiryFromDodo(dodo);
    return assertEqual(expiry, periodEnd, 'expiry should use current_period_end');
});

test('INV_005: No billing date uses fallback days', () => {
    const now = Date.now();
    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: null,
        current_period_end: null,
        billing_interval_count: undefined
    });

    const expiry = calculateExpiryFromDodo(dodo);
    // Should fallback to 30 days
    const expectedMin = now + 29 * DAY_MS;
    const expectedMax = now + 31 * DAY_MS;
    return expiry !== null && expiry > expectedMin && expiry < expectedMax;
});

// ============================================
// EDGE CASE TESTS
// ============================================

console.log('\n=== EDGE CASE TESTS ===\n');

test('EDGE_001: Cooldown active while expiry passes', () => {
    const now = Date.now();
    const state = createMockState({
        isPremium: true,
        premiumExpiryDate: now - HOUR_MS, // Expired 1 hour ago
        subscriptionStatus: 'cancelled',
        lastSubscriptionCheck: now - 2 * HOUR_MS // Checked 2 hours ago (within cooldown)
    });

    // Cooldown should be active
    const cooldownActive = shouldSkipDueToCooldown(state.lastSubscriptionCheck, SIX_HOURS, now);
    if (!cooldownActive) return false;

    // But local expiry check should still revoke
    const { shouldRevoke } = checkLocalExpiry(state, now);
    return shouldRevoke === true;
});

test('EDGE_002: Webhook missed, check-subscription recovers', () => {
    const now = Date.now();
    const nextBilling = now + 30 * DAY_MS;

    // State: user was premium, expired, never got webhook
    const state = createMockState({
        isPremium: false,
        premiumExpiryDate: now - DAY_MS,
        subscriptionStatus: 'expired'
    });

    // Dodo says actually renewed!
    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: toISOString(nextBilling)
    });

    const result = computeSubscriptionUpdate(state, dodo, now);
    return result.shouldWrite === true &&
        result.newState.isPremium === true &&
        result.newState.premiumExpiryDate === nextBilling;
});

test('EDGE_003: Cancel at period end', () => {
    const dodo = createMockDodo({
        status: 'active', // Still active!
        next_billing_date: toISOString(Date.now() + 10 * DAY_MS),
        cancel_at_next_billing_date: true
    });

    const effectiveStatus = determineEffectiveStatus(dodo);
    return assertEqual(effectiveStatus, 'cancelled', 'cancel_at_next_billing_date should mean cancelled');
});

test('EDGE_004: Immediate cancel', () => {
    const dodo = createMockDodo({
        status: 'cancelled',
        cancelled_at: toISOString(Date.now())
    });

    const effectiveStatus = determineEffectiveStatus(dodo);
    return assertEqual(effectiveStatus, 'cancelled', 'cancelled_at should mean cancelled');
});

test('EDGE_005: Auto-renew success', () => {
    const now = Date.now();
    const oldExpiry = now - DAY_MS;
    const newExpiry = now + 30 * DAY_MS;

    const state = createMockState({
        isPremium: true,
        premiumExpiryDate: oldExpiry,
        subscriptionStatus: 'active'
    });

    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: toISOString(newExpiry)
    });

    const result = computeSubscriptionUpdate(state, dodo, now);
    return result.shouldWrite === true &&
        result.newState.premiumExpiryDate === newExpiry;
});

test('EDGE_006: Auto-renew failure (on_hold)', () => {
    const dodo = createMockDodo({
        status: 'on_hold'
    });

    const effectiveStatus = determineEffectiveStatus(dodo);
    return assertEqual(effectiveStatus, 'cancelled', 'on_hold should be treated as cancelled');
});

test('EDGE_007: Duplicate webhook events should produce same state', () => {
    const now = Date.now();
    const state = createMockState();

    const webhook: WebhookPayload = {
        type: 'subscription.active',
        subscription_id: 'sub_test',
        next_billing_date: toISOString(now + 30 * DAY_MS)
    };

    const result1 = computeWebhookUpdate(state, webhook, now);
    const stateAfterFirst: UserSubscriptionState = { ...state, ...result1 };
    const result2 = computeWebhookUpdate(stateAfterFirst, webhook, now);

    // Second call should produce same expiry
    return assertEqual(result1.premiumExpiryDate, result2.premiumExpiryDate, 'duplicate webhook same expiry');
});

test('EDGE_008: Out-of-order events (renew after cancel)', () => {
    const now = Date.now();
    const state = createMockState();

    // First: cancel arrives
    const cancelWebhook: WebhookPayload = {
        type: 'subscription.cancelled',
        subscription_id: 'sub_test'
    };
    const afterCancel = { ...state, ...computeWebhookUpdate(state, cancelWebhook, now) };

    // Then: late renew arrives (from before cancel)
    const renewWebhook: WebhookPayload = {
        type: 'subscription.active',
        subscription_id: 'sub_test',
        next_billing_date: toISOString(now + 30 * DAY_MS)
    };
    const afterRenew = { ...afterCancel, ...computeWebhookUpdate(afterCancel, renewWebhook, now) };

    // Should be active (later event wins in this simple model)
    return assertEqual(afterRenew.subscriptionStatus, 'active', 'late renew sets active');
});

test('EDGE_009: No changes = no write', () => {
    const now = Date.now();
    const expiry = now + 30 * DAY_MS;

    const state = createMockState({
        isPremium: true,
        premiumExpiryDate: expiry,
        subscriptionStatus: 'active'
    });

    const dodo = createMockDodo({
        status: 'active',
        next_billing_date: toISOString(expiry)
    });

    const result = computeSubscriptionUpdate(state, dodo, now);
    return result.shouldWrite === false;
});

test('EDGE_010: Cooldown respects 6-hour window', () => {
    const now = Date.now();

    // Just checked
    assertTrue(
        shouldSkipDueToCooldown(now - HOUR_MS, SIX_HOURS, now) === true,
        '1 hour ago should skip'
    );

    // Checked 7 hours ago
    assertTrue(
        shouldSkipDueToCooldown(now - 7 * HOUR_MS, SIX_HOURS, now) === false,
        '7 hours ago should not skip'
    );

    // Never checked
    return shouldSkipDueToCooldown(null, SIX_HOURS, now) === false;
});

// ============================================
// RESULTS
// ============================================

console.log('\n=== RESULTS ===\n');
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  - ${f}`));
}

process.exit(testsFailed > 0 ? 1 : 0);
