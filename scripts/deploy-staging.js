#!/usr/bin/env node

/**
 * Deploy to Vercel Staging
 * Deploys the develop branch to a staging environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to Vercel Staging...\n');

try {
    // Check if we're on develop branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    if (currentBranch !== 'develop') {
        console.log('⚠️  Switching to develop branch...');
        execSync('git checkout develop', { stdio: 'inherit' });
    }
    
    // Pull latest changes
    console.log('📥 Pulling latest changes...');
    execSync('git pull origin develop', { stdio: 'inherit' });
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('\n✅ Staging deployment complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Vercel Dashboard');
    console.log('2. Find your staging project');
    console.log('3. Configure environment variables:');
    console.log('   • STRIPE_SECRET_KEY=sk_test_...');
    console.log('   • STRIPE_PRICE_ID=price_...');
    console.log('   • CLERK_PUBLISHABLE_KEY=pk_test_...');
    console.log('   • CLERK_SECRET_KEY=sk_test_...');
    console.log('4. Set up webhook: https://your-staging-url.vercel.app/api/stripe-webhook');
    console.log('5. Test with Stripe test cards');
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}
