// Minimal Vercel serverless function to create a Stripe Checkout session
// Expects environment variables configured in Vercel project settings:
// STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const successUrl = process.env.STRIPE_SUCCESS_URL || 'https://example.com?premium=1';
  const cancelUrl = process.env.STRIPE_CANCEL_URL || 'https://example.com';

  if (!secretKey || !priceId) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};


