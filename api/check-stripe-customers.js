// Check all Stripe customers to find omrvieito@gmail.com
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Get all customers
    const customers = await stripe.customers.list({ limit: 100 });
    
    // Find omrvieito@gmail.com
    const targetCustomer = customers.data.find(customer => 
      customer.email === 'omrvieito@gmail.com'
    );

    if (!targetCustomer) {
      return res.json({
        message: 'Customer not found in Stripe',
        searchedEmail: 'omrvieito@gmail.com',
        totalCustomers: customers.data.length,
        allEmails: customers.data.map(c => c.email).filter(Boolean)
      });
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: targetCustomer.id,
      limit: 10
    });

    res.json({
      message: 'Customer found in Stripe',
      customer: {
        id: targetCustomer.id,
        email: targetCustomer.email,
        created: targetCustomer.created,
        metadata: targetCustomer.metadata
      },
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        price_id: sub.items.data[0]?.price?.id
      }))
    });

  } catch (error) {
    console.error('Error checking Stripe customers:', error);
    res.status(500).json({ 
      error: 'Failed to check Stripe customers',
      details: error.message 
    });
  }
};
