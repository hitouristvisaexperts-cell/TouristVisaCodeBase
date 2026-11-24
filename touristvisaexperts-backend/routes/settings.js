const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const {
  getPublicSettings,
  getPricing,
  getCashback,
  getCoupons,
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

// Public — no auth needed
router.get('/public', getPublicSettings);
router.get('/pricing', getPricing);
router.get('/cashback', getCashback);

// Admin only
router.get('/coupons', protect, authorize(ROLES.ADMIN), getCoupons); // never public — codes are secrets
router.get('/',  protect, authorize(ROLES.ADMIN), getSettings);
router.put('/',  protect, authorize(ROLES.ADMIN), updateSettings);

module.exports = router;
