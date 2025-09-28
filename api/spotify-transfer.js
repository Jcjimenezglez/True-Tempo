// Transfer playback to a specific device (e.g., the Web Playback SDK device)

module.exports = async (req, res) => {
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { device_id, play } = JSON.parse(body || '{}');

    if (!device_id) {
      res.statusCode = 400;
      res.end('Missing device_id');
      return;
    }

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

    const r = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ device_ids: [device_id], play: !!play })
    });

    if (![200, 202, 204].includes(r.status)) {
      const txt = await r.text();
      res.statusCode = r.status;
      res.end(txt);
      return;
    }
    res.end('OK');
  } catch (e) {
    res.statusCode = 500;
    res.end('Error');
  }
};


