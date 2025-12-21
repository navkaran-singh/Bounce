/**
 * Check Subscription Status Serverless Function for Netlify
 * Securely checks subscription status with Dodo Payments API.
 * Called on app load (with cooldown) to detect auto-renewals.
 * 
 * CRITICAL: Server is the ONLY authority for premiumExpiryDate.
 * Client should read-only mirror, never write expiry.
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (prevent double initialization)
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
        console.log('✅ [CHECK-SUB] Firebase Admin initialized');
    } catch (error) {
        console.error('❌ [CHECK-SUB INIT ERROR]', error);
    }
}

const db = admin.firestore ? admin.firestore() : admin.app().firestore();

// Dodo Payments API configuration
// const DODO_API_BASE = 'https://live.dodopayments.com';
const DODO_API_BASE = 'https://test.dodopayments.com'; // Change to https://api.dodopayments.com for production


interface CheckRequest {
    userId: string;
    subscriptionId: string;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}') as CheckRequest;
        const { userId, subscriptionId } = body;

        if (!userId || !subscriptionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing userId or subscriptionId' }),
            };
        }

        // Only check subscriptions, not one-time payments
        if (!subscriptionId.startsWith('sub_')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    isSubscription: false,
                    message: 'One-time payment - no renewal check needed'
                }),
            };
        }

        console.log(`🔍 [CHECK-SUB] Checking subscription: ${subscriptionId} for User: ${userId}`);

        // ✅ FIX #4: VALIDATE SUBSCRIPTION OWNERSHIP
        // Verify that this subscriptionId actually belongs to this user
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ success: false, error: 'User not found' }),
            };
        }

        const userData = userDoc.data();
        // ✅ FIX: Validate against subscriptionId field (with fallback to lastPaymentId for legacy users)
        const storedSubId = userData?.subscriptionId || userData?.lastPaymentId;

        if (storedSubId !== subscriptionId) {
            console.warn(`⚠️ [CHECK-SUB] Subscription mismatch! Stored: ${storedSubId}, Requested: ${subscriptionId}`);
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ success: false, error: 'Subscription does not belong to user' }),
            };
        }

        // Call Dodo API to get subscription status
        const dodoResponse = await fetch(`${DODO_API_BASE}/subscriptions/${subscriptionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!dodoResponse.ok) {
            const errorText = await dodoResponse.text();
            console.error(`❌ [CHECK-SUB] Dodo API error: ${errorText}`);
            return {
                statusCode: 200, // Don't fail the app, just skip the check
                headers,
                body: JSON.stringify({ success: false, error: 'Could not verify subscription status' }),
            };
        }

        const subData = await dodoResponse.json();
        console.log(`📄 [CHECK-SUB] Subscription status: ${subData.status}`);
        console.log(`📄 [CHECK-SUB] Dodo response:`, JSON.stringify(subData, null, 2));

        // If subscription is active, update Firebase with Dodo's billing period end
        if (subData.status === 'active') {
            // ✅ FIX #1: USE DODO'S REAL BILLING PERIOD END
            // Try to extract the real expiry from Dodo's response
            let newExpiryDate: number;

            if (subData.current_period_end) {
                // Best case: Dodo provides current_period_end
                newExpiryDate = new Date(subData.current_period_end).getTime();
                console.log(`📅 [CHECK-SUB] Using current_period_end: ${subData.current_period_end}`);
            } else if (subData.next_billing_date) {
                // Alternative: next_billing_date
                newExpiryDate = new Date(subData.next_billing_date).getTime();
                console.log(`📅 [CHECK-SUB] Using next_billing_date: ${subData.next_billing_date}`);
            } else if (subData.renewal_at) {
                // Another alternative
                newExpiryDate = new Date(subData.renewal_at).getTime();
                console.log(`📅 [CHECK-SUB] Using renewal_at: ${subData.renewal_at}`);
            } else {
                // ⚠️ FALLBACK: Dodo didn't provide billing period
                // Only extend if current expiry has passed (prevents accidental shortening)
                const currentExpiry = userData?.premiumExpiryDate || 0;
                if (Date.now() > currentExpiry) {
                    newExpiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
                    console.warn(`⚠️ [CHECK-SUB] No billing period from Dodo, using fallback +30 days`);
                } else {
                    // Don't overwrite existing valid expiry
                    console.log(`✅ [CHECK-SUB] Current expiry still valid, not overwriting`);
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            isActive: true,
                            premiumExpiryDate: currentExpiry,
                            message: 'Subscription active - existing expiry valid'
                        }),
                    };
                }
            }

            // ✅ FIX #2: SERVER IS ONLY AUTHORITY FOR EXPIRY
            // Update Firebase (client will read from here)

            // Check if subscription is scheduled for cancellation
            // Dodo returns status=active but has cancel_at_next_billing_date set for scheduled cancellations
            const isScheduledForCancellation = !!(subData.cancelled_at || subData.cancel_at_next_billing_date);
            const effectiveStatus = isScheduledForCancellation ? 'cancelled' : 'active';

            if (isScheduledForCancellation) {
                console.log(`📅 [CHECK-SUB] Subscription scheduled for cancellation at: ${subData.cancelled_at}`);
            }

            // ✅ FIX: Only write if values changed (reduces unnecessary Firebase writes)
            const currentExpiry = userData?.premiumExpiryDate;
            const currentStatus = userData?.subscriptionStatus;
            const expiryChanged = currentExpiry !== newExpiryDate;
            const statusChanged = currentStatus !== effectiveStatus;

            if (expiryChanged || statusChanged) {
                console.log(`📝 [CHECK-SUB] Writing to Firebase - expiry changed: ${expiryChanged}, status changed: ${statusChanged}`);
                await db.collection('users').doc(userId).set({
                    isPremium: true,
                    premiumExpiryDate: newExpiryDate,
                    subscriptionStatus: effectiveStatus,
                    lastSubscriptionCheck: Date.now(),
                    lastUpdated: Date.now()
                }, { merge: true });
                console.log(`✅ [CHECK-SUB] Premium expiry set to: ${new Date(newExpiryDate).toISOString()}`);
            } else {
                console.log(`⏭️ [CHECK-SUB] Skipping write - no changes (expiry: ${new Date(newExpiryDate).toISOString()}, status: ${effectiveStatus})`);
                // Still update lastSubscriptionCheck locally without full write
                await db.collection('users').doc(userId).set({
                    lastSubscriptionCheck: Date.now()
                }, { merge: true });
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    isActive: true,
                    premiumExpiryDate: newExpiryDate,
                    message: 'Subscription active - premium synced'
                }),
            };
        } else if (subData.status === 'cancelled' || subData.status === 'expired') {
            // Subscription ended - update status but don't revoke immediately
            console.log(`ℹ️ [CHECK-SUB] Subscription ${subData.status} - updating status`);

            await db.collection('users').doc(userId).set({
                subscriptionStatus: subData.status,
                lastSubscriptionCheck: Date.now(),
                lastUpdated: Date.now()
            }, { merge: true });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    isActive: false,
                    status: subData.status,
                    message: `Subscription ${subData.status}`
                }),
            };
        }

        // Other statuses (pending, etc.)
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                isActive: false,
                status: subData.status,
                message: `Subscription status: ${subData.status}`
            }),
        };

    } catch (error: any) {
        console.error('❌ [CHECK-SUB] Error:', error.message);
        return {
            statusCode: 200, // Don't fail the app
            headers,
            body: JSON.stringify({ success: false, error: 'Check failed' }),
        };
    }
};

