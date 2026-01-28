export default async function handler(req, res) {
    // This grabs your secret token from the Vercel "Vault"
    const TOKEN = process.env.METAAPI_TOKEN;
    
    // This is the Account ID you've been using in your code
    const ID = "d769e348-5db8-4df0-97f9-5b45bdb8b8c3"; 

    try {
        const response = await fetch(`https://metastats-api.new-york.agiliumtrade.ai/users/current/accounts/${ID}/summary`, {
            headers: { 
                'auth-token': TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // This sends the balance, equity, and profit back to your dashboard
        res.status(200).json(data);
    } catch (error) {
        // This will print the actual error on your tablet screen
        res.status(500).json({ 
            error: "Connection Failed", 
            details: error.message,
            tokenExists: !!process.env.METAAPI_TOKEN 
        });
    }
