module.exports = async (req, res) => {
  try {
    const cookies = [
      'google_calendar_access_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'google_calendar_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    ];
    res.setHeader('Set-Cookie', cookies);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

