#!/usr/bin/env node

/**
 * Script to fix public cassettes with invalid images
 * This script moves public cassettes with invalid image URLs to private
 * 
 * Usage:
 *   node scripts/fix-invalid-cassettes.js [production|staging|local]
 * 
 * Or set VERCEL_URL environment variable:
 *   VERCEL_URL=https://your-domain.vercel.app node scripts/fix-invalid-cassettes.js
 */

const https = require('https');
const http = require('http');

const env = process.argv[2] || 'production';

// Determine the base URL
let baseUrl;
if (process.env.VERCEL_URL) {
  baseUrl = `https://${process.env.VERCEL_URL}`;
} else {
  switch (env) {
    case 'production':
      baseUrl = 'https://www.superfocus.live';
      break;
    case 'staging':
      baseUrl = 'https://your-staging-url.vercel.app'; // Update with your staging URL
      break;
    case 'local':
      baseUrl = 'http://localhost:3000';
      break;
    default:
      console.error('Invalid environment. Use: production, staging, or local');
      process.exit(1);
  }
}

const url = `${baseUrl}/api/admin/fix-invalid-image-cassettes`;

console.log(`🚀 Executing cleanup script...`);
console.log(`📍 Target: ${url}`);
console.log('');

const urlObj = new URL(url);
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const client = urlObj.protocol === 'https:' ? https : http;

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log('✅ Cleanup completed successfully!');
        console.log('');
        console.log('📊 Results:');
        console.log(`   Total users: ${result.results.totalUsers}`);
        console.log(`   Users processed: ${result.results.usersProcessed}`);
        console.log(`   Cassettes fixed: ${result.results.cassettesFixed}`);
        console.log(`   Errors: ${result.results.errors.length}`);
        
        if (result.results.errors.length > 0) {
          console.log('');
          console.log('❌ Errors:');
          result.results.errors.forEach(err => {
            console.log(`   - User ${err.userId}: ${err.error}`);
          });
        }
      } catch (e) {
        console.log('✅ Response:', data);
      }
    } else {
      console.error('❌ Error:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

req.end();

