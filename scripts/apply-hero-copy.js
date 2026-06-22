#!/usr/bin/env node
/**
 * Applies question + feature-list copy across hero, SEO meta, and stop-start sections.
 * Pattern: Title = "Am I actually ...?" | Subtitle = "Track every X, Y, Z in one place."
 * Run: node scripts/apply-hero-copy.js && npm run build:pseo
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_JSON = path.join(ROOT, 'pseo', 'pages.json');
const DATABASES_DIR = path.join(ROOT, 'pseo', 'databases');

const SUB = {
  core: 'Track every pomodoro block, task, ambient sound, focus streak, and analytics report in one place.',
  sounds: 'Play every lofi track, rain loop, cafe ambience, white noise, and focus timer in one place.',
  analytics: 'Track every focus session, pomodoro block, streak, weekly report, and leaderboard rank in one place.',
  workflows: 'Sync every Todoist task, pomodoro block, focus streak, ambient sound, and session log in one place.',
  compare: 'Get every timer, ambient sound, task, analytics report, and leaderboard streak in one place.',
  study: 'Track every study block, assignment task, lofi sound, session streak, and progress report in one place.',
  professions: 'Track every billable block, client task, ambient sound, focus streak, and hours report in one place.',
  faq: 'Run every pomodoro block, task, ambient sound, focus streak, and analytics report in one place.'
};

const META_SUFFIX = {
  sounds: ' Free focus timer—no signup to try.',
  analytics: ' Free focus analytics—no signup to try.',
  workflows: ' Free Todoist + Pomodoro—no signup to try.',
  compare: ' Compare and try free.',
  alternatives: ' Try free—no signup required.',
  faq: ' Free Pomodoro timer—no signup to try.',
  goals: ' Free focus timer—no signup to try.',
  default: ' Free to try—no signup required.'
};

const STOP = {
  core: {
    painPoints: 'Too many tabs open?<br>Nothing actually finished?<br>End of day, same to-do list?',
    painSolution: 'Pick one task. Start the timer.<br>Track every block, break, and streak.<br>All in one place.'
  },
  techniques: {
    painPoints: 'Sit down to work—but drift within minutes?<br>Timer on, task still untouched?<br>Hours pass with nothing to show?',
    painSolution: 'Set one block. One task. Timer running.<br>Track every session, break, and streak.<br>All in one place.'
  },
  study: {
    painPoints: 'Book open but mind elsewhere?<br>Phone checked more than pages read?<br>Deadline closer, progress stuck?',
    painSolution: 'One assignment. One focus block.<br>Track every study session and streak.<br>All in one place.'
  },
  sounds: {
    painPoints: 'Silence too loud, music too distracting?<br>Searching playlists instead of working?<br>Still can\'t get into focus mode?',
    painSolution: 'One click. Sounds + timer together.<br>Track every session, sound, and streak.<br>All in one place.'
  },
  workflows: {
    painPoints: 'Tasks listed but none started?<br>Todo list full, output empty?<br>Planning without doing—again?',
    painSolution: 'Pick a task. Assign a pomodoro.<br>Sync every block, task, and streak.<br>All in one place.'
  },
  analytics: {
    painPoints: 'Worked all week but can\'t prove it?<br>No idea which hours were productive?<br>Same patterns, no improvement?',
    painSolution: 'Every session logged automatically.<br>Track focus time, streaks, and trends.<br>All in one place.'
  },
  compare: {
    painPoints: 'Timer in one tab, music in another?<br>Tasks somewhere else entirely?<br>Focus scattered across five apps?',
    painSolution: 'Timer, sounds, tasks, analytics—together.<br>Track every session and streak.<br>All in one place.'
  },
  alternatives: {
    painPoints: 'Current app missing key features?<br>Juggling three tools just to focus?<br>Still not sure you\'re improving?',
    painSolution: 'Same simplicity. More built in.<br>Track every block, task, and streak.<br>All in one place.'
  },
  goals: {
    painPoints: 'Said you\'d focus better this week?<br>Distractions won by Tuesday?<br>Same goal, same result?',
    painSolution: 'One block today. Timer on.<br>Track every session, streak, and habit.<br>All in one place.'
  },
  professions: {
    painPoints: 'Back-to-back calls, zero deep work?<br>Important hours slipping away?<br>End of day, nothing shipped?',
    painSolution: 'Block 25 minutes before the inbox wins.<br>Track every session, task, and hour.<br>All in one place.'
  },
  activities: {
    painPoints: 'Task on the list for days?<br>Start strong, drift within minutes?<br>Busy all day, nothing crossed off?',
    painSolution: 'Name the task. Start the timer.<br>Track every block and streak.<br>All in one place.'
  },
  faq: {
    painPoints: 'Read ten articles, still unsure?<br>Tried hacks that don\'t stick?<br>Still can\'t focus for one block?',
    painSolution: 'Clear answer. Timer that works.<br>Track every session, task, and streak.<br>All in one place.'
  }
};

const FEATURES_TITLE = 'Everything you need to focus—in <em>one place</em>';

function toSeoTitle(h1) {
  return h1.charAt(0).toUpperCase() + h1.slice(1) + ' | Superfocus';
}

function getStopKey(page) {
  const { category, slug } = page;
  if (category === 'techniques') return 'techniques';
  if (category === 'sounds') return 'sounds';
  if (category === 'workflows') return 'workflows';
  if (category === 'analytics') return 'analytics';
  if (category === 'compare') return 'compare';
  if (category === 'alternatives') return 'alternatives';
  if (category === 'goals') return 'goals';
  if (category === 'professions') return 'professions';
  if (category === 'activities') return 'activities';
  if (category === 'faq') return 'faq';
  if (category === 'use-cases') {
    if (slug.startsWith('study-timer-for') || ['study-timer', 'exam-prep-timer', 'student-productivity'].includes(slug)) {
      return 'study';
    }
    if (['freelancer-productivity', 'work-timer', 'remote-work-focus', 'meeting-prep-timer'].includes(slug)) {
      return 'professions';
    }
  }
  return 'core';
}

function getMetaSuffix(page) {
  return META_SUFFIX[page.category] || META_SUFFIX.default;
}

function durationCopy(minutes) {
  return {
    h1: `Am I actually focusing for ${minutes} minutes straight?`,
    heroSubtitle: `Run every ${minutes}-minute block, break timer, task, ambient sound, and focus streak in one place.`
  };
}

function activityCopy(activity) {
  return {
    h1: `Am I actually finishing my ${activity} in focused blocks?`,
    heroSubtitle: `Block every ${activity} session, timer, task, ambient sound, and streak counter in one place.`
  };
}

function studyTypeCopy(subject) {
  return {
    h1: `Am I actually making progress on my ${subject}?`,
    heroSubtitle: SUB.study
  };
}

function professionCopy(role) {
  return {
    h1: `Am I actually doing focused ${role} work?`,
    heroSubtitle: SUB.professions
  };
}

function compareCopy(competitor) {
  return {
    h1: `Am I actually getting enough from ${competitor}?`,
    heroSubtitle: SUB.compare
  };
}

function alternativeCopy(competitor) {
  return {
    h1: `Am I actually ready to switch from ${competitor}?`,
    heroSubtitle: SUB.compare
  };
}

/** slug -> { h1, heroSubtitle } */
const HERO_COPY = {
  // techniques
  'pomodoro-technique': {
    h1: 'Am I actually finishing my pomodoro sessions?',
    heroSubtitle: 'Run every 25-minute block, break timer, task, ambient sound, and focus streak in one place.'
  },
  'flowtime-timer': {
    h1: 'Am I actually staying in flow long enough?',
    heroSubtitle: 'Run every 45-minute block, flexible break, task, ambient sound, and focus streak in one place.'
  },
  'time-blocking-timer': {
    h1: 'Am I actually protecting time for deep work?',
    heroSubtitle: 'Block every calendar slot, pomodoro session, task, ambient sound, and focus streak in one place.'
  },
  'deep-work-timer': {
    h1: 'Am I actually doing deep work today?',
    heroSubtitle: 'Run every 90-minute block, break timer, task, ambient sound, and focus streak in one place.'
  },
  'sprint-timer': {
    h1: 'Am I actually starting when 25 minutes feels too long?',
    heroSubtitle: 'Run every 15-minute sprint, break timer, task, ambient sound, and focus streak in one place.'
  },
  'marathon-timer': {
    h1: 'Am I actually using long focus sessions well?',
    heroSubtitle: 'Run every 60-minute block, smart break, task, ambient sound, and focus streak in one place.'
  },
  '52-minute-focus': {
    h1: 'Am I actually working with my natural rhythm?',
    heroSubtitle: 'Run every 52-minute block, 17-minute break, task, ambient sound, and focus streak in one place.'
  },
  '90-minute-deep-work': {
    h1: 'Am I actually getting 90 minutes of uninterrupted focus?',
    heroSubtitle: 'Run every 90-minute block, break timer, task, ambient sound, and focus streak in one place.'
  },
  '10-minute-focus': durationCopy(10),
  '20-minute-focus': durationCopy(20),
  '30-minute-focus': durationCopy(30),
  '35-minute-focus': durationCopy(35),
  '40-minute-focus': durationCopy(40),
  '50-minute-focus': durationCopy(50),

  // use-cases
  'study-timer': {
    h1: 'Am I actually studying, or just pretending to?',
    heroSubtitle: SUB.study
  },
  'work-timer': {
    h1: 'Am I actually getting focused work done at my job?',
    heroSubtitle: SUB.core
  },
  'coding-focus-timer': {
    h1: 'Am I actually shipping code, or just browsing Stack Overflow?',
    heroSubtitle: 'Track every coding block, feature task, lofi sound, session streak, and progress report in one place.'
  },
  'writing-timer': {
    h1: 'Am I actually writing, or just staring at the blank page?',
    heroSubtitle: 'Track every writing block, draft task, rain sound, word-count streak, and session log in one place.'
  },
  'exam-prep-timer': {
    h1: 'Am I actually ready for this exam?',
    heroSubtitle: SUB.study
  },
  'adhd-focus-timer': {
    h1: 'Am I actually working with my ADHD brain, not against it?',
    heroSubtitle: 'Run every 15-minute sprint, white noise, task, visual timer, and focus streak in one place.'
  },
  'student-productivity': {
    h1: 'Am I actually making progress on my assignments?',
    heroSubtitle: SUB.study
  },
  'freelancer-productivity': {
    h1: 'Am I actually tracking my billable focus hours?',
    heroSubtitle: 'Track every client block, Todoist task, focus streak, ambient sound, and hours report in one place.'
  },
  'remote-work-focus': {
    h1: 'Am I actually working from home—or just at home?',
    heroSubtitle: 'Track every focus block, work task, cafe sound, session streak, and daily report in one place.'
  },
  'deep-work-app': {
    h1: 'Am I actually doing deep work, not just blocking noise?',
    heroSubtitle: 'Run every 90-minute block, ambient sound, task, focus streak, and analytics report in one place.'
  },
  'meeting-prep-timer': {
    h1: 'Am I actually prepared for my next meeting?',
    heroSubtitle: 'Block every 15-minute prep sprint, agenda task, focus timer, ambient sound, and streak in one place.'
  },

  // study types
  'study-timer-for-flashcards': studyTypeCopy('flashcards'),
  'study-timer-for-essay-writing': studyTypeCopy('essay'),
  'study-timer-for-language-learning': studyTypeCopy('language practice'),
  'study-timer-for-reading': studyTypeCopy('reading'),
  'study-timer-for-thesis': studyTypeCopy('thesis'),
  'study-timer-for-note-taking': studyTypeCopy('notes'),
  'study-timer-for-online-courses': studyTypeCopy('online course'),
  'study-timer-for-group-study': {
    h1: 'Am I actually staying focused during group study?',
    heroSubtitle: SUB.study
  },
  'study-timer-for-math': studyTypeCopy('math problems'),
  'study-timer-for-med-school': studyTypeCopy('med school material'),

  // sounds
  'focus-music': {
    h1: 'Am I actually finding music that helps me focus?',
    heroSubtitle: SUB.sounds
  },
  'lofi-study-music': {
    h1: 'Am I actually studying with lofi, not browsing playlists?',
    heroSubtitle: SUB.sounds
  },
  'rain-sounds-focus': {
    h1: 'Am I actually blocking out distracting noise?',
    heroSubtitle: SUB.sounds
  },
  'cafe-ambient-sounds': {
    h1: 'Am I actually getting the coffee shop focus vibe at home?',
    heroSubtitle: SUB.sounds
  },
  'white-noise-focus': {
    h1: 'Am I actually filtering out unpredictable sounds?',
    heroSubtitle: SUB.sounds
  },

  // workflows
  'todoist-pomodoro': {
    h1: 'Am I actually turning my Todoist list into finished work?',
    heroSubtitle: SUB.workflows
  },
  'task-planning-workflow': {
    h1: 'Am I actually following through on my daily plan?',
    heroSubtitle: SUB.workflows
  },

  // analytics
  'productivity-analytics': {
    h1: 'Am I actually measuring my productivity?',
    heroSubtitle: SUB.analytics
  },
  'focus-time-tracking': {
    h1: 'Am I actually knowing where my time went?',
    heroSubtitle: SUB.analytics
  },
  'pomodoro-statistics': {
    h1: 'Am I actually building pomodoro consistency?',
    heroSubtitle: SUB.analytics
  },

  // compare
  'superfocus-vs-pomofocus': compareCopy('Pomofocus'),
  'superfocus-vs-forest': compareCopy('Forest'),
  'superfocus-vs-flocus': compareCopy('Flocus'),
  'superfocus-vs-focusmate': compareCopy('Focusmate'),
  'superfocus-vs-brain-fm': compareCopy('Brain.fm'),
  'superfocus-vs-be-focused': compareCopy('Be Focused'),
  'superfocus-vs-marinara': compareCopy('Marinara Timer'),
  'superfocus-vs-focus-keeper': compareCopy('Focus Keeper'),
  'superfocus-vs-ticktick': compareCopy('TickTick'),
  'superfocus-vs-clockify': compareCopy('Clockify'),
  'superfocus-vs-noisli': compareCopy('Noisli'),
  'pomodoro-timer-apps': {
    h1: 'Am I actually picking the right pomodoro app?',
    heroSubtitle: SUB.compare
  },

  // alternatives
  pomofocus: alternativeCopy('Pomofocus'),
  'forest-app': alternativeCopy('Forest'),
  'best-pomodoro-apps': {
    h1: 'Am I actually going to start a pomodoro today?',
    heroSubtitle: SUB.compare
  },
  'brain-fm-alternative': alternativeCopy('Brain.fm'),
  'be-focused-alternative': alternativeCopy('Be Focused'),
  'marinara-alternative': alternativeCopy('Marinara Timer'),
  'focus-keeper-alternative': alternativeCopy('Focus Keeper'),
  'ticktick-pomodoro-alternative': alternativeCopy('TickTick Pomodoro'),
  'flocus-alternative': alternativeCopy('Flocus'),
  'focusmate-alternative': alternativeCopy('Focusmate'),
  'noisli-alternative': alternativeCopy('Noisli'),

  // goals
  'enter-flow-state': {
    h1: 'Am I actually reaching flow state?',
    heroSubtitle: 'Run every 45 or 90-minute block, ambient sound, task, focus streak, and session log in one place.'
  },
  'reduce-distractions': {
    h1: 'Am I actually reducing my distractions?',
    heroSubtitle: 'Block every pomodoro session, lofi sound, task, focus streak, and distraction log in one place.'
  },
  'build-focus-habits': {
    h1: 'Am I actually building a focus habit?',
    heroSubtitle: SUB.analytics
  },
  'avoid-burnout': {
    h1: 'Am I actually working sustainably?',
    heroSubtitle: 'Run every focus block, scheduled break, task, streak counter, and rest log in one place.'
  },
  'increase-productivity': {
    h1: 'Am I actually increasing my productivity?',
    heroSubtitle: SUB.analytics
  },
  'stay-focused-longer': {
    h1: 'Am I actually staying focused longer?',
    heroSubtitle: 'Run every extended block, break timer, ambient sound, task, and focus streak in one place.'
  },
  'block-distractions': {
    h1: 'Am I actually blocking distractions?',
    heroSubtitle: 'Block every pomodoro session, ambient sound, task, phone-free streak, and focus log in one place.'
  },
  'focus-without-phone': {
    h1: 'Am I actually focusing without my phone?',
    heroSubtitle: 'Run every phone-free block, timer, ambient sound, task, and focus streak in one place.'
  },

  // professions
  'focus-timer-for-lawyers': professionCopy('legal'),
  'focus-timer-for-designers': professionCopy('design'),
  'focus-timer-for-researchers': professionCopy('research'),
  'focus-timer-for-teachers': professionCopy('teaching'),
  'focus-timer-for-consultants': professionCopy('consulting'),
  'focus-timer-for-project-managers': professionCopy('project management'),
  'focus-timer-for-marketers': professionCopy('marketing'),

  // activities
  'focus-timer-for-email': activityCopy('email'),
  'focus-timer-for-research': activityCopy('research'),
  'focus-timer-for-content-creation': activityCopy('content creation'),
  'focus-timer-for-brainstorming': activityCopy('brainstorming'),
  'focus-timer-for-admin-tasks': activityCopy('admin work'),
  'focus-timer-for-reviews': activityCopy('review'),
  'focus-timer-for-planning': activityCopy('planning'),

  // faq
  'how-long-pomodoro-session': {
    h1: 'Am I actually using the right pomodoro length?',
    heroSubtitle: SUB.faq
  },
  'is-superfocus-free': {
    h1: 'Am I actually getting a free focus timer that works?',
    heroSubtitle: SUB.faq
  },
  'best-pomodoro-length': {
    h1: 'Am I actually picking the best pomodoro length?',
    heroSubtitle: SUB.faq
  },
  'pomodoro-vs-flowtime': {
    h1: 'Am I actually using the right timer method?',
    heroSubtitle: 'Compare every pomodoro block, flowtime session, task, ambient sound, and focus streak in one place.'
  },
  'how-many-pomodoros-per-day': {
    h1: 'Am I actually doing enough pomodoros per day?',
    heroSubtitle: SUB.analytics
  },
  'pomodoro-break-length': {
    h1: 'Am I actually taking the right breaks?',
    heroSubtitle: 'Run every work block, break timer, task, ambient sound, and focus streak in one place.'
  },
  'focus-timer-with-sounds': {
    h1: 'Am I actually pairing sounds with my focus timer?',
    heroSubtitle: SUB.sounds
  },
  'pomodoro-for-adhd': {
    h1: 'Am I actually using a pomodoro method that fits ADHD?',
    heroSubtitle: 'Run every 15-minute sprint, white noise, task, visual timer, and focus streak in one place.'
  },
  'how-to-enter-flow-state': {
    h1: 'Am I actually setting up for flow state?',
    heroSubtitle: 'Run every long block, ambient sound, task, focus streak, and session log in one place.'
  },
  'pomodoro-timer-online': {
    h1: 'Am I actually finding a pomodoro timer that works in my browser?',
    heroSubtitle: SUB.faq
  }
};

function adLandingEntry(heroTitle, heroSubtitle, stopKey, metaSuffix) {
  const stop = STOP[stopKey] || STOP.core;
  return {
    heroTitle,
    heroSubtitle,
    pageTitle: toSeoTitle(heroTitle),
    metaDescription: heroSubtitle + metaSuffix,
    stopPain: stop.painPoints,
    stopSolution: stop.painSolution,
    featuresTitle: 'Everything you need to focus—in one place',
    howHelpTagline: heroSubtitle
  };
}

const AD_LANDING_COPY = {
  '/pomodoro-timer': adLandingEntry(
    'Am I actually finishing my pomodoro sessions?',
    'Run every 25-minute block, break timer, task, ambient sound, and focus streak in one place.',
    'techniques',
    ' Free Pomodoro timer—no signup to try.'
  ),
  '/focus-timer': adLandingEntry(
    'Am I actually getting focused work done?',
    SUB.core,
    'core',
    ' Free focus timer—no signup to try.'
  ),
  '/work-timer': adLandingEntry(
    'Am I actually getting focused work done at my job?',
    SUB.core,
    'professions',
    ' Free work timer—no signup to try.'
  ),
  '/study-timer': adLandingEntry(
    'Am I actually studying, or just pretending to?',
    SUB.study,
    'study',
    ' Free study timer—no signup to try.'
  ),
  '/time-management': adLandingEntry(
    'Am I actually managing my time, or just staying busy?',
    'Block every calendar slot, pomodoro session, task, ambient sound, and focus streak in one place.',
    'core',
    ' Free time blocking—no signup to try.'
  ),
  '/productivity-app': adLandingEntry(
    'Am I actually being productive, or just switching apps?',
    'Sync every Todoist task, custom timer, focus streak, ambient sound, and analytics report in one place.',
    'workflows',
    ' Free productivity app—no signup to try.'
  )
};

const HOMEPAGE_STOP = STOP.core;

function applyToPage(page) {
  const copy = HERO_COPY[page.slug];
  if (!copy) {
    console.warn(`No hero copy for slug: ${page.slug}`);
    return page;
  }
  const stop = STOP[getStopKey(page)] || STOP.core;
  return {
    ...page,
    h1: copy.h1,
    heroSubtitle: copy.heroSubtitle,
    title: toSeoTitle(copy.h1),
    description: copy.heroSubtitle + getMetaSuffix(page),
    painPoints: stop.painPoints,
    painSolution: stop.painSolution
  };
}

function updatePagesJson() {
  const data = JSON.parse(fs.readFileSync(PAGES_JSON, 'utf8'));
  data.pages = data.pages.map(applyToPage);
  fs.writeFileSync(PAGES_JSON, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${data.pages.length} pages in pages.json`);
}

function updateDatabases() {
  const files = fs.readdirSync(DATABASES_DIR).filter(f => f.endsWith('.json'));
  let count = 0;
  for (const file of files) {
    const filePath = path.join(DATABASES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.entries) continue;
    data.entries = data.entries.map(applyToPage);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    count += data.entries.length;
    console.log(`Updated ${data.entries.length} entries in ${file}`);
  }
  console.log(`Updated ${count} database entries total`);
}

function updateScriptJs() {
  const scriptPath = path.join(ROOT, 'script.js');
  let script = fs.readFileSync(scriptPath, 'utf8');
  const start = script.indexOf('const ASSET_LANDING_COPY = {');
  const end = script.indexOf('};', start) + 2;
  if (start === -1 || end <= start) throw new Error('ASSET_LANDING_COPY block not found in script.js');

  const lines = ['const ASSET_LANDING_COPY = {'];
  for (const [route, copy] of Object.entries(AD_LANDING_COPY)) {
    lines.push(`    '${route}': {`);
    lines.push(`        heroTitle: '${copy.heroTitle.replace(/'/g, "\\'")}',`);
    lines.push(`        heroSubtitle: '${copy.heroSubtitle.replace(/'/g, "\\'")}',`);
    lines.push(`        stopPain: '${copy.stopPain.replace(/'/g, "\\'")}',`);
    lines.push(`        stopSolution: '${copy.stopSolution.replace(/'/g, "\\'")}',`);
    lines.push(`        stopTagline: 'Less effort. More results.',`);
    lines.push(`        metaDescription: '${copy.metaDescription.replace(/'/g, "\\'")}',`);
    lines.push(`        pageTitle: '${copy.pageTitle.replace(/'/g, "\\'")}',`);
    lines.push(`        howHelpTitle: 'How Superfocus helps you <em>focus</em>',`);
    lines.push(`        howHelpTagline: '${copy.howHelpTagline.replace(/'/g, "\\'")}',`);
    lines.push(`        featuresTitle: '${copy.featuresTitle.replace(/'/g, "\\'")}'`);
    lines.push('    },');
  }
  lines.push('};');
  script = script.slice(0, start) + lines.join('\n') + script.slice(end);
  fs.writeFileSync(scriptPath, script);
  console.log('Updated ASSET_LANDING_COPY in script.js');
}

function updateAdLandingHtml() {
  const htmlFiles = [
    'pomodoro-timer.html',
    'focus-timer.html',
    'work-timer.html',
    'study-timer.html',
    'time-management.html',
    'productivity-app.html'
  ];

  for (const file of htmlFiles) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) continue;
    const route = '/' + file.replace('.html', '');
    const copy = AD_LANDING_COPY[route];
    if (!copy) continue;

    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(
      /<h1 class="content-hero-title">[^<]*<\/h1>/,
      `<h1 class="content-hero-title">${copy.heroTitle}</h1>`
    );
    html = html.replace(
      /<p class="content-hero-subtitle">[^<]*<\/p>/,
      `<p class="content-hero-subtitle">${copy.heroSubtitle}</p>`
    );
    html = html.replace(
      /<p class="stop-start-pain">[\s\S]*?<\/p>/,
      `<p class="stop-start-pain">${copy.stopPain}</p>`
    );
    html = html.replace(
      /<p class="stop-start-solution">[\s\S]*?<\/p>/,
      `<p class="stop-start-solution">${copy.stopSolution}</p>`
    );
    html = html.replace(
      /<h2 class="features-grid-title">[\s\S]*?<\/h2>/,
      `<h2 class="features-grid-title">${copy.featuresTitle}</h2>`
    );
    html = html.replace(
      /<p class="how-we-help-tagline">[^<]*<\/p>/,
      `<p class="how-we-help-tagline">${copy.howHelpTagline}</p>`
    );
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${copy.pageTitle}</title>`
    );
    html = html.replace(
      /<meta name="title" content="[^"]*">/,
      `<meta name="title" content="${copy.pageTitle}">`
    );
    html = html.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${copy.metaDescription}">`
    );
    html = html.replace(
      /<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${copy.pageTitle}">`
    );
    html = html.replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${copy.metaDescription}">`
    );
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*">/,
      `<meta name="twitter:title" content="${copy.pageTitle}">`
    );
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${copy.metaDescription}">`
    );
    fs.writeFileSync(filePath, html);
    console.log(`Updated ${file}`);
  }
}

function updateIndexHtml() {
  const filePath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(
    /<p class="stop-start-pain">[\s\S]*?<\/p>/,
    `<p class="stop-start-pain">${HOMEPAGE_STOP.painPoints}</p>`
  );
  html = html.replace(
    /<p class="stop-start-solution">[\s\S]*?<\/p>/,
    `<p class="stop-start-solution">${HOMEPAGE_STOP.painSolution}</p>`
  );
  html = html.replace(
    /<h2 class="features-grid-title">[\s\S]*?<\/h2>/,
    `<h2 class="features-grid-title">${FEATURES_TITLE}</h2>`
  );
  html = html.replace(
    /<p class="how-we-help-tagline">[^<]*<\/p>/,
    `<p class="how-we-help-tagline">${SUB.core}</p>`
  );
  fs.writeFileSync(filePath, html);
  console.log('Updated index.html sections');
}

function updatePseoTemplate() {
  const filePath = path.join(ROOT, 'pseo', 'content-section.html');
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(
    /<h2 class="features-grid-title">[\s\S]*?<\/h2>/,
    `<h2 class="features-grid-title">${FEATURES_TITLE}</h2>`
  );
  fs.writeFileSync(filePath, html);
  console.log('Updated pseo/content-section.html');
}

function verifyCoverage() {
  const pages = JSON.parse(fs.readFileSync(PAGES_JSON, 'utf8')).pages;
  const slugs = new Set(pages.map(p => p.slug));
  const dbFiles = fs.readdirSync(DATABASES_DIR).filter(f => f.endsWith('.json'));
  for (const file of dbFiles) {
    const db = JSON.parse(fs.readFileSync(path.join(DATABASES_DIR, file), 'utf8'));
    for (const e of db.entries || []) slugs.add(e.slug);
  }
  const missing = [...slugs].filter(s => !HERO_COPY[s]);
  if (missing.length) {
    console.error('Missing copy for slugs:', missing.join(', '));
    process.exit(1);
  }
  console.log(`Coverage OK: ${slugs.size} slugs`);
}

verifyCoverage();
updatePagesJson();
updateDatabases();
updatePseoTemplate();
updateScriptJs();
updateAdLandingHtml();
updateIndexHtml();
console.log('Done. Run: npm run build:pseo');
