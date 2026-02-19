import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

export default async function handler(req, res) {
    // 1. Grab the Email (traderID) and the Key from the login screen
    const { traderID, key } = req.query;

    if (!traderID || !key) {
        return res.status(400).json({ error: "Email and Access Key are required" });
    }

    try {
        // 2. Fetch all accounts from your MetaApi dashboard
        const accounts = await api.metatraderAccountApi.getAccounts();

        // 3. Search for the account where the Name contains BOTH the email and the key
        // We stored it as: Aurivon|email|key
        const foundAccount = accounts.find(acc => {
            const accountName = acc.name.toLowerCase();
            return accountName.includes(traderID.toLowerCase()) && 
                   accountName.includes(key.toLowerCase());
        });

        if (foundAccount) {
            // Success! The credentials match an existing account.
            res.status(200).json({
                success: true,
                account: {
                    id: foundAccount.id,
                    name: foundAccount.name
                }
            });
        } else {
            // If no match is found, we deny access
            res.status(401).json({ success: false, message: "Invalid Trader ID or Access Key" });
        }
    } catch (error) {
        console.error("Search error:", error.message);
        res.status(500).json({ error: "Internal server error during verification" });
    }
}
