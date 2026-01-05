// scripts/update-trial-to-1-month.js
// Script para actualizar el trial period de 90 días (3 meses) a 30 días (1 mes) en Stripe

const Stripe = require('stripe');

// Verificar que existan las variables de entorno necesarias
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY no está configurada');
  console.error('   Exporta la variable antes de ejecutar el script:');
  console.error('   export STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function updateTrialPeriod() {
  try {
    console.log('🔍 Buscando productos Premium en Stripe...\n');

    // Buscar el producto Premium
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    const premiumProduct = products.data.find(
      (p) => p.name === 'Superfocus Premium' || p.metadata?.type === 'premium'
    );

    if (!premiumProduct) {
      console.error('❌ No se encontró el producto Premium');
      return;
    }

    console.log('✅ Producto encontrado:', premiumProduct.name);
    console.log('   ID:', premiumProduct.id);

    // Buscar los precios asociados al producto
    const prices = await stripe.prices.list({
      product: premiumProduct.id,
      active: true,
    });

    console.log(`\n📋 Encontrados ${prices.data.length} precio(s) activo(s):\n`);

    for (const price of prices.data) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 Precio ID:', price.id);
      console.log('   Cantidad:', `$${(price.unit_amount / 100).toFixed(2)}`);
      console.log('   Recurrencia:', price.recurring?.interval || 'N/A');
      console.log('   Trial actual:', price.recurring?.trial_period_days || 'Sin trial', 'días');

      if (price.recurring?.trial_period_days === 90) {
        console.log('\n🔧 Actualizando trial de 90 días a 30 días...');
        
        // Nota: No se puede actualizar un precio existente en Stripe
        // Necesitamos crear un nuevo precio con el trial correcto
        console.log('⚠️  IMPORTANTE: Stripe no permite modificar precios existentes.');
        console.log('   Necesitas crear un nuevo precio con trial_period_days: 30');
        console.log('   Y luego actualizar el PRICE_ID en tus variables de entorno.\n');
        
        // Crear nuevo precio con trial de 30 días
        const newPrice = await stripe.prices.create({
          product: premiumProduct.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count || 1,
            trial_period_days: 30, // 1 mes
          },
          metadata: {
            ...price.metadata,
            updated_from: price.id,
            trial_updated_date: new Date().toISOString(),
          },
        });

        console.log('✅ Nuevo precio creado con trial de 30 días:');
        console.log('   Nuevo Price ID:', newPrice.id);
        console.log('   Trial period:', newPrice.recurring.trial_period_days, 'días');
        
        // Archivar el precio anterior
        console.log('\n🗄️  Archivando precio anterior...');
        await stripe.prices.update(price.id, {
          active: false,
        });
        console.log('✅ Precio anterior archivado');

        console.log('\n📝 ACCIÓN REQUERIDA:');
        console.log('   1. Actualiza STRIPE_PRICE_ID en tus variables de entorno:');
        console.log(`      STRIPE_PRICE_ID=${newPrice.id}`);
        console.log('   2. Actualiza en Vercel Dashboard → Settings → Environment Variables');
        console.log('   3. Redeploy tu aplicación para que los cambios tomen efecto\n');

      } else if (price.recurring?.trial_period_days === 30) {
        console.log('✅ Este precio ya tiene trial de 30 días (1 mes)');
      } else {
        console.log('ℹ️  Este precio tiene un trial diferente o no tiene trial');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
updateTrialPeriod();

