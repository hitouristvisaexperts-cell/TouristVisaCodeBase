const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const ConsentLog = require('../models/ConsentLog');
const PendingRegistration = require('../models/PendingRegistration');
const audit = require('../utils/auditHelper');
const sendEmail = require('../utils/sendEmail');
const { ROLES } = require('../utils/constants');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Mirrors the JWT into a cookie scoped to the parent domain so the marketing
// site (touristvisaexperts.com) and portal (portal.touristvisaexperts.com)
// can both see the same logged-in session — localStorage alone is per-origin
// and invisible across subdomains, which is why the marketing site always
// showed a fresh login form even for an already-logged-in client.
const SESSION_COOKIE = 'fv_session';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // e.g. '.touristvisaexperts.com' in production

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches default JWT_EXPIRE
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { domain: COOKIE_DOMAIN, path: '/' });
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function otpEmailHtml({ name, code }) {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:480px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">🔐</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:20px;">Hi ${name},</h2>
      <p style="color:#64748b;line-height:1.7;margin:0 0 24px;font-size:14px;">Use this code to confirm your email and finish creating your visa portal account.</p>
      <div style="background:#fff7ed;border:1.5px solid rgba(249,115,22,0.3);border-radius:12px;padding:18px;margin-bottom:20px;">
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0A1628;font-family:monospace;">${code}</div>
      </div>
      <p style="color:#94a3b8;font-size:12.5px;line-height:1.6;margin:0 0 20px;">This code expires in 10 minutes.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;text-align:left;">
        <p style="color:#b91c1c;font-size:12px;font-weight:700;margin:0 0 4px;">Never share this code</p>
        <p style="color:#991b1b;font-size:12px;margin:0;line-height:1.6;">We will never ask you for this code over phone, email, or WhatsApp. If you didn't try to register, ignore this email.</p>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
  </div>
</body></html>`;
}

// Generates a fresh registration-verification OTP, stores it (hashed) on the
// pending-registration row, and emails the plaintext code. Returns the code
// so callers can echo it back in non-production responses (same convention
// as forgotPassword's dev-only resetUrl below).
async function issueRegistrationOtp(pending) {
  const code = String(crypto.randomInt(100000, 1000000));
  pending.otpCodeHash = crypto.createHash('sha256').update(code).digest('hex');
  pending.otpExpire = Date.now() + OTP_TTL_MS;
  pending.otpAttempts = 0;
  pending.expiresAt = new Date(Date.now() + OTP_TTL_MS + 10 * 60 * 1000);
  await pending.save();

  await sendEmail({
    to: pending.email,
    subject: `${code} is your Tourist Visa Experts verification code`,
    html: otpEmailHtml({ name: pending.name, code }),
  });

  return code;
}

function sendFirstLoginGreeting(user) {
  const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
  sendEmail({
    to: user.email,
    subject: '👋 Welcome to Your Visa Portal — First Login',
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:520px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="font-size:36px;margin-bottom:16px;">👋</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:22px;">Welcome, ${user.name}!</h2>
      <p style="color:#64748b;line-height:1.7;margin:0 0 20px;">You've successfully logged in to your visa portal for the first time. Your expert team is ready to guide you through every step of your visa journey.</p>
      <div style="background:#fff7ed;border:1.5px solid rgba(249,115,22,0.25);border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#9a3412;margin-bottom:8px;">⚠️ Important: Change your password</div>
        <div style="font-size:13px;color:#a16207;line-height:1.6;">For your security, please change your temporary password immediately after logging in.</div>
      </div>
      <a href="${portalUrl}/change-password" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">Go to My Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
  </div>
</body></html>`,
  }).catch(err => console.error('Greeting email error:', err.message));
}

function sendRegistrationConfirmationEmail(user) {
  const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
  sendEmail({
    to: user.email,
    subject: '✅ Registration Successful — Tourist Visa Experts',
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:520px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="font-size:36px;margin-bottom:16px;">✅</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:22px;">Welcome, ${user.name}!</h2>
      <p style="color:#64748b;line-height:1.7;margin:0 0 20px;">Your account has been created successfully. Our team will review your details and get in touch with you shortly to guide you through your visa journey.</p>
      <a href="${portalUrl}/login" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">Go to My Portal →</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
  </div>
</body></html>`,
  }).catch(err => console.error('Registration confirmation email error:', err.message));
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed attempts. Try after 30 minutes.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();

    const token = signToken(user._id);

    await audit({
      performedBy: user._id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `User ${user.email} logged in`,
      ipAddress: req.ip,
    });

    // Send greeting email on first ever login
    if (user.isFirstLogin) {
      sendFirstLoginGreeting(user);
    }

    setSessionCookie(res, token);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Continue with Google ─────────────────────────────────────────────────────
// The portal's Google button returns an ID token ("credential"); we check it with
// Google, then log the client in — or, the first time, create their client account.
// The client ID is public (it is in the portal's HTML too), so a default is fine.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  || '255901629118-q32ejsi969n0haqdc2quc0thru3dikce.apps.googleusercontent.com';
let googleClient;

// Returns the verified token payload ({ sub, email, email_verified, name, ... }) or throws.
// Kept on exports so the test harness can stand in for Google.
exports._verifyGoogle = async (credential) => {
  if (!googleClient) {
    const { OAuth2Client } = require('google-auth-library');
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  return ticket.getPayload();
};

// POST /api/auth/google  { credential, consents?: { dataProtection, termsRefund, ageConfirmed } }
exports.googleLogin = async (req, res) => {
  try {
    const { credential, consents } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }

    let payload;
    try {
      payload = await exports._verifyGoogle(credential);
    } catch {
      return res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ success: false, message: 'Your Google email address is not verified.' });
    }
    const email = String(payload.email).toLowerCase().trim();
    const name = String(payload.name || email.split('@')[0]).trim().slice(0, 100);

    let user = await User.findOne({ email }).select('+googleId +lockUntil');
    let created = false;

    if (user) {
      // Staff and admin accounts only sign in with their password
      if (user.role !== ROLES.CLIENT) {
        return res.status(403).json({ success: false, message: 'Please sign in with your email and password.' });
      }
      if (user.googleId && user.googleId !== payload.sub) {
        return res.status(401).json({ success: false, message: 'This email is linked to a different Google account.' });
      }
      if (user.isLocked()) {
        return res.status(423).json({ success: false, message: 'Account temporarily locked due to multiple failed attempts. Try after 30 minutes.' });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }
      const updates = { lastLogin: Date.now(), loginAttempts: 0, $unset: { lockUntil: 1 } };
      if (!user.googleId) updates.googleId = payload.sub;
      await User.updateOne({ _id: user._id }, updates);
    } else {
      // New client: the same three consents as the sign-up form are required
      const ok = consents && consents.dataProtection === true && consents.termsRefund === true && consents.ageConfirmed === true;
      if (!ok) {
        return res.status(428).json({ success: false, needsConsent: true, name, email, message: 'Please accept the terms to create your account.' });
      }
      user = await User.create({
        name, email, role: ROLES.CLIENT, googleId: payload.sub,
        // Never used to log in — the client can set a real password later via "Forgot password"
        password: crypto.randomBytes(32).toString('hex'),
      });
      await Client.create({ user: user._id });
      created = true;
      await ConsentLog.create({
        user: user._id, name: user.name, email: user.email, source: 'google_registration',
        consents: { dataProtection: true, termsRefund: true, ageConfirmed: true },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(err => console.error('Consent log error:', err.message));
      sendRegistrationConfirmationEmail(user);
    }

    await audit({
      performedBy: user._id,
      action: created ? 'CREATE_CLIENT' : 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: created ? `Client registered with Google: ${user.email}` : `User ${user.email} logged in with Google`,
      ipAddress: req.ip,
    });

    const token = signToken(user._id);
    setSessionCookie(res, token);
    res.status(created ? 201 : 200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isFirstLogin: user.isFirstLogin },
    });
  } catch (err) {
    const msg = err.code === 11000 ? 'An account with this email already exists' : 'Server error';
    res.status(err.code === 11000 ? 400 : 500).json({ success: false, message: msg });
  }
};

// POST /api/auth/logout — clears the shared session cookie
exports.logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
};

// GET /api/auth/session-token — lets the marketing site, which only sees
// the shared cookie (not the raw token the portal keeps in localStorage),
// hand the client straight into the portal without logging in again.
// Must run behind `protect` so req.user/the cookie have already been verified.
exports.getSessionToken = (req, res) => {
  const token = req.cookies && req.cookies.fv_session;
  res.json({ success: true, token, role: req.user.role });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let extra = {};

    if (user.role === ROLES.CLIENT) {
      // A user can have multiple visa cases (Client docs) — return all of them.
      const clients = await Client.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name email phone')
        .select('clientStatus currentStageKey meetLink meetScheduledAt visaType destinationCountry');
      extra.clients = clients;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        ...extra,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/register — step 1 of client self-registration: validates
// the details, emails an OTP, and stashes everything in PendingRegistration.
// No User is created yet — that only happens once verifyRegistrationOtp
// confirms the email is real, so an account can never exist with an
// unverified address.
exports.register = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      dataProtectionConsent, termsRefundConsent, ageConfirmed,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      pending = new PendingRegistration({ email: normalizedEmail });
    }
    pending.name = name;
    pending.phone = phone;
    pending.passwordHash = passwordHash;
    pending.dataProtectionConsent = !!dataProtectionConsent;
    pending.termsRefundConsent = !!termsRefundConsent;
    pending.ageConfirmed = !!ageConfirmed;
    pending.ipAddress = req.ip;
    pending.userAgent = req.headers['user-agent'];

    const code = await issueRegistrationOtp(pending);
    const devData = process.env.NODE_ENV !== 'production' ? { devOtp: code } : {};

    res.json({ success: true, otpRequired: true, email: normalizedEmail, ...devData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/verify-registration-otp — step 2: confirms the code and
// creates the real User/Client/ConsentLog records. This is the point a
// client account actually comes into existence.
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending || !pending.otpExpire || pending.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Code expired or invalid. Please register again.' });
    }

    if (pending.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please register again to get a new code.' });
    }

    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    if (hash !== pending.otpCodeHash) {
      pending.otpAttempts += 1;
      await pending.save();
      return res.status(400).json({ success: false, message: 'Incorrect code.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      await pending.deleteOne();
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // The User model's pre-save hook re-hashes `password` whenever it's
    // modified, so create the doc first with a placeholder, then patch the
    // already-hashed value in directly (bypassing the hook) via updateOne.
    const user = await User.create({
      name: pending.name, email: pending.email, phone: pending.phone,
      role: ROLES.CLIENT, password: pending.passwordHash,
    });
    await User.updateOne({ _id: user._id }, { password: pending.passwordHash });

    await Client.create({ user: user._id });

    const token = signToken(user._id);

    await ConsentLog.create({
      user: user._id, name: user.name, email: user.email, phone: user.phone, source: 'portal_registration',
      consents: {
        dataProtection: pending.dataProtectionConsent,
        termsRefund: pending.termsRefundConsent,
        ageConfirmed: pending.ageConfirmed,
      },
      ipAddress: pending.ipAddress,
      userAgent: pending.userAgent,
    }).catch(err => console.error('Consent log error:', err.message));

    await audit({
      performedBy: user._id,
      action: 'CREATE_CLIENT',
      entity: 'User',
      entityId: user._id,
      description: `Client self-registered: ${user.email}`,
      ipAddress: req.ip,
    });

    await pending.deleteOne();

    sendRegistrationConfirmationEmail(user);

    setSessionCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    const msg = err.code === 11000 ? 'An account with this email already exists' : 'Server error';
    res.status(err.code === 11000 ? 400 : 500).json({ success: false, message: msg });
  }
};

// POST /api/auth/resend-registration-otp
exports.resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pending) {
      return res.status(400).json({ success: false, message: 'No pending registration found for this email. Please start again.' });
    }

    const code = await issueRegistrationOtp(pending);
    const devData = process.env.NODE_ENV !== 'production' ? { devOtp: code } : {};
    res.json({ success: true, message: 'A new code has been sent.', ...devData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: ROLES.CLIENT }).select('+resetPasswordToken +resetPasswordExpire');

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If your email is registered, you will receive a reset link shortly.' });
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Tourist Visa Experts — Reset Your Password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
          <div style="background:#0b1120;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.03em;">Tourist Visa Experts</span>
          </div>
          <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin-bottom:8px;">Reset your password</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;">
            We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.5;">
            If you didn't request this, you can safely ignore this email. Your password will not change.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
          <p style="color:#cbd5e1;font-size:11px;">Tourist Visa Experts &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    });

    // In dev mode only, return the reset URL so it can be tested without SMTP
    const devData = process.env.NODE_ENV !== 'production' ? { resetUrl } : {};

    res.json({ success: true, message: 'If your email is registered, you will receive a reset link shortly.', ...devData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    await audit({
      performedBy: req.user._id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: req.user._id,
      description: 'User changed their password',
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
