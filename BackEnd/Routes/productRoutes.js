const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  createSampleProducts,
  getNewArrivals,
  markAsNewArrival,
  removeFromNewArrivals
} = require('../Controllers/productController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Public routes
router.get('/', getAllProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/setup/create-samples', createSampleProducts);
router.get('/:id', getProductById);

// Admin routes (only admins can add/edit/delete)
router.post('/', adminAuthMiddleware, addProduct);
router.put('/:id', adminAuthMiddleware, updateProduct);
router.delete('/:id', adminAuthMiddleware, deleteProduct);
router.put('/:id/mark-new-arrival', adminAuthMiddleware, markAsNewArrival);
router.put('/:id/remove-new-arrival', adminAuthMiddleware, removeFromNewArrivals);

module.exports = router;
