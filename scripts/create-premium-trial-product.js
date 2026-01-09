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
  console.log('\n💡 Opciones:');
  console.log('   1. Exporta la variable: export STRIPE_SECRET_KEY=sk_live_...');
  console.log('   2. O agrega STRIPE_SECRET_KEY al archivo .env.local');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY inválida (debe empezar con sk_live_ o sk_test_)');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

async function createPremiumTrialProduct() {
  try {
    console.log('🚀 Creating Superfocus Premium product with 1-month trial...\n');

    // Create product
    const product = await stripe.products.create({
      name: 'Superfocus Premium',
      description: '1 month free trial. Pay $0 today, then $3.99/month after trial ends. Cancel anytime.',
    });

    console.log('✅ Product created:', product.id);
    console.log('   Product Name:', product.name);
    console.log('');

    // Create Monthly Price with 1-month trial
    // After trial, charge $3.99/month
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 399, // $3.99
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 30, // 1 month = 30 days
      },
    });

    console.log('✅ Premium Monthly price created:', monthlyPrice.id);
    console.log('   Price: $3.99/month');
    console.log('   Trial: 30 days (1 month)');
    console.log('   Add to Vercel: STRIPE_PRICE_ID_PREMIUM=' + monthlyPrice.id);
    console.log('');

    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Product ID:', product.id);
    console.log('Premium Price ID:', monthlyPrice.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Environment Variable for Vercel:');
    console.log('STRIPE_PRICE_ID_PREMIUM=' + monthlyPrice.id);
    console.log('');
    console.log('⚠️  Important: Stripe will automatically notify users 7 days before trial ends');
    console.log('   Make sure your webhook handles subscription.trial_will_end event');

  } catch (error) {
    console.error('❌ Error creating product:', error);
    process.exit(1);
  }
}

createPremiumTrialProduct();

