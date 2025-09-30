// Fix Apple Pay user with email mismatch
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    
    if (!clerkSecret || !stripeSecret) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = Stripe(stripeSecret);
    
    const clerkEmail = 'omrvieito@gmail.com';
    const stripeEmail = 'olgavieito@icloud.com';
    
    // 1. Find user in Clerk
    const users = await clerk.users.getUserList({ limit: 100 });
    const clerkUser = users.data.find(user => 
      user.emailAddresses?.some(email => email.emailAddress === clerkEmail)
    );

    if (!clerkUser) {
      return res.status(404).json({ 
        error: 'User not found in Clerk',
        email: clerkEmail
      });
    }

    // 2. Find customer in Stripe
    const customers = await stripe.customers.list({ limit: 100 });
    const stripeCustomer = customers.data.find(customer => 
      customer.email === stripeEmail
    );

    if (!stripeCustomer) {
      return res.status(404).json({ 
        error: 'Customer not found in Stripe',
        email: stripeEmail
      });
    }

    // 3. Check subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      limit: 10
    });

    const hasActiveSubscription = subscriptions.data.some(sub =>
      ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
    );

    if (!hasActiveSubscription) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        stripeEmail: stripeEmail,
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status
        }))
      });
    }

    // 4. Update Clerk user metadata
    await clerk.users.updateUser(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isPremium: true,
        stripeCustomerId: stripeCustomer.id,
        premiumSince: new Date().toISOString()
      }
    });

    // 5. Update Stripe customer metadata to link back to Clerk
    await stripe.customers.update(stripeCustomer.id, {
      metadata: {
        ...stripeCustomer.metadata,
        clerk_user_id: clerkUser.id,
        clerk_email: clerkEmail
      }
    });

    res.json({
      message: 'Apple Pay email mismatch fixed successfully',
      clerkEmail: clerkEmail,
      stripeEmail: stripeEmail,
      clerkUserId: clerkUser.id,
      stripeCustomerId: stripeCustomer.id,
      subscriptionStatus: subscriptions.data[0]?.status
    });

  } catch (error) {
    console.error('Error fixing Apple Pay email mismatch:', error);
    res.status(500).json({ 
      error: 'Failed to fix Apple Pay email mismatch',
      details: error.message 
    });
  }
};
