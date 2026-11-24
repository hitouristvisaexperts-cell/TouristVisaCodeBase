const cron = require('node-cron');
const Client = require('../models/Client');
const sendEmail = require('../utils/sendEmail');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = [7, 14, 21, 30];
const WARNING_DAY = 35;
const AUTO_CLOSE_DAY = 45;

async function runInactivitySweep() {
  const now = Date.now();
  const candidates = await Client.find({
    lastRequestAt: { $ne: null },
    inactivityAutoClosed: false,
  }).populate('user', 'name email');

  for (const client of candidates) {
    if (!client.user) continue;
    const daysSince = Math.floor((now - client.lastRequestAt.getTime()) / MS_PER_DAY);

    if (daysSince >= AUTO_CLOSE_DAY) {
      client.inactivityAutoClosed = true;
      client.inactivityAutoClosedAt = new Date();
      await client.save();
      await sendEmail({
        to: client.user.email,
        subject: 'Your visa application has been closed due to inactivity',
        html: autoCloseEmailHtml({ name: client.user.name }),
      }).catch(() => {});
      await notifyAdminOfClosure(client).catch(() => {});
      continue;
    }

    if (daysSince >= WARNING_DAY && !client.inactivityRemindersSent.includes(WARNING_DAY)) {
      await sendEmail({
        to: client.user.email,
        subject: 'Action required — your case will be closed in 10 days',
        html: warningEmailHtml({ name: client.user.name, daysSince }),
      }).catch(() => {});
      client.inactivityRemindersSent.push(WARNING_DAY);
      await client.save();
      continue;
    }

    for (const day of REMINDER_DAYS) {
      if (daysSince >= day && !client.inactivityRemindersSent.includes(day)) {
        await sendEmail({
          to: client.user.email,
          subject: `Reminder: We're waiting on your documents (Day ${day})`,
          html: reminderEmailHtml({ name: client.user.name, day }),
        }).catch(() => {});
        client.inactivityRemindersSent.push(day);
        await client.save();
      }
    }
  }
}

async function notifyAdminOfClosure(client) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;
  await sendEmail({
    to: adminEmail,
    subject: `Client auto-closed due to 45-day inactivity — ${client.user.name}`,
    html: `<div style="font-family:sans-serif;padding:20px;"><p>Client <strong>${client.user.name}</strong> (${client.user.email}) was automatically closed after 45 days of inactivity following a document/info request.</p></div>`,
  });
}

function reminderEmailHtml({ name, day }) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <h2 style="color:#1e293b;">Hi ${name},</h2>
    <p style="color:#475569;line-height:1.7;">It's been ${day} days since we last heard from you. We're still waiting on your documents/information to continue your visa application. Please log in to your portal and respond at your earliest convenience.</p>
  </div>`;
}
function warningEmailHtml({ name, daysSince }) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <h2 style="color:#b91c1c;">Final notice, ${name}</h2>
    <p style="color:#475569;line-height:1.7;">It has been ${daysSince} days of inactivity on your case. Per our Refund &amp; Cancellation Policy, your case will be automatically closed in 10 days if we do not hear from you.</p>
  </div>`;
}
function autoCloseEmailHtml({ name }) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <h2 style="color:#1e293b;">Hi ${name},</h2>
    <p style="color:#475569;line-height:1.7;">Your case has been closed due to 45 days of inactivity, as described in our Refund &amp; Cancellation Policy. If you'd like to continue, please contact support@touristvisaexperts.com.</p>
  </div>`;
}

function initInactivityCron() {
  cron.schedule('0 3 * * *', () => {
    runInactivitySweep().catch(err => console.error('Inactivity sweep error:', err.message));
  });
  console.log('Inactivity reminder cron scheduled (daily 03:00).');
}

module.exports = { initInactivityCron, runInactivitySweep };
