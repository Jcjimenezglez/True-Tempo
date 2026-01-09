// api/email/templates.js

const PRICING_URL = 'https://www.superfocus.live/pricing';
const APP_URL = 'https://www.superfocus.live';

function getWelcomeEmailTemplate({ firstName = 'there' }) {
  return {
    subject: 'Welcome to Superfocus! 🎯',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Superfocus! 🎯</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Thanks for joining Superfocus! You're now part of a community of focused individuals who are taking control of their productivity.</p>
            <p><strong>Here's what you can do right now:</strong></p>
            <ul>
              <li>✅ Start your first focus session with our Pomodoro timer</li>
              <li>✅ Create 1 custom timer (Free plan)</li>
              <li>✅ Use 1 hour of focus time per day</li>
              <li>✅ Explore our curated focus music</li>
            </ul>
            <p><strong>Want unlimited features?</strong></p>
            <p>Upgrade to Premium and get:</p>
            <ul>
              <li>🚀 Unlimited custom timers</li>
              <li>🚀 Premium timer presets (Flow State, Marathon, Deep Work)</li>
              <li>🚀 Unlimited tasks</li>
              <li>🚀 Unlimited focus time</li>
              <li>🚀 Custom cassettes</li>
              <li>🚀 Notion & Todoist integration</li>
              <li>🚀 Advanced analytics</li>
            </ul>
            <div style="text-align: center;">
              <a href="${PRICING_URL}" class="button">Try Premium Free for 1 Month</a>
            </div>
            <p>Start your first session: <a href="${APP_URL}">${APP_URL}</a></p>
            <p>Happy focusing!<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this because you signed up for Superfocus.</p>
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a> | <a href="${APP_URL}/terms">Terms</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Superfocus! 🎯

Hi ${firstName},

Thanks for joining Superfocus! You're now part of a community of focused individuals.

Start your first focus session: ${APP_URL}

Want unlimited features? Try Premium free for 1 month: ${PRICING_URL}

Happy focusing!
The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail1({ firstName = 'there' }) {
  return {
    subject: 'Did you forget something? 🎯',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Did you forget something? 🎯</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We noticed you started to upgrade to Premium but didn't complete your subscription.</p>
            <p><strong>Don't miss out on:</strong></p>
            <ul>
              <li>✅ 1 month completely FREE</li>
              <li>✅ Unlimited custom timers</li>
              <li>✅ Premium timer presets (Flow State, Marathon, Deep Work)</li>
              <li>✅ Unlimited tasks & focus time</li>
              <li>✅ Notion & Todoist integration</li>
              <li>✅ Advanced analytics</li>
            </ul>
            <p>After your free trial, it's just $3.99/month. Cancel anytime.</p>
            <div style="text-align: center;">
              <a href="${PRICING_URL}" class="button">Complete Your Upgrade</a>
            </div>
            <p>Questions? Just reply to this email - we're here to help!</p>
            <p>Best,<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Did you forget something? 🎯

Hi ${firstName},

We noticed you started to upgrade to Premium but didn't complete your subscription.

Don't miss out on 1 month FREE, then just $3.99/month.

Complete your upgrade: ${PRICING_URL}

Questions? Just reply to this email.

Best,
The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail2({ firstName = 'there' }) {
  return {
    subject: 'Last chance: 1 month free ends soon ⏰',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Last chance: 1 month free ⏰</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>This is your last chance to claim 1 month of Premium completely free.</p>
            <p><strong>What you'll get:</strong></p>
            <ul>
              <li>🎯 Unlimited custom timers (create your perfect focus rhythm)</li>
              <li>🌊 Premium timer presets (Flow State, Marathon, Deep Work)</li>
              <li>📋 Unlimited tasks (organize your entire workflow)</li>
              <li>⏱️ Unlimited focus time (no daily limits)</li>
              <li>🎨 Custom cassettes (design your focus environment)</li>
              <li>🔗 Notion & Todoist integration (bring everything together)</li>
              <li>📊 Advanced analytics (track your productivity)</li>
            </ul>
            <p><strong>After 1 month free, it's just $3.99/month.</strong> Cancel anytime, no questions asked.</p>
            <div style="text-align: center;">
              <a href="${PRICING_URL}" class="button">Claim Your 1 Month Free</a>
            </div>
            <p>This offer won't last forever. Don't miss out!</p>
            <p>Best,<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Last chance: 1 month free ⏰

Hi ${firstName},

This is your last chance to claim 1 month of Premium completely free.

After 1 month free, it's just $3.99/month. Cancel anytime.

Claim your 1 month free: ${PRICING_URL}

This offer won't last forever. Don't miss out!

Best,
The Superfocus Team
    `,
  };
}

function getCheckoutAbandonedEmail3({ firstName = 'there' }) {
  return {
    subject: 'A testimonial from Nina 🎯',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .testimonial { background: white; padding: 20px; border-left: 4px solid #064e3b; margin: 20px 0; font-style: italic; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>See how others use Superfocus 🎯</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We wanted to share how Nina uses Superfocus to stay productive:</p>
            <div class="testimonial">
              <p>"I run a blog and dog daycare, so I need to focus during precise hours. Superfocus helps me stay on track and make real progress on my life project."</p>
              <p><strong>— Nina, Life with Chevy</strong></p>
            </div>
            <p>Like Nina, you can unlock unlimited productivity with Premium:</p>
            <ul>
              <li>✅ Create unlimited custom timers that match your workflow</li>
              <li>✅ Access Premium timer presets (Flow State, Marathon, Deep Work)</li>
              <li>✅ Organize unlimited tasks</li>
              <li>✅ Focus without limits</li>
              <li>✅ Connect with Notion & Todoist</li>
            </ul>
            <div style="text-align: center;">
              <a href="${PRICING_URL}" class="button">Start Your 1-Month Free Trial</a>
            </div>
            <p>Questions? Just reply to this email.</p>
            <p>Best,<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
See how others use Superfocus 🎯

Hi ${firstName},

See how Nina uses Superfocus:

"I run a blog and dog daycare, so I need to focus during precise hours. Superfocus helps me stay on track and make real progress on my life project."
— Nina, Life with Chevy

Unlock unlimited productivity with Premium. Start your 1-month free trial: ${PRICING_URL}

Best,
The Superfocus Team
    `,
  };
}

function getSubscriptionWelcomeEmail({ firstName = 'there' }) {
  return {
    subject: 'Welcome to Premium! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #064e3b; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Premium! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p><strong>Congratulations! You're now a Premium member.</strong></p>
            <p>You have 1 month completely free to explore all Premium features:</p>
            <div class="feature">
              <strong>🎯 Unlimited Custom Timers</strong><br>
              Create timers that match how you actually work—not how someone else thinks you should.
            </div>
            <div class="feature">
              <strong>🌊 Premium Timer Presets</strong><br>
              Access Flow State (45min), Marathon (60min), and Deep Work (90min) presets designed for extended productivity.
            </div>
            <div class="feature">
              <strong>📋 Unlimited Tasks</strong><br>
              Organize your entire workflow without limits.
            </div>
            <div class="feature">
              <strong>⏱️ Unlimited Focus Time</strong><br>
              Focus as much as you need, every single day.
            </div>
            <div class="feature">
              <strong>🎨 Custom Cassettes</strong><br>
              Design your own focus environments with custom images and Spotify playlists.
            </div>
            <div class="feature">
              <strong>🔗 Notion & Todoist Integration</strong><br>
              Bring your tasks from Notion and Todoist directly into Superfocus.
            </div>
            <div class="feature">
              <strong>📊 Advanced Analytics</strong><br>
              Track your productivity patterns and see your progress over time.
            </div>
            <div style="text-align: center;">
              <a href="${APP_URL}" class="button">Start Your First Premium Session</a>
            </div>
            <p><strong>Pro tip:</strong> Try creating a custom timer for your deep work sessions. Many users find that 52 minutes works better than the standard 25!</p>
            <p>Need help? Just reply to this email - we're here to support you.</p>
            <p>Happy focusing!<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to Superfocus Premium.</p>
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a> | <a href="${APP_URL}/terms">Terms</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Premium! 🎉

Hi ${firstName},

Congratulations! You're now a Premium member.

You have 1 month completely free to explore all Premium features:
- Unlimited Custom Timers
- Unlimited Tasks
- Unlimited Focus Time
- Custom Cassettes
- Notion & Todoist Integration
- Advanced Analytics

Start your first Premium session: ${APP_URL}

Pro tip: Try creating a custom timer for your deep work sessions. Many users find that 52 minutes works better than the standard 25!

Happy focusing!
The Superfocus Team
    `,
  };
}

function getSignupFollowUp1({ firstName = 'there' }) {
  return {
    subject: 'Your first focus session awaits 🎯',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your first focus session awaits 🎯</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Ready to supercharge your productivity? Let's get you started with your first focus session!</p>
            <p><strong>Quick start guide:</strong></p>
            <ol>
              <li>Click the button below to open Superfocus</li>
              <li>Choose a task you want to focus on</li>
              <li>Start your first 25-minute Pomodoro session</li>
              <li>Take a 5-minute break when done</li>
            </ol>
            <div style="text-align: center;">
              <a href="${APP_URL}" class="button">Start Your First Session</a>
            </div>
            <p><strong>Want more?</strong> Upgrade to Premium and get:</p>
            <ul>
              <li>✅ Unlimited custom timers</li>
              <li>✅ Premium timer presets (Flow State, Marathon, Deep Work)</li>
              <li>✅ Unlimited tasks</li>
              <li>✅ Unlimited focus time</li>
              <li>✅ Notion & Todoist integration</li>
            </ul>
            <p>Try Premium free for 1 month: <a href="${PRICING_URL}">${PRICING_URL}</a></p>
            <p>Happy focusing!<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your first focus session awaits 🎯

Hi ${firstName},

Ready to supercharge your productivity? Let's get you started!

Quick start:
1. Open Superfocus
2. Choose a task
3. Start your first 25-minute Pomodoro session
4. Take a 5-minute break when done

Start your first session: ${APP_URL}

Want more? Try Premium free for 1 month: ${PRICING_URL}

Happy focusing!
The Superfocus Team
    `,
  };
}

function getSignupFollowUp2({ firstName = 'there' }) {
  return {
    subject: 'Unlock unlimited productivity 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #064e3b, #065f46); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Unlock unlimited productivity 🚀</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>You've been using Superfocus for a few days now. How's it going?</p>
            <p>If you're hitting the limits of the Free plan, Premium unlocks everything:</p>
            <ul>
              <li>🎯 <strong>Unlimited custom timers</strong> - Create timers that match your workflow (52 min deep work? 17 min sprints? You decide!)</li>
              <li>🌊 <strong>Premium timer presets</strong> - Access Flow State, Marathon, and Deep Work presets</li>
              <li>📋 <strong>Unlimited tasks</strong> - Organize your entire workflow</li>
              <li>⏱️ <strong>Unlimited focus time</strong> - No more daily limits</li>
              <li>🎨 <strong>Custom cassettes</strong> - Design your perfect focus environment</li>
              <li>🔗 <strong>Notion & Todoist integration</strong> - Bring all your tasks together</li>
              <li>📊 <strong>Advanced analytics</strong> - Track your productivity patterns</li>
            </ul>
            <p><strong>Try Premium free for 1 month, then just $3.99/month.</strong> Cancel anytime.</p>
            <div style="text-align: center;">
              <a href="${PRICING_URL}" class="button">Start Your 1-Month Free Trial</a>
            </div>
            <p>Questions? Just reply to this email.</p>
            <p>Best,<br>The Superfocus Team</p>
          </div>
          <div class="footer">
            <p><a href="${APP_URL}">Superfocus</a> | <a href="${APP_URL}/privacy">Privacy</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Unlock unlimited productivity 🚀

Hi ${firstName},

You've been using Superfocus for a few days. If you're hitting the limits, Premium unlocks everything:

- Unlimited custom timers
- Unlimited tasks
- Unlimited focus time
- Custom cassettes
- Notion & Todoist integration
- Advanced analytics

Try Premium free for 1 month, then just $3.99/month. Cancel anytime.

Start your free trial: ${PRICING_URL}

Best,
The Superfocus Team
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

