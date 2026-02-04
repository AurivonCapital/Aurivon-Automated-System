import { MetaApi } from 'metaapi.cloud-sdk';

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

// YOUR MASTER POOL OF 20 ACCOUNTS
// You will replace '1001', 'p1', etc., with your actual broker details.
const mt4Pool = [
    { id: "slot_1", login: '1001', password: 'p1', server: 'Broker-Demo', status: 'available' },
    { id: "slot_2", login: '1002', password: 'p2', server: 'Broker-Demo', status: 'available' },
    { id: "slot_3", login: '1003', password: 'p3', server: 'Broker-Demo', status: 'available' },
    { id: "slot_4", login: '1004', password: 'p4', server: 'Broker-Demo', status: 'available' },
    { id: "slot_5", login: '1005', password: 'p5', server: 'Broker-Demo', status: 'available' },
    { id: "slot_6", login: '1006', password: 'p6', server: 'Broker-Demo', status: 'available' },
    { id: "slot_7", login: '1007', password: 'p7', server: 'Broker-Demo', status: 'available' },
    { id: "slot_8", login: '1008', password: 'p8', server: 'Broker-Demo', status: 'available' },
    { id: "slot_9", login: '1009', password: 'p9', server: 'Broker-Demo', status: 'available' },
    { id: "slot_10", login: '1010', password: 'p10', server: 'Broker-Demo', status: 'available' },
    { id: "slot_11", login: '1011', password: 'p11', server: 'Broker-Demo', status: 'available' },
    { id: "slot_12", login: '1012', password: 'p12', server: 'Broker-Demo', status: 'available' },
    { id: "slot_13", login: '1013', password: 'p13', server: 'Broker-Demo', status: 'available' },
    { id: "slot_14", login: '1014', password: 'p14', server: 'Broker-Demo', status: 'available' },
    { id: "slot_15", login: '1015', password: 'p15', server: 'Broker-Demo', status: 'available' },
    { id: "slot_16", login: '1016', password: 'p16', server: 'Broker-Demo', status: 'available' },
    { id: "slot_17", login: '1017', password: 'p17', server: 'Broker-Demo', status: 'available' },
    { id: "slot_18", login: '1018', password: 'p18', server: 'Broker-Demo', status: 'available' },
    { id: "slot_19", login: '1019', password: 'p19', server: 'Broker-Demo', status: 'available' },
    { id: "slot_20", login: '1020', password: 'p20', server: 'Broker-Demo', status: 'available' }
];

export default async function handler(req, res) {
    // Only allow POST requests (which is what Stripe sends)
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { traderEmail } = req.body;

        // 1. Find the first empty account in your 20-slot pool
        const accountToAssign = mt4Pool.find(acc => acc.status === 'available');

        if (!accountToAssign) {
            return res.status(500).json({ error: "All 20 slots are full." });
        }

        // 2. Register the account on MetaApi Cloud
        const metaAccount = await api.metatraderAccountApi.createAccount({
            name: `Trader: ${traderEmail}`,
            type: 'cloud',
            login: accountToAssign.login,
            password: accountToAssign.password,
            server: accountToAssign.server,
            platform: 'mt4',
            application: 'MetaApi'
        });

        // 3. Deploy the account so it starts tracking LIVE
        await metaAccount.deploy();

        // 4. Send back the success signal
        res.status(200).json({
            success: true,
            accountId: metaAccount.id,
            login: accountToAssign.login,
            trader: traderEmail
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
