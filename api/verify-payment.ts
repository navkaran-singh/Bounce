/**
 * Secure Payment Verification Serverless Function
 * * Handles both One-Time Payments (pay_...) and Subscriptions (sub_...)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin SDK (prevent double initialization)

// if (!admin.apps.length) {
//     try {
//         const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

//         if (!serviceAccountRaw) {
//             throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
//         }

//         // Clean up the JSON string (handle Vercel line break quirks)
//         // Sometimes copy-paste adds \n literals that JSON.parse hates
//         const sanitizedJson = serviceAccountRaw.replace(/\\n/g, '\n');

//         const serviceAccount = JSON.parse(sanitizedJson);

//         admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount),
//         });
//         console.log('✅ [VERIFY-PAYMENT] Firebase Admin initialized');
//     } catch (error) {
//         console.error('❌ [VERIFY-PAYMENT] Firebase Admin init error:', error);
//         // We throw here so the function fails gracefully with a 500 but logs WHY
//         throw new Error(`Firebase Init Failed: ${error instanceof Error ? error.message : 'Unknown'}`);
//     }
// }

// Initialize Firebase Admin SDK (prevent double initialization)
if (!admin.apps?.length) { // Use Optional Chaining (?.) just in case
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

// Use getFirestore() if db is undefined
const db = admin.firestore ? admin.firestore() : admin.app().firestore();

// Dodo Payments API configuration
const DODO_API_BASE = 'https://test-api.dodopayments.com/v1';

interface VerifyRequest {
    paymentId: string; // Can be payment_id OR subscription_id
    userId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { paymentId, userId } = req.body as VerifyRequest;

        if (!paymentId || !userId) {
            return res.status(400).json({ success: false, error: 'Missing ID or User' });
        }

        console.log(`🔍 [VERIFY] Checking ID: ${paymentId} for User: ${userId}`);

        // 1. Determine if Payment or Subscription
        const isSubscription = paymentId.startsWith('sub_');
        const endpoint = isSubscription
            ? `${DODO_API_BASE}/subscriptions/${paymentId}`
            : `${DODO_API_BASE}/payments/${paymentId}`;

        // 2. Call Dodo API
        const dodoResponse = await axios.get(
            endpoint,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = dodoResponse.data;
        console.log(`📄 [VERIFY] Status: ${data.status}`);

        // 3. Validate Status
        // Payments use 'succeeded', Subscriptions use 'active'
        const isValid = isSubscription
            ? data.status === 'active'
            : data.status === 'succeeded';

        if (!isValid) {
            console.error(`❌ [VERIFY] Invalid Status: ${data.status}`);
            return res.status(400).json({
                success: false,
                error: `Transaction status is ${data.status}`
            });
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

        return res.status(200).json({
            success: true,
            premiumExpiryDate,
            message: 'Premium Verified'
        });

    } catch (error: any) {
        console.error('❌ [VERIFY] Error:', error.response?.data || error.message);
        return res.status(500).json({ success: false, error: 'Verification Failed' });
    }
}