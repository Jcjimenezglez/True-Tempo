// Admin endpoint to get webhook logs
// Note: This is a simplified version. In production, you'd want to store webhook logs in a database

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

  try {
    // For now, return sample webhook logs
    // In production, you'd query a database or log storage system
    const webhookLogs = [
      {
        id: 'wh_1',
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Webhook processed successfully: checkout.session.completed',
        details: 'User premium status updated successfully',
        eventType: 'checkout.session.completed'
      },
      {
        id: 'wh_2',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        level: 'error',
        message: 'Webhook processing failed: customer.subscription.created',
        details: 'Could not find Clerk user for customer: cus_xxx',
        eventType: 'customer.subscription.created'
      },
      {
        id: 'wh_3',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        level: 'warning',
        message: 'Webhook signature verification failed',
        details: 'Invalid webhook signature for event: payment_intent.succeeded',
        eventType: 'payment_intent.succeeded'
      },
      {
        id: 'wh_4',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        level: 'info',
        message: 'Webhook received: customer.subscription.updated',
        details: 'Subscription status changed to active',
        eventType: 'customer.subscription.updated'
      }
    ];

    res.status(200).json({
      success: true,
      logs: webhookLogs,
      total: webhookLogs.length,
      note: 'This is sample data. In production, implement proper webhook log storage.'
    });

  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
