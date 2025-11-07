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
    const { databaseId } = req.query;
    
    if (!databaseId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Database ID is required' }));
      return;
    }
    
    // Query the database for its items
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch database items');
    }
    
    const data = await response.json();
    
    // Transform items to task-like format
    const items = (data.results || []).map(item => {
      // Get title (usually in a "Name" or "Title" property)
      let title = 'Untitled';
      let completed = false;
      let statusValue = null;
      let checkboxPropertyName = null;
      let statusPropertyName = null;
      
      if (item.properties) {
        // Find title property
        for (const key in item.properties) {
          const prop = item.properties[key];
          
          if (prop.type === 'title' && prop.title?.[0]?.plain_text) {
            title = prop.title[0].plain_text;
          }
          
          // Check for checkbox property
          if (prop.type === 'checkbox') {
            completed = prop.checkbox || false;
            checkboxPropertyName = key;
          }
          
          // Check for status property
          if (prop.type === 'status') {
            statusValue = prop.status?.name || null;
            statusPropertyName = key;
            // Consider "Done", "Completed", "Complete" as completed
            if (statusValue && ['Done', 'Completed', 'Complete'].includes(statusValue)) {
              completed = true;
            }
          }
        }
      }
      
      return {
        id: item.id,
        content: title,
        completed,
        url: item.url,
        last_edited: item.last_edited_time,
        checkboxPropertyName,
        statusPropertyName,
        statusValue,
        source: 'notion'
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(items));
  } catch (e) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

