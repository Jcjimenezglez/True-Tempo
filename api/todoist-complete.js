// Closes a Todoist task via server-side proxy using token from cookie
const https = require('https');

function post(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('todoist_access_token='))?.split('=')[1] || '';
  if (!token) {
    res.status(401).json({ error: 'Not connected to Todoist' });
    return;
  }
  try {
    const { id } = (typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}));
    if (!id) {
      res.status(400).json({ error: 'Missing task id' });
      return;
    }
    const resp = await post(`https://api.todoist.com/rest/v2/tasks/${id}/close`, token);
    res.status(resp.status || 200).json({ ok: resp.status === 204 || resp.status === 200 });
  } catch (e) {
    res.status(500).json({ error: 'Complete error' });
  }
};


