// scripts/enable-resend-tracking.js
// Script to enable open and click tracking for Resend domain
// Run with: node scripts/enable-resend-tracking.js

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function enableTracking() {
  try {
    console.log('🔍 Fetching domains...');
    
    // First, list all domains to find the domain ID
    const { data: domains, error: listError } = await resend.domains.list();
    
    if (listError) {
      console.error('❌ Error listing domains:', listError);
      return;
    }

    console.log('\n📋 Your domains:');
    domains.data.forEach((domain, index) => {
      console.log(`  ${index + 1}. ${domain.name} (ID: ${domain.id})`);
      console.log(`     Status: ${domain.status}`);
      console.log(`     Open Tracking: ${domain.open_tracking ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`     Click Tracking: ${domain.click_tracking ? '✅ Enabled' : '❌ Disabled'}`);
      console.log('');
    });

    // Find the updates.superfocus.live domain
    const targetDomain = domains.data.find(d => 
      d.name === 'updates.superfocus.live' || 
      d.name === 'superfocus.live' ||
      d.name.includes('superfocus')
    );

    if (!targetDomain) {
      console.log('⚠️ Could not find superfocus domain. Please enable tracking manually in Resend Dashboard.');
      console.log('\nTo enable manually:');
      console.log('1. Go to https://resend.com/domains');
      console.log('2. Click on your domain');
      console.log('3. Enable "Open Tracking" and "Click Tracking"');
      return;
    }

    console.log(`\n🎯 Found domain: ${targetDomain.name} (ID: ${targetDomain.id})`);

    // Check if already enabled
    if (targetDomain.open_tracking && targetDomain.click_tracking) {
      console.log('✅ Tracking is already enabled for this domain!');
      return;
    }

    // Enable tracking
    console.log('\n⚙️ Enabling open and click tracking...');
    
    const { data: updated, error: updateError } = await resend.domains.update({
      id: targetDomain.id,
      openTracking: true,
      clickTracking: true
    });

    if (updateError) {
      console.error('❌ Error enabling tracking:', updateError);
      console.log('\n⚠️ You may need to enable tracking manually in Resend Dashboard.');
      return;
    }

    console.log('\n✅ SUCCESS! Tracking enabled:');
    console.log(`   Domain: ${updated.name || targetDomain.name}`);
    console.log(`   Open Tracking: ✅ Enabled`);
    console.log(`   Click Tracking: ✅ Enabled`);
    console.log('\n📧 From now on, all emails sent from this domain will track opens and clicks.');
    console.log('📊 Check Resend Dashboard → Emails to see tracking data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️ If this fails, enable tracking manually:');
    console.log('1. Go to https://resend.com/domains');
    console.log('2. Click on your domain');
    console.log('3. Enable "Open Tracking" and "Click Tracking"');
  }
}

enableTracking();
