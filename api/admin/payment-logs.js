// Admin endpoint to get payment logs
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

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
    return;
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    
    // Get recent payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 50,
      expand: ['data.customer']
    });

    // Get recent checkout sessions
    const checkoutSessions = await stripe.checkout.sessions.list({
      limit: 50,
      expand: ['data.customer']
    });

    // Format payment logs
    const paymentLogs = [];

    // Add payment intents
    paymentIntents.data.forEach(payment => {
      paymentLogs.push({
        id: payment.id,
        type: 'payment_intent',
        timestamp: new Date(payment.created * 1000).toISOString(),
        amount: payment.amount / 100, // Convert from cents
        currency: payment.currency,
        status: payment.status,
        customer: payment.customer?.email || payment.customer?.id,
        level: payment.status === 'succeeded' ? 'success' : 'error',
        message: `Payment ${payment.status}: $${payment.amount / 100} ${payment.currency.toUpperCase()}`,
        details: `Payment Intent ID: ${payment.id}`
      });
    });

    // Add checkout sessions
    checkoutSessions.data.forEach(session => {
      paymentLogs.push({
        id: session.id,
        type: 'checkout_session',
        timestamp: new Date(session.created * 1000).toISOString(),
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        status: session.payment_status,
        customer: session.customer_details?.email || session.customer,
        level: session.payment_status === 'paid' ? 'success' : 'warning',
        message: `Checkout ${session.payment_status}: $${session.amount_total ? session.amount_total / 100 : 0} ${session.currency?.toUpperCase()}`,
        details: `Session ID: ${session.id} | Mode: ${session.mode}`
      });
    });

    // Sort by timestamp (newest first)
    paymentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      logs: paymentLogs.slice(0, 100), // Limit to 100 most recent
      total: paymentLogs.length
    });

  } catch (error) {
    console.error('Error fetching payment logs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
