const express = require('express');
const router  = express.Router();
const { getPublicArticles } = require('../controllers/articleController');

// Public — marketing site uses this
router.get('/', getPublicArticles);

module.exports = router;
