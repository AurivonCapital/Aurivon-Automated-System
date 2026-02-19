import MetaApi from 'metaapi.cloud-sdk';
const Stripe = require('stripe');
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };

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
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;

        // 1. GENERATE PERMANENT ACCESS KEY (Random 8 characters)
        const permanentKey = Math.random().toString(36).slice(-8).toUpperCase();

        try {
            // 2. CREATE ACCOUNT (We store the key in the Account Name for searchability)
            const account = await metaApi.metatraderAccountApi.createAccount({
                name: `Aurivon|${customerEmail}|${permanentKey}`,
                type: 'cloud-g2',
                platform: 'mt5',
                region: 'vint-hill',
                server: 'Eightcap-Demo',
                provisioningProfileId: '39ff1aa7-8fc0-44b8-9798-77fb192213c6',
                magic: 123456,
                login: process.env.MT4_LOGIN || '0',
                password: 'TraderPassword123'
            });

            // 3. SEND AUTOMATED EMAIL
            await resend.emails.send({
                from: 'Aurivon Capital <onboarding@resend.dev>', // Update this later with your domain
                to: customerEmail,
                subject: 'Your Aurivon Institutional Access',
                html: `
                    <h1>Welcome to the Inner Circle</h1>
                    <p>Your evaluation has been provisioned.</p>
                    <p><strong>Trader ID:</strong> ${customerEmail}</p>
                    <p><strong>Access Key:</strong> ${permanentKey}</p>
                    <br>
                    <p>Login here: <a href="https://your-vercel-url.com/login.html">Trader Terminal</a></p>
                `
            });

            console.log(`✅ Automated Setup Complete for ${customerEmail}`);
        } catch (error) {
            console.error("❌ Automation Error:", error.message);
        }
    }
    res.json({ received: true });
}
