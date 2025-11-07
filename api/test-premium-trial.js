const Stripe = require('stripe');

module.exports = async (req, res) => {
  // Only allow in preview/staging environments
  const hostname = req.headers.host || '';
  const isProduction = hostname.includes('superfocus.live') && !hostname.includes('vercel.app');
  
  if (isProduction) {
    res.status(403).json({ error: 'This endpoint is only available in preview/staging environments' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

  try {
    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    
    // Verify price has trial configured
    const price = await stripe.prices.retrieve(premiumPriceId);
    
    if (!price.recurring?.trial_period_days) {
      res.status(500).json({ 
        error: 'Trial period not configured on price',
        priceId: premiumPriceId,
        trialPeriodDays: price.recurring?.trial_period_days || null
      });
      return;
    }

    // Create a test customer
    const testEmail = `test-${Date.now()}@superfocus-test.com`;
    const customer = await stripe.customers.create({
      email: testEmail,
      description: 'Test customer for Premium trial verification',
    });

    // Create checkout session
    const sessionConfig = {
      mode: 'subscription',
      line_items: [
        {
          price: premiumPriceId,
          quantity: 1,
        },
      ],
      customer: customer.id,
      metadata: {
        clerk_user_id: 'test_user_id',
        payment_type: 'premium',
        test_mode: 'true',
      },
      subscription_data: {
        description: '3 months free trial. You will be charged $3.99/month after the trial ends. Cancel anytime.',
        metadata: {
          trial_info: '3 months free, then $3.99/month',
          test_mode: 'true',
        },
      },
      success_url: `${req.headers.origin || 'https://www.superfocus.live'}/?premium=1&payment=success&test=true`,
      cancel_url: `${req.headers.origin || 'https://www.superfocus.live'}/pricing?test=true`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.status(200).json({
      success: true,
      message: 'Test checkout session created',
      checkoutUrl: session.url,
      customerId: customer.id,
      customerEmail: testEmail,
      sessionId: session.id,
      priceId: premiumPriceId,
      trialPeriodDays: price.recurring.trial_period_days,
      instructions: {
        step1: 'Open the checkoutUrl in your browser',
        step2: 'Use Stripe test card: 4242 4242 4242 4242',
        step3: 'Use any future expiry date (e.g., 12/34)',
        step4: 'Use any 3-digit CVC',
        step5: 'Use any ZIP code',
        step6: 'Complete the checkout',
        step7: 'Verify that you are NOT charged $3.99 immediately',
        step8: 'Verify that the subscription has status "trialing"',
        step9: 'Verify that trial_end is set to 90 days from now',
      },
    });

  } catch (error) {
    console.error('Error creating test checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create test checkout session', 
      details: error.message 
    });
  }
};

