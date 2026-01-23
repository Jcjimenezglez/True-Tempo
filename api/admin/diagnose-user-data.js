// API endpoint to diagnose user data issues
// Only accessible by admin users
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-clerk-userid');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  const adminUserId = req.headers['x-clerk-userid'];
  if (!adminUserId) {
    res.status(401).json({ error: 'Unauthorized - Admin user required' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Verify admin status
    const adminUser = await clerk.users.getUser(adminUserId);
    const isAdmin = adminUser.publicMetadata?.isAdmin === true || 
                    adminUser.publicMetadata?.upgradedBy === 'admin';
    
    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden - Admin access required' });
      return;
    }

    // Get target user ID from query or body
    const targetUserId = req.query.userId || req.body?.userId;
    
    if (!targetUserId) {
      // Return list of users with potential data issues
      const users = await clerk.users.getUserList({ limit: 100 });
      
      const diagnosticReport = {
        timestamp: new Date().toISOString(),
        totalUsers: users.length,
        usersWithIssues: [],
        summary: {
          usersWithNoStats: 0,
          usersWithNoBackup: 0,
          usersWithNoCassettes: 0,
          premiumUsersWithIssues: 0
        }
      };

      for (const user of users) {
        const meta = user.publicMetadata || {};
        const issues = [];
        
        // Check for data issues
        if (meta.totalFocusHours > 0 && !meta.focusStatsBackup) {
          issues.push('Has hours but no backup');
          diagnosticReport.summary.usersWithNoBackup++;
        }
        
        if (meta.isPremium && !meta.totalFocusHours) {
          issues.push('Premium user with 0 hours');
          diagnosticReport.summary.premiumUsersWithIssues++;
        }
        
        if (meta.totalFocusHours > 5 && (!meta.publicCassettes || meta.publicCassettes.length === 0) && 
            (!meta.privateCassettes || meta.privateCassettes.length === 0)) {
          issues.push('Active user with no cassettes');
          diagnosticReport.summary.usersWithNoCassettes++;
        }
        
        if (!meta.totalFocusHours && !meta.statsLastUpdated) {
          diagnosticReport.summary.usersWithNoStats++;
        }
        
        if (issues.length > 0) {
          diagnosticReport.usersWithIssues.push({
            userId: user.id,
            email: user.emailAddresses?.[0]?.emailAddress,
            isPremium: meta.isPremium || false,
            totalHours: meta.totalFocusHours || 0,
            lastUpdated: meta.statsLastUpdated,
            issues: issues
          });
        }
      }

      res.status(200).json(diagnosticReport);
      return;
    }

    // Get specific user data
    const targetUser = await clerk.users.getUser(targetUserId);
    const meta = targetUser.publicMetadata || {};

    const userData = {
      userId: targetUser.id,
      email: targetUser.emailAddresses?.[0]?.emailAddress,
      createdAt: targetUser.createdAt,
      lastSignInAt: targetUser.lastSignInAt,
      
      // Subscription info
      isPremium: meta.isPremium || false,
      isTrial: meta.isTrial || false,
      paymentType: meta.paymentType,
      premiumSince: meta.premiumSince,
      
      // Focus stats
      totalFocusHours: meta.totalFocusHours || 0,
      statsLastUpdated: meta.statsLastUpdated,
      
      // Backup data
      hasStatsBackup: !!meta.focusStatsBackup,
      statsBackupDetails: meta.focusStatsBackup ? {
        totalHours: meta.focusStatsBackup.totalHours,
        completedCycles: meta.focusStatsBackup.completedCycles,
        dailyEntriesCount: Object.keys(meta.focusStatsBackup.daily || {}).length,
        lastBackup: meta.focusStatsBackup.lastBackup
      } : null,
      
      // Custom timers
      hasCustomTechniques: !!(meta.customTechniques && meta.customTechniques.length > 0),
      customTechniquesCount: meta.customTechniques?.length || 0,
      customTechniques: meta.customTechniques || [],
      
      // Cassettes
      publicCassettesCount: meta.publicCassettes?.length || 0,
      privateCassettesCount: meta.privateCassettes?.length || 0,
      publicCassettes: meta.publicCassettes || [],
      privateCassettes: meta.privateCassettes || [],
      
      // Streak data
      hasStreakData: !!meta.streakData,
      streakData: meta.streakData || null,
      
      // Issues detected
      potentialIssues: []
    };

    // Detect potential issues
    if (userData.totalFocusHours > 0 && !userData.hasStatsBackup) {
      userData.potentialIssues.push({
        type: 'NO_BACKUP',
        message: 'User has focus hours but no detailed backup. Data may be lost on logout.',
        severity: 'high'
      });
    }

    if (userData.isPremium && userData.totalFocusHours === 0) {
      userData.potentialIssues.push({
        type: 'PREMIUM_NO_HOURS',
        message: 'Premium user with 0 focus hours. May indicate data loss.',
        severity: 'medium'
      });
    }

    if (userData.totalFocusHours > 5 && userData.publicCassettesCount === 0 && userData.privateCassettesCount === 0) {
      userData.potentialIssues.push({
        type: 'ACTIVE_NO_CASSETTES',
        message: 'Active user with no saved cassettes.',
        severity: 'low'
      });
    }

    if (userData.hasStatsBackup && userData.statsBackupDetails.dailyEntriesCount === 0) {
      userData.potentialIssues.push({
        type: 'BACKUP_NO_DAILY',
        message: 'Backup exists but has no daily data entries.',
        severity: 'medium'
      });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error in diagnose-user-data:', error);
    res.status(500).json({ error: 'Failed to diagnose user data', details: error.message });
  }
};
