const Stripe = require('stripe');
const MetaApi = require('metaapi.cloud-sdk').default;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Verify the message is really from Stripe
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. If payment is successful, create the MT4 account
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const traderEmail = session.customer_details.email;

    try {
      console.log(`Creating account for: ${traderEmail}`);
      
      // This is where we talk to MetaApi
      const account = await metaapi.metatraderAccountApi.createAccount({
  name: `Trader: ${traderEmail}`,
  type: 'cloud',
  plan: 'v1',
  provisioningProfileId: '51365c22-c0d0-4e35-9f25-1a386bf140bb', // Your ID
  login: 'YOUR_EIGHTCAP_LOGIN',    // Replace with your real MT4 number
  password: process.env.MT4_PASSWORD,   // Replace with your real MT4 master password
  server: 'Eightcap-Demo2',         // Use the correct Eightcap server name
  platform: 'mt4'                  // Specify you are using MT4
});

      console.log('Account created successfully:', account.id);
    } catch (error) {
      console.error('MetaApi Error:', error.message);
    }
  }

  // 3. Tell Stripe we got the message
  res.json({ received: true });
}
