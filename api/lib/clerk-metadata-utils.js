const CLERK_METADATA_MAX_BYTES = 8192;
const CLERK_METADATA_SAFE_BUDGET_BYTES = 7600;

function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch (_) {
    return {};
  }
}

function getMetadataSizeBytes(metadata) {
  try {
    return Buffer.byteLength(JSON.stringify(metadata || {}), 'utf8');
  } catch (_) {
    return Number.MAX_SAFE_INTEGER;
  }
}

function isMetadataLimitError(error) {
  if (!error) return false;

  if (error.status === 422 && Array.isArray(error.errors)) {
    const hasSizeError = error.errors.some(
      (entry) => entry && entry.code === 'form_param_exceeds_allowed_size'
    );
    if (hasSizeError) return true;
  }

  const message = `${error.message || ''} ${error.longMessage || ''}`.toLowerCase();
  return message.includes('public_metadata exceeds the maximum allowed size');
}

function normalizeViews(views) {
  const parsed = Number(views);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function trimDailyMap(input, maxEntries) {
  if (!input || typeof input !== 'object') return {};
  const entries = Object.entries(input);
  if (entries.length <= maxEntries) return input;

  return Object.fromEntries(
    entries.sort((a, b) => String(b[0]).localeCompare(String(a[0]))).slice(0, maxEntries)
  );
}

function sanitizeCassette(cassette, minimal = false) {
  if (!cassette || typeof cassette !== 'object') return null;

  const { viewedBy: _viewedBy, ...rest } = cassette;

  if (minimal) {
    return {
      id: rest.id,
      title: rest.title || '',
      description: rest.description || '',
      imageUrl: rest.imageUrl || '',
      isPublic: rest.isPublic === true,
      views: normalizeViews(rest.views),
      createdAt: rest.createdAt || null,
      updatedAt: rest.updatedAt || null,
    };
  }

  return {
    ...rest,
    views: normalizeViews(rest.views),
  };
}

function sanitizeCassetteArray(cassettes, options = {}) {
  const { minimal = false, maxCount = 200 } = options;
  if (!Array.isArray(cassettes)) return [];

  const sanitized = cassettes
    .map((cassette) => sanitizeCassette(cassette, minimal))
    .filter((cassette) => cassette && cassette.id);

  if (sanitized.length <= maxCount) return sanitized;
  return sanitized.slice(sanitized.length - maxCount);
}

function pickDefined(source, keys) {
  const result = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      result[key] = source[key];
    }
  });
  return result;
}

function pruneMetadataToBudget(metadata, budgetBytes = CLERK_METADATA_SAFE_BUDGET_BYTES) {
  const next = deepClone(metadata);
  const fits = () => getMetadataSizeBytes(next) <= budgetBytes;

  if (Array.isArray(next.publicCassettes)) {
    next.publicCassettes = sanitizeCassetteArray(next.publicCassettes);
  }
  if (Array.isArray(next.privateCassettes)) {
    next.privateCassettes = sanitizeCassetteArray(next.privateCassettes, { maxCount: 50 });
  }

  if (fits()) return next;

  if (next.focusStatsBackup && typeof next.focusStatsBackup === 'object') {
    next.focusStatsBackup.daily = trimDailyMap(next.focusStatsBackup.daily, 45);
    next.focusStatsBackup.dailySessions = trimDailyMap(next.focusStatsBackup.dailySessions, 30);
    next.focusStatsBackup.dailyBreaks = trimDailyMap(next.focusStatsBackup.dailyBreaks, 30);
  }
  if (fits()) return next;

  if (next.focusStatsBackup && typeof next.focusStatsBackup === 'object') {
    next.focusStatsBackup = {
      totalHours: next.focusStatsBackup.totalHours || next.totalFocusHours || 0,
      completedCycles: next.focusStatsBackup.completedCycles || 0,
      lastBackup: next.focusStatsBackup.lastBackup || new Date().toISOString(),
    };
  }
  if (fits()) return next;

  if (Array.isArray(next.privateCassettes)) {
    next.privateCassettes = sanitizeCassetteArray(next.privateCassettes, {
      minimal: true,
      maxCount: 12,
    });
  }
  if (fits()) return next;

  if (Array.isArray(next.customTechniques)) {
    next.customTechniques = next.customTechniques.slice(-25);
  }
  if (fits()) return next;

  delete next.streakData;
  if (fits()) return next;

  if (Array.isArray(next.publicCassettes)) {
    next.publicCassettes = sanitizeCassetteArray(next.publicCassettes, {
      minimal: true,
      maxCount: 40,
    });
  }
  if (fits()) return next;

  const critical = pickDefined(next, [
    'stripeCustomerId',
    'isPremium',
    'premiumSince',
    'paymentType',
    'isLifetime',
    'isTrial',
    'lastUpdated',
    'confirmedByCheckout',
    'confirmedSessionId',
    'totalFocusHours',
    'statsLastUpdated',
  ]);

  if (getMetadataSizeBytes(critical) <= CLERK_METADATA_MAX_BYTES) {
    return critical;
  }

  return {
    totalFocusHours: next.totalFocusHours || 0,
    statsLastUpdated: next.statsLastUpdated || new Date().toISOString(),
    isPremium: next.isPremium === true,
    paymentType: next.paymentType || undefined,
  };
}

module.exports = {
  CLERK_METADATA_MAX_BYTES,
  CLERK_METADATA_SAFE_BUDGET_BYTES,
  getMetadataSizeBytes,
  isMetadataLimitError,
  pruneMetadataToBudget,
  sanitizeCassette,
  sanitizeCassetteArray,
};

