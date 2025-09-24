// Vercel serverless function to create a Stripe Customer Portal session
// Expects environment variables configured in Vercel project settings:
// STRIPE_SECRET_KEY

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const returnUrl = process.env.STRIPE_RETURN_URL || 'https://focus-timer-pomodoro-mu.vercel.app';

  if (!secretKey) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    
    // In a real app, you'd need to:
    // 1. Get the customer ID from your database using the user ID
    // 2. Create a customer portal session for that customer
    
    // For now, since we don't have a database, we'll create a generic portal session
    // This would need to be updated with proper customer management
    
    // First, try to find or create a customer
    // In production, you'd store customer IDs in your database
    const customers = await stripe.customers.list({
      limit: 1,
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a placeholder customer - in production, this would be properly managed
      const customer = await stripe.customers.create({
        email: 'user@example.com', // This would come from your user data
      });
      customerId = customer.id;
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Customer portal error:', err);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
};
