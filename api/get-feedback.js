// API endpoint to get all feedback for admin panel
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const feedbackFile = path.join(process.cwd(), 'feedback.json');
    
    try {
      const data = await fs.readFile(feedbackFile, 'utf8');
      const feedback = JSON.parse(data);
      
      // Sort by timestamp (newest first)
      feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      res.status(200).json(feedback);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, return empty array
        res.status(200).json([]);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to get feedback',
      details: error.message 
    });
  }
};
