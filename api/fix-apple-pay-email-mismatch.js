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
    
    const clerkEmail = 'karolineaparecidalimasousa@gmail.com';
    const stripeEmail = 'karolineaparecida.2001@hotmail.com';
    
    // 1. Find user in Clerk (with pagination)
    let clerkUser = null;
    let offset = 0;
    const pageSize = 100;
    
    while (!clerkUser) {
      const users = await clerk.users.getUserList({ limit: pageSize, offset });
      const found = users.data.find(user => 
        user.emailAddresses?.some(email => email.emailAddress === clerkEmail)
      );
      
      if (found) {
        clerkUser = found;
        break;
      }
      
      if (users.data.length < pageSize) {
        break; // No more users to check
      }
      
      offset += pageSize;
    }

    if (!clerkUser) {
      return res.status(404).json({ 
        error: 'User not found in Clerk',
        email: clerkEmail,
        searched: offset + pageSize
      });
    }

    // 2. Find customer in Stripe (with pagination)
    let stripeCustomer = null;
    let startingAfter = null;
    
    while (!stripeCustomer) {
      const params = { limit: 100 };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const customers = await stripe.customers.list(params);
      const found = customers.data.find(customer => 
        customer.email === stripeEmail
      );
      
      if (found) {
        stripeCustomer = found;
        break;
      }
      
      if (!customers.has_more || customers.data.length === 0) {
        break; // No more customers to check
      }
      
      startingAfter = customers.data[customers.data.length - 1].id;
    }

    if (!stripeCustomer) {
      return res.status(404).json({ 
        error: 'Customer not found in Stripe',
        email: stripeEmail
      });
    }

    // 3. Check subscriptions and determine payment type
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      limit: 10
    });

    const activeSubscription = subscriptions.data.find(sub =>
      ['active', 'past_due', 'trialing', 'incomplete'].includes(sub.status)
    );

    if (!activeSubscription) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        stripeEmail: stripeEmail,
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status
        }))
      });
    }

    // Determine payment type from subscription
    const priceId = activeSubscription.items.data[0]?.price?.id;
    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
    const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
    
    let paymentType = 'premium'; // default
    if (priceId === premiumPriceId) {
      paymentType = 'premium';
    } else if (priceId === monthlyPriceId) {
      paymentType = 'monthly';
    } else if (priceId === yearlyPriceId) {
      paymentType = 'yearly';
    }

    // Determine if trial based on subscription status
    const isTrialing = activeSubscription.status === 'trialing';
    const isTrial = paymentType === 'premium' || isTrialing;

    // 4. Update Clerk user metadata (preserve existing fields)
    const existingMetadata = clerkUser.publicMetadata || {};
    const updatedMetadata = {
      ...existingMetadata, // Preserve all existing fields (scheduledEmails, totalFocusHours, statsLastUpdated, etc.)
      stripeCustomerId: stripeCustomer.id,
      isPremium: true,
      premiumSince: existingMetadata.premiumSince || new Date().toISOString(), // Use existing or create new
      paymentType: paymentType,
      isTrial: isTrial,
      lastUpdated: new Date().toISOString(),
    };

    await clerk.users.updateUser(clerkUser.id, {
      publicMetadata: updatedMetadata
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
      subscriptionStatus: activeSubscription.status,
      paymentType: paymentType,
      isTrial: isTrial,
      updatedMetadata: updatedMetadata
    });

  } catch (error) {
    console.error('Error fixing Apple Pay email mismatch:', error);
    res.status(500).json({ 
      error: 'Failed to fix Apple Pay email mismatch',
      details: error.message 
    });
  }
};
