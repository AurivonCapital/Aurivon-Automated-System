import MetaApi from 'metaapi.cloud-sdk';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

// VERCEL CONFIG: Required to process Stripe data correctly
export const config = {
  api: {
    bodyParser: false, 
  },
};

// HELPER: Reads the raw data from Stripe
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'];
    const rawBody = await getRawBody(req);

    let event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // --- AUTOMATION STARTS HERE ---
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;

        try {
            console.log(`🚀 AUTOMATION: Creating Demo Account for ${customerEmail}`);

            // This creates the account on Eightcap Demo automatically
            const account = await metaApi.metatraderAccountApi.createAccount({
                name: `Aurivon - ${customerEmail}`,
                type: 'cloud-g2',
                platform: 'mt5', 
                region: 'vint-hill',
                server: 'Eightcap-Demo', 
                provisioningProfileId: '39ff1aa7-8fc0-44b8-9798-77fb192213c6',
                magic: 123456,
                // These pull from your Vercel Environment Variables
                login: process.env.MT4_LOGIN || '0', 
                password: process.env.MT4_PASSWORD || 'TraderPassword123',
                quoteStreamingIntervalInSeconds: 2.5
            });

            console.log(`✅ SUCCESS: Account Created! ID: ${account.id}`);
            
            // FUTURE STEP: Here we could automatically email the trader their Login ID.
            
        } catch (error) {
            console.error("❌ AUTOMATION FAILED:", error.message);
        }
    }

    res.json({ received: true });
}
