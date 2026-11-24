const ConsentLog = require('../models/ConsentLog');

// POST /api/consent/log — public, called from checkout & registration flows
exports.logConsent = async (req, res) => {
  try {
    const {
      name, email, phone, source,
      dataProtection, termsRefund, ageConfirmed,
      consentTextSnapshot, documentVersions,
    } = req.body;

    const entry = await ConsentLog.create({
      user: req.user?._id || null,
      name, email, phone,
      source,
      consents: { dataProtection: !!dataProtection, termsRefund: !!termsRefund, ageConfirmed: !!ageConfirmed },
      consentTextSnapshot,
      documentVersions,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, id: entry._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not record consent.' });
  }
};

// GET /api/consent — admin only
exports.listConsent = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const filter = {};
    if (req.query.email) filter.email = req.query.email.toLowerCase().trim();

    const [items, total] = await Promise.all([
      ConsentLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ConsentLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
