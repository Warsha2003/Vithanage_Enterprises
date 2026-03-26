const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');
const {
  getActiveBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getAllBundles,
  getSuggestedBundles
} = require('../Controllers/bundleController');

// Public routes
router.get('/', getActiveBundles);
router.get('/suggested/:productId', getSuggestedBundles);
router.get('/:id', getBundleById);

// Admin routes
router.get('/admin/all', adminAuthMiddleware, getAllBundles);
router.post('/', adminAuthMiddleware, createBundle);
router.put('/:id', adminAuthMiddleware, updateBundle);
router.delete('/:id', adminAuthMiddleware, deleteBundle);

module.exports = router;
