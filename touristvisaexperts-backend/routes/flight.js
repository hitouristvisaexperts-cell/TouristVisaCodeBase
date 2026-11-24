const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const {
  createOrder, verifyPayment, listReservations, updateReservation, validateCoupon,
} = require('../controllers/flightController');

// Dedicated rate limiter for flight orders (isolated from visa traffic)
const flightOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: { success: false, message: 'Too many reservation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public (customer) ──
router.post('/create-order', flightOrderLimiter, createOrder);

// Promo-code preview — its own limiter so guessing codes is slow
const flightCouponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many promo code attempts. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});
router.post('/validate-coupon', flightCouponLimiter, validateCoupon);

router.post(
  '/verify',
  flightOrderLimiter,
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    body('from').trim().notEmpty().withMessage('Departure city required'),
    body('to').trim().notEmpty().withMessage('Arrival city required'),
    body('departureDate').trim().notEmpty().withMessage('Departure date required'),
    body('contactEmail').isEmail().withMessage('Valid email required'),
  ],
  validate,
  verifyPayment
);

// ── Admin (ops) ──
router.get('/', protect, authorize(ROLES.ADMIN), listReservations);
router.put('/:id', protect, authorize(ROLES.ADMIN), updateReservation);

module.exports = router;
