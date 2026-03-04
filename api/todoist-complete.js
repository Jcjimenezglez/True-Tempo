const { getUserAndTodoistToken, requireProContext } = require('./lib/todoist-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const taskId = String(req.query.id || '').trim();
  if (!taskId) {
    res.status(400).json({ error: 'Missing Todoist task id' });
    return;
  }

  const proContext = await requireProContext(req);
  if (!proContext.ok) {
    res.status(proContext.status).json({ error: proContext.error });
    return;
  }

  try {
    const { accessToken } = await getUserAndTodoistToken(proContext.userId);
    if (!accessToken) {
      res.status(401).json({ error: 'Todoist is not connected' });
      return;
    }

    const response = await fetch(`https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      if (response.status === 401) {
        res.status(401).json({ error: 'Todoist token is invalid or expired' });
        return;
      }
      if (response.status === 404) {
        res.status(404).json({ error: 'Todoist task not found' });
        return;
      }
      console.error('todoist-complete upstream error:', response.status, errorPayload);
      res.status(502).json({ error: 'Failed to complete Todoist task' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('todoist-complete error:', error);
    res.status(500).json({ error: 'Failed to complete Todoist task' });
  }
};
