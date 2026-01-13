// Stripe webhook handler to sync premium status with Clerk
const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Function to send conversion tracking to Google Ads (server-side)
// Tracks real conversions when checkout is completed (not just intent)
// This is critical for Performance Max campaigns to optimize for actual Premium subscriptions
// 
// ⚠️ IMPORTANT: Google Ads does NOT have a direct server-side API like GA4's Measurement Protocol.
// For server-side tracking, we use GA4 Measurement Protocol and then import conversions to Google Ads.
// 
// Strategy:
// 1. Send purchase event to GA4 via Measurement Protocol
// 2. Configure Google Ads to import conversions from GA4
// 3. This ensures conversions are tracked even if client-side fails
async function trackConversionServerSide(conversionType, value = 1.0, transactionId = null, gclid = null, email = null, customConversionLabel = null) {
  try {
    // GA4 Measurement ID (for server-side tracking)
    const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID || 'G-T3T0PES8C0';
    const ga4ApiSecret = process.env.GA4_API_SECRET; // Required for Measurement Protocol
    
    // Google Ads Conversion ID and Label for logging
    const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID || 'AW-17614436696';
    let conversionLabel;
    if (customConversionLabel) {
      conversionLabel = customConversionLabel;
    } else {
      conversionLabel = process.env.GOOGLE_ADS_CONVERSION_LABEL || 'PHPkCOP1070bENjym89B';
    }
    
    // Generate a consistent client ID from email (for user matching in GA4)
    // This helps GA4 match server-side events with client-side sessions
    const clientId = email 
      ? `server.${email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)}.${Date.now()}`
      : `server.${transactionId || Date.now()}`;
    
    const eventTransactionId = transactionId || `conv_${Date.now()}`;
    
    // Log the conversion attempt with all details
    console.log(`🎯 Server-side conversion tracking: ${conversionType}`, {
      value,
      transactionId: eventTransactionId,
      conversionLabel,
      conversionId,
      email: email ? email.substring(0, 5) + '***' : 'N/A',
      hasGa4Secret: !!ga4ApiSecret
    });
    
    // Strategy 1: GA4 Measurement Protocol (if API secret is configured)
    // This sends a purchase event to GA4 which can be imported to Google Ads
    if (ga4ApiSecret) {
      const ga4Payload = {
        client_id: clientId,
        user_id: email ? email.toLowerCase() : undefined,
        events: [{
          name: 'purchase',
          params: {
            transaction_id: eventTransactionId,
            value: value,
            currency: 'USD',
            // Custom parameters for matching
            conversion_type: conversionType,
            conversion_label: conversionLabel,
            source: 'server_webhook',
            items: [{
              item_id: 'premium_subscription',
              item_name: 'Premium Subscription',
              price: value,
              quantity: 1
            }]
          }
        }]
      };
      
      const ga4Url = `https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4ApiSecret}`;
      
      try {
        const response = await fetch(ga4Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ga4Payload)
        });
        
        if (response.ok || response.status === 204) {
          console.log(`✅ GA4 Measurement Protocol: conversion sent successfully`, {
            conversionType,
            value,
            transactionId: eventTransactionId,
            measurementId: ga4MeasurementId
          });
        } else {
          const errorText = await response.text();
          console.warn(`⚠️ GA4 Measurement Protocol failed: ${response.status}`, errorText);
        }
      } catch (fetchError) {
        console.error(`❌ Error sending to GA4 Measurement Protocol:`, fetchError);
      }
    } else {
      console.warn('⚠️ GA4_API_SECRET not configured - server-side GA4 tracking disabled');
      console.log('📝 To enable: Set GA4_API_SECRET in Vercel environment variables');
      console.log('📝 Get it from: GA4 Admin > Data Streams > Measurement Protocol API secrets');
    }
    
    // Strategy 2: Use ntfy or similar for backup notification (optional)
    // This ensures you at least have a log of conversions
    const ntfyUrl = process.env.NTFY_URL;
    if (ntfyUrl && conversionType === 'subscription') {
      try {
        await fetch(ntfyUrl, {
          method: 'POST',
          headers: { 'Title': `💰 New Conversion: ${conversionType}` },
          body: `Value: $${value}\nTransaction: ${eventTransactionId}\nEmail: ${email || 'N/A'}\nLabel: ${conversionLabel}`
        });
        console.log(`📢 Conversion notification sent via ntfy`);
      } catch (ntfyError) {
        // Silent fail for backup notification
      }
    }
    
    // Log detailed info for manual verification if needed
    console.log(`📊 Conversion details for Google Ads verification:`, {
      sendTo: `${conversionId}/${conversionLabel}`,
      value: value,
      currency: 'USD',
      transactionId: eventTransactionId,
      email: email ? email.substring(0, 5) + '***' : 'N/A',
      timestamp: new Date().toISOString()
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

async function findClerkUserByStripeCustomerId(clerk, stripeCustomerId) {
  if (!stripeCustomerId) {
    return null;
  }

  const pageSize = 100;
  let offset = 0;
  let scanned = 0;

  while (true) {
    const { data, totalCount } = await clerk.users.getUserList({
      limit: pageSize,
      offset,
    });

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    scanned += data.length;

    const match = data.find((user) => user.publicMetadata?.stripeCustomerId === stripeCustomerId);
    if (match) {
      console.log(`🔎 Found Clerk user ${match.id} for Stripe customer ${stripeCustomerId} after scanning ${scanned} users`);
      return match;
    }

    offset += pageSize;

    if (typeof totalCount === 'number' && offset >= totalCount) {
      break;
    }

    if (data.length < pageSize) {
      break;
    }
  }

  console.warn(`⚠️ Clerk user not found for Stripe customer ${stripeCustomerId} after scanning ${scanned} users`);
  return null;
}

async function findClerkUserByEmail(clerk, email) {
  if (!email) {
    return null;
  }

  const pageSize = 100;
  let offset = 0;
  let scanned = 0;

  while (true) {
    const { data, totalCount } = await clerk.users.getUserList({
      limit: pageSize,
      offset,
    });

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    scanned += data.length;

    const match = data.find((user) =>
      user.emailAddresses?.some((address) => address.emailAddress === email)
    );

    if (match) {
      console.log(`🔎 Found Clerk user ${match.id} by email ${email} after scanning ${scanned} users`);
      return match;
    }

    offset += pageSize;

    if (typeof totalCount === 'number' && offset >= totalCount) {
      break;
    }

    if (data.length < pageSize) {
      break;
    }
  }

  console.warn(`⚠️ Clerk user not found by email ${email} after scanning ${scanned} users`);
  return null;
}

// Function to send push notification via ntfy.sh
async function sendNtfyNotification(title, message, topic) {
  try {
    const ntfyTopic = topic || process.env.NTFY_TOPIC;
    
    if (!ntfyTopic) {
      console.warn('⚠️ NTFY_TOPIC not configured, skipping notification');
      return { success: false, error: 'NTFY_TOPIC not configured' };
    }

    // Optional: Add password protection if configured
    const ntfyPassword = process.env.NTFY_PASSWORD;
    // Remove emojis from title for headers (emojis cause encoding issues)
    const cleanTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || 'Nueva Suscripcion';
    
    const headers = {
      'Content-Type': 'text/plain',
      'Title': cleanTitle,
      'Priority': 'high',
      'Tags': 'trial,subscription'
    };

    // Add authentication if password is set
    if (ntfyPassword) {
      const auth = Buffer.from(`:${ntfyPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: headers,
      body: message
    });

    if (response.ok) {
      console.log(`✅ Ntfy notification sent successfully to topic: ${ntfyTopic}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`❌ Ntfy notification failed: ${response.status}`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ Error sending ntfy notification:', error);
    return { success: false, error: error.message };
  }
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
      
      case 'invoice.payment_succeeded':
        console.log('💰 Processing invoice.payment_succeeded...');
        await handleInvoicePaymentSucceeded(event.data.object, clerk);
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
        const user = await findClerkUserByEmail(clerk, customer.email);

        if (user) {
          targetUserId = user.id;
          console.log(`Found Clerk user by email: ${customer.email} -> ${targetUserId}`);
        } else {
          console.warn(`⚠️ Unable to locate Clerk user by email ${customer.email} for Stripe customer ${customerId}`);
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
      
      // 🆕 Send push notification via ntfy.sh when user subscribes to trial
      if (isSubscription && paymentType === 'premium') {
        try {
          const userName = currentUser.firstName || currentUser.username || 'Usuario';
          const userEmailDisplay = userEmail || 'N/A';
          const trialDays = 30; // 1 month trial
          const notificationTitle = '🎉 Nuevo Trial Suscrito!';
          const notificationMessage = `👤 Usuario: ${userName}\n📧 Email: ${userEmailDisplay}\n📦 Plan: Premium (${trialDays} días trial)\n📅 Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}\n\n💰 Trial gratuito activado`;
          
          const ntfyResult = await sendNtfyNotification(notificationTitle, notificationMessage);
          
          if (ntfyResult.success) {
            console.log(`✅ Push notification sent for new trial subscription: ${targetUserId}`);
          } else {
            console.warn(`⚠️ Failed to send push notification: ${ntfyResult.error}`);
          }
        } catch (ntfyError) {
          console.error('❌ Error sending push notification:', ntfyError);
          // Don't fail the webhook if notification fails
        }
      }
      
      // Send welcome email for new subscriptions
      if (isSubscription && userEmail) {
        try {
          const { sendEmail } = require('../email/send-email');
          const templates = require('../email/templates');
          const firstName = currentUser.firstName || currentUser.username || 'there';
          
          const welcomeTemplate = templates.getSubscriptionWelcomeEmail({ firstName });
          const emailResult = await sendEmail({
            to: userEmail,
            subject: welcomeTemplate.subject,
            html: welcomeTemplate.html,
            text: welcomeTemplate.text,
            tags: ['subscription_welcome'],
          });
          
          if (emailResult.success) {
            console.log('✅ Subscription welcome email sent to:', userEmail);
          } else {
            console.warn('⚠️ Failed to send subscription welcome email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error sending subscription welcome email:', emailError);
          // Don't fail the webhook if email fails
        }
      }
      
      // Track Google Ads conversion for Premium plan (real conversion, not just intent)
      if (paymentType === 'premium') {
        // Track Premium subscription conversion to Google Ads
        // Value is 3.99 (monthly subscription value) for Google Ads value-based bidding
        // Even though user is on trial, we send the actual subscription value for optimization
        await trackConversionServerSide('subscription', 3.99, session.id, null, userEmail);
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
    const user = await findClerkUserByStripeCustomerId(clerk, customerId);

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
    }
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
  }
}

async function handleTrialWillEnd(subscription, clerk) {
  const customerId = subscription.customer;
  
  try {
    // Find Clerk user by Stripe customer ID
    const user = await findClerkUserByStripeCustomerId(clerk, customerId);

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
    const user = await findClerkUserByStripeCustomerId(clerk, customerId);

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

async function handleInvoicePaymentSucceeded(invoice, clerk) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convert from cents to dollars
  const billingReason = invoice.billing_reason;
  
  console.log('💰 Invoice payment succeeded:', {
    customerId,
    subscriptionId,
    amountPaid,
    billingReason,
    invoiceId: invoice.id,
    periodStart: new Date(invoice.period_start * 1000).toISOString(),
    periodEnd: new Date(invoice.period_end * 1000).toISOString(),
  });
  
  try {
    // Find Clerk user by Stripe customer ID
    const user = await findClerkUserByStripeCustomerId(clerk, customerId);
    
    if (!user) {
      console.log(`⚠️ No Clerk user found for Stripe customer: ${customerId}`);
      return;
    }
    
    const userEmail = user.emailAddresses?.[0]?.emailAddress || null;
    
    // Check if this is the first payment after trial
    // billing_reason = 'subscription_cycle' indicates recurring payment (including first payment after trial)
    // We check if firstPaymentCompleted is not set to track only the FIRST real payment
    const isFirstPaymentAfterTrial = 
      billingReason === 'subscription_cycle' && 
      !user.publicMetadata?.firstPaymentCompleted &&
      amountPaid > 0;
    
    if (isFirstPaymentAfterTrial) {
      console.log(`🎯 First payment after trial detected for user ${user.id}`);
      
      // Track Google Ads conversion for FIRST REAL PAYMENT after trial
      // Value: $20.0 (LTV-based value representing ~5 months retention at $3.99)
      // This is higher than trial value ($3.99) to signal to Google Ads
      // that users who complete their first payment are more valuable
      await trackConversionServerSide(
        'first_payment',
        20.0,  // LTV-based value (~5 months retention estimate at $3.99/month)
        invoice.id,
        null,
        userEmail,
        'wek8COjyr90bENjym89B'  // First Payment conversion label from Google Ads
      );
      
      console.log(`✅ Google Ads conversion tracked for FIRST PAYMENT: ${user.id} - $16.0 (actual payment: $${amountPaid})`);
      
      // Update user metadata to mark first payment completed
      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          firstPaymentCompleted: true,
          firstPaymentDate: new Date().toISOString(),
          firstPaymentAmount: amountPaid,
          firstPaymentInvoiceId: invoice.id,
        },
      });
      
      console.log(`✅ User ${user.id} marked as first payment completed`);
    } else {
      console.log(`ℹ️ Not tracking - billing_reason: ${billingReason}, firstPaymentCompleted: ${user.publicMetadata?.firstPaymentCompleted || false}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error);
  }
}