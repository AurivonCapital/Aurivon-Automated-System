import MetaApi from 'metaapi.cloud-sdk';

export default async function dashboardHandler(req, res) {
  // Use the secret token from your Vercel settings
  const token = process.env.METAAPI_TOKEN;
  const api = new MetaApi(token);

  // YOUR 20 TRADER IDs
  // Replace these with your actual IDs from the MetaApi dashboard
  const traderAccounts = [
    "d769e348-5db8-4df0-97f9-5b45bdb8b8c3",
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

  try {
    if (!token) {
      return res.status(500).json({ error: "API Token missing in Vercel Environment Variables" });
    }

    const metaStats = api.metaStatsApi;

    // This fetches data for all 20 accounts at once
    const dashboardData = await Promise.all(
      traderAccounts.map(async (id) => {
        if (id.includes("ACCOUNT_ID")) {
          return { accountId: id, status: "Empty Slot", balance: 0, equity: 0, profit: 0 };
        }

        try {
          const metrics = await metaStats.getMetrics(id);
          return {
            accountId: id,
            status: "Online",
            balance: metrics.balance || 0,
            equity: metrics.equity || 0,
            profit: metrics.profit || 0
          };
        } catch (err) {
          return { accountId: id, status: "Offline", balance: 0, equity: 0, profit: 0 };
        }
      })
    );

    return res.status(200).json(dashboardData);

  } catch (error) {
    return res.status(500).json({ error: "Server Error: " + error.message });
  }
}
