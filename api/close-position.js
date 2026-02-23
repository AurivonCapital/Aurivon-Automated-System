import MetaApi from 'metaapi.cloud-sdk';
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    const { accountId, positionId } = req.body; // Must include positionId

    try {
        const account = await metaApi.metatraderAccountApi.getAccount(accountId);
        const connection = account.getStreamingConnection();
        await connection.connect();
        await connection.waitSynchronized();

        // Close ONLY the specific ID clicked
        await connection.closePosition(positionId);

        res.status(200).json({ success: true, message: `Position ${positionId} closed` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
