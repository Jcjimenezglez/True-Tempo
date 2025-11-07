// Handle Notion OAuth callback
// Env required: NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      res.writeHead(302, { Location: '/?error=notion_auth_failed' });
      res.end();
      return;
    }

    const host = req.headers.host;
    const fallbackRedirect = `https://${host}/api/notion-auth-callback`;
    const redirectUri = (process.env.NOTION_REDIRECT_URI || fallbackRedirect).trim();

    // Exchange code for access token
    const credentials = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      res.writeHead(302, { Location: '/?error=notion_token_failed' });
      res.end();
      return;
    }

    // Set cookie with access token
    res.setHeader('Set-Cookie', `notion_access_token=${encodeURIComponent(tokenData.access_token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`);
    
    res.writeHead(302, { Location: '/?notion_connected=true' });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: '/?error=notion_callback_failed' });
    res.end();
  }
};

