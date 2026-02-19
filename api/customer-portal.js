// Vercel serverless function to create a Stripe Customer Portal session
// Expects environment variables configured in Vercel project settings:
// STRIPE_SECRET_KEY, CLERK_SECRET_KEY, STRIPE_PORTAL_CONFIGURATION_ID

const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const returnUrl = 'https://www.superfocus.live';
  const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;

  if (!secretKey) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey);
    const clerk = clerkSecret ? createClerkClient({ secretKey: clerkSecret }) : null;

    const clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
    let customerEmail = (req.headers['x-clerk-user-email'] || '').toString().trim();

    // If Clerk user id is provided, fetch email from Clerk (more reliable)
    if (!customerEmail && clerk && clerkUserId) {
      try {
        const user = await clerk.users.getUser(clerkUserId);
        customerEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
      } catch (e) {
        console.log('Could not fetch user from Clerk:', e?.message);
      }
    }

    try {
      if (!customerEmail && req.body) {
        const raw = typeof req.body === 'string' ? req.body : undefined;
        const json = raw ? JSON.parse(raw) : (typeof req.body === 'object' ? req.body : {});
        if (json && json.email) customerEmail = String(json.email).trim();
      }
    } catch (_) {}
    if (!customerEmail) customerEmail = null;

    let customerId;

    // 0) If client sent a Stripe customer id explicitly, use it immediately
    const headerCustomerId = (req.headers['x-stripe-customer-id'] || '').toString().trim();
    if (headerCustomerId) {
      customerId = headerCustomerId;
    }

    // 1) Prefer Clerk-stored stripeCustomerId for exact match (reuse single clerk instance)
    if (!customerId && clerk && clerkUserId) {
      try {
        const user = await clerk.users.getUser(clerkUserId);
        const storedId = user?.publicMetadata?.stripeCustomerId;

        if (storedId) {
          customerId = storedId;
        }
      } catch (e) {
        console.log('No stripeCustomerId in Clerk:', e?.message);
      }
    }

    // 2) If still no customerId, try to find by email in Stripe
    if (!customerId && customerEmail) {
      try {
        const customers = await stripe.customers.list({
          email: customerEmail,
          limit: 10,
        });

        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10,
          });

          const hasSubscription = subscriptions.data.some((sub) =>
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

    // 3) Last resort: find any Stripe customer with that email (no subscription required for portal)
    if (!customerId && customerEmail) {
      try {
        const listed = await stripe.customers.list({ email: customerEmail, limit: 1 });
        if (listed.data.length > 0) customerId = listed.data[0].id;
      } catch (e) {
        console.log('List by email failed:', e?.message);
      }
    }

    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found. Please contact support if you believe this is an error.' });
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
