// Admin endpoint to detect users who paid but don't have Pro status
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Simple admin authentication
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
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
    
    // Get all users from Clerk
    const users = await clerk.users.getUserList({ limit: 100 });
    
    // Get all customers with active subscriptions from Stripe
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ['data.subscriptions']
    });

    const paymentIssues = [];

    // Check each Stripe customer
    for (const customer of customers.data) {
      // Skip if customer has no email
      if (!customer.email) continue;

      // Check if customer has active subscription
      const hasActiveSubscription = customer.subscriptions?.data?.some(
        sub => ['active', 'trialing', 'past_due'].includes(sub.status)
      );

      if (hasActiveSubscription) {
        // Find corresponding Clerk user
        const clerkUser = users.data.find(user => 
          user.emailAddresses?.some(email => email.emailAddress === customer.email)
        );

        if (clerkUser) {
          // Check if Clerk user has Pro status
          const hasProStatus = clerkUser.publicMetadata?.isPremium === true;

          if (!hasProStatus) {
            // This is a payment issue!
            const subscription = customer.subscriptions.data.find(
              sub => ['active', 'trialing', 'past_due'].includes(sub.status)
            );

            paymentIssues.push({
              clerkUserId: clerkUser.id,
              email: customer.email,
              stripeCustomerId: customer.id,
              subscriptionId: subscription?.id,
              subscriptionStatus: subscription?.status,
              amount: subscription?.items?.data?.[0]?.price?.unit_amount ? 
                subscription.items.data[0].price.unit_amount / 100 : 0,
              currency: subscription?.items?.data?.[0]?.price?.currency || 'usd',
              subscriptionCreated: subscription?.created ? 
                new Date(subscription.created * 1000).toISOString() : null,
              lastPayment: subscription?.current_period_start ? 
                new Date(subscription.current_period_start * 1000).toISOString() : null,
              issue: 'User has active Stripe subscription but no Pro status in Clerk',
              severity: 'high'
            });
          }
        } else {
          // Customer exists in Stripe but not in Clerk
          const subscription = customer.subscriptions.data.find(
            sub => ['active', 'trialing', 'past_due'].includes(sub.status)
          );

          paymentIssues.push({
            clerkUserId: null,
            email: customer.email,
            stripeCustomerId: customer.id,
            subscriptionId: subscription?.id,
            subscriptionStatus: subscription?.status,
            amount: subscription?.items?.data?.[0]?.price?.unit_amount ? 
              subscription.items.data[0].price.unit_amount / 100 : 0,
            currency: subscription?.items?.data?.[0]?.price?.currency || 'usd',
            subscriptionCreated: subscription?.created ? 
              new Date(subscription.created * 1000).toISOString() : null,
            lastPayment: subscription?.current_period_start ? 
              new Date(subscription.current_period_start * 1000).toISOString() : null,
            issue: 'Customer has active Stripe subscription but no Clerk account',
            severity: 'medium'
          });
        }
      }
    }

    // Also check for failed payments
    const failedPayments = await stripe.paymentIntents.list({
      limit: 50,
      status: 'requires_payment_method'
    });

    for (const payment of failedPayments.data) {
      if (payment.customer) {
        const customer = await stripe.customers.retrieve(payment.customer);
        if (customer.email) {
          const clerkUser = users.data.find(user => 
            user.emailAddresses?.some(email => email.emailAddress === customer.email)
          );

          if (clerkUser) {
            paymentIssues.push({
              clerkUserId: clerkUser.id,
              email: customer.email,
              stripeCustomerId: customer.id,
              subscriptionId: null,
              subscriptionStatus: 'failed',
              amount: payment.amount / 100,
              currency: payment.currency,
              subscriptionCreated: null,
              lastPayment: new Date(payment.created * 1000).toISOString(),
              issue: 'Payment failed - requires new payment method',
              severity: 'medium'
            });
          }
        }
      }
    }

    // Sort by severity and date
    paymentIssues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.lastPayment || b.subscriptionCreated) - new Date(a.lastPayment || a.subscriptionCreated);
    });

    res.status(200).json({
      success: true,
      issues: paymentIssues,
      total: paymentIssues.length,
      highSeverity: paymentIssues.filter(issue => issue.severity === 'high').length,
      mediumSeverity: paymentIssues.filter(issue => issue.severity === 'medium').length
    });

  } catch (error) {
    console.error('Error detecting payment issues:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
