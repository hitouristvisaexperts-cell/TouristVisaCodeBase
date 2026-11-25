const FlightReservation = require('../models/FlightReservation');
const sendEmail = require('../utils/sendEmail');
const { getPrices, clampApplicants, findCoupon, applyCoupon } = require('../utils/pricing');
const { razorpayClient, isValidSignature, fetchOrder, orderKind, claimPayment, finishPayment, releasePayment } = require('../utils/razorpayHelper');

// ─── Create Razorpay order for a flight reservation ──────────────────────────
exports.createOrder = async (req, res) => {
  try {
    // Price scales with passenger count (1–20); the per-passenger fee is set in the portal (incl. GST)
    const count = clampApplicants(req.body?.passengerCount);
    const { flightPerPassenger } = await getPrices();
    // Promo codes: only codes the admin made for flight tickets work here
    let coupon = null;
    if (req.body?.coupon && String(req.body.coupon).trim()) {
      coupon = await findCoupon(req.body.coupon, 'flight');
      if (!coupon) return res.status(400).json({ success: false, message: 'This promo code is not valid for flight tickets.' });
    }
    const order = await razorpayClient().orders.create({
      amount: applyCoupon(coupon, flightPerPassenger * 100, count),
      currency: 'INR',
      receipt: `flt_${Date.now()}`,
      notes: { kind: 'flight', type: 'flight_reservation', passengers: String(count), coupon: coupon?.code || '' },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        passengerCount: count,
        originalAmount: flightPerPassenger * count * 100,
        couponApplied: !!coupon,
      },
    });
  } catch (err) {
    const errorDetail = err?.error?.description || err?.error?.message || err?.message || 'Payment initiation failed.';
    console.error('Flight create order error:', JSON.stringify(err?.error || err?.message || err));

    if (err?.statusCode === 401 || err?.error?.code === 'BAD_REQUEST_ERROR' && err?.error?.description?.includes('Authentication failed')) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay authentication failed. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
      });
    }

    res.status(500).json({ success: false, message: errorDetail });
  }
};

// ─── Preview a flight promo code ──────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
  try {
    const count = clampApplicants(req.body?.passengerCount);
    const coupon = await findCoupon(req.body?.coupon, 'flight');
    if (!coupon) return res.status(400).json({ success: false, message: 'This promo code is not valid for flight tickets.' });
    const { flightPerPassenger } = await getPrices();
    res.json({ success: true, code: coupon.code, originalAmount: flightPerPassenger * count * 100, finalAmount: applyCoupon(coupon, flightPerPassenger * 100, count) });
  } catch {
    res.status(500).json({ success: false, message: 'Could not check the promo code. Please try again.' });
  }
};

// ─── Verify payment + save reservation ───────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    from, to, departureDate, returnDate, tripType,
    passengers, contactEmail, contactPhone,
  } = req.body;

  // 1. Signature proves Razorpay took this payment for this order
  if (!isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
  }

  // 2. The order must be a flight order; the number of passengers paid for comes from it
  const order = await fetchOrder(razorpay_order_id);
  if (order && orderKind(order) !== 'flight') {
    return res.status(400).json({ success: false, message: 'This payment is not for a flight reservation. Please contact support.' });
  }
  const paidPassengers = order ? clampApplicants(order.notes?.passengers) : null;
  const paxList = (Array.isArray(passengers) ? passengers : []).slice(0, paidPassengers || 20);
  if (paidPassengers && paxList.length < 1) {
    return res.status(400).json({ success: false, message: 'Passenger details are missing.' });
  }

  // 3. Each payment can be used once
  const claim = await claimPayment({ paymentId: razorpay_payment_id, orderId: razorpay_order_id, kind: 'flight', amount: order?.amount });
  if (!claim.claimed) {
    return res.json({ success: true, alreadyProcessed: true, message: 'This reservation is already confirmed. Check your email for your ticket.' });
  }

  try {
    const reservation = await FlightReservation.create({
      from, to, departureDate, returnDate,
      tripType: tripType === 'round-trip' ? 'round-trip' : 'one-way',
      passengers: paxList,
      contactEmail: (contactEmail || paxList[0]?.email || '').toLowerCase().trim(),
      contactPhone,
      amount: order ? order.amount / 100 : (await getPrices()).flightPerPassenger * Math.max(1, paxList.length),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      isPaid: true,
      status: 'paid',
      ...(!order && { notes: 'Order details could not be confirmed with Razorpay at booking time — check the payment.' }),
    });
    await finishPayment(claim.record, reservation._id);

    // 3. Confirmation email to customer (best-effort)
    if (reservation.contactEmail) {
      sendEmail({
        to: reservation.contactEmail,
        subject: '✈️ Flight Reservation Confirmed — Tourist Visa Experts',
        html: flightConfirmEmail(reservation),
      }).catch(() => {});
    }

    // 4. Notify admin/ops
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Flight Reservation — ${reservation.from} → ${reservation.to}`,
        html: flightAdminEmail(reservation),
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Reservation confirmed! Check your email — your ticket will arrive in your inbox.',
      data: { id: reservation._id, email: reservation.contactEmail },
    });
  } catch (err) {
    console.error('Flight verify error:', err.message);
    await releasePayment(claim.record);
    res.status(500).json({ success: false, message: 'Could not save your reservation. Please contact support with your payment ID.' });
  }
};

// ─── Admin: list flight reservations ─────────────────────────────────────────
exports.listReservations = async (req, res) => {
  try {
    const { status, flagged, page = 1, limit = 30 } = req.query;
    const safePage  = Math.max(1, parseInt(page, 10)  || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 30), 100);
    const query = {};
    const VALID_FLIGHT_STATUSES = ['pending_payment', 'paid', 'in_progress', 'delivered', 'cancelled', 'flagged'];
    if (status && VALID_FLIGHT_STATUSES.includes(status)) query.status = status;
    if (flagged === 'true') query.isFlagged = true;

    const [data, total] = await Promise.all([
      FlightReservation.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
      FlightReservation.countDocuments(query),
    ]);
    res.json({ success: true, total, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin: update reservation status / deliver / flag ───────────────────────
exports.updateReservation = async (req, res) => {
  try {
    const { status, isFlagged, flagReason, notes } = req.body;
    const r = await FlightReservation.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Reservation not found' });

    const VALID = ['pending_payment', 'paid', 'in_progress', 'delivered', 'cancelled', 'flagged'];
    if (status && !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Use one of: ${VALID.join(', ')}` });
    }
    if (status) {
      r.status = status;
      if (status === 'delivered') r.ticketDeliveredAt = new Date();
    }
    if (typeof isFlagged === 'boolean') {
      r.isFlagged = isFlagged;
      r.flagReason = isFlagged ? (flagReason || 'Flagged for review') : undefined;
      r.flaggedAt = isFlagged ? new Date() : undefined;
      if (isFlagged) r.status = 'flagged';
    }
    if (notes !== undefined) r.notes = notes;

    await r.save();
    res.json({ success: true, data: r });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Email templates ─────────────────────────────────────────────────────────
function flightConfirmEmail(r) {
  return `
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
        <tr><td style="color:#94a3b8;padding:4px 0;width:120px;">Route</td><td style="font-weight:700;color:#0f172a;">${r.from} → ${r.to}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Departure</td><td style="font-weight:600;color:#0f172a;">${r.departureDate}</td></tr>
        ${r.returnDate ? `<tr><td style="color:#94a3b8;padding:4px 0;">Return</td><td style="font-weight:600;color:#0f172a;">${r.returnDate}</td></tr>` : ''}
        <tr><td style="color:#94a3b8;padding:4px 0;">Passengers</td><td style="font-weight:600;color:#0f172a;">${r.passengers.length}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Amount</td><td style="font-weight:700;color:#F97316;">₹${r.amount}</td></tr>
        <tr><td style="color:#94a3b8;padding:4px 0;">Payment ID</td><td style="font-family:monospace;font-size:11px;color:#475569;">${r.paymentId}</td></tr>
      </table>
    </div>
  </div>
  <div style="text-align:center;margin-top:18px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
</div>`.trim();
}

function flightAdminEmail(r) {
  return `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;">
  <h2 style="color:#0f172a;">New Flight Reservation (PAID)</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#94a3b8;width:130px;">Route</td><td style="font-weight:700;">${r.from} → ${r.to}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Trip</td><td>${r.tripType}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Departure</td><td>${r.departureDate}</td></tr>
    ${r.returnDate ? `<tr><td style="padding:6px 0;color:#94a3b8;">Return</td><td>${r.returnDate}</td></tr>` : ''}
    <tr><td style="padding:6px 0;color:#94a3b8;">Passengers</td><td>${r.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Contact</td><td>${r.contactEmail} ${r.contactPhone || ''}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Payment ID</td><td style="font-family:monospace;">${r.paymentId}</td></tr>
  </table>
  <p style="margin-top:16px;font-size:13px;color:#64748b;">Prepare and deliver the ticket to the customer's inbox.</p>
</div>`.trim();
}
