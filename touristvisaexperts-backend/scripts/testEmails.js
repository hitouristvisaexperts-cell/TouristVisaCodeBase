/**
 * SMTP + Email Template Test Script
 * Sends every email template used in production to a test address.
 * Usage:  node scripts/testEmails.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

// Trim whitespace that might exist in .env keys/values
const e = k => (process.env[k] || '').trim();

const TO   = 'codeprabhas121@gmail.com';
const FROM = e('SMTP_FROM') || `"Tourist Visa Experts" <${e('SMTP_USER')}>`;
const PORTAL = 'https://portal.touristvisaexperts.com';
const YEAR   = new Date().getFullYear();

// ─── Transporter ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   e('SMTP_HOST'),
  port:   Number(e('SMTP_PORT')) || 465,
  secure: e('SMTP_SECURE') === 'true',
  auth: {
    user: e('SMTP_USER'),
    pass: e('SMTP_PASS'),
  },
});

// ─── Helper ──────────────────────────────────────────────────────────────────
async function send(label, subject, html) {
  process.stdout.write(`  Sending: ${label} ... `);
  try {
    const info = await transporter.sendMail({ from: FROM, to: TO, subject, html });
    console.log(`OK  (messageId: ${info.messageId})`);
    return true;
  } catch (err) {
    console.log(`FAILED\n    -> ${err.message}`);
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const T = {

  // 1. First-login greeting (authController.js)
  greeting: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:520px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="font-size:36px;margin-bottom:16px;">👋</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:22px;">Welcome, Rahul Sharma!</h2>
      <p style="color:#64748b;line-height:1.7;margin:0 0 20px;">You've successfully logged in to your visa portal for the first time. Your expert team is ready to guide you through every step of your visa journey.</p>
      <div style="background:#fff7ed;border:1.5px solid rgba(249,115,22,0.25);border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#9a3412;margin-bottom:8px;">⚠️ Important: Change your password</div>
        <div style="font-size:13px;color:#a16207;line-height:1.6;">For your security, please change your temporary password immediately after logging in.</div>
      </div>
      <a href="${PORTAL}/change-password" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">Go to My Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${YEAR} Tourist Visa Experts</div>
  </div>
</body></html>`,

  // 2. Password reset (authController.js)
  passwordReset: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
  <div style="background:#0b1120;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.03em;">Tourist Visa Experts</span>
  </div>
  <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin-bottom:8px;">Reset your password</h2>
  <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;">
    We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
  </p>
  <a href="${PORTAL}/reset-password/SAMPLE_RESET_TOKEN_abc123xyz" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
    Reset Password
  </a>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.5;">If you didn't request this, ignore this email. Your password won't change.</p>
</div>`,

  // 3. Meeting scheduled (teamController.js)
  meetingScheduled: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:520px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="font-size:32px;margin-bottom:16px;">📅</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:22px;">Meeting Scheduled</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi Rahul Sharma, a consultation call has been scheduled for you.</p>
      <div style="background:#f8f7f4;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="margin-bottom:12px;"><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Title</span><div style="color:#0A1628;font-weight:600;margin-top:4px;">Visa Consultation Call</div></div>
        <div style="margin-bottom:12px;"><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Date &amp; Time</span><div style="color:#0A1628;font-weight:600;margin-top:4px;">28 Jun 2026, 11:00 AM IST</div></div>
        <div><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Meeting Link</span><div style="margin-top:4px;"><a href="https://meet.google.com/sample-link" style="color:#F97316;font-weight:600;">https://meet.google.com/sample-link</a></div></div>
      </div>
      <a href="${PORTAL}/client/meetings" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">View in Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${YEAR} Tourist Visa Experts</div>
  </div>
</body></html>`,

  // 4. Client assigned to team member (adminController.js)
  clientAssigned: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
  <h2 style="color:#0A1628;">New Client Assigned to You</h2>
  <p style="color:#64748b;font-size:14px;">Hi Priya (Team Member), a new client has been assigned to you.</p>
  <div style="background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:10px;padding:16px;margin:16px 0;">
    <b style="color:#0f172a;">Rahul Sharma</b><br/>
    <span style="color:#64748b;font-size:13px;">rahul@example.com</span><br/>
    <span style="color:#64748b;font-size:13px;">+91 98765 43210</span>
  </div>
  <a href="${PORTAL}/team/clients" style="display:block;text-align:center;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;padding:13px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">View in Portal →</a>
</div>`,

  // 5. Client support request (clientController.js)
  supportRequest: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#1e293b;margin-bottom:4px;">New Support Request</h2>
  <p style="color:#64748b;margin-top:0;margin-bottom:24px;">A client has sent a support message via the portal.</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:8px 0;color:#64748b;width:120px;">From</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">Rahul Sharma</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;color:#0f172a;">rahul@example.com</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;">Subject</td><td style="padding:8px 0;color:#0f172a;">Documents checklist question</td></tr>
  </table>
  <div style="background:#f8fafc;border-left:4px solid #8b5cf6;padding:16px 20px;border-radius:0 8px 8px 0;">
    <p style="margin:0;color:#334155;line-height:1.7;">Hello, I wanted to ask about the documents needed for my Schengen visa. Could you provide a detailed checklist? Thank you!</p>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reply directly to this email to respond to the client.</p>
</div>`,

  // 6. Flight reservation confirmation to customer (flightController.js)
  flightConfirm: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0f1829,#151f36);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
    <div style="color:#F97316;font-size:18px;font-weight:800;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Flight Reservation Confirmed</div>
  </div>
  <div style="background:#fff;border-radius:14px;padding:26px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size:30px;margin-bottom:10px;">✈️</div>
    <h2 style="color:#0f172a;font-size:19px;margin:0 0 6px;">Your reservation is confirmed!</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 18px;">
      We've received your payment and our team is preparing your embassy-verifiable ticket. It will be delivered to your inbox.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:4px 0;width:120px;">Route</td><td style="font-weight:700;color:#0f172a;">Mumbai (BOM) → Dubai (DXB)</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Departure</td><td style="font-weight:600;color:#0f172a;">2026-07-15</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Return</td><td style="font-weight:600;color:#0f172a;">2026-07-22</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Passengers</td><td style="font-weight:600;color:#0f172a;">2</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Amount</td><td style="font-weight:700;color:#F97316;">₹1998</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Payment ID</td><td style="font-family:monospace;font-size:11px;color:#475569;">pay_SampleRazorpay123</td></tr>
      </table>
    </div>
  </div>
  <div style="text-align:center;margin-top:18px;color:#94a3b8;font-size:12px;">&copy; ${YEAR} Tourist Visa Experts</div>
</div>`,

  // 7. Flight reservation admin notification (flightController.js)
  flightAdmin: `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;">
  <h2 style="color:#0f172a;">New Flight Reservation (PAID)</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#94a3b8;width:130px;">Route</td><td style="font-weight:700;">Mumbai (BOM) → Dubai (DXB)</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Trip</td><td>round-trip</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Departure</td><td>2026-07-15</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Return</td><td>2026-07-22</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Passengers</td><td>Rahul Sharma, Priya Sharma</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Contact</td><td>codeprabhas121@gmail.com +91 98765 43210</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Payment ID</td><td style="font-family:monospace;">pay_SampleRazorpay123</td></tr>
  </table>
  <p style="margin-top:16px;font-size:13px;color:#64748b;">Prepare and deliver the ticket to the customer's inbox.</p>
</div>`,

  // 8. Payment confirmed — portal access activated (paymentController.js)
  paymentConfirm: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:40px 0;text-align:center;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px;">Payment Confirmed</div>
  </div>
  <div style="max-width:560px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:20px;padding:36px 32px;margin-top:-24px;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
      <span style="font-size:40px;">✅</span>
      <h1 style="color:#0A1628;font-size:22px;font-weight:800;margin:12px 0 8px;">Payment Successful, Rahul!</h1>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">Your full portal access has been activated. You can now access all features of your visa dashboard.</p>
      <div style="background:#f8f7f4;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:5px 0;width:130px;">Email</td><td style="font-weight:600;color:#0f172a;">rahul@example.com</td></tr>
          <tr><td style="color:#94a3b8;padding:5px 0;">Package</td><td style="font-weight:700;color:#F97316;">Essential</td></tr>
          <tr><td style="color:#94a3b8;padding:5px 0;">Visa Type</td><td style="font-weight:600;color:#0f172a;">Tourist → UAE</td></tr>
          <tr><td style="color:#94a3b8;padding:5px 0;">Payment ID</td><td style="font-family:monospace;font-size:12px;color:#475569;">pay_SampleRazorpay123</td></tr>
        </table>
      </div>
      <a href="${PORTAL}" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-radius:12px;padding:16px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">Go to My Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${YEAR} Tourist Visa Experts</div>
  </div>
</body></html>`,

  // 9. Welcome email with credentials (paymentController.js — new user)
  welcomeWithCreds: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628 0%,#0d1e3a 100%);padding:40px 0;text-align:center;">
    <div style="display:inline-block;background:linear-gradient(135deg,#F97316,#f85c00);border-radius:12px;padding:10px 20px;margin-bottom:16px;">
      <span style="color:#fff;font-weight:800;font-size:18px;letter-spacing:-0.03em;">TVE</span>
    </div>
    <div style="color:#fff;font-size:22px;font-weight:700;margin-top:8px;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px;">Your Visa Portal Access</div>
  </div>
  <div style="max-width:560px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:20px;padding:36px 32px;margin-top:-24px;box-shadow:0 8px 40px rgba(0,0,0,0.08);border:1px solid rgba(249,115,22,0.1);">
      <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#fff7ed,#fed7aa);border:1.5px solid rgba(249,115,22,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">🎉</span>
      </div>
      <h1 style="color:#0A1628;font-size:24px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;">Welcome aboard, Rahul!</h1>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">Your payment was successful and your account has been created. Below are your login credentials to access your personal visa portal.</p>
      <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1.5px solid rgba(249,115,22,0.25);border-radius:12px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Purchased Package</div>
        <div style="font-size:18px;font-weight:800;color:#F97316;">Essential Plan</div>
        <div style="font-size:13px;color:#78716c;margin-top:4px;">Tourist → UAE</div>
      </div>
      <div style="background:#f8f7f4;border-radius:14px;padding:20px 22px;margin-bottom:28px;border:1.5px solid #e2e8f0;">
        <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">Your Login Credentials</div>
        <div style="margin-bottom:12px;">
          <div style="font-size:11.5px;color:#94a3b8;font-weight:600;margin-bottom:3px;">Email Address</div>
          <div style="font-size:15px;font-weight:700;color:#0A1628;font-family:monospace;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;">codeprabhas121@gmail.com</div>
        </div>
        <div>
          <div style="font-size:11.5px;color:#94a3b8;font-weight:600;margin-bottom:3px;">Temporary Password</div>
          <div style="font-size:18px;font-weight:800;color:#F97316;font-family:monospace;background:#fff;border:1.5px solid rgba(249,115,22,0.3);border-radius:8px;padding:10px 14px;letter-spacing:0.05em;">Travel4321@</div>
        </div>
      </div>
      <a href="${PORTAL}/login" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-radius:12px;padding:16px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">Access Your Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${YEAR} Tourist Visa Experts</div>
  </div>
</body></html>`,

  // 10. Team member notified of new client (paymentController.js)
  teamNewClient: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#071f16,#0a2e1e);border-radius:10px;padding:20px 24px;margin-bottom:20px;text-align:center;">
    <div style="color:#10b981;font-size:18px;font-weight:700;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">New Client Assignment</div>
  </div>
  <div style="background:#fff;border-radius:14px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size:28px;margin-bottom:12px;">👤</div>
    <h2 style="color:#0A1628;font-size:20px;font-weight:800;margin:0 0 6px;">Hi Priya,</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 20px;">A new client has just completed payment and has been assigned to you. Please reach out for a welcome consultation.</p>
    <div style="background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-weight:700;color:#0f172a;font-size:15px;">Rahul Sharma</div>
      <div style="color:#64748b;font-size:13px;margin-top:4px;">rahul@example.com · +91 98765 43210</div>
      <div style="color:#10b981;font-size:13px;font-weight:600;margin-top:6px;">Package: Essential · Tourist → UAE</div>
    </div>
    <a href="${PORTAL}/team/clients" style="display:block;text-align:center;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:13px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">View in Portal →</a>
  </div>
</div>`,

  // 11. Admin notified of new payment (paymentController.js)
  adminNewPayment: `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
  <h2 style="color:#0A1628;margin-bottom:8px;">New Client Payment</h2>
  <p style="color:#64748b;font-size:14px;margin-bottom:20px;">A client has completed payment.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#94a3b8;width:140px;">Name</td><td style="font-weight:700;color:#0f172a;">Rahul Sharma</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Email</td><td style="font-weight:700;color:#0f172a;">rahul@example.com</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Phone</td><td style="font-weight:700;color:#0f172a;">+91 98765 43210</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Destination</td><td style="font-weight:700;color:#0f172a;">UAE</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Visa Type</td><td style="font-weight:700;color:#0f172a;">Tourist</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Package</td><td style="font-weight:700;color:#F97316;">Essential — ₹10,000</td></tr>
    <tr><td style="padding:8px 0;color:#94a3b8;">Payment ID</td><td style="font-family:monospace;color:#0f172a;">pay_SampleRazorpay123</td></tr>
  </table>
</div>`,
};

// ─── Run all tests ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n========================================');
  console.log(' SMTP Email Template Test');
  console.log('========================================');
  console.log(` Host  : ${e('SMTP_HOST')}:${e('SMTP_PORT')} (secure=${e('SMTP_SECURE')})`);
  console.log(` User  : ${e('SMTP_USER')}`);
  console.log(` To    : ${TO}`);
  console.log('----------------------------------------\n');

  // Verify SMTP connection first
  process.stdout.write('Verifying SMTP connection ... ');
  try {
    await transporter.verify();
    console.log('OK\n');
  } catch (err) {
    console.log(`FAILED\n -> ${err.message}\n`);
    console.log('Aborting — fix SMTP credentials in .env before testing templates.\n');
    process.exit(1);
  }

  const tests = [
    ['1. First-Login Greeting',           '👋 [TEST] Welcome to Your Visa Portal — First Login',                T.greeting],
    ['2. Password Reset',                  '[TEST] Reset Your Password',                                         T.passwordReset],
    ['3. Meeting Scheduled',               '📅 [TEST] Meeting Scheduled: Visa Consultation Call',               T.meetingScheduled],
    ['4. Client Assigned (to team)',       '[TEST] New Client Assigned — Rahul Sharma',                         T.clientAssigned],
    ['5. Support Request (to admin)',      '[TEST] [Client Support] Documents checklist question',               T.supportRequest],
    ['6. Flight Confirm (to customer)',    '✈️ [TEST] Flight Reservation Confirmed',                             T.flightConfirm],
    ['7. Flight Notification (to admin)', '[TEST] New Flight Reservation — Mumbai (BOM) → Dubai (DXB)',         T.flightAdmin],
    ['8. Payment Confirmed',              '✅ [TEST] Payment Confirmed — Full Access Activated',                 T.paymentConfirm],
    ['9. Welcome with Credentials',       '🎉 [TEST] Welcome! Your Tourist Visa Experts Portal Access',   T.welcomeWithCreds],
    ['10. Team New Client Alert',         '[TEST] New Client Assigned — Rahul Sharma needs a welcome call',     T.teamNewClient],
    ['11. Admin Payment Alert',           '[TEST] New Client Payment — Rahul Sharma',                           T.adminNewPayment],
  ];

  let passed = 0, failed = 0;

  for (const [label, subject, html] of tests) {
    const ok = await send(label, subject, html);
    if (ok) passed++; else failed++;
    // Small gap between sends to avoid rate-limiting
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n========================================');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
