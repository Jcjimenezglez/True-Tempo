// API endpoint to submit user feedback
// Note: Vercel has read-only file system, so we'll use a simple in-memory store
// In production, you should use a proper database like Vercel KV, MongoDB, or PostgreSQL

let feedbackStore = []; // In-memory store (resets on server restart)

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

    const feedbackData = {
      id: Date.now().toString(),
      feedback: feedback.trim(),
      userEmail,
      userId,
      timestamp: new Date().toISOString(),
      status: 'new' // new, reviewed, resolved
    };

    // Add to in-memory store
    feedbackStore.push(feedbackData);

    // Log the feedback for now (you can see this in Vercel logs)
    console.log('New feedback received:', feedbackData);

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
