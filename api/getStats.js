import MetaApi from 'metaapi.cloud-sdk';

const api = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    const { accountId } = req.query;

    try {
        const account = await api.metatraderAccountApi.getAccount(accountId);
        const connection = account.getStreamingConnection();
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
        res.status(500).json({ success: false, error: error.message });
    }
}
