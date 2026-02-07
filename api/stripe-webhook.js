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
async function trackConversionServerSide(
  conversionType,
  value = 1.0,
  transactionId = null,
  gclid = null,
  gbraid = null,
  wbraid = null,
  email = null,
  customConversionLabel = null
) {
  try {
    // GA4 Measurement ID (for server-side tracking)
    const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID || 'G-T3T0PES8C0';
    const ga4ApiSecret = process.env.GA4_API_SECRET; // Required for Measurement Protocol
    
    // Google Ads Conversion ID and Labels
    // Monthly: wlmKCI_fiuwbENjym89B ($3.99)
    // Lifetime: unsECLnWiewbENjym89B ($24.0)
    const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID || 'AW-17614436696';
    let conversionLabel;
    if (customConversionLabel) {
      conversionLabel = customConversionLabel;
    } else {
      // Default to Monthly label if not specified
      conversionLabel = process.env.GOOGLE_ADS_CONVERSION_LABEL || 'wlmKCI_fiuwbENjym89B';
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
      gclid: gclid ? 'present' : 'N/A',
      gbraid: gbraid ? 'present' : 'N/A',
      wbraid: wbraid ? 'present' : 'N/A',
      hasGa4Secret: !!ga4ApiSecret
    });
    
    // Strategy 1: GA4 Measurement Protocol (if API secret is configured)
    // This sends a purchase event to GA4 which can be imported to Google Ads
    if (ga4ApiSecret) {
      const userProperties = {};
      if (gclid) {
        userProperties.gclid = { value: gclid };
      }
      if (gbraid) {
        userProperties.gbraid = { value: gbraid };
      }
      if (wbraid) {
        userProperties.wbraid = { value: wbraid };
      }

      const ga4Payload = {
        client_id: clientId,
        user_id: email ? email.toLowerCase() : undefined,
        user_properties: Object.keys(userProperties).length ? userProperties : undefined,
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
            gclid: gclid || undefined,
            gbraid: gbraid || undefined,
            wbraid: wbraid || undefined,
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
      gclid: gclid ? 'present' : 'N/A',
      gbraid: gbraid ? 'present' : 'N/A',
      wbraid: wbraid ? 'present' : 'N/A',
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
      
      // Note: trial_will_end and invoice.payment_succeeded handlers removed
      // since we no longer use trial-based plans
      
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
  const fallbackEmail = session.customer_details?.email || session.customer_email || null;
  const gclid = session.metadata?.gclid || null;
  const gbraid = session.metadata?.gbraid || null;
  const wbraid = session.metadata?.wbraid || null;

  console.log('🔔 Checkout completed event received:', {
    customerId,
    clerkUserId,
    paymentType,
    mode: session.mode,
    subscriptionId: session.subscription
  });

  if (!customerId && !isLifetime) {
    console.log('❌ Missing customer ID in checkout session');
    return;
  }
  
  if (!customerId && isLifetime) {
    console.warn('⚠️ Missing customer ID for lifetime checkout; will proceed using email lookup if possible');
  }

  try {
    let targetUserId = clerkUserId;
    
    // If clerk_user_id is not in metadata, log warning
    if (!targetUserId) {
      console.warn('⚠️ No clerk_user_id in session metadata, will try to find by email');
    }

    // If no Clerk user ID in metadata (Apple Pay case), find by email
    if (!targetUserId) {
      let emailToLookup = fallbackEmail;
      
      if (!emailToLookup && customerId) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(customerId);
        emailToLookup = customer.email || null;
      }
      
      if (emailToLookup) {
        const user = await findClerkUserByEmail(clerk, emailToLookup);

        if (user) {
          targetUserId = user.id;
          console.log(`Found Clerk user by email: ${emailToLookup} -> ${targetUserId}`);
        } else {
          console.warn(`⚠️ Unable to locate Clerk user by email ${emailToLookup} for Stripe customer ${customerId || 'none'}`);
        }
      }
    }

    if (!targetUserId) {
      console.log('Could not find Clerk user for customer:', customerId);
      return;
    }

    // For lifetime deals, mark as premium permanently
    if (isLifetime) {
      // Get user email for tracking
      let userEmail = null;
      try {
        const user = await clerk.users.getUser(targetUserId);
        userEmail = user.emailAddresses?.[0]?.emailAddress || null;
      } catch (e) {
        console.log('Could not get user email for tracking');
      }

      const lifetimeMetadata = {
        isPremium: true,
        premiumSince: new Date().toISOString(),
        paymentType: 'lifetime',
        isLifetime: true,
      };
      
      if (customerId) {
        lifetimeMetadata.stripeCustomerId = customerId;
      }
      
      await clerk.users.updateUser(targetUserId, {
        publicMetadata: {
          ...lifetimeMetadata,
        },
      });

      console.log(`✅ Updated Clerk user ${targetUserId} with LIFETIME premium status`);
      
      // Send push notification via ntfy.sh for new lifetime purchase
      try {
        let currentUser;
        try {
          currentUser = await clerk.users.getUser(targetUserId);
        } catch (e) {
          console.error('❌ Error getting current user for notification:', e);
        }
        
        const userName = currentUser?.firstName || currentUser?.username || 'Usuario';
        const userEmailDisplay = userEmail || 'N/A';
        const notificationTitle = 'Nueva Suscripcion Lifetime!';
        const notificationMessage = `Usuario: ${userName}\nEmail: ${userEmailDisplay}\nPlan: Lifetime ($24.00 de una sola vez)\nFecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}\n\n¡Pago completado! Acceso de por vida.`;
        
        const ntfyResult = await sendNtfyNotification(notificationTitle, notificationMessage);
        
        if (ntfyResult.success) {
          console.log(`✅ Push notification sent for new lifetime purchase: ${targetUserId}`);
        } else {
          console.warn(`⚠️ Failed to send push notification: ${ntfyResult.error}`);
        }
      } catch (ntfyError) {
        console.error('❌ Error sending push notification:', ntfyError);
        // Don't fail the webhook if notification fails
      }
      
      // Track lifetime deal conversion server-side with correct label and value
      // Lifetime: $24.0 with label unsECLnWiewbENjym89B
      await trackConversionServerSide(
        'lifetime',
        24.0,
        session.id,
        gclid,
        gbraid,
        wbraid,
        userEmail,
        'unsECLnWiewbENjym89B'
      );
      console.log(`✅ Google Ads LIFETIME conversion tracked: ${targetUserId} - $24.0`);
      
      return; // Don't process as subscription
    }

    // For monthly subscriptions ($3.99/month)
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
      const updatedMetadata = {
        ...(currentUser.publicMetadata || {}),
        stripeCustomerId: customerId,
        isPremium: true,
        premiumSince: currentUser.publicMetadata?.premiumSince || new Date().toISOString(),
        paymentType: 'monthly',
        lastUpdated: new Date().toISOString(),
      };

      await clerk.users.updateUser(targetUserId, {
        publicMetadata: updatedMetadata,
      });

      console.log(`✅ Updated Clerk user ${targetUserId} with MONTHLY premium status`);
      console.log('📋 Updated metadata:', JSON.stringify(updatedMetadata, null, 2));
      
      // Send push notification via ntfy.sh for new monthly subscription
      try {
        const userName = currentUser.firstName || currentUser.username || 'Usuario';
        const userEmailDisplay = userEmail || 'N/A';
        const notificationTitle = 'Nueva Suscripcion Monthly!';
        const notificationMessage = `Usuario: ${userName}\nEmail: ${userEmailDisplay}\nPlan: Monthly ($3.99/mes)\nFecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}\n\nPago completado`;
        
        const ntfyResult = await sendNtfyNotification(notificationTitle, notificationMessage);
        
        if (ntfyResult.success) {
          console.log(`✅ Push notification sent for new monthly subscription: ${targetUserId}`);
        } else {
          console.warn(`⚠️ Failed to send push notification: ${ntfyResult.error}`);
        }
      } catch (ntfyError) {
        console.error('❌ Error sending push notification:', ntfyError);
        // Don't fail the webhook if notification fails
      }
      
      // Send welcome email for new subscriptions
      if (userEmail) {
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
      
      // Track Google Ads conversion for Monthly subscription
      // Monthly: $3.99 with label wlmKCI_fiuwbENjym89B
      await trackConversionServerSide(
        'monthly',
        3.99,
        session.id,
        gclid,
        gbraid,
        wbraid,
        userEmail,
        'wlmKCI_fiuwbENjym89B'
      );
      console.log(`✅ Google Ads MONTHLY conversion tracked: ${targetUserId} - $3.99`);
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
      // 🛡️ PROTECTION: Don't update if user is already Lifetime (permanent)
      // Lifetime users should never have their metadata changed by subscription events
      if (user.publicMetadata?.isLifetime) {
        console.log(`⚠️ Skipping subscription update for Lifetime user ${user.id} - Lifetime is permanent`);
        return;
      }

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

// Note: handleTrialWillEnd function removed - no longer using trial-based plans

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

// Note: handleInvoicePaymentSucceeded function removed - no longer tracking first payment after trial