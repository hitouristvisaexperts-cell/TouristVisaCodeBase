// Consultation bookings (paid, ₹999) and Contact Us messages from the website.
const Lead = require('../models/Lead');
const User = require('../models/User');
const Settings = require('../models/Settings');
const sendEmail = require('../utils/sendEmail');
const notify = require('../utils/notifyHelper');
const { getPrices, findCoupon, applyCoupon } = require('../utils/pricing');
const {
  razorpayClient, isValidSignature, fetchOrder, orderKind, claimPayment, finishPayment, releasePayment, escapeHtml, rupees,
} = require('../utils/razorpayHelper');

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

async function alertAdmins({ title, message, emailSubject, rows }) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  await Promise.all(admins.map(a => notify({ recipient: a._id, title, message, type: 'general' })));
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#0A1628;margin:0 0 16px;">${escapeHtml(title)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:7px 0;color:#94a3b8;width:150px;vertical-align:top;">${escapeHtml(k)}</td><td style="font-weight:600;color:#0f172a;white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`).join('')}
      </table>
      <p style="margin-top:18px;font-size:12px;color:#94a3b8;">Open the admin portal → Enquiries to follow up.</p>
    </div>`;
    sendEmail({ to: adminEmail, subject: emailSubject, html }).catch(err => console.error('Lead admin email failed:', err.message));
  }
}

// ─── POST /api/contact — Contact Us form (public) ──────────────────────────────
exports.submitContact = async (req, res) => {
  try {
    const name = clip(req.body.name, 120);
    const email = clip(req.body.email, 200).toLowerCase();
    const phone = clip(req.body.phone, 30);
    const subject = clip(req.body.subject, 150);
    const message = clip(req.body.message, 2000);
    if (!name || !isEmail(email) || message.length < 5) {
      return res.status(400).json({ success: false, message: 'Please enter your name, a valid email and a message.' });
    }
    const lead = await Lead.create({ kind: 'contact', name, email, phone, subject, message });
    alertAdmins({
      title: 'New contact message',
      message: `${name} (${email}) — ${subject || message.slice(0, 80)}`,
      emailSubject: `Website enquiry — ${name}`,
      rows: [['Name', name], ['Email', email], ['Phone', phone], ['Subject', subject], ['Message', message]],
    }).catch(() => {});
    res.status(201).json({ success: true, message: 'Thanks! Our team will get back to you shortly.', id: lead._id });
  } catch (err) {
    console.error('submitContact error:', err.message);
    res.status(500).json({ success: false, message: 'Could not send your message. Please try again.' });
  }
};

// ─── POST /api/consultation/create-order — ₹999 consultation (public) ──────────
exports.createConsultationOrder = async (req, res) => {
  try {
    const { consultation } = await getPrices();
    let coupon = null;
    if (req.body.promoCode && String(req.body.promoCode).trim()) {
      coupon = await findCoupon(req.body.promoCode, 'consultation');
      if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired promotion code.' });
    }
    const fullPaise = consultation * 100;
    const amount = applyCoupon(coupon, fullPaise, 1);
    const order = await razorpayClient().orders.create({
      amount, currency: 'INR', receipt: `cs_${Date.now()}`,
      notes: { kind: 'consultation', coupon: coupon?.code || '' },
    });
    res.json({
      success: true,
      data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, originalAmount: fullPaise, couponApplied: !!coupon },
    });
  } catch (err) {
    console.error('createConsultationOrder error:', JSON.stringify(err?.error || err?.message || err));
    res.status(500).json({ success: false, message: 'Payment initiation failed. Please try again.' });
  }
};

// ─── POST /api/consultation/verify — save booking after payment (public) ───────
exports.verifyConsultation = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
  }
  const order = await fetchOrder(razorpay_order_id);
  if (order && orderKind(order) !== 'consultation') {
    return res.status(400).json({ success: false, message: 'This payment is not for a consultation. Please contact support.' });
  }

  const firstName = clip(req.body.firstName, 60);
  const lastName = clip(req.body.lastName, 60);
  const name = `${firstName} ${lastName}`.trim();
  const email = clip(req.body.email, 200).toLowerCase();
  if (!firstName || !isEmail(email)) return res.status(400).json({ success: false, message: 'Name and a valid email are required.' });

  const claim = await claimPayment({ paymentId: razorpay_payment_id, orderId: razorpay_order_id, kind: 'consultation', amount: order?.amount });
  if (!claim.claimed) return res.json({ success: true, alreadyProcessed: true, message: 'Your consultation is already booked. Check your email.' });

  try {
    const lead = await Lead.create({
      kind: 'consultation', name, email,
      phone: clip(req.body.mobile, 30), whatsapp: clip(req.body.whatsapp, 30),
      nationality: clip(req.body.nationality, 60), country: clip(req.body.country, 80),
      message: clip(req.body.message, 2000),
      amount: order ? order.amount / 100 : undefined, couponCode: order?.notes?.coupon || '',
      paymentId: razorpay_payment_id, orderId: razorpay_order_id,
    });
    await finishPayment(claim.record, lead._id);

    const cal = await Settings.findOne({ key: 'calendlyUrl' }).lean();
    const calendlyUrl = cal?.value || process.env.CALENDLY_URL || '';
    sendEmail({
      to: email,
      subject: '✅ Consultation booked — Tourist Visa Experts',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;">
        <h2 style="color:#0A1628;margin:0 0 10px;">Your consultation is booked, ${escapeHtml(firstName)}!</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;">Thank you for your payment of <b>${order ? rupees(order.amount) : '₹999'}</b> (incl. 18% GST). A visa expert will contact you to confirm a time for your 30-minute session.</p>
        ${calendlyUrl ? `<p style="color:#475569;font-size:15px;line-height:1.6;">Prefer to choose a slot yourself? <a href="${escapeHtml(calendlyUrl)}" style="color:#F97316;font-weight:700;">Book your time here</a>.</p>` : ''}
        <p style="color:#94a3b8;font-size:12px;margin-top:22px;">Payment ID: ${escapeHtml(razorpay_payment_id)}</p>
      </div>`,
    }).catch(err => console.error('Consultation email failed:', err.message));

    alertAdmins({
      title: 'New paid consultation',
      message: `${name} (${email}) booked a consultation${lead.country ? ` — ${lead.country}` : ''}.`,
      emailSubject: `Consultation booked — ${name}`,
      rows: [['Name', name], ['Email', email], ['Mobile', lead.phone], ['WhatsApp', lead.whatsapp], ['Nationality', lead.nationality],
        ['Destination', lead.country], ['Message', lead.message], ['Amount paid', order ? rupees(order.amount) : '—'], ['Coupon', lead.couponCode], ['Payment ID', razorpay_payment_id]],
    }).catch(() => {});

    res.json({ success: true, message: 'Consultation booked! Check your email for the next steps.' });
  } catch (err) {
    console.error('verifyConsultation error:', err.message);
    await releasePayment(claim.record);
    res.status(500).json({ success: false, message: 'Could not save your booking. Please contact support with your payment ID.' });
  }
};

// ─── Admin: GET /api/admin/leads?kind=consultation|contact&status= ─────────────
exports.listLeads = async (req, res) => {
  try {
    const q = {};
    if (['consultation', 'contact'].includes(req.query.kind)) q.kind = req.query.kind;
    if (['new', 'contacted', 'scheduled', 'closed'].includes(req.query.status)) q.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const [data, total] = await Promise.all([
      Lead.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Lead.countDocuments(q),
    ]);
    res.json({ success: true, total, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load enquiries.' });
  }
};

// ─── Admin: PUT /api/admin/leads/:id { status, adminNote } ─────────────────────
exports.updateLead = async (req, res) => {
  try {
    const update = {};
    if (req.body.status !== undefined) {
      if (!['new', 'contacted', 'scheduled', 'closed'].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
      }
      update.status = req.body.status;
    }
    if (req.body.adminNote !== undefined) update.adminNote = clip(req.body.adminNote, 1000);
    const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    res.json({ success: true, data: lead });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid id.' });
    res.status(500).json({ success: false, message: 'Could not update enquiry.' });
  }
};

// POST /api/consultation/validate-coupon — preview a promo code (consultation codes only)
exports.validateConsultationCoupon = async (req, res) => {
  try {
    const coupon = await findCoupon(req.body?.promoCode, 'consultation');
    if (!coupon) return res.status(400).json({ success: false, message: 'This promo code is not valid for consultations.' });
    const { consultation } = await getPrices();
    const fullPaise = consultation * 100;
    res.json({ success: true, code: coupon.code, originalAmount: fullPaise, finalAmount: applyCoupon(coupon, fullPaise, 1) });
  } catch {
    res.status(500).json({ success: false, message: 'Could not check the promo code. Please try again.' });
  }
};

// ─── POST /api/checkout/lead-capture — Background Abandoned Checkout Capture (public) ──
exports.captureAbandonedCheckout = async (req, res) => {
  try {
    const name = clip(req.body.name, 120);
    const email = clip(req.body.email, 200).toLowerCase();
    const phone = clip(req.body.phone, 30);
    const country = clip(req.body.country || req.body.destinationCountry, 80);
    const packageType = clip(req.body.package || req.body.packageType, 80);
    const numberOfApplicants = Math.max(1, parseInt(req.body.numberOfApplicants, 10) || 1);
    const amount = Number(req.body.amount) || undefined;

    if (!name || !isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid name and email are required.' });
    }

    // Check if user is already registered client
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: true, message: 'Existing client recognized.', leadId: null });
    }

    // Upsert: update existing abandoned checkout if within 7 days
    const existingLead = await Lead.findOne({
      email,
      kind: 'abandoned_checkout',
      convertedToClient: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    if (existingLead) {
      existingLead.name = name;
      existingLead.phone = phone || existingLead.phone;
      existingLead.country = country || existingLead.country;
      existingLead.packageType = packageType || existingLead.packageType;
      existingLead.numberOfApplicants = numberOfApplicants;
      if (amount) existingLead.amount = amount;
      await existingLead.save();
      return res.json({ success: true, leadId: existingLead._id, updated: true });
    }

    const lead = await Lead.create({
      kind: 'abandoned_checkout',
      name,
      email,
      phone,
      country,
      packageType,
      numberOfApplicants,
      amount,
      status: 'new',
      message: `Started checkout for ${country || 'Visa'} (${packageType || 'standard'}) for ${numberOfApplicants} applicant(s).`,
    });

    res.status(201).json({ success: true, leadId: lead._id, created: true });
  } catch (err) {
    console.error('captureAbandonedCheckout error:', err.message);
    res.status(500).json({ success: false, message: 'Could not capture lead.' });
  }
};

