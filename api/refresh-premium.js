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
    stripe = new Stripe(stripeKey, { apiVersion: '2025-12-18.acacia' });
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
    const metadataCustomerId = user.publicMetadata?.stripeCustomerId;
    const currentMeta = user.publicMetadata || {};
    
    // 🛡️ Lifetime users are permanent — never downgrade from refresh.
    if (currentMeta.isLifetime === true || currentMeta.paymentType === 'lifetime') {
      const lifetimeMeta = {
        ...currentMeta,
        isPremium: true,
        paymentType: 'lifetime',
        isLifetime: true,
        lastUpdated: new Date().toISOString(),
      };
      await clerk.users.updateUser(user.id, { publicMetadata: lifetimeMeta });
      return res.status(200).json({
        ok: true,
        isPremium: true,
        stripeCustomerId: metadataCustomerId || null,
        subscriptionId: null,
        subscriptionStatus: null,
        lifetime: true,
      });
    }
    const premiumStatuses = new Set(['active', 'trialing', 'past_due']);
    const checkedCustomers = new Set();

    // Build candidate list (metadata first, then Stripe matches for the email)
    const candidateCustomerIds = [];
    if (metadataCustomerId) candidateCustomerIds.push(metadataCustomerId);

    if (email) {
      try {
        const listed = await stripe.customers.list({ email, limit: 10 });
        for (const customer of listed.data) {
          if (customer?.id) {
            candidateCustomerIds.push(customer.id);
          }
        }
      } catch (e) {
        console.error('Stripe customers.list by email error:', e);
      }
    }

    let matchedCustomerId = null;
    let matchedSubscription = null;

    for (const candidateId of candidateCustomerIds) {
      if (!candidateId || checkedCustomers.has(candidateId)) continue;
      checkedCustomers.add(candidateId);

      try {
        const subs = await stripe.subscriptions.list({
          customer: candidateId,
          status: 'all',
          limit: 10
        });

        const activeSub = subs.data.find((sub) => premiumStatuses.has(sub.status));
        if (activeSub) {
          matchedCustomerId = candidateId;
          matchedSubscription = activeSub;
          break;
        }
      } catch (e) {
        console.error(`Stripe subscriptions.list error for ${candidateId}:`, e);
      }
    }

    const stripeCustomerId = matchedCustomerId || metadataCustomerId || null;
    const isPremium = !!matchedCustomerId;

    try {
      const newMeta = {
        ...currentMeta,
        isPremium,
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      };

      if (isPremium) {
        const subscriptionPrice = matchedSubscription?.items?.data?.[0]?.price;
        const derivedPaymentType =
          currentMeta.paymentType ||
          subscriptionPrice?.metadata?.plan_type ||
          (subscriptionPrice?.recurring?.interval ? `${subscriptionPrice.recurring.interval}` : 'premium');

        newMeta.paymentType = derivedPaymentType || 'premium';
        newMeta.isTrial = matchedSubscription?.status === 'trialing';
        if (!currentMeta.premiumSince) {
          const createdAt = matchedSubscription?.created
            ? new Date(matchedSubscription.created * 1000).toISOString()
            : new Date().toISOString();
          newMeta.premiumSince = createdAt;
        }
        newMeta.lastUpdated = new Date().toISOString();
      }

      await clerk.users.updateUser(user.id, { publicMetadata: newMeta });
    } catch (e) {
      console.error('Clerk updateUser error:', e);
      return res.status(500).json({ error: 'Failed to write metadata', details: e?.message || 'unknown' });
    }

    return res.status(200).json({
      ok: true,
      isPremium,
      stripeCustomerId,
      subscriptionId: matchedSubscription?.id || null,
      subscriptionStatus: matchedSubscription?.status || null,
    });
  } catch (e) {
    console.error('refresh-premium error:', e);
    return res.status(500).json({ error: 'Failed to refresh premium', details: e?.message || 'unknown' });
  }
};


