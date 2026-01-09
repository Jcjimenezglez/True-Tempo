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
    let premiumUsers = [];
    let freeUsers = [];
    let batchesFetched = 0;

    // Step 1: Fetch ALL Premium users first (they always appear in leaderboard)
    console.log('🔍 Fetching Premium users...');
    let premiumOffset = 0;
    let premiumHasMore = true;
    const clerkLimit = 100;

    while (premiumHasMore) { // No limit - fetch ALL Premium users
      try {
        const response = await clerk.users.getUserList({
          limit: clerkLimit,
          offset: premiumOffset
        });

        // Filter premium users from this batch
        const premiumBatch = response.data.filter(u => u.publicMetadata?.isPremium === true);
        premiumUsers = premiumUsers.concat(premiumBatch);
        
        premiumHasMore = response.data.length === clerkLimit;
        premiumOffset += clerkLimit;
        batchesFetched += 1;

        // Stop if we've fetched enough batches or no more users
        if (!premiumHasMore) break;
      } catch (err) {
        console.error('Error fetching premium users batch:', err);
        break;
      }
    }

    console.log(`✅ Found ${premiumUsers.length} Premium users`);

    // Step 2: Fetch Free users to fill remaining slots up to MAX_USERS_TO_FETCH
    const remainingSlots = Math.max(0, MAX_USERS_TO_FETCH - premiumUsers.length);
    console.log(`🔍 Fetching up to ${remainingSlots} Free users...`);
    
    let freeOffset = 0;
    let freeHasMore = true;

    while (freeHasMore && freeUsers.length < remainingSlots) {
      try {
        const response = await clerk.users.getUserList({
          limit: clerkLimit,
          offset: freeOffset
        });

        // Filter free users (non-premium) from this batch
        const freeBatch = response.data.filter(u => u.publicMetadata?.isPremium !== true);
        freeUsers = freeUsers.concat(freeBatch);
        
        freeHasMore = response.data.length === clerkLimit;
        freeOffset += clerkLimit;
        batchesFetched += 1;

        // Stop if we have enough free users
        if (freeUsers.length >= remainingSlots) {
          freeUsers = freeUsers.slice(0, remainingSlots);
          break;
        }
      } catch (err) {
        console.error('Error fetching free users batch:', err);
        break;
      }
    }

    console.log(`✅ Found ${freeUsers.length} Free users`);

    // Step 3: Combine Premium (priority) + Free users
    let combinedUsers = [...premiumUsers, ...freeUsers];
    console.log(`📊 Initial pool: ${combinedUsers.length} users (${premiumUsers.length} Premium + ${freeUsers.length} Free)`);

    // Step 4: If we exceed 1000 users, filter out inactive users (no activity in last 3 days)
    if (combinedUsers.length > MAX_USERS_TO_FETCH) {
      console.log(`⚠️ Exceeded ${MAX_USERS_TO_FETCH} users, filtering out inactive users (3+ days)...`);
      
      const threeDaysAgo = new Date(Date.now() - 3 * MS_PER_DAY);
      
      // Premium users: NO FILTER - they always appear regardless of activity
      const activePremium = premiumUsers;

      const activeFree = freeUsers.filter(user => {
        const statsLastUpdated = parseDate(user.publicMetadata?.statsLastUpdated);
        const lastActiveFallback =
          parseDate(user.lastActiveAt) ||
          parseDate(user.lastSignInAt) ||
          parseDate(user.createdAt);
        const lastActiveAt = statsLastUpdated || lastActiveFallback;
        return lastActiveAt && lastActiveAt >= threeDaysAgo;
      });

      console.log(`✅ After 3-day filter: ${activePremium.length} Premium + ${activeFree.length} Free = ${activePremium.length + activeFree.length} active users`);

      // If still over limit, prioritize Premium and trim Free
      if (activePremium.length + activeFree.length > MAX_USERS_TO_FETCH) {
        const freeSlots = MAX_USERS_TO_FETCH - activePremium.length;
        combinedUsers = [...activePremium, ...activeFree.slice(0, Math.max(0, freeSlots))];
        console.log(`🔪 Trimmed to ${MAX_USERS_TO_FETCH}: ${activePremium.length} Premium + ${combinedUsers.length - activePremium.length} Free`);
      } else {
        combinedUsers = [...activePremium, ...activeFree];
      }
    }

    allUsers = combinedUsers;
    const fetchLimitReached = freeHasMore && freeUsers.length >= remainingSlots;

    console.log(`📊 Final leaderboard pool: ${allUsers.length} users`);

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

