const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  submitContact,
  createConsultationOrder,
  verifyConsultation,
  validateConsultationCoupon,
  captureAbandonedCheckout,
} = require('../controllers/leadController');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: { success: false, message: 'Too many messages. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const consultationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public (website)
router.post('/contact', contactLimiter, submitContact);
router.post('/checkout/lead-capture', contactLimiter, captureAbandonedCheckout);
router.post('/consultation/create-order', consultationLimiter, createConsultationOrder);
router.post('/consultation/verify', consultationLimiter, verifyConsultation);

// Promo-code preview — its own limiter so guessing codes is slow
const promoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many promo code attempts. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});
router.post('/consultation/validate-coupon', promoLimiter, validateConsultationCoupon);

module.exports = router;
