// Cron job to sync premium status between Stripe and Clerk
// Runs daily to detect and fix any inconsistencies
// Protects Lifetime users from being downgraded accidentally

const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Send notification via ntfy.sh
async function sendNtfyNotification(title, message) {
  try {
    const ntfyTopic = process.env.NTFY_TOPIC;
    if (!ntfyTopic) return { success: false, error: 'NTFY_TOPIC not configured' };

    const ntfyPassword = process.env.NTFY_PASSWORD;
    const cleanTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || 'Premium Sync';
    
    const headers = {
      'Content-Type': 'text/plain',
      'Title': cleanTitle,
      'Priority': 'default',
      'Tags': 'sync,premium'
    };

    if (ntfyPassword) {
      const auth = Buffer.from(`:${ntfyPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers,
      body: message
    });

    return { success: response.ok };
  } catch (error) {
    console.error('Ntfy notification error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = async (req, res) => {
  // Only allow GET (Vercel cron) or POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const clerkKey = process.env.CLERK_SECRET_KEY;

  if (!stripeKey || !clerkKey) {
    console.error('Missing STRIPE_SECRET_KEY or CLERK_SECRET_KEY');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });
  const clerk = createClerkClient({ secretKey: clerkKey });

  const results = {
    checked: 0,
    valid: 0,
    fixed: 0,
    errors: [],
    lifetimeUsers: 0,
    monthlyUsers: 0,
    invalidUsers: [],
  };

  try {
    console.log('🔄 Starting premium status sync...');

    // Get all Clerk users with pagination
    const pageSize = 100;
    let offset = 0;
    let allUsers = [];

    while (true) {
      const { data, totalCount } = await clerk.users.getUserList({
        limit: pageSize,
        offset,
      });

      if (!Array.isArray(data) || data.length === 0) break;

      allUsers = allUsers.concat(data);
      offset += pageSize;

      if (typeof totalCount === 'number' && offset >= totalCount) break;
      if (data.length < pageSize) break;
    }

    console.log(`📊 Found ${allUsers.length} total users in Clerk`);

    // Filter users who claim to be premium
    const premiumUsers = allUsers.filter(user => user.publicMetadata?.isPremium === true);
    console.log(`👑 Found ${premiumUsers.length} premium users to verify`);

    for (const user of premiumUsers) {
      results.checked++;
      const meta = user.publicMetadata || {};
      const userEmail = user.emailAddresses?.[0]?.emailAddress || 'N/A';

      try {
        // LIFETIME USERS: Verify they have the isLifetime flag
        if (meta.isLifetime === true) {
          results.lifetimeUsers++;
          
          // Lifetime users are protected - just verify they have stripeCustomerId
          if (!meta.stripeCustomerId) {
            console.warn(`⚠️ Lifetime user ${user.id} missing stripeCustomerId`);
            results.errors.push({
              userId: user.id,
              email: userEmail,
              issue: 'Lifetime user missing stripeCustomerId',
            });
          } else {
            // Verify the customer exists in Stripe
            try {
              await stripe.customers.retrieve(meta.stripeCustomerId);
              results.valid++;
              console.log(`✅ Lifetime user ${user.id} verified`);
            } catch (stripeErr) {
              console.warn(`⚠️ Lifetime user ${user.id} has invalid stripeCustomerId`);
              results.errors.push({
                userId: user.id,
                email: userEmail,
                issue: 'Lifetime user has invalid stripeCustomerId',
              });
            }
          }
          continue;
        }

        // MONTHLY/SUBSCRIPTION USERS: Verify active subscription in Stripe
        results.monthlyUsers++;
        
        if (!meta.stripeCustomerId) {
          console.warn(`⚠️ Monthly user ${user.id} missing stripeCustomerId`);
          results.invalidUsers.push({
            userId: user.id,
            email: userEmail,
            issue: 'Missing stripeCustomerId',
          });
          continue;
        }

        // Check for active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: meta.stripeCustomerId,
          status: 'all',
          limit: 10,
        });

        const hasActiveSubscription = subscriptions.data.some(sub =>
          ['active', 'trialing', 'past_due'].includes(sub.status)
        );

        if (hasActiveSubscription) {
          results.valid++;
          console.log(`✅ Monthly user ${user.id} has active subscription`);
        } else {
          // User claims premium but no active subscription found
          console.warn(`❌ User ${user.id} marked as premium but NO active subscription found!`);
          
          results.invalidUsers.push({
            userId: user.id,
            email: userEmail,
            stripeCustomerId: meta.stripeCustomerId,
            issue: 'No active subscription in Stripe',
            subscriptionStatuses: subscriptions.data.map(s => s.status),
          });

          // Fix: Remove premium status
          await clerk.users.updateUser(user.id, {
            publicMetadata: {
              ...meta,
              isPremium: false,
              premiumRemovedAt: new Date().toISOString(),
              premiumRemovedReason: 'cron_sync_no_active_subscription',
            },
          });

          results.fixed++;
          console.log(`🔧 Fixed: Removed premium status for user ${user.id}`);
        }
      } catch (userError) {
        console.error(`Error checking user ${user.id}:`, userError.message);
        results.errors.push({
          userId: user.id,
          email: userEmail,
          issue: userError.message,
        });
      }
    }

    // Send notification if there were any fixes or errors
    if (results.fixed > 0 || results.errors.length > 0) {
      const notificationTitle = 'Premium Sync Alert';
      const notificationMessage = [
        `Checked: ${results.checked} users`,
        `Valid: ${results.valid}`,
        `Fixed: ${results.fixed}`,
        `Errors: ${results.errors.length}`,
        '',
        results.fixed > 0 ? `Fixed users: ${results.invalidUsers.map(u => u.email).join(', ')}` : '',
      ].filter(Boolean).join('\n');

      await sendNtfyNotification(notificationTitle, notificationMessage);
    }

    console.log('✅ Premium sync completed:', results);

    return res.status(200).json({
      success: true,
      message: 'Premium status sync completed',
      results: {
        totalChecked: results.checked,
        valid: results.valid,
        fixed: results.fixed,
        lifetimeUsers: results.lifetimeUsers,
        monthlyUsers: results.monthlyUsers,
        errorsCount: results.errors.length,
        invalidUsers: results.invalidUsers,
      },
    });
  } catch (error) {
    console.error('Premium sync error:', error);
    
    // Send error notification
    await sendNtfyNotification('Premium Sync Error', `Error: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message,
    });
  }
};
