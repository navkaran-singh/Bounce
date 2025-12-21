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
            console.log("⚠️ Direct JSON parse failed, attempting unescape...");
            const sanitized = rawJson.replace(/\\n/g, '\n');
            serviceAccount = JSON.parse(sanitized);
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ [WEBHOOK] Firebase Admin initialized');
    } catch (error) {
        console.error('❌ [WEBHOOK INIT ERROR]', error);
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

    // Verify webhook signature (optional but recommended)
    // Dodo sends a signature header you can verify
    const signature =
        event.headers['x-dodo-signature'] ||
        event.headers['x-webhook-signature'] ||
        event.headers['x-dodo-webhook-signature'] ||
        event.headers['X-Dodo-Signature'] ||
        event.headers['X-Webhook-Signature'];
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    // TODO: Implement signature verification if Dodo provides it
    // For now, we'll log a warning if no secret is configured
    if (!webhookSecret) {
        console.warn('⚠️ [WEBHOOK] No DODO_WEBHOOK_SECRET configured - skipping signature verification');
    }

    try {
        const payload = JSON.parse(event.body || '{}') as DodoWebhookEvent;

        console.log(`📥 [WEBHOOK] Received event: ${payload.type}`);
        console.log(`📥 [WEBHOOK] Payload:`, JSON.stringify(payload, null, 2));

        const eventType = payload.type;
        const data = payload.data;

        // Extract user ID from metadata (you need to pass this when creating payment)
        // Or look up by customer email in your database
        const paymentId = data.payment_id || data.subscription_id;
        let userId = data.metadata?.user_id;
        const customerEmail = data.customer?.email;

        // 🔥 THE FIX: If metadata ID is missing, find user by Email
        if (!userId && customerEmail) {
            console.log(`🔍 [WEBHOOK] Metadata missing. Looking up email: ${customerEmail}`);
            try {
                // Ask Firebase: "Who owns this email?"
                const userRecord = await admin.auth().getUserByEmail(customerEmail);
                userId = userRecord.uid;
                console.log(`✅ [WEBHOOK] Found User ID via Email: ${userId}`);
            } catch (err) {
                console.warn(`⚠️ [WEBHOOK] User not found for email: ${customerEmail}`);
            }
        }

        // Now check if we failed to find a user
        if (!userId) {
            console.log('⚠️ [WEBHOOK] Skipped: No User ID resolved.');
            // Return 200 so Dodo knows we got the message
            return { statusCode: 200, body: JSON.stringify({ received: true }) };
        }

        switch (eventType) {
            case 'payment.succeeded':
            case 'payment_intent.succeeded': {
                console.log(`✅ [WEBHOOK] Payment succeeded: ${paymentId}`);

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

                    console.log(`✅ [WEBHOOK] User ${userId} upgraded via webhook`);
                }
                break;
            }

            case 'subscription.active':
            case 'subscription.created': {
                console.log(`✅ [WEBHOOK] Subscription active: ${paymentId}`);

                if (userId) {
                    // Use Dodo's billing dates, not hardcoded!
                    let premiumExpiryDate: number;
                    if (data.next_billing_date) {
                        premiumExpiryDate = new Date(data.next_billing_date).getTime();
                        console.log(`📅 [WEBHOOK] Using next_billing_date: ${data.next_billing_date}`);
                    } else if (data.current_period_end) {
                        premiumExpiryDate = new Date(data.current_period_end).getTime();
                        console.log(`📅 [WEBHOOK] Using current_period_end: ${data.current_period_end}`);
                    } else {
                        // Fallback: use billing interval or 30 days
                        const intervalDays = data.billing_interval_count || 30;
                        premiumExpiryDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);
                        console.warn(`⚠️ [WEBHOOK] No billing date from Dodo, fallback: ${intervalDays} days`);
                    }

                    await db.collection('users').doc(userId).set(
                        {
                            isPremium: true,
                            premiumExpiryDate,
                            lastPaymentId: paymentId,
                            subscriptionId: paymentId, // Track subscription ID
                            subscriptionStatus: 'active', // Set proper status
                            paymentType: 'subscription',
                            paymentSource: 'webhook',
                            lastUpdated: Date.now(),
                        },
                        { merge: true }
                    );

                    console.log(`✅ [WEBHOOK] User ${userId} subscription activated via webhook`);
                }
                break;
            }

            case 'subscription.expired':
            case 'subscription.payment_failed': {
                // ❌ THIS is the Kill Switch - Full downgrade
                console.log(`📉 [WEBHOOK] Subscription expired/failed: ${paymentId}`);

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
                    console.log(`📉 [WEBHOOK] User ${userId} fully downgraded to free.`);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.canceled': {
                console.log(`⚠️ [WEBHOOK] Subscription cancelled: ${paymentId}`);

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

                    console.log(`⚠️ [WEBHOOK] User ${userId} subscription marked as cancelled`);
                }
                break;
            }

            default:
                console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true }),
        };

    } catch (error: any) {
        console.error('❌ [WEBHOOK] Error:', error.message);

        // Return 200 anyway to prevent Dodo from retrying
        // Log the error for debugging
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true, error: 'Processing error logged' }),
        };
    }
};
