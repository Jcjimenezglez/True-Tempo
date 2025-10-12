const { checkProStatus } = require('./_check-pro-status');

function getToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('notion_access_token='));
  if (!match) throw new Error('Not connected');
  return decodeURIComponent(match.split('=')[1]);
}

module.exports = async (req, res) => {
  try {
    // Verify Pro status
    const proCheck = await checkProStatus(req);
    if (!proCheck.isPro) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Pro subscription required' }));
      return;
    }

    const token = getToken(req);
    
    // Parse request body
    let body;
    if (req.method === 'POST') {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => { resolve(JSON.parse(data)); });
      });
    } else {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    
    const { pageId, checkboxPropertyName, statusPropertyName, completed } = body;
    
    if (!pageId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Page ID is required' }));
      return;
    }
    
    // Build properties to update
    const properties = {};
    
    if (checkboxPropertyName) {
      properties[checkboxPropertyName] = {
        checkbox: completed
      };
    }
    
    if (statusPropertyName) {
      properties[statusPropertyName] = {
        status: {
          name: completed ? 'Done' : 'To Do'
        }
      };
    }
    
    // If no property name was provided, we can't update
    if (Object.keys(properties).length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No property to update' }));
      return;
    }
    
    // Update the page
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({ properties })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update task');
    }
    
    const data = await response.json();
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, data }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

