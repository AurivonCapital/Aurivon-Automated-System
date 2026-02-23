import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

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
