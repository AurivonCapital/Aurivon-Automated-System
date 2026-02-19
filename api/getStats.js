import MetaApi from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

export default async function handler(req, res) {
    const { accountId } = req.query;

    if (!accountId) return res.status(400).json({ error: "Account ID required" });

    try {
        const account = await api.metatraderAccountApi.getAccount(accountId);
        
        // Connect to the real-time terminal for this account
        const connection = account.getStreamingConnection();
        await connection.connect();
        await connection.waitSynchronized();

        // Fetch Balance, Equity, and Open Positions
        const accountState = connection.terminalState.accountInformation;
        const positions = connection.terminalState.positions;

        res.status(200).json({
            success: true,
            balance: accountState.balance,
            equity: accountState.equity,
            profit: accountState.profit,
            margin: accountState.margin,
            positions: positions.map(p => ({
                id: p.id,
                symbol: p.symbol,
                type: p.type,
                lots: p.volume,
                openPrice: p.openPrice,
                pnl: p.unrealizedProfit
            }))
        });

    } catch (error) {
        console.error("MetaApi Error:", error.message);
        res.status(500).json({ error: "Failed to fetch live data" });
    }
}
