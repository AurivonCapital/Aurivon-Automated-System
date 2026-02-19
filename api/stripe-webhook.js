import MetaApi from 'metaapi.cloud-sdk';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

// THIS IS THE CRITICAL FIX FOR VERCEL
export const config = {
  api: {
    bodyParser: false, // This tells Vercel to let Stripe handle the data format
  },
};

// Helper function to read the raw data from Stripe
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
    const rawBody = await getRawBody(req); // Use our helper to read the data correctly

    let event;

    try {
        // Use the RAW body and the Signature to verify it's really Stripe calling
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // When a payment is successful:
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;

        try {
            console.log(`🚀 Creating MT5 account for: ${customerEmail}`);

            // This is your official MetaApi connection logic
            await metaApi.metatraderAccountApi.createAccount({
                name: `Aurivon - ${customerEmail}`,
                type: 'cloud-g2',
                platform: 'mt5', 
                region: 'vint-hill',
                server: 'Eightcap-Demo', 
                provisioningProfileId: '39ff1aa7-8fc0-44b8-9798-77fb192213c6',
                magic: 123456,
                login: '0', 
                password: 'TraderPassword123',
                quoteStreamingIntervalInSeconds: 2.5
            });

            console.log("✅ SUCCESS: Account Provisioned in MetaApi");
        } catch (error) {
            console.error("❌ MetaApi Creation Failed:", error.message);
        }
    }

    res.json({ received: true });
}
