const express = require('express');
const Stripe = require('stripe');
const MetaApi = require('metaapi.cloud-sdk').default;
const app = express();

// =========================================================
// 1. YOUR PRIVATE KEY BOX - PASTE YOUR KEYS HERE
// =========================================================
const STRIPE_SECRET_KEY = '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';
const META_API_TOKEN = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJiNGQ4YmZkZWY1NmE1NmY1OTA4MzMzZDA2YWZmMmI5MSIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiYjRkOGJmZGVmNTZhNTZmNTkwODMzM2QwNmFmZjJiOTEiLCJpYXQiOjE3NjkwODkzNDYsImV4cCI6MTc5ODY0NTM0Nn0.i6hPi7AgDS5KwUWLGjM7mZp_Yld5k7j6QzHpX1YCdsIdbpSnjuyiXmrxpBbrnhZCk1WBLrN4iln1Fyc3vKrO0Yl7jgjRwAZ5o4MJPsETEBm3phVFyN-d4rQSZt-euQW2nU8a_R5FaPX5GNhdGpMHDXibrD3kZcR5fxCGpLsJia2oOUqC1ZNAdCkl63fTe2gnFiRH7GHaqFwoQ0srl_fymUVC4VqoH-8l4YkxOTFOO4T30HGKD_CbRGevtUHxs105UOtl-KcHHzEwcs3p80ttVYI-8zuUvvfZ3mJqn_2jZqhqbfR_Mtj9Oc2Wg9Hnz2t9YGM7pCPN_dYOK-Wj7JDrTviysQcKpYCIRFWSqU6F0XqOW6n7hXAULMXi7j9Qwn5o4FcfE71jJfKMhVjBw-rKtHc1RnFzbLuBP4XPfNrddt8mRu6vueh-5M3DyYrQi-3HZPvJ6IyvId0n-3NcPsJFrJtJQFgWdISoysFP8pQx7SBfc9M3QACSRkAau-SuGR6Qsj38ztFLv_K6klrvNgnnMmVEUTwiT5mOTtS3-dePK-_51OUVUWIa51P-Kg7L5RmNkIXH0xb3O-_MIOEPnuG3RF0kdyDWZiKl6HhjdzsTzMUDW8AWbsIZ53e0miP5kgCGA2v5lseLT1gWEB_b0A_xZsvedi_uv0_7saeeYk25tTE';

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
