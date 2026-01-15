// api/email/templates.js

const PRICING_URL = 'https://www.superfocus.live/pricing';
const APP_URL = 'https://www.superfocus.live';

// Shared email styles - black button, clean design
const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { padding: 32px 32px 24px; border-bottom: 1px solid #eee; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; }
  .content { padding: 32px; }
  .content p { margin: 0 0 16px; color: #333; }
  .content ul, .content ol { margin: 0 0 16px; padding-left: 20px; color: #333; }
  .content li { margin-bottom: 8px; }
  .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0; }
  .button:hover { background: #333333; }
  .button-container { text-align: center; margin: 24px 0; }
  .footer { padding: 24px 32px; background: #fafafa; text-align: center; font-size: 13px; color: #666; }
  .footer a { color: #666; text-decoration: underline; }
  .highlight { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 16px 0; }
  .testimonial { background: #f9f9f9; padding: 20px; border-left: 3px solid #000; margin: 20px 0; }
  .feature-box { background: #fafafa; padding: 16px 20px; margin: 12px 0; border-radius: 8px; }
  .feature-box strong { display: block; margin-bottom: 4px; color: #1a1a1a; }
  .feature-box span { color: #555; font-size: 14px; }
`;

function getWelcomeEmailTemplate({ firstName = 'there' }) {
  return {
    subject: 'Welcome to Superfocus',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Welcome to Superfocus</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Thanks for signing up. Superfocus helps you stay focused and get more done with simple time management.</p>
              
              <p><strong>What you can do now:</strong></p>
              <ul>
                <li>Start focus sessions with the Pomodoro timer</li>
                <li>Create 1 custom timer</li>
                <li>Use 1 hour of focus time per day</li>
                <li>Listen to focus music</li>
              </ul>
              
              <p><strong>Want more?</strong></p>
              <p>Premium gives you unlimited timers, unlimited focus time, custom vibes, and advanced analytics.</p>
              
              <p>Try it free for 7 days. Cancel anytime.</p>
              
              <div class="button-container">
                <a href="${PRICING_URL}" class="button">Start Free Trial</a>
              </div>
              
              <p>Ready to focus? <a href="${APP_URL}">Open Superfocus</a></p>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p>You signed up for Superfocus.</p>
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a> · <a href="${APP_URL}/terms">Terms</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Superfocus

Hi ${firstName},

Thanks for signing up. Superfocus helps you stay focused and get more done.

What you can do now:
- Start focus sessions with the Pomodoro timer
- Create 1 custom timer
- Use 1 hour of focus time per day
- Listen to focus music

Want more? Try Premium free for 7 days: ${PRICING_URL}

Ready to focus? ${APP_URL}

— The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail1({ firstName = 'there' }) {
  return {
    subject: 'You left something behind',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>You left something behind</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>You started upgrading to Premium but didn't finish. No worries — your trial is still available.</p>
              
              <p><strong>What you'll get:</strong></p>
              <ul>
                <li>7 days completely free</li>
                <li>Unlimited custom timers</li>
                <li>Unlimited focus time (no daily limits)</li>
                <li>Custom vibes (backgrounds + music)</li>
                <li>Advanced analytics</li>
              </ul>
              
              <p>After the trial, it's $3.99/month. Cancel anytime.</p>
              
              <div class="button-container">
                <a href="${PRICING_URL}" class="button">Start Free Trial</a>
              </div>
              
              <p>Questions? Just reply to this email.</p>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
You left something behind

Hi ${firstName},

You started upgrading to Premium but didn't finish. Your trial is still available.

What you'll get:
- 7 days completely free
- Unlimited custom timers
- Unlimited focus time
- Custom vibes (backgrounds + music)
- Advanced analytics

After the trial, it's $3.99/month. Cancel anytime.

Start your free trial: ${PRICING_URL}

Questions? Just reply to this email.

— The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail2({ firstName = 'there' }) {
  return {
    subject: 'Your free trial is waiting',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Your free trial is waiting</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Quick reminder: you can try Premium free for 7 days.</p>
              
              <div class="highlight">
                <p style="margin: 0;"><strong>Premium includes:</strong></p>
                <ul style="margin-top: 12px; margin-bottom: 0;">
                  <li>Create unlimited timers for your workflow</li>
                  <li>Focus as long as you want, no daily limits</li>
                  <li>Custom vibes with your own backgrounds and music</li>
                  <li>See your productivity patterns with analytics</li>
                </ul>
              </div>
              
              <p>If it's not for you, cancel before 7 days and pay nothing.</p>
              
              <p>After that, it's $3.99/month.</p>
              
              <div class="button-container">
                <a href="${PRICING_URL}" class="button">Start Free Trial</a>
              </div>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your free trial is waiting

Hi ${firstName},

Quick reminder: you can try Premium free for 7 days.

Premium includes:
- Create unlimited timers for your workflow
- Focus as long as you want, no daily limits
- Custom vibes with backgrounds and music
- See your productivity patterns with analytics

If it's not for you, cancel before 7 days and pay nothing.

After that, it's $3.99/month.

Start your free trial: ${PRICING_URL}

— The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail3({ firstName = 'there' }) {
  return {
    subject: 'How Nina uses Superfocus',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>How Nina uses Superfocus</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Wanted to share how one of our users stays productive:</p>
              
              <div class="testimonial">
                <p style="margin: 0 0 12px; font-style: italic;">"I run a blog and dog daycare, so I need to focus during precise hours. Superfocus helps me stay on track and make real progress on my life project."</p>
                <p style="margin: 0;"><strong>— Nina, Life with Chevy</strong></p>
              </div>
              
              <p>Like Nina, you can customize how you work with Premium:</p>
              <ul>
                <li>Create timers that match your schedule</li>
                <li>Focus without daily limits</li>
                <li>Design your own vibes with custom backgrounds</li>
                <li>Track your progress over time</li>
              </ul>
              
              <p>Try it free for 7 days.</p>
              
              <div class="button-container">
                <a href="${PRICING_URL}" class="button">Start Free Trial</a>
              </div>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
How Nina uses Superfocus

Hi ${firstName},

Wanted to share how one of our users stays productive:

"I run a blog and dog daycare, so I need to focus during precise hours. Superfocus helps me stay on track and make real progress on my life project."
— Nina, Life with Chevy

Like Nina, you can customize how you work with Premium:
- Create timers that match your schedule
- Focus without daily limits
- Custom vibes with your own backgrounds
- Track your progress over time

Try it free for 7 days: ${PRICING_URL}

— The Superfocus Team
    `,
  };
}

function getSubscriptionWelcomeEmail({ firstName = 'there' }) {
  return {
    subject: 'Welcome to Premium',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Welcome to Premium</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>You're now a Premium member. Your 7-day free trial has started.</p>
              
              <p><strong>What's unlocked:</strong></p>
              
              <div class="feature-box">
                <strong>Unlimited Custom Timers</strong>
                <span>Create timers that match how you actually work.</span>
              </div>
              
              <div class="feature-box">
                <strong>Premium Timer Presets</strong>
                <span>Flow State (45min), Marathon (60min), Deep Work (90min).</span>
              </div>
              
              <div class="feature-box">
                <strong>Unlimited Focus Time</strong>
                <span>No daily limits. Focus as long as you need.</span>
              </div>
              
              <div class="feature-box">
                <strong>Custom Vibes</strong>
                <span>Design your focus environment with custom backgrounds and music.</span>
              </div>
              
              <div class="feature-box">
                <strong>Advanced Analytics</strong>
                <span>See your productivity patterns over time.</span>
              </div>
              
              <div class="button-container">
                <a href="${APP_URL}" class="button">Start a Focus Session</a>
              </div>
              
              <p><strong>Tip:</strong> Many users find that 52-minute focus sessions work better than the standard 25. Try creating a custom timer.</p>
              
              <p>Need help? Reply to this email.</p>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p>You subscribed to Superfocus Premium.</p>
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a> · <a href="${APP_URL}/terms">Terms</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Premium

Hi ${firstName},

You're now a Premium member. Your 7-day free trial has started.

What's unlocked:
- Unlimited Custom Timers
- Premium Timer Presets (Flow State, Marathon, Deep Work)
- Unlimited Focus Time
- Custom vibes (backgrounds + music)
- Advanced Analytics

Start a focus session: ${APP_URL}

Tip: Many users find that 52-minute focus sessions work better than the standard 25. Try creating a custom timer.

Need help? Reply to this email.

— The Superfocus Team
    `,
  };
}

function getSignupFollowUp1({ firstName = 'there' }) {
  return {
    subject: 'Ready for your first session?',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Ready for your first session?</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Getting started is simple:</p>
              
              <ol>
                <li>Open Superfocus</li>
                <li>Pick a task to focus on</li>
                <li>Start a 25-minute session</li>
                <li>Take a 5-minute break when done</li>
              </ol>
              
              <p>That's it. Repeat 4 times for a full cycle.</p>
              
              <div class="button-container">
                <a href="${APP_URL}" class="button">Start First Session</a>
              </div>
              
              <p><strong>Want unlimited timers and focus time?</strong></p>
              <p>Try Premium free for 7 days. Create custom timers, design your own vibes, and track your progress.</p>
              
              <p><a href="${PRICING_URL}">Start your free trial</a></p>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ready for your first session?

Hi ${firstName},

Getting started is simple:

1. Open Superfocus
2. Pick a task to focus on
3. Start a 25-minute session
4. Take a 5-minute break when done

That's it. Repeat 4 times for a full cycle.

Start your first session: ${APP_URL}

Want unlimited timers and focus time? Try Premium free for 7 days: ${PRICING_URL}

— The Superfocus Team
    `,
  };
}

function getSignupFollowUp2({ firstName = 'there' }) {
  return {
    subject: 'Hitting the limits?',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Hitting the limits?</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>You've been using Superfocus for a few days. How's it going?</p>
              
              <p>If you're running into limits, Premium removes them:</p>
              
              <ul>
                <li><strong>Unlimited timers</strong> — Create timers for any workflow (52 min deep work, 17 min sprints, whatever works for you)</li>
                <li><strong>Unlimited focus time</strong> — No more daily caps</li>
                <li><strong>Custom vibes</strong> — Design your focus environment with backgrounds and music</li>
                <li><strong>Analytics</strong> — See your productivity patterns</li>
              </ul>
              
              <p>Try it free for 7 days. If it's not for you, cancel and pay nothing.</p>
              
              <p>After the trial, it's $3.99/month.</p>
              
              <div class="button-container">
                <a href="${PRICING_URL}" class="button">Start Free Trial</a>
              </div>
              
              <p>Questions? Reply to this email.</p>
              
              <p>— The Superfocus Team</p>
            </div>
            <div class="footer">
              <p><a href="${APP_URL}">Superfocus</a> · <a href="${APP_URL}/privacy">Privacy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hitting the limits?

Hi ${firstName},

You've been using Superfocus for a few days. How's it going?

If you're running into limits, Premium removes them:

- Unlimited timers — Create timers for any workflow
- Unlimited focus time — No more daily caps
- Custom vibes — Design your focus environment
- Analytics — See your productivity patterns

Try it free for 7 days. If it's not for you, cancel and pay nothing.

After the trial, it's $3.99/month.

Start your free trial: ${PRICING_URL}

Questions? Reply to this email.

— The Superfocus Team
    `,
  };
}

module.exports = {
  getWelcomeEmailTemplate,
  getCheckoutAbandonedEmail1,
  getCheckoutAbandonedEmail2,
  getCheckoutAbandonedEmail3,
  getSubscriptionWelcomeEmail,
  getSignupFollowUp1,
  getSignupFollowUp2,
};
