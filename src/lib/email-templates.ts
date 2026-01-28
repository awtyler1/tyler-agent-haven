// Email templates for sync reminders
// These will be used by the edge function to send reminder emails

export const syncReminderEmail = (agentName: string, monthName: string, lastBookSize: number, lastEarnings: number) => ({
  subject: `Your ${monthName} reports are ready - see your updated earnings`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c1917; }
        .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
        .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
        .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #C9A227, #d4a72c); border-radius: 8px; }
        .stats-box { background: #fafaf9; border-radius: 12px; padding: 16px; margin: 24px 0; }
        .stats-row { display: flex; gap: 24px; }
        .stat { text-align: left; }
        .stat-value { font-size: 24px; font-weight: 700; color: #1c1917; }
        .stat-label { font-size: 14px; color: #78716c; }
        .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4; font-size: 12px; color: #a8a29e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <div class="logo-icon"></div>
          <span style="font-weight: 600;">TIG Platform</span>
        </div>

        <p>Hi ${agentName},</p>

        <p>Your carrier reports for <strong>${monthName}</strong> are now available. Sync your book to see:</p>

        <ul>
          <li>Your updated client count</li>
          <li>${monthName} earnings breakdown</li>
          <li>New enrollments this month</li>
        </ul>

        <div class="stats-box">
          <p style="font-size: 14px; color: #78716c; margin: 0 0 8px 0;">Last month you had:</p>
          <div class="stats-row">
            <div class="stat">
              <div class="stat-value">${lastBookSize.toLocaleString()}</div>
              <div class="stat-label">clients</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #059669;">$${lastEarnings.toLocaleString()}</div>
              <div class="stat-label">in earnings</div>
            </div>
          </div>
          <p style="font-size: 14px; color: #78716c; margin: 12px 0 0 0;">Sync to see how ${monthName} compares</p>
        </div>

        <div style="text-align: center;">
          <a href="https://www.tigagenthub.com/book-of-business" class="cta-button">Sync My Book</a>
        </div>

        <p style="font-size: 14px; color: #78716c;">This usually takes less than 5 minutes. You'll need your latest carrier production reports - download them from each carrier portal.</p>

        <p>Best,<br><strong>The TIG Team</strong></p>

        <div class="footer">
          <p>Tyler Insurance Group</p>
          <p>You're receiving this because you have a TIG Platform account.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hi ${agentName},

Your carrier reports for ${monthName} are now available. Sync your book to see:
- Your updated client count
- ${monthName} earnings breakdown
- New enrollments this month

Last month you had ${lastBookSize.toLocaleString()} clients and $${lastEarnings.toLocaleString()} in earnings.

Sync now: https://www.tigagenthub.com/book-of-business

Best,
The TIG Team
  `.trim()
});

export const syncFollowUpEmail = (agentName: string, monthName: string, daysSinceSync: number) => ({
  subject: `Reminder: Your ${monthName} data is waiting`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c1917; }
        .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
        .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Hi ${agentName},</p>

        <p>Quick reminder - you haven't synced your ${monthName} carrier reports yet. Your data is ${daysSinceSync} days old.</p>

        <p>Sync now to see your current book size and earnings:</p>

        <div style="text-align: center;">
          <a href="https://www.tigagenthub.com/book-of-business" class="cta-button">Sync My Book</a>
        </div>

        <p>Takes less than 5 minutes.</p>

        <p>Best,<br><strong>The TIG Team</strong></p>
      </div>
    </body>
    </html>
  `,
  text: `
Hi ${agentName},

Quick reminder - you haven't synced your ${monthName} carrier reports yet. Your data is ${daysSinceSync} days old.

Sync now: https://www.tigagenthub.com/book-of-business

Takes less than 5 minutes.

Best,
The TIG Team
  `.trim()
});
