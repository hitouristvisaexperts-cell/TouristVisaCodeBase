const express = require('express');
const router = express.Router();
const { getFAQs } = require('../controllers/faqController');

// Public route — no auth needed for reading FAQs
router.get('/', getFAQs);

module.exports = router;
