const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const clerkSecret = process.env.CLERK_SECRET_KEY;

  if (!stripeSecret || !clerkSecret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  let sessionId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    sessionId = (body.sessionId || body.session_id || '').trim();
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
  const clerk = createClerkClient({ secretKey: clerkSecret });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      res.status(404).json({ error: 'Checkout session not found' });
      return;
    }

    const customerId = session.customer?.id || session.customer;
    const sessionMetadata = session.metadata || {};
    const headersUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
    const headersEmail = (req.headers['x-clerk-user-email'] || '').toString().trim();
    const sessionEmail = session.customer_details?.email || session.customer?.email;

    let targetUser = null;
    let targetUserId = sessionMetadata.clerk_user_id || headersUserId;

    if (targetUserId) {
      try {
        targetUser = await clerk.users.getUser(targetUserId);
      } catch (error) {
        console.warn(`Unable to fetch Clerk user ${targetUserId}:`, error.message);
        targetUserId = null;
      }
    }

    const searchEmails = [headersEmail, sessionEmail].filter(Boolean);

    if (!targetUser && searchEmails.length > 0) {
      for (const email of searchEmails) {
        try {
          const users = await clerk.users.getUserList({ emailAddress: [email] });
          if (users?.length) {
            targetUser = users[0];
            targetUserId = targetUser.id;
            break;
          }
        } catch (error) {
          console.warn(`Unable to find Clerk user by email ${email}:`, error.message);
        }
      }
    }

    if (!targetUser) {
      res.status(404).json({ error: 'Clerk user not found for this checkout session' });
      return;
    }

    let subscription = session.subscription;
    if (typeof subscription === 'string') {
      subscription = await stripe.subscriptions.retrieve(subscription, {
        expand: ['items.data.price'],
      });
    }

    const isSubscription = subscription && typeof subscription === 'object';
    const paymentTypeFromSession = sessionMetadata.payment_type || sessionMetadata.planType;
    const price = subscription?.items?.data?.[0]?.price;
    
    // Improved payment type derivation logic
    // Priority 1: metadata from session (most reliable)
    // Priority 2: session mode (payment = lifetime, subscription = monthly)
    // Priority 3: price metadata
    // Priority 4: recurring interval
    const derivedPaymentType =
      paymentTypeFromSession ||
      (session.mode === 'payment' ? 'lifetime' : null) ||
      price?.metadata?.plan_type ||
      (price?.recurring?.interval === 'month' ? 'monthly' : 'premium');

    const updatedMetadata = {
      ...(targetUser.publicMetadata || {}),
      stripeCustomerId: customerId || targetUser.publicMetadata?.stripeCustomerId || null,
      isPremium: true,
      premiumSince: targetUser.publicMetadata?.premiumSince || new Date().toISOString(),
      paymentType: derivedPaymentType || 'premium',
      // Set isLifetime flag if payment type is lifetime
      isLifetime: derivedPaymentType === 'lifetime' ? true : undefined,
      lastUpdated: new Date().toISOString(),
      confirmedByCheckout: true,
      confirmedSessionId: session.id,
    };

    await clerk.users.updateUser(targetUser.id, {
      publicMetadata: updatedMetadata,
    });

    res.status(200).json({
      ok: true,
      userId: targetUser.id,
      stripeCustomerId: updatedMetadata.stripeCustomerId,
      paymentType: updatedMetadata.paymentType,
      subscriptionId: subscription?.id || null,
    });
  } catch (error) {
    console.error('confirm-premium error:', error);
    res.status(500).json({ error: 'Failed to confirm premium', details: error.message });
  }
};

