// API endpoint to delete feedback
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { id } = req.body;

    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    const feedbackFile = path.join(process.cwd(), 'feedback.json');
    
    try {
      const data = await fs.readFile(feedbackFile, 'utf8');
      const feedback = JSON.parse(data);
      
      // Find and remove the feedback item
      const feedbackIndex = feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
      }

      // Remove the feedback item
      feedback.splice(feedbackIndex, 1);

      // Save back to file
      await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));

      res.status(200).json({ 
        message: 'Feedback deleted successfully',
        id: id
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Feedback file not found' });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to delete feedback',
      details: error.message 
    });
  }
};
