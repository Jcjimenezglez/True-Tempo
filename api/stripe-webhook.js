// Stripe webhook handler for subscription events
// This will automatically mark users as premium when they pay

const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Helper to read raw body for Stripe signature verification
async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    try {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      
      // Try to mark user as premium in Clerk using metadata or email
      try {
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
          const clerk = createClerkClient({ secretKey: clerkSecret });
          const clerkUserId = session.metadata?.clerk_user_id;
          const email = session.customer_details?.email;
          const stripeCustomerId = session.customer;

          if (clerkUserId) {
            await clerk.users.updateUser(clerkUserId, {
              publicMetadata: { isPremium: true, stripeCustomerId },
            });
          } else if (email) {
            const users = await clerk.users.getUserList({ emailAddress: [email] });
            if (users?.length) {
              await clerk.users.updateUser(users[0].id, {
                publicMetadata: { isPremium: true, stripeCustomerId },
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to update Clerk metadata:', e);
      }
      
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Subscription payment succeeded:', invoice.id);
      
      // Ensure stripeCustomerId is stored too (for existing users)
      try {
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
          const clerk = createClerkClient({ secretKey: clerkSecret });
          const customerId = invoice.customer;
          const customer = await stripe.customers.retrieve(customerId);
          const email = customer?.email;
          if (email) {
            const users = await clerk.users.getUserList({ emailAddress: [email] });
            if (users?.length) {
              const currentMeta = users[0].publicMetadata || {};
              await clerk.users.updateUser(users[0].id, {
                publicMetadata: { ...currentMeta, isPremium: true, stripeCustomerId: customerId },
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to persist stripeCustomerId on payment_succeeded:', e);
      }
      
      break;
      
    case 'customer.subscription.deleted':
    case 'customer.subscription.canceled':
      try {
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
          const clerk = createClerkClient({ secretKey: clerkSecret });
          const sub = event.data.object;
          const customer = await stripe.customers.retrieve(sub.customer);
          const email = customer?.email;
          if (email) {
            const users = await clerk.users.getUserList({ emailAddress: [email] });
            if (users?.length) {
              await clerk.users.updateUser(users[0].id, {
                publicMetadata: { isPremium: false },
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to downgrade Clerk metadata:', e);
      }
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('New subscription created:', subscription.id);
      
      // No-op; checkout.completed already marks premium
      
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
