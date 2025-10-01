#!/usr/bin/env node

/**
 * Script to setup Stripe testing environment
 * This helps configure test mode for safe payment testing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Setting up Stripe Testing Environment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
}

console.log('📋 Testing Setup Instructions:');
console.log('================================\n');

console.log('1. 🔑 Get your Stripe Test Keys:');
console.log('   - Go to: https://dashboard.stripe.com/test/apikeys');
console.log('   - Copy your "Publishable key" (starts with pk_test_)');
console.log('   - Copy your "Secret key" (starts with sk_test_)\n');

console.log('2. 💰 Get your Test Price ID:');
console.log('   - Go to: https://dashboard.stripe.com/test/products');
console.log('   - Find your Pro subscription product');
console.log('   - Copy the Price ID (starts with price_)\n');

console.log('3. 🔗 Setup Test Webhook:');
console.log('   - Go to: https://dashboard.stripe.com/test/webhooks');
console.log('   - Click "Add endpoint"');
console.log('   - URL: https://your-test-domain.vercel.app/api/stripe-webhook');
console.log('   - Events: checkout.session.completed, customer.subscription.*\n');

console.log('4. 🌐 Deploy to Vercel Preview:');
console.log('   - Push this branch: git push origin testing-stripe-payments');
console.log('   - Vercel will create a preview URL');
console.log('   - Update webhook URL with the preview URL\n');

console.log('5. 🧪 Test with these cards:');
console.log('   - Success: 4242 4242 4242 4242');
console.log('   - Decline: 4000 0000 0000 0002');
console.log('   - 3D Secure: 4000 0025 0000 3155');
console.log('   - Any future date, any CVC\n');

console.log('6. 📝 Environment Variables for Vercel:');
console.log('   STRIPE_SECRET_KEY=sk_test_...');
console.log('   STRIPE_PRICE_ID=price_...');
console.log('   STRIPE_WEBHOOK_SECRET=whsec_...');
console.log('   CLERK_SECRET_KEY=sk_test_...\n');

console.log('✅ Ready to test safely! 🎯\n');

// Create a simple test page
const testPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Superfocus - Testing Mode</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .success { background: #d1fae5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .test-cards { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🧪 Superfocus Testing Environment</h1>
    
    <div class="warning">
        <h3>⚠️ Testing Mode Active</h3>
        <p>This is a testing environment. No real payments will be processed.</p>
    </div>
    
    <div class="success">
        <h3>✅ Safe Testing Cards</h3>
        <div class="test-cards">
            <p><strong>Success:</strong> <code>4242 4242 4242 4242</code></p>
            <p><strong>Decline:</strong> <code>4000 0000 0000 0002</code></p>
            <p><strong>3D Secure:</strong> <code>4000 0025 0000 3155</code></p>
            <p><em>Use any future date and any CVC</em></p>
        </div>
    </div>
    
    <h2>🔧 Testing Checklist</h2>
    <ul>
        <li>✅ Test successful payment flow</li>
        <li>✅ Test declined payment</li>
        <li>✅ Test 3D Secure authentication</li>
        <li>✅ Verify Pro status is granted</li>
        <li>✅ Test Customer Portal access</li>
        <li>✅ Verify webhook processing</li>
    </ul>
    
    <p><a href="/">← Back to Main App</a></p>
</body>
</html>`;

fs.writeFileSync('testing.html', testPage);
console.log('📄 Created testing.html page for easy access\n');

console.log('🚀 Next steps:');
console.log('1. git add . && git commit -m "Add testing environment setup"');
console.log('2. git push origin testing-stripe-payments');
console.log('3. Configure Vercel environment variables');
console.log('4. Test with the preview URL! 🎯\n');
