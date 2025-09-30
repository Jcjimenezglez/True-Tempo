// Stripe webhook handler to sync premium status with Clerk
const Stripe = require('stripe');
const { Clerk } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const clerkSecret = process.env.CLERK_SECRET_KEY;

  if (!secretKey || !webhookSecret || !clerkSecret) {
    console.error('Missing required environment variables');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
  const clerk = new Clerk({ secretKey: clerkSecret });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, clerk);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object, clerk);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, clerk);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handleCheckoutCompleted(session, clerk) {
  const customerId = session.customer;
  const clerkUserId = session.metadata?.clerk_user_id;

  if (!customerId || !clerkUserId) {
    console.log('Missing customer ID or Clerk user ID in checkout session');
    return;
  }

  try {
    // Update Clerk user with Stripe customer ID and premium status
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        stripeCustomerId: customerId,
        isPremium: true,
        premiumSince: new Date().toISOString(),
      },
    });

    console.log(`Updated Clerk user ${clerkUserId} with premium status`);
  } catch (error) {
    console.error('Error updating Clerk user:', error);
  }
}

async function handleSubscriptionChange(subscription, clerk) {
  const customerId = subscription.customer;
  const isActive = ['active', 'trialing'].includes(subscription.status);

  try {
    // Find Clerk user by Stripe customer ID
    const users = await clerk.users.getUserList({
      limit: 100,
    });

    const user = users.data.find(u => 
      u.publicMetadata?.stripeCustomerId === customerId
    );

    if (user) {
      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          isPremium: isActive,
          premiumSince: isActive ? (user.publicMetadata?.premiumSince || new Date().toISOString()) : null,
        },
      });

      console.log(`Updated subscription status for user ${user.id}: ${subscription.status}`);
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionDeleted(subscription, clerk) {
  const customerId = subscription.customer;

  try {
    // Find Clerk user by Stripe customer ID
    const users = await clerk.users.getUserList({
      limit: 100,
    });

    const user = users.data.find(u => 
      u.publicMetadata?.stripeCustomerId === customerId
    );

    if (user) {
      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          isPremium: false,
          premiumSince: null,
        },
      });

      console.log(`Removed premium status for user ${user.id}`);
    }
  } catch (error) {
    console.error('Error removing premium status:', error);
  }
}