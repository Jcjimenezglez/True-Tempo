// Fix user who paid with Apple Pay (iCloud email)
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

    // 2. Get all Stripe customers and find one with active subscription
    const customers = await stripe.customers.list({ limit: 100 });
    
    let targetCustomer = null;
    let activeSubscription = null;

    // Look for customers with active subscriptions
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10
      });

      const hasActiveSubscription = subscriptions.data.some(sub =>
        ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
      );

      if (hasActiveSubscription) {
        // Check if this could be our user by looking at metadata or recent creation
        const recentCustomer = customer.created > (Date.now() / 1000) - (7 * 24 * 60 * 60); // Last 7 days
        const hasClerkMetadata = customer.metadata?.clerk_user_id === clerkUser.id;
        
        if (hasClerkMetadata || recentCustomer) {
          targetCustomer = customer;
          activeSubscription = subscriptions.data.find(sub =>
            ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
          );
          break;
        }
      }
    }

    if (!targetCustomer) {
      return res.status(404).json({ 
        error: 'No matching customer found in Stripe',
        clerkEmail: clerkEmail,
        clerkUserId: clerkUser.id,
        totalCustomers: customers.data.length,
        recentCustomers: customers.data
          .filter(c => c.created > (Date.now() / 1000) - (7 * 24 * 60 * 60))
          .map(c => ({ id: c.id, email: c.email, created: c.created, metadata: c.metadata }))
      });
    }

    // 3. Update Clerk user metadata
    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isPremium: true,
        stripeCustomerId: targetCustomer.id,
        premiumSince: new Date().toISOString()
      }
    });

    res.json({
      message: 'Apple Pay user premium status updated successfully',
      clerkEmail: clerkEmail,
      clerkUserId: clerkUser.id,
      stripeCustomer: {
        id: targetCustomer.id,
        email: targetCustomer.email,
        created: targetCustomer.created
      },
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status
      }
    });

  } catch (error) {
    console.error('Error fixing Apple Pay user:', error);
    res.status(500).json({ 
      error: 'Failed to fix Apple Pay user',
      details: error.message 
    });
  }
};
