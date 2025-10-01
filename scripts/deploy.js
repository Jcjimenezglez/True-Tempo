#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'dev';

console.log(`🚀 Deploying to ${environment} environment...`);

// Copy the appropriate vercel config
const configFile = environment === 'prod' ? 'vercel.json' : 'vercel-dev.json';
const targetFile = 'vercel.json';

try {
  // Copy config file
  fs.copyFileSync(configFile, targetFile);
  console.log(`✅ Copied ${configFile} to ${targetFile}`);

  // Add and commit changes
  execSync('git add .', { stdio: 'inherit' });
  
  const commitMessage = `Deploy to ${environment} environment - ${new Date().toISOString()}`;
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push to appropriate branch
  if (environment === 'prod') {
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Deployed to production (main branch)');
    console.log('🌐 Production URL: https://www.superfocus.live');
  } else {
    execSync('git push origin develop', { stdio: 'inherit' });
    console.log('✅ Deployed to development (develop branch)');
    console.log('🌐 Development URL: https://superfocus-dev.vercel.app');
  }

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
