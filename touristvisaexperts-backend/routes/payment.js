const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const rateLimit = require('express-rate-limit');
const {
  createOrder,
  verifyPayment,
  exchangeToken,
  validateCoupon,
  createStripeVisaOrder,
  verifyStripeVisaPayment,
  razorpayWebhook,
} = require('../controllers/paymentController');

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many payment attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Coupon validation is a guessing oracle (valid vs invalid code) — kept
// tighter than the general order limiter so brute-forcing codes isn't
// practical even across the full rate-limit window.
const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many coupon attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Verification/exchange endpoints don't need to be as tight as order
// creation (they're driven by a legitimate payment/session flow, not
// something to flood), but they still shouldn't be unlimited.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/payment/create-order — tight rate limit prevents anonymous order flooding
router.post(
  '/create-order',
  orderLimiter,
  [body('package').isIn(['essential', 'complete']).withMessage('Invalid package')],
  validate,
  createOrder
);

// POST /api/payment/verify
router.post(
  '/verify',
  verifyLimiter,
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('package').isIn(['essential', 'complete']).withMessage('Invalid package'),
  ],
  validate,
  verifyPayment
);

// POST /api/payment/validate-coupon — server-side coupon validation (no secret in frontend)
router.post('/validate-coupon', couponLimiter, [
  body('coupon').trim().notEmpty().withMessage('Coupon code required'),
], validate, validateCoupon);

// POST /api/payment/exchange-token — swap one-time code for a session JWT
router.post('/exchange-token', verifyLimiter, [
  body('code').notEmpty().withMessage('Exchange code required'),
], validate, exchangeToken);

// POST /api/payment/stripe-visa-order — Stripe PaymentIntent for international users
router.post('/stripe-visa-order', orderLimiter, [
  body('fromCountry').notEmpty().withMessage('fromCountry required'),
], validate, createStripeVisaOrder);

// POST /api/payment/stripe-visa-verify — confirm Stripe Checkout session + provision account
router.post('/stripe-visa-verify', verifyLimiter, [
  body('sessionId').notEmpty().withMessage('sessionId required'),
], validate, verifyStripeVisaPayment);

// POST /api/payment/webhook — Razorpay server-to-server webhook
router.post('/webhook', razorpayWebhook);

module.exports = router;
