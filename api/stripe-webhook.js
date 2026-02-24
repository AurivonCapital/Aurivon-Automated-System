import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';
import MetaApi from 'metaapi.cloud-sdk';

// 1. INITIALIZE ALL TOOLS
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    // 2. VERIFY THE STRIPE PAYMENT
    try {
        const buf = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => resolve(Buffer.from(data)));
        });
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 3. IF PAYMENT IS SUCCESSFUL, CREATE THE TRADER
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        const traderName = session.customer_details.name || "Aurivon Trader";
        
        // Generate a random Dashboard Password for them
        const generatedPass = Math.random().toString(36).slice(-8).toUpperCase();

        try {
            // STEP A: Request a BRAND NEW MT4 Demo Account from MetaApi
            // This happens automatically on the broker's server (e.g. Eightcap)
            const accountCredentials = await metaApi.metatraderAccountGeneratorApi.createMT4DemoAccount({
                name: traderName,
                email: customerEmail,
                balance: 100000, // Starting balance for the evaluation
                leverage: 100,
                accountType: 'demo', // Check your broker's specific naming
                serverName: 'Eightcap-Demo' // Change to your broker's server name
            }, process.env.PROVISIONING_PROFILE_ID);

            // STEP B: Save this information to your Supabase "traders" table
            const { error: dbError } = await supabase.from('traders').insert([
                { 
                    email: customerEmail, 
                    access_key: generatedPass, 
                    meta_account_id: accountCredentials.id, // This links the dashboard
                    mt4_login: accountCredentials.login,
                    mt4_password: accountCredentials.password
                }
            ]);

            if (dbError) throw dbError;

            // STEP C: Send the Email with the Dashboard Login AND MT4 Credentials
            await resend.emails.send({
                from: 'Aurivon Capital <access@aurivon.com>',
                to: customerEmail,
                subject: 'Your Evaluation Credentials - Aurivon Capital',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
                        <h2 style="color: #2563eb;">Welcome to Aurivon Capital</h2>
                        <p>Your payment was successful. Your institutional trading terminal is ready.</p>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin-top: 0;">1. Dashboard Access (Web Terminal)</h3>
                            <p><strong>URL:</strong> <a href="https://yourdomain.com/login.html">Login Here</a></p>
                            <p><strong>Email:</strong> ${customerEmail}</p>
                            <p><strong>Access Key:</strong> ${generatedPass}</p>
                        </div>

                        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px;">
                            <h3 style="margin-top: 0;">2. MT4 Direct Credentials (For Mobile/Desktop)</h3>
                            <p><strong>Login:</strong> ${accountCredentials.login}</p>
                            <p><strong>Password:</strong> ${accountCredentials.password}</p>
                            <p><strong>Server:</strong> Eightcap-Demo</p>
                        </div>
                        
                        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                            Please note: It may take 2-3 minutes for the MT4 credentials to become active on the broker server.
                        </p>
                    </div>
                `
            });

        } catch (error) {
            console.error("AUTOMATION FAILED:", error.message);
            // Even if it fails, we return 200 to Stripe so it doesn't keep retrying
        }
    }

    res.json({ received: true });
}
