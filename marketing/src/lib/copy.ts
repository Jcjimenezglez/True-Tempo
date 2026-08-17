import type { PseoPage } from "@/lib/catalog";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extraHtmlFor(page: PseoPage) {
  const keyword = esc(page.keyword || page.h1);
  const h1 = esc(page.h1);
  const preset = esc(page.preset || "Pomodoro (25/5/15 min)");
  const cat = page.category;

  const howTo = `
<h2>How to run a ${keyword} session</h2>
<ol>
<li><strong>Name one outcome.</strong> “Study chapter 4” or “write the intro,” not “be productive.” Vague tasks are why people search how to focus and still open Slack.</li>
<li><strong>Pick ${preset}.</strong> If starting feels heavy, cut the block in half. A finished 15-minute sprint beats a abandoned 25-minute pomodoro.</li>
<li><strong>Start the Superfocus timer</strong> and optionally a cassette (lofi, rain, white noise) in the same tab. Do not open a second “study with me” video.</li>
<li><strong>When it rings, stand up.</strong> The break is part of the pomodoro technique, not optional chrome. Then start the next block or stop for the day.</li>
</ol>`;

  const mistakes = `
<h2>Mistakes that make ${h1.toLowerCase()} feel useless</h2>
<ul>
<li>Stacking three tools: a tomato timer, Spotify, and a task app. Context switching is the product.</li>
<li>Skipping breaks until you crash. Cirillo’s pomodoro technique uses 5-minute pauses on purpose.</li>
<li>Judging the day by hours in a chair instead of finished blocks. Superfocus analytics count completed sessions, not tab time.</li>
<li>Forcing 25/5 when the work is a 90-minute deep-work problem — or forcing 90 minutes when you cannot start.</li>
</ul>`;

  const whyTool = `
<h2>Why use Superfocus instead of a kitchen timer</h2>
<p>A kitchen timer or a silent chrome pomodoro extension only answers “when does this end?” Superfocus also holds the task, ambient sound, and a record of what you actually finished. That is the gap between a tomato timer novelty and a study timer or focus timer you will reopen tomorrow.</p>
<p>Related searches we designed for: pomodoro timer online, pomodoro technique timer, study timer, and focus timer — not a new productivity religion. One browser tab. $1.99/month after you Subscribe.</p>`;

  let specialized = "";
  if (cat === "techniques") {
    specialized = `
<h2>Where ${keyword} sits among other rhythms</h2>
<p>The pomodoro technique (25 on / 5 off, longer break after four) is the default because search volume and habit already point there. Flowtime and 45-minute blocks exist for writing and code. Deep work (about 90 minutes) is for problems that need warm-up. Sprint and 10–20 minute custom timers exist because ADHD and task paralysis are start problems, not “discipline” problems.</p>
<p>Use this page’s preset as a hypothesis. Run three sessions. If you quit early, shorten. If the bell kills flow, lengthen. Superfocus stores custom durations so you are not stuck with someone else’s tomato.</p>`;
  } else if (cat === "use-cases") {
    specialized = `
<h2>A realistic ${keyword} block</h2>
<p>Before the session: close extra tabs, put the phone face down, write the next physical action on the Superfocus task. During the session: only that action. After: log whether the block produced a sentence, a problem set, or a commit — not a vibe.</p>
<p>Students searching study timer or how to stay focused while studying usually fail because YouTube becomes the timer. Keep sound inside Superfocus. Workers searching focus timer usually fail because Slack is the default app. Treat the Superfocus clock like a meeting you already accepted.</p>`;
  } else if (cat === "compare" || cat === "alternatives") {
    specialized = `
<h2>How to choose (including Pomofocus)</h2>
<p>Pomofocus is a well-known minimal pomodoro timer online. Keep it if all you want is 25/5 in a clean page. Choose Superfocus when you also want tasks, cassettes, Todoist, and a report of focus time — without paying for three other apps. Forest is a phone-lock metaphor. Focusmate is a human appointment. Flocus and similar apps mix timer plus sound; Superfocus is the same idea with a $1.99 plan and a browser-first timer.</p>
<table>
<thead><tr><th>If you need</th><th>Start with</th></tr></thead>
<tbody>
<tr><td>Only a tomato / 25-5 clock</td><td>Any simple pomodoro timer</td></tr>
<tr><td>Timer + tasks + sound</td><td>Superfocus</td></tr>
<tr><td>Someone watching you work</td><td>Focusmate, then Superfocus for solo blocks</td></tr>
<tr><td>Growing a tree on your phone</td><td>Forest, plus a desktop timer for deep work</td></tr>
</tbody>
</table>`;
  } else if (cat === "sounds") {
    specialized = `
<h2>Sound that does not steal the session</h2>
<p>People search lofi study music and rain sounds because silence is loud and lyrics compete with reading. The failure mode is a YouTube sidebar. Superfocus cassettes keep audio inside the focus timer so the recommendation algorithm cannot pull you out mid-pomodoro.</p>
<p>White noise and cafe beds are for reading. Lofi is for repetitive tasks. Rain is for writing. If the track makes you hunt for a “better mix,” it is entertainment, not a cassette — switch or go silent.</p>`;
  } else if (cat === "faq") {
    specialized = `
<h2>Context for this FAQ</h2>
<p>Most pomodoro FAQ answers pretend 25 minutes is law. It is a default from Cirillo’s kitchen timer, not a medical protocol. Match length to the job: start resistance → short sprint; exams and problem sets → classic pomodoro; design or architecture → flow or deep work.</p>`;
  } else if (cat === "analytics") {
    specialized = `
<h2>What is worth tracking</h2>
<p>Track completed pomodoros and named tasks, not “hours the tab was open.” Superfocus reports exist so you can see whether Tuesday’s study timer actually produced blocks. Streaks are optional accountability, not a moral score.</p>`;
  } else if (cat === "workflows") {
    specialized = `
<h2>Keep planning next to the clock</h2>
<p>Todoist and other lists fail when the timer lives elsewhere. Import or copy one next action into Superfocus, run the block, then mark it done. Planning without a running clock is a diary. A clock without a task is a tomato animation.</p>`;
  } else {
    specialized = `
<h2>Make the keyword useful</h2>
<p>You landed here for <strong>${keyword}</strong>. Treat it as a session design, not an identity. Open Superfocus, pick ${preset}, and finish one block before you read another article about how to focus.</p>`;
  }

  return `${howTo}${specialized}${mistakes}${whyTool}`;
}
