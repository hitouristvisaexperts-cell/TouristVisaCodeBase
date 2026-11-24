const Stripe = require('stripe');
const FlightReservation = require('../models/FlightReservation');
const sendEmail = require('../utils/sendEmail');

// Lazy init — reads env after dotenv loads, not at require time
const getStripe = () => Stripe(process.env.STRIPE_SECRET_KEY);

// Price per passenger per currency (mirrors frontend COUNTRY_CURRENCY map)
// amount = price in smallest currency unit for standard; raw price for zero-decimal
const PRICES = {
  usd: { amount: 12,    zeroDecimal: false },
  gbp: { amount: 10,    zeroDecimal: false },
  eur: { amount: 11,    zeroDecimal: false },
  aed: { amount: 45,    zeroDecimal: false },
  qar: { amount: 44,    zeroDecimal: false },
  sar: { amount: 45,    zeroDecimal: false },
  kwd: { amount: 4,     zeroDecimal: false },
  omr: { amount: 5,     zeroDecimal: false },
  bhd: { amount: 5,     zeroDecimal: false },
  sgd: { amount: 16,    zeroDecimal: false },
  thb: { amount: 430,   zeroDecimal: false },
  myr: { amount: 57,    zeroDecimal: false },
  php: { amount: 690,   zeroDecimal: false },
  jpy: { amount: 1800,  zeroDecimal: true  },
  krw: { amount: 16000, zeroDecimal: true  },
  hkd: { amount: 95,    zeroDecimal: false },
  twd: { amount: 380,   zeroDecimal: false },
  chf: { amount: 11,    zeroDecimal: false },
  sek: { amount: 128,   zeroDecimal: false },
  nok: { amount: 130,   zeroDecimal: false },
  dkk: { amount: 84,    zeroDecimal: false },
  pln: { amount: 48,    zeroDecimal: false },
  czk: { amount: 280,   zeroDecimal: false },
  ron: { amount: 56,    zeroDecimal: false },
  huf: { amount: 4400,  zeroDecimal: true  },
  try: { amount: 390,   zeroDecimal: false },
  cad: { amount: 16,    zeroDecimal: false },
  mxn: { amount: 200,   zeroDecimal: false },
  aud: { amount: 19,    zeroDecimal: false },
  nzd: { amount: 20,    zeroDecimal: false },
  zar: { amount: 225,   zeroDecimal: false },
  egp: { amount: 590,   zeroDecimal: false },
  brl: { amount: 62,    zeroDecimal: false },
};
const ALLOWED_CURRENCIES = new Set(Object.keys(PRICES));

// ─── Create Stripe PaymentIntent ──────────────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  // Card payments in foreign currencies were retired when all pricing moved to ₹ (Razorpay).
  if (process.env.STRIPE_ENABLED !== 'true') {
    return res.status(410).json({ success: false, message: 'Card payments in other currencies are no longer offered. Please pay in ₹ via Razorpay.' });
  }
  try {
    const count = Math.max(1, Math.min(parseInt(req.body?.passengerCount, 10) || 1, 20));

    // Validate + normalize currency; fall back to USD
    const rawCurrency = (req.body?.currency || 'usd').toLowerCase().trim();
    const currency = ALLOWED_CURRENCIES.has(rawCurrency) ? rawCurrency : 'usd';
    const priceInfo = PRICES[currency];

    // Stripe expects smallest unit; zero-decimal currencies skip ×100
    const stripeAmount = priceInfo.zeroDecimal
      ? priceInfo.amount * count
      : priceInfo.amount * count * 100;

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: stripeAmount,
      currency,
      metadata: { type: 'flight_reservation', passengers: String(count) },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: stripeAmount,
        currency,
        pricePerPassenger: priceInfo.amount,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        passengerCount: count,
      },
    });
  } catch (err) {
    console.error('Stripe createPaymentIntent error:', err.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed. Please try again.' });
  }
};

// ─── Verify payment + save reservation ───────────────────────────────────────
exports.verifyAndSave = async (req, res) => {
  // Card payments in foreign currencies were retired when all pricing moved to ₹ (Razorpay).
  if (process.env.STRIPE_ENABLED !== 'true') {
    return res.status(410).json({ success: false, message: 'Card payments in other currencies are no longer offered. Please pay in ₹ via Razorpay.' });
  }
  try {
    const {
      paymentIntentId,
      from, to, departureDate, returnDate, tripType,
      passengers, contactEmail, contactPhone,
    } = req.body;

    // 1. Retrieve from Stripe to confirm payment succeeded
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed. Please contact support.' });
    }

    // Derive display amount from PI
    const piCurrency = (pi.currency || 'usd').toUpperCase();
    const priceInfo = PRICES[pi.currency?.toLowerCase()] ?? PRICES.usd;
    const displayAmount = priceInfo.zeroDecimal
      ? pi.amount
      : pi.amount / 100;

    // 2. Save reservation
    const paxList = Array.isArray(passengers) ? passengers : [];
    const reservation = await FlightReservation.create({
      from, to, departureDate, returnDate,
      tripType: tripType === 'round-trip' ? 'round-trip' : 'one-way',
      passengers: paxList,
      contactEmail: (contactEmail || paxList?.[0]?.email || '').toLowerCase().trim(),
      contactPhone,
      amount: displayAmount,
      currency: piCurrency,
      paymentProvider: 'stripe',
      paymentId: paymentIntentId,
      orderId: paymentIntentId,
      isPaid: true,
      status: 'paid',
    });

    // 3. Confirmation email to customer
    if (reservation.contactEmail) {
      sendEmail({
        to: reservation.contactEmail,
        subject: '✈️ Flight Reservation Confirmed — Tourist Visa Experts',
        html: stripeConfirmEmail(reservation, piCurrency),
      }).catch(() => {});
    }

    // 4. Admin notification
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Flight Reservation (Stripe/${piCurrency}) — ${reservation.from} → ${reservation.to}`,
        html: stripeAdminEmail(reservation, piCurrency),
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Reservation confirmed! Check your email — your ticket will arrive shortly.',
      data: { id: reservation._id, email: reservation.contactEmail },
    });
  } catch (err) {
    console.error('Stripe verifyAndSave error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save your reservation. Please contact support with your payment ID.' });
  }
};

// ─── Email templates ─────────────────────────────────────────────────────────
function stripeConfirmEmail(r, currency) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#0f1829,#151f36);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
    <div style="color:#F97316;font-size:18px;font-weight:800;">Tourist Visa Experts</div>
    <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">International Flight Reservation Confirmed</div>
  </div>
  <div style="background:#fff;border-radius:14px;padding:26px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size:30px;margin-bottom:10px;">✈️</div>
    <h2 style="color:#0f172a;font-size:19px;margin:0 0 6px;">Your reservation is confirmed!</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 18px;">
      We've received your payment and our team is preparing your embassy-verifiable ticket. It will be delivered to your inbox.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:4px 0;width:120px;">Route</td><td style="font-weight:700;color:#0f172a;">${r.from} → ${r.to}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Departure</td><td style="font-weight:600;color:#0f172a;">${r.departureDate}</td></tr>
        ${r.returnDate ? `<tr><td style="color:#94a3b8;padding:4px 0;">Return</td><td style="font-weight:600;color:#0f172a;">${r.returnDate}</td></tr>` : ''}
        <tr><td style="color:#94a3b8;padding:4px 0;">Passengers</td><td style="font-weight:600;color:#0f172a;">${r.passengers.length}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Amount Paid</td><td style="font-weight:700;color:#F97316;">${r.amount} ${currency}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Payment ID</td><td style="font-family:monospace;font-size:11px;color:#475569;">${r.paymentId}</td></tr>
      </table>
    </div>
  </div>
  <div style="text-align:center;margin-top:18px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
</div>`.trim();
}

function stripeAdminEmail(r, currency) {
  return `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;">
  <h2 style="color:#0f172a;">New International Flight Reservation (Stripe — PAID)</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#94a3b8;width:130px;">Route</td><td style="font-weight:700;">${r.from} → ${r.to}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Trip</td><td>${r.tripType}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Departure</td><td>${r.departureDate}</td></tr>
    ${r.returnDate ? `<tr><td style="padding:6px 0;color:#94a3b8;">Return</td><td>${r.returnDate}</td></tr>` : ''}
    <tr><td style="padding:6px 0;color:#94a3b8;">Passengers</td><td>${r.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Contact</td><td>${r.contactEmail} ${r.contactPhone || ''}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Amount</td><td style="font-weight:700;color:#F97316;">${r.amount} ${currency}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Payment ID</td><td style="font-family:monospace;">${r.paymentId}</td></tr>
  </table>
  <p style="margin-top:16px;font-size:13px;color:#64748b;">Prepare and deliver the ticket to the customer's inbox.</p>
</div>`.trim();
}
