// API: Reconcile premium status from Stripe → Clerk
// POST headers expected (best-effort):
//   x-clerk-userid, x-clerk-user-email

const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const clerkKey = process.env.CLERK_SECRET_KEY;
  if (!stripeKey || !clerkKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  let stripe, clerk;
  try {
    stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });
  } catch (e) {
    console.error('Stripe init error:', e);
    return res.status(500).json({ error: 'Init failed', details: 'stripe', message: e?.message || 'unknown' });
  }
  try {
    clerk = createClerkClient({ secretKey: clerkKey });
  } catch (e) {
    console.error('Clerk init error:', e);
    return res.status(500).json({ error: 'Init failed', details: 'clerk', message: e?.message || 'unknown' });
  }

  const clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
  let email = (req.headers['x-clerk-user-email'] || '').toString().trim();

  try {
    let user;
    if (clerkUserId) {
      try {
        user = await clerk.users.getUser(clerkUserId);
      } catch (e) {
        console.error('Clerk getUser error:', e);
      }
      email = email || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
    } else if (email) {
      try {
        const users = await clerk.users.getUserList({ emailAddress: [email] });
        user = users?.[0];
      } catch (e) {
        console.error('Clerk getUserList error:', e);
      }
    }
    if (!user) return res.status(400).json({ error: 'User not found in Clerk' });

    // Prefer stored customer id in Clerk metadata
    let stripeCustomerId = user.publicMetadata?.stripeCustomerId;

    if (!stripeCustomerId && email) {
      try {
        const listed = await stripe.customers.list({ email, limit: 1 });
        if (listed.data.length) stripeCustomerId = listed.data[0].id;
      } catch (e) {
        console.error('Stripe customers.list by email error:', e);
      }
    }

    let isPremium = false;
    if (stripeCustomerId) {
      try {
        const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'all', limit: 10 });
        const active = subs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
        isPremium = !!active;
      } catch (e) {
        console.error('Stripe subscriptions.list by customer error:', e);
      }
    } else if (email) {
      // Fallback: search any customer by email with active sub
      try {
        const listed = await stripe.customers.list({ email, limit: 3 });
        for (const c of listed.data) {
          try {
            const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 5 });
            const active = subs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
            if (active) {
              stripeCustomerId = c.id;
              isPremium = true;
              break;
            }
          } catch (e) {
            console.error('Stripe subscriptions.list loop error:', e);
          }
        }
      } catch (e) {
        console.error('Stripe customers.list fallback error:', e);
      }
    }

    try {
      const currentMeta = user.publicMetadata || {};
      const newMeta = { ...currentMeta, isPremium, ...(stripeCustomerId ? { stripeCustomerId } : {}) };
      await clerk.users.updateUser(user.id, { publicMetadata: newMeta });
    } catch (e) {
      console.error('Clerk updateUser error:', e);
      return res.status(500).json({ error: 'Failed to write metadata', details: e?.message || 'unknown' });
    }

    return res.status(200).json({ ok: true, isPremium, stripeCustomerId: stripeCustomerId || null });
  } catch (e) {
    console.error('refresh-premium error:', e);
    return res.status(500).json({ error: 'Failed to refresh premium', details: e?.message || 'unknown' });
  }
};


