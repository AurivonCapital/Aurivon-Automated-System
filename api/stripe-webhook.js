import MetaApi from 'metaapi.cloud-sdk';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // This line uses the NEW whsec_ key you just updated in Vercel
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;

        try {
            console.log(`Creating MT5 account for: ${customerEmail}`);

            await metaApi.metatraderAccountApi.createAccount({
                name: `Aurivon - ${customerEmail}`,
                type: 'cloud-g2',
                platform: 'mt5', // Matched to your MT5 Provisioning Profile
                region: 'vint-hill',
                server: 'Eightcap-Demo', 
                provisioningProfileId: '39ff1aa7-8fc0-44b8-9798-77fb192213c6', // Your exact Profile ID
                magic: 123456,
                login: '0', 
                password: 'TraderPassword123',
                quoteStreamingIntervalInSeconds: 2.5
            });

            console.log("SUCCESS: Account Provisioned in MetaApi");
        } catch (error) {
            console.error("MetaApi Creation Failed:", error.message);
        }
    }

    res.json({ received: true });
}
