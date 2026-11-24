const mongoose = require('mongoose');

const consentLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:  { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phone: { type: String, trim: true },

    source: { type: String, enum: ['checkout', 'portal_registration', 'google_registration'], required: true },

    consents: {
      dataProtection: { type: Boolean, default: false },
      termsRefund:    { type: Boolean, default: false },
      ageConfirmed:   { type: Boolean, default: false },
    },

    // Exact wording shown at consent time — protects against later copy changes
    // retroactively altering what an earlier user agreed to.
    consentTextSnapshot: {
      dataProtection: { type: String },
      termsRefund:    { type: String },
    },

    documentVersions: {
      privacyPolicy: { type: String, default: 'v1' },
      terms:         { type: String, default: 'v1' },
      refundPolicy:  { type: String, default: 'v1' },
    },

    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true } // createdAt IS the consent timestamp
);

consentLogSchema.set('versionKey', false);
consentLogSchema.index({ email: 1, createdAt: -1 });
consentLogSchema.index({ user: 1 });

module.exports = mongoose.model('ConsentLog', consentLogSchema);
