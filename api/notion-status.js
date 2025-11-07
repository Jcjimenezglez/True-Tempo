module.exports = async (req, res) => {
  try {
    const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('notion_access_token='));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ connected: !!token }));
  } catch (e) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ connected: false }));
  }
};

