const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!clerkSecret || !stripeSecret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const { clerkUserId, stripeCustomerId } = req.body;

  if (!clerkUserId || !stripeCustomerId) {
    res.status(400).json({ error: 'clerkUserId and stripeCustomerId are required' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-12-18.acacia' });

    console.log('🔧 Fixing user premium sync...');
    console.log('Clerk User ID:', clerkUserId);
    console.log('Stripe Customer ID:', stripeCustomerId);

    // Get user from Clerk
    const user = await clerk.users.getUser(clerkUserId);
    console.log('Current isPremium:', user.publicMetadata?.isPremium);
    console.log('Current stripeCustomerId:', user.publicMetadata?.stripeCustomerId);

    // Get subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      res.status(404).json({ error: 'No subscriptions found in Stripe for this customer' });
      return;
    }

    const subscription = subscriptions.data[0];
    console.log('Subscription Status:', subscription.status);
    console.log('Trial End:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A');

    // Check if subscription is active or trialing
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const isTrialing = subscription.status === 'trialing';
    
    // Determine payment type from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    
    console.log('Price ID from subscription:', priceId);
    console.log('Premium Price ID from env:', premiumPriceId);
    console.log('Match:', priceId === premiumPriceId);
    
    // Check if this is the Premium price (price_1SQr4sIMJUHQfsp7sx96CCxe)
    // This is the known Premium price ID
    let paymentType = 'monthly';
    
    // The Premium price ID is price_1SQr4sIMJUHQfsp7sx96CCxe
    // Check if priceId matches this or the env variable
    if (priceId && (priceId === 'price_1SQr4sIMJUHQfsp7sx96CCxe' || priceId === premiumPriceId)) {
      paymentType = 'premium';
      console.log('✅ Detected Premium price');
    } else {
      // Check if it's one of the old prices
      const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
      const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
      if (priceId === monthlyPriceId) {
        paymentType = 'monthly';
      } else if (priceId === yearlyPriceId) {
        paymentType = 'yearly';
      }
      console.log('⚠️ Price ID does not match Premium, using:', paymentType);
    }
    
    console.log('Final Payment Type:', paymentType);

    // Update Clerk user with correct information
    const updatedMetadata = {
      ...(user.publicMetadata || {}),
      stripeCustomerId: stripeCustomerId, // Update to correct Stripe customer ID
      isPremium: isActive, // Set to true if subscription is active or trialing
      premiumSince: isActive ? (user.publicMetadata?.premiumSince || new Date().toISOString()) : null,
      paymentType: paymentType,
      isTrial: isTrialing,
      lastUpdated: new Date().toISOString(),
      syncedManually: true,
      syncedAt: new Date().toISOString(),
    };

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: updatedMetadata,
    });

    console.log('✅ Updated Clerk user with correct information');
    console.log('isPremium:', updatedMetadata.isPremium);
    console.log('paymentType:', updatedMetadata.paymentType);
    console.log('isTrial:', updatedMetadata.isTrial);

    // Check why trial didn't work
    let trialIssue = null;
    if (subscription.status === 'active' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end * 1000);
      const now = new Date();
      if (trialEnd > now) {
        trialIssue = 'Subscription is active but trial should still be running';
      }
    }

    // Get recent payments
    const payments = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    res.status(200).json({
      success: true,
      message: 'User premium status updated successfully',
      user: {
        id: clerkUserId,
        email: user.emailAddresses?.[0]?.emailAddress,
        isPremium: updatedMetadata.isPremium,
        paymentType: updatedMetadata.paymentType,
        isTrial: updatedMetadata.isTrial,
        stripeCustomerId: updatedMetadata.stripeCustomerId,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        priceId: priceId,
        amount: `$${(subscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}`,
        trialPeriodDays: subscription.items.data[0]?.price?.recurring?.trial_period_days || null,
      },
      payments: payments.data.map(p => ({
        amount: `$${(p.amount / 100).toFixed(2)}`,
        status: p.status,
        created: new Date(p.created * 1000).toISOString(),
      })),
      trialIssue: trialIssue,
    });

  } catch (error) {
    console.error('❌ Error fixing user premium sync:', error);
    res.status(500).json({ 
      error: 'Failed to fix user premium sync', 
      details: error.message 
    });
  }
};
