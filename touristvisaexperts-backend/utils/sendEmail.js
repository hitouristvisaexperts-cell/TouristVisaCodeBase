const nodemailer = require('nodemailer');

const REGISTERED_OFFICE = 'Namaste Travel Amigo Private Limited, 5-894, Santhapet, Dongalabavi Street, Chittoor North, Chittoor, Andhra Pradesh – 517004, India';
const SITE_URL = process.env.SITE_URL || 'https://touristvisaexperts.com';

function complianceFooter() {
  return `
<div style="max-width:600px;margin:24px auto 0;padding:20px 16px;border-top:1px solid #e2e8f0;font-family:'Segoe UI',Arial,sans-serif;">
  <p style="font-size:11.5px;color:#b91c1c;font-weight:700;line-height:1.6;margin:0 0 12px;text-align:center;">
    We will NEVER ask you for your OTP, password, or card PIN over phone, email, or WhatsApp. Do not share these with anyone.
  </p>
  <p style="font-size:11px;color:#94a3b8;line-height:1.7;margin:0 0 10px;text-align:center;">
    <a href="${SITE_URL}/terms" style="color:#94a3b8;text-decoration:underline;">Terms &amp; Conditions</a> &nbsp;·&nbsp;
    <a href="${SITE_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a> &nbsp;·&nbsp;
    <a href="${SITE_URL}/refund-policy" style="color:#94a3b8;text-decoration:underline;">Refund &amp; Cancellation Policy</a> &nbsp;·&nbsp;
    <a href="${SITE_URL}/disclaimer" style="color:#94a3b8;text-decoration:underline;">Disclaimer</a>
  </p>
  <p style="font-size:10.5px;color:#cbd5e1;line-height:1.6;margin:0;text-align:center;">
    ${REGISTERED_OFFICE}<br/>
    Support: <a href="mailto:support@touristvisaexperts.com" style="color:#cbd5e1;">support@touristvisaexperts.com</a>
  </p>
</div>`;
}

module.exports = async ({ to, subject, html }) => {
  // If SMTP not configured, skip sending (token returned in API response for dev)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Append the shared compliance footer just before </body> if present,
  // otherwise append to the end (covers both full-HTML-document templates
  // and bare <div>-fragment templates used elsewhere in the codebase).
  const footer = complianceFooter();
  const finalHtml = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${footer}</body>`)
    : `${html}${footer}`;

  // The SMTP_FROM setting on the server still carries the old "Travel Tourist Visa Expert" name
  const from = (process.env.SMTP_FROM || `"Tourist Visa Experts" <${process.env.SMTP_USER}>`)
    .replace(/Travel\s+Tourist\s+Visa\s+Experts?/i, 'Tourist Visa Experts');

  try {
    return await transporter.sendMail({
      from,
      to,
      subject,
      html: finalHtml,
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to} (${subject}):`, err.message);
    return null;
  }
};
