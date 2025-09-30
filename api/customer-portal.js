// Vercel serverless function to create a Stripe Customer Portal session
// Expects environment variables configured in Vercel project settings:
// STRIPE_SECRET_KEY

const Stripe = require('stripe');
const { Clerk } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const returnUrl = process.env.STRIPE_RETURN_URL || 'https://www.superfocus.live';
  const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID || 'pmc_1SD9HJIMJUHQfsp7OLiiVSXL';

  if (!secretKey) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    
    // Get customer email from headers or body (sent by client)
    let customerEmail = (req.headers['x-clerk-user-email'] || '').toString().trim();
    
    console.log('Customer Portal Debug:', {
      customerEmail,
      clerkUserId: (req.headers['x-clerk-userid'] || '').toString().trim(),
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY
    });

    // If Clerk user id is provided, fetch email from Clerk (more reliable)
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
    if (!customerEmail && clerkSecret && clerkUserId) {
      try {
        const clerk = new Clerk({ secretKey: clerkSecret });
        const user = await clerk.users.getUser(clerkUserId);
        customerEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
      } catch (e) {
        console.log('Could not fetch user from Clerk:', e?.message);
      }
    }
    try {
      if (!customerEmail && req.body) {
        // Vercel Node functions don't parse body automatically for cjs - try to parse
        const raw = typeof req.body === 'string' ? req.body : undefined;
        const json = raw ? JSON.parse(raw) : (typeof req.body === 'object' ? req.body : {});
        if (json && json.email) customerEmail = String(json.email).trim();
      }
    } catch (_) {}
    if (!customerEmail) customerEmail = null;
    
    // Find customer by email or create a new one
    let customerId;

    // 0) If client sent a Stripe customer id explicitly, use it immediately
    const headerCustomerId = (req.headers['x-stripe-customer-id'] || '').toString().trim();
    if (headerCustomerId) {
      customerId = headerCustomerId;
    }

    // 1) Prefer Clerk-stored stripeCustomerId for exact match
    try {
      if (!customerId && clerkSecret && clerkUserId) {
        const clerk = new Clerk({ secretKey: clerkSecret });
        const user = await clerk.users.getUser(clerkUserId);
        const storedId = user?.publicMetadata?.stripeCustomerId;
        const isPremium = user?.publicMetadata?.isPremium;
        
        console.log('Clerk user data:', {
          userId: clerkUserId,
          stripeCustomerId: storedId,
          isPremium: isPremium
        });
        
        if (storedId) {
          customerId = storedId;
        }
      }
    } catch (e) {
      console.log('No stripeCustomerId in Clerk:', e?.message);
    }
    
    // 2) If still no customerId, try to find by email in Stripe
    if (!customerId && customerEmail) {
      try {
        const customers = await stripe.customers.list({ 
          email: customerEmail, 
          limit: 10 
        });
        
        // Look for customers with any subscriptions (active, past_due, etc.)
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10,
          });
          
          // Check for any subscription (active, past_due, trialing, etc.)
          const hasSubscription = subscriptions.data.some(sub => 
            ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
          );
          
          if (hasSubscription) {
            customerId = customer.id;
            break;
          }
        }
      } catch (e) {
        console.log('Error finding customer by email:', e?.message);
      }
    }
    
    if (!customerId && customerEmail) {
      // Try to find existing customer by email
      try {
        const listed = await stripe.customers.list({ email: customerEmail, limit: 1 });
        if (listed.data.length > 0) customerId = listed.data[0].id;
      } catch (e) {
        console.log('List by email failed:', e?.message);
      }
      if (!customerId) {
        // Last resort: create customer and portal; user can link payment method inside
        const customer = await stripe.customers.create({ email: customerEmail });
        customerId = customer.id;
      }
    } else {
      // No customer found - return error instead of showing random customer
      return res.status(400).json({ 
        error: 'No Stripe customer found for this user. Please make a purchase first to access billing management.' 
      });
    }
    
    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found for user' });
    }
    const params = {
      customer: customerId,
      return_url: returnUrl,
    };
    if (portalConfigurationId) {
      params.configuration = portalConfigurationId;
    }
    const session = await stripe.billingPortal.sessions.create(params);
    
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Customer portal error:', err);
    res.status(500).json({ error: 'Failed to create customer portal session', details: err?.message || 'unknown' });
  }
};
