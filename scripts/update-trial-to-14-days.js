#!/usr/bin/env node

/**
 * Script to update Stripe Premium price from 7-day trial to 14-day trial
 * 
 * This script will:
 * 1. Find the current Premium price with 7-day trial
 * 2. Create a new price with 14-day trial
 * 3. Archive the old price
 * 4. Output the new STRIPE_PRICE_ID_PREMIUM to update in Vercel
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/update-trial-to-14-days.js
 */

const Stripe = require('stripe');

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  STRIPE_SECRET_KEY=sk_live_xxx node scripts/update-trial-to-14-days.js');
    process.exit(1);
  }
  
  const stripe = new Stripe(secretKey);
  
  console.log('🔍 Searching for Premium product...\n');
  
  // Find Premium product
  const products = await stripe.products.list({ limit: 100 });
  const premiumProduct = products.data.find(p => 
    p.name.toLowerCase().includes('premium') || 
    p.name.toLowerCase().includes('superfocus')
  );
  
  if (!premiumProduct) {
    console.error('❌ Could not find Premium product');
    console.log('Available products:', products.data.map(p => p.name));
    process.exit(1);
  }
  
  console.log(`✅ Found product: ${premiumProduct.name} (${premiumProduct.id})\n`);
  
  // Find current price with trial
  const prices = await stripe.prices.list({ 
    product: premiumProduct.id, 
    active: true,
    limit: 100 
  });
  
  const currentPrice = prices.data.find(p => 
    p.recurring && 
    p.recurring.interval === 'month' &&
    p.recurring.trial_period_days >= 1  // Find any price with trial
  );
  
  if (!currentPrice) {
    console.log('📋 Active prices for this product:');
    prices.data.forEach(p => {
      console.log(`  - ${p.id}: ${p.unit_amount / 100} ${p.currency.toUpperCase()} / ${p.recurring?.interval || 'one-time'}, trial: ${p.recurring?.trial_period_days || 0} days`);
    });
    console.error('\n❌ Could not find price with trial period');
    process.exit(1);
  }
  
  console.log(`📋 Current price found:`);
  console.log(`   ID: ${currentPrice.id}`);
  console.log(`   Amount: $${currentPrice.unit_amount / 100} ${currentPrice.currency.toUpperCase()}`);
  console.log(`   Interval: ${currentPrice.recurring.interval}`);
  console.log(`   Trial: ${currentPrice.recurring.trial_period_days} days\n`);
  
  // Create new price with 14-day trial
  console.log('🆕 Creating new price with 14-day trial...\n');
  
  const newPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: currentPrice.unit_amount, // Keep same price ($3.99 = 399 cents)
    currency: currentPrice.currency,
    recurring: {
      interval: 'month',
      trial_period_days: 14,
    },
    metadata: {
      plan_type: 'premium',
      trial_days: '14',
      created_by: 'update-trial-to-14-days.js',
      created_at: new Date().toISOString(),
    },
  });
  
  console.log(`✅ New price created:`);
  console.log(`   ID: ${newPrice.id}`);
  console.log(`   Amount: $${newPrice.unit_amount / 100} ${newPrice.currency.toUpperCase()}`);
  console.log(`   Interval: ${newPrice.recurring.interval}`);
  console.log(`   Trial: ${newPrice.recurring.trial_period_days} days\n`);
  
  // Archive old price
  console.log('📦 Archiving old price...\n');
  
  await stripe.prices.update(currentPrice.id, { active: false });
  
  console.log(`✅ Old price archived: ${currentPrice.id}\n`);
  
  // Output instructions
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🎉 SUCCESS! New 14-day trial price created.');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('');
  console.log('1. Update Vercel Environment Variable:');
  console.log('   Go to: https://vercel.com/your-project/settings/environment-variables');
  console.log('   Update: STRIPE_PRICE_ID_PREMIUM');
  console.log('');
  console.log(`   NEW VALUE: ${newPrice.id}`);
  console.log('');
  console.log('2. The code has already been updated to show 14 days');
  console.log('   Just redeploy your application:');
  console.log('   git add .');
  console.log('   git commit -m "Update trial period from 7 days to 14 days"');
  console.log('   git push origin main');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  IMPORTANT: Copy this Price ID before closing:');
  console.log(`    ${newPrice.id}`);
  console.log('');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
