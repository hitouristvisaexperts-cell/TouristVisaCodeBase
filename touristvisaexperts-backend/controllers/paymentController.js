const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const ConsentLog = require('../models/ConsentLog');
const Lead = require('../models/Lead');
const sendEmail = require('../utils/sendEmail');
const { ROLES, CLIENT_STATUSES } = require('../utils/constants');
const getAutoAssignTarget = require('../utils/autoAssign');
const {
  getPrices, visaPerPerson, isReapplicationCountry, findCoupon, applyCoupon, clampApplicants,
} = require('../utils/pricing');
const {
  razorpayClient, isValidSignature, fetchOrder, orderKind, claimPayment, finishPayment, releasePayment, escapeHtml, rupees,
} = require('../utils/razorpayHelper');

// In-memory store for one-time exchange codes: code → { userId, expiresAt }
const exchangeCodes = new Map();

const PACKAGES = {
  essential: { name: 'Essential' },
  complete:  { name: 'Complete' },
};

// Card payments in foreign currencies (Stripe) were retired when all pricing moved to ₹.
// They stay switched off unless STRIPE_ENABLED=true is set explicitly.
const stripeEnabled = () => process.env.STRIPE_ENABLED === 'true';
const stripeDisabled = (res) => res.status(410).json({ success: false, message: 'Card payments in other currencies are no longer offered. Please pay in ₹ via Razorpay.' });

// Generate a strong readable temp password
function generateTempPassword() {
  const words = ['Visa', 'Travel', 'Expert', 'Tour', 'Apply', 'Smart'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = crypto.randomInt(1000, 10000);
  const sym = ['@', '#', '!'][crypto.randomInt(0, 3)];
  return `${word}${num}${sym}`;
}

/**
 * Works out the server-side price for a visa purchase. Shared by create-order and
 * validate-coupon so the coupon preview always matches what Razorpay will charge.
 */
async function quoteVisa({ destinationCountry, previouslyRejected, rejectionTier, numberOfApplicants, coupon }) {
  const dest = String(destinationCountry || '').trim();
  const rejected = previouslyRejected === true || previouslyRejected === 'true' || previouslyRejected === 'yes';
  if (rejected && !isReapplicationCountry(dest)) {
    return { error: `Re-application support is not available for ${dest || 'this destination'}.` };
  }
  // Re-application plans: 'guarantee' (service-fee refund protection) or the Specialist plan
  const plan = rejected ? (rejectionTier === 'guarantee' ? 'guarantee' : 'specialist') : '';
  const prices = await getPrices();
  const applicants = clampApplicants(numberOfApplicants);
  const perPersonPaise = visaPerPerson(prices, { destinationCountry: dest, previouslyRejected: rejected, plan }) * 100;
  let couponData = null;
  if (coupon && String(coupon).trim()) {
    couponData = await findCoupon(coupon, 'visa');
    if (!couponData) return { error: 'Invalid or expired coupon code.' };
  }
  return {
    dest, rejected, plan, applicants, perPersonPaise,
    fullPaise: perPersonPaise * applicants,
    finalPaise: applyCoupon(couponData, perPersonPaise, applicants),
    couponData,
  };
}

exports.createOrder = async (req, res) => {
  try {
    const { package: pkg, coupon, previouslyRejected, rejectionTier, numberOfApplicants, destinationCountry } = req.body;
    const selected = PACKAGES[pkg];
    if (!selected) return res.status(400).json({ success: false, message: 'Invalid package selected.' });

    const q = await quoteVisa({ destinationCountry, previouslyRejected, rejectionTier, numberOfApplicants, coupon });
    if (q.error) return res.status(400).json({ success: false, message: q.error });

    const order = await razorpayClient().orders.create({
      amount: q.finalPaise,
      currency: 'INR',
      receipt: `fv_${Date.now()}`,
      // Notes are read back at verify time — they, not the browser, decide what the customer gets.
      notes: {
        kind: 'visa', package: pkg, packageName: selected.name,
        destinationCountry: q.dest, applicants: String(q.applicants),
        previouslyRejected: q.rejected ? 'yes' : 'no', plan: q.plan, coupon: q.couponData?.code || '',
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        couponApplied: !!q.couponData,
        originalAmount: q.fullPaise,
        perPersonAmount: q.perPersonPaise,
        applicants: q.applicants,
        previouslyRejected: q.rejected,
      },
    });
  } catch (err) {
    const errorDetail = err?.error?.description || err?.error?.message || err?.message || 'Payment initiation failed.';
    console.error('Create order error:', JSON.stringify(err?.error || err?.message || err));

    if (err?.statusCode === 401 || err?.error?.code === 'BAD_REQUEST_ERROR' && err?.error?.description?.includes('Authentication failed')) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay authentication failed. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
      });
    }

    res.status(500).json({ success: false, message: errorDetail });
  }
};

const sanitizeMembers = (list) => (Array.isArray(list)
  ? list.filter(m => m?.name?.trim()).slice(0, 19).map(m => ({
      name: String(m.name).trim().slice(0, 100),
      relation: String(m.relation || '').slice(0, 50),
      dateOfBirth: String(m.dateOfBirth || '').slice(0, 20),
      passportNumber: String(m.passportNumber || '').slice(0, 30),
    }))
  : []);

// ─── Verify Payment + Provision Account ──────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
  }

  // What was actually paid for comes from the Razorpay order our server created.
  const order = await fetchOrder(razorpay_order_id);
  if (order && orderKind(order) !== 'visa') {
    return res.status(400).json({ success: false, message: 'This payment is not for a visa package. Please contact support.' });
  }
  const notes = order?.notes || {};
  const destinationCountry = notes.destinationCountry || String(req.body.destinationCountry || '').trim();
  const applicantCount = clampApplicants(notes.applicants || req.body.numberOfApplicants);
  const previouslyRejected = notes.previouslyRejected ? notes.previouslyRejected === 'yes' : !!req.body.previouslyRejected;
  const plan = previouslyRejected ? (notes.plan || (req.body.rejectionTier === 'guarantee' ? 'guarantee' : 'specialist')) : '';
  const amountPaid = order?.amount;
  const visaType = req.body.visaType && String(req.body.visaType).includes(destinationCountry) ? String(req.body.visaType) : `${destinationCountry} Visa`;
  const { name, email, phone, familyMembers, dataProtectionConsent, termsRefundConsent } = req.body;

  if (!email || !name) return res.status(400).json({ success: false, message: 'Name and email are required.' });

  const claim = await claimPayment({ paymentId: razorpay_payment_id, orderId: razorpay_order_id, kind: 'visa', amount: amountPaid });
  if (!claim.claimed) {
    return res.json({ success: true, alreadyProcessed: true, isNewUser: false, message: 'This payment is already confirmed. Please log in to your portal.' });
  }

  try {
    const remarks = [
      previouslyRejected ? `⚠️ Previously rejected — ${plan === 'guarantee' ? 'GUARANTEE Re-application (100% service-fee refund on eligible refusals, within 7 working days)' : 'Specialist Re-application'}. Cashback ₹5,000 per person only if the visa is approved and the cashback steps are completed (T&C apply).` : '',
      !order ? '⚠️ Order details could not be confirmed with Razorpay at purchase time — please check the payment in the Razorpay dashboard.' : '',
      notes.coupon ? `Coupon used: ${notes.coupon}` : '',
    ].filter(Boolean).join('\n');

    const selectedPkg = PACKAGES[notes.package] || PACKAGES.complete;
    const portalUrl   = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
    const members = sanitizeMembers(familyMembers).slice(0, applicantCount - 1);
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    let tempPassword = null;
    let user = existing;
    if (!existing) {
      tempPassword = generateTempPassword();
      user = await User.create({
        name: String(name).trim(), email: normalizedEmail, phone: phone ? String(phone).trim() : undefined,
        password: tempPassword, role: ROLES.CLIENT, isFirstLogin: true,
      });
    }

    const assignedTeamMemberId = await getAutoAssignTarget();
    const paidAmountRupees = amountPaid ? Math.round(amountPaid / 100) : (order?.amount ? Math.round(order.amount / 100) : 0);
    const couponCode = notes.coupon || '';

    const client = await Client.create({
      user:               user._id,
      visaType,
      destinationCountry,
      clientStatus:       CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
      packageType:        previouslyRejected ? (plan === 'guarantee' ? 'Guarantee Re-application' : 'Specialist Re-application') : selectedPkg.name,
      paymentId:          razorpay_payment_id,
      orderId:            razorpay_order_id,
      isPurchased:        true,
      paidAmount:         paidAmountRupees,
      couponUsed:         couponCode,
      assignedTo:         assignedTeamMemberId,
      numberOfApplicants: applicantCount,
      ...(remarks && { remarks }),
      ...(members.length && { familyMembers: members }),
    });
    claim.record.user = user._id;
    await finishPayment(claim.record, client._id);

    // Convert any open abandoned checkout leads for this customer
    Lead.updateMany(
      { email: normalizedEmail, kind: 'abandoned_checkout', convertedToClient: false },
      { status: 'closed', convertedToClient: true, convertedAt: new Date(), adminNote: `Converted on checkout (payment: ${razorpay_payment_id})` }
    ).catch(() => {});

    ConsentLog.create({
      user: user._id, name, email: normalizedEmail, phone, source: 'checkout',
      consents: { dataProtection: !!dataProtectionConsent, termsRefund: !!termsRefundConsent },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    }).catch(err => console.error('Consent log error:', err.message));

    // Emails never block the purchase: a mail-server hiccup must not look like a failed payment.
    if (existing) {
      sendEmail({
        to: existing.email,
        subject: '✅ Payment Confirmed — Full Access Activated',
        html: paymentConfirmEmailHtml({ name: existing.name, email: existing.email, package: selectedPkg.name, visaType, destinationCountry, paymentId: razorpay_payment_id, portalUrl }),
      }).catch(err => console.error('Payment confirmation email failed:', err.message));
    } else {
      sendEmail({
        to: user.email,
        subject: '🎉 Welcome! Your Tourist Visa Experts Portal Access',
        html: welcomeEmailHtml({ name: user.name, email: user.email, password: tempPassword, package: selectedPkg.name, visaType, destinationCountry, portalUrl }),
      }).catch(err => console.error('Welcome email failed:', err.message));
    }

    if (assignedTeamMemberId) {
      const teamMember = await User.findById(assignedTeamMemberId).select('name email');
      if (teamMember) notifyTeamMember({ teamMember, client: user, visaType, destinationCountry, portalUrl }).catch(() => {});
    }
    notifyAdmin({ user, selectedPkg, visaType, destinationCountry, razorpay_payment_id, amountPaid, applicants: applicantCount, previouslyRejected, coupon: notes.coupon }).catch(() => {});

    if (existing) {
      const exchangeCode = crypto.randomBytes(32).toString('hex');
      exchangeCodes.set(exchangeCode, { userId: existing._id.toString(), expiresAt: Date.now() + 5 * 60 * 1000 });
      return res.json({ success: true, isNewUser: false, exchangeCode, message: 'Payment confirmed! Redirecting to your portal…' });
    }
    res.json({ success: true, isNewUser: true, message: 'Payment verified! Check your email for login credentials.' });
  } catch (err) {
    console.error('Verify payment error:', err.message);
    await releasePayment(claim.record);
    res.status(500).json({ success: false, message: 'Account setup failed. Please contact support with your payment ID.' });
  }
};

// ─── Stripe Visa: Create PaymentIntent ───────────────────────────────────────
const COUNTRY_STRIPE_CURRENCY = {
  'UK': 'gbp', 'United Kingdom': 'gbp',
  'USA': 'usd', 'United States': 'usd',
  'UAE': 'aed', 'Canada': 'cad', 'Australia': 'aud', 'Singapore': 'sgd',
  'Qatar': 'qar', 'Saudi Arabia': 'sar', 'Kuwait': 'kwd',
  'Oman': 'omr', 'Bahrain': 'bhd',
  'Germany': 'eur', 'France': 'eur', 'Netherlands': 'eur', 'Italy': 'eur', 'Spain': 'eur',
  'New Zealand': 'nzd', 'Japan': 'jpy', 'South Africa': 'zar', 'Malaysia': 'myr',
};

// Visa prices per tier — display units (e.g. 100 = £100)
const STRIPE_VISA_PRICES = {
  gbp: { firstTime:  100, standard:  150, guarantee:  250, usaFirstTime: 125, zeroDecimal: false },
  usd: { firstTime:  125, standard:  188, guarantee:  313, usaFirstTime: 150, zeroDecimal: false },
  eur: { firstTime:  100, standard:  150, guarantee:  250, zeroDecimal: false },
  aed: { firstTime:  440, standard:  660, guarantee: 1100, zeroDecimal: false },
  cad: { firstTime:  160, standard:  240, guarantee:  400, zeroDecimal: false },
  aud: { firstTime:  185, standard:  275, guarantee:  460, zeroDecimal: false },
  sgd: { firstTime:  160, standard:  240, guarantee:  400, zeroDecimal: false },
  qar: { firstTime:  440, standard:  660, guarantee: 1100, zeroDecimal: false },
  sar: { firstTime:  450, standard:  675, guarantee: 1125, zeroDecimal: false },
  kwd: { firstTime:   37, standard:   55, guarantee:   92, zeroDecimal: false },
  omr: { firstTime:   46, standard:   69, guarantee:  115, zeroDecimal: false },
  bhd: { firstTime:   45, standard:   68, guarantee:  113, zeroDecimal: false },
  nzd: { firstTime:  200, standard:  300, guarantee:  500, zeroDecimal: false },
  jpy: { firstTime: 1800, standard: 2700, guarantee: 4500, zeroDecimal: true  },
  zar: { firstTime: 2250, standard: 3375, guarantee: 5625, zeroDecimal: false },
  myr: { firstTime:  560, standard:  840, guarantee: 1400, zeroDecimal: false },
};

const getStripe = () => require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createStripeVisaOrder = async (req, res) => {
  if (!stripeEnabled()) return stripeDisabled(res);
  try {
    const { fromCountry, previouslyRejected, rejectionTier, numberOfApplicants, coupon,
            name, email, phone, visaType, destinationCountry, schengenPreferences,
            dataProtectionConsent, termsRefundConsent, consentTimestamp } = req.body;

    const couponData = coupon ? await findCoupon(coupon) : null;
    if (coupon && String(coupon).trim() && !couponData) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
    }

    const currency = COUNTRY_STRIPE_CURRENCY[fromCountry] || 'usd';
    const prices = STRIPE_VISA_PRICES[currency] || STRIPE_VISA_PRICES.usd;
    const tier = !previouslyRejected ? 'firstTime' : rejectionTier === 'guarantee' ? 'guarantee' : 'standard';
    const applicants = Math.max(1, Math.min(20, parseInt(numberOfApplicants) || 1));
    // USA destination has higher price for GBP/USD users
    const isUsaDest = destinationCountry === 'USA';
    const unitPrice = (tier === 'firstTime' && isUsaDest && prices.usaFirstTime) ? prices.usaFirstTime : prices[tier];
    const stripeUnitAmount = prices.zeroDecimal ? unitPrice : unitPrice * 100;
    // A coupon discounts only the first applicant to a nominal charge — every
    // additional applicant is still billed at the normal per-person rate.
    // Computed server-side in Stripe's own currency/unit, so the amount
    // Stripe actually charges always matches what the coupon promised.
    const finalTotal = applyCoupon(couponData, stripeUnitAmount, applicants);
    // Stripe line items need a single unit price × quantity, so the coupon
    // total (which isn't a clean multiple of the per-person price) has to go
    // through as a single line item rather than `quantity: applicants`.
    const lineItemQty = 1;
    const lineItemUnitAmount = couponData ? finalTotal : stripeUnitAmount * applicants;

    const SITE_URL = process.env.SITE_URL || 'https://touristvisaexperts.com';

    // Return URLs must use the slug form (/checkout/{dest}touristvisa):
    // the SPA rebuilds checkout state from that URL on a fresh page load, while
    // a bare /checkout with no in-memory state redirects to the homepage.
    const destSlug = String(destinationCountry || 'Visa').replace(/\s+/g, '');
    const checkoutPath = `/checkout/${destSlug}touristvisa`;

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      currency,
      customer_email: email || undefined,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: `${destinationCountry || 'Visa'} Tourist Visa Assistance`,
            description: `${tier === 'firstTime' ? 'Complete Package' : tier === 'guarantee' ? 'Specialist + 100% Refund Guarantee' : 'Specialist Re-application'} — ${applicants} applicant${applicants > 1 ? 's' : ''}`,
          },
          unit_amount: lineItemUnitAmount,
        },
        quantity: lineItemQty,
      }],
      locale: 'auto',
      metadata: {
        type: 'visa_assistance', tier, applicants: String(applicants),
        fromCountry: fromCountry || '', destinationCountry: destinationCountry || '',
        name: name || '', email: email || '', phone: phone || '',
        previouslyRejected: String(!!previouslyRejected), rejectionTier: rejectionTier || '',
        schengenPreferences: schengenPreferences ? JSON.stringify(schengenPreferences) : '',
        dataProtectionConsent: String(!!dataProtectionConsent),
        termsRefundConsent: String(!!termsRefundConsent),
        consentTimestamp: consentTimestamp || '',
        coupon: couponData ? coupon.trim() : '',
      },
      success_url: `${SITE_URL}${checkoutPath}?stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}${checkoutPath}`,
    });

    res.json({
      success: true,
      data: { sessionUrl: session.url, sessionId: session.id },
    });
  } catch (err) {
    console.error('createStripeVisaOrder error:', err.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed. Please try again.' });
  }
};

// ─── Validate coupon server-side (codes live in the database, never in the website bundle) ──
// Uses exactly the same quote as create-order, so the price shown after "Apply" is the price charged.
exports.validateCoupon = async (req, res) => {
  try {
    const { coupon, previouslyRejected, rejectionTier, numberOfApplicants, destinationCountry } = req.body;
    const q = await quoteVisa({ destinationCountry, previouslyRejected, rejectionTier, numberOfApplicants, coupon });
    if (q.error) return res.status(400).json({ success: false, message: q.error });
    if (!q.couponData) return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
    res.json({ success: true, currency: 'inr', zeroDecimal: false, finalAmount: q.finalPaise, originalAmount: q.fullPaise, code: q.couponData.code });
  } catch (err) {
    console.error('Validate coupon error:', err.message);
    res.status(500).json({ success: false, message: 'Could not check the coupon. Please try again.' });
  }
};

// ─── Stripe Visa: Verify Checkout Session + Provision Account ────────────────
exports.verifyStripeVisaPayment = async (req, res) => {
  if (!stripeEnabled()) return stripeDisabled(res);
  try {
    const { sessionId } = req.body;

    // 1. Retrieve Checkout Session from Stripe
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed. Please contact support.' });
    }

    // Extract data from session metadata (stored when creating the session)
    const meta = session.metadata || {};
    const name = meta.name || '';
    const email = meta.email || session.customer_email || '';
    const phone = meta.phone || '';
    const visaType = 'Tourist Visa';
    const destinationCountry = meta.destinationCountry || '';
    const previouslyRejected = meta.previouslyRejected === 'true';
    const rejectionTier = meta.rejectionTier || null;
    const paymentIntentId = session.payment_intent;
    const schengenPreferences = meta.schengenPreferences ? JSON.parse(meta.schengenPreferences) : [];
    const familyMembers = [];
    const dataProtectionConsent = meta.dataProtectionConsent === 'true';
    const termsRefundConsent = meta.termsRefundConsent === 'true';

    const applicantCount = Math.max(1, parseInt(meta.applicants) || 1);
    const rejectionNote = previouslyRejected
      ? (rejectionTier === 'guarantee'
          ? '⚠️ Previously rejected — Guarantee tier (Stripe): 100% refund if rejected + cashback on completing testimonial/review steps.'
          : '⚠️ Previously rejected — Standard specialist tier (Stripe): cashback on completing testimonial/review steps.')
      : '';

    const selectedPkg = PACKAGES.complete;
    const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
    const sanitizeMembers = (list) =>
      Array.isArray(list)
        ? list.filter(m => m?.name?.trim()).map(m => ({
            name: m.name.trim(), relation: m.relation || '',
            dateOfBirth: m.dateOfBirth || '', passportNumber: m.passportNumber || '',
          }))
        : [];

    // 2. Existing user path — always create a NEW case, never overwrite an earlier one
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const assignedTeamMemberId = await getAutoAssignTarget();

      await Client.create({
        user: existing._id, visaType: visaType || '', destinationCountry: destinationCountry || '',
        clientStatus: CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
        packageType: selectedPkg.name, paymentId: paymentIntentId, orderId: paymentIntentId,
        isPurchased: true, assignedTo: assignedTeamMemberId, numberOfApplicants: applicantCount,
        ...(rejectionNote && { remarks: rejectionNote }),
        ...(sanitizeMembers(familyMembers).length && { familyMembers: sanitizeMembers(familyMembers) }),
      });

      const exchangeCode = crypto.randomBytes(32).toString('hex');
      exchangeCodes.set(exchangeCode, { userId: existing._id.toString(), expiresAt: Date.now() + 5 * 60 * 1000 });

      await ConsentLog.create({
        user: existing._id, name, email, phone, source: 'checkout',
        consents: { dataProtection: dataProtectionConsent, termsRefund: termsRefundConsent },
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
      }).catch(err => console.error('Consent log error:', err.message));

      // Payment confirmation only — this user already has login access, no new credentials.
      await sendEmail({
        to: existing.email,
        subject: '✅ Payment Confirmed — Full Access Activated',
        html: paymentConfirmEmailHtml({ name: existing.name, email: existing.email, package: selectedPkg.name, visaType, destinationCountry, paymentId: paymentIntentId, portalUrl }),
      }).catch(() => {});

      if (assignedTeamMemberId) {
        const teamMember = await User.findById(assignedTeamMemberId).select('name email');
        if (teamMember) {
          await notifyTeamMember({ teamMember, client: existing, visaType, destinationCountry, portalUrl }).catch(() => {});
        }
      }

      await notifyAdmin({ user: existing, selectedPkg, visaType, destinationCountry, razorpay_payment_id: paymentIntentId }).catch(() => {});

      return res.json({ success: true, isNewUser: false, exchangeCode, message: 'Payment confirmed! Redirecting to your portal…' });
    }

    // 3. New user path
    const tempPassword = generateTempPassword();
    const user = await User.create({
      name: name.trim(), email: email.toLowerCase().trim(),
      phone: phone?.trim(), password: tempPassword,
      role: ROLES.CLIENT, isFirstLogin: true,
    });

    const assignedTeamMemberId = await getAutoAssignTarget();
    await Client.create({
      user: user._id, visaType: visaType || '', destinationCountry: destinationCountry || '',
      clientStatus: CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
      packageType: selectedPkg.name, paymentId: paymentIntentId, orderId: paymentIntentId,
      isPurchased: true, assignedTo: assignedTeamMemberId, numberOfApplicants: applicantCount,
      ...(rejectionNote && { remarks: rejectionNote }),
      ...(sanitizeMembers(familyMembers).length && { familyMembers: sanitizeMembers(familyMembers) }),
    });

    await ConsentLog.create({
      user: user._id, name, email, phone, source: 'checkout',
      consents: { dataProtection: dataProtectionConsent, termsRefund: termsRefundConsent },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    }).catch(err => console.error('Consent log error:', err.message));

    await sendEmail({
      to: user.email,
      subject: '🎉 Welcome! Your Tourist Visa Experts Portal Access',
      html: welcomeEmailHtml({ name: user.name, email: user.email, password: tempPassword, package: selectedPkg.name, visaType, destinationCountry, portalUrl }),
    });

    if (assignedTeamMemberId) {
      const teamMember = await User.findById(assignedTeamMemberId).select('name email');
      if (teamMember) await notifyTeamMember({ teamMember, client: user, visaType, destinationCountry, portalUrl }).catch(() => {});
    }
    await notifyAdmin({ user, selectedPkg, visaType, destinationCountry, razorpay_payment_id: paymentIntentId }).catch(() => {});

    res.json({ success: true, isNewUser: true, message: 'Payment verified! Check your email for login credentials.' });
  } catch (err) {
    console.error('verifyStripeVisaPayment error:', err.message);
    res.status(500).json({ success: false, message: 'Account setup failed. Please contact support with your payment ID.' });
  }
};

// ─── Exchange one-time code for a session JWT ─────────────────────────────────
exports.exchangeToken = async (req, res) => {
  try {
    const { code } = req.body;
    const entry = exchangeCodes.get(code);

    if (!entry || Date.now() > entry.expiresAt) {
      exchangeCodes.delete(code);
      return res.status(400).json({ success: false, message: 'Exchange code is invalid or has expired.' });
    }

    exchangeCodes.delete(code); // one-time use

    const token = jwt.sign({ id: entry.userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Team member notification helper ─────────────────────────────────────────
async function notifyTeamMember({ teamMember, client, visaType, destinationCountry, portalUrl }) {
  const notify = require('../utils/notifyHelper');

  // In-app notification (shows in portal bell)
  await notify({
    recipient: teamMember._id,
    title: `New client assigned: ${client.name}`,
    message: `${client.name} (${client.email}) just paid and needs a welcome consultation. ${visaType ? `Visa: ${visaType}${destinationCountry ? ' → ' + destinationCountry : ''}` : ''}`,
    type: 'general',
  });

  // Email to team member
  await sendEmail({
    to: teamMember.email,
    subject: `New Client Assigned — ${client.name} needs a welcome call`,
    html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#071f16,#0a2e1e);border-radius:10px;padding:20px 24px;margin-bottom:20px;text-align:center;">
    <div style="color:#10b981;font-size:18px;font-weight:700;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">New Client Assignment</div>
  </div>
  <div style="background:#fff;border-radius:14px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size:28px;margin-bottom:12px;">👤</div>
    <h2 style="color:#0A1628;font-size:20px;font-weight:800;margin:0 0 6px;">Hi ${teamMember.name},</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 20px;">
      A new client has just completed payment and has been assigned to you. Please reach out for a welcome consultation.
    </p>
    <div style="background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:5px 0;width:120px;">Name</td><td style="font-weight:700;color:#0f172a;">${client.name}</td></tr>
        <tr><td style="color:#94a3b8;padding:5px 0;">Email</td><td style="font-weight:700;color:#0f172a;">${client.email}</td></tr>
        ${client.phone ? `<tr><td style="color:#94a3b8;padding:5px 0;">Phone</td><td style="font-weight:700;color:#0f172a;">${client.phone}</td></tr>` : ''}
        ${visaType ? `<tr><td style="color:#94a3b8;padding:5px 0;">Visa</td><td style="font-weight:700;color:#0f172a;">${visaType}${destinationCountry ? ' → ' + destinationCountry : ''}</td></tr>` : ''}
        <tr><td style="color:#94a3b8;padding:5px 0;">Status</td><td style="font-weight:700;color:#F97316;">Welcome Consultation Pending</td></tr>
      </table>
    </div>
    <a href="${portalUrl}/team/clients" style="display:block;text-align:center;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
      Open Portal to View Client →
    </a>
  </div>
  <div style="text-align:center;margin-top:20px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
</div>`,
  });
}

// ─── Admin notification helper ────────────────────────────────────────────────
async function notifyAdmin({ user, selectedPkg, visaType, destinationCountry, razorpay_payment_id, amountPaid, applicants, previouslyRejected, coupon }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const adminWA    = process.env.ADMIN_WHATSAPP || '';
  if (!adminEmail) return;
  const e = escapeHtml;
  const waLink = adminWA && user.phone
    ? `https://wa.me/${adminWA}?text=New+client+${encodeURIComponent(user.name)}+%28${encodeURIComponent(user.email)}%29+has+paid.`
    : '';
  const row = (label, value, style = 'font-weight:700;color:#0f172a;') => `<tr><td style="padding:8px 0;color:#94a3b8;width:140px;">${label}</td><td style="${style}">${value}</td></tr>`;
  await sendEmail({
    to:      adminEmail,
    subject: `New Client Payment — ${user.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#0A1628;margin-bottom:8px;">New Client Payment</h2>
        <p style="color:#64748b;font-size:14px;margin-bottom:20px;">A client has completed payment.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${row('Name', e(user.name))}
          ${row('Email', e(user.email))}
          ${row('Phone', e(user.phone || '—'))}
          ${row('Destination', e(destinationCountry || '—'))}
          ${row('Visa Type', e(visaType || '—'))}
          ${row('Package', e(previouslyRejected ? 'Re-application (visa rejected before)' : selectedPkg.name))}
          ${row('Applicants', e(applicants || 1))}
          ${row('Amount paid', amountPaid ? rupees(amountPaid) : '— (check Razorpay)', 'font-weight:700;color:#F97316;')}
          ${coupon ? row('Coupon', e(coupon)) : ''}
          ${row('Payment ID', e(razorpay_payment_id), 'font-family:monospace;color:#0f172a;')}
        </table>
        ${waLink ? `<a href="${waLink}" style="display:inline-block;margin-top:20px;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Open WhatsApp Chat</a>` : ''}
        <p style="margin-top:20px;font-size:12px;color:#94a3b8;">Login to admin portal to assign a team member.</p>
      </div>`,
  });
}

// ─── Payment Confirmation Email (existing user) ───────────────────────────────
function paymentConfirmEmailHtml({ name, email, package: pkg, visaType, destinationCountry, paymentId, portalUrl }) {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:40px 0;text-align:center;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px;">Payment Confirmed</div>
  </div>
  <div style="max-width:560px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:20px;padding:36px 32px;margin-top:-24px;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
      <span style="font-size:40px;">✅</span>
      <h1 style="color:#0A1628;font-size:22px;font-weight:800;margin:12px 0 8px;">Payment Successful, ${name}!</h1>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 24px;">Your full portal access has been activated. You can now access all features of your visa dashboard.</p>
      <div style="background:#f8f7f4;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:5px 0;width:130px;">Email</td><td style="font-weight:600;color:#0f172a;">${email}</td></tr>
          <tr><td style="color:#94a3b8;padding:5px 0;">Package</td><td style="font-weight:700;color:#F97316;">${pkg}</td></tr>
          ${visaType ? `<tr><td style="color:#94a3b8;padding:5px 0;">Visa Type</td><td style="font-weight:600;color:#0f172a;">${visaType}${destinationCountry ? ' → ' + destinationCountry : ''}</td></tr>` : ''}
          <tr><td style="color:#94a3b8;padding:5px 0;">Payment ID</td><td style="font-family:monospace;font-size:12px;color:#475569;">${paymentId}</td></tr>
        </table>
      </div>
      <a href="${portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-radius:12px;padding:16px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">
        Go to My Portal →
      </a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
  </div>
</body></html>`.trim();
}

// ─── Welcome Email Template (new user) ───────────────────────────────────────
function welcomeEmailHtml({ name, email, password, package: pkg, visaType, destinationCountry, portalUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Tourist Visa Experts</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0A1628 0%,#0d1e3a 100%);padding:40px 0;text-align:center;">
    <div style="display:inline-block;background:linear-gradient(135deg,#F97316,#f85c00);border-radius:12px;padding:10px 20px;margin-bottom:16px;">
      <span style="color:#fff;font-weight:800;font-size:18px;letter-spacing:-0.03em;">TVE</span>
    </div>
    <div style="color:#fff;font-size:22px;font-weight:700;margin-top:8px;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px;">Your Visa Portal Access</div>
  </div>

  <!-- Body -->
  <div style="max-width:560px;margin:0 auto;padding:0 16px 40px;">

    <!-- Welcome card -->
    <div style="background:#fff;border-radius:20px;padding:36px 32px;margin-top:-24px;box-shadow:0 8px 40px rgba(0,0,0,0.08);border:1px solid rgba(249,115,22,0.1);">

      <!-- Checkmark -->
      <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#fff7ed,#fed7aa);border:1.5px solid rgba(249,115,22,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">🎉</span>
      </div>

      <h1 style="color:#0A1628;font-size:24px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;">
        Welcome aboard, ${name}!
      </h1>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Your payment was successful and your account has been created. Below are your login credentials to access your personal visa portal.
      </p>

      <!-- Package badge -->
      <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1.5px solid rgba(249,115,22,0.25);border-radius:12px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Purchased Package</div>
        <div style="font-size:18px;font-weight:800;color:#F97316;">${pkg} Plan</div>
        ${visaType ? `<div style="font-size:13px;color:#78716c;margin-top:4px;">${visaType}${destinationCountry ? ' → ' + destinationCountry : ''}</div>` : ''}
      </div>

      <!-- Credentials box -->
      <div style="background:#f8f7f4;border-radius:14px;padding:20px 22px;margin-bottom:28px;border:1.5px solid #e2e8f0;">
        <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">Your Login Credentials</div>

        <div style="margin-bottom:12px;">
          <div style="font-size:11.5px;color:#94a3b8;font-weight:600;margin-bottom:3px;">Email Address</div>
          <div style="font-size:15px;font-weight:700;color:#0A1628;font-family:monospace;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;">${email}</div>
        </div>

        <div>
          <div style="font-size:11.5px;color:#94a3b8;font-weight:600;margin-bottom:3px;">Temporary Password</div>
          <div style="font-size:18px;font-weight:800;color:#F97316;font-family:monospace;background:#fff;border:1.5px solid rgba(249,115,22,0.3);border-radius:8px;padding:10px 14px;letter-spacing:0.05em;">${password}</div>
        </div>
      </div>

      <!-- CTA Button -->
      <a href="${portalUrl}/login" style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#f85c00);color:#fff;text-decoration:none;font-size:16px;font-weight:700;border-radius:12px;padding:16px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">
        Access Your Portal →
      </a>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-top:16px;display:flex;gap:10px;align-items:flex-start;">
        <span style="font-size:16px;flex-shrink:0;">⚠️</span>
        <div>
          <div style="font-size:12.5px;font-weight:700;color:#92400e;margin-bottom:3px;">Change your password after first login</div>
          <div style="font-size:12px;color:#a16207;line-height:1.5;">For security, you will be prompted to set a new password when you first sign in. Keep your credentials safe and do not share them.</div>
        </div>
      </div>
    </div>

    <!-- What's next -->
    <div style="background:#fff;border-radius:16px;padding:24px 28px;margin-top:16px;border:1px solid #f1f5f9;">
      <div style="font-size:14px;font-weight:700;color:#0A1628;margin-bottom:16px;">What happens next?</div>
      ${[
        ['🔐', 'Log in to your portal', 'Use the credentials above to access your personal dashboard.'],
        ['📋', 'Document checklist', 'We\'ll guide you on exactly which documents to upload.'],
        ['✅', 'Application prepared', 'Your complete visa application will be prepared and reviewed.'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#fff7ed;border:1px solid rgba(249,115,22,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;">${icon}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#0A1628;">${title}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">${desc}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;color:#94a3b8;font-size:12px;line-height:1.7;">
      <div>Questions? Reply to this email or WhatsApp us.</div>
      <div style="margin-top:8px;">
        &copy; ${new Date().getFullYear()} Tourist Visa Experts &nbsp;·&nbsp;
        <a href="${portalUrl}" style="color:#F97316;text-decoration:none;">Visit Portal</a>
      </div>
    </div>
  </div>

</body>
</html>
  `.trim();
}

// ─── Razorpay Server-to-Server Webhook ─────────────────────────────────────────
exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set, ignoring webhook.');
    return res.status(200).json({ status: 'ignored_no_secret' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing signature' });
  }

  try {
    const raw = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto.createHmac('sha256', secret).update(raw).digest('hex');

    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] Invalid Razorpay webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;
    const eventName = event.event;

    // Process payment.captured or order.paid
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) return res.json({ status: 'ok' });

      const razorpay_payment_id = paymentEntity.id;
      const razorpay_order_id = paymentEntity.order_id;
      const amountPaid = paymentEntity.amount;
      const notes = paymentEntity.notes || {};
      const email = paymentEntity.email || notes.email;
      const contact = paymentEntity.contact || notes.phone;
      const name = notes.name || (email ? email.split('@')[0] : 'Client');

      const claim = await claimPayment({
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        kind: notes.kind || 'visa',
        amount: amountPaid,
      });

      if (!claim.claimed) {
        // Already processed by browser verifyPayment or previous webhook delivery
        return res.json({ status: 'already_processed' });
      }

      try {
        const destinationCountry = notes.destinationCountry || '';
        const applicantCount = clampApplicants(notes.applicants || 1);
        const previouslyRejected = notes.previouslyRejected === 'yes';
        const plan = previouslyRejected ? (notes.plan || 'specialist') : '';
        const visaType = `${destinationCountry} Visa`;
        const selectedPkg = PACKAGES[notes.package] || PACKAGES.complete;
        const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
        const normalizedEmail = String(email || '').toLowerCase().trim();

        if (normalizedEmail) {
          const existing = await User.findOne({ email: normalizedEmail });
          let tempPassword = null;
          let user = existing;
          if (!existing) {
            tempPassword = generateTempPassword();
            user = await User.create({
              name: String(name).trim(),
              email: normalizedEmail,
              phone: contact ? String(contact).trim() : undefined,
              password: tempPassword,
              role: ROLES.CLIENT,
              isFirstLogin: true,
            });
          }

          const assignedTeamMemberId = await getAutoAssignTarget();
          const paidAmountRupees = amountPaid ? Math.round(amountPaid / 100) : 0;
          const couponCode = notes.coupon || '';

          const client = await Client.create({
            user: user._id,
            visaType,
            destinationCountry,
            clientStatus: CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
            packageType: previouslyRejected
              ? (plan === 'guarantee' ? 'Guarantee Re-application' : 'Specialist Re-application')
              : selectedPkg.name,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            isPurchased: true,
            paidAmount: paidAmountRupees,
            couponUsed: couponCode,
            assignedTo: assignedTeamMemberId,
            numberOfApplicants: applicantCount,
          });

          claim.record.user = user._id;
          await finishPayment(claim.record, client._id);

          // Convert any open abandoned checkout leads for this customer
          Lead.updateMany(
            { email: normalizedEmail, kind: 'abandoned_checkout', convertedToClient: false },
            { status: 'closed', convertedToClient: true, convertedAt: new Date(), adminNote: `Converted via Razorpay webhook (${razorpay_payment_id})` }
          ).catch(() => {});

          ConsentLog.create({
            user: user._id,
            name,
            email: normalizedEmail,
            phone: contact,
            source: 'checkout',
            consents: { dataProtection: true, termsRefund: true },
            ipAddress: 'webhook',
            userAgent: 'Razorpay-Webhook',
          }).catch(() => {});

          // Send confirmation email
          if (existing) {
            sendEmail({
              to: existing.email,
              subject: '✅ Payment Confirmed — Full Access Activated',
              html: paymentConfirmEmailHtml({ name: existing.name, email: existing.email, package: selectedPkg.name, visaType, destinationCountry, paymentId: razorpay_payment_id, portalUrl }),
            }).catch(err => console.error('Webhook email failed:', err.message));
          } else {
            sendEmail({
              to: user.email,
              subject: '🎉 Welcome! Your Tourist Visa Experts Portal Access',
              html: welcomeEmailHtml({ name: user.name, email: user.email, password: tempPassword, package: selectedPkg.name, visaType, destinationCountry, portalUrl }),
            }).catch(err => console.error('Webhook email failed:', err.message));
          }

          if (assignedTeamMemberId) {
            const teamMember = await User.findById(assignedTeamMemberId).select('name email');
            if (teamMember) notifyTeamMember({ teamMember, client: user, visaType, destinationCountry, portalUrl }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[WEBHOOK] Provisioning error:', err.message);
        await releasePayment(claim.record);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[WEBHOOK] Error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

