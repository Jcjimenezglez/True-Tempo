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

    const from = Math.floor(new Date('2026-02-01T00:00:00Z').getTime() / 1000);
    const to = Math.floor(new Date('2026-02-19T00:00:00Z').getTime() / 1000);

    const allSessions = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: from, lt: to },
        expand: ['data.payment_intent'],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const batch = await stripe.checkout.sessions.list(params);
      allSessions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    const summary = { total: allSessions.length, complete: 0, expired: 0, open: 0, other: 0, monthly: 0, lifetime: 0 };
    const sessions = allSessions.map((s) => {
      if (s.status === 'complete') summary.complete++;
      else if (s.status === 'expired') summary.expired++;
      else if (s.status === 'open') summary.open++;
      else summary.other++;

      const plan = s.metadata?.payment_type || (s.mode === 'payment' ? 'lifetime' : 'monthly');
      if (plan === 'lifetime') summary.lifetime++;
      else summary.monthly++;

      return {
        id: s.id,
        created: new Date(s.created * 1000).toISOString(),
        status: s.status,
        payment_status: s.payment_status,
        mode: s.mode,
        plan,
        amount: s.amount_total ? s.amount_total / 100 : null,
        currency: s.currency,
        customer_email: s.customer_details?.email || s.customer_email || null,
        payment_intent_status: s.payment_intent?.status || null,
      };
    });

    // Check recent webhook events
    const webhookEvents = await stripe.events.list({
      type: 'checkout.session.completed',
      created: { gte: from, lt: to },
      limit: 50,
    });

    // Check recent failed payments
    const failedPayments = await stripe.paymentIntents.list({
      created: { gte: from, lt: to },
      limit: 50,
    });

    const paymentsSummary = { succeeded: 0, failed: 0, canceled: 0, requires_action: 0, other: 0 };
    failedPayments.data.forEach((pi) => {
      if (pi.status === 'succeeded') paymentsSummary.succeeded++;
      else if (pi.status === 'canceled') paymentsSummary.canceled++;
      else if (pi.status === 'requires_payment_method') paymentsSummary.failed++;
      else if (pi.status === 'requires_action') paymentsSummary.requires_action++;
      else paymentsSummary.other++;
    });

    res.status(200).json({
      period: 'Feb 1 - Feb 18, 2026',
      checkout_sessions: summary,
      sessions_detail: sessions,
      webhook_events_checkout_completed: webhookEvents.data.length,
      payment_intents: paymentsSummary,
    });
  } catch (error) {
    console.error('Checkout diagnostics error:', error);
    res.status(500).json({ error: error.message });
  }
};
