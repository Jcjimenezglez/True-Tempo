const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!clerkSecret || !stripeSecret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const email = req.query.email;

  if (!email) {
    res.status(400).json({ error: 'Email parameter is required' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-12-18.acacia' });

    // Find user in Clerk by email
    const users = await clerk.users.getUserList({ limit: 100 });
    const user = users.data.find(u => 
      u.emailAddresses?.some(e => e.emailAddress === email)
    );

    if (!user) {
      res.status(404).json({ error: 'User not found in Clerk' });
      return;
    }

    // Get user details
    const userDetails = {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      publicMetadata: user.publicMetadata,
      isPremium: user.publicMetadata?.isPremium === true,
      paymentType: user.publicMetadata?.paymentType || 'none',
      isTrial: user.publicMetadata?.isTrial === true,
      premiumSince: user.publicMetadata?.premiumSince || null,
      stripeCustomerId: user.publicMetadata?.stripeCustomerId || null,
    };

    // Check Stripe subscription if customer ID exists
    let stripeSubscription = null;
    if (userDetails.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: userDetails.stripeCustomerId,
          limit: 10,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          stripeSubscription = {
            id: subscription.id,
            status: subscription.status,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            priceId: subscription.items.data[0]?.price?.id,
            amount: `$${(subscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}`,
            interval: subscription.items.data[0]?.price?.recurring?.interval,
            trialPeriodDays: subscription.items.data[0]?.price?.recurring?.trial_period_days || null,
          };
        }
      } catch (stripeError) {
        console.error('Error checking Stripe subscription:', stripeError);
      }
    }

    res.status(200).json({
      user: userDetails,
      stripeSubscription: stripeSubscription,
      statusMatch: stripeSubscription 
        ? (['active', 'trialing'].includes(stripeSubscription.status) === userDetails.isPremium)
        : null
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ error: 'Error checking user status', details: error.message });
  }
};

