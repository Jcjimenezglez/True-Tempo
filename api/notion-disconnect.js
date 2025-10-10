module.exports = async (req, res) => {
  try {
    res.setHeader('Set-Cookie', 'notion_access_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

