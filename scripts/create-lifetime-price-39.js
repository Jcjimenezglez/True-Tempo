#!/usr/bin/env node

/**
 * Script para crear el Price de Lifetime Deal a $39 en Stripe
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/create-lifetime-price-39.js
 *
 * O exportar primero:
 *   export STRIPE_SECRET_KEY=sk_live_...
 *   node scripts/create-lifetime-price-39.js
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

async function createLifetimePrice39() {
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

  if (!STRIPE_SECRET_KEY.startsWith('sk_') && !STRIPE_SECRET_KEY.startsWith('rk_')) {
    console.error('❌ Error: STRIPE_SECRET_KEY inválida (debe empezar con sk_live_, sk_test_ o rk_live_)');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

  try {
    console.log('🚀 Creando Price Lifetime $39 en Stripe...\n');

    // 1. Obtener el Product existente de Lifetime Deal o crear uno nuevo
    console.log('📦 Buscando Product "Superfocus Pro - Lifetime Deal"...');
    const products = await stripe.products.list({
      query: 'Superfocus Pro - Lifetime Deal',
      limit: 1,
    });

    let product;
    if (products.data.length > 0) {
      product = products.data[0];
      console.log(`✅ Product encontrado: ${product.id}`);
    } else {
      console.log('📦 Creando nuevo Product: "Superfocus Pro - Lifetime Deal"...');
      product = await stripe.products.create({
        name: 'Superfocus Pro - Lifetime Deal',
        description: 'Lifetime access to Superfocus Pro features. One-time payment, no subscription required.',
        metadata: {
          type: 'lifetime_deal',
          created_by: 'create-lifetime-price-39-script',
        },
      });
      console.log(`✅ Product creado: ${product.id}`);
    }

    console.log(`   Name: ${product.name}\n`);

    // 2. Crear el Price (one-time, $39 USD)
    console.log('💰 Creando Price: $39.00 USD (one-time)...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 3900, // $39.00 en centavos
      currency: 'usd',
      metadata: {
        type: 'lifetime_deal',
        version: '2.0',
        description: 'Lifetime access - $39 one-time payment',
      },
    });

    console.log(`✅ Price creado: ${price.id}`);
    console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
    console.log(`   Type: ${price.type}\n`);

    // 3. Mostrar resultados
    console.log('='.repeat(60));
    console.log('✅ ¡LIFETIME PRICE $39 CREADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log(`\n📋 Información importante:`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Price ID:   ${price.id}`);
    console.log(`\n🔧 Siguiente paso:`);
    console.log(`   Actualiza la variable de entorno en Vercel:`);
    console.log(`   STRIPE_PRICE_ID_LIFETIME=${price.id}`);
    console.log(`\n🌐 Vercel Dashboard:`);
    console.log(`   https://vercel.com/jcjimenezglez/true-tempo/settings/environment-variables`);
    console.log(`\n📝 También puedes agregarlo a .env.local para desarrollo:`);
    console.log(`   STRIPE_PRICE_ID_LIFETIME=${price.id}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error al crear Price:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 Verifica que tu STRIPE_SECRET_KEY sea correcta');
    }
    process.exit(1);
  }
}

// Ejecutar
createLifetimePrice39();
