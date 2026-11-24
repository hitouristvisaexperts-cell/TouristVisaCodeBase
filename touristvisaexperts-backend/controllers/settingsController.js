const Settings = require('../models/Settings');
const { getPrices, invalidatePrices, sanitizePrices, sanitizeCoupons } = require('../utils/pricing');

// GET /api/settings/public — no auth, returns Calendly URL + admin WhatsApp
exports.getPublicSettings = async (req, res) => {
  try {
    const docs = await Settings.find({ key: { $in: ['calendlyUrl', 'adminWhatsApp'] } });
    const map = {};
    docs.forEach(d => { map[d.key] = d.value; });
    res.json({
      success: true,
      data: {
        calendlyUrl:    map.calendlyUrl    || '',
        adminWhatsApp:  map.adminWhatsApp  || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/settings/pricing — public. The prices the website shows AND the payment server charges
// (₹, incl. 18% GST). Admins edit them in the portal: Admin → Pricing → Prices.
exports.getPricing = async (req, res) => {
  try {
    res.json({ success: true, data: await getPrices() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load prices.' });
  }
};

const DEFAULT_CASHBACK = {
  enabled: true,
  India:  { amount: 2500, symbol: '₹' },
  UK:     { amount: 50,   symbol: '£' },
  USA:    { amount: 60,   symbol: '$' },
  Europe: { amount: 50,   symbol: '£' },
  Other:  { amount: 2500, symbol: '₹' },
  // Re-application (visa rejected before): paid back per person only if the new visa is approved
  rejectedPerPerson: 5000,
  steps: [
    'Share a Video Testimonial – Tell us about your experience!',
    "Send a Photo with Your Visa Copy – Email us, and we'll feature it on our website & social media.",
    'Post on your Social Media & WhatsApp Status – Spread the word about your journey!',
    'Leave a Review – Share your feedback on our website & social media.',
  ],
  footerText: "Once you complete these steps, we'll credit your reward!",
};

// GET /api/settings/cashback — public, returns cashback config
exports.getCashback = async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: 'cashback' });
    const cashback = doc ? JSON.parse(doc.value) : DEFAULT_CASHBACK;
    res.json({ success: true, data: cashback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/settings/coupons — ADMIN ONLY. Coupon codes must never be public:
// anyone could read a 99%-off code and use it.
exports.getCoupons = async (req, res) => {
  try {
    const doc = await Settings.findOne({ key: 'coupons' });
    let list = [];
    try { list = sanitizeCoupons(JSON.parse(doc?.value || '[]')); } catch { list = []; }
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load coupons.' });
  }
};

// GET /api/settings — admin only, returns all settings
exports.getSettings = async (req, res) => {
  try {
    const docs = await Settings.find();
    const map = {};
    docs.forEach(d => { map[d.key] = d.value; });
    res.json({ success: true, data: map });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings — admin only, upserts known keys (values are validated before saving)
const SETTING_KEYS = ['calendlyUrl', 'adminWhatsApp', 'prices', 'pricing', 'cashback', 'coupons'];
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body || {};
    const unknown = Object.keys(updates).filter(k => !SETTING_KEYS.includes(k));
    if (unknown.length) return res.status(400).json({ success: false, message: `Unknown setting: ${unknown.join(', ')}` });

    const clean = {};
    for (const [key, raw] of Object.entries(updates)) {
      if (key === 'coupons' || key === 'prices' || key === 'cashback' || key === 'pricing') {
        let parsed;
        try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {
          return res.status(400).json({ success: false, message: `Invalid ${key} data.` });
        }
        if (key === 'coupons') parsed = sanitizeCoupons(parsed);
        if (key === 'prices') parsed = sanitizePrices(parsed);
        if (key === 'cashback' && (typeof parsed !== 'object' || parsed === null)) {
          return res.status(400).json({ success: false, message: 'Invalid cashback data.' });
        }
        clean[key] = JSON.stringify(parsed);
      } else {
        clean[key] = String(raw ?? '').trim().slice(0, 500);
      }
    }
    if (clean.calendlyUrl && !/^https:\/\//i.test(clean.calendlyUrl)) {
      return res.status(400).json({ success: false, message: 'Calendly link must start with https://' });
    }

    await Promise.all(Object.entries(clean).map(([key, value]) =>
      Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    ));
    if (clean.prices) invalidatePrices();
    res.json({ success: true, message: 'Settings saved.' });
  } catch (err) {
    console.error('updateSettings error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save settings.' });
  }
};
