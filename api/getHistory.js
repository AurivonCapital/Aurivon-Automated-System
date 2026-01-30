import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

export default async function historyHandler(req, res) {
    const { accountId } = req.query;

    if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
    }

    try {
        const metaStats = api.metaStatsApi;
        // This fetches the last 5 closed trades for this specific account
        const history = await metaStats.getHistory(accountId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
        
        const simplifiedHistory = history.slice(-5).map(trade => ({
            symbol: trade.symbol,
            type: trade.type,
            volume: trade.volume,
            profit: trade.profit,
            time: trade.closeTime
        }));

        res.status(200).json(simplifiedHistory);
    } catch (error) {
        res.status(500).json({ error: "History Fetch Failed" });
    }
}
