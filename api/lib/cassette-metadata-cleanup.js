const {
  getMetadataSizeBytes,
  isMetadataLimitError,
  pruneMetadataToBudget,
  sanitizeCassetteArray,
} = require('./clerk-metadata-utils');

function getUsersPageData(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getUsersPageTotalCount(response) {
  return typeof response?.totalCount === 'number' ? response.totalCount : null;
}

function stripViewedByFromCassetteArray(cassettes) {
  if (!Array.isArray(cassettes)) {
    return { cleaned: [], removedEntries: 0 };
  }

  let removedEntries = 0;
  const cleaned = cassettes.map((cassette) => {
    if (!cassette || typeof cassette !== 'object') return cassette;

    const { viewedBy, ...rest } = cassette;
    if (Array.isArray(viewedBy)) {
      removedEntries += viewedBy.length;
    } else if (viewedBy !== undefined) {
      removedEntries += 1;
    }
    return rest;
  });

  return { cleaned, removedEntries };
}

function buildCleanMetadata(publicMetadata) {
  const source = publicMetadata && typeof publicMetadata === 'object' ? publicMetadata : {};
  const beforeBytes = getMetadataSizeBytes(source);

  const publicResult = stripViewedByFromCassetteArray(source.publicCassettes);
  const privateResult = stripViewedByFromCassetteArray(source.privateCassettes);

  const candidate = {
    ...source,
    publicCassettes: sanitizeCassetteArray(publicResult.cleaned, { maxCount: 200 }),
    privateCassettes: sanitizeCassetteArray(privateResult.cleaned, { maxCount: 50 }),
  };

  const cleanedMetadata = pruneMetadataToBudget(candidate);
  const afterBytes = getMetadataSizeBytes(cleanedMetadata);
  const removedViewedByEntries = publicResult.removedEntries + privateResult.removedEntries;
  const changed = JSON.stringify(cleanedMetadata) !== JSON.stringify(source);

  return {
    changed,
    cleanedMetadata,
    beforeBytes,
    afterBytes,
    bytesSaved: Math.max(0, beforeBytes - afterBytes),
    removedViewedByEntries,
  };
}

async function updateUserMetadataWithFallback(clerk, userId, cleanedMetadata) {
  try {
    await clerk.users.updateUser(userId, { publicMetadata: cleanedMetadata });
    return;
  } catch (error) {
    if (!isMetadataLimitError(error)) {
      throw error;
    }

    const emergencyMetadata = pruneMetadataToBudget(cleanedMetadata, 5000);
    await clerk.users.updateUser(userId, { publicMetadata: emergencyMetadata });
  }
}

async function runCassetteMetadataCleanup({
  clerk,
  dryRun = true,
  maxUsers = Number.POSITIVE_INFINITY,
  startOffset = 0,
}) {
  const summary = {
    dryRun,
    scannedUsers: 0,
    updatedUsers: 0,
    unchangedUsers: 0,
    usersWithCassetteMetadata: 0,
    removedViewedByEntries: 0,
    bytesSaved: 0,
    errors: [],
    nextOffset: startOffset,
    hasMore: false,
  };

  let offset = Number(startOffset) || 0;
  const pageSize = 100;
  const targetCount = Number.isFinite(maxUsers) ? Math.max(1, Number(maxUsers)) : Number.POSITIVE_INFINITY;

  while (summary.scannedUsers < targetCount) {
    const remaining = targetCount - summary.scannedUsers;
    const limit = Number.isFinite(remaining) ? Math.min(pageSize, remaining) : pageSize;

    const response = await clerk.users.getUserList({
      limit,
      offset,
    });
    const users = getUsersPageData(response);
    const totalCount = getUsersPageTotalCount(response);

    if (!users.length) {
      summary.hasMore = false;
      break;
    }

    for (const user of users) {
      summary.scannedUsers += 1;

      const publicMetadata = user.publicMetadata || {};
      const hasCassetteMetadata =
        Array.isArray(publicMetadata.publicCassettes) || Array.isArray(publicMetadata.privateCassettes);

      if (hasCassetteMetadata) {
        summary.usersWithCassetteMetadata += 1;
      }

      try {
        const cleanup = buildCleanMetadata(publicMetadata);
        summary.removedViewedByEntries += cleanup.removedViewedByEntries;
        summary.bytesSaved += cleanup.bytesSaved;

        if (!cleanup.changed) {
          summary.unchangedUsers += 1;
          continue;
        }

        if (!dryRun) {
          await updateUserMetadataWithFallback(clerk, user.id, cleanup.cleanedMetadata);
        }
        summary.updatedUsers += 1;
      } catch (error) {
        summary.errors.push({
          userId: user.id,
          message: error.message,
        });
      }
    }

    offset += users.length;
    summary.nextOffset = offset;

    const reachedTotalCount = typeof totalCount === 'number' && offset >= totalCount;
    const pageShort = users.length < limit;
    if (reachedTotalCount || pageShort) {
      summary.hasMore = false;
      break;
    }

    if (summary.scannedUsers >= targetCount) {
      summary.hasMore = true;
      break;
    }
  }

  return summary;
}

module.exports = {
  buildCleanMetadata,
  runCassetteMetadataCleanup,
};

