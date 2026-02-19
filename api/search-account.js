import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

export default async function handler(req, res) {
    const { traderID } = req.query;

    if (!traderID) return res.status(400).json({ error: "ID required" });

    try {
        // 1. Get ALL accounts from your MetaApi
        const accounts = await api.metatraderAccountApi.getAccounts();

        // 2. Search for the account that matches the name the user typed
        // Example: If they type "john@email.com", we look for "Aurivon - john@email.com"
        const foundAccount = accounts.find(acc => 
            acc.name.toLowerCase().includes(traderID.toLowerCase())
        );

        if (foundAccount) {
            // Success! Send the account details back to the website
            res.status(200).json({
                success: true,
                account: {
                    id: foundAccount.id,
                    name: foundAccount.name,
                    platform: foundAccount.platform
                }
            });
        } else {
            res.status(404).json({ success: false, message: "Trader ID not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
}
