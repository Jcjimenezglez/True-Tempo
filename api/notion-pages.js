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
    
    // Search for databases
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: 50
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Notion databases');
    }
    
    const data = await response.json();
    
    // Transform databases to a simpler format
    const databases = (data.results || []).map(db => {
      // Get database title
      let title = 'Untitled Database';
      
      if (db.title && db.title[0]?.plain_text) {
        title = db.title[0].plain_text;
      }
      
      // Check what properties this database has
      const hasCheckbox = Object.values(db.properties || {}).some(prop => prop.type === 'checkbox');
      const hasStatus = Object.values(db.properties || {}).some(prop => prop.type === 'status');
      const hasSelect = Object.values(db.properties || {}).some(prop => prop.type === 'select');
      
      return {
        id: db.id,
        name: title,
        url: db.url,
        last_edited: db.last_edited_time,
        properties: db.properties,
        hasCheckbox,
        hasStatus,
        hasSelect
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(databases));
  } catch (e) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

