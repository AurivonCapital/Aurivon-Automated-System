import MetaApi from 'metaapi.cloud-sdk';

const api = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    const { accountId, symbol, type, lots } = req.body;

    try {
        const account = await api.metatraderAccountApi.getAccount(accountId);
        const connection = account.getStreamingConnection();
        await connection.connect();
        await connection.waitSynchronized();

        // This line sends the order to Eightcap
        const result = await connection.createMarketOrder(symbol, type, lots, {});
        
        res.status(200).json({ success: true, orderId: result.orderId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
