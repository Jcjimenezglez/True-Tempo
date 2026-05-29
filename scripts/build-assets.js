#!/usr/bin/env node
/**
 * Minify frontend assets and write dist/asset-manifest.json with hashed filenames.
 * Also updates index.html to reference hashed dist assets when present.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const INDEX_PATH = path.join(ROOT, 'index.html');

function hashContent(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function writeFallbackManifest() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  const manifest = {
    style: '/style.css',
    script: '/script.js',
    scriptLanding: '/script-landing.js'
  };
  fs.writeFileSync(path.join(DIST, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote fallback asset-manifest.json');
  return manifest;
}

function patchIndexHtml(manifest) {
  if (!fs.existsSync(INDEX_PATH) || !manifest.script || !manifest.style) return;
  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  html = html.replace(/href="[^"]*style[^"]*\.css"/, `href="${manifest.style}"`);
  html = html.replace(/href="style\.css"/, `href="${manifest.style}"`);
  html = html.replace(/<script src="[^"]*script[^"]*\.js[^"]*" defer><\/script>/, `<script src="${manifest.script}" defer></script>`);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('Updated index.html asset references');
}

async function build() {
  let esbuild;
  try {
    esbuild = require('esbuild');
  } catch (_) {
    console.warn('esbuild not installed — using unminified asset paths');
    const manifest = writeFallbackManifest();
    return manifest;
  }

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const scriptSrc = fs.readFileSync(path.join(ROOT, 'script.js'));
  const landingSrc = fs.readFileSync(path.join(ROOT, 'script-landing.js'));
  const styleSrc = fs.readFileSync(path.join(ROOT, 'style.css'));

  const scriptHash = hashContent(scriptSrc);
  const landingHash = hashContent(landingSrc);
  const styleHash = hashContent(styleSrc);

  const scriptOut = path.join(DIST, `script.${scriptHash}.min.js`);
  const landingOut = path.join(DIST, `script-landing.${landingHash}.min.js`);
  const styleOut = path.join(DIST, `style.${styleHash}.min.css`);

  await esbuild.build({
    entryPoints: [path.join(ROOT, 'script.js')],
    outfile: scriptOut,
    minify: true,
    bundle: false,
    target: ['es2020']
  });

  await esbuild.build({
    entryPoints: [path.join(ROOT, 'script-landing.js')],
    outfile: landingOut,
    minify: true,
    bundle: false,
    target: ['es2020']
  });

  await esbuild.build({
    entryPoints: [path.join(ROOT, 'style.css')],
    outfile: styleOut,
    minify: true,
    loader: { '.css': 'css' }
  });

  const manifest = {
    style: `/dist/style.${styleHash}.min.css`,
    script: `/dist/script.${scriptHash}.min.js`,
    scriptLanding: `/dist/script-landing.${landingHash}.min.js`
  };

  fs.writeFileSync(path.join(DIST, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Built assets:', manifest);
  patchIndexHtml(manifest);
  return manifest;
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
