// Script to sync existing premium users from Stripe to Clerk
const Stripe = require('stripe');
const Clerk = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const clerkSecret = process.env.CLERK_SECRET_KEY;

  if (!secretKey || !clerkSecret) {
    res.status(500).json({ error: 'Missing environment variables' });
    return;
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
  const clerk = new Clerk({ secretKey: clerkSecret });

  try {
    // Get all customers with subscriptions
    const customers = await stripe.customers.list({ limit: 100 });
    const syncedUsers = [];

    console.log(`Found ${customers.data.length} customers in Stripe`);

    for (const customer of customers.data) {
      try {
        // Check if customer has any subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        const hasActiveSubscription = subscriptions.data.some(sub => 
          ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
        );

        console.log(`Customer ${customer.email}: ${subscriptions.data.length} subscriptions, hasActive: ${hasActiveSubscription}`);

        if (hasActiveSubscription && customer.email) {
          // Find Clerk user by email
          const users = await clerk.users.getUserList({
            limit: 100,
          });
          
          const user = users.data.find(u => 
            u.emailAddresses?.some(email => email.emailAddress === customer.email)
          );

          if (user) {
            // Update user with Stripe customer ID and premium status
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...user.publicMetadata,
                stripeCustomerId: customer.id,
                isPremium: true,
                premiumSince: user.publicMetadata?.premiumSince || new Date().toISOString(),
              },
            });

            syncedUsers.push({
              email: customer.email,
              clerkUserId: user.id,
              stripeCustomerId: customer.id,
            });

            console.log(`Synced user: ${customer.email} -> ${user.id}`);
          } else {
            console.log(`No Clerk user found for email: ${customer.email}`);
          }
        }
      } catch (customerError) {
        console.error(`Error processing customer ${customer.email}:`, customerError.message);
      }
    }

    res.status(200).json({
      message: 'Premium users synced successfully',
      syncedCount: syncedUsers.length,
      users: syncedUsers,
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
};
