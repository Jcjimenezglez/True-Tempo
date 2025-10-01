// Admin endpoint to fix payment issues automatically
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Admin authentication disabled for now
  // const adminKey = req.headers['x-admin-key'];
  // if (adminKey !== process.env.ADMIN_SECRET_KEY) {
  //   res.status(401).json({ error: 'Unauthorized' });
  //   return;
  // }

  const { email, stripeCustomerId, action } = req.body;
  
  if (!email && !stripeCustomerId) {
    res.status(400).json({ error: 'email or stripeCustomerId is required' });
    return;
  }

  if (!action || !['fix_pro_status', 'sync_user'].includes(action)) {
    res.status(400).json({ error: 'action must be "fix_pro_status" or "sync_user"' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!clerkSecret || !stripeSecret) {
    res.status(500).json({ error: 'Required environment variables not configured' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    
    let targetEmail = email;
    let targetStripeCustomerId = stripeCustomerId;

    // If only email provided, find Stripe customer
    if (email && !stripeCustomerId) {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        targetStripeCustomerId = customers.data[0].id;
      } else {
        res.status(404).json({ error: 'Stripe customer not found for email' });
        return;
      }
    }

    // If only Stripe customer ID provided, get email
    if (stripeCustomerId && !email) {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      if (customer.email) {
        targetEmail = customer.email;
      } else {
        res.status(404).json({ error: 'Stripe customer has no email' });
        return;
      }
    }

    // Find Clerk user
    const users = await clerk.users.getUserList({ limit: 100 });
    const clerkUser = users.data.find(user => 
      user.emailAddresses?.some(email => email.emailAddress === targetEmail)
    );

    if (!clerkUser) {
      res.status(404).json({ error: 'Clerk user not found for email' });
      return;
    }

    // Get Stripe customer details
    const customer = await stripe.customers.retrieve(targetStripeCustomerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: targetStripeCustomerId,
      status: 'active'
    });

    const hasActiveSubscription = subscriptions.data.length > 0;

    if (action === 'fix_pro_status') {
      if (hasActiveSubscription) {
        // Update Clerk user with Pro status
        await clerk.users.updateUser(clerkUser.id, {
          publicMetadata: {
            ...clerkUser.publicMetadata,
            stripeCustomerId: targetStripeCustomerId,
            isPremium: true,
            premiumSince: clerkUser.publicMetadata?.premiumSince || new Date().toISOString(),
            adminFixed: true,
            adminFixedAt: new Date().toISOString(),
            adminFixedReason: 'Payment issue resolution'
          },
        });

        res.status(200).json({
          success: true,
          message: 'User Pro status fixed successfully',
          user: {
            id: clerkUser.id,
            email: targetEmail,
            isPremium: true,
            stripeCustomerId: targetStripeCustomerId
          }
        });
      } else {
        res.status(400).json({ 
          error: 'No active subscription found for this customer',
          hasActiveSubscription: false
        });
      }
    } else if (action === 'sync_user') {
      // Sync user data between Stripe and Clerk
      const updates = {
        ...clerkUser.publicMetadata,
        stripeCustomerId: targetStripeCustomerId,
        isPremium: hasActiveSubscription,
        adminSynced: true,
        adminSyncedAt: new Date().toISOString()
      };

      if (hasActiveSubscription && !clerkUser.publicMetadata?.premiumSince) {
        updates.premiumSince = new Date().toISOString();
      }

      await clerk.users.updateUser(clerkUser.id, {
        publicMetadata: updates
      });

      res.status(200).json({
        success: true,
        message: 'User data synced successfully',
        user: {
          id: clerkUser.id,
          email: targetEmail,
          isPremium: hasActiveSubscription,
          stripeCustomerId: targetStripeCustomerId,
          hasActiveSubscription: hasActiveSubscription
        }
      });
    }

  } catch (error) {
    console.error('Error fixing payment issue:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
