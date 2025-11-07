// Stripe webhook handler to sync premium status with Clerk
const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Function to send conversion tracking to Google Ads (server-side)
// Tracks real conversions when checkout is completed (not just intent)
// This is critical for Performance Max campaigns to optimize for actual Premium subscriptions
// Uses direct Google Ads Conversion Tracking API (not GA4)
async function trackConversionServerSide(conversionType, value = 1.0, transactionId = null, gclid = null, email = null) {
  try {
    // Google Ads Conversion ID and Label for Subscribe conversion
    // These will be configured via environment variables
    const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID || 'AW-17614436696';
    const conversionLabel = process.env.GOOGLE_ADS_CONVERSION_LABEL || '9vW7COnp47sbENjym89B';
    
    // Build client ID from email or use transaction ID
    // Google Ads uses client_id to match conversions with clicks
    const clientId = email 
      ? email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40) 
      : `client_${transactionId || Date.now()}`;
    
    // Use Google Ads Conversion Tracking API directly (server-side)
    // This sends the conversion directly to Google Ads without GA4
    // Format: https://www.google-analytics.com/m/collect with conversion event
    
    // Build conversion payload for Google Ads
    // Format: send_to = "AW-XXXXX/YYYYY" (conversion_id/conversion_label)
    const payload = {
      client_id: clientId,
      events: [{
        name: 'conversion',
        params: {
          send_to: `${conversionId}/${conversionLabel}`,
          value: value,
          currency: 'USD',
          transaction_id: transactionId || `conv_${Date.now()}`,
        }
      }]
    };

    // For server-side tracking, we can use the Measurement Protocol
    // If API secret is available, use it for better tracking
    // Otherwise, we'll log the conversion attempt
    const apiSecret = process.env.GOOGLE_ADS_API_SECRET;
    let conversionUrl;
    
    if (apiSecret) {
      // Use Measurement Protocol with API secret (more reliable)
      conversionUrl = `https://www.google-analytics.com/m/collect?api_secret=${apiSecret}&measurement_id=${conversionId}`;
    } else {
      // Use basic endpoint (may have limitations but should work)
      conversionUrl = `https://www.google-analytics.com/m/collect?measurement_id=${conversionId}`;
    }

    // Send conversion to Google Ads
    try {
      const response = await fetch(conversionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Google Ads conversion tracked (direct): ${conversionType}`, {
          value,
          transactionId,
          conversionLabel,
          conversionId,
          clientId,
          email: email ? email.substring(0, 5) + '***' : 'N/A',
          hasApiSecret: !!apiSecret
        });
        return true;
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Google Ads conversion tracking failed: ${response.status}`, errorText);
      }
    } catch (fetchError) {
      console.error(`❌ Error sending Google Ads conversion:`, fetchError);
    }
    
    // Always log conversion attempt for debugging
    console.log(`🎯 Google Ads conversion attempt: ${conversionType}`, {
      value,
      transactionId,
      conversionLabel,
      conversionId,
      clientId,
      email: email ? email.substring(0, 5) + '***' : 'N/A',
      hasApiSecret: !!process.env.GOOGLE_ADS_API_SECRET
    });
    
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
    console.log(`📥 Webhook event received: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🛒 Processing checkout.session.completed...');
        await handleCheckoutCompleted(event.data.object, clerk);
        break;
      
      case 'customer.subscription.created':
        console.log('📝 Processing customer.subscription.created...');
        await handleSubscriptionChange(event.data.object, clerk);
        break;
      
      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated...');
        await handleSubscriptionChange(event.data.object, clerk);
        break;
      
      case 'customer.subscription.deleted':
        console.log('🗑️ Processing customer.subscription.deleted...');
        await handleSubscriptionDeleted(event.data.object, clerk);
        break;
      
      case 'customer.subscription.trial_will_end':
        console.log('⏰ Processing customer.subscription.trial_will_end...');
        await handleTrialWillEnd(event.data.object, clerk);
        break;
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
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
  const paymentType = session.metadata?.payment_type; // premium, monthly, yearly, or lifetime
  const isLifetime = session.mode === 'payment' && paymentType === 'lifetime';
  const isSubscription = session.mode === 'subscription';

  console.log('🔔 Checkout completed event received:', {
    customerId,
    clerkUserId,
    paymentType,
    mode: session.mode,
    subscriptionId: session.subscription
  });

  if (!customerId) {
    console.log('❌ Missing customer ID in checkout session');
    return;
  }

  try {
    let targetUserId = clerkUserId;
    
    // If clerk_user_id is not in metadata, log warning
    if (!targetUserId) {
      console.warn('⚠️ No clerk_user_id in session metadata, will try to find by email');
    }

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

    // For subscriptions (premium, monthly, or yearly)
    if (isSubscription) {
      // Get user email for tracking
      let userEmail = null;
      try {
        const user = await clerk.users.getUser(targetUserId);
        userEmail = user.emailAddresses?.[0]?.emailAddress || null;
      } catch (e) {
        console.log('Could not get user email for tracking');
      }

      // Get current user metadata to preserve existing data
      let currentUser;
      try {
        currentUser = await clerk.users.getUser(targetUserId);
      } catch (e) {
        console.error('❌ Error getting current user:', e);
        throw e;
      }

      // Update Clerk user with Stripe customer ID and premium status
      // The subscription status will be updated by handleSubscriptionChange
      const updatedMetadata = {
        ...(currentUser.publicMetadata || {}),
        stripeCustomerId: customerId,
        isPremium: true, // Set immediately for trial, will be confirmed by subscription.created event
        premiumSince: currentUser.publicMetadata?.premiumSince || new Date().toISOString(),
        paymentType: paymentType || 'premium', // premium, monthly, or yearly
        isTrial: paymentType === 'premium', // Mark as trial if Premium plan
        lastUpdated: new Date().toISOString(),
      };

      await clerk.users.updateUser(targetUserId, {
        publicMetadata: updatedMetadata,
      });

      console.log(`✅ Updated Clerk user ${targetUserId} with ${paymentType?.toUpperCase() || 'SUBSCRIPTION'} premium status (trial: ${paymentType === 'premium'})`);
      console.log('📋 Updated metadata:', JSON.stringify(updatedMetadata, null, 2));
      
      // Track Google Ads conversion for Premium plan (real conversion, not just intent)
      if (paymentType === 'premium') {
        // Track Premium subscription conversion to Google Ads
        // Value is 0 for trial, but we track it as a conversion
        await trackConversionServerSide('subscription', 0, session.id, null, userEmail);
        console.log(`✅ Google Ads conversion tracked for Premium subscription: ${targetUserId}`);
      } else {
        // Track other subscription types
        let conversionValue = 1.99; // Default to monthly (old plan)
        if (paymentType === 'yearly') {
          conversionValue = 12.0;
        } else if (paymentType === 'monthly') {
          conversionValue = 1.99; // Old monthly plan
        }
        await trackConversionServerSide('subscription', conversionValue, session.id, null, userEmail);
      }
    }

  } catch (error) {
    console.error('❌ Error updating Clerk user:', error);
  }
}

async function handleSubscriptionChange(subscription, clerk) {
  const customerId = subscription.customer;
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const isTrialing = subscription.status === 'trialing';
  const isActiveAfterTrial = subscription.status === 'active' && subscription.trial_end && subscription.trial_end < Math.floor(Date.now() / 1000);

  console.log('📝 Subscription change event:', {
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    isTrialing,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  });

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
      let paymentType = user.publicMetadata?.paymentType || 'premium';
      
      // Check if this is a Premium plan by checking the price ID
      const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
      if (priceId === premiumPriceId) {
        paymentType = 'premium';
      }
      
      // Update isTrial flag based on subscription status
      const isTrial = isTrialing;
      
      // If trial ended and subscription is now active, remove isTrial flag
      const shouldRemoveTrialFlag = isActiveAfterTrial && user.publicMetadata?.isTrial;

      // Get current metadata to preserve existing data
      const updatedMetadata = {
        ...(user.publicMetadata || {}),
        stripeCustomerId: customerId,
        isPremium: isActive, // Set to true for both 'active' and 'trialing' status
        premiumSince: isActive ? (user.publicMetadata?.premiumSince || new Date().toISOString()) : null,
        paymentType: paymentType,
        isTrial: isTrial && !shouldRemoveTrialFlag,
        lastUpdated: new Date().toISOString(),
      };

      await clerk.users.updateUser(user.id, {
        publicMetadata: updatedMetadata,
      });

      console.log(`✅ Updated subscription status for user ${user.id}: ${subscription.status} (${paymentType}, trial: ${isTrial})`);
      console.log('📋 Updated metadata:', JSON.stringify(updatedMetadata, null, 2));
    } else {
      console.log(`⚠️ No Clerk user found for Stripe customer: ${customerId}`);
      console.log('   Available users with Stripe customer IDs:', users.data.map(u => ({
        id: u.id,
        email: u.emailAddresses?.[0]?.emailAddress,
        stripeCustomerId: u.publicMetadata?.stripeCustomerId
      })));
    }
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
  }
}

async function handleTrialWillEnd(subscription, clerk) {
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
      // Calculate days until trial ends
      const trialEnd = subscription.trial_end * 1000; // Convert to milliseconds
      const now = Date.now();
      const daysUntilEnd = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      // Update user metadata to indicate trial ending soon
      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          trialEndingSoon: true,
          trialEndsAt: new Date(trialEnd).toISOString(),
        },
      });

      console.log(`✅ Trial ending soon for user ${user.id}: ${daysUntilEnd} days remaining`);
      
      // Note: You can send an email notification here using your email service
      // For now, we just log it. The frontend can check trialEndingSoon to show a notification
    } else {
      console.log(`⚠️ No Clerk user found for Stripe customer: ${customerId}`);
    }
  } catch (error) {
    console.error('❌ Error handling trial will end:', error);
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