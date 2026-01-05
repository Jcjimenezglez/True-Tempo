// Script to set specific users to free status via API endpoint
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');
const path = require('path');

// Read CLERK_SECRET_KEY from .env.local if exists
let CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('CLERK_SECRET_KEY=')) {
        CLERK_SECRET_KEY = line.split('=')[1].trim();
        break;
      }
    }
  }
}

// Try Vercel env file
if (!CLERK_SECRET_KEY) {
  const vercelEnvPath = path.join(__dirname, '..', '.env.vercel.tmp');
  if (fs.existsSync(vercelEnvPath)) {
    const envContent = fs.readFileSync(vercelEnvPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('CLERK_SECRET_KEY=')) {
        CLERK_SECRET_KEY = line.split('=')[1].trim();
        break;
      }
    }
  }
}

async function findUserByEmail(clerk, email) {
  const pageSize = 100;
  let offset = 0;
  let scanned = 0;

  while (true) {
    const { data, totalCount } = await clerk.users.getUserList({
      limit: pageSize,
      offset,
    });

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    scanned += data.length;

    const match = data.find((user) =>
      user.emailAddresses?.some((address) => address.emailAddress === email)
    );

    if (match) {
      console.log(`✅ Found user ${match.id} by email ${email} after scanning ${scanned} users`);
      return match;
    }

    offset += pageSize;

    if (typeof totalCount === 'number' && offset >= totalCount) {
      break;
    }

    if (data.length < pageSize) {
      break;
    }
  }

  console.warn(`⚠️ User not found by email ${email} after scanning ${scanned} users`);
  return null;
}

async function setUserToFree(email) {
  if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not configured');
    console.error('   Please set CLERK_SECRET_KEY in .env.local or as environment variable');
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    
    // Find user by email
    const user = await findUserByEmail(clerk, email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`\n📋 Current user data for ${email}:`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Current isPremium: ${user.publicMetadata?.isPremium || false}`);
    console.log(`   Stripe Customer ID: ${user.publicMetadata?.stripeCustomerId || 'none'}`);

    // Update user to free
    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        isPremium: false,
        premiumSince: null,
        adminUpdated: true,
        adminUpdatedAt: new Date().toISOString(),
        downgradedToFree: true,
        downgradedAt: new Date().toISOString()
      },
    });

    console.log(`\n✅ Successfully set user ${email} (${user.id}) to FREE status`);
    
    // Verify the change
    const updatedUser = await clerk.users.getUser(user.id);
    console.log(`   Updated isPremium: ${updatedUser.publicMetadata?.isPremium || false}`);
    
  } catch (error) {
    console.error(`❌ Error updating user ${email}:`, error.message);
    if (error.errors) {
      console.error('   Details:', error.errors);
    }
  }
}

async function main() {
  const emails = [
    'julio93.314@gmail.com',
    'julio@front10.com'
  ];

  console.log('🚀 Starting to set users to FREE status...\n');

  for (const email of emails) {
    console.log(`\n📧 Processing: ${email}`);
    await setUserToFree(email);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);























