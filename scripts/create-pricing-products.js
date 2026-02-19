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
      // Try different formats: STRIPE_SECRET_KEY=value or STRIPE_SECRET_KEY="value"
      const match = vercelContent.match(/STRIPE_SECRET_KEY=["']?([^"'\n]+)["']?/);
      if (match) {
        STRIPE_SECRET_KEY = match[1].trim();
        console.log('✅ STRIPE_SECRET_KEY encontrada en .env.vercel.tmp');
        // Don't delete the file yet, might be useful
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
  console.log('   3. O proporciona la key aquí para ejecutar el script');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY inválida (debe empezar con sk_live_ o sk_test_)');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-18.acacia' });

async function createProducts() {
  try {
    console.log('🚀 Creating Superfocus Unlimited products...\n');

    // Create product
    const product = await stripe.products.create({
      name: 'Superfocus Unlimited',
      description: 'Unlimited access to all Superfocus features',
    });

    console.log('✅ Product created:', product.id);
    console.log('   Product Name:', product.name);
    console.log('');

    // Create Monthly Price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 199, // $1.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Monthly price created:', monthlyPrice.id);
    console.log('   Price: $1.99/month');
    console.log('   Add to Vercel: STRIPE_PRICE_ID_MONTHLY=' + monthlyPrice.id);
    console.log('');

    // Create Yearly Price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 1200, // $12.00
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
    });

    console.log('✅ Yearly price created:', yearlyPrice.id);
    console.log('   Price: $12.00/year');
    console.log('   Add to Vercel: STRIPE_PRICE_ID_YEARLY=' + yearlyPrice.id);
    console.log('');

    // Create Lifetime Price
    const lifetimePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 4800, // $48.00
      currency: 'usd',
    });

    console.log('✅ Lifetime price created:', lifetimePrice.id);
    console.log('   Price: $48.00 (one-time)');
    console.log('   Add to Vercel: STRIPE_PRICE_ID_LIFETIME=' + lifetimePrice.id);
    console.log('');

    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Product ID:', product.id);
    console.log('Monthly Price ID:', monthlyPrice.id);
    console.log('Yearly Price ID:', yearlyPrice.id);
    console.log('Lifetime Price ID:', lifetimePrice.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Environment Variables for Vercel:');
    console.log('STRIPE_PRICE_ID_MONTHLY=' + monthlyPrice.id);
    console.log('STRIPE_PRICE_ID_YEARLY=' + yearlyPrice.id);
    console.log('STRIPE_PRICE_ID_LIFETIME=' + lifetimePrice.id);

  } catch (error) {
    console.error('❌ Error creating products:', error);
    process.exit(1);
  }
}

createProducts();

