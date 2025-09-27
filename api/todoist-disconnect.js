// Clears the Todoist token cookie

module.exports = async (req, res) => {
  const cookie = [
    'todoist_access_token=;',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Secure',
  ].join('; ');

  res.writeHead(200, {
    'Set-Cookie': cookie,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ ok: true }));
};


