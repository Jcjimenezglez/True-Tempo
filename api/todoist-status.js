const { getRequestedUserId, getUserAndTodoistToken } = require('./lib/todoist-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = getRequestedUserId(req);
  if (!userId) {
    res.status(200).json({ connected: false });
    return;
  }

  try {
    const { user, accessToken, integration } = await getUserAndTodoistToken(userId);
    const isPro = user?.publicMetadata?.isPremium === true;
    const connected = isPro && Boolean(accessToken);

    res.status(200).json({
      connected,
      isPro,
      connectedAt: integration?.connectedAt || null,
    });
  } catch (error) {
    console.error('todoist-status error:', error);
    res.status(200).json({ connected: false });
  }
};
