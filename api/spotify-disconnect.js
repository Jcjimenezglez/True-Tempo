// Clear Spotify cookies

module.exports = async (req, res) => {
  try {
    const expired = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax; Secure';
    const headers = {
      'Set-Cookie': [
        'spotify_access_token=; ' + expired,
        'spotify_refresh_token=; ' + expired,
        'spotify_expiry=; ' + expired
      ].join('\n')
    };
    res.writeHead(200, headers);
    res.end('Disconnected');
  } catch (e) {
    res.statusCode = 500;
    res.end('Error');
  }
};


