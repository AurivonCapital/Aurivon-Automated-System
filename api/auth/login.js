import { createClient } from '@supabase/supabase-js';

// 1. Initialize variables (Checking both standard and Public naming)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Prevent the "Required" crash by checking keys before initializing
const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 3. Safety Check for Environment Variables
    if (!supabase) {
        console.error("CRITICAL: Environment variables missing. URL:", !!supabaseUrl, "KEY:", !!supabaseKey);
        return res.status(500).json({ 
            success: false, 
            message: "SERVER CONFIGURATION ERROR",
            details: "API Keys are not being detected by Vercel."
        });
    }

    try {
        const { email, pass } = req.body;

        // 4. Check 'traders' table
        const { data: trader, error } = await supabase
            .from('traders')
            .select('*')
            .eq('email', email)
            .eq('access_key', pass)
            .single();

        if (error || !trader) {
            return res.status(401).json({ success: false, message: "INVALID CREDENTIALS" });
        }

        // 5. Success
        return res.status(200).json({
            success: true,
            user: {
                name: trader.email,
                metaAccountId: trader.meta_account_id,
                role: trader.role || 'trader'
            }
        });

    } catch (err) {
        console.error("Internal Server Error:", err);
        return res.status(500).json({ success: false, message: "INTERNAL SERVER ERROR" });
    }
}
