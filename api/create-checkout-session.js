// Clean, validated Stripe Checkout session creator
// Env vars required (Vercel -> Project Settings -> Environment Variables):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Read and sanitize env vars
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  const priceId = (process.env.STRIPE_PRICE_ID || '').trim();
  const successUrl = (process.env.STRIPE_SUCCESS_URL || 'https://www.superfocus.live?premium=1').trim();
  const cancelUrl = (process.env.STRIPE_CANCEL_URL || 'https://www.superfocus.live').trim();
  
  // Ensure URLs are properly formatted for Apple Pay
  const finalSuccessUrl = successUrl.includes('?') ? 
    `${successUrl}&payment=success` : 
    `${successUrl}?payment=success`;
  const finalCancelUrl = cancelUrl;

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
    // Throws if invalid
    // eslint-disable-next-line no-new
    new URL(finalSuccessUrl);
    // eslint-disable-next-line no-new
    new URL(finalCancelUrl);
  } catch (_) {
    res.status(500).json({ error: 'Invalid redirect URLs for Stripe' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

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
        app_version: '1.0',
        business_name: 'Superfocus',
        business_type: 'Pomodoro Timer & Focus App',
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
      // Use the Superfocus payment configuration (includes all payment methods)
      payment_method_configuration: 'pmc_1SD9HJIMJUHQfsp7OLiiVSXL',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = (err && err.message) || 'Failed to create checkout session';
    res.status(500).json({ error: message });
  }
};
