#!/usr/bin/env node

/**
 * Script para crear el Product y Price de Lifetime Deal en Stripe
 * 
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/create-lifetime-price.js
 * 
 * O exportar primero:
 *   export STRIPE_SECRET_KEY=sk_live_...
 *   node scripts/create-lifetime-price.js
 */

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

async function createLifetimeProductAndPrice() {
  // Intentar obtener desde Vercel CLI si está disponible
  if (!STRIPE_SECRET_KEY) {
    try {
      const { execSync } = require('child_process');
      console.log('🔍 Intentando obtener STRIPE_SECRET_KEY desde Vercel...');
      const vercelEnv = execSync('vercel env pull .env.vercel.tmp 2>/dev/null || true', { encoding: 'utf8', stdio: 'pipe' });
      if (fs.existsSync(path.join(__dirname, '..', '.env.vercel.tmp'))) {
        const vercelContent = fs.readFileSync(path.join(__dirname, '..', '.env.vercel.tmp'), 'utf8');
        const match = vercelContent.match(/STRIPE_SECRET_KEY=(.+)/);
        if (match) {
          STRIPE_SECRET_KEY = match[1].trim();
          fs.unlinkSync(path.join(__dirname, '..', '.env.vercel.tmp'));
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

  try {
    console.log('🚀 Creando Product y Price en Stripe...\n');

    // 1. Crear el Product
    console.log('📦 Creando Product: "Superfocus - Lifetime"...');
    const product = await stripe.products.create({
      name: 'Superfocus - Lifetime',
      description: 'Lifetime access to Superfocus Premium features. One-time payment, forever access.',
      metadata: {
        type: 'lifetime_deal',
        created_by: 'create-lifetime-price-script',
      },
    });

    console.log(`✅ Product creado: ${product.id}`);
    console.log(`   Name: ${product.name}\n`);

    // 2. Crear el Price (one-time, $24.00 USD)
    console.log('💰 Creando Price: $24.00 USD (one-time)...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2400, // $24.00 en centavos
      currency: 'usd',
      metadata: {
        type: 'lifetime_deal',
        price: '24.00',
      },
    });

    console.log(`✅ Price creado: ${price.id}`);
    console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
    console.log(`   Type: ${price.type}\n`);

    // 3. Mostrar resultados
    console.log('='.repeat(60));
    console.log('✅ ¡LIFETIME DEAL CREADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log(`\n📋 Información importante:`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Price ID:   ${price.id}`);
    console.log(`\n🔧 Siguiente paso:`);
    console.log(`   Actualiza la variable de entorno STRIPE_PRICE_ID en Vercel:`);
    console.log(`   STRIPE_PRICE_ID=${price.id}`);
    console.log(`\n🌐 Vercel Dashboard:`);
    console.log(`   https://vercel.com/[tu-proyecto]/settings/environment-variables`);
    console.log(`\n📝 También puedes agregarlo a .env.local para desarrollo:`);
    console.log(`   STRIPE_PRICE_ID=${price.id}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error al crear Product/Price:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 Verifica que tu STRIPE_SECRET_KEY sea correcta');
    }
    process.exit(1);
  }
}

// Ejecutar
createLifetimeProductAndPrice();

