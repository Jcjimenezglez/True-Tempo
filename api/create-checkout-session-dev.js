// Development version of Stripe Checkout session creator
// This version uses localhost URLs for testing

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Read and sanitize env vars
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  const priceId = (process.env.STRIPE_PRICE_ID || '').trim();
  
  // Use localhost URLs for development
  const finalSuccessUrl = 'http://localhost:3000?premium=1&payment=success&session_id={CHECKOUT_SESSION_ID}';
  const finalCancelUrl = 'http://localhost:3000';

  // Basic validation with clear error responses
  if (!secretKey || !/^sk_(live|test)_/.test(secretKey)) {
    res.status(500).json({ error: 'Invalid STRIPE_SECRET_KEY' });
    return;
  }
  if (!priceId || !/^price_/.test(priceId)) {
    res.status(500).json({ error: 'Invalid STRIPE_PRICE_ID' });
    return;
  }
  
  try {
    // Validate URLs to avoid Stripe "url_invalid"
    new URL(finalSuccessUrl);
    new URL(finalCancelUrl);
  } catch (_) {
    res.status(500).json({ error: 'Invalid redirect URLs for Stripe' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2025-12-18.acacia' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pass Clerk user id if present so webhook can mark premium
      metadata: {
        clerk_user_id: (req.headers['x-clerk-userid'] || '').toString(),
        app_name: 'Superfocus',
        app_version: '1.0-dev',
        business_name: 'Superfocus',
        business_type: 'Pomodoro Timer & Focus App (Development)',
      },
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      custom_fields: [
        {
          key: 'company_name',
          label: {
            type: 'custom',
            custom: 'Company (Optional)',
          },
          type: 'text',
          optional: true,
        },
      ],
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = (err && err.message) || 'Failed to create checkout session';
    res.status(500).json({ error: message });
  }
};
