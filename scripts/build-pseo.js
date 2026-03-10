#!/usr/bin/env node
/**
 * Build script for pSEO Phase 1 pages.
 * Uses index.html as base (timer + sidebar + full app UI) and replaces only the content-section.
 * Output: techniques/, use-cases/, sounds/, workflows/, analytics/, compare/, alternatives/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PSEO_DIR = path.join(ROOT, 'pseo');
const PAGES_JSON = path.join(PSEO_DIR, 'pages.json');
const INDEX_PATH = path.join(ROOT, 'index.html');
const CONTENT_SECTION_PATH = path.join(PSEO_DIR, 'content-section.html');
const BASE_URL = 'https://www.superfocus.live';

const CONTENT_SECTION_REPLACE_RE = /    <!-- Content Section - Educational Content -->\s*<section class="content-section">[\s\S]*?    <\/section>/;

function loadJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStopPain(page) {
  const cat = page.category;
  const pains = {
    techniques: 'Too many distractions?<br>Not enough done?<br>Time flying by with nothing to show?',
    'use-cases': 'Scattered focus?<br>Meetings eating your day?<br>No time for deep work?',
    sounds: 'Noise killing your concentration?<br>Can\'t get into flow?<br>Need to block the world out?',
    workflows: 'Tasks piling up?<br>No system to focus?<br>Losing track of what matters?',
    analytics: 'No idea how much you focus?<br>Can\'t see progress?<br>Want to build better habits?',
    compare: 'Comparing focus apps?<br>Need features that actually work?<br>Want one app that does it all?',
    alternatives: 'Looking for a better focus app?<br>Need timers + sounds + tasks?<br>Want to try something new?'
  };
  return pains[cat] || pains.techniques;
}

function getStopSolution(page) {
  const cat = page.category;
  const sols = {
    techniques: 'Focus a little. Get more done.<br>Use small blocks of time. See real progress.',
    'use-cases': 'Block time for deep work.<br>Use a timer that fits your workflow.<br>See results every day.',
    sounds: 'Block noise with ambient sound.<br>Signal your brain to focus.<br>Enter flow state faster.',
    workflows: 'Combine timer with tasks.<br>Track pomodoros per project.<br>Stay on top of your work.',
    analytics: 'Track focus time. Spot patterns.<br>Build lasting habits.<br>See how much you accomplish.',
    compare: 'Superfocus combines timer, sounds, tasks, and analytics.<br>One app. No compromises.<br>Try it free.',
    alternatives: 'Superfocus: timer, cassettes, tasks, analytics.<br>Free to start. No credit card.<br>Focus better today.'
  };
  return sols[cat] || sols.techniques;
}

function getHowWeHelp(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const defaults = {
    techniques: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Get 2 hours of deep focus done in one morning.',
      blocks: [
        { title: 'Stay in flow', text: '25-minute blocks match your attention span. Start, work, break, repeat. No decision fatigue.' },
        { title: 'Block distractions', text: 'Queue your work. Block noise with ambient sound. Get into deep work without scroll or ping.' },
        { title: 'See progress', text: 'Track focus time and streaks. Compete with others. Build lasting habits.' }
      ]
    },
    'use-cases': {
      title: `How Superfocus helps you <em>${keyword.replace(/ timer$/i, '')}</em>`,
      tagline: 'Whether you\'re studying, coding, or working—one timer fits all.',
      blocks: [
        { title: 'Stay in flow', text: 'Pomodoro, Flow, or Deep Work presets. Pick your block length. Focus without deciding.' },
        { title: 'Block distractions', text: 'Ambient sounds and focus music. Block noise. Enter flow faster.' },
        { title: 'See progress', text: 'Track sessions and streaks. Stay motivated. Build habits that stick.' }
      ]
    },
    sounds: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Lofi, rain, cafe—sounds that signal your brain to focus.',
      blocks: [
        { title: 'Stay in flow', text: 'Built-in cassettes plus your Spotify playlists. One click to block the world.' },
        { title: 'Block distractions', text: 'Ambient sound masks office noise and chatter. Concentrate without earbuds.' },
        { title: 'See progress', text: 'Pair sounds with any timer. Track focus time. Build lasting focus habits.' }
      ]
    },
    workflows: {
      title: 'How Superfocus helps your <em>workflow</em>',
      tagline: 'Timer + tasks + analytics. One system.',
      blocks: [
        { title: 'Stay in flow', text: 'Sync with Todoist. Assign pomodoros to tasks. Work in blocks.' },
        { title: 'Block distractions', text: 'Queue tasks. Block noise. Focus on one thing at a time.' },
        { title: 'See progress', text: 'Track pomodoros per task. Spot patterns. Improve estimates.' }
      ]
    },
    analytics: {
      title: 'How Superfocus helps you <em>see progress</em>',
      tagline: 'Know exactly how much you focus.',
      blocks: [
        { title: 'Stay in flow', text: 'Daily, weekly, monthly focus time. See your patterns at a glance.' },
        { title: 'Block distractions', text: 'Track streaks. Build accountability. Stay consistent.' },
        { title: 'See progress', text: 'Premium analytics show deep work hours. Improve over time.' }
      ]
    },
    compare: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Timer, sounds, tasks, analytics—all in one app.',
      blocks: [
        { title: 'Stay in flow', text: '25-minute blocks or longer. Pomodoro, Flow, Deep Work. Pick what fits.' },
        { title: 'Block distractions', text: 'Lofi, rain, cafe. Ambient cassettes. Spotify integration.' },
        { title: 'See progress', text: 'Task tracking. Analytics. Leaderboard. One app, no juggling.' }
      ]
    },
    alternatives: {
      title: 'How Superfocus helps you <em>focus</em>',
      tagline: 'Try a better way to get things done.',
      blocks: [
        { title: 'Stay in flow', text: 'Timers that match your style. Short sprints or long deep work.' },
        { title: 'Block distractions', text: 'Ambient sounds built in. No separate app needed.' },
        { title: 'See progress', text: 'Tasks, analytics, leaderboard. All included. Free to start.' }
      ]
    }
  };
  return defaults[cat] || defaults.techniques;
}

function getPresetSection(page) {
  const preset = page.preset || 'Pomodoro (25/5/15 min)';
  return `<h2>Recommended Superfocus Preset</h2>
                <p>For ${page.keyword}, we recommend <strong>${escapeHtml(preset)}</strong>. Superfocus has built-in presets for Pomodoro, Flow, Sprint, Deep Work, and Marathon—plus ambient cassettes (lofi, rain, cafe) to block noise and help you enter flow state.</p>`;
}

function getWhatIs(page) {
  const cat = page.category;
  const keyword = page.keyword;
  const slug = page.slug;
  const preset = page.preset || 'Pomodoro';

  const headingMap = {
    'pomodoro-technique': 'Superfocus',
    'flowtime-timer': 'the Flowtime method',
    'time-blocking-timer': 'time blocking',
    'deep-work-timer': 'a deep work timer',
    'sprint-timer': 'a sprint timer',
    'marathon-timer': 'a marathon timer',
    '52-minute-focus': 'the 52-minute focus method',
    '90-minute-deep-work': '90-minute deep work'
  };
  let heading = headingMap[slug];
  if (!heading) {
    if (cat === 'compare' || cat === 'alternatives') heading = 'Superfocus';
    else if (keyword.match(/^(a|an|the)\s/i)) heading = keyword;
    else heading = `a ${keyword}`;
  }

  const paragraphMap = {
    'pomodoro-technique': 'Superfocus is a <a href="https://www.superfocus.live/" class="inline-text-link">Pomodoro timer app</a> that helps you focus and get more done. The Pomodoro Technique uses 25-minute work blocks with 5-minute breaks. Superfocus builds on this <a href="https://en.wikipedia.org/wiki/Pomodoro_Technique" target="_blank" rel="noopener noreferrer" class="inline-text-link">time management method</a> developed by Francesco Cirillo—with ambient sounds, tasks, and analytics built in.',
    'flowtime-timer': 'The Flowtime method uses longer work blocks (45+ minutes) with flexible breaks. Superfocus offers the Flow preset (45/8/25) for those who prefer fewer interruptions and longer focus sessions. It\'s ideal for <a href="https://en.wikipedia.org/wiki/Deep_work" target="_blank" rel="noopener noreferrer" class="inline-text-link">deep work</a> and flow state.',
    'time-blocking-timer': 'Time blocking is a productivity method where you schedule specific blocks for tasks. Superfocus combines a focus timer with task management—so you can block focus time, assign pomodoros to tasks, and see how much you get done.',
    'deep-work-timer': 'A deep work timer uses 90-minute blocks to match your <a href="https://en.wikipedia.org/wiki/Ultradian_rhythm" target="_blank" rel="noopener noreferrer" class="inline-text-link">ultradian rhythm</a>. Superfocus has a built-in Deep Work preset (90/20/30) for extended focus sessions without interruption.',
    'sprint-timer': 'A sprint timer uses short 15-minute bursts for quick wins. Superfocus Sprint preset (15/3/10) is ideal for ADHD, quick tasks, or when 25 minutes feels too long. Get momentum in small blocks.',
    'marathon-timer': 'A marathon timer uses 60-minute focus blocks for extended deep work. Superfocus Marathon preset (60/10/30) is built for writers, researchers, and anyone who needs longer uninterrupted sessions.',
    '52-minute-focus': 'The 52-minute focus method is based on <a href="https://en.wikipedia.org/wiki/Ultradian_rhythm" target="_blank" rel="noopener noreferrer" class="inline-text-link">ultradian rhythms</a>. Work 52 minutes, break 17. Superfocus lets you create custom timers to match your body\'s natural cycles.',
    '90-minute-deep-work': '90-minute deep work sessions align with your ultradian rhythm—the natural ~90-minute cycle of focus and rest. Superfocus Deep Work preset (90/20/30) lets you capitalize on this without manual timer tweaking.',
    'study-timer': 'A study timer helps students block time, take breaks, and stay focused. Superfocus combines Pomodoro (or Sprint) with lofi and ambient sounds—so you can study for exams, write papers, or power through readings without burning out.',
    'work-timer': 'A work timer keeps professionals on track during busy days. Superfocus combines Pomodoro, Flow, and Deep Work presets with task tracking and ambient sounds—so you can block focus time between meetings and get real work done.',
    'coding-focus-timer': 'A coding focus timer helps developers enter flow state. Superfocus Deep Work (90 min) or Flow (45 min) presets, plus lofi sounds, let you code without context switching or distraction.',
    'writing-timer': 'A writing timer helps writers overcome block and ship. Superfocus Pomodoro or Marathon presets, plus rain and lofi sounds, create a ritual for deep writing sessions.',
    'focus-music': 'Focus music (lofi, rain, cafe) helps block noise and signal your brain to concentrate. Superfocus includes built-in cassettes plus Spotify integration—use any timer preset with ambient sound.',
    'lofi-study-music': 'Lofi study music combines chill beats with ambient sound to aid concentration. Superfocus has curated lofi cassettes plus your Spotify playlists—pair with Pomodoro or any timer.',
    'todoist-pomodoro': 'Todoist Pomodoro combines task management with a focus timer. Superfocus syncs with Todoist so you can assign pomodoros to tasks, track completion, and stay organized.',
    'productivity-analytics': 'Productivity analytics show how much you focus each day, week, and month. Superfocus Premium tracks sessions, streaks, and trends—so you can build better habits and see real progress.',
    'superfocus-vs-pomofocus': 'Superfocus combines a Pomodoro timer with ambient sounds (lofi, rain, cafe), Todoist sync, and productivity analytics. It builds on <a href="https://pomofocus.io/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Pomofocus</a> with extra features—sounds, tasks, and insights—in one app. Free to try.',
    'superfocus-vs-forest': 'Superfocus is a browser-based focus timer with Pomodoro, ambient sounds, and analytics. Unlike <a href="https://www.forestapp.cc/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Forest</a>, it runs on desktop without your phone. Lofi, rain, cafe cassettes plus task tracking and leaderboard.',
    'superfocus-vs-flocus': 'Superfocus blends a Pomodoro timer with ambient cassettes and task management. Compare with <a href="https://flocus.com/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Flocus</a>—both offer focus timers and productivity tools. Superfocus adds lofi, rain, and Spotify integration.',
    'superfocus-vs-focusmate': 'Superfocus is a solo focus timer with ambient sounds and Pomodoro. <a href="https://www.focusmate.com/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Focusmate</a> pairs you with an accountability partner. Different styles: Superfocus for independent deep work, Focusmate for session accountability.',
    'pomodoro-timer-apps': 'Superfocus is one of the best Pomodoro timer apps in 2026. It combines 25-minute focus blocks with lofi, rain, cafe sounds, Todoist sync, and analytics. Free to start.',
    'pomofocus': 'Superfocus is a Pomofocus alternative with ambient sounds, Todoist sync, and analytics. Same simple Pomodoro timer—plus cassettes and productivity insights. Free to try.',
    'forest-app': 'Superfocus is a Forest app alternative that runs in your browser. No phone needed. Pomodoro timer, lofi and rain cassettes, task tracking, and analytics—all in one place.',
    'best-pomodoro-apps': 'Superfocus is among the best Pomodoro apps for 2026. Pomodoro, Flow, Deep Work presets; ambient sounds; Todoist sync; and analytics. Free to start, no credit card.'
  };
  let paragraph = paragraphMap[slug];
  if (!paragraph) {
    paragraph = `Superfocus is a <a href="https://www.superfocus.live/" class="inline-text-link">focus timer app</a> that supports ${keyword}. Use ${preset} plus ambient sounds (lofi, rain, cafe), task tracking, and analytics. Free to try.`;
  }
  return { heading, paragraph };
}

function getTopicSection(page) {
  const slug = page.slug;
  const needsPomodoro = ['pomodoro-technique', 'study-timer', 'work-timer', 'exam-prep-timer', 'todoist-pomodoro', 'task-planning-workflow'].includes(slug) ||
    (page.keyword && page.keyword.toLowerCase().includes('pomodoro'));
  if (!needsPomodoro) return '';

  return `<h2>What is the Pomodoro Technique?</h2>
                <p>The Pomodoro Technique is a time management method: focus for 25 minutes, take a 5-minute break, repeat. After 4 sessions, take a 15-minute break. <a href="https://youtu.be/IlU-zDU6aQ0" target="_blank" rel="noopener noreferrer" class="inline-text-link">Learn more →</a></p>
                <p>This <a href="https://en.wikipedia.org/wiki/Timeboxing" target="_blank" rel="noopener noreferrer" class="inline-text-link">timeboxing</a> method combines 25-minute work intervals with short breaks to sustain focus. Beyond the timer, it includes daily planning, interruption management, and effort estimation.</p>`;
}

function getBenefits(page) {
  const links = [
    '<a href="https://en.wikipedia.org/wiki/Deep_work" target="_blank" rel="noopener noreferrer" class="inline-text-link">deep work</a>',
    '<a href="https://en.wikipedia.org/wiki/Ultradian_rhythm" target="_blank" rel="noopener noreferrer" class="inline-text-link">attention cycles</a>',
    '<a href="https://www.helpguide.org/mental-health/stress/burnout-prevention-and-recovery" target="_blank" rel="noopener noreferrer" class="inline-text-link">burnout</a>',
    '<a href="https://grokipedia.com/page/Productivity" target="_blank" rel="noopener noreferrer" class="inline-text-link">productivity</a>'
  ];
  return [
    `<strong>Stay focused</strong> — 25-minute sessions keep you in ${links[0]} mode by aligning with natural ${links[1]}.`,
    `<strong>Avoid burnout</strong> — Regular breaks keep your energy high and help prevent ${links[2]}.`,
    `<strong>Track progress</strong> — See exactly how much you accomplish and improve your ${links[3]}.`
  ].map(li => `<li>${li}</li>`).join('\n                    ');
}

function getHowToHeading(page) {
  const cat = page.category;
  if (cat === 'techniques' && page.slug && page.slug.includes('pomodoro')) return 'How to use the Pomodoro Timer?';
  if (cat === 'techniques') return `How to use the ${page.keyword}?`;
  if (cat === 'use-cases') return `How to use a ${page.keyword}?`;
  if (cat === 'sounds') return `How to use focus music with Superfocus?`;
  if (cat === 'workflows') return 'How to set up the workflow?';
  if (cat === 'analytics') return 'How to track focus time?';
  return 'How to get started?';
}

function getHowToSteps(page) {
  const cat = page.category;
  const base = [
    '<li>Pick your task</li>',
    '<li>Start the timer and focus for 25 minutes</li>',
    '<li>Take a 5-minute break</li>',
    '<li>Repeat 4 times, then take a longer break</li>'
  ];
  if (cat === 'sounds') {
    return [
      '<li>Choose a timer preset (Pomodoro, Flow, etc.)</li>',
      '<li>Select a cassette (lofi, rain, cafe) or add Spotify</li>',
      '<li>Press start and focus</li>'
    ].join('\n                    ');
  }
  if (cat === 'workflows') {
    return [
      '<li>Connect Todoist in Superfocus</li>',
      '<li>Add tasks and assign pomodoros</li>',
      '<li>Start the timer and work through your list</li>'
    ].join('\n                    ');
  }
  if (cat === 'analytics') {
    return [
      '<li>Sign up for Superfocus (free)</li>',
      '<li>Use the timer and complete sessions</li>',
      '<li>Upgrade to Premium to see daily, weekly, monthly analytics</li>'
    ].join('\n                    ');
  }
  return base.join('\n                    ');
}

function getFeatures(page) {
  const links = [
    '<a href="https://en.wikipedia.org/wiki/Concentration" target="_blank" rel="noopener noreferrer" class="inline-text-link">concentration</a>',
    '<a href="https://en.wikipedia.org/wiki/Habit" target="_blank" rel="noopener noreferrer" class="inline-text-link">habits</a>',
    '<a href="https://en.wikipedia.org/wiki/Motivation" target="_blank" rel="noopener noreferrer" class="inline-text-link">motivated</a>'
  ];
  return [
    '<strong>Timer techniques</strong> — Pomodoro, Sprint, Flow State, Deep Work, and Marathon. Choose short sprints or longer deep work sessions.',
    '<strong>Tasks</strong> — Add tasks, assign pomodoros, and track progress.',
    `<strong>Cassettes</strong> — Ambient sounds and visual themes to sustain ${links[0]} and block distractions.`,
    `<strong>Analytics</strong> — Session history and metrics to build better work ${links[1]}.`,
    `<strong>Leaderboard</strong> — Compete with others and stay ${links[2]}.`
  ].map(li => `<li>${li}</li>`).join('\n                    ');
}

function getFaq(page) {
  const category = page.category;
  const keyword = page.keyword;
  const baseFaq = [
    { q: `What is the best ${keyword}?`, a: `Superfocus offers ${page.preset || 'Pomodoro'} plus ambient sounds, task tracking, and analytics. Free to try.` },
    { q: 'Is Superfocus free?', a: 'Yes. <a href="https://www.superfocus.live/" target="_blank" rel="noopener noreferrer" class="inline-text-link">Superfocus</a> is free to use. Free users get 2 hours of focus per day; guests get 1 hour. Upgrade to Premium for unlimited focus, all timer techniques, and more.' },
    { q: 'Does Superfocus have ambient sounds?', a: 'Yes. Superfocus includes lofi, rain, cafe, and other focus cassettes. You can also add your own Spotify playlists.' },
    { q: 'What problem does Superfocus solve?', a: 'Superfocus helps you stay focused, avoid burnout, and track progress. It combines a Pomodoro timer with ambient sounds, task management, and productivity insights—so you can get into flow, maintain energy, and see how much you accomplish.' }
  ];
  if (category === 'compare' && page.competitor) {
    baseFaq.unshift({
      q: `Which is better: Superfocus or ${page.competitor}?`,
      a: `Superfocus adds ambient sounds, Todoist sync, analytics, and multiple timer presets (Pomodoro, Flow, Deep Work). ${page.competitor} has its own strengths. Try Superfocus free to compare.`
    });
  }
  return baseFaq.map((f, i) => {
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
  if (page.keyword && page.keyword.toLowerCase().includes('pomodoro')) {
    links.push({ url: 'https://en.wikipedia.org/wiki/Pomodoro_Technique', text: 'Pomodoro Technique (Wikipedia)' });
  }
  if (page.category === 'compare' && page.competitorUrl) {
    links.push({ url: page.competitorUrl, text: page.competitor });
  }
  if (links.length === 0) return '';
  const items = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="inline-text-link">${l.text}</a>`).join(' · ');
  return `<p style="margin-top: 2rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);">Further reading: ${items}</p>`;
}

function normalizeLocalUrlsToRoot(html) {
  return html.replace(
    /(\s(?:href|src)=["'])(?!https?:\/\/|\/\/|\/|#|data:|mailto:|javascript:)([^"']+)(["'])/g,
    (_, prefix, url, suffix) => `${prefix}/${url}${suffix}`
  );
}

function buildContentSection(page, contentSectionTemplate) {
  const slug = page.slug;
  const howWeHelp = getHowWeHelp(page);
  const whatIs = getWhatIs(page);

  return contentSectionTemplate
    .replace(/\{\{H1\}\}/g, escapeHtml(page.h1))
    .replace(/\{\{HERO_SUBTITLE\}\}/g, escapeHtml(page.description))
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{STOP_PAIN\}\}/g, getStopPain(page))
    .replace(/\{\{STOP_SOLUTION\}\}/g, getStopSolution(page))
    .replace(/\{\{HOW_WE_HELP_TITLE\}\}/g, howWeHelp.title)
    .replace(/\{\{HOW_WE_HELP_TAGLINE\}\}/g, howWeHelp.tagline)
    .replace(/\{\{HOW_HELP_1_TITLE\}\}/g, howWeHelp.blocks[0].title)
    .replace(/\{\{HOW_HELP_1_TEXT\}\}/g, howWeHelp.blocks[0].text)
    .replace(/\{\{HOW_HELP_2_TITLE\}\}/g, howWeHelp.blocks[1].title)
    .replace(/\{\{HOW_HELP_2_TEXT\}\}/g, howWeHelp.blocks[1].text)
    .replace(/\{\{HOW_HELP_3_TITLE\}\}/g, howWeHelp.blocks[2].title)
    .replace(/\{\{HOW_HELP_3_TEXT\}\}/g, howWeHelp.blocks[2].text)
    .replace(/\{\{PRESET_SECTION\}\}/g, getPresetSection(page))
    .replace(/\{\{WHAT_IS_HEADING\}\}/g, whatIs.heading)
    .replace(/\{\{WHAT_IS_PARAGRAPH\}\}/g, whatIs.paragraph)
    .replace(/\{\{TOPIC_SECTION\}\}/g, getTopicSection(page))
    .replace(/\{\{COMPARE_TABLE\}\}/g, getCompareTable(page))
    .replace(/\{\{BENEFITS\}\}/g, getBenefits(page))
    .replace(/\{\{HOW_TO_HEADING\}\}/g, getHowToHeading(page))
    .replace(/\{\{HOW_TO_STEPS\}\}/g, getHowToSteps(page))
    .replace(/\{\{FEATURES\}\}/g, getFeatures(page))
    .replace(/\{\{FAQ\}\}/g, getFaq(page))
    .replace(/\{\{RELATED_LINKS\}\}/g, getRelatedLinks(page.related))
    .replace(/\{\{EXTERNAL_LINKS\}\}/g, getExternalLinks(page));
}

function main() {
  if (!fs.existsSync(PAGES_JSON)) {
    console.error('Missing pseo/pages.json');
    process.exit(1);
  }
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Missing index.html');
    process.exit(1);
  }
  if (!fs.existsSync(CONTENT_SECTION_PATH)) {
    console.error('Missing pseo/content-section.html');
    process.exit(1);
  }

  const { pages } = loadJson(PAGES_JSON);
  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  const contentSectionTemplate = fs.readFileSync(CONTENT_SECTION_PATH, 'utf8');

  const outputDirs = new Set();
  const generated = [];

  for (const page of pages) {
    const category = page.category;
    const slug = page.slug;
    const canonicalPath = `/${category}/${slug}`;
    const outputDir = path.join(ROOT, category);
    const outputPath = path.join(outputDir, `${slug}.html`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      outputDirs.add(category);
    }

    const contentSectionHtml = buildContentSection(page, contentSectionTemplate);
    let html = indexHtml.replace(CONTENT_SECTION_REPLACE_RE, contentSectionHtml);
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace(/<meta name="title" content="[^"]*">/, `<meta name="title" content="${escapeHtml(page.title)}">`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(page.description)}">`)
      .replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${escapeHtml(page.keyword)}, pomodoro timer, focus timer, Superfocus">`)
      .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${BASE_URL}${canonicalPath}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(page.title)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(page.description)}">`)
      .replace(/<meta name="twitter:url" content="[^"]*">/, `<meta name="twitter:url" content="${BASE_URL}${canonicalPath}">`)
      .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(page.title)}">`)
      .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(page.description)}">`)
      .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${BASE_URL}${canonicalPath}">`);
    html = normalizeLocalUrlsToRoot(html);
    fs.writeFileSync(outputPath, html, 'utf8');
    generated.push(`/${category}/${slug}`);
  }

  console.log(`Generated ${generated.length} pSEO pages.`);
  console.log('Slugs:', generated.join('\n'));

  // Update sitemap.xml with new pSEO URLs
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const today = new Date().toISOString().slice(0, 10);
  const coreUrls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/pricing', priority: '0.9', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
    { loc: '/release-notes', priority: '0.7', changefreq: 'weekly' }
  ];
  const pseoUrls = generated.map(loc => ({
    loc: BASE_URL + loc,
    priority: '0.8',
    changefreq: 'monthly'
  }));
  const allUrls = [
    ...coreUrls.map(u => ({ ...u, loc: BASE_URL + u.loc })),
    ...pseoUrls
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
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('Updated sitemap.xml');

  return generated;
}

main();
