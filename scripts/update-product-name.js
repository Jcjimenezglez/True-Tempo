#!/usr/bin/env node

/**
 * Script para actualizar el nombre del producto en Stripe de "Pro" a "Unlimited"
 * 
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/update-product-name.js
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

async function updateProductName() {
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

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    console.log('🔍 Buscando productos en Stripe...\n');

    // Buscar el producto "Superfocus Pro - Lifetime Deal"
    const products = await stripe.products.list({ limit: 100 });
    const product = products.data.find(p => 
      p.name.includes('Superfocus') && p.name.includes('Lifetime Deal')
    );

    if (!product) {
      console.error('❌ No se encontró el producto "Superfocus Pro - Lifetime Deal"');
      console.log('\n💡 Productos encontrados:');
      products.data.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      process.exit(1);
    }

    console.log(`✅ Producto encontrado: ${product.name} (${product.id})\n`);

    // Actualizar el nombre del producto
    console.log('📝 Actualizando nombre del producto...');
    const updatedProduct = await stripe.products.update(product.id, {
      name: 'Superfocus Unlimited - Lifetime Deal',
      description: 'Lifetime access to Superfocus Unlimited features. One-time payment, no subscription required.',
    });

    console.log(`✅ Producto actualizado exitosamente!`);
    console.log(`\n📋 Nuevo nombre: ${updatedProduct.name}`);
    console.log(`   Product ID: ${updatedProduct.id}`);
    console.log(`   Description: ${updatedProduct.description}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error al actualizar producto:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n💡 Verifica que tu STRIPE_SECRET_KEY sea correcta');
    }
    process.exit(1);
  }
}

// Ejecutar
updateProductName();

