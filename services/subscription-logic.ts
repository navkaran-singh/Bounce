/**
 * Subscription Logic - Pure Functions
 * 
 * These functions contain the core business logic for subscription handling.
 * They are used by both:
 * - Production code (check-subscription.ts, webhook.ts, store.ts)
 * - Test harness (payment-test-harness.ts)
 * 
 * CRITICAL: Any changes here affect both production AND tests.
 * This ensures behavior cannot diverge.
 */

// ============================================
// TYPES
// ============================================

export interface DodoSubscriptionData {
    status: 'active' | 'cancelled' | 'expired' | 'on_hold' | 'paused';
    next_billing_date?: string | null;
    current_period_end?: string | null;
    cancelled_at?: string | null;
    cancel_at_next_billing_date?: boolean;
    billing_interval_count?: number;
}

export interface UserSubscriptionState {
    isPremium: boolean;
    premiumExpiryDate: number | null;
    subscriptionStatus: 'active' | 'cancelled' | 'expired' | null;
    subscriptionId: string | null;
    lastSubscriptionCheck: number | null;
}

export interface SubscriptionUpdateResult {
    shouldWrite: boolean;
    newState: Partial<UserSubscriptionState>;
    reason: string;
}

// ============================================
// PURE FUNCTIONS - EXPIRY CALCULATION
// ============================================

/**
 * Calculate premium expiry date from Dodo subscription data.
 * Returns null if no valid date can be determined.
 */
export function calculateExpiryFromDodo(
    dodoData: DodoSubscriptionData,
    fallbackDays: number = 30
): number | null {
    if (dodoData.next_billing_date) {
        return new Date(dodoData.next_billing_date).getTime();
    }
    if (dodoData.current_period_end) {
        return new Date(dodoData.current_period_end).getTime();
    }
    // Fallback: use billing interval if available
    if (dodoData.billing_interval_count) {
        return Date.now() + (dodoData.billing_interval_count * 24 * 60 * 60 * 1000);
    }
    // Last resort fallback
    return Date.now() + (fallbackDays * 24 * 60 * 60 * 1000);
}

/**
 * Determine effective subscription status considering scheduled cancellations.
 * Dodo returns status='active' even for scheduled cancellations.
 */
export function determineEffectiveStatus(
    dodoData: DodoSubscriptionData
): 'active' | 'cancelled' | 'expired' {
    // Check if scheduled for cancellation
    if (dodoData.cancelled_at || dodoData.cancel_at_next_billing_date) {
        return 'cancelled';
    }

    if (dodoData.status === 'cancelled' || dodoData.status === 'expired') {
        return dodoData.status;
    }

    if (dodoData.status === 'on_hold' || dodoData.status === 'paused') {
        return 'cancelled'; // Treat as cancelled for UI purposes
    }

    return 'active';
}

// ============================================
// PURE FUNCTIONS - STATE TRANSITIONS
// ============================================

/**
 * Determine if a subscription check should write to database.
 * Returns the new state and whether a write is needed.
 */
export function computeSubscriptionUpdate(
    currentState: UserSubscriptionState,
    dodoData: DodoSubscriptionData,
    now: number = Date.now()
): SubscriptionUpdateResult {
    const newExpiryDate = calculateExpiryFromDodo(dodoData);
    const effectiveStatus = determineEffectiveStatus(dodoData);

    const expiryChanged = currentState.premiumExpiryDate !== newExpiryDate;
    const statusChanged = currentState.subscriptionStatus !== effectiveStatus;

    if (!expiryChanged && !statusChanged) {
        return {
            shouldWrite: false,
            newState: { lastSubscriptionCheck: now },
            reason: 'No changes detected'
        };
    }

    // Invariant: expiry should never move backwards (unless clearing)
    if (
        newExpiryDate !== null &&
        currentState.premiumExpiryDate !== null &&
        newExpiryDate < currentState.premiumExpiryDate
    ) {
        console.warn('⚠️ [LOGIC] Attempted to move expiry backwards - allowing Dodo authority');
        // We still allow it because Dodo is the source of truth
    }

    return {
        shouldWrite: true,
        newState: {
            isPremium: true,
            premiumExpiryDate: newExpiryDate,
            subscriptionStatus: effectiveStatus,
            lastSubscriptionCheck: now
        },
        reason: `expiry changed: ${expiryChanged}, status changed: ${statusChanged}`
    };
}

/**
 * Check if premium should be revoked based on expiry.
 * This runs on client even during cooldown.
 */
export function checkLocalExpiry(
    state: UserSubscriptionState,
    now: number = Date.now()
): { shouldRevoke: boolean; newState: Partial<UserSubscriptionState> } {
    if (state.isPremium && state.premiumExpiryDate && now > state.premiumExpiryDate) {
        return {
            shouldRevoke: true,
            newState: {
                isPremium: false,
                subscriptionStatus: 'expired'
            }
        };
    }
    return { shouldRevoke: false, newState: {} };
}

/**
 * Determine if cooldown should skip the subscription check.
 */
export function shouldSkipDueToCooldown(
    lastCheck: number | null,
    cooldownMs: number,
    now: number = Date.now()
): boolean {
    if (!lastCheck) return false;
    return (now - lastCheck) < cooldownMs;
}

// ============================================
// PURE FUNCTIONS - WEBHOOK HANDLING
// ============================================

export type WebhookEventType =
    | 'payment.succeeded'
    | 'subscription.active'
    | 'subscription.created'
    | 'subscription.cancelled'
    | 'subscription.expired'
    | 'subscription.payment_failed';

export interface WebhookPayload {
    type: WebhookEventType;
    payment_id?: string;
    subscription_id?: string;
    next_billing_date?: string;
    current_period_end?: string;
    billing_interval_count?: number;
}

/**
 * Compute state changes from a webhook event.
 */
export function computeWebhookUpdate(
    currentState: UserSubscriptionState,
    webhook: WebhookPayload,
    now: number = Date.now()
): Partial<UserSubscriptionState> {
    const paymentId = webhook.payment_id || webhook.subscription_id;

    switch (webhook.type) {
        case 'payment.succeeded':
            // One-time payment
            return {
                isPremium: true,
                premiumExpiryDate: now + (30 * 24 * 60 * 60 * 1000),
                subscriptionStatus: null
            };

        case 'subscription.active':
        case 'subscription.created': {
            let expiryDate: number;
            if (webhook.next_billing_date) {
                expiryDate = new Date(webhook.next_billing_date).getTime();
            } else if (webhook.current_period_end) {
                expiryDate = new Date(webhook.current_period_end).getTime();
            } else {
                const intervalDays = webhook.billing_interval_count || 30;
                expiryDate = now + (intervalDays * 24 * 60 * 60 * 1000);
            }
            return {
                isPremium: true,
                premiumExpiryDate: expiryDate,
                subscriptionStatus: 'active',
                subscriptionId: paymentId || null
            };
        }

        case 'subscription.cancelled':
            // Don't revoke immediately - let them use until expiry
            return {
                subscriptionStatus: 'cancelled'
            };

        case 'subscription.expired':
        case 'subscription.payment_failed':
            return {
                isPremium: false,
                premiumExpiryDate: null,
                subscriptionStatus: 'expired'
            };

        default:
            return {};
    }
}

// ============================================
// INVARIANT CHECKERS (for testing)
// ============================================

export interface InvariantResult {
    passed: boolean;
    name: string;
    message: string;
}

/**
 * Check all subscription invariants.
 * Used by test harness to verify state consistency.
 */
export function checkInvariants(
    state: UserSubscriptionState,
    now: number = Date.now()
): InvariantResult[] {
    const results: InvariantResult[] = [];

    // INV_001: If now > expiryDate → isPremium must be false
    if (state.premiumExpiryDate && now > state.premiumExpiryDate) {
        results.push({
            passed: state.isPremium === false,
            name: 'INV_001',
            message: `Expired but isPremium=${state.isPremium}`
        });
    }

    // INV_002: If cancelled AND now < expiryDate → isPremium must be true
    if (
        state.subscriptionStatus === 'cancelled' &&
        state.premiumExpiryDate &&
        now < state.premiumExpiryDate
    ) {
        results.push({
            passed: state.isPremium === true,
            name: 'INV_002',
            message: `Cancelled but not expired, isPremium=${state.isPremium}`
        });
    }

    // INV_006: isPremium=false must imply expired or no subscription
    if (state.isPremium === false && state.subscriptionId) {
        const validReason =
            state.subscriptionStatus === 'expired' ||
            (state.premiumExpiryDate !== null && now > state.premiumExpiryDate);
        results.push({
            passed: validReason,
            name: 'INV_006',
            message: `isPremium=false with subscription but status=${state.subscriptionStatus}`
        });
    }

    return results;
}
