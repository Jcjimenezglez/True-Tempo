// Helper function to check if user is Pro
// This is imported by other API endpoints to verify Pro status
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function checkProStatus(req) {
  // Developer Mode: Check for devMode=pro parameter to bypass Clerk verification
  // This allows testing integrations without admin panel
  try {
    let devMode = '';
    console.log('🔍 Checking Pro status - URL:', req.url);
    console.log('🔍 Checking Pro status - Query:', req.query);
    
    if (req.url) {
      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      devMode = url.searchParams.get('devMode') || '';
      console.log('🔍 devMode from URL:', devMode);
    }
    if (!devMode && req.query && req.query.devMode) {
      devMode = req.query.devMode;
      console.log('🔍 devMode from query object:', devMode);
    }
    
    if (devMode === 'pro') {
      console.log('✅ Developer Mode: Pro access granted (bypass Clerk verification)');
      return { 
        isPro: true, 
        userId: 'dev-mode-user',
        email: 'developer@mode.local',
        devMode: true
      };
    } else {
      console.log('❌ devMode not set to "pro", checking Clerk...');
    }
  } catch (e) {
    console.log('❌ Error checking devMode:', e);
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecret) {
    return { isPro: false, error: 'Clerk not configured' };
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Try to get user ID from multiple sources
    let clerkUserId = '';
    
    // 1. From header (used by some endpoints)
    clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
    
    // 2. From query parameter (used by OAuth redirects)
    if (!clerkUserId && req.url) {
      const url = new URL(req.url, `https://${req.headers.host}`);
      clerkUserId = url.searchParams.get('uid') || '';
    }
    
    // 3. From query object (Vercel serverless format)
    if (!clerkUserId && req.query && req.query.uid) {
      clerkUserId = req.query.uid;
    }
    
    if (!clerkUserId) {
      console.log('No Clerk user ID found');
      return { isPro: false, error: 'Not authenticated' };
    }
    
    const user = await clerk.users.getUser(clerkUserId);
    const isPremium = user?.publicMetadata?.isPremium === true;
    
    console.log(`Pro status check for ${user.emailAddresses?.[0]?.emailAddress}: ${isPremium ? 'PRO' : 'FREE'}`);
    
    return { 
      isPro: isPremium, 
      userId: clerkUserId,
      email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
    };
  } catch (e) {
    console.error('Error checking Pro status:', e);
    return { isPro: false, error: 'Failed to verify status' };
  }
}

module.exports = { checkProStatus };

