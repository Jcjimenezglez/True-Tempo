// API endpoint to check if public cassettes have changed (lightweight)
// Returns only IDs and updatedAt timestamps for comparison
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  const clerkUserId = req.headers['x-clerk-userid'];

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get all users with pagination
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    // Collect only IDs and updatedAt for all public cassettes
    const cassetteChecksums = [];
    const seenIds = new Set(); // To avoid duplicates

    allUsers.forEach(user => {
      const publicCassettes = user.publicMetadata?.publicCassettes || [];
      
      if (Array.isArray(publicCassettes)) {
        publicCassettes.forEach(cassette => {
          // Only include if it's marked as public and we haven't seen this ID before
          if (cassette.isPublic === true && cassette.id && !seenIds.has(cassette.id)) {
            seenIds.add(cassette.id);
            cassetteChecksums.push({
              id: cassette.id,
              updatedAt: cassette.updatedAt || cassette.createdAt || new Date().toISOString()
            });
          }
        });
      }
    });

    // Calculate a hash/checksum from all IDs and timestamps
    const checksumString = cassetteChecksums
      .sort((a, b) => a.id.localeCompare(b.id)) // Sort by ID for consistency
      .map(c => `${c.id}:${c.updatedAt}`)
      .join('|');
    
    // Use crypto for better hash function
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(checksumString).digest('hex');

    res.status(200).json({
      success: true,
      checksum: hash.toString(),
      count: cassetteChecksums.length,
      cassettes: cassetteChecksums // Include IDs and updatedAt for detailed comparison if needed
    });
  } catch (error) {
    console.error('Error checking public cassettes:', error);
    res.status(500).json({ error: 'Failed to check public cassettes', details: error.message });
  }
};

