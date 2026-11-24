const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { logConsent, listConsent } = require('../controllers/consentController');

const consentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/consent/log — PUBLIC (pre-account checkout consent has no JWT yet)
router.post(
  '/log',
  consentLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('source').isIn(['checkout', 'portal_registration']).withMessage('Invalid source'),
  ],
  validate,
  logConsent
);

// GET /api/consent — admin-only view of consent logs
router.get('/', protect, authorize('admin'), listConsent);

module.exports = router;
