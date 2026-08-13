const { fetchSitemapUrls, submitIndexNow } = require('../lib/indexnow');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const urls = await fetchSitemapUrls();
    const result = await submitIndexNow(urls);
    const failed = result.batches.some((batch) => !batch.ok);
    return res.status(failed ? 502 : 200).json({
      success: !failed,
      ...result
    });
  } catch (error) {
    console.error('IndexNow submission failed:', error);
    return res.status(500).json({ error: error.message });
  }
};
