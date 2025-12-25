/**
 * Dodo Payments Webhook Handler
 * 
 * This function receives webhook events from Dodo Payments for:
 * - payment.succeeded - One-time payment completed
 * - subscription.active - Subscription started/renewed
 * - subscription.cancelled - Subscription cancelled
 * 
 * This is a safety net for when users complete payment but close
 * the browser before the redirect completes.
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (reuse existing init logic)
if (!admin.apps?.length) {
    try {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!rawJson) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT is missing.");
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(rawJson);
        } catch (e) {
            if (process.env.NETLIFY_DEV === 'true') console.log("⚠️ Direct JSON parse failed, attempting unescape...");
            const sanitized = rawJson.replace(/\\n/g, '\n');
            serviceAccount = JSON.parse(sanitized);
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        if (process.env.NETLIFY_DEV === 'true') console.log('✅ [WEBHOOK] Firebase Admin initialized');
    } catch (error) {
        if (process.env.NETLIFY_DEV === 'true') console.error('❌ [WEBHOOK INIT ERROR]', error);
    }
}

const db = admin.firestore ? admin.firestore() : admin.app().firestore();

// Webhook event types from Dodo
interface DodoWebhookEvent {
    type: string;
    data: {
        payment_id?: string;
        subscription_id?: string;
        customer?: {
            customer_id?: string;
            email?: string;
        };
        metadata?: {
            user_id?: string;
        };
        status?: string;
        // Billing period fields from Dodo
        next_billing_date?: string;
        current_period_end?: string;
        billing_interval_count?: number;
    };
}

export const handler: Handler = async (event: HandlerEvent) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    // 🔐 SIGNATURE VERIFICATION using Dodo SDK
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    let payload: DodoWebhookEvent;

    if (webhookSecret) {
        try {
            // Import Dodo SDK for signature verification
            const { DodoPayments } = await import('dodopayments');

            const client = new DodoPayments({
                bearerToken: process.env.DODO_PAYMENT_SECRET_KEY || '',
                webhookKey: webhookSecret,
            });

            // Verify and unwrap the webhook payload
            const unwrapped = client.webhooks.unwrap(event.body || '', {
                headers: {
                    'webhook-id': event.headers['webhook-id'] || '',
                    'webhook-signature': event.headers['webhook-signature'] || '',
                    'webhook-timestamp': event.headers['webhook-timestamp'] || '',
                },
            });

            // Type assertion after SDK verification
            payload = unwrapped as unknown as DodoWebhookEvent;
            if (process.env.NETLIFY_DEV === 'true') console.log('✅ [WEBHOOK] Signature verified successfully');
        } catch (verifyError: any) {
            if (process.env.NETLIFY_DEV === 'true') console.error('❌ [WEBHOOK] Signature verification failed:', verifyError.message);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid webhook signature' }),
            };
        }
    } else {
        // No secret configured - skip verification (for local development)
        if (process.env.NETLIFY_DEV === 'true') console.warn('⚠️ [WEBHOOK] No DODO_WEBHOOK_SECRET configured - skipping signature verification');
        payload = JSON.parse(event.body || '{}') as DodoWebhookEvent;
    }

    try {
        if (process.env.NETLIFY_DEV === 'true') console.log(`📥 [WEBHOOK] Received event: ${payload.type}`);
        if (process.env.NETLIFY_DEV === 'true') console.log(`📥 [WEBHOOK] Payload:`, JSON.stringify(payload, null, 2));

        const eventType = payload.type;
        const data = payload.data;

        // Extract user ID from metadata (you need to pass this when creating payment)
        // Or look up by customer email in your database
        const paymentId = data.payment_id || data.subscription_id;
        let userId = data.metadata?.user_id;
        const customerEmail = data.customer?.email;

        // 🔥 THE FIX: If metadata ID is missing, find user by Email
        if (!userId && customerEmail) {
            if (process.env.NETLIFY_DEV === 'true') console.log(`🔍 [WEBHOOK] Metadata missing. Looking up email: ${customerEmail}`);
            try {
                // Ask Firebase: "Who owns this email?"
                const userRecord = await admin.auth().getUserByEmail(customerEmail);
                userId = userRecord.uid;
                if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] Found User ID via Email: ${userId}`);
            } catch (err) {
                if (process.env.NETLIFY_DEV === 'true') console.warn(`⚠️ [WEBHOOK] User not found for email: ${customerEmail}`);
            }
        }

        // Now check if we failed to find a user
        if (!userId) {
            if (process.env.NETLIFY_DEV === 'true') console.log('⚠️ [WEBHOOK] Skipped: No User ID resolved.');
            // Return 200 so Dodo knows we got the message
            return { statusCode: 200, body: JSON.stringify({ received: true }) };
        }

        switch (eventType) {
            case 'payment.succeeded':
            case 'payment_intent.succeeded': {
                // ═══════════════════════════════════════════════════════════════════
                // SMART PAYMENT HANDLER: Handles both subscription renewals AND one-time
                // Dodo sends payment.succeeded for renewals (no subscription.renewed!)
                // ═══════════════════════════════════════════════════════════════════

                const DODO_API_BASE = 'https://live.dodopayments.com';
                let subscriptionId = data.subscription_id;

                // If subscription_id not in payload, check via API
                if (!subscriptionId && paymentId && paymentId.startsWith('pay_')) {
                    try {
                        const paymentResponse = await fetch(`${DODO_API_BASE}/payments/${paymentId}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (paymentResponse.ok) {
                            const paymentData = await paymentResponse.json();
                            subscriptionId = paymentData.subscription_id;
                        }
                    } catch (apiError: any) {
                        if (process.env.NETLIFY_DEV === 'true') console.warn(`⚠️ [WEBHOOK] Payment API check failed: ${apiError.message}`);
                    }
                }

                // ═══════════════════════════════════════════════════════════════════
                // SUBSCRIPTION PAYMENT: Fetch subscription and set correct expiry
                // ═══════════════════════════════════════════════════════════════════
                if (subscriptionId && userId) {
                    if (process.env.NETLIFY_DEV === 'true') console.log(`🔄 [WEBHOOK] Subscription payment detected: ${subscriptionId}`);

                    try {
                        // Fetch subscription details from Dodo
                        const subResponse = await fetch(`${DODO_API_BASE}/subscriptions/${subscriptionId}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (subResponse.ok) {
                            const subData = await subResponse.json();

                            // Calculate expiry from subscription's next_billing_date
                            let premiumExpiryDate: number;
                            if (subData.next_billing_date) {
                                premiumExpiryDate = new Date(subData.next_billing_date).getTime();
                                if (process.env.NETLIFY_DEV === 'true') console.log(`📅 [WEBHOOK] Using next_billing_date: ${subData.next_billing_date}`);
                            } else if (subData.current_period_end) {
                                premiumExpiryDate = new Date(subData.current_period_end).getTime();
                            } else {
                                // Fallback based on billing interval
                                const intervalDays = subData.billing_interval_count || 30;
                                premiumExpiryDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);
                                if (process.env.NETLIFY_DEV === 'true') console.warn(`⚠️ [WEBHOOK] No billing date, fallback: ${intervalDays} days`);
                            }

                            // Update user with correct subscription data
                            await db.collection('users').doc(userId).set(
                                {
                                    isPremium: true,
                                    premiumExpiryDate,
                                    lastPaymentId: paymentId,
                                    subscriptionId: subscriptionId,
                                    subscriptionStatus: 'active',
                                    subscriptionCancelled: false,
                                    cancellationDate: null,
                                    paymentType: 'subscription',
                                    paymentSource: 'webhook',
                                    lastUpdated: Date.now(),
                                },
                                { merge: true }
                            );

                            if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] Subscription payment processed! Expiry: ${new Date(premiumExpiryDate).toISOString()}`);
                        } else {
                            if (process.env.NETLIFY_DEV === 'true') console.error(`❌ [WEBHOOK] Failed to fetch subscription: ${subResponse.status}`);
                        }
                    } catch (subError: any) {
                        if (process.env.NETLIFY_DEV === 'true') console.error(`❌ [WEBHOOK] Subscription fetch error: ${subError.message}`);
                    }
                    break;
                }

                // ═══════════════════════════════════════════════════════════════════
                // ONE-TIME PAYMENT: No subscription_id, process as one-time
                // ═══════════════════════════════════════════════════════════════════
                if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] Processing one-time payment: ${paymentId}`);

                if (userId) {
                    const premiumExpiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

                    await db.collection('users').doc(userId).set(
                        {
                            isPremium: true,
                            premiumExpiryDate,
                            lastPaymentId: paymentId,
                            paymentType: 'one_time',
                            paymentSource: 'webhook',
                            lastUpdated: Date.now(),
                        },
                        { merge: true }
                    );

                    if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] User ${userId} upgraded via webhook (one-time)`);
                }
                break;
            }

            case 'subscription.active':
            case 'subscription.created':
            case 'subscription.renewed': {
                // Handles: initial subscription start AND auto-renewals
                if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] Subscription Event (${eventType}): ${paymentId}`);

                if (userId) {
                    // Use Dodo's billing dates, not hardcoded!
                    let premiumExpiryDate: number;
                    if (data.next_billing_date) {
                        premiumExpiryDate = new Date(data.next_billing_date).getTime();
                        if (process.env.NETLIFY_DEV === 'true') console.log(`📅 [WEBHOOK] Using next_billing_date: ${data.next_billing_date}`);
                    } else if (data.current_period_end) {
                        premiumExpiryDate = new Date(data.current_period_end).getTime();
                        if (process.env.NETLIFY_DEV === 'true') console.log(`📅 [WEBHOOK] Using current_period_end: ${data.current_period_end}`);
                    } else {
                        // Fallback: use billing interval or 30 days
                        const intervalDays = data.billing_interval_count || 30;
                        premiumExpiryDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);
                        if (process.env.NETLIFY_DEV === 'true') console.warn(`⚠️ [WEBHOOK] No billing date from Dodo, fallback: ${intervalDays} days`);
                    }

                    await db.collection('users').doc(userId).set(
                        {
                            isPremium: true,
                            premiumExpiryDate,
                            lastPaymentId: paymentId,
                            subscriptionId: data.subscription_id || paymentId, // Track subscription ID
                            subscriptionStatus: 'active', // Set proper status
                            subscriptionCancelled: false, // Clear cancellation flag on renewal
                            cancellationDate: null, // Clear stale cancellation date
                            paymentType: 'subscription',
                            paymentSource: 'webhook',
                            lastUpdated: Date.now(),
                        },
                        { merge: true }
                    );

                    if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [WEBHOOK] User ${userId} subscription ${eventType === 'subscription.renewed' ? 'renewed' : 'activated'} via webhook`);
                }
                break;
            }

            case 'subscription.expired':
            case 'subscription.payment_failed': {
                // ❌ THIS is the Kill Switch - Full downgrade
                if (process.env.NETLIFY_DEV === 'true') console.log(`📉 [WEBHOOK] Subscription expired/failed: ${paymentId}`);

                if (userId) {
                    await db.collection('users').doc(userId).set(
                        {
                            isPremium: false,
                            premiumExpiryDate: null,
                            subscriptionStatus: 'expired',
                            subscriptionExpiredAt: Date.now(),
                            lastPaymentId: paymentId,
                            paymentSource: 'webhook_expiry',
                            lastUpdated: Date.now(),
                        },
                        { merge: true }
                    );
                    if (process.env.NETLIFY_DEV === 'true') console.log(`📉 [WEBHOOK] User ${userId} fully downgraded to free.`);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.canceled': {
                if (process.env.NETLIFY_DEV === 'true') console.log(`⚠️ [WEBHOOK] Subscription cancelled: ${paymentId}`);

                if (userId) {
                    // Don't immediately revoke - let them use until expiry
                    await db.collection('users').doc(userId).set(
                        {
                            subscriptionCancelled: true,
                            cancellationDate: Date.now(),
                            lastUpdated: Date.now(),
                        },
                        { merge: true }
                    );

                    if (process.env.NETLIFY_DEV === 'true') console.log(`⚠️ [WEBHOOK] User ${userId} subscription marked as cancelled`);
                }
                break;
            }

            default:
                if (process.env.NETLIFY_DEV === 'true') console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true }),
        };

    } catch (error: any) {
        if (process.env.NETLIFY_DEV === 'true') console.error('❌ [WEBHOOK] Error:', error.message);

        // Return 200 anyway to prevent Dodo from retrying
        // Log the error for debugging
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true, error: 'Processing error logged' }),
        };
    }
};
