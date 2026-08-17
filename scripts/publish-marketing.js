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

fs.copyFileSync(path.join(OUT, "index.html"), path.join(ROOT, "index.html"));

const pricingOut = path.join(OUT, "pricing", "index.html");
if (fs.existsSync(pricingOut)) {
  fs.mkdirSync(path.join(ROOT, "pricing"), { recursive: true });
  fs.copyFileSync(pricingOut, path.join(ROOT, "pricing", "index.html"));
}

const nextFrom = path.join(OUT, "_next");
const nextTo = path.join(ROOT, "_next");
if (fs.existsSync(nextTo)) {
  fs.rmSync(nextTo, { recursive: true, force: true });
}
if (fs.existsSync(nextFrom)) {
  copyDir(nextFrom, nextTo);
}

console.log("Published marketing export to site root (/, /pricing, /_next)");
