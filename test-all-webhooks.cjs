/**
 * COMPREHENSIVE WEBHOOK TEST SUITE
 * Tests all payment scenarios locally
 * 
 * Run: node test-all-webhooks.cjs
 */

const http = require('http');

// ============================================
// TEST DATA
// ============================================

const TEST_USER_ID = 'KgKWi0DHNrWEJ3rzTYDObZEzjZ82';
const TEST_SUBSCRIPTION_ID = 'sub_0NUcWkBiWlJgQn5CD1q56';
const TEST_PAYMENT_ID = 'pay_0NUlMndtu6UVzqdV472UH';

// Calculate dates
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextBillingDate = tomorrow.toISOString();

// Base customer data
const customerData = {
    customer_id: 'cus_test123',
    email: 'navkaransinghbakshi04@gmail.com',
    name: 'NAVKARAN Singh',
};

// ============================================
// WEBHOOK PAYLOADS FOR EACH SCENARIO
// ============================================

const WEBHOOKS = {
    // SCENARIO 1: First subscription
    'subscription.active': {
        type: 'subscription.active',
        timestamp: now.toISOString(),
        data: {
            subscription_id: TEST_SUBSCRIPTION_ID,
            next_billing_date: nextBillingDate,
            status: 'active',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },

    // SCENARIO 2: Subscription renewed (auto-renewal)
    'subscription.renewed': {
        type: 'subscription.renewed',
        timestamp: now.toISOString(),
        data: {
            subscription_id: TEST_SUBSCRIPTION_ID,
            next_billing_date: nextBillingDate,
            status: 'active',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },

    // SCENARIO 3: Payment succeeded (subscription payment - has subscription_id)
    'payment.succeeded_subscription': {
        type: 'payment.succeeded',
        timestamp: now.toISOString(),
        data: {
            payment_id: TEST_PAYMENT_ID,
            subscription_id: TEST_SUBSCRIPTION_ID,  // KEY: This is present
            status: 'succeeded',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },

    // SCENARIO 4: Payment succeeded (one-time - NO subscription_id)
    'payment.succeeded_onetime': {
        type: 'payment.succeeded',
        timestamp: now.toISOString(),
        data: {
            payment_id: 'pay_onetime_test123',
            // NO subscription_id - this is a true one-time payment
            status: 'succeeded',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },

    // SCENARIO 5: Subscription cancelled
    'subscription.cancelled': {
        type: 'subscription.cancelled',
        timestamp: now.toISOString(),
        data: {
            subscription_id: TEST_SUBSCRIPTION_ID,
            status: 'cancelled',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },

    // SCENARIO 6: Subscription expired (payment failed)
    'subscription.expired': {
        type: 'subscription.expired',
        timestamp: now.toISOString(),
        data: {
            subscription_id: TEST_SUBSCRIPTION_ID,
            status: 'expired',
            customer: customerData,
            metadata: { user_id: TEST_USER_ID },
        },
    },
};

// ============================================
// TEST RUNNER
// ============================================

async function sendWebhook(name, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);

        const options = {
            hostname: 'localhost',
            port: 8888,
            path: '/.netlify/functions/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 COMPREHENSIVE WEBHOOK TEST SUITE');
    console.log('='.repeat(60));
    console.log('\nMake sure:');
    console.log('  1. netlify dev is running on port 8888');
    console.log('  2. DODO_WEBHOOK_SECRET is commented out in .env.local');
    console.log('  3. You restart netlify dev after commenting out the secret');
    console.log('\n' + '='.repeat(60) + '\n');

    const results = [];

    for (const [name, payload] of Object.entries(WEBHOOKS)) {
        console.log(`\n📦 Testing: ${name}`);
        console.log(`   Type: ${payload.type}`);
        console.log(`   Has subscription_id: ${!!payload.data.subscription_id}`);

        try {
            const result = await sendWebhook(name, payload);
            const passed = result.status === 200;

            console.log(`   Status: ${result.status} ${passed ? '✅' : '❌'}`);

            results.push({ name, passed, status: result.status });

            // Wait a bit between tests
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
            results.push({ name, passed: false, error: err.message });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\n  Total: ${passed}/${total} passed`);
    console.log('='.repeat(60));

    console.log('\n📋 NOW CHECK YOUR NETLIFY DEV TERMINAL FOR DETAILED LOGS!');
    console.log('   Look for messages like:');
    console.log('   - 🔄 [WEBHOOK] Subscription payment detected...');
    console.log('   - 📅 [WEBHOOK] Using next_billing_date...');
    console.log('   - ✅ [WEBHOOK] Subscription payment processed...');
    console.log('');
}

runTests().catch(console.error);
