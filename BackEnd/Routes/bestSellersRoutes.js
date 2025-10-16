const express = require('express');
const router = express.Router();
const { getBestSellers } = require('../Controllers/bestSellersController');

// GET /api/best-sellers - Get best selling products based on real order data
router.get('/', getBestSellers);

module.exports = router;