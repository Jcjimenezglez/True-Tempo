#!/usr/bin/env node
/**
 * Applies pain-focused copy fields (heroSubtitle, painPoints, painSolution) to pSEO JSON sources.
 * Run once: node scripts/apply-pain-copy.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const COPY = {
  'pomodoro-technique': {
    h1: 'You sit down to work. Forty minutes later, you\'ve checked email six times.',
    heroSubtitle: 'The timer was never the problem. The lack of structure was. You don\'t need more willpower—you need a block with a beginning and an end.',
    title: 'Can\'t Focus for 25 Minutes? Try the Pomodoro Technique | Superfocus',
    description: 'You keep starting tasks and never finishing them. A 25-min timer with built-in breaks breaks the drift. Free to try.',
    painPoints: 'Open laptop. Check Slack. Make coffee. Repeat.<br>Hours pass. The important task is still untouched.<br>Tomorrow you\'ll "really focus."',
    painSolution: 'Set 25 minutes. One task. Timer running.<br>Work until it rings. Break. Repeat.<br>Small blocks. Real progress.'
  },
  'flowtime-timer': {
    h1: '25 minutes ends right when you\'re finally getting somewhere.',
    heroSubtitle: 'You enter flow at minute 20—and the timer kills it. Pomodoro works until it doesn\'t. You need longer blocks without guilt.',
    title: 'Pomodoro Too Short? Flowtime Timer for Deep Work | Superfocus',
    description: 'The bell interrupts your best thinking. Flowtime uses 45-min blocks with flexible breaks. Try free in Superfocus.',
    painPoints: 'Finally focused. Timer rings. Flow gone.<br>Restart. Lose momentum. Repeat.<br>Short blocks feel like sabotage.',
    painSolution: '45-minute blocks. Break when you need it.<br>Stay in flow longer. Fewer interruptions.<br>Work at your rhythm.'
  },
  'time-blocking-timer': {
    h1: 'Your calendar is full. Your actual work isn\'t scheduled anywhere.',
    heroSubtitle: 'Meetings have slots. Deep work gets "whenever." By Friday you\'ve been busy all week and shipped nothing that matters.',
    title: 'No Time for Deep Work? Time Blocking Timer | Superfocus',
    description: 'Your day fills with other people\'s priorities. Block focus time before it disappears. Free Pomodoro timer with tasks.',
    painPoints: 'Calendar packed. No blocks for you.<br>Reactive all day. Proactive never.<br>Week ends. Big project untouched.',
    painSolution: 'Block 25 minutes. Protect it like a meeting.<br>Timer + tasks in one app.<br>Your time, on your terms.'
  },
  'deep-work-timer': {
    h1: 'You need two hours of focus. You get seven minutes between pings.',
    heroSubtitle: 'Shallow work fills the day. The hard thinking—the stuff that actually moves the needle—never gets a protected window.',
    title: 'Can\'t Do Deep Work? 90-Minute Focus Timer | Superfocus',
    description: 'Context switching kills your best work. Block 90 minutes, block distractions, enter flow. Lofi and rain included. Try free.',
    painPoints: 'Start deep work. Slack pings.<br>Switch tasks. Lose the thread.<br>End of day: exhausted, nothing hard done.',
    painSolution: '90-minute block. Phone away. Sounds on.<br>One hard problem. Full attention.<br>Deep work, finally.'
  },
  'sprint-timer': {
    h1: 'Twenty-five minutes feels like a prison sentence.',
    heroSubtitle: 'You can\'t even start because the block feels too long. So you scroll instead. The task waits. So do you.',
    title: '25 Minutes Too Long? 15-Min Sprint Timer | Superfocus',
    description: 'When a full Pomodoro feels impossible, start with 15 minutes. Momentum beats perfection. Free ADHD-friendly timer.',
    painPoints: '25 min feels impossible.<br>So you do nothing instead.<br>Paralysis wins again.',
    painSolution: '15 minutes. That\'s it.<br>Start small. Build momentum.<br>Done beats perfect.'
  },
  'marathon-timer': {
    h1: 'You finally have a free afternoon. You waste the first hour "warming up."',
    heroSubtitle: 'Long sessions need structure too. Without breaks, you burn out by hour two. With none at all, you never start.',
    title: 'Need Longer Focus Sessions? Marathon Timer | Superfocus',
    description: 'Writers and researchers need 60+ minute blocks with smart breaks. Marathon preset built in. Try Superfocus free.',
    painPoints: 'Rare long block. No plan.<br>Wander for an hour. Burn out.<br>Session wasted.',
    painSolution: '60 minutes. Built-in breaks.<br>Structure for long work.<br>Ship chapters, not excuses.'
  },
  '52-minute-focus': {
    h1: 'You fight your body\'s rhythm and wonder why focus feels unnatural.',
    heroSubtitle: 'Generic timers ignore how attention actually works. Your brain has cycles—work with them, not against them.',
    title: 'Work Against Your Rhythm? 52-Minute Focus Timer | Superfocus',
    description: 'Ultradian rhythms say ~52 min work, ~17 min rest. Custom timer preset in Superfocus. Free to try.',
    painPoints: 'Arbitrary timer lengths.<br>Fighting fatigue.<br>Never in sync with your body.',
    painSolution: '52 minutes on. 17 off.<br>Match your natural cycle.<br>Sustained focus, less force.'
  },
  '90-minute-deep-work': {
    h1: 'Your best ideas need ninety minutes. Your schedule gives you twelve.',
    heroSubtitle: 'Between meetings, notifications, and "quick checks," the deep thinking your work demands never gets room to breathe.',
    title: 'Need 90 Minutes of Uninterrupted Focus? | Superfocus',
    description: 'One ultradian cycle. One hard problem. 90-min Deep Work preset with ambient sounds. Try free.',
    painPoints: 'Big thinking needs time.<br>Life gives fragments.<br>Great work stays unfinished.',
    painSolution: 'Block 90 minutes. Protect it.<br>Deep Work preset ready.<br>Finish what matters.'
  },
  'study-timer': {
    h1: 'You sat down to study. Two hours later, you\'ve read 4 pages.',
    heroSubtitle: 'The textbook is open. Your notes are blank. Instagram got 47 visits. Tomorrow\'s exam didn\'t get any closer.',
    title: 'Can\'t Focus While Studying? Free Study Timer | Superfocus',
    description: 'You keep "studying" but nothing sticks. A 25-min timer breaks the scroll loop. No signup to try.',
    painPoints: 'Open the book. Check phone. Repeat for 3 hours.<br>Feel guilty. Promise tomorrow will be different.<br>Tomorrow: same loop.',
    painSolution: 'One 25-minute block. Phone away. Timer running.<br>Four pages become forty. Guilt becomes momentum.'
  },
  'work-timer': {
    h1: 'Eight hours at the office. Forty-five minutes of actual work.',
    heroSubtitle: 'Meetings, Slack, email—the day fills with motion that isn\'t progress. The report due Friday is still a blank doc.',
    title: 'Busy All Day, Nothing Done? Work Focus Timer | Superfocus',
    description: 'Your calendar owns you. Block focus time between meetings with Pomodoro + tasks. Free for professionals.',
    painPoints: 'Inbox zero. Project zero.<br>Meetings all day. Deep work never.<br>Busy badge. Empty output.',
    painSolution: 'Block 25 minutes before the next meeting.<br>One task. Timer on. Ship something.<br>Repeat until Friday isn\'t panic.'
  },
  'coding-focus-timer': {
    h1: 'You opened the IDE an hour ago. You\'re still on Stack Overflow.',
    heroSubtitle: 'Context switching between tabs, docs, and Slack fragments your thinking. The feature that should take an afternoon takes three days.',
    title: 'Can\'t Stay in Flow While Coding? Focus Timer | Superfocus',
    description: 'Developers lose flow to pings and tab-hopping. 90-min Deep Work blocks + lofi. Free coding focus timer.',
    painPoints: 'Load IDE. Check Slack. Read docs.<br>Context gone. Start over.<br>Feature still not shipped.',
    painSolution: '90-minute block. Lofi on. Slack closed.<br>One feature. Full stack focus.<br>Ship before standup.'
  },
  'writing-timer': {
    h1: 'The blank page has been staring at you for an hour.',
    heroSubtitle: 'You know what you want to say. You can\'t make your fingers type it. Every distraction feels more urgent than the draft.',
    title: 'Staring at a Blank Page? Writing Focus Timer | Superfocus',
    description: 'Writer\'s block is a starting problem. 25-min Pomodoro or 60-min Marathon + rain sounds. Just begin. Try free.',
    painPoints: 'Cursor blinks. You blink.<br>Rewrite the first sentence ten times.<br>Word count: still zero.',
    painSolution: '25 minutes. Don\'t edit. Just write.<br>Rain sounds. Timer running.<br>Bad words today beat no words tomorrow.'
  },
  'exam-prep-timer': {
    h1: 'The exam is in five days. You\'ve studied for none of them.',
    heroSubtitle: 'You keep "planning to study" instead of studying. Anxiety grows. The material doesn\'t shrink.',
    title: 'Exam Tomorrow and Not Ready? Study Timer | Superfocus',
    description: 'Panic cramming doesn\'t work. Structured 25-min blocks with breaks do. Lofi included. Start now—free.',
    painPoints: 'Check syllabus. Feel overwhelmed.<br>Watch one lecture. Scroll for an hour.<br>Exam closer. You farther.',
    painSolution: 'One topic. 25 minutes. Then a break.<br>Track sessions. See progress.<br>Five days of blocks beat one panic night.'
  },
  'adhd-focus-timer': {
    h1: 'You hyperfocused on the wrong thing for three hours.',
    heroSubtitle: 'Or you couldn\'t start at all. Standard productivity advice wasn\'t built for how your brain actually works.',
    title: 'Standard Timers Don\'t Work for ADHD? Try 15-Min Sprints | Superfocus',
    description: '25 minutes feels impossible some days. Start with 15-min sprints, white noise, clear structure. Built for neurodivergent focus.',
    painPoints: 'Can\'t start. Or can\'t stop.<br>All-or-nothing every day.<br>Tools built for neurotypical brains.',
    painSolution: '15-minute sprints. Clear start and stop.<br>White noise. Visual timer.<br>Work with your brain, not against it.'
  },
  'student-productivity': {
    h1: 'You have four assignments due. You\'ve opened zero of them.',
    heroSubtitle: 'The semester feels like a wall. Every task feels equally urgent and equally impossible to start.',
    title: 'Overwhelmed by Assignments? Student Focus Timer | Superfocus',
    description: 'Paralysis isn\'t laziness—it\'s overload. One 25-min block on one assignment. Free Pomodoro for students.',
    painPoints: 'Four deadlines. Pick none.<br>Stress scroll instead of start.<br>GPA doesn\'t wait.',
    painSolution: 'Pick one assignment. 25 minutes.<br>Finish a slice. Pick the next.<br>Wall becomes steps.'
  },
  'freelancer-productivity': {
    h1: 'You\'re your own boss. Nobody stops you from procrastinating until midnight.',
    heroSubtitle: 'No structure, no commute, no boss looking over your shoulder. Freedom becomes a trap when billable hours slip away.',
    title: 'Freelancing Without Structure? Focus Timer | Superfocus',
    description: 'Track billable focus, sync Todoist, see where hours go. Pomodoro for freelancers. Free to start.',
    painPoints: 'Work from bed. Scroll till noon.<br>Client deadline looms. Panic start.<br>Underpaid for overwork.',
    painSolution: 'Block billable hours first thing.<br>Timer tracks what clients pay for.<br>Freedom with structure.'
  },
  'remote-work-focus': {
    h1: 'Your commute is zero minutes. So is your focus.',
    heroSubtitle: 'Home has laundry, fridge, kids, and a couch that knows your name. The office at least had boundaries.',
    title: 'Working From Home But Not Working? Focus Timer | Superfocus',
    description: 'WFH blurs everything together. Block focus time, add cafe sounds, pretend you\'re somewhere else. Free timer.',
    painPoints: 'Kitchen trip. Couch trip. "Break" all day.<br>8 hours home. 1 hour work.<br>Always on. Never focused.',
    painSolution: 'Cafe sounds. 25-minute blocks.<br>Fake commute to your desk.<br>Home office, real work.'
  },
  'deep-work-app': {
    h1: 'You bought noise-canceling headphones. You still didn\'t do the hard thing.',
    heroSubtitle: 'Blocking noise isn\'t the same as blocking distraction. Your brain needs structure, not just silence.',
    title: 'Noise Canceling Wasn\'t Enough? Deep Work App | Superfocus',
    description: '90-min blocks, ambient sounds, zero pings. A deep work app that enforces focus time. Try Superfocus free.',
    painPoints: 'Silent room. Loud brain.<br>Still checking phone. Still avoiding hard work.<br>Tools without structure fail.',
    painSolution: '90 minutes. Timer locked in.<br>Sounds signal: work now.<br>Hard thing gets done.'
  },
  'meeting-prep-timer': {
    h1: 'The call starts in ten minutes. You haven\'t looked at the deck.',
    heroSubtitle: 'Back-to-back meetings leave no gap to think. You show up unprepared and improvise your way through.',
    title: 'Unprepared for Every Meeting? 15-Min Prep Timer | Superfocus',
    description: 'Block 15 minutes before each call. Sprint timer for quick prep. Walk in ready. Free to try.',
    painPoints: 'Join call. Realize you\'re lost.<br>Smile and wing it. Again.<br>Reputation erodes quietly.',
    painSolution: '15 minutes before every call.<br>Review deck. Write one note.<br>Show up sharp.'
  },
  'focus-music': {
    h1: 'Silence is loud. Your playlist is louder.',
    heroSubtitle: 'Lyrics pull you out. Silence lets every noise in. You need something that signals "focus" without demanding attention.',
    title: 'Can\'t Find Music That Helps You Focus? | Superfocus',
    description: 'Lofi, rain, cafe—built-in cassettes plus Spotify. Pair with any timer. Free focus music while you work.',
    painPoints: 'Pop songs = singing along.<br>Silence = hearing everything.<br>Still not concentrating.',
    painSolution: 'One click. Lofi or rain.<br>Brain gets the signal.<br>Work starts.'
  },
  'lofi-study-music': {
    h1: 'You pressed play on a study playlist. You\'re still on TikTok.',
    heroSubtitle: 'Finding the right mix takes longer than studying. You need beats that stay in the background, not the foreground.',
    title: 'Study Playlist Becomes a Distraction? Lofi Timer | Superfocus',
    description: 'Curated lofi cassettes built into the timer. No searching, no skipping. Study and focus together. Free.',
    painPoints: 'Search Spotify for 20 min.<br>Skip tracks. Pick new playlist.<br>Never actually study.',
    painSolution: 'Lofi cassette. One click.<br>Timer + beats together.<br>Study starts now.'
  },
  'rain-sounds-focus': {
    h1: 'Every noise in the house finds you when you try to focus.',
    heroSubtitle: 'Thin walls, loud neighbors, family in the next room. You can\'t control the world—you can mask it.',
    title: 'Can\'t Focus With All This Noise? Rain Sounds Timer | Superfocus',
    description: 'Rain sounds mask distractions and signal focus time. Built into Superfocus with any timer preset. Try free.',
    painPoints: 'Dog barks. Door slams. Focus gone.<br>Headphones help. Not enough.<br>Can\'t control the noise.',
    painSolution: 'Rain cassette. Steady mask.<br>World fades. Work stays.<br>Focus in any environment.'
  },
  'cafe-ambient-sounds': {
    h1: 'You work better at coffee shops. You can\'t go to one every day.',
    heroSubtitle: 'There\'s something about the hum of strangers that makes your brain click in. Home is too quiet—or too distracting.',
    title: 'Miss the Coffee Shop Vibe? Cafe Ambient Timer | Superfocus',
    description: 'Coffee shop ambience without leaving home. Cafe cassette + Pomodoro timer. WFH with focus. Free.',
    painPoints: 'Home too quiet. Or too loud.<br>Coffee shop costs $6/day.<br>Can\'t find the vibe.',
    painSolution: 'Cafe sounds. Your desk.<br>Same energy. No commute.<br>Focus anywhere.'
  },
  'white-noise-focus': {
    h1: 'Your brain treats every sound like an emergency.',
    heroSubtitle: 'Open offices, ADHD, sensitive hearing—random noise hijacks attention. You need a steady floor, not more silence to fill.',
    title: 'Every Sound Breaks Your Focus? White Noise Timer | Superfocus',
    description: 'White noise blocks unpredictable sounds. Pair with 15-min Sprint for ADHD. Free in Superfocus.',
    painPoints: 'Every ping pulls you out.<br>Silence makes small sounds huge.<br>Can\'t filter the world.',
    painSolution: 'White noise floor. Steady.<br>Brain stops scanning.<br>Attention stays put.'
  },
  'todoist-pomodoro': {
    h1: 'Your task list has 47 items. You\'ve worked on none of them.',
    heroSubtitle: 'Todoist holds the tasks. Nothing holds you to actually doing them. Lists without time blocks are just anxiety documents.',
    title: 'Long Todo List, Zero Progress? Todoist + Pomodoro | Superfocus',
    description: 'Sync Todoist, assign pomodoros per task, track completion. Timer + tasks finally together. Free to try.',
    painPoints: 'Add tasks. Feel productive.<br>Never block time.<br>List grows. Nothing done.',
    painSolution: 'Pick task. Assign pomodoro.<br>Timer runs. Task closes.<br>List shrinks for real.'
  },
  'task-planning-workflow': {
    h1: 'You plan your day perfectly. By noon, the plan is fiction.',
    heroSubtitle: 'Estimating time is hard when you never measure it. You keep overcommitting because you don\'t know how long things actually take.',
    title: 'Plans Never Survive the Day? Pomodoro Task Planning | Superfocus',
    description: 'Estimate in pomodoros, track actuals, improve over time. Task planning that learns from reality. Free.',
    painPoints: 'Plan 8 tasks. Finish 2.<br>Bad estimates. Every day.<br>Planning feels pointless.',
    painSolution: 'Estimate in pomodoros.<br>Track what you actually finish.<br>Plans get honest.'
  },
  'productivity-analytics': {
    h1: 'You worked all week. Can you prove it?',
    heroSubtitle: 'Busy feels productive until you look back and see the same project untouched. Without data, you\'re guessing.',
    title: 'Busy But Can\'t Show Progress? Focus Analytics | Superfocus',
    description: 'See daily, weekly, monthly focus time. Spot patterns. Build habits from data, not guilt. Try free.',
    painPoints: 'Feel productive. No proof.<br>Same bad patterns.<br>Can\'t improve what you don\'t measure.',
    painSolution: 'Every session logged.<br>See your real patterns.<br>Improve with evidence.'
  },
  'focus-time-tracking': {
    h1: 'Where did the day go? You genuinely don\'t know.',
    heroSubtitle: 'Time disappears into small distractions that don\'t feel like distractions. By evening, the hours are gone and the work isn\'t done.',
    title: 'No Idea Where Your Time Went? Focus Tracker | Superfocus',
    description: 'Track deep work hours daily, weekly, monthly. See the truth about your focus. Free timer with analytics.',
    painPoints: 'Day disappears. No memory of it.<br>Busy feeling. Empty output.<br>Time theft you can\'t see.',
    painSolution: 'Timer tracks every block.<br>See where hours actually go.<br>Take time back.'
  },
  'pomodoro-statistics': {
    h1: 'You\'ve done "some" pomodoros this week. That\'s not a metric.',
    heroSubtitle: 'Vague effort doesn\'t build habits. You need streaks, counts, and trends—or motivation fades by Wednesday.',
    title: 'Pomodoros Without Progress? Session Statistics | Superfocus',
    description: 'Count completed pomodoros, track streaks, analyze patterns. Pomodoro stats that motivate. Try Superfocus free.',
    painPoints: 'Start strong Monday. Fade by Thursday.<br>No streak. No accountability.<br>Habits don\'t stick.',
    painSolution: 'Streak counter. Session history.<br>See consistency build.<br>Momentum from numbers.'
  },
  'superfocus-vs-pomofocus': {
    h1: 'Pomofocus works. Until you need music, tasks, or analytics.',
    heroSubtitle: 'Simple timer apps solve one problem. Then you\'re juggling three tabs and wondering why focus still feels hard.',
    title: 'Outgrew Pomofocus? Compare Superfocus Features | Superfocus',
    description: 'Same simple Pomodoro—plus lofi, Todoist sync, and analytics in one app. See the full comparison. Try free.',
    painPoints: 'Timer in one tab. Spotify in another.<br>Tasks somewhere else.<br>Focus fragmented across apps.',
    painSolution: 'Timer, sounds, tasks, stats.<br>One app. One tab.<br>Focus without juggling.'
  },
  'superfocus-vs-forest': {
    h1: 'You planted trees on your phone. Your laptop still has 40 tabs.',
    heroSubtitle: 'Forest gamifies phone focus. But your real work happens on desktop—and the phone isn\'t the only distraction.',
    title: 'Forest on Phone, Chaos on Desktop? | Superfocus',
    description: 'Browser-based focus timer. No phone needed. Pomodoro + lofi + analytics on desktop. Compare vs Forest.',
    painPoints: 'Phone locked. Laptop wide open.<br>Real work needs desktop.<br>Forest doesn\'t follow you there.',
    painSolution: 'Focus timer in your browser.<br>Where work actually happens.<br>No app switching.'
  },
  'superfocus-vs-flocus': {
    h1: 'Pretty dashboard. Still not finishing your tasks.',
    heroSubtitle: 'Aesthetic productivity tools feel good to set up. Setup becomes the procrastination.',
    title: 'Flocus Looks Great. Does It Help You Ship? | Superfocus',
    description: 'Compare Flocus vs Superfocus: timers, sounds, task sync, analytics. Less decorating, more doing. Try free.',
    painPoints: 'Customize theme for an hour.<br>Work for zero.<br>Productivity cosplay.',
    painSolution: 'Timer first. Features that ship.<br>Less setup. More sessions.<br>Results over aesthetics.'
  },
  'superfocus-vs-focusmate': {
    h1: 'You don\'t need a stranger on video. You need to start.',
    heroSubtitle: 'Accountability sessions help some people. Others just need a timer, sounds, and fewer excuses.',
    title: 'Solo Focus Works Better? Superfocus vs Focusmate',
    description: 'Independent deep work with ambient sounds vs video accountability. Compare styles. Try Superfocus free.',
    painPoints: 'Schedule partner. Small talk.<br>Perform focus for someone.<br>Still avoid the hard task alone.',
    painSolution: 'Solo timer. Sounds on. Start now.<br>No scheduling. No performance.<br>Just work.'
  },
  'pomodoro-timer-apps': {
    h1: 'You\'ve tried five Pomodoro apps. You still can\'t focus.',
    heroSubtitle: 'The app wasn\'t the problem. But the wrong app adds friction—signup walls, missing features, another subscription.',
    title: 'Tried Every Pomodoro App? 2026 Comparison | Superfocus',
    description: 'Compare Superfocus, Pomofocus, Forest, Flocus. Features, pricing, sounds. Find one that actually fits. Free tier.',
    painPoints: 'Download. Sign up. Hit paywall.<br>Missing sounds. Missing tasks.<br>App hopping instead of working.',
    painSolution: 'Compare honestly. Pick one.<br>Timer + sounds + tasks included.<br>Start free today.'
  },
  'pomofocus': {
    h1: 'You liked Pomofocus. You wished it did more.',
    heroSubtitle: 'Clean timer. That\'s it. No music, no task sync, no way to see if you\'re actually improving.',
    title: 'Looking for a Pomofocus Alternative? | Superfocus',
    description: 'Everything Pomofocus does—plus lofi, rain, Todoist sync, and analytics. Same simplicity, more depth. Free.',
    painPoints: 'Simple timer. Too simple.<br>Open Spotify separately.<br>No idea if you\'re improving.',
    painSolution: 'Same clean timer. More built in.<br>Sounds, tasks, stats included.<br>Upgrade without complexity.'
  },
  'forest-app': {
    h1: 'Your forest is thriving. Your project is not.',
    heroSubtitle: 'Gamification motivates until it doesn\'t. You need focus tools for real work, not virtual trees.',
    title: 'Forest App Alternative for Desktop Work | Superfocus',
    description: 'Browser Pomodoro timer—no phone required. Lofi, rain, tasks, analytics. Free Forest alternative.',
    painPoints: 'Trees grow. Work doesn\'t.<br>Phone-only focus.<br>Desktop still a mess.',
    painSolution: 'Focus where you work.<br>Browser timer. Real features.<br>Ship projects, not saplings.'
  },
  'best-pomodoro-apps': {
    h1: 'Every list says "best Pomodoro app." You\'re still scrolling instead of working.',
    heroSubtitle: 'Researching productivity tools is procrastination wearing a productive mask. Pick one and start a timer.',
    title: 'Stop Comparing. Start a Timer. Best Pomodoro Apps 2026',
    description: 'Honest 2026 comparison: Superfocus, Pomofocus, Forest. Features and pricing. Then close this tab and try one free.',
    painPoints: 'Read reviews for hours.<br>Compare features. Install three apps.<br>Still haven\'t started a pomodoro.',
    painSolution: 'Pick Superfocus. Start timer.<br>25 minutes. Right now.<br>Comparison ends. Work begins.'
  },
  'enter-flow-state': {
    h1: 'You know what flow feels like. You haven\'t felt it in weeks.',
    heroSubtitle: 'Every interruption resets the clock. By the time you settle in, something else demands attention.',
    title: 'Can\'t Get Into Flow? Longer Focus Blocks | Superfocus',
    description: 'Flow needs 45-90 min blocks and fewer interruptions. Flow + Deep Work presets with ambient sound. Try free.',
    painPoints: 'Almost there. Slack ping. Gone.<br>25 min ends at minute 22.<br>Flow state: a memory.',
    painSolution: '45 or 90 minutes. Sounds on.<br>One task. Timer protects it.<br>Flow becomes reachable.'
  },
  'reduce-distractions': {
    h1: 'You closed Twitter. You opened it again without noticing.',
    heroSubtitle: 'Willpower lasts about four minutes. Then your thumb finds the app you swore you wouldn\'t open.',
    title: 'Can\'t Stop Getting Distracted? Focus Timer + Sounds | Superfocus',
    description: 'Structure beats willpower. Timer + lofi/rain blocks noise and the scroll loop. Free to try.',
    painPoints: 'Close the tab. Reopen unconsciously.<br>Phone face-down. Still buzzing.<br>Focus lasts seconds.',
    painSolution: 'Timer running = work mode.<br>Sounds mask the world.<br>25 minutes. Protected.'
  },
  'build-focus-habits': {
    h1: 'You were "going to focus every day." That was three Mondays ago.',
    heroSubtitle: 'Motivation spikes on Sunday night and dies by Tuesday. Without tracking, you can\'t see the pattern—or break it.',
    title: 'Focus Habits Never Stick? Track Sessions & Streaks | Superfocus',
    description: 'Streaks and session history make progress visible. Pomodoro + analytics. Build habits from data. Free.',
    painPoints: 'Fresh start every week.<br>No record of effort.<br>Same promise. Same fade.',
    painSolution: 'One pomodoro today. Logged.<br>Streak starts. Visible progress.<br>Habits need proof.'
  },
  'avoid-burnout': {
    h1: 'You worked until midnight again. Tomorrow you\'ll be useless.',
    heroSubtitle: 'No breaks feels productive until your brain stops cooperating entirely. Burnout doesn\'t announce itself—it accumulates.',
    title: 'Working Until You Crash? Timer With Built-In Breaks | Superfocus',
    description: 'Pomodoro forces recovery before you need it. 25 on, 5 off. Sustainable focus. Try Superfocus free.',
    painPoints: 'Skip breaks. Push through.<br>Friday: empty and exhausted.<br>Weekend recovery. Repeat.',
    painSolution: 'Breaks are scheduled. Not optional.<br>Sustain pace all week.<br>Marathon, not sprint to collapse.'
  },
  'increase-productivity': {
    h1: 'Your to-do list grew. Your output didn\'t.',
    heroSubtitle: 'Busy is not productive. You answer messages, attend calls, and end the day with the hard thing still waiting.',
    title: 'Busy All Week, Nothing Shipped? Productivity Timer | Superfocus',
    description: 'Block time, track focus sessions, see patterns. Know the difference between busy and productive. Free.',
    painPoints: 'Inbox zero. Project zero.<br>Motion without progress.<br>Productivity theater.',
    painSolution: 'Measure focus time, not activity.<br>Block deep work first.<br>Ship one thing daily.'
  },
  'stay-focused-longer': {
    h1: 'You lose focus at minute twelve. Every time.',
    heroSubtitle: 'Short attention isn\'t a character flaw—it\'s untrained stamina. You\'ve never built the muscle for longer blocks.',
    title: 'Losing Focus Too Soon? Extended Blocks | Superfocus',
    description: 'Build focus stamina with 45-min Flow or 90-min Deep Work. Gradual extension. Try Superfocus free.',
    painPoints: '12 minutes in. Mind wanders.<br>25 feels impossible.<br>Never build endurance.',
    painSolution: 'Start at 25. Extend to 45.<br>Track what works.<br>Longer blocks over time.'
  },
  'block-distractions': {
    h1: 'Noise, notifications, and your own brain team up against you.',
    heroSubtitle: 'You can\'t control the open office, the neighbor, or the group chat. You can control your next 25 minutes.',
    title: 'World Won\'t Leave You Alone? Block Distractions | Superfocus',
    description: 'White noise, lofi, rain—plus a timer that says work now. Block the world for one block. Free.',
    painPoints: 'Every sense under attack.<br>Can\'t escape the noise.<br>Focus feels impossible.',
    painSolution: 'Headphones. Cassette on. Timer start.<br>25 minutes of protected space.<br>One block at a time.'
  },
  'focus-without-phone': {
    h1: 'The timer app on your phone is the distraction.',
    heroSubtitle: 'Pick up phone to start timer. See notification. Twenty minutes gone. The tool became the trap.',
    title: 'Phone Is the Problem? Browser Focus Timer | Superfocus',
    description: 'Superfocus runs in your browser where work happens. No app to open, no notifications to swipe. Try free.',
    painPoints: 'Phone for timer. Phone for distraction.<br>Same device. Wrong tool.<br>Can\'t separate them.',
    painSolution: 'Timer in browser. Phone away.<br>Work on desktop.<br>Focus where you type.'
  },
  'how-long-pomodoro-session': {
    h1: 'You\'ve tried 25 minutes. It feels wrong—but you don\'t know why.',
    heroSubtitle: 'Generic advice says 25. Your brain says something else. The wrong length makes every session feel like failure.',
    title: 'How Long Should a Pomodoro Be? Find Your Length | Superfocus',
    description: '25 min for most, 15 for ADHD, 45 for deep work. All presets built in. Try each free and find yours.',
    painPoints: 'Force 25. Quit at 10.<br>Think you\'re broken.<br>Wrong length, not wrong you.',
    painSolution: 'Try Sprint, Pomodoro, Flow.<br>Find your number.<br>Structure that fits.'
  },
  'is-superfocus-free': {
    h1: 'Another app asking for a credit card before you can even try it.',
    heroSubtitle: 'You just want to know if a timer helps. You don\'t want a subscription pitch before the first pomodoro.',
    title: 'Is Superfocus Free? Yes—No Credit Card to Start',
    description: 'Free tier: 2 hours focus/day. Guests get 1 hour. No signup required to try. Premium optional.',
    painPoints: 'Sign up wall. Paywall. Trial trap.<br>Just want to focus.<br>Apps want your wallet first.',
    painSolution: 'Open superfocus.live. Start timer.<br>No card. No signup required.<br>Try before you commit.'
  },
  'best-pomodoro-length': {
    h1: '15 or 25 or 45? You\'ve read ten articles and still don\'t know.',
    heroSubtitle: 'Analysis paralysis strikes again. While you research the perfect length, the task waits untouched.',
    title: 'Best Pomodoro Length? Try 15, 25, or 45 Min Free | Superfocus',
    description: 'No universal answer—try Sprint (15), Pomodoro (25), Flow (45). All presets in one app. Free.',
    painPoints: 'Research the method. Never use it.<br>Perfect length myth.<br>Task still undone.',
    painSolution: 'Pick one. Start now.<br>Adjust after data.<br>Done beats optimal.'
  },
  'pomodoro-vs-flowtime': {
    h1: 'Pomodoro interrupts you. Flowtime might not. You need both answers.',
    heroSubtitle: 'Different tasks need different blocks. One-size-fits-all timers fit no one.',
    title: 'Pomodoro vs Flowtime: Which Fits Your Work? | Superfocus',
    description: 'Fixed 25 min vs flexible 45+. Both presets in Superfocus. Try each on real work. Free.',
    painPoints: 'Wrong method for the task.<br>Pomodoro for deep work fails.<br>Flowtime for email fails.',
    painSolution: 'Match block to task.<br>Both presets ready.<br>Right tool, right moment.'
  },
  'how-many-pomodoros-per-day': {
    h1: 'You did two pomodoros and feel guilty. Or twelve and feel burned out.',
    heroSubtitle: 'Without tracking, you\'re guessing—too little or too much, never quite right.',
    title: 'How Many Pomodoros Per Day? Track and Find Out | Superfocus',
    description: '8-12 is common but yours depends on you. Session tracking shows your sweet spot. Free timer.',
    painPoints: 'No idea what\'s enough.<br>Guilt or burnout.<br>Flying blind.',
    painSolution: 'Track sessions. See patterns.<br>Find your number.<br>Data replaces guilt.'
  },
  'pomodoro-break-length': {
    h1: 'You skip breaks and wonder why focus dies by afternoon.',
    heroSubtitle: 'Pushing through feels tough. It\'s also why your third hour produces nothing.',
    title: 'Skipping Breaks? Here\'s Why 5 Minutes Matter | Superfocus',
    description: '5 min short breaks, 15 min long breaks—built into Superfocus Pomodoro. Sustainable focus. Free.',
    painPoints: 'Skip break. Power through.<br>Brain fog by 2pm.<br>Breaks feel lazy. They\'re not.',
    painSolution: 'Breaks scheduled automatically.<br>Recover before crash.<br>More total focus, not less.'
  },
  'focus-timer-with-sounds': {
    h1: 'You need a timer and focus music. That\'s two apps, two tabs, twice the friction.',
    heroSubtitle: 'Switching between timer and Spotify breaks the very focus you\'re trying to build.',
    title: 'Timer + Focus Sounds in One App | Superfocus',
    description: 'Lofi, rain, cafe built in. Any timer preset. One tab. Try Superfocus free.',
    painPoints: 'Timer app. Music app.<br>Switch tabs. Lose focus.<br>Setup takes longer than work.',
    painSolution: 'One click. Timer + sounds.<br>Stay in one tab.<br>Focus starts faster.'
  },
  'pomodoro-for-adhd': {
    h1: 'Standard productivity advice wasn\'t written for your brain.',
    heroSubtitle: '25 minutes feels like a prison sentence. Guilt follows every failed attempt. The method isn\'t wrong—you need a different length.',
    title: 'Pomodoro for ADHD: Start With 15-Min Sprints | Superfocus',
    description: 'Sprint preset (15/3/10), white noise, clear structure. Built for neurodivergent focus. Free to try.',
    painPoints: '25 min = guaranteed fail.<br>Feel broken. Blame yourself.<br>Tools not made for you.',
    painSolution: '15-minute sprints. White noise.<br>Clear start and stop.<br>Work with your brain.'
  },
  'how-to-enter-flow-state': {
    h1: 'Flow state sounds mythical because you\'ve never protected enough time to find it.',
    heroSubtitle: 'You get five uninterrupted minutes if you\'re lucky. Flow needs forty-five.',
    title: 'How to Enter Flow State: Longer Blocks + Sounds | Superfocus',
    description: '45-min Flow or 90-min Deep Work + lofi/rain. Structure + sound = flow conditions. Try free.',
    painPoints: 'Never long enough uninterrupted.<br>Flow always interrupted.<br>Myth or memory.',
    painSolution: 'Block 45+ minutes. Sounds on.<br>One task. Protect it.<br>Flow has room to arrive.'
  },
  'pomodoro-timer-online': {
    h1: 'You don\'t want another app cluttering your phone.',
    heroSubtitle: 'Download, account, permissions, updates—sometimes you just need a timer in the browser and to start working.',
    title: 'Pomodoro Timer Online—No Install | Superfocus',
    description: 'Runs in browser. Pomodoro, Flow, Sprint, sounds, tasks. No download. Try superfocus.live free.',
    painPoints: 'Another app. Another account.<br>Phone storage full.<br>Just need a timer now.',
    painSolution: 'Open browser. Start timer.<br>Full app. Zero install.<br>Focus in 10 seconds.'
  },
  'focus-timer-for-lawyers': {
    h1: 'Six billable hours logged. Two were actual legal work.',
    heroSubtitle: 'Email, admin, and context-switching eat the research and drafting that clients actually pay for.',
    title: 'Billable Hours Slipping? Focus Timer for Lawyers | Superfocus',
    description: 'Block time for research and briefs. Pomodoro or Deep Work. Track focus sessions. Free.',
    painPoints: 'Reactive all day.<br>Deep work at midnight.<br>Billable time wasted.',
    painSolution: 'Block 90 min for research.<br>Timer on. Email closed.<br>Bill real hours.'
  },
  'focus-timer-for-designers': {
    h1: 'You opened Figma to design. You\'re still replying to Slack.',
    heroSubtitle: 'Creative work needs uninterrupted blocks. Your calendar doesn\'t have any.',
    title: 'Context Switching Killing Your Designs? | Superfocus',
    description: '45-min Flow blocks for creative deep work. Lofi + cafe sounds. Ship designs faster. Free.',
    painPoints: 'Figma open. Slack louder.<br>Never enter creative flow.<br>Revisions multiply.',
    painSolution: '45-minute design block.<br>Notifications off. Lofi on.<br>One concept. Done.'
  },
  'focus-timer-for-researchers': {
    h1: 'Your literature review list grows. Papers read: zero.',
    heroSubtitle: 'Research requires sustained attention you never allocate. Reading gets squeezed into scraps between meetings.',
    title: 'Literature Piling Up? Research Focus Timer | Superfocus',
    description: 'Pomodoro or Flow for reading and writing. Structure research sessions. Try Superfocus free.',
    painPoints: 'Papers bookmarked. None read.<br>No blocks for synthesis.<br>Review never finishes.',
    painSolution: '25 min per paper. Take notes.<br>Repeat daily.<br>Review progresses.'
  },
  'focus-timer-for-teachers': {
    h1: 'Grading follows you home every night.',
    heroSubtitle: 'Between classes, meetings, and emails, lesson prep and grading happen in exhausted fragments.',
    title: 'Grading Never Ends? Focus Timer for Teachers | Superfocus',
    description: 'Sprint or Pomodoro for grading and planning. Block time between classes. Free for educators.',
    painPoints: 'Grade at midnight.<br>Prep in five-min gaps.<br>Always behind.',
    painSolution: 'Block 25 min for grading.<br>Batch papers. Timer off.<br>Home at a reasonable hour.'
  },
  'focus-timer-for-consultants': {
    h1: 'The deck is due tomorrow. You haven\'t opened PowerPoint.',
    heroSubtitle: 'Client calls fill the calendar. Deep analysis and slide building happen in panic mode the night before.',
    title: 'Deck Due Tomorrow? Consultant Focus Timer | Superfocus',
    description: 'Block time for analysis and deliverables. Pomodoro + Todoist sync. Track billable focus. Free.',
    painPoints: 'Calls all day. Deck at midnight.<br>Quality suffers. Sleep too.<br>Unsustainable cycle.',
    painSolution: 'Morning block for deck work.<br>90 minutes protected.<br>Deliver without panic.'
  },
  'focus-timer-for-project-managers': {
    h1: 'You manage everyone\'s time except your own.',
    heroSubtitle: 'Status updates, standups, and fire drills consume the day. Planning happens never—or at 6pm.',
    title: 'No Time to Plan? PM Focus Timer | Superfocus',
    description: 'Sprint blocks for planning and reviews. Structure your day before it structures you. Free.',
    painPoints: 'Everyone\'s priority. Yours last.<br>Planning skipped again.<br>Projects drift.',
    painSolution: 'First pomodoro: your planning.<br>Before inbox. Before standup.<br>Lead instead of react.'
  },
  'focus-timer-for-marketers': {
    h1: 'Content calendar says "publish." Draft says empty.',
    heroSubtitle: 'Campaigns need creative blocks. Your day gives you notifications instead.',
    title: 'Content Always Overdue? Marketer Focus Timer | Superfocus',
    description: 'Pomodoro or Flow for content creation and campaign planning. Cafe sounds included. Free.',
    painPoints: 'Calendar full. Content empty.<br>Creative work gets scraps.<br>Deadlines win.',
    painSolution: 'Block creative time first.<br>25 min draft. No editing.<br>Publish on schedule.'
  },
  'focus-timer-for-email': {
    h1: 'You\'ve checked email fourteen times. Inbox: still full.',
    heroSubtitle: 'Reactive email mode makes everyone else\'s priorities yours. Deep work never gets a turn.',
    title: 'Inbox Never Empty? Email Focus Timer | Superfocus',
    description: 'Batch email in 15-min Sprint blocks. Reduce reactivity. Free Pomodoro timer.',
    painPoints: 'Check email. Lose hour.<br>Never batch. Always react.<br>Inbox owns you.',
    painSolution: 'Two 15-min email blocks daily.<br>Timer ends = inbox closed.<br>Take control back.'
  },
  'focus-timer-for-research': {
    h1: 'Three hours of "research" produced forty open tabs and zero notes.',
    heroSubtitle: 'Rabbit holes feel productive until you close the laptop with nothing synthesized.',
    title: 'Research Rabbit Holes? Structured Focus Timer | Superfocus',
    description: 'Time-box research dives. Pomodoro for reading, breaks for synthesis. Try Superfocus free.',
    painPoints: 'Open tab. Open tab. Open tab.<br>No synthesis. No output.<br>Research theater.',
    painSolution: '25 min read. 5 min notes.<br>Repeat. Synthesize.<br>Research becomes insight.'
  },
  'focus-timer-for-content-creation': {
    h1: 'Draft due Friday. Word count: zero on Wednesday.',
    heroSubtitle: 'Creating content requires starting, and starting requires protected time you never block.',
    title: 'Content Deadline Looming? Writing Focus Timer | Superfocus',
    description: 'Pomodoro for drafting, Marathon for long writes. Rain sounds included. Free.',
    painPoints: 'Deadline closer. Still not started.<br>Perfectionism paralysis.<br>Publish date wins.',
    painSolution: 'Bad first draft in 25 min.<br>Timer forces start.<br>Edit later. Ship on time.'
  },
  'focus-timer-for-brainstorming': {
    h1: 'The brainstorm has been going for an hour. No decisions made.',
    heroSubtitle: 'Unlimited ideation becomes unlimited wandering. Ideas scatter without time boundaries.',
    title: 'Brainstorm Going Nowhere? Time-Box It | Superfocus',
    description: '15-min Sprint for idea bursts. Generate, then decide. Free focus timer.',
    painPoints: 'Ideas everywhere. Decision nowhere.<br>Meeting runs long.<br>Nothing captured.',
    painSolution: '15 min generate. 5 min pick top 3.<br>Time box saves meetings.<br>Ideas become action.'
  },
  'focus-timer-for-admin-tasks': {
    h1: 'Admin tasks eat your day in bites too small to notice.',
    heroSubtitle: 'Five minutes here, ten there—by evening you\'ve done chores all day and avoided real work.',
    title: 'Admin Scattered All Day? Batch With a Timer | Superfocus',
    description: 'Sprint blocks for filing, data entry, updates. Batch admin, free time for deep work. Free.',
    painPoints: 'Death by small tasks.<br>Admin expands.<br>Deep work shrinks.',
    painSolution: 'One 15-min admin block.<br>Batch everything.<br>Rest of day: real work.'
  },
  'focus-timer-for-reviews': {
    h1: 'Seventeen PRs waiting. You\'ve reviewed none with full attention.',
    heroSubtitle: 'Shallow skimming isn\'t review—it\'s how bugs ship. Thorough review needs focused blocks.',
    title: 'Reviews Piling Up? Focus Timer for Code & Docs | Superfocus',
    description: '25-min Pomodoro per review batch. Full attention, fewer misses. Free.',
    painPoints: 'Skim reviews. Ship bugs.<br>No time for thorough.<br>Queue grows.',
    painSolution: 'One PR per pomodoro.<br>Full attention. Complete review.<br>Queue shrinks daily.'
  },
  'focus-timer-for-planning': {
    h1: 'You planned to plan your week. It\'s Thursday.',
    heroSubtitle: 'Without blocked planning time, every day starts reactive. Goals drift. Priorities blur.',
    title: 'No Time to Plan? Weekly Review Timer | Superfocus',
    description: 'Sprint or Pomodoro for weekly review and daily planning. Block it before the week blocks you. Free.',
    painPoints: 'Week starts chaotic.<br>Goals forgotten.<br>Always reacting.',
    painSolution: 'Monday: 25 min planning.<br>Before email. Before meetings.<br>Week runs you less.'
  },
  'study-timer-for-flashcards': {
    h1: '500 flashcards due. You\'ve done twelve.',
    heroSubtitle: 'Anki guilt grows with every notification. Without time blocks, review becomes avoidance.',
    title: 'Flashcard Backlog Growing? Study Sprint Timer | Superfocus',
    description: '15-min Sprint blocks for Anki/Quizlet. Sustainable review sessions. Free study timer.',
    painPoints: 'Cards pile up. Avoid Anki.<br>Guilt spiral.<br>Exam closer.',
    painSolution: '15 min review. Every day.<br>Timer ends = stop guilt-free.<br>Backlog shrinks.'
  },
  'study-timer-for-essay-writing': {
    h1: 'Essay due in 48 hours. Introduction: unfinished.',
    heroSubtitle: 'You\'ve rewritten the first sentence nine times. Perfectionism is procrastination in academic clothes.',
    title: 'Essay Due Soon? Pomodoro Writing Timer | Superfocus',
    description: '25-min writing blocks. Don\'t edit, just draft. Rain sounds for focus. Free for students.',
    painPoints: 'Edit before write.<br>First paragraph forever.<br>Deadline panic.',
    painSolution: '25 min: draft only.<br>Ugly words count.<br>Edit in the next block.'
  },
  'study-timer-for-language-learning': {
    h1: 'Duolingo streak: 400 days. You still can\'t hold a conversation.',
    heroSubtitle: 'Streaks measure taps, not fluency. Real practice needs focused immersion blocks you never schedule.',
    title: 'Language Apps Not Working? Focus Blocks | Superfocus',
    description: 'Sprint for drills, Pomodoro for reading/listening. Structure real practice. Free.',
    painPoints: 'Tap exercises. No immersion.<br>Streak without skill.<br>Fluency far away.',
    painSolution: '25 min speaking practice.<br>Timer on. Phone in drawer.<br>Real blocks, real progress.'
  },
  'study-timer-for-reading': {
    h1: 'Chapter 1 started three weeks ago.',
    heroSubtitle: 'You read the same page twice and retain nothing. Without breaks, fatigue wins by page three.',
    title: 'Can\'t Finish Reading Assignments? Study Timer | Superfocus',
    description: 'Pomodoro reading blocks with scheduled breaks. Finish chapters without burnout. Free.',
    painPoints: 'Read same page twice.<br>Eyes heavy. Mind gone.<br>Chapter never ends.',
    painSolution: '25 min read. 5 min walk.<br>Fresh eyes. Next section.<br>Chapters finish.'
  },
  'study-timer-for-thesis': {
    h1: 'Your thesis has been "almost done" for eight months.',
    heroSubtitle: 'Dissertation writing needs marathon blocks you never protect. Life fills every gap.',
    title: 'Thesis Stuck? Deep Work Writing Timer | Superfocus',
    description: '90-min Deep Work or 60-min Marathon for dissertation writing. Structure long sessions. Free.',
    painPoints: 'Chapter half-written. Months.<br>No protected writing time.<br>Committee waiting.',
    painSolution: '90 min every morning.<br>Same time. Same desk.<br>Thesis moves daily.'
  },
  'study-timer-for-note-taking': {
    h1: 'Your notes are a graveyard of half-finished lectures.',
    heroSubtitle: 'Review sessions never happen because consolidation takes focused time you don\'t allocate.',
    title: 'Notes Piling Up? Review Focus Timer | Superfocus',
    description: 'Sprint blocks for note review and consolidation. Turn notes into knowledge. Free.',
    painPoints: 'Notes collect dust.<br>Never review.<br>Exams surprise you.',
    painSolution: '15 min daily review.<br>One lecture at a time.<br>Notes become memory.'
  },
  'study-timer-for-online-courses': {
    h1: 'You bought the course in January. Module 2 of 47.',
    heroSubtitle: 'Video lectures play while you scroll. "Watching" isn\'t learning without focused attention.',
    title: 'Course Barely Started? Video Lecture Timer | Superfocus',
    description: 'Pomodoro blocks for video lectures. Breaks prevent binge-drifting. Track progress. Free.',
    painPoints: 'Video plays. Brain elsewhere.<br>Module 2 for months.<br>Money wasted.',
    painSolution: 'One module per pomodoro.<br>Notes required. Phone away.<br>Course actually finishes.'
  },
  'study-timer-for-group-study': {
    h1: 'Group study turned into group chat in twelve minutes.',
    heroSubtitle: 'Without shared structure, study sessions become social hours with textbooks as props.',
    title: 'Group Study Always Off-Track? Sync Timer | Superfocus',
    description: 'Shared Pomodoro blocks. Everyone focuses together, breaks together. Free study timer.',
    painPoints: 'Open books. Close focus.<br>Chat takes over.<br>Exam still coming.',
    painSolution: 'Shared 25-min timer.<br>Phones away. Break together.<br>Group actually studies.'
  },
  'study-timer-for-math': {
    h1: 'Problem 3 broke you. You\'ve been staring at it for forty minutes.',
    heroSubtitle: 'Math fatigue is real. Without breaks, frustration replaces problem-solving.',
    title: 'Stuck on Problem Sets? Math Study Timer | Superfocus',
    description: 'Sprint blocks for problem sets. Break between problems. White noise for concentration. Free.',
    painPoints: 'Stuck on one problem.<br>Frustration builds.<br>Set abandoned.',
    painSolution: '15 min per problem max.<br>Move on. Return fresh.<br>Sets get finished.'
  },
  'study-timer-for-med-school': {
    h1: 'The stack of material is taller than you. Where do you even start?',
    heroSubtitle: 'Med school volume breaks unstructured study. Without blocks, you drown in content and retain nothing.',
    title: 'Med School Overwhelm? Long Study Session Timer | Superfocus',
    description: 'Pomodoro, Flow, Deep Work for anatomy, pharm, clinical prep. Built for marathon study days. Free.',
    painPoints: 'Volume impossible.<br>No structure.<br>Retention fails.',
    painSolution: 'One topic. 45 minutes.<br>Break. Next topic.<br>Mountain becomes steps.'
  },
  '10-minute-focus': {
    h1: 'Even fifteen minutes feels like too much right now.',
    heroSubtitle: 'When starting is the hardest part, the block needs to be small enough that starting isn\'t a decision.',
    title: 'Can\'t Start? Try a 10-Minute Focus Timer | Superfocus',
    description: 'Micro sessions for when 15 min feels long. Custom 10-min timer. Just begin. Free.',
    painPoints: 'Can\'t start at all.<br>15 min still too much.<br>Paralysis.',
    painSolution: '10 minutes. That\'s all.<br>Start impossibly small.<br>Momentum follows.'
  },
  '20-minute-focus': {
    h1: 'Twenty-five minutes is the hill you can\'t climb today.',
    heroSubtitle: 'Between 15 and 25 lies your sweet spot—but most timers force you to pick extremes.',
    title: '25 Min Too Long? 20-Minute Focus Timer | Superfocus',
    description: 'Custom 20-min blocks. Between Sprint and Pomodoro. Find your length. Free.',
    painPoints: '25 fails. 15 too short.<br>Need middle ground.<br>Wrong presets.',
    painSolution: '20 minutes. Custom preset.<br>Your length. Your rhythm.<br>Focus fits.'
  },
  '30-minute-focus': {
    h1: 'Twenty-five ends too soon. Forty-five feels impossible.',
    heroSubtitle: 'You need something in the middle—a block long enough for real progress, short enough to start.',
    title: 'Need More Than 25 Min? 30-Minute Timer | Superfocus',
    description: 'Custom 30-min focus blocks. Balanced work sessions. Free in Superfocus.',
    painPoints: '25 too short. 45 too long.<br>Goldilocks problem.<br>No preset fits.',
    painSolution: '30 minutes. Custom timer.<br>Enough depth. Still startable.<br>Your sweet spot.'
  },
  '35-minute-focus': {
    h1: 'You enter flow at minute 23. Pomodoro kills it at 25.',
    heroSubtitle: 'Two extra minutes isn\'t the answer—ten is. Extended blocks for when you\'re almost there.',
    title: 'Flow Cut Off at 25? Try 35 Minutes | Superfocus',
    description: 'Extended Pomodoro: 35-min blocks. Ride the flow wave. Custom preset. Free.',
    painPoints: 'Flow at 23. Bell at 25.<br>Always interrupted.<br>Never finish thinking.',
    painSolution: '35-minute block.<br>Flow has room.<br>Finish the thought.'
  },
  '40-minute-focus': {
    h1: 'You\'re building toward longer focus—but 45 still feels out of reach.',
    heroSubtitle: 'Gradual extension beats jumping straight to ultradian blocks. Train stamina in steps.',
    title: 'Building Focus Stamina? 40-Minute Timer | Superfocus',
    description: 'Pre-flow 40-min blocks. Step toward Flowtime. Custom timer in Superfocus. Free.',
    painPoints: '45 min daunting.<br>25 min insufficient.<br>Need stepping stone.',
    painSolution: '40 minutes this week.<br>45 next. Build gradually.<br>Stamina grows.'
  },
  '50-minute-focus': {
    h1: 'Your body wants ~52 minutes. Most timers offer 45 or 60.',
    heroSubtitle: 'Fighting your natural rhythm with arbitrary presets wastes the focus you do manage.',
    title: 'Between 45 and 52 Min? Custom Focus Timer | Superfocus',
    description: '50-min custom blocks near ultradian rhythm. Match your cycle. Free in Superfocus.',
    painPoints: '45 too short. 60 too long.<br>Body has a rhythm.<br>Apps ignore it.',
    painSolution: '50 minutes. Your cycle.<br>Custom preset.<br>Work with biology.'
  },
  'superfocus-vs-brain-fm': {
    h1: 'Brain.fm plays focus music. Then you still need a timer somewhere else.',
    heroSubtitle: 'Two subscriptions, two apps, two tabs—focus shouldn\'t require a tech stack.',
    title: 'Brain.fm + Timer = Two Apps. Superfocus = One | Superfocus',
    description: 'Timer + lofi/rain/cafe in one app. Compare vs Brain.fm. Try Superfocus free.',
    painPoints: 'Music app. Timer app.<br>Double cost. Double friction.<br>Focus fragmented.',
    painSolution: 'Sounds + timer together.<br>One app. One tab.<br>Start faster.'
  },
  'superfocus-vs-be-focused': {
    h1: 'Be Focused lives on your phone. Your work lives on your laptop.',
    heroSubtitle: 'iOS-only timers don\'t help when the document you need to write is on desktop.',
    title: 'Be Focused Is iOS Only. Superfocus Is Browser | Superfocus',
    description: 'Full Pomodoro in browser + sounds + analytics. No App Store needed. Compare free.',
    painPoints: 'Phone timer. Desktop work.<br>Platform mismatch.<br>Focus in wrong place.',
    painSolution: 'Browser timer.<br>Where work happens.<br>No install needed.'
  },
  'superfocus-vs-marinara': {
    h1: 'Marinara lives in Chrome. Your focus needs more than an extension.',
    heroSubtitle: 'A browser extension timer is fine until you need sounds, tasks, and analytics too.',
    title: 'Outgrew Marinara Extension? Full Focus App | Superfocus',
    description: 'Beyond Chrome extension: sounds, Todoist, analytics. Compare Marinara vs Superfocus. Free.',
    painPoints: 'Extension only. No sounds.<br>No tasks. No stats.<br>Outgrown it.',
    painSolution: 'Full web app.<br>Timer + everything else.<br>Same browser. More power.'
  },
  'superfocus-vs-focus-keeper': {
    h1: 'Focus Keeper tracks pomodoros on mobile. Your report is due on desktop.',
    heroSubtitle: 'Mobile-first focus tools miss where knowledge work actually happens.',
    title: 'Focus Keeper on Phone, Work on Laptop? | Superfocus',
    description: 'Browser Pomodoro with sounds and analytics. Desktop-first focus. Compare free.',
    painPoints: 'Phone app. Desktop work.<br>Stats on wrong device.<br>Disconnect.',
    painSolution: 'Focus where you type.<br>Browser-based. Full features.<br>One place for everything.'
  },
  'superfocus-vs-ticktick': {
    h1: 'TickTick has a timer buried in a task app. You need focus first.',
    heroSubtitle: 'Task managers with bolt-on timers treat focus as an afterthought.',
    title: 'TickTick Timer Not Enough? Superfocus + Todoist | Superfocus',
    description: 'Focus-first timer with Todoist sync. Sounds, analytics, deep work presets. Compare free.',
    painPoints: 'Tasks everywhere. Focus nowhere.<br>Timer is secondary.<br>Features buried.',
    painSolution: 'Focus-first design.<br>Tasks sync from Todoist.<br>Timer is the point.'
  },
  'superfocus-vs-clockify': {
    h1: 'Clockify tracks time. It doesn\'t help you focus.',
    heroSubtitle: 'Knowing you wasted four hours doesn\'t prevent wasting the next four. You need structure, not just tracking.',
    title: 'Time Tracking Without Focus? Superfocus vs Clockify',
    description: 'Focus timer with analytics vs pure time tracker. Different tools, different jobs. Compare free.',
    painPoints: 'Track wasted time.<br>Still waste it.<br>Data without change.',
    painSolution: 'Timer creates focus.<br>Then tracks it.<br>Structure before stats.'
  },
  'superfocus-vs-noisli': {
    h1: 'Noisli makes rain sounds. You still forget to start the timer.',
    heroSubtitle: 'Ambient sound without time structure is vibes, not productivity.',
    title: 'Noisli for Sounds. Superfocus for Sounds + Timer | Superfocus',
    description: 'Rain, lofi, cafe plus Pomodoro timer. One app instead of two. Compare free.',
    painPoints: 'Sounds on. No structure.<br>Still drift for hours.<br>Atmosphere without action.',
    painSolution: 'Sounds + timer together.<br>25 min enforced.<br>Vibes become output.'
  },
  'brain-fm-alternative': {
    h1: 'You pay for focus music. You still need a separate timer.',
    heroSubtitle: 'Brain.fm solves half the problem. The other half is starting and stopping on schedule.',
    title: 'Brain.fm Alternative: Music + Timer Together | Superfocus',
    description: 'Lofi, rain, cafe cassettes plus Pomodoro timer. One app. Free to try.',
    painPoints: 'Subscription for music.<br>Another app for timer.<br>Double pay. Double setup.',
    painSolution: 'Music included. Timer included.<br>One free tier.<br>Start now.'
  },
  'be-focused-alternative': {
    h1: 'You want Be Focused features without the Apple ecosystem lock-in.',
    heroSubtitle: 'Platform-specific timers trap your workflow. Browser apps work everywhere.',
    title: 'Be Focused Alternative for Any Device | Superfocus',
    description: 'Pomodoro in browser. Windows, Mac, Linux. Sounds + analytics included. Free.',
    painPoints: 'iOS only. Or Mac only.<br>Switch devices = lose tool.<br>Platform lock-in.',
    painSolution: 'Any browser. Any OS.<br>Same timer everywhere.<br>Focus follows you.'
  },
  'marinara-alternative': {
    h1: 'You outgrew a Chrome extension. Your focus needs grew too.',
    heroSubtitle: 'Extensions break, update poorly, and lack the features real focus work demands.',
    title: 'Marinara Alternative: Full Focus Web App | Superfocus',
    description: 'Beyond extension: lofi, Todoist sync, analytics. Full focus app in browser. Free.',
    painPoints: 'Extension limits.<br>No sounds. No sync.<br>Ceiling hit.',
    painSolution: 'Full web app.<br>Same browser. Way more.<br>Room to grow.'
  },
  'focus-keeper-alternative': {
    h1: 'Focus Keeper counts tomatoes. You need to ship projects.',
    heroSubtitle: 'Gamified counters motivate briefly. Structure and sounds sustain focus daily.',
    title: 'Focus Keeper Alternative with Sounds + Analytics | Superfocus',
    description: 'Browser Pomodoro with lofi, rain, task sync. Beyond tomato counting. Free.',
    painPoints: 'Tomato count rises.<br>Output flat.<br>Gamification without results.',
    painSolution: 'Timer + sounds + tasks.<br>Track real output.<br>Focus that ships.'
  },
  'ticktick-pomodoro-alternative': {
    h1: 'TickTick\'s timer is a feature. Focus is your job.',
    heroSubtitle: 'When the timer is buried in settings, you never use it. Focus tools should lead, not follow.',
    title: 'TickTick Pomodoro Alternative + Todoist Sync | Superfocus',
    description: 'Focus-first timer that syncs Todoist. Sounds and analytics built in. Free.',
    painPoints: 'Timer hidden in task app.<br>Never find it.<br>Never use it.',
    painSolution: 'Timer is the homepage.<br>Tasks sync in.<br>Focus first.'
  },
  'flocus-alternative': {
    h1: 'You spent an hour customizing your Flocus theme. Zero pomodoros completed.',
    heroSubtitle: 'Beautiful dashboards become procrastination when setup replaces doing.',
    title: 'Flocus Alternative: Less Setup, More Sessions | Superfocus',
    description: 'Pomodoro + sounds + tasks without the dashboard rabbit hole. Free Flocus alternative.',
    painPoints: 'Theme tweaking. Widget arranging.<br>Zero focus sessions.<br>Aesthetic procrastination.',
    painSolution: 'Open app. Start timer.<br>No setup required.<br>Sessions over aesthetics.'
  },
  'focusmate-alternative': {
    h1: 'You don\'t need a stranger watching you work. You need to begin.',
    heroSubtitle: 'Accountability partners help some people. Others just need a timer and fewer obstacles.',
    title: 'Focusmate Alternative for Solo Deep Work | Superfocus',
    description: 'Solo focus timer with ambient sounds. No scheduling, no video. Just work. Free.',
    painPoints: 'Schedule partner. Small talk.<br>Perform focus for camera.<br>Still avoid hard work.',
    painSolution: 'Solo timer. Sounds on.<br>Start in 10 seconds.<br>No coordination needed.'
  },
  'noisli-alternative': {
    h1: 'Rain sounds play. Two hours pass. Nothing got done.',
    heroSubtitle: 'Ambience sets mood. Timers create output. You need both.',
    title: 'Noisli Alternative: Sounds + Pomodoro Timer | Superfocus',
    description: 'White noise, rain, lofi plus focus timer. Structure your sessions. Free.',
    painPoints: 'Beautiful sounds. Zero structure.<br>Vibe without output.<br>Two hours gone.',
    painSolution: 'Sounds + 25-min timer.<br>Mood and structure.<br>Output follows.'
  }
};

function applyToPagesJson() {
  const file = path.join(ROOT, 'pseo', 'pages.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let count = 0;
  for (const page of data.pages) {
    const copy = COPY[page.slug];
    if (!copy) continue;
    Object.assign(page, copy);
    count++;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${count} pages in pages.json`);
}

function applyToDatabaseDir() {
  const dbDir = path.join(ROOT, 'pseo', 'databases');
  if (!fs.existsSync(dbDir)) return;
  for (const file of fs.readdirSync(dbDir).filter(f => f.endsWith('.json'))) {
    const filePath = path.join(dbDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let count = 0;
    for (const entry of data.entries || []) {
      const copy = COPY[entry.slug];
      if (!copy) continue;
      Object.assign(entry, copy);
      count++;
    }
    if (count > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`Updated ${count} entries in ${file}`);
    }
  }
}

applyToPagesJson();
applyToDatabaseDir();
