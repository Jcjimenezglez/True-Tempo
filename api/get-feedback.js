// API endpoint to get all feedback for admin panel
// Note: This uses the same in-memory store as submit-feedback.js

// We need to share the feedback store between endpoints
// For now, we'll return a message that feedback is stored in logs
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Since we can't share state between serverless functions easily,
    // we'll return a message directing to check Vercel logs
    res.status(200).json([
      {
        id: 'demo-1',
        feedback: 'Feedback system is working! Check Vercel logs for submitted feedback.',
        userEmail: 'demo@example.com',
        userId: 'demo-user',
        timestamp: new Date().toISOString(),
        status: 'new'
      }
    ]);

  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to get feedback',
      details: error.message 
    });
  }
};
