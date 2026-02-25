// API endpoint to sync vibes to Clerk
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const {
  isMetadataLimitError,
  pruneMetadataToBudget,
  sanitizeCassetteArray,
} = require('./lib/clerk-metadata-utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  const clerkUserId = req.headers['x-clerk-userid'];
  if (!clerkUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const { cassettes } = req.body;

    if (!Array.isArray(cassettes)) {
      res.status(400).json({ error: 'Invalid cassettes array' });
      return;
    }

    // Get current user metadata
    const user = await clerk.users.getUser(clerkUserId);
    const currentMeta = user.publicMetadata || {};
    const existingPublicCassettes = sanitizeCassetteArray(currentMeta.publicCassettes || []);

    // Filter only public vibes
    const publicCassettes = sanitizeCassetteArray(
      cassettes.filter((c) => c && c.isPublic === true),
      { maxCount: 200 }
    );

    // De-duplicate by ID while keeping the latest incoming object
    const uniqueIncomingById = new Map();
    for (const cassette of publicCassettes) {
      uniqueIncomingById.set(cassette.id, cassette);
    }
    const uniquePublicCassettes = Array.from(uniqueIncomingById.values());

    // Preserve historical data (views) from existing cassettes.
    // We intentionally do NOT persist viewedBy in Clerk metadata to avoid 8KB overflows.
    const publicCassettesWithHistory = uniquePublicCassettes.map(cassette => {
      // Find existing cassette in Clerk by ID
      const existingCassette = existingPublicCassettes.find((ec) => ec.id === cassette.id);
      
      if (existingCassette) {
        // Preserve historical view counter from Clerk (source of truth for count)
        return {
          ...cassette,
          views: existingCassette.views !== undefined && existingCassette.views !== null 
            ? existingCassette.views 
            : (cassette.views || 0),
        };
      }
      
      // New cassette - use provided values or defaults
      return {
        ...cassette,
        views: cassette.views || 0,
      };
    });

    // Update metadata with public vibes (preserving historical data)
    const candidateMeta = {
      ...currentMeta,
      publicCassettes: sanitizeCassetteArray(publicCassettesWithHistory, { maxCount: 200 }),
    };
    const newMeta = pruneMetadataToBudget(candidateMeta);

    try {
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: newMeta,
      });
    } catch (error) {
      if (!isMetadataLimitError(error)) {
        throw error;
      }

      // Last-resort reduced payload to recover users that already exceeded Clerk limits.
      const emergencyMeta = pruneMetadataToBudget(
        {
          ...currentMeta,
          publicCassettes: sanitizeCassetteArray(publicCassettesWithHistory, {
            minimal: true,
            maxCount: 40,
          }),
        },
        6000
      );

      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: emergencyMeta,
      });
    }

    res.status(200).json({
      success: true,
      publicCassettesCount: publicCassettesWithHistory.length,
    });
  } catch (error) {
    console.error('Error syncing cassettes:', error);
    res.status(500).json({ error: 'Failed to sync vibes', details: error.message });
  }
};

