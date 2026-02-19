// API endpoint to manually fix user premium status
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { userEmail, stripeCustomerId } = req.body;

    if (!userEmail && !stripeCustomerId) {
      res.status(400).json({ error: 'Either userEmail or stripeCustomerId is required' });
      return;
    }

    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!clerkSecret || !stripeSecret) {
      res.status(500).json({ error: 'Missing environment variables' });
      return;
    }

    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-12-18.acacia' });

    let targetUserId = null;
    let customerId = stripeCustomerId;

    // Find Clerk user by email
    if (userEmail) {
      const users = await clerk.users.getUserList({ limit: 100 });
      const user = users.data.find(u => 
        u.emailAddresses?.some(email => email.emailAddress === userEmail)
      );
      
      if (user) {
        targetUserId = user.id;
        console.log(`Found Clerk user: ${userEmail} -> ${targetUserId}`);
      }
    }

    // Find Stripe customer if not provided
    if (!customerId && userEmail) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 10
      });

      // Look for customer with active subscription
      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10,
        });

        const hasActiveSubscription = subscriptions.data.some(sub =>
          ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
        );

        if (hasActiveSubscription) {
          customerId = customer.id;
          console.log(`Found Stripe customer with active subscription: ${customerId}`);
          break;
        }
      }
    }

    if (!targetUserId) {
      res.status(404).json({ error: 'Clerk user not found' });
      return;
    }

    if (!customerId) {
      res.status(404).json({ error: 'Stripe customer with active subscription not found' });
      return;
    }

    // Update Clerk user with premium status
    await clerk.users.updateUser(targetUserId, {
      publicMetadata: {
        stripeCustomerId: customerId,
        isPremium: true,
        premiumSince: new Date().toISOString(),
      },
    });

    console.log(`Successfully updated user ${targetUserId} with premium status`);

    res.status(200).json({ 
      message: 'User premium status updated successfully',
      userId: targetUserId,
      stripeCustomerId: customerId
    });

  } catch (error) {
    console.error('Error fixing user premium status:', error);
    res.status(500).json({ 
      error: 'Failed to fix user premium status',
      details: error.message 
    });
  }
};
