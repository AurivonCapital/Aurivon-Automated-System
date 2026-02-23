import { createClient } from '@supabase/supabase-js';

// TEMP TEST: Hardcoding keys to bypass Vercel settings
const supabaseUrl = 'https://ohzhcerywciamruionxj.supabase.co'; 
const supabaseKey = 'sb_secret_zs05Z00qYvrwgbI_JspR0Q_VYE9gL8T'; 

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    const { email, pass } = req.body;

    // This checks your Supabase table for the exact user
    const { data: trader, error } = await supabase
        .from('traders')
        .select('*')
        .eq('email', email)
        .eq('access_key', pass)
        .single();

    if (error || !trader) {
        console.error("Database check failed:", error);
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
