// Admin endpoint to get statistics
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Admin authentication disabled for now
  // const adminKey = req.headers['x-admin-key'];
  // if (adminKey !== process.env.ADMIN_SECRET_KEY) {
  //   res.status(401).json({ error: 'Unauthorized' });
  //   return;
  // }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!clerkSecret || !stripeSecret) {
    res.status(500).json({ error: 'Required environment variables not configured' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-12-18.acacia' });
    
    // Get user statistics from Clerk
    const users = await clerk.users.getUserList({ limit: 100 });
    
    let totalUsers = users.data.length;
    let proUsers = 0;
    let freeUsers = 0;

    users.data.forEach(user => {
      if (user.publicMetadata?.isPremium) {
        proUsers++;
      } else {
        freeUsers++;
      }
    });

    // Get revenue statistics from Stripe
    let totalRevenue = 0;
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        status: 'succeeded'
      });

      paymentIntents.data.forEach(payment => {
        totalRevenue += payment.amount / 100; // Convert from cents
      });
    } catch (stripeError) {
      console.log('Could not fetch Stripe revenue data:', stripeError.message);
    }

    const stats = {
      totalUsers,
      proUsers,
      freeUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      conversionRate: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
