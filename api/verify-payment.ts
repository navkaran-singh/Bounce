/**
 * Secure Payment Verification Serverless Function
 * 
 * This function verifies payments with Dodo Payments API
 * and securely updates the user's premium status in Firebase.
 * 
 * Environment Variables Required:
 * - DODO_PAYMENT_SECRET_KEY: Your Dodo Payments secret API key
 * - FIREBASE_SERVICE_ACCOUNT: JSON string of Firebase service account credentials
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin SDK (prevent double initialization)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ [VERIFY-PAYMENT] Firebase Admin initialized');
    } catch (error) {
        console.error('❌ [VERIFY-PAYMENT] Firebase Admin init error:', error);
    }
}

const db = admin.firestore();

// Dodo Payments API configuration
const DODO_API_BASE = 'https://test-api.dodopayments.com/v1'; // Change to 'https://api.dodopayments.com/v1' for production

interface VerifyPaymentRequest {
    paymentId: string;
    userId: string;
}

interface DodoPaymentResponse {
    payment_id: string;
    status: 'succeeded' | 'pending' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    customer: {
        email: string;
        metadata?: {
            userId?: string;
        };
    };
    created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { paymentId, userId } = req.body as VerifyPaymentRequest;

        // Validate input
        if (!paymentId || !userId) {
            console.error('❌ [VERIFY-PAYMENT] Missing paymentId or userId');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: paymentId and userId'
            });
        }

        console.log(`🔍 [VERIFY-PAYMENT] Verifying payment: ${paymentId} for user: ${userId}`);

        // 1. Verify payment with Dodo Payments API
        const dodoResponse = await axios.get<DodoPaymentResponse>(
            `${DODO_API_BASE}/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DODO_PAYMENT_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const paymentData = dodoResponse.data;
        console.log('📄 [VERIFY-PAYMENT] Dodo response:', JSON.stringify(paymentData, null, 2));

        // 2. Validate payment status
        if (paymentData.status !== 'succeeded') {
            console.error(`❌ [VERIFY-PAYMENT] Payment not succeeded. Status: ${paymentData.status}`);
            return res.status(400).json({
                success: false,
                error: `Payment status is ${paymentData.status}, not succeeded`
            });
        }

        // 3. Optional: Verify userId matches (security check)
        // This prevents users from using someone else's payment ID
        if (paymentData.customer?.metadata?.userId && paymentData.customer.metadata.userId !== userId) {
            console.error('❌ [VERIFY-PAYMENT] User ID mismatch');
            return res.status(403).json({
                success: false,
                error: 'Payment does not belong to this user'
            });
        }

        // 4. Update user's premium status in Firestore
        const premiumExpiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now

        await db.collection('users').doc(userId).set(
            {
                isPremium: true,
                premiumExpiryDate: premiumExpiryDate,
                lastPaymentId: paymentId,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: Date.now(),
            },
            { merge: true }
        );

        console.log(`✅ [VERIFY-PAYMENT] User ${userId} upgraded to premium until ${new Date(premiumExpiryDate).toISOString()}`);

        // 5. Return success
        return res.status(200).json({
            success: true,
            premiumExpiryDate,
            message: 'Payment verified and premium status activated'
        });

    } catch (error: any) {
        console.error('❌ [VERIFY-PAYMENT] Error:', error.response?.data || error.message);

        // Handle Dodo API errors specifically
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                success: false,
                error: 'Payment verification service error'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error during payment verification'
        });
    }
}
