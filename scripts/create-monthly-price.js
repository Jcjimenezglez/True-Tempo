#!/usr/bin/env node

/**
 * Script para crear el Product y Price de Monthly sin trial en Stripe
 * 
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/create-monthly-price.js
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

async function createMonthlyProductAndPrice() {
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

  try {
    console.log('🚀 Creando Product y Price en Stripe...\n');

    // 1. Crear el Product
    console.log('📦 Creando Product: "Superfocus Premium - Monthly"...');
    const product = await stripe.products.create({
      name: 'Superfocus Premium - Monthly',
      description: 'Monthly subscription to Superfocus Premium features. Unlimited timers, tasks, and focus time.',
      metadata: {
        type: 'monthly_subscription',
        created_by: 'create-monthly-price-script',
      },
    });

    console.log(`✅ Product creado: ${product.id}`);
    console.log(`   Name: ${product.name}\n`);

    // 2. Crear el Price (recurring monthly, $3.99 USD, sin trial)
    console.log('💰 Creando Price: $3.99 USD/month (sin trial)...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 399, // $3.99 en centavos
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'monthly_no_trial',
        price: '3.99',
      },
    });

    console.log(`✅ Price creado: ${price.id}`);
    console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
    console.log(`   Type: ${price.type}`);
    console.log(`   Interval: ${price.recurring.interval}\n`);

    // 3. Mostrar resultados
    console.log('='.repeat(60));
    console.log('✅ ¡MONTHLY SUBSCRIPTION CREADA EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log(`\n📋 Información importante:`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Price ID:   ${price.id}`);
    console.log(`\n🔧 Siguiente paso:`);
    console.log(`   Actualiza la variable de entorno en Vercel:`);
    console.log(`   STRIPE_PRICE_ID_MONTHLY=${price.id}`);
    console.log(`\n🌐 Vercel Dashboard:`);
    console.log(`   https://vercel.com/[tu-proyecto]/settings/environment-variables`);
    console.log(`\n📝 También puedes agregarlo a .env.local para desarrollo:`);
    console.log(`   STRIPE_PRICE_ID_MONTHLY=${price.id}`);
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
createMonthlyProductAndPrice();
