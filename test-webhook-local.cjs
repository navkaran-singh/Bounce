/**
 * Local webhook tester - simulates Dodo webhook locally
 * Run with: node test-webhook-local.cjs
 */

const http = require('http');

// The webhook payload you shared earlier
const webhookPayload = {
    "business_id": "bus_lXdwFhonMxgu6PpbcIObs",
    "data": {
        "billing": {
            "city": "Chandigarh",
            "country": "IN",
            "state": "Chandigarh",
            "street": "Fire Station Sector 38C,  Vidya Path, Sector 38",
            "zipcode": "160014"
        },
        "brand_id": "brnd_qInwAfGqTKGlezzjB4ipF",
        "business_id": "bus_lXdwFhonMxgu6PpbcIObs",
        "card_issuing_country": null,
        "card_last_four": null,
        "card_network": null,
        "card_type": null,
        "checkout_session_id": null,
        "created_at": "2025-12-24T08:51:51.437789Z",
        "currency": "INR",
        "customer": {
            "customer_id": "cus_34ak0rsKv1BmCHrV6zTNK",
            "email": "navkaransinghbakshi04@gmail.com",
            "metadata": {},
            "name": "NAVKARAN Singh",
            "phone_number": "+919592057500"
        },
        "digital_products_delivered": false,
        "discount_id": "dsc_dGwF2vTdfJGHoS5UwH6mt",
        "disputes": [],
        "error_code": null,
        "error_message": null,
        "invoice_id": "inv_0NUlMne0ioMYDeztPvMQG",
        "metadata": {
            "user_id": "KgKWi0DHNrWEJ3rzTYDObZEzjZ82"
        },
        "payload_type": "Payment",
        "payment_id": "pay_0NUlMndtu6UVzqdV472UH",
        "payment_link": null,
        "payment_method": null,
        "payment_method_type": null,
        "product_cart": null,
        "refunds": [],
        "settlement_amount": 0,
        "settlement_currency": "USD",
        "settlement_tax": 0,
        "status": "succeeded",
        "subscription_id": "sub_0NUcWkBiWlJgQn5CD1q56",
        "tax": 0,
        "total_amount": 0,
        "updated_at": null
    },
    "timestamp": "2025-12-24T08:51:51.437789Z",
    "type": "payment.succeeded"
};

const postData = JSON.stringify(webhookPayload);

console.log('🚀 Sending test webhook to localhost:8888...\n');
console.log('📦 Payload type:', webhookPayload.type);
console.log('📦 subscription_id:', webhookPayload.data.subscription_id);
console.log('📦 payment_id:', webhookPayload.data.payment_id);
console.log('📦 user_id:', webhookPayload.data.metadata.user_id);
console.log('');

const options = {
    hostname: 'localhost',
    port: 8888,
    path: '/.netlify/functions/webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        // Skip signature verification (will work in dev mode)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('📡 Response Status:', res.statusCode);
        console.log('📄 Response Body:', data);

        if (res.statusCode === 200) {
            console.log('\n✅ Webhook processed successfully!');
        } else {
            console.log('\n❌ Webhook failed!');
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();
