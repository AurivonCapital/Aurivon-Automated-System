import MetaApi from 'metaapi.cloud-sdk';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify the payment is real and from Stripe
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // When the payment is successful...
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;

        try {
            console.log(`Creating MetaApi account for: ${customerEmail}`);

            // This tells MetaApi to create the actual Eightcap account
            await metaApi.metatraderAccountApi.createAccount({
                name: `Aurivon - ${customerEmail}`,
                type: 'cloud-g2', // Updated to the recommended high-performance type
                platform: 'mt4',
                region: 'vint-hill',
                server: 'Eightcap-Demo', 
                // !!! PASTE YOUR PROVISIONING PROFILE ID BELOW !!!
                provisioningProfileId: '39ff1aa7-8fc0-44b8-9798-77fb192213c6', 
                magic: 123456, // Required by MetaApi to track trades
                login: '0',    // Set as string '0' so MetaApi knows to wait for credentials
                password: 'TraderPassword123',
                quoteStreamingIntervalInSeconds: 2.5
            });

            console.log("Account Created Successfully");
        } catch (error) {
            console.error("MetaApi Error details:", error.message);
        }
    }

    res.json({ received: true });
}
