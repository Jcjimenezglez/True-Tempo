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
    console.log('🔍 Calling Todoist API with token:', token.substring(0, 10) + '...');
    
    const r = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('🔍 Todoist API response status:', r.status);
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error('❌ Todoist API error:', r.status, errorText);
      throw new Error(`Todoist API returned ${r.status}`);
    }
    
    const json = await r.json();
    console.log('✅ Fetched tasks from Todoist API:', json.length);
    console.log('🔍 Raw tasks response:', JSON.stringify(json, null, 2));
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (e) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};


