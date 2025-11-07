// Clean, validated Stripe Checkout session creator
// Env vars required (Vercel -> Project Settings -> Environment Variables):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_ID_MONTHLY, STRIPE_PRICE_ID_YEARLY, STRIPE_PRICE_ID_LIFETIME

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Read and sanitize env vars
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  
  // Get planType from request body (monthly, yearly, lifetime)
  let planType = 'monthly'; // Default to monthly
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    planType = (body.planType || 'monthly').toLowerCase();
  } catch (e) {
    // If body parsing fails, default to monthly
    planType = 'monthly';
  }
  
  // Validate planType
  if (!['monthly', 'yearly', 'lifetime'].includes(planType)) {
    res.status(400).json({ error: 'Invalid planType. Must be monthly, yearly, or lifetime' });
    return;
  }

  // Get price ID from environment variables based on planType
  let priceId;
  if (planType === 'monthly') {
    priceId = (process.env.STRIPE_PRICE_ID_MONTHLY || '').trim();
  } else if (planType === 'yearly') {
    priceId = (process.env.STRIPE_PRICE_ID_YEARLY || '').trim();
  } else if (planType === 'lifetime') {
    priceId = (process.env.STRIPE_PRICE_ID_LIFETIME || '').trim();
  }

  // Use hardcoded URLs to avoid environment variable issues
  const finalSuccessUrl = 'https://www.superfocus.live?premium=1&payment=success';
  const finalCancelUrl = 'https://www.superfocus.live';

  // Basic validation with clear error responses
  if (!secretKey || !/^sk_(live|test)_/.test(secretKey)) {
    res.status(500).json({ error: 'Invalid STRIPE_SECRET_KEY' });
    return;
  }
  if (!priceId || !/^price_/.test(priceId)) {
    res.status(500).json({ error: `Invalid STRIPE_PRICE_ID for ${planType}. Please check environment variables.` });
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

    // Determine mode based on planType
    const mode = planType === 'lifetime' ? 'payment' : 'subscription';

    const session = await stripe.checkout.sessions.create({
      mode: mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pass Clerk user id and payment type in metadata
      metadata: {
        clerk_user_id: (req.headers['x-clerk-userid'] || '').toString(),
        app_name: 'Superfocus',
        app_version: '1.0',
        business_name: 'Superfocus',
        business_type: 'Pomodoro Timer & Focus App',
        payment_type: planType, // monthly, yearly, or lifetime
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

    console.log(`✅ Checkout session created for ${planType} plan`);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = (err && err.message) || 'Failed to create checkout session';
    res.status(500).json({ error: message });
  }
};
