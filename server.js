const express = require('express');
const Stripe = require('stripe');
const MetaApi = require('metaapi.cloud-sdk').default;
const app = express();

// =========================================================
// 1. YOUR PRIVATE KEY BOX - PASTE YOUR KEYS HERE
// =========================================================
const STRIPE_SECRET_KEY = 'PASTE_SK_LIVE_OR_TEST_KEY_HERE';
const STRIPE_WEBHOOK_SECRET = 'PASTE_WHSEC_KEY_HERE';
const META_API_TOKEN = 'PASTE_META_API_TOKEN_HERE';

const stripe = Stripe(STRIPE_SECRET_KEY);
const api = new MetaApi(META_API_TOKEN);

// =========================================================
// 2. YOUR 20 TRADER SLOTS
// =========================================================
const mt4Pool = [
    { login: '1001', password: 'p1', server: 'Broker-Demo' },
    { login: '1002', password: 'p2', server: 'Broker-Demo' },
    // ... Copy/paste this line to add all 20 of your accounts
];
let assignedIndex = 0;

// --- AUTOMATION LOGIC ---
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log('Error: Webhook signature failed.');
        return res.status(400).send(`Webhook Error`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const traderEmail = session.customer_details.email;

        if (assignedIndex < mt4Pool.length) {
            const acc = mt4Pool[assignedIndex];
            try {
                // This creates the account for the trader automatically
                await api.metatraderAccountApi.createAccount({
                    name: `Aurivon: ${traderEmail}`,
                    type: 'cloud',
                    login: acc.login,
                    password: acc.password,
                    server: acc.server,
                    platform: 'mt4',
                    magic: 123456
                });
                console.log(`Success! Account assigned to ${traderEmail}`);
                assignedIndex++; 
            } catch (error) {
                console.error("MetaApi Creation Failed:", error.message);
            }
        }
    }
    res.json({received: true});
});

app.use(express.json());
app.use(express.static(__dirname)); 
app.listen(3000, () => console.log('Aurivon System Active at http://localhost:3000'));
