import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';

// 1. Setup the tools
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    // 2. Verify the payment is real
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

    // 3. If payment is successful, do the magic
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        
        // Create a random 8-character password for the trader
        const generatedPass = Math.random().toString(36).slice(-8).toUpperCase();
        
        // Get the MetaApi ID (falls back to your main ID if not specified in checkout)
        const metaId = session.metadata.metaAccountId || process.env.DEFAULT_META_ID;

        // A. Save the user to your Supabase "traders" table
        const { error: dbError } = await supabase.from('traders').insert([
            { email: customerEmail, access_key: generatedPass, meta_account_id: metaId }
        ]);

        if (dbError) {
            console.error("Database Error:", dbError);
        } else {
            // B. Send the email with the password to the customer
            await resend.emails.send({
                from: 'Aurivon Capital <access@aurivon.com>',
                to: customerEmail,
                subject: 'Your Institutional Terminal Access Key',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Welcome to Aurivon Capital</h2>
                        <p>Your payment was successful. Here are your login credentials for the terminal:</p>
                        <p><strong>Email:</strong> ${customerEmail}</p>
                        <p><strong>Access Key:</strong> ${generatedPass}</p>
                        <br>
                        <a href="https://yourdomain.com/login.html" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Terminal</a>
                    </div>
                `
            });
        }
    }

    res.json({ received: true });
}
