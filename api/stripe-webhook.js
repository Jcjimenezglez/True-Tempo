// Stripe webhook handler to sync premium status with Clerk
const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Function to send conversion tracking to Google Ads (server-side)
async function trackConversionServerSide(conversionType, value = 1.0, transactionId = null) {
  try {
    const conversionId = conversionType === 'signup' 
      ? 'AW-17614436696/HLp9CM6Plq0bENjym89B'
      : 'AW-17614436696/uBZgCNz9pq0bENjym89B';
    
    const payload = {
      conversion_action: conversionId,
      conversion_value: value,
      currency_code: 'USD',
      transaction_id: transactionId || `server_${conversionType}_${Date.now()}`
    };

    // Note: This is a placeholder for server-side conversion tracking
    // In practice, you would need to implement server-side conversion tracking
    // using Google Ads API or Measurement Protocol
    console.log(`🎯 Server-side conversion tracking: ${conversionType}`, payload);
    
    return true;
  } catch (error) {
    console.error(`❌ Error tracking server-side conversion:`, error);
    return false;
  }
}

// Helper to read raw body for Stripe signature verification on Vercel Node functions
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

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
  const clerk = createClerkClient({ secretKey: clerkSecret });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Read raw body buffer to verify signature
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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
  const paymentType = session.metadata?.payment_type; // monthly, yearly, or lifetime
  const isLifetime = session.mode === 'payment' && paymentType === 'lifetime';
  const isSubscription = session.mode === 'subscription';

  if (!customerId) {
    console.log('Missing customer ID in checkout session');
    return;
  }

  try {
    let targetUserId = clerkUserId;

    // If no Clerk user ID in metadata (Apple Pay case), find by email
    if (!targetUserId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.email) {
        const users = await clerk.users.getUserList({ limit: 100 });
        const user = users.data.find(u => 
          u.emailAddresses?.some(email => email.emailAddress === customer.email)
        );
        
        if (user) {
          targetUserId = user.id;
          console.log(`Found Clerk user by email: ${customer.email} -> ${targetUserId}`);
        }
      }
    }

    if (!targetUserId) {
      console.log('Could not find Clerk user for customer:', customerId);
      return;
    }

    // For lifetime deals, mark as premium permanently
    if (isLifetime) {
      await clerk.users.updateUser(targetUserId, {
        publicMetadata: {
          stripeCustomerId: customerId,
          isPremium: true,
          premiumSince: new Date().toISOString(),
          paymentType: 'lifetime',
          isLifetime: true,
        },
      });

      console.log(`✅ Updated Clerk user ${targetUserId} with LIFETIME premium status`);
      
      // Track lifetime deal conversion server-side
      await trackConversionServerSide('subscription', 48.0, session.id);
      
      return; // Don't process as subscription
    }

    // For subscriptions (monthly or yearly)
    if (isSubscription) {
      // Update Clerk user with Stripe customer ID and premium status
      // The subscription status will be updated by handleSubscriptionChange
      await clerk.users.updateUser(targetUserId, {
        publicMetadata: {
          stripeCustomerId: customerId,
          isPremium: true, // Set immediately, will be confirmed by subscription.created event
          premiumSince: new Date().toISOString(),
          paymentType: paymentType || 'monthly', // monthly or yearly
        },
      });

      console.log(`✅ Updated Clerk user ${targetUserId} with ${paymentType?.toUpperCase() || 'SUBSCRIPTION'} premium status`);
      
      // Track subscription conversion server-side
      const conversionValue = paymentType === 'yearly' ? 12.0 : 1.99;
      await trackConversionServerSide('subscription', conversionValue, session.id);
    }

  } catch (error) {
    console.error('❌ Error updating Clerk user:', error);
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
      // Determine payment type from subscription
      const priceId = subscription.items.data[0]?.price?.id;
      let paymentType = user.publicMetadata?.paymentType || 'monthly';
      
      // You can also check the price ID to determine if it's yearly or monthly
      // This would require checking against your Stripe price IDs
      // For now, we keep the existing paymentType from metadata

      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          isPremium: isActive,
          premiumSince: isActive ? (user.publicMetadata?.premiumSince || new Date().toISOString()) : null,
          paymentType: paymentType, // Keep existing paymentType
        },
      });

      console.log(`✅ Updated subscription status for user ${user.id}: ${subscription.status} (${paymentType})`);
    } else {
      console.log(`⚠️ No Clerk user found for Stripe customer: ${customerId}`);
    }
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
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