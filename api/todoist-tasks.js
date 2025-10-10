const { checkProStatus } = require('./_check-pro-status');

function getToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('todoist_access_token='));
  if (!match) throw new Error('Not connected');
  return decodeURIComponent(match.split('=')[1]);
}

module.exports = async (req, res) => {
  try {
    // Verify Pro status
    const proCheck = await checkProStatus(req);
    console.log('todoist-tasks: Pro check result:', proCheck);
    
    if (!proCheck.isPro) {
      console.log('❌ todoist-tasks: Access denied - not Pro');
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Pro subscription required', debug: proCheck }));
      return;
    }
    
    console.log('✅ todoist-tasks: Pro verified, fetching tasks...');

    const token = getToken(req);
    const r = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (e) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};


