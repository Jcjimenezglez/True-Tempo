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

    const response = await fetch('https://api.todoist.com/api/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      if (response.status === 401) {
        res.status(401).json({ error: 'Todoist token is invalid or expired' });
        return;
      }
      console.error('todoist-projects upstream:', response.status, errorPayload);
      res.status(502).json({ error: 'Failed to fetch Todoist projects' });
      return;
    }

    const payload = await response.json();
    const projects = Array.isArray(payload) ? payload : (Array.isArray(payload?.results) ? payload.results : []);
    res.status(200).json(projects);
  } catch (error) {
    console.error('todoist-projects error:', error);
    res.status(500).json({ error: 'Failed to fetch Todoist projects' });
  }
};
