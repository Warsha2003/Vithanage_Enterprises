const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createSampleProducts } = require('../Controllers/productController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Get all products
router.get('/', getAllProducts);

// Get product by ID
router.get('/:id', getProductById);

// Create sample products (this would normally be protected in production)
router.post('/create-samples', createSampleProducts);

module.exports = router;
