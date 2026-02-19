import MetaApi from 'metaapi.cloud-sdk';

const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { accountId } = req.body;

    try {
        const account = await metaApi.metatraderAccountApi.getAccount(accountId);
        const connection = await account.getStreamingConnection();
        await connection.connect();
        await connection.waitSynchronized();

        // Get all active positions
        const positions = connection.terminalState.positions;
        
        if (positions.length === 0) {
            return res.status(200).json({ success: true, message: 'No positions to close' });
        }

        // Loop through and close everything
        const closePromises = positions.map(pos => 
            connection.closePosition(pos.id)
        );

        await Promise.all(closePromises);

        res.status(200).json({ success: true, message: `Closed ${positions.length} positions` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
