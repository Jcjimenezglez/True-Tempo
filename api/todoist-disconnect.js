const { clearTodoistToken, requireProContext } = require('./lib/todoist-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const proContext = await requireProContext(req);
  if (!proContext.ok) {
    res.status(proContext.status).json({ error: proContext.error });
    return;
  }

  try {
    await clearTodoistToken(proContext.userId);
    res.status(200).json({ success: true, connected: false });
  } catch (error) {
    console.error('todoist-disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Todoist' });
  }
};
