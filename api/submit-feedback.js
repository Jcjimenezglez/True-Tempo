// API endpoint to submit user feedback
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { feedback, userEmail, userId } = req.body;

    if (!feedback || !feedback.trim()) {
      res.status(400).json({ error: 'Feedback is required' });
      return;
    }

    if (!userEmail || !userId) {
      res.status(400).json({ error: 'User information is required' });
      return;
    }

    // For now, we'll store feedback in a simple JSON file
    // In production, you might want to use a database
    const fs = require('fs').promises;
    const path = require('path');
    
    const feedbackData = {
      id: Date.now().toString(),
      feedback: feedback.trim(),
      userEmail,
      userId,
      timestamp: new Date().toISOString(),
      status: 'new' // new, reviewed, resolved
    };

    // Read existing feedback
    const feedbackFile = path.join(process.cwd(), 'feedback.json');
    let allFeedback = [];
    
    try {
      const existingData = await fs.readFile(feedbackFile, 'utf8');
      allFeedback = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      allFeedback = [];
    }

    // Add new feedback
    allFeedback.push(feedbackData);

    // Save back to file
    await fs.writeFile(feedbackFile, JSON.stringify(allFeedback, null, 2));

    res.status(200).json({ 
      message: 'Feedback submitted successfully',
      id: feedbackData.id
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: error.message 
    });
  }
};
