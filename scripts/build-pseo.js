#!/usr/bin/env node
/**
 * Build script for pSEO pages.
 * Uses pseo/template.html (lightweight landing) + pseo/content-section.html.
 * Loads pages.json (Phase 1) + pseo/databases/*.json (Phase 2A).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PSEO_DIR = path.join(ROOT, 'pseo');
const PAGES_JSON = path.join(PSEO_DIR, 'pages.json');
const DATABASES_DIR = path.join(PSEO_DIR, 'databases');
const TEMPLATE_PATH = path.join(PSEO_DIR, 'template.html');
const CONTENT_SECTION_PATH = path.join(PSEO_DIR, 'content-section.html');
const MANIFEST_PATH = path.join(ROOT, 'dist', 'asset-manifest.json');
const BASE_URL = 'https://www.superfocus.live';

const CATEGORY_LABELS = {
  techniques: 'Techniques',
  'use-cases': 'Use Cases',
  sounds: 'Sounds',
  workflows: 'Workflows',
  analytics: 'Analytics',
  compare: 'Compare',
  alternatives: 'Alternatives',
  professions: 'Professions',
  activities: 'Activities',
  faq: 'FAQ',
  goals: 'Goals'
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadAssetManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return loadJson(MANIFEST_PATH);
    } catch (_) { /* fall through */ }
  }
  return {
    style: '/style.css',
    scriptLanding: '/script-landing.js'
  };
}

function loadAllPages() {
  const phase1 = loadJson(PAGES_JSON);
  const slugs = new Set(phase1.pages.map(p => p.slug));
  const pages = [...phase1.pages];

  if (fs.existsSync(DATABASES_DIR)) {
    const dbFiles = fs.readdirSync(DATABASES_DIR).filter(f => f.endsWith('.json'));
    for (const file of dbFiles) {
      const db = loadJson(path.join(DATABASES_DIR, file));
      for (const entry of db.entries || []) {
        if (slugs.has(entry.slug)) continue;
        slugs.add(entry.slug);
        pages.push(normalizeDatabaseEntry(entry));
      }
    }
  }
  return pages;
}

function normalizeDatabaseEntry(entry) {
  const page = { ...entry };
  if (page.related && Array.isArray(page.related)) {
    page.related = page.related.map(url => url.startsWith('/') ? url : `/${page.category}/${url}`);
  }
  return page;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getHeroSubtitle(page) {
  return page.heroSubtitle || page.description;
}

function getStopPain(page) {
  if (page.painPoints) return page.painPoints;
  const cat = page.category;
  const pains = {
    techniques: 'Sit down to work—but drift within minutes?<br>Timer on, task still untouched?<br>Hours pass with nothing to show?',
    'use-cases': 'Planned to focus—but Slack won?<br>Meetings ate the morning, email the afternoon?<br>Real work still waiting for tomorrow?',
    sounds: 'Silence too loud, music too distracting?<br>Searching playlists instead of working?<br>Still can\'t get into focus mode?',
    workflows: 'Tasks listed but none started?<br>Todo list full, output empty?<br>Planning without doing—again?',
    analytics: 'Worked all week but can\'t prove it?<br>No idea which hours were productive?<br>Same patterns, no improvement?',
    compare: 'Timer in one tab, music in another?<br>Tasks somewhere else entirely?<br>Focus scattered across five apps?',
    alternatives: 'Current app missing key features?<br>Juggling three tools just to focus?<br>Still not sure you\'re improving?',
    professions: 'Back-to-back calls, zero deep work?<br>Important hours slipping away?<br>End of day, nothing shipped?',
    activities: 'Task on the list for days?<br>Start strong, drift within minutes?<br>Busy all day, nothing crossed off?',
    faq: 'Read ten articles, still unsure?<br>Tried hacks that don\'t stick?<br>Still can\'t focus for one block?',
    goals: 'Said you\'d focus better this week?<br>Distractions won by Tuesday?<br>Same goal, same result?'
  };
  return pains[cat] || pains.techniques;
}

function getStopSolution(page) {
  if (page.painSolution) return page.painSolution;
  const cat = page.category;
  const sols = {
    techniques: 'Set one block. One task. Timer running.<br>Track every session, break, and streak.<br>All in one place.',
    'use-cases': 'Block the time before someone else does.<br>Track every session, task, and streak.<br>All in one place.',
    sounds: 'One click. Sounds + timer together.<br>Track every session, sound, and streak.<br>All in one place.',
    workflows: 'Pick a task. Assign a pomodoro.<br>Sync every block, task, and streak.<br>All in one place.',
    analytics: 'Every session logged automatically.<br>Track focus time, streaks, and trends.<br>All in one place.',
    compare: 'Timer, sounds, tasks, analytics—together.<br>Track every session and streak.<br>All in one place.',
    alternatives: 'Same simplicity. More built in.<br>Track every block, task, and streak.<br>All in one place.',
    professions: 'Block 25 minutes before the inbox wins.<br>Track every session, task, and hour.<br>All in one place.',
    activities: 'Name the task. Start the timer.<br>Track every block and streak.<br>All in one place.',
    faq: 'Clear answer. Timer that works.<br>Track every session, task, and streak.<br>All in one place.',
    goals: 'One block today. Timer on.<br>Track every session, streak, and habit.<br>All in one place.'
  };
  return sols[cat] || sols.techniques;
}

function getHowWeHelp(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const defaults = {
    techniques: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Track every pomodoro block, task, ambient sound, focus streak, and analytics report in one place.',
      blocks: [
        { title: 'Stay in flow', text: '25-minute blocks match your attention span. Start, work, break, repeat. No decision fatigue.' },
        { title: 'Block distractions', text: 'Queue your work. Block noise with ambient sound. Get into deep work without scroll or ping.' },
        { title: 'See progress', text: 'Track focus time and streaks. Compete with others. Build lasting habits.' }
      ]
    },
    'use-cases': {
      title: `How Superfocus helps you <em>${keyword.replace(/ timer$/i, '')}</em>`,
      tagline: 'Track every focus block, task, ambient sound, session streak, and progress report in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Pomodoro, Flow, or Deep Work presets. Pick your block length. Focus without deciding.' },
        { title: 'Block distractions', text: 'Ambient sounds and focus music. Block noise. Enter flow faster.' },
        { title: 'See progress', text: 'Track sessions and streaks. Stay motivated. Build habits that stick.' }
      ]
    },
    sounds: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Play every lofi track, rain loop, cafe ambience, white noise, and focus timer in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Built-in cassettes plus your Spotify playlists. One click to block the world.' },
        { title: 'Block distractions', text: 'Ambient sound masks office noise and chatter. Concentrate without earbuds.' },
        { title: 'See progress', text: 'Pair sounds with any timer. Track focus time. Build lasting focus habits.' }
      ]
    },
    workflows: {
      title: 'How Superfocus helps your <em>workflow</em>',
      tagline: 'Sync every Todoist task, pomodoro block, focus streak, ambient sound, and session log in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Sync with Todoist. Assign pomodoros to tasks. Work in blocks.' },
        { title: 'Block distractions', text: 'Queue tasks. Block noise. Focus on one thing at a time.' },
        { title: 'See progress', text: 'Track pomodoros per task. Spot patterns. Improve estimates.' }
      ]
    },
    analytics: {
      title: 'How Superfocus helps you <em>see progress</em>',
      tagline: 'Track every focus session, pomodoro block, streak, weekly report, and leaderboard rank in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Daily, weekly, monthly focus time. See your patterns at a glance.' },
        { title: 'Block distractions', text: 'Track streaks. Build accountability. Stay consistent.' },
        { title: 'See progress', text: 'Premium analytics show deep work hours. Improve over time.' }
      ]
    },
    compare: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Get every timer, ambient sound, task, analytics report, and leaderboard streak in one place.',
      blocks: [
        { title: 'Stay in flow', text: '25-minute blocks or longer. Pomodoro, Flow, Deep Work. Pick what fits.' },
        { title: 'Block distractions', text: 'Lofi, rain, cafe. Ambient cassettes. Spotify integration.' },
        { title: 'See progress', text: 'Task tracking. Analytics. Leaderboard. One app, no juggling.' }
      ]
    },
    alternatives: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Get every timer, ambient sound, task, analytics report, and leaderboard streak in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Timers that match your style. Short sprints or long deep work.' },
        { title: 'Block distractions', text: 'Ambient sounds built in. No separate app needed.' },
        { title: 'See progress', text: 'Tasks, analytics, leaderboard. All included. Free to start.' }
      ]
    },
    professions: {
      title: `How Superfocus helps <em>${keyword.replace(/ focus timer for /i, '').replace(/s$/, 's')}</em>`,
      tagline: 'Track every billable block, client task, ambient sound, focus streak, and hours report in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Pomodoro, Flow, or Deep Work. Pick your block length. Focus without deciding.' },
        { title: 'Block distractions', text: 'Ambient sounds and focus music. Block noise. Enter flow faster.' },
        { title: 'See progress', text: 'Track sessions and streaks. Stay motivated. Build habits that stick.' }
      ]
    },
    activities: {
      title: `How Superfocus helps you <em>${keyword.replace(/ focus timer for /i, '').replace(/ timer$/i, '')}</em>`,
      tagline: 'Block every focus session, timer, task, ambient sound, and streak counter in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Pomodoro or Flow presets. Short sprints or long blocks. Match the activity.' },
        { title: 'Block distractions', text: 'Lofi, rain, cafe. Ambient cassettes. Focus without scroll or ping.' },
        { title: 'See progress', text: 'Track sessions per task. Spot patterns. Improve over time.' }
      ]
    },
    faq: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Run every pomodoro block, task, ambient sound, focus streak, and analytics report in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Pomodoro, Flow, Sprint, Deep Work. Pick what fits.' },
        { title: 'Block distractions', text: 'Lofi, rain, cafe. Ambient cassettes. Spotify integration.' },
        { title: 'See progress', text: 'Task tracking. Analytics. Leaderboard. All included.' }
      ]
    },
    goals: {
      title: `How Superfocus helps you <em>${keyword.replace(/ timer$/i, '').replace(/-/g, ' ')}</em>`,
      tagline: 'Track every focus block, task, ambient sound, session streak, and habit log in one place.',
      blocks: [
        { title: 'Stay in flow', text: 'Timers that match your goal. Pomodoro, Flow, or Deep Work.' },
        { title: 'Block distractions', text: 'Ambient sounds. Block noise. Enter flow state faster.' },
        { title: 'See progress', text: 'Track sessions. Build habits. Achieve your focus goals.' }
      ]
    }
  };
  return defaults[cat] || defaults.techniques;
}

function getFaqData(page) {
  const category = page.category;
  const keyword = page.keyword;
  const preset = page.preset || 'Pomodoro';
  const competitor = page.competitor;
  if (Array.isArray(page.faq) && page.faq.length > 0) {
    return page.faq.map(f => ({ q: f.q, a: f.a }));
  }

  const faqByCat = {
    techniques: [
      { q: `What is the best ${keyword}?`, a: `Superfocus includes a ready-made ${escapeHtml(preset)} preset for ${keyword}, plus ambient sounds and task tracking. Start free in your browser.` },
      { q: `How long should ${keyword} sessions be?`, a: `It depends on the method. Pomodoro uses 25/5; Flowtime uses longer blocks; Deep Work often uses 90 minutes. Superfocus presets cover each approach so you can test what fits.` },
      { q: `Can I customize ${keyword} in Superfocus?`, a: `Yes. Use built-in presets or set custom focus and break lengths. Pair any timer with lofi, rain, or cafe sounds.` }
    ],
    'use-cases': [
      { q: `What is the best ${keyword}?`, a: `A ${keyword} that keeps structure and reduces friction. Superfocus pairs ${escapeHtml(preset)} with ambient sounds and tasks so you start in seconds—free in the browser.` },
      { q: `Is Superfocus good as a ${keyword}?`, a: `Yes. Students and professionals use Superfocus for focused blocks with breaks, sounds, and session tracking without installing an app.` },
      { q: `Do I need an account for a ${keyword}?`, a: `Guests can try a short focus block. A free account unlocks more daily focus time; Premium removes limits and unlocks full analytics.` }
    ],
    sounds: [
      { q: `Does Superfocus include ${keyword}?`, a: `Yes. Superfocus ships ambient cassettes (lofi, rain, cafe) and Spotify playlist support so sound and timer stay in one tab.` },
      { q: `Can I use ${keyword} with Pomodoro?`, a: `Yes. Start any preset—Pomodoro, Flow, Deep Work—and layer ambient sound or Spotify on top.` },
      { q: `Is focus music better than silence?`, a: `Many people focus better with steady ambient sound that masks interruptions. Superfocus lets you switch cassettes without leaving the timer.` }
    ],
    compare: [
      { q: competitor ? `Which is better: Superfocus or ${competitor}?` : `How does Superfocus compare?`, a: competitor ? `Superfocus adds ambient sounds, Todoist sync, analytics, and multiple presets (Pomodoro, Flow, Deep Work). ${competitor} has its own strengths—try Superfocus free to compare side by side.` : `Superfocus combines a Pomodoro timer with sounds, tasks, and analytics in one browser app. Compare features on this page, then start free.` },
      { q: `Does Superfocus replace ${competitor || 'other timers'}?`, a: `For many people, yes—if you want timer + sounds + tasks together. Keep ${competitor || 'your current tool'} if you only need its unique feature.` },
      { q: `Is Superfocus free to try?`, a: `Yes. Start in the browser with no credit card. Free users get daily focus time; Premium unlocks unlimited sessions and full reports.` }
    ],
    alternatives: [
      { q: `What is the best ${keyword}?`, a: `Look for the same core timer plus the extras you were missing. Superfocus keeps a simple Pomodoro and adds sounds, tasks, and analytics—free to try.` },
      { q: competitor ? `Why switch from ${competitor} to Superfocus?` : `Why choose Superfocus?`, a: `One tab for timer, ambient sound, and task tracking—instead of juggling separate apps. Start free and keep what works.` },
      { q: `Is Superfocus free?`, a: `Yes. Guests and free accounts can start focusing immediately. Premium adds unlimited focus and deeper analytics.` }
    ],
    workflows: [
      { q: `How does Superfocus help with ${keyword}?`, a: `Connect your tasks, assign pomodoros, and run the timer without leaving the page. Todoist sync is available so planning and focus stay linked.` },
      { q: `Do I need Todoist?`, a: `No. Use Superfocus tasks alone, or sync Todoist if that is already your list.` },
      { q: `Can I estimate pomodoros per task?`, a: `Yes. Add tasks, set estimates, select one, and start the timer—same flow as classic Pomodoro planning.` }
    ],
    analytics: [
      { q: `What ${keyword} does Superfocus show?`, a: `Session history, focus time, and streaks so you see whether your ${keyword} is improving week over week. Premium unlocks fuller reports.` },
      { q: `Do free users get analytics?`, a: `Basic progress is available; Premium unlocks richer daily, weekly, and monthly views.` },
      { q: `Can I export focus history?`, a: `Premium plans include report options so you can review focus history outside the app.` }
    ],
    professions: [
      { q: `Is Superfocus a good ${keyword}?`, a: `Yes. Block deep work between meetings with Pomodoro, Flow, or Deep Work presets—and keep ambient sound in the same tab.` },
      { q: `Can I track focus for client work?`, a: `Log sessions and tasks as you go. Analytics help you see where focused hours actually went.` },
      { q: `Does it work on desktop?`, a: `Superfocus runs in the browser on desktop—ideal when phone focus apps are the wrong tool.` }
    ],
    activities: [
      { q: `How do I use Superfocus for ${keyword}?`, a: `Pick a preset that matches the task length, start the timer, and optionally add ambient sound so ${keyword} stays in one block.` },
      { q: `What preset should I use?`, a: `Short admin bursts fit Sprint; writing or coding often fits Pomodoro or Flow. Try ${escapeHtml(preset)} first.` },
      { q: `Can I batch similar tasks?`, a: `Yes. List tasks, assign pomodoros, and work through them in focused rounds.` }
    ],
    goals: [
      { q: `How does Superfocus help me ${keyword.replace(/ timer$/i, '').replace(/-/g, ' ')}?`, a: `Structure beats willpower. Use timed blocks, breaks, and session tracking so the goal becomes a daily habit—not a vague intention.` },
      { q: `What timer should I start with?`, a: `Begin with ${escapeHtml(preset)}. Adjust length after a few days of real data.` },
      { q: `Is Superfocus free for this goal?`, a: `Yes. Start free in the browser; upgrade only if you need unlimited focus and full analytics.` }
    ],
    faq: [
      { q: page.h1 || `About ${keyword}`, a: page.answer || page.description || `Superfocus is a free browser Pomodoro timer with ambient sounds and tasks.` },
      { q: `How do I try this in Superfocus?`, a: `Open superfocus.live, pick a preset, and start. No install required.` },
      { q: `Is Superfocus free?`, a: `Yes. Guests get a short daily trial; free accounts get more focus time; Premium removes limits.` }
    ]
  };

  const baseFaq = faqByCat[category] || faqByCat['use-cases'];
  if (category === 'faq' && page.h1 && page.answer) {
    return [{ q: page.h1, a: page.answer }, ...baseFaq.slice(1)];
  }
  return baseFaq;
}

function getHowToStepTexts(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const preset = page.preset || 'Pomodoro';
  if (cat === 'sounds') {
    return [
      `Open Superfocus and pick a timer preset (${preset})`,
      `Select a cassette for ${keyword} (or add Spotify)`,
      'Press start and keep sound + timer in one tab'
    ];
  }
  if (cat === 'workflows') {
    return [
      'Add today\'s tasks in Superfocus (or sync Todoist)',
      'Assign estimate pomodoros to each task',
      `Select a task, start ${preset}, and work the list`
    ];
  }
  if (cat === 'analytics') {
    return [
      'Sign up free and complete a few focus sessions',
      'Keep using the same preset so patterns are comparable',
      'Open analytics to review focus time, streaks, and trends'
    ];
  }
  if (cat === 'compare' || cat === 'alternatives') {
    return [
      'Skim the feature differences on this page',
      'Open Superfocus in your browser (no download)',
      `Run one ${preset} session with sounds and tasks enabled`
    ];
  }
  if (cat === 'faq') {
    return [
      'Go to superfocus.live (no signup required to try)',
      `Pick a preset that matches the answer (${preset})`,
      'Start the timer and focus on one task'
    ];
  }
  if (cat === 'techniques') {
    return [
      `Choose the ${keyword} approach (or the ${preset} preset)`,
      'Add one task and start the focus block',
      'Take the recommended break, then repeat',
      'After a few rounds, review what length actually worked'
    ];
  }
  if (cat === 'use-cases' || cat === 'study-types' || cat === 'professions' || cat === 'activities' || cat === 'goals') {
    return [
      `Set up your ${keyword} session with the ${preset} preset`,
      'Optionally start ambient sound to reduce distractions',
      'Work until the timer ends, then take the break',
      'Log the session and queue the next block'
    ];
  }
  return [
    'Pick your task',
    `Start ${preset} and focus until the timer ends`,
    'Take a short break',
    'Repeat until the work is done'
  ];
}

function buildJsonLd(page, canonicalPath) {
  const schemas = [];
  const pageUrl = BASE_URL + canonicalPath;
  const categoryLabel = CATEGORY_LABELS[page.category] || page.category;

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: pageUrl,
    isPartOf: { '@type': 'WebSite', name: 'Superfocus', url: BASE_URL }
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${BASE_URL}/${page.category}` },
      { '@type': 'ListItem', position: 3, name: stripHtml(page.h1), item: pageUrl }
    ]
  });

  if (page.category === 'faq') {
    const faqItems = getFaqData(page);
    if (faqItems.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(f => ({
          '@type': 'Question',
          name: stripHtml(f.q),
          acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) }
        }))
      });
    }
  }

  if (page.category === 'compare' || page.category === 'alternatives') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Superfocus',
      url: BASE_URL,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web Browser',
      featureList: [
        'Pomodoro timer presets',
        'Ambient focus cassettes (lofi, rain, cafe)',
        'Task tracking and Todoist sync',
        'Productivity analytics and leaderboard'
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    });
  }

  if (page.category === 'techniques' || page.category === 'use-cases') {
    const steps = getHowToStepTexts(page);
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: getHowToHeading(page),
      description: page.description,
      step: steps.map((text, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: text,
        text
      }))
    });
  }

  return schemas
    .map(s => `    <script type="application/ld+json">\n${JSON.stringify(s, null, 4)}\n    </script>`)
    .join('\n');
}

function getPresetSection(page) {
  const preset = page.preset || 'Pomodoro (25/5/15 min)';
  const kw = escapeHtml(page.keyword || page.slug);
  const cat = page.category;
  if (cat === 'faq') {
    return `<h2>Timer preset for this answer</h2>
            <p>Try <strong>${escapeHtml(preset)}</strong> in Superfocus. You can also switch among Pomodoro, Flow, Sprint, Deep Work, and Marathon, and add lofi, rain, or cafe sound if the room fights your attention. <a href="https://www.superfocus.live/" class="inline-text-link">Open the free timer</a>.</p>`;
  }
  if (cat === 'compare' || cat === 'alternatives') {
    return `<h2>Try the comparison in a real session</h2>
            <p>Open Superfocus and run <strong>${escapeHtml(preset)}</strong> on a task you would normally do in ${kw}. Judge the tool by finished blocks—not by feature checklists alone.</p>`;
  }
  if (cat === 'sounds') {
    return `<h2>Pair ${kw} with a preset</h2>
            <p>Start <strong>${escapeHtml(preset)}</strong>, then start the cassette. Keep both in Superfocus so the soundtrack does not become a second destination.</p>`;
  }
  return `<h2>Suggested Superfocus preset for ${kw}</h2>
            <p>Start with <strong>${escapeHtml(preset)}</strong>. Switch to Sprint when resistance is high, or Flow/Deep Work when 25-minute cuts would break immersion. Ambient cassettes are optional support—not the activity.</p>`;
}

function getWhatIs(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const slug = page.slug;
  const preset = page.preset || 'Pomodoro';

  const headingMap = {
    'pomodoro-technique': 'a Pomodoro Technique timer',
    'flowtime-timer': 'the Flowtime method',
    'time-blocking-timer': 'time blocking',
    'deep-work-timer': 'a deep work timer',
    'sprint-timer': 'a sprint timer',
    'marathon-timer': 'a marathon timer',
    '52-minute-focus': 'the 52-minute focus method',
    '90-minute-deep-work': '90-minute deep work',
    'study-timer': 'a study timer',
    'focus-timer': 'a focus timer',
    'pomofocus': 'a Pomofocus alternative',
    'best-pomodoro-apps': 'the best Pomodoro apps',
    'superfocus-vs-pomofocus': 'Superfocus vs Pomofocus'
  };
  let heading = headingMap[slug];
  if (!heading) {
    if (cat === 'faq') heading = keyword;
    else if (cat === 'compare' || cat === 'alternatives') heading = keyword || 'Superfocus';
    else if (keyword.match(/^(a|an|the)\s/i)) heading = keyword;
    else heading = `a ${keyword}`;
  }

  const paragraphMap = {
    'pomodoro-technique': 'A Pomodoro Technique timer runs focused 25-minute work blocks with short breaks so you finish tasks instead of drifting. <a href="https://www.superfocus.live/" class="inline-text-link">Superfocus</a> gives you a free online 25/5 timer plus ambient sounds, tasks, and session tracking—built on the <a href="https://en.wikipedia.org/wiki/Pomodoro_Technique" target="_blank" rel="noopener noreferrer" class="inline-text-link">Pomodoro Technique</a> by Francesco Cirillo.',
    'flowtime-timer': 'The Flowtime method uses longer work blocks (45+ minutes) with flexible breaks. Superfocus offers the Flow preset (45/8/25) for those who prefer fewer interruptions and longer focus sessions. It\'s ideal for <a href="https://en.wikipedia.org/wiki/Deep_work" target="_blank" rel="noopener noreferrer" class="inline-text-link">deep work</a> and flow state.',
    'time-blocking-timer': 'Time blocking is a productivity method where you schedule specific blocks for tasks. Superfocus combines a focus timer with task management—so you can block focus time, assign pomodoros to tasks, and see how much you get done.',
    'deep-work-timer': 'A deep work timer uses 90-minute blocks to match your <a href="https://en.wikipedia.org/wiki/Ultradian_rhythm" target="_blank" rel="noopener noreferrer" class="inline-text-link">ultradian rhythm</a>. Superfocus has a built-in Deep Work preset (90/20/30) for extended focus sessions without interruption.',
    'sprint-timer': 'A sprint timer uses short 15-minute bursts for quick wins. Superfocus Sprint preset (15/3/10) is ideal for ADHD, quick tasks, or when 25 minutes feels too long. Get momentum in small blocks.',
    'marathon-timer': 'A marathon timer uses 60-minute focus blocks for extended deep work. Superfocus Marathon preset (60/10/30) is built for writers, researchers, and anyone who needs longer uninterrupted sessions.',
    '52-minute-focus': 'The 52-minute focus method is based on <a href="https://en.wikipedia.org/wiki/Ultradian_rhythm" target="_blank" rel="noopener noreferrer" class="inline-text-link">ultradian rhythms</a>. Work 52 minutes, break 17. Superfocus lets you create custom timers to match your body\'s natural cycles.',
    '90-minute-deep-work': '90-minute deep work sessions align with your ultradian rhythm—the natural ~90-minute cycle of focus and rest. Superfocus Deep Work preset (90/20/30) lets you capitalize on this without manual timer tweaking.',
    'study-timer': 'A study timer gives students timed focus blocks, breaks, and fewer excuses to scroll. Superfocus pairs Pomodoro (or Sprint) with lofi and ambient sounds so exam prep, readings, and papers happen in clear rounds—not vague “study time.”',
    'focus-timer': 'A focus timer is a structured countdown that protects one task from interruptions. Superfocus is a free online focus timer with Pomodoro, Flow, and Deep Work presets—plus ambient sounds and tasks in the same browser tab.',
    'work-timer': 'A work timer keeps professionals on track during busy days. Superfocus combines Pomodoro, Flow, and Deep Work presets with task tracking and ambient sounds—so you can block focus time between meetings and get real work done.',
    'coding-focus-timer': 'A coding focus timer helps developers enter flow state. Superfocus Deep Work (90 min) or Flow (45 min) presets, plus lofi sounds, let you code without context switching or distraction.',
    'writing-timer': 'A writing timer helps writers overcome block and ship. Superfocus Pomodoro or Marathon presets, plus rain and lofi sounds, create a ritual for deep writing sessions.',
    'focus-music': 'Focus music (lofi, rain, cafe) helps block noise and signal your brain to concentrate. Superfocus includes built-in cassettes plus Spotify integration—use any timer preset with ambient sound.',
    'lofi-study-music': 'Lofi study music combines chill beats with ambient sound to aid concentration. Superfocus has curated lofi cassettes plus your Spotify playlists—pair with Pomodoro or any timer.',
    'todoist-pomodoro': 'Todoist Pomodoro combines task management with a focus timer. Superfocus syncs with Todoist so you can assign pomodoros to tasks, track completion, and stay organized.',
    'productivity-analytics': 'Productivity analytics show how much you focus each day, week, and month. Superfocus Premium tracks sessions, streaks, and trends—so you can build better habits and see real progress.',
    'superfocus-vs-pomofocus': 'Pomofocus is a clean online Pomodoro. Superfocus keeps that simplicity and adds ambient sounds (lofi, rain, cafe), Todoist sync, and productivity analytics in one free browser app—so you are not juggling three tabs to focus.',
    'superfocus-vs-forest': 'Superfocus is a browser-based focus timer with Pomodoro, ambient sounds, and analytics. Unlike <a href="https://www.forestapp.cc/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Forest</a>, it runs on desktop without your phone. Lofi, rain, cafe cassettes plus task tracking and leaderboard.',
    'superfocus-vs-flocus': 'Superfocus blends a Pomodoro timer with ambient cassettes and task management. Compare with <a href="https://flocus.com/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Flocus</a>—both offer focus timers and productivity tools. Superfocus adds lofi, rain, and Spotify integration.',
    'superfocus-vs-focusmate': 'Superfocus is a solo focus timer with ambient sounds and Pomodoro. <a href="https://www.focusmate.com/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Focusmate</a> pairs you with an accountability partner. Different styles: Superfocus for independent deep work, Focusmate for session accountability.',
    'pomodoro-timer-apps': 'Choosing among Pomodoro timer apps usually comes down to simplicity versus extras. Superfocus keeps a clear 25-minute timer and adds lofi/rain sounds, Todoist sync, and analytics—free to start in the browser.',
    'pomofocus': 'A Pomofocus alternative should keep the simple Pomodoro and fix the missing pieces. Superfocus adds ambient sounds, Todoist sync, and analytics while staying free to try online—no download.',
    'forest-app': 'Superfocus is a Forest app alternative that runs in your browser. No phone needed. Pomodoro timer, lofi and rain cassettes, task tracking, and analytics—all in one place.',
    'best-pomodoro-apps': 'The best Pomodoro apps in 2026 balance a reliable timer with features you will actually use. Superfocus includes Pomodoro, Flow, and Deep Work presets; ambient sounds; Todoist sync; and analytics—start free, no credit card.'
  };
  let paragraph = paragraphMap[slug];
  if (!paragraph && cat === 'faq' && (page.answer || page.description)) {
    paragraph = page.answer || page.description;
  }
  if (!paragraph && (cat === 'compare' || cat === 'alternatives') && page.compareAngle) {
    const comp = page.competitor;
    const compUrl = page.competitorUrl;
    const angle = comp && compUrl
      ? page.compareAngle.replace(comp, `<a href="${compUrl}" target="_blank" rel="noopener noreferrer" class="inline-text-link">${comp}</a>`)
      : page.compareAngle;
    paragraph = `Superfocus is a <a href="https://www.superfocus.live/" class="inline-text-link">focus timer app</a> that combines Pomodoro, ambient sounds, and analytics. ${angle} Free to try.`;
  }
  if (!paragraph) {
    paragraph = `Superfocus is a <a href="https://www.superfocus.live/" class="inline-text-link">focus timer app</a> that supports ${keyword}. Use ${preset} plus ambient sounds (lofi, rain, cafe), task tracking, and analytics. Free to try.`;
  }
  return { heading, paragraph };
}

function getTopicSection(page) {
  const slug = page.slug;
  const cat = page.category;
  if (cat === 'faq' || cat === 'compare' || cat === 'alternatives' || cat === 'sounds') return '';

  if (slug === 'pomodoro-technique') {
    return `<h2>What is the Pomodoro Technique?</h2>
                <p>The Pomodoro Technique is a time management method: focus for 25 minutes, take a 5-minute break, repeat. After 4 sessions, take a longer break. <a href="https://youtu.be/IlU-zDU6aQ0" target="_blank" rel="noopener noreferrer" class="inline-text-link">Learn more →</a></p>
                <p>Each interval is a “pomodoro.” The method also encourages planning tasks, estimating effort, and protecting the focus block from interruptions.</p>`;
  }

  if (cat === 'use-cases' && (slug === 'study-timer' || (typeof slug === 'string' && slug.startsWith('study-timer-for-')) || slug === 'exam-prep-timer' || slug === 'student-productivity')) {
    return `<h2>Why students use timed study blocks</h2>
                <p>Open-ended “study until done” sessions invite phones and half-attention. Short timed rounds create a clear start and stop—so readings, flashcards, and essays move in measurable chunks.</p>
                <p>Pair the timer with ambient sound when silence feels too loud, then take the break on purpose instead of doomscrolling mid-chapter.</p>`;
  }

  if (cat === 'use-cases' && (slug === 'work-timer' || slug === 'focus-timer' || slug === 'remote-work-focus' || slug === 'freelancer-productivity')) {
    return `<h2>Why timed focus beats “I’ll just check Slack”</h2>
                <p>Knowledge work fails when every notification resets the clock. A focus timer makes the block visible: one task, one countdown, then a break.</p>
                <p>Use shorter presets between meetings and longer ones when you finally get a quiet hour.</p>`;
  }

  if (cat === 'techniques' && slug !== 'pomodoro-technique') {
    return `<h2>How this method differs from classic Pomodoro</h2>
                <p>Classic Pomodoro uses fixed 25/5 cycles. ${escapeHtml(page.keyword)} adjusts block length or break rules so the timer matches attention span and task type—without abandoning structure entirely.</p>
                <p>Superfocus keeps multiple presets in one place so you can switch methods when 25 minutes is too short or too long.</p>`;
  }

  if (cat === 'workflows') {
    return `<h2>Timer + tasks in one workflow</h2>
                <p>A list without a timer stays aspirational. A timer without tasks becomes random busywork. Linking estimates to focus blocks turns planning into finished pomodoros.</p>`;
  }

  if (cat === 'analytics') {
    return `<h2>What to measure when you track focus</h2>
                <p>Count completed sessions, not just hours online. Streaks and weekly totals show whether your system is sticking—or whether meetings still own the calendar.</p>`;
  }

  return '';
}

function getBenefits(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const preset = page.preset || 'Pomodoro';
  const competitor = page.competitor;

  const byCat = {
    techniques: [
      `<strong>Match the method</strong> — ${escapeHtml(keyword)} with a ready ${escapeHtml(preset)} preset instead of guessing lengths.`,
      `<strong>Fewer decisions</strong> — start, work, break, repeat so willpower is not the plan.`,
      `<strong>Room to adapt</strong> — switch presets when classic 25/5 is the wrong fit.`
    ],
    'use-cases': [
      `<strong>Built for ${escapeHtml(keyword)}</strong> — timed rounds that fit study or work, not a kitchen countdown.`,
      `<strong>Fewer tab switches</strong> — timer, tasks, and ambient sound stay together.`,
      `<strong>Visible progress</strong> — finished blocks beat vague “I studied all day” claims.`
    ],
    sounds: [
      `<strong>Sound + timer together</strong> — ${escapeHtml(keyword)} without opening a second app.`,
      `<strong>Mask distractions</strong> — steady ambient audio instead of unpredictable noise.`,
      `<strong>Keep the ritual</strong> — same cassette signals “focus mode” each session.`
    ],
    compare: [
      `<strong>Clear tradeoffs</strong> — see how Superfocus differs from ${escapeHtml(competitor || 'other timers')}.`,
      `<strong>More than a countdown</strong> — sounds, tasks, and analytics in one place.`,
      `<strong>Try before you commit</strong> — free browser access, no download.`
    ],
    alternatives: [
      `<strong>Keep what worked</strong> — simple Pomodoro flow you already understand.`,
      `<strong>Fill the gaps</strong> — ambient sound, tasks, and reports ${escapeHtml(competitor || 'basic timers')} often miss.`,
      `<strong>Stay in the browser</strong> — no install friction when you want to switch.`
    ],
    workflows: [
      `<strong>Plan then execute</strong> — estimate pomodoros, then run them.`,
      `<strong>Sync optional</strong> — use built-in tasks or Todoist.`,
      `<strong>Less context switching</strong> — list and timer share one screen.`
    ],
    analytics: [
      `<strong>Evidence over vibes</strong> — see real focus time for ${escapeHtml(keyword)}.`,
      `<strong>Spot patterns</strong> — which hours and presets actually ship work.`,
      `<strong>Build streaks</strong> — consistency beats occasional hero days.`
    ],
    professions: [
      `<strong>Protect deep work</strong> — block ${escapeHtml(keyword)} time before meetings win.`,
      `<strong>Fit the calendar</strong> — short sprints or long Deep Work presets.`,
      `<strong>Track the hours that matter</strong> — sessions show focused output, not just busy.`
    ],
    activities: [
      `<strong>Batch the work</strong> — give ${escapeHtml(keyword)} a dedicated timer round.`,
      `<strong>Finish the loop</strong> — breaks on purpose so fatigue does not derail you.`,
      `<strong>Reuse the setup</strong> — same preset next time you face the same task type.`
    ],
    goals: [
      `<strong>Turn goals into blocks</strong> — ${escapeHtml(keyword.replace(/ timer$/i, '').replace(/-/g, ' '))} becomes a daily timer habit.`,
      `<strong>Start smaller if needed</strong> — Sprint when 25 minutes feels impossible.`,
      `<strong>Measure the habit</strong> — streaks and session counts keep you honest.`
    ],
    faq: [
      `<strong>Direct answer</strong> — practical guidance for ${escapeHtml(keyword)}.`,
      `<strong>Try it immediately</strong> — open the timer and test the advice.`,
      `<strong>Adjust with data</strong> — change presets after a few real sessions.`
    ]
  };

  const items = byCat[cat] || byCat['use-cases'];
  return items.map(li => `<li>${li}</li>`).join('\n                    ');
}

function getHowToHeading(page) {
  const cat = page.category;
  if (cat === 'techniques' && page.slug && page.slug.includes('pomodoro')) return 'How to use the Pomodoro Timer?';
  if (cat === 'techniques') return `How to use ${page.keyword}?`;
  if (cat === 'use-cases') return `How to use a ${page.keyword}?`;
  if (cat === 'sounds') return `How to use ${page.keyword} with Superfocus?`;
  if (cat === 'workflows') return 'How to set up the workflow?';
  if (cat === 'analytics') return 'How to track focus time?';
  if (cat === 'professions') return `How to use a focus timer for ${page.keyword.replace(/focus timer for /i, '')}?`;
  if (cat === 'activities') return `How to use a focus timer for ${page.keyword.replace(/focus timer for /i, '').replace(/ timer$/i, '')}?`;
  if (cat === 'goals') return `How to ${page.keyword.replace(/ timer$/i, '').replace(/-/g, ' ')} with Superfocus?`;
  if (cat === 'compare' || cat === 'alternatives') return 'How to try Superfocus?';
  if (cat === 'faq') return 'How to get started with Superfocus?';
  return 'How to get started?';
}

function getHowToSteps(page) {
  return getHowToStepTexts(page).map(s => `<li>${s}</li>`).join('\n                    ');
}

function getFeatures(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const preset = page.preset || 'Pomodoro';
  const competitor = page.competitor;

  const byCat = {
    techniques: [
      `<strong>${escapeHtml(preset)} preset</strong> — ready timing for ${escapeHtml(keyword)}.`,
      '<strong>Custom lengths</strong> — change focus and break times when the default is wrong.',
      '<strong>Ambient cassettes</strong> — lofi, rain, and cafe without leaving the timer.',
      '<strong>Task estimates</strong> — assign pomodoros and work one item at a time.',
      '<strong>Session history</strong> — see whether the method is sticking.'
    ],
    'use-cases': [
      `<strong>Presets for ${escapeHtml(keyword)}</strong> — Pomodoro, Sprint, Flow, Deep Work, Marathon.`,
      '<strong>Study/work sounds</strong> — ambient audio that stays with the countdown.',
      '<strong>Task list</strong> — queue what you will finish in this block.',
      '<strong>Browser-first</strong> — no install; start on desktop immediately.',
      '<strong>Progress tracking</strong> — streaks and completed sessions.'
    ],
    sounds: [
      `<strong>${escapeHtml(keyword)}</strong> — built-in cassettes aimed at concentration.`,
      '<strong>Timer + audio</strong> — one tab for both.',
      '<strong>Spotify option</strong> — bring your own playlists.',
      '<strong>Any preset</strong> — Pomodoro through Deep Work.',
      '<strong>Quick switch</strong> — change sound without resetting focus.'
    ],
    compare: [
      '<strong>Pomodoro + more</strong> — timer, sounds, tasks, analytics together.',
      `<strong>Versus ${escapeHtml(competitor || 'alternatives')}</strong> — see the matrix on this page.`,
      '<strong>Todoist sync</strong> — optional task pipeline.',
      '<strong>Multiple presets</strong> — not locked to 25/5 only.',
      '<strong>Free to start</strong> — compare with a real session today.'
    ],
    alternatives: [
      '<strong>Simple Pomodoro core</strong> — familiar 25/5 flow.',
      '<strong>Extras included</strong> — sounds, tasks, analytics.',
      `<strong>${escapeHtml(competitor || 'Incumbent')} gap-fill</strong> — keep simplicity, add depth.`,
      '<strong>Web app</strong> — works where you already work.',
      '<strong>Leaderboard option</strong> — light accountability if you want it.'
    ],
    workflows: [
      '<strong>Tasks + timer</strong> — estimates and countdown linked.',
      '<strong>Todoist sync</strong> — pull work you already tracked.',
      '<strong>Templates mindset</strong> — repeat common task sets.',
      '<strong>Focus cassettes</strong> — reduce setup friction.',
      '<strong>Reports</strong> — see completed pomodoros over time.'
    ],
    analytics: [
      `<strong>${escapeHtml(keyword)}</strong> — sessions logged automatically.`,
      '<strong>Streaks</strong> — keep the habit visible.',
      '<strong>Trends</strong> — daily/weekly patterns (Premium).',
      '<strong>Preset breakdown</strong> — which lengths you actually finish.',
      '<strong>Export-friendly history</strong> — review outside the app on Premium.'
    ],
    professions: [
      `<strong>Desktop focus</strong> — ${escapeHtml(keyword)} without a phone garden.`,
      '<strong>Meeting-aware presets</strong> — Sprint between calls, Deep Work for hard thinking.',
      '<strong>Task queue</strong> — protect the next deliverable.',
      '<strong>Ambient sound</strong> — headphones-friendly focus.',
      '<strong>Analytics</strong> — prove where focused hours went.'
    ],
    activities: [
      `<strong>Activity-ready presets</strong> — sized for ${escapeHtml(keyword)}.`,
      '<strong>Single-task mode</strong> — one item until the bell.',
      '<strong>Break reminders</strong> — stop grinding past useful focus.',
      '<strong>Sound optional</strong> — on when the environment is noisy.',
      '<strong>Repeatable setup</strong> — same flow next time.'
    ],
    goals: [
      '<strong>Habit-friendly timer</strong> — small daily wins compound.',
      '<strong>Flexible presets</strong> — match energy, not ego.',
      '<strong>Distraction tools</strong> — sound + single task.',
      '<strong>Streak tracking</strong> — keep the goal honest.',
      '<strong>Free start</strong> — prove the system before upgrading.'
    ],
    faq: [
      '<strong>Clear presets</strong> — test the advice immediately.',
      '<strong>No install</strong> — browser timer.',
      '<strong>Sounds included</strong> — optional focus audio.',
      '<strong>Tasks</strong> — attach the answer to real work.',
      '<strong>Free tier</strong> — try before Premium.'
    ]
  };

  const items = byCat[cat] || byCat['use-cases'];
  return items.map(li => `<li>${li}</li>`).join('\n                    ');
}

function getFaq(page) {
  return getFaqData(page).map((f, i) => {
    const n = i + 1;
    return `                <div class="faq-item">
                    <button class="faq-question" aria-expanded="false" aria-controls="content-faq-answer-${n}" id="content-faq-question-${n}">
                        <span>${escapeHtml(f.q)}</span>
                        <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    <div class="faq-answer" id="content-faq-answer-${n}" role="region" aria-labelledby="content-faq-question-${n}">
                        <p>${f.a}</p>
                    </div>
                </div>`;
  }).join('\n');
}

function getCompareTable(page) {
  if (page.category !== 'compare' || !page.competitor) return '';
  const comp = escapeHtml(page.competitor);
  const url = page.competitorUrl || '#';

  if (page.slug === 'superfocus-vs-pomofocus') {
    return `
                <h2>Superfocus vs ${comp}</h2>
                <table style="width:100%; border-collapse: collapse; color: rgba(255,255,255,0.9); font-size: 0.95rem; margin-bottom: 2rem;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);"><th style="text-align:left; padding:10px 0;">Feature</th><th style="text-align:left; padding:10px 0;">Superfocus</th><th style="text-align:left; padding:10px 0;">Pomofocus</th></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Pomodoro timer</td><td>✓</td><td>✓</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Custom timer presets (Flow, Deep Work)</td><td>✓</td><td>Limited</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Ambient sounds / lofi music</td><td>✓ Built-in</td><td>✗</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Todoist integration</td><td>✓</td><td>✗</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Focus analytics & streaks</td><td>✓</td><td>Basic</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Leaderboard</td><td>✓</td><td>✗</td></tr>
                    <tr><td style="padding:10px 0;">Free tier (no signup to try)</td><td>✓</td><td>✓</td></tr>
                </table>
                <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-text-link">Learn more about Pomofocus →</a></p>`;
  }

  return `
                <h2>Superfocus vs ${comp}</h2>
                <table style="width:100%; border-collapse: collapse; color: rgba(255,255,255,0.9); font-size: 0.95rem; margin-bottom: 2rem;">
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);"><th style="text-align:left; padding:10px 0;">Feature</th><th style="text-align:left; padding:10px 0;">Superfocus</th><th style="text-align:left; padding:10px 0;">${comp}</th></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Pomodoro timer</td><td>✓</td><td>✓</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Ambient sounds / music</td><td>✓</td><td>Varies</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Todoist integration</td><td>✓</td><td>Varies</td></tr>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Analytics</td><td>✓</td><td>Varies</td></tr>
                    <tr><td style="padding:10px 0;">Free tier</td><td>✓</td><td>Varies</td></tr>
                </table>
                <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-text-link">Learn more about ${comp} →</a></p>`;
}

function getRelatedLinks(related) {
  if (!Array.isArray(related) || related.length === 0) return '';
  return related.map(url => {
    const slug = url.split('/').pop() || '';
    const label = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bVs\b/g, 'vs');
    return `<li style="margin-bottom: 8px;"><a href="${url}" class="inline-text-link">${label}</a></li>`;
  }).join('\n                    ');
}

function getExternalLinks(page) {
  const links = [];
  if (Array.isArray(page.externalLinks) && page.externalLinks.length > 0) {
    page.externalLinks.forEach(l => links.push({ url: l.url, text: l.text }));
  }
  if (page.keyword && page.keyword.toLowerCase().includes('pomodoro') && !links.some(l => l.url.includes('Pomodoro'))) {
    links.push({ url: 'https://en.wikipedia.org/wiki/Pomodoro_Technique', text: 'Pomodoro Technique (Wikipedia)' });
  }
  if (page.category === 'compare' && page.competitorUrl && !links.some(l => l.url === page.competitorUrl)) {
    links.push({ url: page.competitorUrl, text: page.competitor });
  }
  if (links.length === 0) return '';
  const items = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="inline-text-link">${l.text}</a>`).join(' · ');
  return `<p style="margin-top: 2rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);">Further reading: ${items}</p>`;
}

function getArticleBody(page) {
  const articlesDir = path.join(PSEO_DIR, 'articles');
  const customPath = path.join(articlesDir, `${page.slug}.html`);
  if (fs.existsSync(customPath)) {
    return fs.readFileSync(customPath, 'utf8').trim();
  }
  return buildGeneratedArticle(page);
}

function buildGeneratedArticle(page) {
  const kw = escapeHtml(page.keyword || page.slug.replace(/-/g, ' '));
  const preset = escapeHtml(page.preset || 'Pomodoro');
  const cat = page.category;
  const competitor = page.competitor ? escapeHtml(page.competitor) : '';
  const whatIs = getWhatIs(page);
  const topic = getTopicSection(page);
  const benefits = getBenefits(page);
  const features = getFeatures(page);
  const howToHeading = escapeHtml(getHowToHeading(page));
  const howToSteps = getHowToSteps(page);
  const compare = getCompareTable(page);
  const whoFor = getWhoItsFor(page);
  const mistakes = getCommonMistakes(page);
  const practice = getPracticeSection(page);

  return [
    `<h2>What is ${escapeHtml(whatIs.heading)}?</h2>`,
    `<p>${whatIs.paragraph}</p>`,
    topic,
    whoFor,
    compare,
    `<h2>Why ${kw} matters for real work</h2>`,
    practice,
    `<h2>Benefits of using Superfocus for ${kw}</h2>`,
    `<ul>${benefits}</ul>`,
    `<h2>${howToHeading}</h2>`,
    `<ol>${howToSteps}</ol>`,
    mistakes,
    getPresetSection(page),
    `<h2>Features that support ${kw}</h2>`,
    `<ul>${features}</ul>`,
    `<h2>Start ${kw} in your browser</h2>`,
    `<p>Open <a href="https://www.superfocus.live/?ref=pseo-${escapeHtml(page.slug)}" class="inline-text-link">Superfocus</a>, pick the <strong>${preset}</strong> preset (or customize lengths), optionally start ambient sound, and run one honest block. The goal is not a perfect system on day one—it is finishing the next ${kw} session without juggling five tabs.</p>`
  ].filter(Boolean).join('\n            ');
}

function getWhoItsFor(page) {
  const kw = escapeHtml(page.keyword);
  const cat = page.category;
  const map = {
    techniques: `<h2>Who should use ${kw}?</h2>
            <p>Use this method when your default work style needs a clearer rhythm—too many open loops, or blocks that drag without a finish line. ${kw} is especially useful if classic “work until done” turns into half-attention and late nights.</p>
            <p>Skip it only when your task truly needs unbroken multi-hour immersion and you already protect that time. Even then, Superfocus Deep Work or Marathon presets may fit better than forcing a mismatched length.</p>`,
    'use-cases': `<h2>Who needs a ${kw}?</h2>
            <p>Anyone who keeps “starting” ${kw.replace(/^a /i, '')} sessions and somehow ends up in inbox, chat, or social. A dedicated ${kw} makes the block explicit: one outcome, one countdown, then a break you actually take.</p>
            <p>It is also useful when your environment is noisy or your calendar is fragmented—short presets between meetings, longer ones when you finally get a quiet hour.</p>`,
    sounds: `<h2>When ${kw} helps (and when it does not)</h2>
            <p>${kw} works best as a consistent backdrop—steady enough to mask interruptions without stealing attention. If lyrics pull you into the song, switch to rain, cafe, or instrumental lofi inside Superfocus.</p>`,
    compare: `<h2>How to decide with this comparison</h2>
            <p>Use the table and angles on this page to match tools to jobs: simple countdown vs timer+sounds+tasks. If you only need a tomato timer, a minimal app may be enough. If you keep opening Spotify and a task list beside the timer, Superfocus is built for that stack.</p>`,
    alternatives: `<h2>When to switch to a ${kw}</h2>
            <p>Switch when your current tool is fine at counting down but weak at keeping you in one place—no sound, no task sync, no sense of progress. A ${kw} should feel familiar on day one and deeper by week two.</p>`,
    workflows: `<h2>Who this workflow is for</h2>
            <p>People who already write tasks down but do not finish them. Linking estimates to timed blocks turns the list into a run queue instead of a museum of intentions.</p>`,
    analytics: `<h2>Who should track ${kw}</h2>
            <p>Anyone guessing whether they “focused a lot” this week. Numbers will not motivate everyone—but they expose whether meetings, context switching, or weak presets are the real bottleneck.</p>`,
    professions: `<h2>Built for ${kw}</h2>
            <p>Professionals who need protected deep work between calls. Phone-first focus apps often fail on a desktop workday; a browser timer sits next to your docs and IDE.</p>`,
    activities: `<h2>Use this for ${kw}</h2>
            <p>Batch similar work into timed rounds so ${kw} stops expanding to fill the whole afternoon. One preset, one batch, then stop.</p>`,
    goals: `<h2>Using a timer for this goal</h2>
            <p>Goals fail when they stay abstract. Convert “focus more” into daily blocks you can finish. Start smaller than your ego wants if that is what gets the first session done.</p>`,
    faq: `<h2>Quick context</h2>
            <p>This page answers a specific question about focus timers and the Pomodoro method. Use the steps below to try the advice in Superfocus immediately.</p>`
  };
  return map[cat] || map['use-cases'];
}

function getCommonMistakes(page) {
  const kw = escapeHtml(page.keyword);
  const cat = page.category;
  if (cat === 'faq') return '';
  if (cat === 'compare' || cat === 'alternatives') {
    return `<h2>Common switching mistakes</h2>
            <ul>
                <li><strong>Feature shopping forever</strong> — comparing for hours is still avoidance. Run one session in the contender today.</li>
                <li><strong>Copying someone else’s stack</strong> — you may need sounds; they may need accountability partners. Match the job.</li>
                <li><strong>Ignoring the free trial</strong> — browser tools should prove themselves in a single afternoon.</li>
            </ul>`;
  }
  return `<h2>Common mistakes with ${kw}</h2>
            <ul>
                <li><strong>Multitasking inside the block</strong> — if the timer is running, one task owns it.</li>
                <li><strong>Skipping breaks</strong> — breaks are part of the method, not a reward you earn by suffering.</li>
                <li><strong>Perfect length obsession</strong> — pick ${escapeHtml(page.preset || 'a preset')}, collect a week of data, then adjust.</li>
                <li><strong>Timer in one tab, distractions in five others</strong> — keep sound and tasks with the countdown when you can.</li>
            </ul>`;
}

function getPracticeSection(page) {
  const kw = escapeHtml(page.keyword);
  const preset = escapeHtml(page.preset || 'Pomodoro');
  const cat = page.category;
  if (cat === 'techniques') {
    return `<p>${kw} is not a personality test—it is a constraint. The constraint is what creates finishing energy. When people say the method “doesn’t work,” they often mean they kept negotiating with the timer, restarted after every ping, or never protected the break.</p>
            <p>In Superfocus, treat the ${preset} preset as the default experiment. Run four cycles on one meaningful task. Only then decide whether you need shorter Sprint blocks or longer Flow/Deep Work time.</p>
            <p>Write the task name before you press start. If you cannot name the outcome in one line, the block will fill with “organizing” busywork.</p>`;
  }
  if (cat === 'use-cases') {
    return `<p>A ${kw} only helps if the session has a finish line. “Be productive” is not a finish line. “Draft section two” or “clear the review queue” is.</p>
            <p>Use ${preset} when you want a known rhythm. If you burn out mid-block, drop to Sprint for a day—momentum beats heroic lengths you abandon.</p>
            <p>Ambient sound is optional, but it is useful when your environment is unpredictable. Pair the same cassette with the same preset for a week so your brain learns the cue.</p>`;
  }
  if (cat === 'sounds') {
    return `<p>${kw} should support attention, not become another playlist rabbit hole. Pick one cassette, start the timer, and leave the library alone until the break.</p>
            <p>If you need familiar music, connect Spotify inside Superfocus so you are not bouncing between apps mid-focus.</p>`;
  }
  return `<p>The practical test for ${kw} is simple: can you finish one honest block today without redesigning your entire productivity system? Superfocus is set up for that—${preset}, optional sound, tasks if you need them.</p>
            <p>Repeat daily before you optimize. Most gains come from showing up for the block, not from finding a mythical perfect length on day one.</p>`;
}

function buildContentSection(page, contentSectionTemplate) {
  return contentSectionTemplate
    .replace(/\{\{H1\}\}/g, escapeHtml(page.h1))
    .replace(/\{\{HERO_SUBTITLE\}\}/g, escapeHtml(getHeroSubtitle(page)))
    .replace(/\{\{SLUG\}\}/g, page.slug)
    .replace(/\{\{ARTICLE_BODY\}\}/g, getArticleBody(page))
    .replace(/\{\{FAQ\}\}/g, getFaq(page))
    .replace(/\{\{RELATED_LINKS\}\}/g, getRelatedLinks(page.related))
    .replace(/\{\{EXTERNAL_LINKS\}\}/g, getExternalLinks(page));
}

const HUB_TEMPLATE_PATH = path.join(PSEO_DIR, 'hub-template.html');

const HUB_CONFIG = {
  compare: {
    h1: 'Compare Superfocus with other focus timers',
    title: 'Compare Focus Timers — Superfocus vs Pomofocus & More',
    description: 'Side-by-side comparisons of Superfocus with Pomofocus, Forest, Flocus, and other popular focus and Pomodoro timers.',
    keywords: 'focus timer comparison, Superfocus vs Pomofocus, pomodoro app comparison',
    intro: [
      'Choosing a focus timer means balancing simplicity with the features you actually use—ambient sounds, task sync, and analytics.',
      'Browse our comparisons to see how Superfocus stacks up against Pomofocus, Forest, TickTick, and other tools you may already know.'
    ]
  },
  alternatives: {
    h1: 'Focus timer alternatives',
    title: 'Focus Timer Alternatives — Pomofocus, Forest & More | Superfocus',
    description: 'Looking for a Pomofocus, Hustly Focus, or Forest alternative? Free browser focus timer with sounds, tasks, and analytics.',
    keywords: 'pomofocus alternative, hustly focus alternative, forest app alternative, focus timer alternative',
    intro: [
      'Outgrowing your current focus app usually means you need more than a countdown—sounds, tasks, streaks, and sync in one place.',
      'Explore Superfocus as an alternative to Pomofocus, Hustly Focus, Forest, Flocus, and other popular study and work timers.'
    ]
  },
  'use-cases': {
    h1: 'Focus timers for every use case',
    title: 'Focus Timer Use Cases — Study, Work & Deep Focus | Superfocus',
    description: 'Free online focus timers for studying, coding, writing, ADHD, and remote work. Pomodoro presets with ambient sounds.',
    keywords: 'study timer, focus timer online, work timer, focus website for studying',
    intro: [
      'Different work needs different focus blocks—a 25-minute sprint for studying, 90 minutes for deep work, 15 minutes when starting feels hard.',
      'Find the right Superfocus preset and workflow for your situation, from exam prep to coding sessions to freelancer productivity.'
    ]
  },
  techniques: {
    h1: 'Focus techniques & timer methods',
    title: 'Pomodoro & Focus Techniques — Timers & Methods | Superfocus',
    description: 'Pomodoro technique, Flowtime, time blocking, and deep work timers. Free online guides with built-in presets.',
    keywords: 'pomodoro technique, flowtime timer, deep work timer, time blocking timer',
    intro: [
      'The right focus technique depends on your task, attention span, and energy—Pomodoro for structured sprints, Flowtime for longer blocks, Deep Work for hard problems.',
      'Each guide below explains the method and links to a ready-made timer preset in Superfocus so you can start immediately.'
    ]
  }
};

function buildHubJsonLd(category, canonicalPath, title, description) {
  return `<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "url": "${BASE_URL}${canonicalPath}"
}
</script>`;
}

function buildHubHtml(category, pages, hubTemplate, manifest) {
  const config = HUB_CONFIG[category];
  if (!config) return '';

  const categoryPages = pages
    .filter(p => p.category === category)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const pageList = categoryPages.map(p => {
    const path = `/${category}/${p.slug}`;
    const desc = escapeHtml(stripHtml(p.description || p.heroSubtitle || '').slice(0, 120));
    return `<li><a href="${path}">${escapeHtml(p.h1 || p.title)}</a><span>${desc}</span></li>`;
  }).join('\n                ');

  const intro = config.intro.map(p => `<p class="hub-intro">${escapeHtml(p)}</p>`).join('\n                ');
  const canonicalPath = `/${category}/`;

  return hubTemplate
    .replace(/\{\{TITLE\}\}/g, escapeHtml(config.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(config.description))
    .replace(/\{\{KEYWORDS\}\}/g, escapeHtml(config.keywords))
    .replace(/\{\{CANONICAL_PATH\}\}/g, canonicalPath)
    .replace(/\{\{H1\}\}/g, escapeHtml(config.h1))
    .replace(/\{\{INTRO\}\}/g, intro)
    .replace(/\{\{PAGE_LIST\}\}/g, pageList)
    .replace(/\{\{CATEGORY\}\}/g, category)
    .replace(/\{\{JSON_LD\}\}/g, buildHubJsonLd(category, canonicalPath, config.title, config.description))
    .replace(/\{\{STYLE_HREF\}\}/g, manifest.style);
}

function buildHubPages(pages, manifest) {
  if (!fs.existsSync(HUB_TEMPLATE_PATH)) {
    console.warn('Missing pseo/hub-template.html — skipping hub pages');
    return [];
  }
  const hubTemplate = fs.readFileSync(HUB_TEMPLATE_PATH, 'utf8');
  const hubUrls = [];

  for (const category of Object.keys(HUB_CONFIG)) {
    const outputDir = path.join(ROOT, category);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const html = buildHubHtml(category, pages, hubTemplate, manifest);
    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
    hubUrls.push(`/${category}/`);
    console.log(`Generated hub: /${category}/`);
  }
  return hubUrls;
}

const BLOG_DIR = path.join(PSEO_DIR, 'blog');
const BLOG_POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const BLOG_TEMPLATE_PATH = path.join(PSEO_DIR, 'blog-template.html');
const BLOG_INDEX_TEMPLATE_PATH = path.join(PSEO_DIR, 'blog-index-template.html');

function formatBlogDate(isoDate) {
  try {
    return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (_) {
    return isoDate;
  }
}

function buildBlogJsonLd(post, canonicalPath) {
  return `<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.title)},
    "description": ${JSON.stringify(post.description)},
    "datePublished": ${JSON.stringify(post.date)},
    "author": { "@type": "Organization", "name": "Superfocus" },
    "publisher": {
        "@type": "Organization",
        "name": "Superfocus",
        "logo": { "@type": "ImageObject", "url": "${BASE_URL}/og-image.png" }
    },
    "mainEntityOfPage": "${BASE_URL}${canonicalPath}",
    "url": "${BASE_URL}${canonicalPath}"
}
</script>`;
}

function buildBlogPages(manifest) {
  if (!fs.existsSync(BLOG_POSTS_JSON) || !fs.existsSync(BLOG_TEMPLATE_PATH) || !fs.existsSync(BLOG_INDEX_TEMPLATE_PATH)) {
    console.warn('Missing blog templates or posts.json — skipping blog');
    return [];
  }

  const posts = loadJson(BLOG_POSTS_JSON)
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const postTemplate = fs.readFileSync(BLOG_TEMPLATE_PATH, 'utf8');
  const indexTemplate = fs.readFileSync(BLOG_INDEX_TEMPLATE_PATH, 'utf8');
  const blogOutDir = path.join(ROOT, 'blog');
  if (!fs.existsSync(blogOutDir)) fs.mkdirSync(blogOutDir, { recursive: true });

  const urls = ['/blog/'];

  for (const post of posts) {
    const bodyPath = path.join(BLOG_DIR, `${post.slug}.html`);
    if (!fs.existsSync(bodyPath)) {
      console.warn(`Missing blog body: ${post.slug}.html`);
      continue;
    }
    const body = fs.readFileSync(bodyPath, 'utf8').trim();
    const canonicalPath = `/blog/${post.slug}`;
    const related = posts
      .filter(p => p.slug !== post.slug)
      .slice(0, 3)
      .map(p => `<li style="margin-bottom: 8px;"><a href="/blog/${p.slug}" class="inline-text-link">${escapeHtml(p.title)}</a></li>`)
      .join('\n                    ');

    const html = postTemplate
      .replace(/\{\{TITLE\}\}/g, escapeHtml(post.title))
      .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(post.description))
      .replace(/\{\{KEYWORDS\}\}/g, escapeHtml(`${post.keyword}, pomodoro timer, focus timer, Superfocus blog`))
      .replace(/\{\{CANONICAL_PATH\}\}/g, canonicalPath)
      .replace(/\{\{H1\}\}/g, escapeHtml(post.title))
      .replace(/\{\{SLUG\}\}/g, post.slug)
      .replace(/\{\{DATE\}\}/g, post.date)
      .replace(/\{\{DATE_DISPLAY\}\}/g, escapeHtml(formatBlogDate(post.date)))
      .replace(/\{\{ARTICLE_BODY\}\}/g, body)
      .replace(/\{\{RELATED_POSTS\}\}/g, related)
      .replace(/\{\{JSON_LD\}\}/g, buildBlogJsonLd(post, canonicalPath))
      .replace(/\{\{STYLE_HREF\}\}/g, manifest.style);

    fs.writeFileSync(path.join(blogOutDir, `${post.slug}.html`), html, 'utf8');
    urls.push(canonicalPath);
    console.log(`Generated blog: ${canonicalPath}`);
  }

  const postList = posts.map(p => {
    const desc = escapeHtml((p.description || '').slice(0, 140));
    return `<li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a><span>${escapeHtml(formatBlogDate(p.date))} — ${desc}</span></li>`;
  }).join('\n                ');

  const indexJsonLd = `<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Superfocus Blog",
    "description": "Guides on Pomodoro timers, study and focus timers, and practical productivity habits.",
    "url": "${BASE_URL}/blog/"
}
</script>`;

  const indexHtml = indexTemplate
    .replace(/\{\{POST_LIST\}\}/g, postList)
    .replace(/\{\{JSON_LD\}\}/g, indexJsonLd)
    .replace(/\{\{STYLE_HREF\}\}/g, manifest.style);

  fs.writeFileSync(path.join(blogOutDir, 'index.html'), indexHtml, 'utf8');
  console.log('Generated blog: /blog/');
  return urls;
}

function buildPageHtml(page, template, contentSectionTemplate, manifest) {
  const canonicalPath = `/${page.category}/${page.slug}`;
  const contentSection = buildContentSection(page, contentSectionTemplate);
  const jsonLd = buildJsonLd(page, canonicalPath);
  const keywordsMeta = page.keywords
    || `${page.keyword}, pomodoro timer, focus timer, Superfocus`;

  return template
    .replace(/\{\{TITLE\}\}/g, escapeHtml(page.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(page.description))
    .replace(/\{\{KEYWORD\}\}/g, escapeHtml(page.keyword))
    .replace(/\{\{KEYWORDS\}\}/g, escapeHtml(keywordsMeta))
    .replace(/\{\{CANONICAL_PATH\}\}/g, canonicalPath)
    .replace(/\{\{CONTENT_SECTION\}\}/g, contentSection)
    .replace(/\{\{JSON_LD\}\}/g, jsonLd)
    .replace(/\{\{STYLE_HREF\}\}/g, manifest.style)
    .replace(/\{\{SCRIPT_LANDING_HREF\}\}/g, manifest.scriptLanding);
}

function main() {
  if (!fs.existsSync(PAGES_JSON)) {
    console.error('Missing pseo/pages.json');
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Missing pseo/template.html');
    process.exit(1);
  }
  if (!fs.existsSync(CONTENT_SECTION_PATH)) {
    console.error('Missing pseo/content-section.html');
    process.exit(1);
  }

  const pages = loadAllPages();
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const contentSectionTemplate = fs.readFileSync(CONTENT_SECTION_PATH, 'utf8');
  const manifest = loadAssetManifest();
  const generated = [];

  for (const page of pages) {
    const outputDir = path.join(ROOT, page.category);
    const outputPath = path.join(outputDir, `${page.slug}.html`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const html = buildPageHtml(page, template, contentSectionTemplate, manifest);
    fs.writeFileSync(outputPath, html, 'utf8');
    generated.push(`/${page.category}/${page.slug}`);
  }

  console.log(`Generated ${generated.length} pSEO pages.`);

  const hubUrls = buildHubPages(pages, manifest);
  const blogUrls = buildBlogPages(manifest);

  const today = new Date().toISOString().slice(0, 10);
  const coreUrls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/pricing', priority: '0.9', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
    { loc: '/release-notes', priority: '0.7', changefreq: 'weekly' }
  ];
  const hubSitemapUrls = hubUrls.map(loc => ({
    loc: BASE_URL + loc,
    priority: '0.85',
    changefreq: 'weekly'
  }));
  const blogSitemapUrls = blogUrls.map(loc => ({
    loc: BASE_URL + loc,
    priority: loc === '/blog/' ? '0.85' : '0.75',
    changefreq: 'monthly'
  }));
  const allUrls = [
    ...coreUrls.map(u => ({ ...u, loc: BASE_URL + u.loc })),
    ...hubSitemapUrls,
    ...blogSitemapUrls,
    ...generated.map(loc => ({ loc: BASE_URL + loc, priority: '0.8', changefreq: 'monthly' }))
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `    <url>
        <loc>${u.loc}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log('Updated sitemap.xml');
  return generated;
}

main();
