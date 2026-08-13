const { extractSitemapUrls, submitIndexNow } = require('../api/lib/indexnow');
const fs = require('fs');
const path = require('path');

async function main() {
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = extractSitemapUrls(xml);
  console.log(`Submitting ${urls.length} sitemap URLs to IndexNow...`);
  const result = await submitIndexNow(urls);
  console.log(JSON.stringify(result, null, 2));
  if (result.batches.some((batch) => !batch.ok)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
