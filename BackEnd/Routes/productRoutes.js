const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  createSampleProducts 
} = require('../Controllers/productController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Public routes
// Get all products
router.get('/', getAllProducts);

// Create sample products - Must be defined before /:id to avoid conflict
router.get('/setup/create-samples', createSampleProducts);

// Get product by ID
router.get('/:id', getProductById);

// Protected routes (admin only)
// Add a new product
router.post('/', authMiddleware, addProduct);

// Update a product
router.put('/:id', authMiddleware, updateProduct);

// Delete a product
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
