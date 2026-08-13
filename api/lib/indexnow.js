const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'bcc86050f4a64f188fb7b4fc82ec80c0';
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || 'www.superfocus.live';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
const BATCH_SIZE = 10000;

function extractSitemapUrls(xml) {
  const urls = [];
  const locPattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = locPattern.exec(xml))) {
    const url = match[1].trim();
    if (url.startsWith(`https://${INDEXNOW_HOST}/`) || url === `https://${INDEXNOW_HOST}`) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

async function fetchSitemapUrls(sitemapUrl = `https://${INDEXNOW_HOST}/sitemap.xml`) {
  const response = await fetch(sitemapUrl, {
    headers: { Accept: 'application/xml,text/xml,*/*' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }
  return extractSitemapUrls(await response.text());
}

async function submitIndexNow(urlList) {
  const uniqueUrls = [...new Set((urlList || []).filter(Boolean))];
  if (uniqueUrls.length === 0) {
    return { submitted: 0, batches: [] };
  }

  const batches = [];
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch
      })
    });
    const text = await response.text();
    batches.push({
      count: batch.length,
      status: response.status,
      ok: response.ok || response.status === 202,
      body: text.slice(0, 500)
    });
  }

  return {
    host: INDEXNOW_HOST,
    keyLocation: KEY_LOCATION,
    submitted: uniqueUrls.length,
    batches
  };
}

module.exports = {
  INDEXNOW_KEY,
  INDEXNOW_HOST,
  KEY_LOCATION,
  extractSitemapUrls,
  fetchSitemapUrls,
  submitIndexNow
};
