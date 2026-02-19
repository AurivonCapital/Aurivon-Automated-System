import MetaApi from 'metaapi.cloud-sdk';

// Initialize MetaApi with your token from Vercel Environment Variables
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { accountId, positionId, volume } = req.body;

  try {
    // 1. Get the account connection
    const account = await metaApi.metatraderAccountApi.getAccount(accountId);
    const connection = await account.getStreamingConnection();
    await connection.connect();
    await connection.waitSynchronized();

    // 2. Execute the close
    // If volume is provided (e.g. 0.05), it does a partial close.
    // If volume is null, it closes the whole position.
    console.log(`Closing position ${positionId} for account ${accountId} with volume: ${volume || 'FULL'}`);
    
    await connection.closePosition(positionId, {
      volume: volume ? parseFloat(volume) : undefined
    });

    res.status(200).json({ success: true, message: 'Trade closed successfully' });
  } catch (error) {
    console.error('Closing Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
