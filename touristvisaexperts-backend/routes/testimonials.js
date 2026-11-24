const express = require('express');
const router = express.Router();
const { getPublicTestimonials, getTestimonialPhoto } = require('../controllers/testimonialController');

// Public — read by the marketing site
router.get('/', getPublicTestimonials);
router.get('/:id/photo', getTestimonialPhoto);

module.exports = router;
