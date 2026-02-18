const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

    // 1. Get all customers with active/past subscriptions (monthly)
    const allSubscriptions = [];
    let hasMore = true;
    let startingAfter;

    while (hasMore) {
      const params = { limit: 100, status: 'all', expand: ['data.customer', 'data.default_payment_method'] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      allSubscriptions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // 2. Get all successful one-time payments (lifetime)
    const allCharges = [];
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params = { limit: 100, expand: ['data.customer', 'data.payment_method_details'] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.charges.list(params);
      const successful = batch.data.filter((c) => c.status === 'succeeded' || c.paid);
      allCharges.push(...successful);
      hasMore = batch.has_more;
      if (batch.data.length) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Build customer map with country data
    const customers = {};

    for (const sub of allSubscriptions) {
      const cust = typeof sub.customer === 'object' ? sub.customer : null;
      const custId = cust?.id || sub.customer;
      if (!custId) continue;

      if (!customers[custId]) {
        customers[custId] = {
          email: cust?.email || null,
          country: null,
          plans: [],
          statuses: [],
          total_paid: 0,
        };
      }

      const planType = sub.items?.data?.[0]?.price?.recurring ? 'monthly' : 'one-time';
      customers[custId].plans.push(planType);
      customers[custId].statuses.push(sub.status);

      // Try to get country from default payment method
      if (sub.default_payment_method && typeof sub.default_payment_method === 'object') {
        const pm = sub.default_payment_method;
        customers[custId].country = customers[custId].country || pm.card?.country || pm.billing_details?.address?.country || null;
      }
    }

    for (const charge of allCharges) {
      const cust = typeof charge.customer === 'object' ? charge.customer : null;
      const custId = cust?.id || charge.customer;
      if (!custId) continue;

      if (!customers[custId]) {
        customers[custId] = {
          email: cust?.email || null,
          country: null,
          plans: [],
          statuses: [],
          total_paid: 0,
        };
      }

      customers[custId].total_paid += (charge.amount || 0) / 100;
      if (!customers[custId].plans.includes('lifetime') && charge.amount === 2400) {
        customers[custId].plans.push('lifetime');
      }

      // Get country from payment method details
      const pmd = charge.payment_method_details;
      if (pmd) {
        const cardCountry = pmd.card?.country;
        const billingCountry = charge.billing_details?.address?.country;
        customers[custId].country = customers[custId].country || cardCountry || billingCountry || null;
      }

      if (cust?.email) customers[custId].email = cust.email;
    }

    // For customers still missing country, try fetching their payment methods
    for (const [custId, data] of Object.entries(customers)) {
      if (!data.country) {
        try {
          const pms = await stripe.paymentMethods.list({ customer: custId, type: 'card', limit: 1 });
          if (pms.data.length > 0) {
            data.country = pms.data[0].card?.country || pms.data[0].billing_details?.address?.country || null;
          }
        } catch (_) {
          // skip
        }
      }
    }

    // Aggregate by country
    const byCountry = {};
    const customerList = [];

    for (const [custId, data] of Object.entries(customers)) {
      const country = data.country || 'UNKNOWN';
      if (!byCountry[country]) {
        byCountry[country] = { customers: 0, active_subscriptions: 0, lifetime: 0, total_paid: 0 };
      }
      byCountry[country].customers++;
      byCountry[country].total_paid += data.total_paid;

      const hasActive = data.statuses.some((s) => ['active', 'trialing'].includes(s));
      if (hasActive) byCountry[country].active_subscriptions++;
      if (data.plans.includes('lifetime')) byCountry[country].lifetime++;

      customerList.push({
        customer_id: custId,
        email: data.email ? data.email.substring(0, 3) + '***' : null,
        country: data.country,
        plans: [...new Set(data.plans)],
        statuses: [...new Set(data.statuses)],
        total_paid: data.total_paid,
      });
    }

    // Sort countries by total_paid descending
    const sortedCountries = Object.entries(byCountry)
      .sort((a, b) => b[1].total_paid - a[1].total_paid)
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

    // Also get the Feb 1-18 abandoned sessions by country
    const from = Math.floor(new Date('2026-02-01T00:00:00Z').getTime() / 1000);
    const to = Math.floor(new Date('2026-02-19T00:00:00Z').getTime() / 1000);
    const recentSessions = [];
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params = { limit: 100, created: { gte: from, lt: to } };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.checkout.sessions.list(params);
      recentSessions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length) startingAfter = batch.data[batch.data.length - 1].id;
    }

    const abandonedByCountry = {};
    for (const s of recentSessions) {
      if (s.status !== 'expired') continue;
      const country = s.customer_details?.address?.country || 'UNKNOWN';
      if (!abandonedByCountry[country]) abandonedByCountry[country] = 0;
      abandonedByCountry[country]++;
    }

    res.status(200).json({
      paying_customers_by_country: sortedCountries,
      total_paying_customers: Object.keys(customers).length,
      abandoned_sessions_feb_by_country: abandonedByCountry,
      customers_detail: customerList,
    });
  } catch (error) {
    console.error('Customer countries error:', error);
    res.status(500).json({ error: error.message });
  }
};
