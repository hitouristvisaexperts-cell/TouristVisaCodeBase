// Shared Razorpay helpers: signature check, trusted order lookup and payment idempotency.
const crypto = require('crypto');
const Razorpay = require('razorpay');
const PaymentRecord = require('../models/PaymentRecord');

const razorpayClient = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/** Constant-time check of the signature Razorpay returns to the browser after payment. */
function isValidSignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature || !process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(String(signature), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * The order as stored by Razorpay — amount and notes were set by OUR server when the
 * order was created, so they are trusted (unlike anything the browser sends at verify time).
 * Returns null if Razorpay can't be reached.
 */
async function fetchOrder(orderId) {
  try { return await razorpayClient().orders.fetch(orderId); } catch (err) {
    console.error('Razorpay order fetch failed:', err?.error?.description || err.message);
    return null;
  }
}

/** Which product an order was created for. Handles orders created before `kind` existed. */
function orderKind(order) {
  const n = order?.notes || {};
  if (n.kind) return n.kind;
  if (n.type === 'flight_reservation') return 'flight';
  if (n.members && n.userId) return 'add_members';
  if (n.package) return 'visa';
  return 'unknown';
}

/**
 * Claim a payment before acting on it. Returns { claimed: true, record } the first time,
 * or { claimed: false, record } if this payment was already used.
 */
async function claimPayment({ paymentId, orderId, kind, amount, user }) {
  try {
    const record = await PaymentRecord.create({ paymentId, orderId, kind, amount, user, status: 'processing' });
    return { claimed: true, record };
  } catch (err) {
    if (err.code === 11000) return { claimed: false, record: await PaymentRecord.findOne({ paymentId }) };
    throw err;
  }
}

async function finishPayment(record, ref) {
  record.status = 'done';
  if (ref) record.ref = ref;
  await record.save();
}

/** If processing fails half-way, release the claim so the customer (or support) can retry. */
async function releasePayment(record) {
  try { await PaymentRecord.deleteOne({ _id: record._id, status: 'processing' }); } catch { /* ignore */ }
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupees = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

module.exports = { razorpayClient, isValidSignature, fetchOrder, orderKind, claimPayment, finishPayment, releasePayment, escapeHtml, rupees };
