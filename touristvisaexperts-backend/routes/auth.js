const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, adminLogin, getMe, changePassword, register, forgotPassword, resetPassword, verifyRegistrationOtp, resendRegistrationOtp, logout, getSessionToken, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Full name is required')
      .matches(/^\p{L}[\p{L}\p{M} .'-]*$/u).withMessage('Please enter a valid full name (letters only)'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').optional({ values: 'falsy' }).trim().custom(v => {
      // 10 digits for India (with or without +91), otherwise +country code and 8-15 digits in total
      if (!/^\+?[\d\s()-]+$/.test(v)) throw new Error('Phone number can only contain digits');
      const digits = v.replace(/\D/g, '');
      if (!v.startsWith('+') || v.startsWith('+91')) {
        if (!/^[6-9]\d{9}$/.test(v.startsWith('+91') ? digits.slice(2) : digits)) throw new Error('Please enter a valid 10-digit mobile number');
      } else if (digits.length < 8 || digits.length > 15) throw new Error('Please enter a valid phone number with country code');
      return true;
    }),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    body('dataProtectionConsent').custom(v => v === true).withMessage('You must accept the data protection terms'),
    body('termsRefundConsent').custom(v => v === true).withMessage('You must accept the Terms & Refund Policy'),
    body('ageConfirmed').custom(v => v === true).withMessage('You must confirm you are 18 or older'),
  ],
  validate,
  register
);

router.post(
  '/verify-registration-otp',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit code required'),
  ],
  validate,
  verifyRegistrationOtp
);

router.post(
  '/resend-registration-otp',
  authLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate,
  resendRegistrationOtp
);

router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
], validate, forgotPassword);

router.put('/reset-password/:token', authLimiter, [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
], validate, resetPassword);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

// Dedicated Admin Login routes
router.post(
  '/admin/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  adminLogin
);

router.post(
  '/admin-login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  adminLogin
);

// Continue with Google (clients only) — body: { credential, consents? }
router.post('/google', authLimiter, googleLogin);

router.get('/me', protect, getMe);

router.get('/session-token', protect, getSessionToken);

router.post('/logout', logout);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  ],
  validate,
  changePassword
);

module.exports = router;
