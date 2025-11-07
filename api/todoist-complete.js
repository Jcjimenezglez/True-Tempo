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
    if (!proCheck.isPro) {
      res.statusCode = 403;
      return res.end('Pro subscription required');
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const id = url.searchParams.get('id');
    if (!id) {
      res.statusCode = 400;
      return res.end('Missing id');
    }
    const token = getToken(req);
    const r = await fetch(`https://api.todoist.com/rest/v2/tasks/${id}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    res.statusCode = r.ok ? 200 : 500;
    res.end(r.ok ? 'ok' : 'failed');
  } catch (e) {
    res.statusCode = 401;
    res.end('unauthorized');
  }
};


