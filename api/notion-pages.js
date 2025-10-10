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
    
    // Search for pages that could be tasks
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
          value: 'page'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: 50
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Notion pages');
    }
    
    const data = await response.json();
    
    // Transform pages to task-like format
    const pages = (data.results || []).map(page => {
      // Try different properties for the title
      let title = 'Untitled Page';
      
      if (page.properties) {
        // Check for title property
        if (page.properties.title?.title?.[0]?.plain_text) {
          title = page.properties.title.title[0].plain_text;
        } else if (page.properties.Name?.title?.[0]?.plain_text) {
          title = page.properties.Name.title[0].plain_text;
        } else {
          // Check for any property with a title type
          for (const key in page.properties) {
            if (page.properties[key].type === 'title' && page.properties[key].title?.[0]?.plain_text) {
              title = page.properties[key].title[0].plain_text;
              break;
            }
          }
        }
      }
      
      return {
        id: page.id,
        content: title,
        description: '',
        url: page.url,
        last_edited: page.last_edited_time,
        source: 'Notion'
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(pages));
  } catch (e) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

