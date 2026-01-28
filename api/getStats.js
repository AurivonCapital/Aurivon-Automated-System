export default async function handler(req, res) {
    const TOKEN = process.env.METAAPI_TOKEN;
    const ID = "d769e348-5db8-4df0-97f9-5b45bdb8b8c3"; 

    try {
        const response = await fetch(`https://metastats-api.new-york.agiliumtrade.ai/users/current/accounts/${ID}/summary`, {
            headers: { 'auth-token': TOKEN }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Connection Failed" });
    }
}
