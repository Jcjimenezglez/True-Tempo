// Get user's available devices

module.exports = async (req, res) => {
  try {
    const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k) acc[k] = decodeURIComponent(v || '');
      return acc;
    }, {});
    const token = cookies['spotify_access_token'];
    if (!token) {
      res.statusCode = 401;
      res.end('Not connected');
      return;
    }
    const r = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const json = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (e) {
    res.statusCode = 500;
    res.end('Error');
  }
};


