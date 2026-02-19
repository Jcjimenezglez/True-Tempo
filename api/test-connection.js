// Simple test script to verify Stripe and Clerk connections
const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

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

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2025-12-18.acacia' });
    const clerk = createClerkClient({ secretKey: clerkSecret });

    // Test Stripe connection
    const customers = await stripe.customers.list({ limit: 5 });
    console.log(`Stripe: Found ${customers.data.length} customers`);

    // Test Clerk connection
    const users = await clerk.users.getUserList({ limit: 5 });
    console.log(`Clerk: Found ${users.data.length} users`);

    res.status(200).json({
      message: 'Connections successful',
      stripe: {
        customers: customers.data.length,
        sample: customers.data.map(c => ({ id: c.id, email: c.email }))
      },
      clerk: {
        users: users.data.length,
        sample: users.data.map(u => ({ id: u.id, email: u.emailAddresses?.[0]?.emailAddress }))
      }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ 
      error: 'Connection test failed', 
      details: error.message,
      stack: error.stack
    });
  }
};
