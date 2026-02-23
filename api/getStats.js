import MetaApi from 'metaapi.cloud-sdk';

const api = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: "Missing Account ID" });

    try {
        const account = await api.metatraderAccountApi.getAccount(accountId);
        
        // Ensure the account is deployed/online
        if (account.state !== 'DEPLOYED') {
            return res.status(200).json({ success: false, message: "Account is offline in MetaApi" });
        }

        const connection = account.getStreamingConnection(); // Some versions need await here
        await connection.connect();
        await connection.waitSynchronized();

        const stats = connection.terminalState.accountInformation;
        const positions = connection.terminalState.positions;

        res.status(200).json({
            success: true,
            balance: stats.balance,
            equity: stats.equity,
            profit: stats.profit,
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
        console.error("Stats Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}
