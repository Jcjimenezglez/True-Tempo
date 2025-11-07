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

async function updatePremiumProduct() {
  try {
    console.log('🚀 Updating Superfocus Premium product description...\n');

    // Get the price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SQr4sIMJUHQfsp7sx96CCxe';
    
    // Retrieve the price to get the product ID
    const price = await stripe.prices.retrieve(priceId);
    const productId = price.product;

    console.log('📦 Product ID:', productId);
    console.log('💰 Price ID:', priceId);
    console.log('');

    // Update the product description
    const updatedProduct = await stripe.products.update(productId, {
      description: '3 months free trial. Pay $0 today, then $3.99/month after trial ends. Cancel anytime.',
    });

    console.log('✅ Product updated successfully!');
    console.log('   Product Name:', updatedProduct.name);
    console.log('   Description:', updatedProduct.description);
    console.log('');

  } catch (error) {
    console.error('❌ Error updating product:', error);
    process.exit(1);
  }
}

updatePremiumProduct();

