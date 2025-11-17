// Search Stripe customers by email for debugging sync issues
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return res.status(500).json({ error: 'Stripe secret not configured' });
    }

    const stripe = Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    const targetEmail = (req.query.email || req.query.user || 'omrvieito@gmail.com').toLowerCase();

    let matches = [];
    try {
      if (targetEmail && targetEmail !== 'all') {
        const searchResult = await stripe.customers.search({
          query: `email:'${targetEmail}'`,
          limit: 20,
        });
        matches = searchResult.data || [];
      }
    } catch (searchError) {
      console.warn('Stripe search API failed, falling back to list:', searchError?.message);
    }

    if (matches.length === 0) {
      const customers = await stripe.customers.list({ limit: 100 });
      matches = customers.data.filter((customer) => customer.email?.toLowerCase() === targetEmail);

      if (matches.length === 0) {
        return res.json({
          message: 'Customer not found in Stripe',
          searchedEmail: targetEmail,
          totalCustomers: customers.data.length,
          allEmails: customers.data.map((c) => c.email).filter(Boolean),
        });
      }
    }

    const enrichedCustomers = [];
    for (const customer of matches) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
        status: 'all',
      });

      enrichedCustomers.push({
        id: customer.id,
        email: customer.email,
        created: customer.created,
        metadata: customer.metadata,
        subscriptions: subscriptions.data.map((sub) => ({
          id: sub.id,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          price_id: sub.items.data[0]?.price?.id,
          trial_end: sub.trial_end,
        })),
      });
    }

    res.json({
      message: 'Customer(s) found in Stripe',
      count: enrichedCustomers.length,
      searchedEmail: targetEmail,
      customers: enrichedCustomers,
    });
  } catch (error) {
    console.error('Error checking Stripe customers:', error);
    res.status(500).json({
      error: 'Failed to check Stripe customers',
      details: error.message,
    });
  }
};
