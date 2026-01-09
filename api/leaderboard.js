// API endpoint to get leaderboard of Total Focus Hours
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const ACTIVE_DAYS_DEFAULT = parseInt(process.env.LEADERBOARD_ACTIVE_DAYS || '7', 10);
const MAX_USERS_TO_FETCH = parseInt(process.env.LEADERBOARD_MAX_USERS || '1000', 10);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

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
  
  // Get pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit, 10);
  const itemsPerPage = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 100;
  const requestedActiveDays = parseInt(req.query.activeDays, 10);
  const activityWindowDays =
    Number.isFinite(requestedActiveDays) && requestedActiveDays > 0
      ? requestedActiveDays
      : ACTIVE_DAYS_DEFAULT;
  const activeSince = new Date(Date.now() - activityWindowDays * MS_PER_DAY);

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const clerkLimit = 100;
    let batchesFetched = 0;

    while (hasMore && offset < MAX_USERS_TO_FETCH) {
      const response = await clerk.users.getUserList({
        limit: clerkLimit,
        offset
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === clerkLimit;
      offset += clerkLimit;
      batchesFetched += 1;
    }

    const fetchLimitReached = hasMore;

    // If current user is not in the fetched batch, fetch them separately
    // This ensures the current user always appears in their leaderboard
    if (clerkUserId) {
      const userInBatch = allUsers.find(u => u.id === clerkUserId);
      if (!userInBatch) {
        try {
          const currentUser = await clerk.users.getUser(clerkUserId);
          allUsers.push(currentUser);
          console.log('✅ Added current user separately to leaderboard');
        } catch (err) {
          console.error('❌ Failed to fetch current user:', err);
        }
      }
    }

    // Filter users with totalFocusHours and create leaderboard
    const leaderboardCandidates = allUsers.map(user => {
      const totalHoursRaw = user.publicMetadata?.totalFocusHours;
      const totalHours =
        typeof totalHoursRaw === 'number'
          ? totalHoursRaw
          : parseFloat(totalHoursRaw) || 0;

      const email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      const username = user.username || email.split('@')[0];
      const statsLastUpdated = parseDate(user.publicMetadata?.statsLastUpdated);
      const lastActiveFallback =
        parseDate(user.lastActiveAt) ||
        parseDate(user.lastSignInAt) ||
        parseDate(user.createdAt);
      const lastActiveAt = statsLastUpdated || lastActiveFallback;
      const isActive = lastActiveAt ? lastActiveAt >= activeSince : false;

      return {
        userId: user.id,
        username,
        email,
        totalFocusHours: totalHours,
        isPremium: user.publicMetadata?.isPremium === true,
        isCurrentUser: clerkUserId ? user.id === clerkUserId : false,
        lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
        isActive,
        rawLastActiveSource: statsLastUpdated ? 'statsLastUpdated' : (lastActiveFallback ? 'clerkActivity' : 'unknown')
      };
    });

    const usersWithHoursBeforeFilter = leaderboardCandidates.filter(
      user => user.totalFocusHours > 0
    ).length;

    const allLeaderboardUsers = leaderboardCandidates
      .filter(
        user =>
          user.totalFocusHours > 0 &&
          (user.isActive || user.isCurrentUser)
      )
      .sort((a, b) => b.totalFocusHours - a.totalFocusHours);

    // Calculate pagination
    const totalUsers = allLeaderboardUsers.length;
    const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / itemsPerPage) : 1;
    const safePage = totalPages > 0 ? Math.max(1, Math.min(page, totalPages)) : 1;
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const leaderboard = allLeaderboardUsers.slice(startIndex, endIndex);

    // Find current user's position in full leaderboard
    let currentUserPosition = null;
    if (clerkUserId) {
      const index = allLeaderboardUsers.findIndex(user => user.userId === clerkUserId);
      if (index !== -1) {
        currentUserPosition = index + 1;
      }
    }

    // Include debug info
    const debugInfo = {
      totalUsersFound: allUsers.length,
      usersWithHoursBeforeFilter,
      usersWithHoursAfterFilter: totalUsers,
      usersFilteredOut: usersWithHoursBeforeFilter - totalUsers,
      fetchBatches: batchesFetched,
      fetchLimitReached,
      maxUsersToFetch: MAX_USERS_TO_FETCH,
      requestedPage: page,
      pageServed: safePage,
      totalPages,
      activityWindowDays,
      activeSince: activeSince.toISOString()
    };

    res.status(200).json({
      success: true,
      leaderboard: leaderboard,
      currentUserPosition: currentUserPosition,
      totalUsers: totalUsers,
      page: safePage,
      totalPages: totalPages,
      hasMore: safePage < totalPages,
      activityWindowDays,
      pageSize: itemsPerPage,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
};

