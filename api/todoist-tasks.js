const { getUserAndTodoistToken, requireProContext } = require('./lib/todoist-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
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

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      if (response.status === 401) {
        res.status(401).json({ error: 'Todoist token is invalid or expired' });
        return;
      }
      if (response.status === 410) {
        console.error('todoist-tasks: Todoist API endpoint deprecated');
        res.status(502).json({ error: 'Todoist API temporarily unavailable' });
        return;
      }
      console.error('todoist-tasks upstream:', response.status, errorPayload);
      res.status(502).json({ error: 'Failed to fetch Todoist tasks' });
      return;
    }

    const tasks = await response.json();
    res.status(200).json(Array.isArray(tasks) ? tasks : []);
  } catch (error) {
    console.error('todoist-tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch Todoist tasks' });
  }
};
