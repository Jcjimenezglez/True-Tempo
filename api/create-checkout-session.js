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
  
  // Get planType from request body (premium, monthly, yearly, lifetime)
  let planType = 'premium'; // Default to premium
  let userEmail = '';
  let userId = '';
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    planType = (body.planType || 'premium').toLowerCase();
    userEmail = body.userEmail || '';
    userId = body.userId || '';
  } catch (e) {
    // If body parsing fails, default to premium
    planType = 'premium';
  }

  // #region agent log
  if (process.env.NODE_ENV !== 'production') {
    fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'C',location:'api/create-checkout-session.js:postParse',message:'Request parsed',data:{method:req.method,planType,hasSecretKey:!!secretKey,hasClerkHeader:!!req.headers['x-clerk-userid'],hasUserIdInBody:!!userId,hasEmailInBody:!!userEmail},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
  
  // Validate planType
  if (!['premium', 'monthly', 'yearly', 'lifetime'].includes(planType)) {
    res.status(400).json({ error: 'Invalid planType. Must be premium, monthly, yearly, or lifetime' });
    return;
  }
  
  // Get price ID from environment variables based on planType
  let priceId;
  if (planType === 'premium') {
    priceId = (process.env.STRIPE_PRICE_ID_PREMIUM || '').trim();
  } else if (planType === 'monthly') {
    priceId = (process.env.STRIPE_PRICE_ID_MONTHLY || '').trim();
  } else if (planType === 'yearly') {
    priceId = (process.env.STRIPE_PRICE_ID_YEARLY || '').trim();
  } else if (planType === 'lifetime') {
    priceId = (process.env.STRIPE_PRICE_ID_LIFETIME || '').trim();
  }

  // Use hardcoded URLs to avoid environment variable issues
  const finalSuccessUrl = 'https://www.superfocus.live?premium=1&payment=success&session_id={CHECKOUT_SESSION_ID}';
  const finalCancelUrl = 'https://www.superfocus.live/pricing?canceled=1';

  // Basic validation with clear error responses
  if (!secretKey || !/^sk_(live|test)_/.test(secretKey)) {
    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'C',location:'api/create-checkout-session.js:invalidSecretKey',message:'Invalid STRIPE_SECRET_KEY',data:{planType,secretKeyLooksValid:false},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
    res.status(500).json({ error: 'Invalid STRIPE_SECRET_KEY' });
    return;
  }
  if (!priceId || !/^price_/.test(priceId)) {
    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'C',location:'api/create-checkout-session.js:invalidPriceId',message:'Invalid STRIPE_PRICE_ID for plan',data:{planType,priceIdLooksValid:false},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
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

    // For Premium plan with trial, add subscription data to clarify $0 today
    const sessionConfig = {
      mode: mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pass Clerk user id and payment type in metadata
      metadata: {
        clerk_user_id: (req.headers['x-clerk-userid'] || userId || '').toString(),
        app_name: 'Superfocus',
        app_version: '1.0',
        business_name: 'Superfocus',
        business_type: 'Pomodoro Timer & Focus App',
        payment_type: planType, // premium, monthly, yearly, or lifetime
      },
      // Pre-fill user email to prevent email mismatch
      customer_email: userEmail || undefined,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      // Use the Superfocus payment configuration (includes all payment methods)
      payment_method_configuration: 'pmc_1SD9HJIMJUHQfsp7OLiiVSXL',
    };

    // For Premium plan with trial, add subscription description and trial period
    if (planType === 'premium' && mode === 'subscription') {
      // Verify the price has trial configured
      let trialPeriodDays = 30; // Default to 30 days (1 month)
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('📋 Price details:', {
          id: price.id,
          amount: price.unit_amount,
          recurring: price.recurring,
          trial_period_days: price.recurring?.trial_period_days
        });
        
        if (price.recurring?.trial_period_days) {
          trialPeriodDays = price.recurring.trial_period_days;
          console.log(`✅ Using trial period from price: ${trialPeriodDays} days`);
        } else {
          console.error('❌ WARNING: Price does not have trial_period_days configured!');
          console.error('   Using default trial period of 30 days.');
        }
      } catch (priceError) {
        console.error('❌ Error retrieving price:', priceError);
        console.log('   Using default trial period of 30 days.');
      }
      
      // IMPORTANT: Stripe requires trial_period_days to be explicitly set in subscription_data
      // even if the price has trial_period_days configured, due to deprecation of trial_from_plan
      sessionConfig.subscription_data = {
        trial_period_days: trialPeriodDays, // Explicitly set trial period (required by Stripe)
        description: '1 month free trial. You will be charged $3.99/month after the trial ends. Cancel anytime.',
        metadata: {
          trial_info: '1 month free, then $3.99/month',
        },
      };
      
      console.log(`✅ Premium trial configured: ${trialPeriodDays} days free trial`);
    }

    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'D',location:'api/create-checkout-session.js:beforeStripeCreate',message:'Creating Stripe checkout session',data:{planType,mode,hasCustomerEmail:!!sessionConfig.customer_email,hasClerkUserId:!!sessionConfig.metadata?.clerk_user_id},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'D',location:'api/create-checkout-session.js:afterStripeCreate',message:'Stripe checkout session created',data:{planType,mode,sessionId:session.id,hasUrl:!!session.url},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
    
    // Log session details for debugging
    console.log('📋 Checkout session created:', {
      id: session.id,
      mode: session.mode,
      subscription: session.subscription,
      customer: session.customer,
      payment_status: session.payment_status
    });

    console.log(`✅ Checkout session created for ${planType} plan`);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = (err && err.message) || 'Failed to create checkout session';

    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'C',location:'api/create-checkout-session.js:stripeCatch',message:'Stripe checkout error',data:{planType,name:err&&err.name?String(err.name):'unknown',type:err&&err.type?String(err.type):undefined,code:err&&err.code?String(err.code):undefined,message:message?String(message).slice(0,200):'unknown'},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion

    res.status(500).json({ error: message });
  }
};
