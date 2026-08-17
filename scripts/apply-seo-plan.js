#!/usr/bin/env node
/**
 * Keyword-first titles, H1s, descriptions, FAQs.
 * Volumes: Keywords Everywhere US Google Keyword Planner (gkp), Aug 2026.
 * Product: Superfocus Premium is $1.99/month — no guest timer, no free plan.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAID = "Superfocus Premium is $1.99/month.";

const SPECIAL = {
  "pomodoro-timer-online": {
    keyword: "pomodoro timer",
    h1: "Pomodoro Timer Online",
    title: "Pomodoro Timer Online — Tomato Timer & 25/5 Clock | Superfocus",
    description: `Browser pomodoro timer (tomato / 25-5) with tasks and sound. ${PAID} Subscribe to start.`,
    keywords: "pomodoro timer, pomodoro timer online, tomato timer, pomodoro app, pomodoro technique timer",
    extraKeywords: ["pomodoro timer", "pomodoro timer online", "tomato timer", "pomodoro app"],
  },
  "pomodoro-technique": {
    keyword: "pomodoro technique",
    h1: "Pomodoro Technique Timer",
    title: "Pomodoro Technique & Method — 25/5 Timer | Superfocus",
    description: `Run the pomodoro technique (25 on, 5 off) — also called the pomodoro method. ${PAID}`,
    keywords: "pomodoro technique, pomodoro method, pomodoro technique timer, pomodoro timer",
    extraKeywords: ["pomodoro technique", "pomodoro method", "pomodoro technique timer"],
  },
  "study-timer": {
    keyword: "study timer",
    h1: "Study Timer Online",
    title: "Study Timer Online — Pomodoro for Students | Superfocus",
    description: `Study timer with pomodoro blocks and optional lofi study music in one tab. ${PAID}`,
    keywords: "study timer, study timer online, pomodoro study timer, exam timer",
    extraKeywords: ["study timer", "pomodoro study timer", "exam timer", "lofi study music"],
  },
  "focus-timer": {
    keyword: "focus timer",
    h1: "Focus Timer Online",
    title: "Focus Timer Online — Pomodoro for Deep Work | Superfocus",
    description: `Focus timer for desk work: pomodoro or longer blocks, plus optional focus music. ${PAID}`,
    keywords: "focus timer, focus timer online, pomodoro timer, work timer",
    extraKeywords: ["focus timer", "focus timer online", "work timer"],
  },
  "work-timer": {
    keyword: "work timer",
    h1: "Work Timer Online",
    title: "Work Timer — Pomodoro for Desk Jobs | Superfocus",
    description: `Work timer so Slack does not eat the afternoon. Classic pomodoro or custom lengths. ${PAID}`,
    keywords: "work timer, focus timer, pomodoro timer, time blocking",
    extraKeywords: ["work timer", "focus timer", "time blocking"],
  },
  "writing-timer": {
    keyword: "writing timer",
    h1: "Writing Timer",
    title: "Writing Timer — Pomodoro for Drafts | Superfocus",
    description: `Writing timer with pomodoro or longer blocks so drafts actually start. ${PAID}`,
    keywords: "writing timer, pomodoro timer, focus timer",
    extraKeywords: ["writing timer", "pomodoro timer"],
  },
  "coding-focus-timer": {
    keyword: "coding timer",
    h1: "Coding Timer for Developers",
    title: "Coding Timer — Pomodoro for Developers | Superfocus",
    description: `Coding timer with pomodoro sprints so you ship instead of context-switch. ${PAID}`,
    keywords: "coding timer, pomodoro timer, focus timer, deep work timer",
    extraKeywords: ["coding timer", "pomodoro timer", "deep work timer"],
  },
  "time-blocking-timer": {
    keyword: "time blocking",
    h1: "Time Blocking Timer",
    title: "Time Blocking Timer — Protect Focus Hours | Superfocus",
    description: `Time blocking timer: treat focus like a meeting. Pomodoro or custom lengths. ${PAID}`,
    keywords: "time blocking, work timer, pomodoro timer, focus timer",
    extraKeywords: ["time blocking", "work timer", "pomodoro timer"],
  },
  "focus-music": {
    keyword: "focus music",
    h1: "Focus Music with a Pomodoro Timer",
    title: "Focus Music — Lofi, Rain & Timer in One Tab | Superfocus",
    description: `Focus music inside the pomodoro timer so YouTube does not steal the session. ${PAID}`,
    keywords: "focus music, lofi study music, white noise, pomodoro timer",
    extraKeywords: ["focus music", "lofi study music", "white noise"],
  },
  "lofi-study-music": {
    keyword: "lofi study music",
    h1: "Lofi Study Music with a Study Timer",
    title: "Lofi Study Music + Pomodoro Study Timer | Superfocus",
    description: `Lofi study music inside a study timer — no livestream sidebar. ${PAID}`,
    keywords: "lofi study music, study timer, focus music, pomodoro timer",
    extraKeywords: ["lofi study music", "study timer", "focus music"],
  },
  "white-noise-focus": {
    keyword: "white noise",
    h1: "White Noise for Focus",
    title: "White Noise for Focus + Pomodoro Timer | Superfocus",
    description: `White noise with a running pomodoro / focus timer so sound stays in the same tab. ${PAID}`,
    keywords: "white noise, focus music, focus timer, pomodoro timer",
    extraKeywords: ["white noise", "focus music", "focus timer"],
  },
  "rain-sounds-focus": {
    keyword: "rain sounds for focus",
    h1: "Rain Sounds for Focus",
    title: "Rain Sounds for Focus + Pomodoro Timer | Superfocus",
    description: `Rain sounds for focus inside the timer — not a YouTube mix hunt. ${PAID}`,
    keywords: "rain sounds for focus, focus music, study timer",
    extraKeywords: ["rain sounds for focus", "focus music"],
  },
  "how-to-focus": {
    keyword: "how to focus",
    h1: "How to Focus (with a Pomodoro Timer)",
    title: "How to Focus — One Task + Pomodoro Timer | Superfocus",
    description: `How to focus: name one action, start a pomodoro timer, optional sound. ${PAID}`,
    keywords: "how to focus, why can't i focus, focus timer, pomodoro timer",
    extraKeywords: ["how to focus", "why can't i focus", "focus timer"],
  },
  "why-cant-i-focus": {
    keyword: "why can't i focus",
    h1: "Why Can't I Focus?",
    title: "Why Can't I Focus? Fix the Session | Superfocus",
    description: `Why can't I focus is usually too many tabs and no clock. A pomodoro focus timer is the practical fix. ${PAID}`,
    keywords: "why can't i focus, how to focus, focus timer",
    extraKeywords: ["why can't i focus", "how to focus"],
  },
  "how-to-focus-with-adhd": {
    keyword: "how to focus with adhd",
    h1: "How to Focus with ADHD",
    title: "How to Focus with ADHD — Short Timer Blocks | Superfocus",
    description: `How to focus with ADHD: short sprints, visible time, fewer decisions. Not medical advice. ${PAID}`,
    keywords: "how to focus with adhd, adhd focus timer, pomodoro for adhd",
    extraKeywords: ["how to focus with adhd", "adhd focus timer", "pomodoro for adhd"],
  },
  "adhd-focus-timer": {
    keyword: "adhd focus timer",
    h1: "ADHD Focus Timer",
    title: "ADHD Focus Timer — Sprint & Pomodoro | Superfocus",
    description: `ADHD focus timer with short sprints when 25 minutes feels like a wall. ${PAID}`,
    keywords: "adhd focus timer, how to focus with adhd, pomodoro for adhd",
    extraKeywords: ["adhd focus timer", "how to focus with adhd", "pomodoro for adhd"],
  },
  "how-to-enter-flow-state": {
    keyword: "how to enter flow state",
    h1: "How to Enter Flow State",
    title: "How to Enter Flow State — Flowtime Timer | Superfocus",
    description: `How to enter flow state: protect 45–90 minutes with a flowtime or deep-work timer. ${PAID}`,
    keywords: "how to enter flow state, flowtime, deep work timer",
    extraKeywords: ["how to enter flow state", "flowtime", "deep work timer"],
  },
  "enter-flow-state": {
    keyword: "how to enter flow state",
    h1: "How to Enter Flow State",
    title: "Enter Flow State — 45–90 Minute Timer | Superfocus",
    description: `Flow needs a protected block. Use Flow or Deep Work presets with optional focus music. ${PAID}`,
    keywords: "how to enter flow state, flowtime, deep work timer",
    extraKeywords: ["how to enter flow state", "flowtime"],
  },
  "pomofocus": {
    keyword: "pomofocus",
    h1: "Pomofocus Alternative",
    title: "Pomofocus Alternative — Timer, Tasks, Sound | Superfocus",
    description: `Pomofocus alternative: still a pomodoro timer online, plus tasks and cassettes. ${PAID}`,
    keywords: "pomofocus, pomofocus alternative, pomodoro timer online, pomodoro app",
    extraKeywords: ["pomofocus", "pomodoro timer online", "pomodoro app"],
  },
  "superfocus-vs-pomofocus": {
    keyword: "pomofocus",
    title: "Pomofocus vs Superfocus — Pomodoro Timer Comparison | Superfocus",
    extraKeywords: ["pomofocus", "pomodoro timer online", "pomodoro app"],
  },
  "best-pomodoro-apps": {
    keyword: "best pomodoro apps",
    h1: "Best Pomodoro Apps",
    title: "Best Pomodoro Apps & Timers | Superfocus",
    description: `Shortlist of pomodoro timer apps: minimal clocks vs timer + tasks + sound. ${PAID}`,
    keywords: "best pomodoro apps, pomodoro timer apps, best pomodoro timer, pomodoro app",
    extraKeywords: ["best pomodoro apps", "pomodoro timer apps", "best pomodoro timer"],
  },
  "pomodoro-timer-apps": {
    keyword: "pomodoro timer apps",
    h1: "Pomodoro Timer Apps Compared",
    title: "Pomodoro Timer Apps Compared | Superfocus",
    description: `Pomodoro timer apps vs a browser timer with tasks and focus music. ${PAID}`,
    keywords: "pomodoro timer apps, pomodoro app, best pomodoro timer",
    extraKeywords: ["pomodoro timer apps", "pomodoro app", "best pomodoro timer"],
  },
  "exam-prep-timer": {
    keyword: "exam timer",
    h1: "Exam Prep Timer",
    title: "Exam Timer & Study Timer for Test Prep | Superfocus",
    description: `Exam timer using pomodoro study blocks so prep has a start and a stop. ${PAID}`,
    keywords: "exam timer, study timer, pomodoro study timer",
    extraKeywords: ["exam timer", "study timer"],
  },
  "is-superfocus-free": {
    keyword: "is superfocus free",
    h1: "Is Superfocus Free?",
    title: "Is Superfocus Free? Pricing ($1.99/mo) | Superfocus",
    description: "No. Superfocus Premium is $1.99/month after you create an account. There is no guest timer and no free daily cap.",
    keywords: "is superfocus free, superfocus pricing, pomodoro timer",
    heroSubtitle: "Honest pricing: one plan, $1.99/month. The marketing pages are free to read; the timer at /app is Premium.",
    answer:
      "No. Superfocus is not a free guest timer. <strong>Premium is $1.99 per month</strong> after you create an account and subscribe. There is no two-hour daily free tier and no 25-minute guest session.",
    painSolution: "Read the guides for free.<br>Subscribe at $1.99/month.<br>Timer lives at /app.",
    faq: [
      {
        q: "Is Superfocus free?",
        a: "No. Premium is $1.99/month. There is no guest timer.",
      },
      {
        q: "How do I start?",
        a: "Open Subscribe, create an account, complete Stripe Checkout, then use /app.",
      },
      {
        q: "Can I cancel?",
        a: "Yes. Billed monthly. Cancel anytime from the billing portal.",
      },
    ],
    preset: "Pomodoro (25/5/15)",
    longFormBlocks: [
      "<p>Superfocus used to describe a free daily cap. That is no longer the product. The timer app requires Premium at <strong>$1.99/month</strong>.</p>",
      "<p>Guides on this site are free to read. To run sessions, <a href=\"/pricing\">Subscribe</a>.</p>",
    ],
  },
};

const HOW_TO_FOCUS_PAGE = {
  slug: "how-to-focus",
  category: "faq",
  keyword: "how to focus",
  title: "How to Focus — One Task + Pomodoro Timer | Superfocus",
  description: `How to focus: name one action, start a pomodoro timer, optional sound. ${PAID}`,
  h1: "How to Focus (with a Pomodoro Timer)",
  answer:
    "<strong>How to focus</strong> in practice: write one next action, start a pomodoro timer, and keep sound in the same tab. Superfocus is that loop at $1.99/month — not a personality overhaul.",
  preset: "Pomodoro (25/5/15) or Sprint (15 min)",
  related: ["/faq/pomodoro-timer-online", "/use-cases/focus-timer", "/blog/why-cant-i-focus"],
  faq: [
    {
      q: "How do I actually focus?",
      a: "Shrink the task until it is one physical action. Start a timer. Do not open a second music tab.",
    },
    {
      q: "Why does advice fail?",
      a: "“Try harder” ignores open loops. A running clock plus one named task is the missing piece.",
    },
  ],
  heroSubtitle: "How to focus is a session design problem: one task, a visible end, optional sound.",
  painPoints: "Five tabs. No clock.<br>Task is a blob.<br>You search how to focus instead of starting.",
  painSolution: "Name the next action.<br>Start the pomodoro timer.<br>Honor the break.",
  tier: "A",
  keywords: "how to focus, why can't i focus, focus timer, pomodoro timer",
  extraKeywords: ["how to focus", "why can't i focus", "focus timer"],
};

function walkStrings(value, fn) {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((item) => walkStrings(item, fn));
  if (value && typeof value === "object") {
    const out = Array.isArray(value) ? [] : { ...value };
    for (const [k, v] of Object.entries(value)) out[k] = walkStrings(v, fn);
    return out;
  }
  return value;
}

function sanitizeString(text) {
  let s = text;
  s = s.replace(/Try them free/gi, "Subscribe");
  s = s.replace(/Try it free/gi, "Subscribe");
  s = s.replace(/Try each free/gi, "Try each preset");
  s = s.replace(/Try free[^.|<]{0,80}/gi, "Subscribe at $1.99/month");
  s = s.replace(/Start your free trial[^.|<]{0,120}/gi, "Subscribe");
  s = s.replace(/No signup to try\./gi, "");
  s = s.replace(/no signup required[^.|]{0,40}/gi, "");
  s = s.replace(/No signup required[^.|]{0,40}/gi, "");
  s = s.replace(/Any preset on free tier/gi, "Any timer preset");
  s = s.replace(/Free to start\./gi, `${PAID}`);
  s = s.replace(/No credit card required to start\./gi, "");
  s = s.replace(/No credit card to start\./gi, "");
  s = s.replace(/Free to try, no credit card\./gi, PAID);
  s = s.replace(/Free to try\./gi, `${PAID}`);
  s = s.replace(/Yes\. Superfocus is free to use\./gi, `No. ${PAID}`);
  s = s.replace(/Yes\. Free to use\./gi, `No. ${PAID}`);
  s = s.replace(/Yes\. Free users get 2 hours of focus per day; guests get 25 minutes\. Premium gives unlimited focus and all features\./gi, `No. ${PAID} There is no guest timer.`);
  s = s.replace(/Free users get 2 hours of focus per day; guests get 25 minutes\./gi, `Premium is $1.99/month. There is no guest timer.`);
  s = s.replace(/Free accounts get 2 hours of focus per day; guests can run one 25-minute session without signing up\./gi, "");
  s = s.replace(/2 hours focus per day on free tier\./gi, "");
  s = s.replace(/guests get 25 minutes\./gi, "");
  s = s.replace(/Free tier: 2 hours focus\/day\./gi, "");
  s = s.replace(/a free 25\/5/gi, "a 25/5");
  s = s.replace(/A free study timer/gi, "A study timer");
  s = s.replace(/Free Pomodoro/gi, "Pomodoro");
  s = s.replace(/free Pomodoro/gi, "pomodoro");
  s = s.replace(/Try Superfocus free/gi, "Subscribe");
  s = s.replace(/ in Superfocus\. Free/gi, " in Superfocus.");
  s = s.replace(/ All presets in one app\. Free\./gi, ` ${PAID}`);
  s = s.replace(/ Free timer\./gi, ` ${PAID}`);
  s = s.replace(/\. Free\./g, `. ${PAID}`);
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/ \./g, ".");
  return s;
}

function extraKeywordsFor(page) {
  if (SPECIAL[page.slug]?.extraKeywords) return SPECIAL[page.slug].extraKeywords;
  const kw = (page.keyword || "").toLowerCase();
  return [...new Set([kw, "pomodoro timer", "focus timer"].filter(Boolean))].slice(0, 5);
}

function titleCaseKeyword(kw) {
  return String(kw)
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part;
      const lower = part.toLowerCase();
      if (["and", "or", "vs", "for", "to", "of", "a", "an", "the", "with"].includes(lower)) return lower;
      if (lower === "adhd") return "ADHD";
      if (lower === "pomodoro") return "Pomodoro";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function keywordTitle(page) {
  if (SPECIAL[page.slug]?.title) return SPECIAL[page.slug].title;
  const kw = titleCaseKeyword(page.keyword || page.h1 || page.slug);
  const base = `${kw} — Pomodoro Timer | Superfocus`;
  return base.length > 62 ? `${kw.slice(0, 40)} | Superfocus` : base;
}

function applyPage(page) {
  const spec = SPECIAL[page.slug] || {};
  let next = walkStrings(page, sanitizeString);
  if (spec.keyword) next.keyword = spec.keyword;
  if (spec.h1) next.h1 = spec.h1;
  next.title = spec.title || keywordTitle(next);
  if (spec.description) next.description = spec.description;
  else next.description = sanitizeString(next.description || `${next.keyword} in Superfocus. ${PAID}`);
  if (!/1\.99|subscribe/i.test(next.description)) {
    next.description = `${next.description.replace(/\s+$/, "")} ${PAID}`.trim();
  }
  if (next.description.length > 158) next.description = `${next.description.slice(0, 155).trim()}…`;
  if (spec.keywords) next.keywords = spec.keywords;
  else next.keywords = extraKeywordsFor(next).join(", ");
  next.extraKeywords = extraKeywordsFor(next);
  if (spec.heroSubtitle) next.heroSubtitle = spec.heroSubtitle;
  else if (next.heroSubtitle) next.heroSubtitle = sanitizeString(next.heroSubtitle);
  if (spec.answer) next.answer = spec.answer;
  if (spec.faq) next.faq = spec.faq;
  if (spec.painSolution) next.painSolution = spec.painSolution;
  if (spec.longFormBlocks) next.longFormBlocks = spec.longFormBlocks;
  if (Array.isArray(next.faq)) {
    next.faq = next.faq.map((item) => {
      if (item?.q && /is superfocus free/i.test(item.q)) {
        return { q: item.q, a: `No. ${PAID} There is no guest timer.` };
      }
      return item;
    });
  }
  next.ctaLabel = "Subscribe";
  next.ctaHref = "/pricing";
  return next;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const pagesPath = path.join(ROOT, "pseo", "pages.json");
const pagesDoc = loadJson(pagesPath);
pagesDoc.pages = pagesDoc.pages.map(applyPage);
writeJson(pagesPath, pagesDoc);
console.log("updated pseo/pages.json", pagesDoc.pages.length);

const dbDir = path.join(ROOT, "pseo", "databases");
for (const name of fs.readdirSync(dbDir).filter((n) => n.endsWith(".json"))) {
  const filePath = path.join(dbDir, name);
  const db = loadJson(filePath);
  if (!Array.isArray(db.entries)) continue;
  if (name === "faq.json" && !db.entries.some((e) => e.slug === "how-to-focus")) {
    db.entries.push(HOW_TO_FOCUS_PAGE);
    console.log("added faq/how-to-focus");
  }
  db.entries = db.entries.map(applyPage);
  writeJson(filePath, db);
  console.log("updated", path.relative(ROOT, filePath), db.entries.length);
}

const tiersPath = path.join(ROOT, "pseo", "tiers.json");
const tiers = loadJson(tiersPath);
Object.assign(tiers.pages, {
  "faq/pomodoro-timer-online": "A",
  "faq/how-to-focus": "A",
  "faq/is-superfocus-free": "B",
  "sounds/focus-music": "A",
  "sounds/lofi-study-music": "A",
  "sounds/white-noise-focus": "A",
  "techniques/time-blocking-timer": "A",
  "use-cases/work-timer": "A",
  "use-cases/writing-timer": "A",
  "compare/pomodoro-timer-apps": "A",
});
writeJson(tiersPath, tiers);
console.log("updated pseo/tiers.json");
