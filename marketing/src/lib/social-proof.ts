export const people = [
  { name: "Nina", image: "/images/profiles/nina.webp" },
  { name: "David", image: "/images/profiles/david.webp" },
  { name: "Sam", image: "/images/profiles/sam.webp" },
  { name: "Alex", image: "/images/profiles/alex.webp" },
  { name: "Maya", image: "/images/profiles/maya.webp" },
];

export const quotes = [
  {
    quote: "I need to focus during precise hours. Superfocus helps me stay on track.",
    name: "Nina",
    role: "Life with Chevy",
    image: "/images/profiles/nina.webp",
  },
  {
    quote: "Blocking two pomodoros in the morning changed my day.",
    name: "David",
    role: "Ops",
    image: "/images/profiles/david.webp",
  },
  {
    quote: "Tried a bunch of apps. The 25-minute block actually sticks.",
    name: "Sam",
    role: "Law student",
    image: "/images/profiles/sam.webp",
  },
];

export const productFeatures = [
  {
    title: "Work in your own rhythm",
    description: "Pomodoro 25/5, short sprints, or longer deep work. Set the length you will actually finish.",
    points: ["Custom session lengths", "Breaks that match the block", "One task on the clock"],
    image: "/images/Timer.png",
    alt: "Superfocus timer presets and custom sessions",
  },
  {
    title: "Keep the task next to the timer",
    description: "Stop bouncing between a list and a clock. Name the work, then start the session.",
    points: ["Tasks in the same tab", "Progress as you finish blocks", "Import from Todoist"],
    image: "/images/Tasks.png",
    alt: "Superfocus task list",
    reverse: true,
  },
  {
    title: "Sound without a second tab",
    description: "Lofi, rain, and cassettes stay inside Superfocus so YouTube does not steal the session.",
    points: ["Built-in cassettes", "Your own tracks", "Timer and audio together"],
    image: "/images/Cassettes.png",
    alt: "Superfocus focus cassettes",
  },
  {
    title: "See the blocks you finished",
    description: "Streaks and reports count completed sessions — not hours a tab sat open.",
    points: ["Focus history", "Patterns over time", "Optional leaderboard"],
    image: "/images/Report.png",
    alt: "Superfocus focus report",
    reverse: true,
  },
] as const;
