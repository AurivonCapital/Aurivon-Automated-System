import { createClient } from '@supabase/supabase-js';

// 1. Initialize variables from Vercel's environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Create the Supabase client
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 3. Safety Check: Verify keys exist
    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL ERROR: Supabase environment variables are missing in Vercel.");
        return res.status(500).json({ 
            success: false, 
            message: "SERVER CONFIGURATION ERROR",
            details: "Missing API Keys"
        });
    }

    try {
        const { email, pass } = req.body;

        // 4. Query the 'traders' table
        const { data: trader, error } = await supabase
            .from('traders')
            .select('*')
            .eq('email', email)
            .eq('access_key', pass)
            .single();

        // 5. Handle Database Errors or Missing User
        if (error || !trader) {
            console.log("Login failed for:", email);
            return res.status(401).json({ 
                success: false, 
                message: "INVALID CREDENTIALS" 
            });
        }

        // 6. Success: Return user data
        return res.status(200).json({
            success: true,
            user: {
                name: trader.email,
                metaAccountId: trader.meta_account_id,
                role: trader.role || 'trader'
            }
        });

    } catch (err) {
        console.error("Unexpected Server Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "INTERNAL SERVER ERROR" 
        });
    }
}
