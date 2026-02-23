import { createClient } from '@supabase/supabase-js';

// We added "|| ''" to prevent the 'required' error from stopping the code
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    // This part helps us see what is happening in the Vercel Logs
    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL ERROR: Keys are missing in Vercel settings!");
        return res.status(500).json({ error: "Server Configuration Error" });
    }

    const { email, pass } = req.body;

    const { data: trader, error } = await supabase
        .from('traders')
        .select('*')
        .eq('email', email)
        .eq('access_key', pass)
        .single();

    if (error || !trader) {
        return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }

    return res.status(200).json({
        success: true,
        user: {
            name: trader.email,
            metaAccountId: trader.meta_account_id
        }
    });
}
