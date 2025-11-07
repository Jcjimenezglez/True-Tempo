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

if (!CLERK_SECRET_KEY || !STRIPE_SECRET_KEY) {
  console.error('❌ Error: CLERK_SECRET_KEY o STRIPE_SECRET_KEY no encontradas');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

async function fixUserPremiumSync(clerkUserId, stripeCustomerId) {
  try {
    console.log('🔧 Fixing user premium sync...\n');
    console.log('Clerk User ID:', clerkUserId);
    console.log('Stripe Customer ID:', stripeCustomerId);
    console.log('');

    // Get user from Clerk
    const user = await clerk.users.getUser(clerkUserId);
    console.log('📋 Current Clerk User Metadata:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', user.emailAddresses?.[0]?.emailAddress);
    console.log('isPremium:', user.publicMetadata?.isPremium);
    console.log('stripeCustomerId:', user.publicMetadata?.stripeCustomerId);
    console.log('paymentType:', user.publicMetadata?.paymentType);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Get subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      console.log('⚠️  No subscriptions found in Stripe for this customer');
      return;
    }

    const subscription = subscriptions.data[0];
    console.log('📋 Stripe Subscription Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Subscription ID:', subscription.id);
    console.log('Status:', subscription.status);
    console.log('Trial End:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A');
    console.log('Current Period End:', subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A');
    console.log('Price ID:', subscription.items.data[0]?.price?.id);
    console.log('Amount:', `$${(subscription.items.data[0]?.price?.unit_amount / 100).toFixed(2)}`);
    console.log('Trial Period Days:', subscription.items.data[0]?.price?.recurring?.trial_period_days || 'N/A');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check if subscription is active or trialing
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const isTrialing = subscription.status === 'trialing';
    
    // Determine payment type from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    const paymentType = priceId === premiumPriceId ? 'premium' : 'monthly';

    // Update Clerk user with correct information
    const updatedMetadata = {
      ...(user.publicMetadata || {}),
      stripeCustomerId: stripeCustomerId, // Update to correct Stripe customer ID
      isPremium: isActive, // Set to true if subscription is active or trialing
      premiumSince: isActive ? (user.publicMetadata?.premiumSince || new Date().toISOString()) : null,
      paymentType: paymentType,
      isTrial: isTrialing,
      lastUpdated: new Date().toISOString(),
      syncedManually: true,
      syncedAt: new Date().toISOString(),
    };

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: updatedMetadata,
    });

    console.log('✅ Updated Clerk user with correct information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('stripeCustomerId:', updatedMetadata.stripeCustomerId);
    console.log('isPremium:', updatedMetadata.isPremium);
    console.log('paymentType:', updatedMetadata.paymentType);
    console.log('isTrial:', updatedMetadata.isTrial);
    console.log('premiumSince:', updatedMetadata.premiumSince);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check why trial didn't work
    if (subscription.status === 'active' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end * 1000);
      const now = new Date();
      if (trialEnd > now) {
        console.log('⚠️  WARNING: Subscription is active but trial should still be running!');
        console.log('   Trial End:', trialEnd.toISOString());
        console.log('   Current Time:', now.toISOString());
        console.log('   This suggests the trial was not configured correctly or was skipped.');
      }
    }

    // Check if payment was made during trial
    const payments = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    console.log('💳 Recent Payments:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    payments.data.forEach(payment => {
      console.log(`Amount: $${(payment.amount / 100).toFixed(2)}`);
      console.log(`Status: ${payment.status}`);
      console.log(`Created: ${new Date(payment.created * 1000).toISOString()}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error fixing user premium sync:', error);
    process.exit(1);
  }
}

const clerkUserId = process.argv[2] || 'user_33XqushUkPPnsITZuUoJLlLv3Z9';
const stripeCustomerId = process.argv[3] || 'cus_TNcVkxFGNZdpWk';

fixUserPremiumSync(clerkUserId, stripeCustomerId);

