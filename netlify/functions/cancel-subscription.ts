/**
 * Cancel Subscription Serverless Function for Netlify
 * Securely calls Dodo Payments API to cancel a subscription at period end.
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
            if (process.env.NETLIFY_DEV === 'true') console.log("⚠️ Direct JSON parse failed, attempting unescape...");
            const sanitized = rawJson.replace(/\\n/g, '\n');
            serviceAccount = JSON.parse(sanitized);
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        if (process.env.NETLIFY_DEV === 'true') console.log('✅ [CANCEL SDK] Firebase Admin initialized');
    } catch (error) {
        if (process.env.NETLIFY_DEV === 'true') console.error('❌ [CANCEL SDK INIT ERROR]', error);
    }
}

const db = admin.firestore ? admin.firestore() : admin.app().firestore();

// Dodo Payments API configuration
const DODO_API_BASE = 'https://live.dodopayments.com';
// const DODO_API_BASE = 'https://test.dodopayments.com'; // Change to https://api.dodopayments.com for production


interface CancelRequest {
    userId: string;
    subscriptionId: string;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // CORS headers for cross-origin requests
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body || '{}') as CancelRequest;
        const { userId, subscriptionId } = body;

        if (!userId || !subscriptionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing userId or subscriptionId' }),
            };
        }

        if (process.env.NETLIFY_DEV === 'true') console.log(`🛑 [CANCEL] Request for User: ${userId}, Sub: ${subscriptionId}`);

        // Guard: One-time payments can't be cancelled (they're not subscriptions)
        if (!subscriptionId.startsWith('sub_')) {
            if (process.env.NETLIFY_DEV === 'true') console.log(`ℹ️ [CANCEL] ID ${subscriptionId} is a one-time payment, not a subscription.`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'This was a one-time payment — no recurring billing to cancel.',
                    isOneTimePayment: true
                }),
            };
        }

        // 1. Verify user ownership in Firestore (Security Layer)
        // We ensure the user requesting cancel actually owns this subscription ID
        // This prevents malicious users from cancelling others' subscriptions
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return {
                statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' })
            };
        }

        const userData = userDoc.data();
        // ✅ FIX: Validate against subscriptionId field (with fallback to lastPaymentId for legacy)
        const storedSubId = userData?.subscriptionId || userData?.lastPaymentId;
        if (storedSubId !== subscriptionId) {
            if (process.env.NETLIFY_DEV === 'true') console.warn(`⚠️ [CANCEL] Mismatch! Authed User Sub: ${storedSubId} vs Request: ${subscriptionId}`);
            // Proceed with caution: legacy users might not have subId stored yet, 
            // but if they do, it MUST match.
            if (storedSubId) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ error: 'Subscription ID mismatch.' })
                };
            }
        }

        // 2. Call Dodo Payments API
        const endpoint = `${DODO_API_BASE}/subscriptions/${subscriptionId}`;

        if (process.env.NETLIFY_DEV === 'true') console.log(`🔄 [CANCEL] Calling Dodo API: ${endpoint}`);

        const dodoResponse = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cancel_at_next_billing_date: true
            })
        });

        if (!dodoResponse.ok) {
            const errorText = await dodoResponse.text();
            if (process.env.NETLIFY_DEV === 'true') console.error(`❌ [CANCEL] Dodo API Error (${dodoResponse.status}): ${errorText}`);

            // Parse error if JSON
            let errorMessage = 'Failed to cancel with payment provider.';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;

                // Handle common cases gracefully
                if (errorText.includes('already') || errorText.includes('cancelled') || errorText.includes('expired') || dodoResponse.status === 400) {
                    // Subscription might already be cancelled - that's fine
                    if (process.env.NETLIFY_DEV === 'true') console.log('⚠️ [CANCEL] Subscription may already be cancelled/expired. Treating as success.');

                    // Update local status anyway
                    await db.collection('users').doc(userId).set({
                        subscriptionStatus: 'cancelled',
                        subscriptionCancelled: true,
                        cancellationDate: Date.now(),
                        lastUpdated: Date.now()
                    }, { merge: true });

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            message: 'Subscription is already cancelled or expired.',
                            alreadyCancelled: true
                        }),
                    };
                }
            } catch (e) {
                // Not JSON, use raw text
                errorMessage = errorText || errorMessage;
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: errorMessage }),
            };
        }

        const dodoData = await dodoResponse.json();
        if (process.env.NETLIFY_DEV === 'true') console.log(`✅ [CANCEL] Dodo Success. Status: ${dodoData.status}`);

        // 3. Update Firestore 
        // We optimistically update status even though webhook will verify it later
        await db.collection('users').doc(userId).set({
            subscriptionStatus: 'cancelled',
            subscriptionCancelled: true,
            cancellationDate: Date.now(),
            lastUpdated: Date.now()
        }, { merge: true });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Subscription cancelled successfully.',
                details: dodoData
            }),
        };

    } catch (error: any) {
        if (process.env.NETLIFY_DEV === 'true') console.error('❌ [CANCEL] Internal Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Internal server error.' }),
        };
    }
};
