// Return current spotify auth status based on cookies

module.exports = async (req, res) => {
  try {
    const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k) acc[k] = decodeURIComponent(v || '');
      return acc;
    }, {});
    const access = cookies['spotify_access_token'] || '';
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ connected: !!access }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ connected: false }));
  }
};


