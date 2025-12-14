/**
 * Secure Payment Verification Serverless Function for Netlify
 * Handles both One-Time Payments (pay_...) and Subscriptions (sub_...)
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
        console.log('✅ [VERIFY-PAYMENT] Firebase Admin initialized');
    } catch (error) {
        console.error('❌ [INIT ERROR]', error);
    }
}

const db = admin.firestore ? admin.firestore() : admin.app().firestore();

// Dodo Payments API configuration
const DODO_API_BASE = 'https://test.mkc.com'; // Change to https://api.dodopayments.com for production

interface VerifyRequest {
    paymentId: string;
    userId: string;
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
        const body = JSON.parse(event.body || '{}') as VerifyRequest;
        const { paymentId, userId } = body;

        if (!paymentId || !userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing ID or User' }),
            };
        }

        console.log(`🔍 [VERIFY] Checking ID: ${paymentId} for User: ${userId}`);

        // 1. Determine if Payment or Subscription
        const isSubscription = paymentId.startsWith('sub_');
        const endpoint = isSubscription
            ? `${DODO_API_BASE}/subscriptions/${paymentId}`
            : `${DODO_API_BASE}/payments/${paymentId}`;

        // 2. Call Dodo API using native fetch
        const dodoResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!dodoResponse.ok) {
            const errorText = await dodoResponse.text();
            console.error(`❌ [VERIFY] Dodo API error: ${errorText}`);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Payment verification failed' }),
            };
        }

        const data = await dodoResponse.json();
        console.log(`📄 [VERIFY] Status: ${data.status}`);

        // 3. Validate Status
        const isValid = isSubscription
            ? data.status === 'active'
            : data.status === 'succeeded';

        if (!isValid) {
            console.error(`❌ [VERIFY] Invalid Status: ${data.status}`);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Transaction status is ${data.status}`,
                }),
            };
        }

        // 4. Update Firebase
        const premiumExpiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

        await db.collection('users').doc(userId).set(
            {
                isPremium: true,
                premiumExpiryDate: premiumExpiryDate,
                lastPaymentId: paymentId,
                paymentType: isSubscription ? 'subscription' : 'one_time',
                lastUpdated: Date.now(),
            },
            { merge: true }
        );

        console.log(`✅ [VERIFY] Success! User upgraded.`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                premiumExpiryDate,
                message: 'Premium Verified',
            }),
        };

    } catch (error: any) {
        console.error('❌ [VERIFY] Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Verification Failed' }),
        };
    }
};
