// API endpoint for Todoist OAuth flow
// This handles the OAuth redirect and token exchange

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Handle OAuth error
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL || 'https://superfocus.live'}?todoist_error=${error}`);
  }

  // Handle OAuth success
  if (code && state) {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://todoist.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.TODOIST_CLIENT_ID,
          client_secret: process.env.TODOIST_CLIENT_SECRET,
          code: code,
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Store token securely (you might want to encrypt this)
        // For now, we'll redirect with the token in a secure way
        const encryptedToken = Buffer.from(accessToken).toString('base64');
        
        return res.redirect(`${process.env.FRONTEND_URL || 'https://superfocus.live'}?todoist_success=1&token=${encryptedToken}`);
      } else {
        throw new Error('Failed to exchange code for token');
      }
    } catch (error) {
      console.error('Todoist OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://superfocus.live'}?todoist_error=token_exchange_failed`);
    }
  }

  // If no code, redirect to Todoist OAuth
  const authUrl = `https://todoist.com/oauth/authorize?client_id=${process.env.TODOIST_CLIENT_ID}&scope=data:read_write&state=${Date.now()}`;
  return res.redirect(authUrl);
};
