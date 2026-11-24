const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { createPaymentIntent, verifyAndSave } = require('../controllers/stripeController');

const stripeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: { success: false, message: 'Too many payment attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public (customer) ──
router.post('/create-payment-intent', stripeLimiter, createPaymentIntent);

router.post(
  '/verify',
  stripeLimiter,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID required'),
    body('from').trim().notEmpty().withMessage('Departure city required'),
    body('to').trim().notEmpty().withMessage('Arrival city required'),
    body('departureDate').trim().notEmpty().withMessage('Departure date required'),
    body('contactEmail').isEmail().withMessage('Valid email required'),
  ],
  validate,
  verifyAndSave
);

module.exports = router;
