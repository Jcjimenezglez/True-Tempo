// Helper function to check if user is Pro
// This is imported by other API endpoints to verify Pro status
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function checkProStatus(req) {
  // Developer Mode: Check for devMode=pro parameter to bypass Clerk verification
  // This allows testing integrations without admin panel
  try {
    let devMode = '';
    let devModeBypass = false;
    
    console.log('🔍 Full request URL:', req.url);
    console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Method 1: Parse from req.url (most reliable for Vercel)
    if (req.url) {
      try {
        const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
        devMode = url.searchParams.get('devMode') || '';
        devModeBypass = url.searchParams.get('bypass') === 'true';
        console.log('🔍 devMode from URL parsing:', devMode);
        console.log('🔍 bypass from URL parsing:', devModeBypass);
      } catch (e) {
        console.log('❌ Error parsing URL:', e);
      }
    }
    
    // Method 2: Check req.query (Vercel sometimes populates this)
    if (!devMode && req.query) {
      devMode = req.query.devMode || req.query.devmode || '';
      devModeBypass = req.query.bypass === 'true';
      console.log('🔍 devMode from req.query:', devMode);
    }
    
    const host = String(req.headers.host || '').toLowerCase();
    const isProdHost = host === 'superfocus.live' || host === 'www.superfocus.live';
    const isPreviewOrLocalHost = host.includes('vercel.app') || host.includes('localhost') || host.includes('127.0.0.1');
    const expectedDevSecret = String(process.env.DEV_BYPASS_SECRET || '').trim();
    const providedDevSecret = String(req.headers['x-dev-bypass-secret'] || '').trim();
    const hasValidDevSecret = !!expectedDevSecret && providedDevSecret === expectedDevSecret;

    // Developer bypass mode (temporary for testing), locked to preview/local + shared secret.
    if (devModeBypass || devMode === 'pro') {
      if (!isProdHost && isPreviewOrLocalHost && hasValidDevSecret) {
        console.log('✅ Developer Mode: Pro access GRANTED (preview/local + secret)');
        return {
          isPro: true,
          userId: 'dev-mode-user',
          email: 'developer@mode.local',
          devMode: true
        };
      }
      console.log('❌ Dev bypass rejected: invalid host or missing/invalid x-dev-bypass-secret');
    } else {
      console.log('❌ devMode:', devMode, '- Not bypassing, checking Clerk...');
    }
  } catch (e) {
    console.log('❌ Error in devMode check:', e.message, e.stack);
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

