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
  let adsClickIds = {};
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    planType = (body.planType || 'premium').toLowerCase();
    userEmail = body.userEmail || '';
    userId = body.userId || '';
    adsClickIds = body.adsClickIds || {};
  } catch (e) {
    // If body parsing fails, default to premium
    planType = 'premium';
  }
  
  if (!adsClickIds || typeof adsClickIds !== 'object') {
    adsClickIds = {};
  }
  const gclid = typeof adsClickIds.gclid === 'string' ? adsClickIds.gclid : '';
  const gbraid = typeof adsClickIds.gbraid === 'string' ? adsClickIds.gbraid : '';
  const wbraid = typeof adsClickIds.wbraid === 'string' ? adsClickIds.wbraid : '';

  // #region agent log
  if (process.env.NODE_ENV !== 'production') {
    fetch('http://127.0.0.1:7242/ingest/a94af8c8-4978-4bdd-878c-120b1bb5f3d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:(req.headers['x-debug-runid']||'pre-fix'),hypothesisId:'C',location:'api/create-checkout-session.js:postParse',message:'Request parsed',data:{method:req.method,planType,hasSecretKey:!!secretKey,hasClerkHeader:!!req.headers['x-clerk-userid'],hasUserIdInBody:!!userId,hasEmailInBody:!!userEmail},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
  
  // Validate planType - only monthly ($3.99/month) and lifetime ($12 one-time) are supported
  // Note: 'premium' is deprecated but treated as 'monthly' for backwards compatibility
  if (!['monthly', 'lifetime', 'premium'].includes(planType)) {
    res.status(400).json({ error: 'Invalid planType. Must be monthly or lifetime' });
    return;
  }
  
  // Treat 'premium' as 'monthly' for backwards compatibility
  if (planType === 'premium') {
    planType = 'monthly';
  }
  
  // Get price ID from environment variables based on planType
  let priceId;
  if (planType === 'monthly') {
    priceId = (process.env.STRIPE_PRICE_ID_MONTHLY || '').trim();
  } else if (planType === 'lifetime') {
    priceId = (process.env.STRIPE_PRICE_ID_LIFETIME || '').trim();
  }

  // Use hardcoded URLs to avoid environment variable issues
  // Include plan type in success URL for accurate conversion tracking
  const finalSuccessUrl = `https://www.superfocus.live?premium=1&payment=success&plan=${planType}&session_id={CHECKOUT_SESSION_ID}`;
  const finalCancelUrl = 'https://www.superfocus.live';

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
    const stripe = new Stripe(secretKey);

    // Determine mode based on planType
    const mode = planType === 'lifetime' ? 'payment' : 'subscription';

    // Create checkout session config
    // Monthly: $3.99/month subscription
    // Lifetime: $12 one-time payment
    const metadata = {
      clerk_user_id: (req.headers['x-clerk-userid'] || userId || '').toString(),
      app_name: 'Superfocus',
      app_version: '1.0',
      business_name: 'Superfocus',
      business_type: 'Pomodoro Timer & Focus App',
      payment_type: planType, // monthly or lifetime
    };
    
    if (gclid) {
      metadata.gclid = gclid;
    }
    if (gbraid) {
      metadata.gbraid = gbraid;
    }
    if (wbraid) {
      metadata.wbraid = wbraid;
    }
    
    const sessionConfig = {
      mode: mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pass Clerk user id and payment type in metadata
      metadata: metadata,
      // Pre-fill user email to prevent email mismatch
      customer_email: userEmail || undefined,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    };
    
    // Ensure Checkout creates a Stripe Customer for one-time payments
    // so webhook handling can always link to a customer.
    if (mode === 'payment') {
      sessionConfig.customer_creation = 'always';
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

    // Track Stripe Checkout Session Created to GA4 (server-side backup)
    // This ensures tracking even if client-side fails
    try {
      const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID || 'G-T3T0PES8C0';
      const ga4ApiSecret = process.env.GA4_API_SECRET;
      
      if (ga4ApiSecret) {
        const clientId = userEmail 
          ? `server.${userEmail.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)}.${Date.now()}`
          : `server.checkout.${Date.now()}`;
        
        const ga4Payload = {
          client_id: clientId,
          user_id: userEmail ? userEmail.toLowerCase() : undefined,
          events: [{
            name: 'begin_checkout',
            params: {
              transaction_id: session.id,
              value: planType === 'lifetime' ? 12.0 : 3.99,
              currency: 'USD',
              plan_type: planType,
              source: 'server_checkout_created',
              items: [{
                item_id: `premium_${planType}`,
                item_name: `Premium ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
                price: planType === 'lifetime' ? 12.0 : 3.99,
                quantity: 1
              }]
            }
          }]
        };
        
        const ga4Url = `https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4ApiSecret}`;
        
        // Fire and forget - don't block the response
        fetch(ga4Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ga4Payload)
        }).then(response => {
          if (response.ok || response.status === 204) {
            console.log(`✅ GA4 begin_checkout event sent for ${planType}`);
          } else {
            console.warn(`⚠️ GA4 begin_checkout failed: ${response.status}`);
          }
        }).catch(err => {
          console.warn('⚠️ GA4 begin_checkout error:', err.message);
        });
      }
    } catch (trackingError) {
      console.warn('⚠️ Server-side checkout tracking error:', trackingError.message);
      // Don't fail the checkout if tracking fails
    }

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
