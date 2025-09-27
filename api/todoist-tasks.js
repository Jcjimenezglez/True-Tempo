// API endpoint to fetch Todoist tasks securely
// This prevents CORS issues and keeps tokens server-side

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Decode the token
    const accessToken = Buffer.from(token, 'base64').toString('utf-8');

    // Fetch projects
    const projectsRes = await fetch('https://api.todoist.com/rest/v2/projects', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!projectsRes.ok) {
      throw new Error('Failed to fetch projects');
    }

    const projects = await projectsRes.json();
    const projectsById = {};
    projects.forEach(p => { projectsById[p.id] = p; });

    // Fetch tasks
    const tasksRes = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!tasksRes.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const tasks = await tasksRes.json();

    // Filter and sort tasks
    const filteredTasks = tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Prioritize today's tasks
        const aDue = a.due ? new Date(a.due.date) : null;
        const bDue = b.due ? new Date(b.due.date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const aIsToday = aDue && aDue.getTime() === today.getTime();
        const bIsToday = bDue && bDue.getTime() === today.getTime();
        
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        
        // Then by priority
        const aPriority = a.priority || 4;
        const bPriority = b.priority || 4;
        return aPriority - bPriority;
      });

    return res.status(200).json({
      success: true,
      tasks: filteredTasks,
      projects: projectsById
    });

  } catch (error) {
    console.error('Todoist API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Todoist data',
      message: error.message 
    });
  }
};
