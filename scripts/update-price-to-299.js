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
    execSync('vercel env pull .env.vercel.tmp --environment=production 2>/dev/null || true', { encoding: 'utf8', stdio: 'pipe' });
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

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' });

// Current price ID (from your Vercel environment)
const CURRENT_PRICE_ID = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';

async function updatePriceTo299() {
  try {
    console.log('🚀 Updating Superfocus Premium price from $3.99 to $2.99...\n');

    // Get the current price to find the product ID
    console.log('📦 Fetching current price details...');
    const currentPrice = await stripe.prices.retrieve(CURRENT_PRICE_ID);
    
    console.log('   Current Price ID:', currentPrice.id);
    console.log('   Current Amount:', '$' + (currentPrice.unit_amount / 100).toFixed(2));
    console.log('   Product ID:', currentPrice.product);
    console.log('');

    // Create new price at $2.99 with same product
    console.log('💰 Creating new price at $2.99/month...');
    const newPrice = await stripe.prices.create({
      product: currentPrice.product,
      unit_amount: 299, // $2.99
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 30, // Keep 1 month trial
      },
    });

    console.log('✅ New price created:', newPrice.id);
    console.log('   Price: $2.99/month');
    console.log('   Trial: 30 days (1 month)');
    console.log('');

    // Archive old price (optional - keeps it from being used but doesn't delete)
    console.log('📦 Archiving old price...');
    await stripe.prices.update(CURRENT_PRICE_ID, { active: false });
    console.log('✅ Old price archived');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! New price created.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('');
    console.log('1️⃣  Update Vercel environment variable:');
    console.log('    Run these commands:');
    console.log('');
    console.log(`    vercel env rm STRIPE_PRICE_ID_PREMIUM production --yes`);
    console.log(`    echo "${newPrice.id}" | vercel env add STRIPE_PRICE_ID_PREMIUM production`);
    console.log('');
    console.log('2️⃣  Or update manually in Vercel Dashboard:');
    console.log('    https://vercel.com/your-project/settings/environment-variables');
    console.log('');
    console.log('    STRIPE_PRICE_ID_PREMIUM=' + newPrice.id);
    console.log('');
    console.log('3️⃣  Redeploy to apply changes:');
    console.log('    vercel --prod');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('NEW PRICE ID:', newPrice.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePriceTo299();
