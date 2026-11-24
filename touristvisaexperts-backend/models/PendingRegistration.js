const mongoose = require('mongoose');

// Holds a not-yet-created client account while they verify their email via
// OTP. Nothing is written to User/Client until verification succeeds, so a
// verified email is guaranteed before an account (and its login) can exist.
// The TTL index auto-deletes abandoned registrations 10 minutes after the
// OTP would have expired anyway, so unverified rows never pile up.
const pendingRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  dataProtectionConsent: { type: Boolean, default: false },
  termsRefundConsent: { type: Boolean, default: false },
  ageConfirmed: { type: Boolean, default: false },
  ipAddress: { type: String },
  userAgent: { type: String },
  otpCodeHash: { type: String, required: true },
  otpAttempts: { type: Number, default: 0 },
  otpExpire: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

pendingRegistrationSchema.index({ email: 1 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
