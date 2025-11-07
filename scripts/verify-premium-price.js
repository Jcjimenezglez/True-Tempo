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

if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY inválida');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

async function verifyPremiumPrice() {
  try {
    console.log('🔍 Verifying Premium price configuration...\n');

    // Get the price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    
    console.log('💰 Price ID:', priceId);
    console.log('');

    // Retrieve the price
    const price = await stripe.prices.retrieve(priceId);

    console.log('📋 Price Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Price ID:', price.id);
    console.log('Amount:', `$${(price.unit_amount / 100).toFixed(2)}`);
    console.log('Currency:', price.currency);
    console.log('Type:', price.type);
    
    if (price.recurring) {
      console.log('Recurring Interval:', price.recurring.interval);
      console.log('Trial Period Days:', price.recurring.trial_period_days || 'NOT SET ❌');
      
      if (!price.recurring.trial_period_days) {
        console.log('\n⚠️  WARNING: Trial period is NOT configured on this price!');
        console.log('   This is why users are being charged immediately.');
        console.log('   You need to create a new price with trial_period_days: 90');
      } else {
        console.log('✅ Trial period is configured correctly');
      }
    } else {
      console.log('❌ This is not a recurring price!');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error verifying price:', error);
    process.exit(1);
  }
}

verifyPremiumPrice();

