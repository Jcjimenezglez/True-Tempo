const { createClerkClient } = require('@clerk/clerk-sdk-node');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Intentar leer CLERK_SECRET_KEY y STRIPE_SECRET_KEY de .env.local si existe
let CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
let STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!CLERK_SECRET_KEY || !STRIPE_SECRET_KEY) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const clerkMatch = envContent.match(/CLERK_SECRET_KEY=(.+)/);
    const stripeMatch = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
    if (clerkMatch) {
      CLERK_SECRET_KEY = clerkMatch[1].trim();
    }
    if (stripeMatch) {
      STRIPE_SECRET_KEY = stripeMatch[1].trim();
    }
  }
}

// Intentar obtener desde Vercel CLI si está disponible
if (!CLERK_SECRET_KEY || !STRIPE_SECRET_KEY) {
  try {
    const { execSync } = require('child_process');
    console.log('🔍 Intentando obtener keys desde Vercel...');
    const vercelEnv = execSync('vercel env pull .env.vercel.tmp --environment=production 2>/dev/null || true', { encoding: 'utf8', stdio: 'pipe' });
    const vercelPath = path.join(__dirname, '..', '.env.vercel.tmp');
    if (fs.existsSync(vercelPath)) {
      const vercelContent = fs.readFileSync(vercelPath, 'utf8');
      if (!CLERK_SECRET_KEY) {
        // Try different formats
        const match = vercelContent.match(/CLERK_SECRET_KEY=["']?([^"'\n]+)["']?/);
        if (match) {
          CLERK_SECRET_KEY = match[1].trim();
          console.log('✅ CLERK_SECRET_KEY encontrada en .env.vercel.tmp');
        }
      }
      if (!STRIPE_SECRET_KEY) {
        const match = vercelContent.match(/STRIPE_SECRET_KEY=["']?([^"'\n]+)["']?/);
        if (match) {
          STRIPE_SECRET_KEY = match[1].trim();
          console.log('✅ STRIPE_SECRET_KEY encontrada en .env.vercel.tmp');
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

if (!CLERK_SECRET_KEY) {
  console.error('❌ Error: CLERK_SECRET_KEY no encontrada');
  console.log('\n💡 Opciones:');
  console.log('   1. Exporta la variable: export CLERK_SECRET_KEY=sk_live_...');
  console.log('   2. O agrega CLERK_SECRET_KEY al archivo .env.local');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY no encontrada');
  console.log('\n💡 Opciones:');
  console.log('   1. Exporta la variable: export STRIPE_SECRET_KEY=sk_live_...');
  console.log('   2. O agrega STRIPE_SECRET_KEY al archivo .env.local');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const stripe = new Stripe(STRIPE_SECRET_KEY);

async function checkUserPremiumStatus(email) {
  try {
    console.log(`🔍 Checking premium status for: ${email}\n`);

    // Find user in Clerk by email
    const users = await clerk.users.getUserList({ limit: 100 });
    const user = users.data.find(u => 
      u.emailAddresses?.some(e => e.emailAddress === email)
    );

    if (!user) {
      console.log('❌ User not found in Clerk');
      return;
    }

    console.log('📋 Clerk User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', user.id);
    console.log('Email:', user.emailAddresses?.[0]?.emailAddress);
    console.log('Public Metadata:', JSON.stringify(user.publicMetadata, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check premium status
    const isPremium = user.publicMetadata?.isPremium === true;
    const paymentType = user.publicMetadata?.paymentType || 'none';
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId;
    const isTrial = user.publicMetadata?.isTrial === true;
    const premiumSince = user.publicMetadata?.premiumSince;

    console.log('📊 Premium Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Is Premium:', isPremium ? '✅ YES' : '❌ NO');
    console.log('Payment Type:', paymentType);
    console.log('Is Trial:', isTrial ? '✅ YES' : '❌ NO');
    console.log('Premium Since:', premiumSince || 'N/A');
    console.log('Stripe Customer ID:', stripeCustomerId || 'N/A');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check Stripe subscription if customer ID exists
    if (stripeCustomerId) {
      console.log('🔍 Checking Stripe subscription...');
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 10,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          console.log('📋 Stripe Subscription Details:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Subscription ID:', subscription.id);
          console.log('Status:', subscription.status);
          console.log('Trial End:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A');
          console.log('Current Period End:', subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A');
          console.log('Cancel At Period End:', subscription.cancel_at_period_end ? 'YES' : 'NO');
          console.log('Price ID:', subscription.items.data[0]?.price?.id);
          console.log('Amount:', `$${(subscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}`);
          console.log('Interval:', subscription.items.data[0]?.price?.recurring?.interval);
          console.log('Trial Period Days:', subscription.items.data[0]?.price?.recurring?.trial_period_days || 'N/A');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');

          // Check if subscription status matches Clerk metadata
          const subscriptionIsActive = ['active', 'trialing'].includes(subscription.status);
          if (subscriptionIsActive && !isPremium) {
            console.log('⚠️  MISMATCH: Subscription is active in Stripe but user is NOT premium in Clerk!');
            console.log('   This needs to be fixed.');
          } else if (!subscriptionIsActive && isPremium) {
            console.log('⚠️  MISMATCH: User is premium in Clerk but subscription is NOT active in Stripe!');
            console.log('   This needs to be fixed.');
          } else if (subscriptionIsActive && isPremium) {
            console.log('✅ Status matches: User is premium in both Clerk and Stripe');
          }
        } else {
          console.log('⚠️  No active subscriptions found in Stripe for this customer');
        }
      } catch (stripeError) {
        console.error('❌ Error checking Stripe subscription:', stripeError);
      }
    } else {
      console.log('⚠️  No Stripe Customer ID found in Clerk metadata');
    }

  } catch (error) {
    console.error('❌ Error checking user status:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'julio93.314@gmail.com';
checkUserPremiumStatus(email);

