import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

// List your 20 Account IDs here
const traderAccounts = [
    "d769e348-5db8-4df0-97f9-5b45bdb8b8c3", // Account 1
    "ACCOUNT_ID_2", 
    "ACCOUNT_ID_3",
    "ACCOUNT_ID_4",
    "ACCOUNT_ID_5",
    "ACCOUNT_ID_6",
    "ACCOUNT_ID_7",
    "ACCOUNT_ID_8",
    "ACCOUNT_ID_9",
    "ACCOUNT_ID_10",
    "ACCOUNT_ID_11",
    "ACCOUNT_ID_12",
    "ACCOUNT_ID_13",
    "ACCOUNT_ID_14",
    "ACCOUNT_ID_15",
    "ACCOUNT_ID_16",
    "ACCOUNT_ID_17",
    "ACCOUNT_ID_18",
    "ACCOUNT_ID_19",
    "ACCOUNT_ID_20"
];

export default async function dashboardHandler(req, res) {
    try {
        const metaStats = api.metaStatsApi;

        // Fetch metrics for all 20 accounts in parallel
        const dashboardData = await Promise.all(
            traderAccounts.map(async (id) => {
                try {
                    // If the ID is still a placeholder, return an "Empty" row
                    if (id.includes("ACCOUNT_ID")) {
                        return { accountId: id, status: "Empty Slot", balance: 0, equity: 0, profit: 0 };
                    }
                    
                    const stats = await metaStats.getMetrics(id);
                    return {
                        accountId: id,
                        status: "Online",
                        balance: stats.balance || 0,
                        equity: stats.equity || 0,
                        profit: (stats.equity - stats.balance) || 0
                    };
                } catch (e) {
                    return { accountId: id, status: "Offline", balance: 0, equity: 0, profit: 0 };
                }
            })
        );

        res.status(200).json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data", details: error.message });
    }
}
