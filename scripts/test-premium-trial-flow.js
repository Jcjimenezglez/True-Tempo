const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Intentar leer STRIPE_SECRET_KEY de .env.local si existe
let STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
    if (match) {
      STRIPE_SECRET_KEY = match[1].trim();
    }
  }
}

// Intentar obtener desde Vercel CLI si está disponible
if (!STRIPE_SECRET_KEY) {
  try {
    const { execSync } = require('child_process');
    console.log('🔍 Intentando obtener STRIPE_SECRET_KEY desde Vercel...');
    const vercelEnv = execSync('vercel env pull .env.vercel.tmp --environment=production 2>/dev/null || true', { encoding: 'utf8', stdio: 'pipe' });
    const vercelPath = path.join(__dirname, '..', '.env.vercel.tmp');
    if (fs.existsSync(vercelPath)) {
      const vercelContent = fs.readFileSync(vercelPath, 'utf8');
      const match = vercelContent.match(/STRIPE_SECRET_KEY=["']?([^"'\n]+)["']?/);
      if (match) {
        STRIPE_SECRET_KEY = match[1].trim();
        console.log('✅ STRIPE_SECRET_KEY encontrada en .env.vercel.tmp');
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY no encontrada');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

async function testPremiumTrialFlow() {
  try {
    console.log('🧪 Testing Premium Trial Flow...\n');

    const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    
    console.log('📋 Step 1: Verify Premium Price Configuration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const price = await stripe.prices.retrieve(premiumPriceId);
    console.log('Price ID:', price.id);
    console.log('Amount:', `$${(price.unit_amount / 100).toFixed(2)}`);
    console.log('Trial Period Days:', price.recurring?.trial_period_days || 'NOT SET ❌');
    
    if (!price.recurring?.trial_period_days) {
      console.error('\n❌ ERROR: Trial period is NOT configured!');
      console.error('   This will cause users to be charged immediately.');
      process.exit(1);
    }
    
    if (price.recurring.trial_period_days !== 90) {
      console.warn(`\n⚠️  WARNING: Trial period is ${price.recurring.trial_period_days} days, expected 90 days`);
    } else {
      console.log('✅ Trial period is correctly configured (90 days)');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Step 2: Simulate Checkout Session Creation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Create a test customer
    const testCustomer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      description: 'Test customer for Premium trial verification',
    });
    console.log('Test Customer ID:', testCustomer.id);
    console.log('Test Customer Email:', testCustomer.email);
    
    // Create a checkout session (simulating what the API does)
    const sessionConfig = {
      mode: 'subscription',
      line_items: [
        {
          price: premiumPriceId,
          quantity: 1,
        },
      ],
      customer: testCustomer.id,
      metadata: {
        clerk_user_id: 'test_user_id',
        payment_type: 'premium',
      },
      subscription_data: {
        description: '3 months free trial. You will be charged $3.99/month after the trial ends. Cancel anytime.',
        metadata: {
          trial_info: '3 months free, then $3.99/month',
        },
      },
      success_url: 'https://www.superfocus.live?premium=1&payment=success',
      cancel_url: 'https://www.superfocus.live',
    };
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Checkout Session ID:', session.id);
    console.log('Checkout Session URL:', session.url);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Step 3: Verify Subscription After Checkout (Manual)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('To complete the test:');
    console.log('1. Open the Checkout Session URL in your browser');
    console.log('2. Use Stripe test card: 4242 4242 4242 4242');
    console.log('3. Complete the checkout');
    console.log('4. Run this script again with the subscription ID to verify');
    console.log('');
    console.log('Checkout URL:', session.url);
    console.log('Customer ID:', testCustomer.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // If subscription ID is provided as argument, verify it
    const subscriptionId = process.argv[2];
    if (subscriptionId) {
      console.log('📋 Step 4: Verifying Subscription');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      console.log('Subscription ID:', subscription.id);
      console.log('Status:', subscription.status);
      console.log('Trial End:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'NOT SET ❌');
      console.log('Current Period End:', subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A');
      
      if (subscription.status === 'trialing') {
        console.log('✅ Subscription is in TRIALING status - Trial is working correctly!');
      } else if (subscription.status === 'active') {
        if (subscription.trial_end) {
          const trialEnd = new Date(subscription.trial_end * 1000);
          const now = new Date();
          if (trialEnd > now) {
            console.log('⚠️  WARNING: Subscription is ACTIVE but trial should still be running!');
            console.log('   Trial End:', trialEnd.toISOString());
            console.log('   Current Time:', now.toISOString());
          } else {
            console.log('✅ Subscription is ACTIVE (trial has ended)');
          }
        } else {
          console.log('❌ ERROR: Subscription is ACTIVE but has no trial_end!');
          console.log('   This means the trial was not applied.');
        }
      } else {
        console.log(`⚠️  Subscription status is ${subscription.status}`);
      }
      
      // Check if payment was made
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        limit: 5,
      });
      
      console.log('\n📋 Invoices:');
      invoices.data.forEach((invoice, index) => {
        console.log(`  Invoice ${index + 1}:`);
        console.log(`    Amount: $${(invoice.amount_due / 100).toFixed(2)}`);
        console.log(`    Status: ${invoice.status}`);
        console.log(`    Created: ${new Date(invoice.created * 1000).toISOString()}`);
        if (invoice.amount_due > 0) {
          console.log(`    ⚠️  WARNING: Invoice has amount due during trial!`);
        } else {
          console.log(`    ✅ Invoice is $0 (trial period)`);
        }
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

  } catch (error) {
    console.error('❌ Error testing Premium trial flow:', error);
    process.exit(1);
  }
}

testPremiumTrialFlow();

