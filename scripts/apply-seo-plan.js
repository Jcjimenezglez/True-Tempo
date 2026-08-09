#!/usr/bin/env node
/**
 * Apply SEO plan: tier fields, keyword-first titles, Tier A copy, Tier C enrichment.
 * Run: node scripts/apply-seo-plan.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_JSON = path.join(ROOT, 'pseo/pages.json');
const DATABASES_DIR = path.join(ROOT, 'pseo/databases');
const TIERS_JSON = path.join(ROOT, 'pseo/tiers.json');
const BLOG_POSTS = path.join(ROOT, 'pseo/blog/posts.json');

const tiers = JSON.parse(fs.readFileSync(TIERS_JSON, 'utf8'));

const TIER_A_COPY = {
  'techniques/pomodoro-technique': {
    title: 'Pomodoro Technique — Free 25/5 Timer Online | Superfocus',
    h1: 'Pomodoro Technique Timer (25/5)',
    heroSubtitle: 'Free Pomodoro technique timer with 25/5/15 cycles, ambient sounds, and task tracking—no download.',
    keywords: 'pomodoro technique, pomodoro technique 25/5, pomodoro timer online, pomodoro method',
    longFormBlocks: [
      '<h2>The Pomodoro Technique: history and rules</h2>',
      '<p>Francesco Cirillo developed the <strong>Pomodoro Technique</strong> in the late 1980s using a tomato-shaped kitchen timer. The method breaks work into focused intervals (traditionally <strong>25 minutes</strong>) separated by short breaks. After four pomodoros, take a longer 15-minute break.</p>',
      '<h2>Pomodoro technique 25/5 official rhythm</h2>',
      '<p>The classic cycle is <strong>25 minutes on, 5 minutes off</strong>, with a <strong>15-minute</strong> break after every four sessions. Superfocus ships this as the default Pomodoro preset—you can also switch to Sprint (15 min), Flow (45 min), or Deep Work (90 min) when 25/5 does not match your task.</p>',
      '<table style="width:100%; border-collapse: collapse; color: rgba(255,255,255,0.9); font-size: 0.95rem; margin: 1.5rem 0;"><tr style="border-bottom: 1px solid rgba(255,255,255,0.2);"><th style="text-align:left; padding:8px 0;">Method</th><th style="text-align:left; padding:8px 0;">Work</th><th style="text-align:left; padding:8px 0;">Break</th><th style="text-align:left; padding:8px 0;">Best for</th></tr><tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:8px 0;">Pomodoro</td><td>25 min</td><td>5 min</td><td>General tasks, studying</td></tr><tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:8px 0;">Sprint</td><td>15 min</td><td>3 min</td><td>Starting resistance, ADHD</td></tr><tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:8px 0;">Flow</td><td>45 min</td><td>8 min</td><td>Writing, coding</td></tr><tr><td style="padding:8px 0;">Deep Work</td><td>90 min</td><td>20 min</td><td>Hard problems</td></tr></table>'
    ]
  },
  'techniques/deep-work-timer': {
    title: 'Deep Work Timer Online — Free Focus Blocks | Superfocus',
    h1: 'Deep Work Timer Online',
    heroSubtitle: 'Free deep work timer with 52- and 90-minute presets, lofi sounds, and analytics. Easy to start—no download.',
    keywords: 'deep work timer, simple deep work timer, easy deep work timer, deep work timer online',
    longFormBlocks: [
      '<h2>Easy deep work timer setup</h2>',
      '<p>An <strong>easy deep work timer</strong> should take one click—not a 20-minute setup ritual. Open Superfocus, pick Deep Work (90 min) or the 52-minute preset, name your task, and start. Built-in lofi or rain helps mask noise without opening a second app.</p>',
      '<h2>Simple deep work timer presets</h2>',
      '<p>Cal Newport popularized <strong>deep work</strong> as uninterrupted focus on cognitively demanding tasks. Superfocus offers <strong>52-minute</strong> and <strong>90-minute</strong> blocks—long enough for real progress, short enough to schedule between meetings.</p>',
      '<p>Further reading: <a href="https://www.calnewport.com/books/deep-work/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Deep Work by Cal Newport</a>.</p>'
    ]
  },
  'use-cases/study-timer': {
    title: 'Study Timer Online — Free Pomodoro for Students | Superfocus',
    h1: 'Study Timer Online',
    heroSubtitle: 'Free study timer with Pomodoro presets for exams, reading, and flashcards. Ambient sounds and streak tracking included.',
    keywords: 'study timer, study timer online, pomodoro study timer, student focus timer',
    longFormBlocks: [
      '<h2>Study timer for exams</h2>',
      '<p>During exam season, a <strong>study timer</strong> turns vague “study all day” goals into finishable blocks. Run 25-minute Pomodoros on one topic—practice problems, essay outlines, or review notes—then take a real 5-minute break before the next subject.</p>',
      '<h2>Reading and flashcard sessions</h2>',
      '<p>For dense reading, try 45-minute Flow blocks. For flashcards, Sprint (15 min) keeps recall practice sharp without burnout. Track completed blocks in Superfocus analytics so you can see which subjects actually got time this week.</p>',
      '<p>Pair your study timer with our <a href="/use-cases/focus-website-for-studying" class="inline-text-link">focus website for studying</a> guide if you need a browser-based setup with sounds and tasks in one tab.</p>'
    ]
  },
  'use-cases/focus-timer': {
    title: 'Focus Timer Online — Free Pomodoro & Deep Work | Superfocus',
    h1: 'Focus Timer Online',
    heroSubtitle: 'Free focus timer for work and deep focus—Pomodoro, Flow, and Deep Work presets with tasks and analytics.',
    keywords: 'focus timer, focus timer online, online focus timer, pomodoro focus timer'
  },
  'use-cases/focus-website-for-studying': {
    title: 'Focus Website for Studying — Free Online Timer | Superfocus',
    h1: 'Focus Website for Studying',
    heroSubtitle: 'A focus website for studying with Pomodoro timer, lofi sounds, and task list—free in your browser, no download.',
    keywords: 'focus website for studying, study focus website, online study timer'
  },
  'compare/superfocus-vs-pomofocus': {
    title: 'Superfocus vs Pomofocus (2026) — Which Timer Is Better?',
    h1: 'Superfocus vs Pomofocus',
    heroSubtitle: 'Honest 2026 comparison: Pomofocus for minimal Pomodoro vs Superfocus for timer + sounds + tasks + analytics.',
    longFormBlocks: [
      '<h2>When Pomofocus is enough</h2>',
      '<p>If you only need a clean <strong>25-minute countdown</strong> with a task list and nothing else, <a href="https://pomofocus.io/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Pomofocus</a> is an excellent choice. It is fast, free, and stays out of your way.</p>',
      '<p>Choose Superfocus when you keep opening Spotify for lofi, a separate tab for tasks, or want streak analytics—timer, ambient cassettes, Todoist sync, and leaderboard in one browser tab.</p>'
    ],
    faq: [
      { q: 'Is Superfocus better than Pomofocus?', a: 'Superfocus adds built-in ambient sounds, deeper analytics, Todoist sync, and multiple timer presets. Pomofocus wins on minimalism if you only need a basic Pomodoro countdown.' },
      { q: 'Can I use both for free?', a: 'Yes. Both offer free browser tiers. Try each for one afternoon on real work before deciding.' },
      { q: 'Which has better sounds?', a: 'Superfocus includes lofi, rain, cafe, and white noise cassettes without leaving the timer. Pomofocus does not include ambient audio.' }
    ]
  },
  'alternatives/pomofocus': {
    title: 'Pomofocus Alternative — Free Pomodoro Timer with Sounds | Superfocus',
    h1: 'Pomofocus Alternative',
    heroSubtitle: 'Free Pomofocus alternative with built-in lofi sounds, task tracking, and analytics—same simplicity, more features.',
    keywords: 'pomofocus alternative, pomofocus alternative free, pomodoro timer with sounds'
  },
  'alternatives/best-pomodoro-apps': {
    title: 'Best Pomodoro Apps 2026 — Compared (Free & Online) | Superfocus',
    h1: 'Best Pomodoro Apps in 2026',
    heroSubtitle: 'Compared: Superfocus, Pomofocus, Forest, and Flocus—free tiers, sounds, tasks, and who each app fits.',
    keywords: 'best pomodoro app, best pomodoro apps 2026, best pomodoro timer',
    longFormBlocks: [
      '<h2>How we picked the best Pomodoro apps</h2>',
      '<p>We judged each app on <strong>timer flexibility</strong> (Pomodoro vs deep work), <strong>ambient sound</strong>, <strong>task integration</strong>, <strong>analytics</strong>, and <strong>free tier</strong> generosity—not marketing feature lists.</p>',
      '<p><strong>Superfocus</strong> fits browser-first workers who want timer + lofi + tasks. <strong>Pomofocus</strong> fits minimalists. <strong>Forest</strong> fits phone users who need gamification. <strong>Flocus</strong> fits aesthetic-focused study sessions.</p>'
    ]
  },
  'alternatives/hustly-focus': {
    title: 'Hustly Focus Alternative — Free Pomodoro + Lofi Timer | Superfocus',
    h1: 'Hustly Focus Alternative',
    heroSubtitle: 'Free Hustly Focus alternative with Pomodoro timer, lofi cassettes, tasks, and analytics in your browser.',
    keywords: 'hustly focus, hustly focus timer, hustly focus app, hustly focus alternative'
  },
  'faq/pomodoro-timer-online': {
    title: 'Pomodoro Timer Online — Free, No Download | Superfocus',
    h1: 'Pomodoro Timer Online',
    heroSubtitle: 'Free Pomodoro timer online—25/5 cycles, ambient sounds, no download. Start a live session in your browser now.',
    keywords: 'pomodoro timer online, live pomodoro, free pomodoro timer online'
  }
};

const TIER_B_TITLES = {
  'techniques/flowtime-timer': { title: 'Flowtime Timer Online — Flexible Focus Blocks | Superfocus', h1: 'Flowtime Timer Online' },
  'techniques/time-blocking-timer': { title: 'Time Blocking Timer Online — Schedule Focus Blocks | Superfocus', h1: 'Time Blocking Timer Online' },
  'techniques/sprint-timer': { title: 'Sprint Timer Online — 15-Minute Focus Blocks | Superfocus', h1: 'Sprint Timer Online' },
  'techniques/marathon-timer': { title: 'Marathon Timer Online — Long Focus Sessions | Superfocus', h1: 'Marathon Timer Online' },
  'techniques/52-minute-focus': { title: '52-Minute Focus Timer Online | Superfocus', h1: '52-Minute Focus Timer' },
  'techniques/90-minute-deep-work': { title: '90-Minute Deep Work Timer Online | Superfocus', h1: '90-Minute Deep Work Timer' },
  'use-cases/work-timer': { title: 'Work Timer Online — Free Pomodoro for Professionals | Superfocus', h1: 'Work Timer Online' },
  'use-cases/coding-focus-timer': { title: 'Coding Focus Timer — Pomodoro for Developers | Superfocus', h1: 'Coding Focus Timer' },
  'use-cases/writing-timer': { title: 'Writing Timer Online — Focus Blocks for Authors | Superfocus', h1: 'Writing Timer Online' },
  'use-cases/exam-prep-timer': { title: 'Exam Prep Timer — Study Blocks for Tests | Superfocus', h1: 'Exam Prep Timer' },
  'use-cases/adhd-focus-timer': { title: 'ADHD Focus Timer — Short Pomodoro Blocks | Superfocus', h1: 'ADHD Focus Timer' },
  'use-cases/student-productivity': { title: 'Student Productivity Timer — Free Study Focus | Superfocus', h1: 'Student Productivity Timer' },
  'use-cases/freelancer-productivity': { title: 'Freelancer Productivity Timer Online | Superfocus', h1: 'Freelancer Productivity Timer' },
  'use-cases/remote-work-focus': { title: 'Remote Work Focus Timer — Stay on Task at Home | Superfocus', h1: 'Remote Work Focus Timer' },
  'use-cases/deep-work-app': { title: 'Deep Work App Online — Free Focus Timer | Superfocus', h1: 'Deep Work App Online' },
  'use-cases/meeting-prep-timer': { title: 'Meeting Prep Timer — Focus Before Calls | Superfocus', h1: 'Meeting Prep Timer' },
  'sounds/focus-music': { title: 'Focus Music Timer — Lofi + Pomodoro Online | Superfocus', h1: 'Focus Music with Timer' },
  'sounds/lofi-study-music': { title: 'Lofi Study Music Timer Online | Superfocus', h1: 'Lofi Study Music Timer' },
  'sounds/rain-sounds-focus': { title: 'Rain Sounds Focus Timer Online | Superfocus', h1: 'Rain Sounds Focus Timer' },
  'sounds/cafe-ambient-sounds': { title: 'Cafe Ambient Sounds Timer Online | Superfocus', h1: 'Cafe Ambient Sounds Timer' },
  'sounds/white-noise-focus': { title: 'White Noise Focus Timer Online | Superfocus', h1: 'White Noise Focus Timer' },
  'workflows/todoist-pomodoro': { title: 'Todoist Pomodoro Timer — Sync Tasks & Focus | Superfocus', h1: 'Todoist Pomodoro Workflow' },
  'workflows/task-planning-workflow': { title: 'Task Planning Workflow — Pomodoro + Tasks | Superfocus', h1: 'Task Planning Workflow' },
  'analytics/productivity-analytics': { title: 'Productivity Analytics — Focus Time Tracking | Superfocus', h1: 'Productivity Analytics' },
  'analytics/focus-time-tracking': { title: 'Focus Time Tracking — Pomodoro Analytics | Superfocus', h1: 'Focus Time Tracking' },
  'analytics/pomodoro-statistics': { title: 'Pomodoro Statistics — Session History & Streaks | Superfocus', h1: 'Pomodoro Statistics' },
  'compare/superfocus-vs-forest': { title: 'Superfocus vs Forest (2026) — Timer Compared | Superfocus', h1: 'Superfocus vs Forest' },
  'compare/superfocus-vs-flocus': { title: 'Superfocus vs Flocus (2026) — Study Timer Compared | Superfocus', h1: 'Superfocus vs Flocus' },
  'compare/superfocus-vs-focusmate': { title: 'Superfocus vs Focusmate (2026) — Accountability Compared | Superfocus', h1: 'Superfocus vs Focusmate' },
  'compare/pomodoro-timer-apps': { title: 'Pomodoro Timer Apps Compared (2026) | Superfocus', h1: 'Pomodoro Timer Apps Compared' },
  'alternatives/forest-app': { title: 'Forest App Alternative — Free Browser Focus Timer | Superfocus', h1: 'Forest App Alternative' },
  'compare/superfocus-vs-brain-fm': { title: 'Superfocus vs Brain.fm (2026) — Timer + Music Compared', h1: 'Superfocus vs Brain.fm' },
  'compare/superfocus-vs-be-focused': { title: 'Superfocus vs Be Focused (2026) — Pomodoro Compared', h1: 'Superfocus vs Be Focused' },
  'compare/superfocus-vs-marinara': { title: 'Superfocus vs Marinara Timer (2026) | Superfocus', h1: 'Superfocus vs Marinara Timer' },
  'compare/superfocus-vs-focus-keeper': { title: 'Superfocus vs Focus Keeper (2026) | Superfocus', h1: 'Superfocus vs Focus Keeper' },
  'compare/superfocus-vs-ticktick': { title: 'Superfocus vs TickTick Pomodoro (2026) | Superfocus', h1: 'Superfocus vs TickTick' },
  'compare/superfocus-vs-clockify': { title: 'Superfocus vs Clockify (2026) — Focus vs Time Tracking', h1: 'Superfocus vs Clockify' },
  'compare/superfocus-vs-noisli': { title: 'Superfocus vs Noisli (2026) — Sounds + Timer Compared', h1: 'Superfocus vs Noisli' },
  'alternatives/brain-fm-alternative': { title: 'Brain.fm Alternative — Timer + Focus Music | Superfocus', h1: 'Brain.fm Alternative' },
  'alternatives/be-focused-alternative': { title: 'Be Focused Alternative — Free Pomodoro Timer | Superfocus', h1: 'Be Focused Alternative' },
  'alternatives/marinara-alternative': { title: 'Marinara Timer Alternative — Free Online Pomodoro | Superfocus', h1: 'Marinara Timer Alternative' },
  'alternatives/focus-keeper-alternative': { title: 'Focus Keeper Alternative — Browser Pomodoro | Superfocus', h1: 'Focus Keeper Alternative' },
  'alternatives/ticktick-pomodoro-alternative': { title: 'TickTick Pomodoro Alternative — Free Timer | Superfocus', h1: 'TickTick Pomodoro Alternative' },
  'alternatives/flocus-alternative': { title: 'Flocus Alternative — Free Study Focus Timer | Superfocus', h1: 'Flocus Alternative' },
  'alternatives/focusmate-alternative': { title: 'Focusmate Alternative — Solo Focus Timer | Superfocus', h1: 'Focusmate Alternative' },
  'alternatives/noisli-alternative': { title: 'Noisli Alternative — Ambient Sounds + Timer | Superfocus', h1: 'Noisli Alternative' }
};

const FAQ_ENRICH = {
  'faq/how-long-pomodoro-session': {
    tier: 'B',
    title: 'How Long Should a Pomodoro Be? — Timer Length Guide | Superfocus',
    h1: 'How Long Should a Pomodoro Be?',
    longFormBlocks: [
      '<p>The standard Pomodoro is <strong>25 minutes</strong>, but the best length depends on your task and attention span. Students often use 25 min; developers in flow may prefer 45–90 min.</p>',
      '<p>Superfocus lets you switch presets without changing apps—try Sprint (15), Pomodoro (25), Flow (45), or Deep Work (90) and track which length produces the most finished blocks.</p>'
    ]
  },
  'faq/is-superfocus-free': {
    tier: 'B',
    title: 'Is Superfocus Free? — Pricing & Free Tier Explained | Superfocus',
    h1: 'Is Superfocus Free?',
    longFormBlocks: [
      '<p>Yes. Superfocus is <strong>free to start</strong> in your browser. Free accounts get 2 hours of focus per day; guests can run one 25-minute session without signing up. Premium unlocks unlimited focus and all timer techniques.</p>'
    ]
  },
  'faq/pomodoro-for-adhd': {
    tier: 'B',
    title: 'Pomodoro for ADHD — Shorter Focus Blocks | Superfocus',
    h1: 'Pomodoro for ADHD',
    longFormBlocks: [
      '<p>Many people with ADHD find <strong>15-minute Sprint blocks</strong> easier than 25-minute Pomodoros. The goal is momentum, not perfect adherence—finish one short block, take a real break, repeat.</p>',
      '<p>Pair shorter timers with ambient sound to reduce environmental distractions. Superfocus Sprint preset is built for this pattern.</p>'
    ]
  },
  'faq/focus-timer-with-sounds': {
    tier: 'B',
    title: 'Focus Timer with Sounds — Lofi & Ambient Online | Superfocus',
    h1: 'Focus Timer with Sounds',
    longFormBlocks: [
      '<p>A <strong>focus timer with sounds</strong> keeps countdown and audio in one tab—no switching to Spotify mid-session. Superfocus cassettes include lofi, rain, cafe, and white noise.</p>'
    ]
  },
  'faq/best-pomodoro-length': {
    tier: 'B',
    title: 'Best Pomodoro Length — 15, 25, or 45 Minutes? | Superfocus',
    h1: 'Best Pomodoro Length',
    longFormBlocks: [
      '<p>There is no universal best length—<strong>25 minutes</strong> is the classic default, <strong>15 minutes</strong> helps when starting is hard, and <strong>45–90 minutes</strong> suits deep creative work. Test one week per preset and compare finished blocks in analytics.</p>'
    ]
  },
  'faq/pomodoro-break-length': {
    tier: 'B',
    title: 'Pomodoro Break Length — How Long to Rest | Superfocus',
    h1: 'Pomodoro Break Length',
    longFormBlocks: [
      '<p>Standard breaks are <strong>5 minutes</strong> after each Pomodoro and <strong>15 minutes</strong> after four cycles. Step away from the screen—walk, stretch, hydrate. Skipping breaks usually reduces total output by hour three.</p>'
    ]
  },
  'faq/pomodoro-vs-flowtime': {
    tier: 'B',
    title: 'Pomodoro vs Flowtime — Which Timer Method Fits You? | Superfocus',
    h1: 'Pomodoro vs Flowtime',
    longFormBlocks: [
      '<p><strong>Pomodoro</strong> uses fixed 25-minute blocks with scheduled breaks—great for structured tasks and studying. <strong>Flowtime</strong> uses longer work periods (often 45+ minutes) with flexible breaks—better when interruptions kill deep work.</p>',
      '<p>Superfocus includes both presets. Try Pomodoro for a week, then Flow, and compare finished blocks in analytics.</p>'
    ]
  },
  'faq/how-many-pomodoros-per-day': {
    tier: 'B',
    title: 'How Many Pomodoros Per Day? — Realistic Targets | Superfocus',
    h1: 'How Many Pomodoros Per Day?',
    longFormBlocks: [
      '<p>Most knowledge workers sustain <strong>8–12 Pomodoros</strong> (4–6 hours of focused work) on a good day. Start with <strong>4 Pomodoros</strong> and increase only when you consistently finish blocks without skipping breaks.</p>'
    ]
  },
  'faq/how-to-enter-flow-state': {
    tier: 'B',
    title: 'How to Enter Flow State — Focus Timer Guide | Superfocus',
    h1: 'How to Enter Flow State',
    longFormBlocks: [
      '<p>Flow needs a clear goal, immediate feedback, and uninterrupted time—usually <strong>45–90 minutes</strong>. Remove notifications, pick one task, start a Flow or Deep Work preset, and use ambient sound to block distractions.</p>',
      '<p>See also: <a href="/techniques/flowtime-timer" class="inline-text-link">Flowtime timer</a> and <a href="/techniques/deep-work-timer" class="inline-text-link">deep work timer</a>.</p>'
    ]
  }
};

const TIER_C_FAMILIES = new Set(['goals', 'professions', 'activities', 'study-types', 'durations']);

function keywordTitle(keyword) {
  const k = keyword.replace(/\b\w/g, c => c.toUpperCase());
  return `${k} — Free Online Timer | Superfocus`;
}

function applyToEntry(entry) {
  const key = `${entry.category}/${entry.slug}`;
  const tier = tiers.pages[key] || 'B';
  entry.tier = tier;

  if (TIER_A_COPY[key]) {
    Object.assign(entry, TIER_A_COPY[key]);
  } else if (TIER_B_TITLES[key]) {
    Object.assign(entry, TIER_B_TITLES[key]);
    if (!entry.heroSubtitle || entry.heroSubtitle.includes('?')) {
      entry.heroSubtitle = entry.description;
    }
  }

  return entry;
}

function enrichTierC(entry, family) {
  const key = `${entry.category}/${entry.slug}`;

  if (FAQ_ENRICH[key]) {
    Object.assign(entry, FAQ_ENRICH[key]);
    tiers.pages[key] = 'B';
    return;
  }

  const soundBlocks = {
    'sounds/focus-music': '<p>Combine <strong>focus music</strong> with a Pomodoro or Flow preset so audio and timer stay synchronized. Start the cassette once per session—changing tracks mid-block breaks focus.</p>',
    'sounds/lofi-study-music': '<p><strong>Lofi study music</strong> masks chatter without lyrical distraction. Pair with 25- or 45-minute blocks depending on whether you are reviewing or writing.</p>',
    'sounds/rain-sounds-focus': '<p><strong>Rain sounds</strong> work well for reading and coding—steady noise without melody. Use with Deep Work when you need a long uninterrupted block.</p>',
    'sounds/cafe-ambient-sounds': '<p><strong>Cafe ambient sounds</strong> simulate a coffee-shop hum—useful when silence feels too loud. Keep volume low; the timer should stay primary.</p>',
    'sounds/white-noise-focus': '<p><strong>White noise</strong> blocks irregular interruptions (traffic, office chatter). Superfocus white noise cassette runs alongside any timer preset.</p>'
  };
  if (soundBlocks[key]) {
    entry.longFormBlocks = [`<h2>Using ${entry.keyword || entry.slug}</h2>`, soundBlocks[key]];
    return;
  }

  // Add draft longFormBlocks to Tier C pages without promoting (promote manually when ≥600 words)
  if (entry.tier === 'C' && family && TIER_C_FAMILIES.has(family)) {
    const kw = entry.keyword || entry.slug.replace(/-/g, ' ');
    if (!entry.longFormBlocks) {
      entry.longFormBlocks = [
        `<h2>${kw.charAt(0).toUpperCase() + kw.slice(1)} with a focus timer</h2>`,
        `<p>Use a dedicated <strong>${kw}</strong> session with Superfocus: name one outcome, pick a preset (Pomodoro 25 min or Flow 45 min), optionally start ambient sound, and finish the block before checking messages.</p>`,
        `<p>Track completed sessions in analytics. Three honest blocks per day beats an unstructured eight-hour “busy” day.</p>`,
        `<p>Related: <a href="/use-cases/study-timer" class="inline-text-link">study timer</a> · <a href="/techniques/pomodoro-technique" class="inline-text-link">Pomodoro technique</a> · <a href="/use-cases/focus-timer" class="inline-text-link">focus timer</a></p>`
      ];
    }
    if (!TIER_B_TITLES[key] && !TIER_A_COPY[key]) {
      entry.title = keywordTitle(kw);
      entry.h1 = kw.charAt(0).toUpperCase() + kw.slice(1);
    }
  }
}

const pagesData = JSON.parse(fs.readFileSync(PAGES_JSON, 'utf8'));
pagesData.pages = pagesData.pages.map(p => {
  const e = applyToEntry(p);
  enrichTierC(e, null);
  return e;
});
fs.writeFileSync(PAGES_JSON, JSON.stringify(pagesData, null, 2) + '\n');

for (const file of fs.readdirSync(DATABASES_DIR).filter(f => f.endsWith('.json'))) {
  const fp = path.join(DATABASES_DIR, file);
  const db = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const family = db.family || file.replace('.json', '');
  db.entries = (db.entries || []).map(e => {
    const entry = applyToEntry(e);
    enrichTierC(entry, family);
    return entry;
  });
  fs.writeFileSync(fp, JSON.stringify(db, null, 2) + '\n');
}

fs.writeFileSync(TIERS_JSON, JSON.stringify(tiers, null, 2) + '\n');

const posts = JSON.parse(fs.readFileSync(BLOG_POSTS, 'utf8'));
for (const post of posts) {
  if (post.slug === 'pomofocus-vs-superfocus') {
    post.canonicalTo = 'https://www.superfocus.live/compare/superfocus-vs-pomofocus';
  }
  if (post.slug === 'best-pomodoro-timers-2026') {
    post.canonicalTo = 'https://www.superfocus.live/alternatives/best-pomodoro-apps';
  }
}
fs.writeFileSync(BLOG_POSTS, JSON.stringify(posts, null, 2) + '\n');

const counts = { A: 0, B: 0, C: 0 };
Object.values(tiers.pages).forEach(t => counts[t]++);
console.log('Applied SEO plan. Tiers:', counts);
