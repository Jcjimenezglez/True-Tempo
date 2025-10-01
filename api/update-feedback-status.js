// API endpoint to update feedback status
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { id, status } = req.body;

    if (!id || !status) {
      res.status(400).json({ error: 'ID and status are required' });
      return;
    }

    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be new, reviewed, or resolved' });
      return;
    }

    const feedbackFile = path.join(process.cwd(), 'feedback.json');
    
    try {
      const data = await fs.readFile(feedbackFile, 'utf8');
      const feedback = JSON.parse(data);
      
      // Find and update the feedback item
      const feedbackIndex = feedback.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
      }

      feedback[feedbackIndex].status = status;
      feedback[feedbackIndex].updatedAt = new Date().toISOString();

      // Save back to file
      await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));

      res.status(200).json({ 
        message: 'Feedback status updated successfully',
        id: id,
        status: status
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Feedback file not found' });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ 
      error: 'Failed to update feedback status',
      details: error.message 
    });
  }
};
