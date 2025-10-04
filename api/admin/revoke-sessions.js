// Admin endpoint to revoke all Clerk sessions for a given user (by email or userId)
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Simple admin authentication via header
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  let body = {};
  try {
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    else if (typeof req.body === 'object' && req.body) body = req.body;
  } catch (_) {
    // ignore
  }

  const { email, userId } = body;

  if (!email && !userId) {
    res.status(400).json({ error: 'Provide email or userId' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });

    // Resolve target users
    let targetUsers = [];
    if (userId) {
      try {
        const user = await clerk.users.getUser(userId);
        if (user) targetUsers.push(user);
      } catch (_) {}
    }
    if (email) {
      try {
        // Try direct search by email
        const list = await clerk.users.getUserList({
          emailAddress: [String(email).trim()],
          limit: 100,
        });
        if (Array.isArray(list?.data)) {
          targetUsers.push(...list.data);
        }
      } catch (_) {}

      // Fallback: list and filter if direct search not supported
      if (targetUsers.length === 0) {
        const list = await clerk.users.getUserList({ limit: 200 });
        const lower = String(email).trim().toLowerCase();
        const filtered = list.data.filter(u =>
          (u.primaryEmailAddress?.emailAddress || '').toLowerCase() === lower ||
          (Array.isArray(u.emailAddresses) && u.emailAddresses.some(e => (e.emailAddress || '').toLowerCase() === lower))
        );
        targetUsers.push(...filtered);
      }
    }

    if (targetUsers.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let revoked = 0;
    const details = [];
    for (const u of targetUsers) {
      // List sessions for user
      let sessions;
      try {
        sessions = await clerk.sessions.getSessionList({ userId: u.id, limit: 100 });
      } catch (e) {
        details.push({ userId: u.id, email: u.primaryEmailAddress?.emailAddress, error: e?.message || 'list failed' });
        continue;
      }

      const list = Array.isArray(sessions?.data) ? sessions.data : [];
      for (const s of list) {
        try {
          await clerk.sessions.revokeSession(s.id);
          revoked += 1;
        } catch (e) {
          details.push({ sessionId: s.id, userId: u.id, error: e?.message || 'revoke failed' });
        }
      }
      details.push({ userId: u.id, email: u.primaryEmailAddress?.emailAddress, sessions: list.length, revoked: list.length });
    }

    res.status(200).json({ ok: true, usersProcessed: targetUsers.length, sessionsRevoked: revoked, details });
  } catch (error) {
    console.error('Revoke sessions error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions', details: error?.message || 'unknown' });
  }
};


