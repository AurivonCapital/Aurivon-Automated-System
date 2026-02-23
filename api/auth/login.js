import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize if keys exist
const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    if (!supabase) {
        console.error("Environment Variables Missing");
        return res.status(500).json({ success: false, message: "SERVER CONFIG ERROR" });
    }

    try {
        const { email, pass } = req.body;
        const { data: trader, error } = await supabase
            .from('traders')
            .select('*')
            .eq('email', email)
            .eq('access_key', pass)
            .single();

        if (error || !trader) {
            return res.status(401).json({ success: false, message: "INVALID CREDENTIALS" });
        }

        return res.status(200).json({
            success: true,
            user: {
                name: trader.email,
                metaAccountId: trader.meta_account_id
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "INTERNAL ERROR" });
    }
}
