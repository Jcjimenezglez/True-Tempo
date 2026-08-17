const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "marketing", "out");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(OUT)) {
  throw new Error("marketing/out missing. Run npm --prefix marketing run build first.");
}

const SKIP = new Set(["app", "404"]);

function removeConflictingHtml(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (SKIP.has(entry.name) || entry.name === "node_modules" || entry.name === "marketing" || entry.name === "api" || entry.name === "app") {
      continue;
    }
    const dir = path.join(root, entry.name);
    const siblingHtml = path.join(root, `${entry.name}.html`);
    if (fs.existsSync(path.join(dir, "index.html")) && fs.existsSync(siblingHtml)) {
      fs.unlinkSync(siblingHtml);
    }
    for (const child of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!child.isDirectory()) continue;
      const html = path.join(dir, `${child.name}.html`);
      if (fs.existsSync(path.join(dir, child.name, "index.html")) && fs.existsSync(html)) {
        fs.unlinkSync(html);
      }
    }
  }
}

for (const entry of fs.readdirSync(OUT, { withFileTypes: true })) {
  if (SKIP.has(entry.name)) continue;
  const from = path.join(OUT, entry.name);
  const to = path.join(ROOT, entry.name);
  if (entry.isDirectory()) {
    if (fs.existsSync(to)) {
      fs.rmSync(to, { recursive: true, force: true });
    }
    copyDir(from, to);
  } else if (entry.name === "index.html") {
    fs.copyFileSync(from, to);
  }
}

removeConflictingHtml(ROOT);

console.log("Published marketing export from marketing/out to site root");
