const express = require('express');
const router = express.Router();
const {
  getAllPromotions,
  getActivePromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  validatePromotionCode,
  applyPromotionToOrder,
  getPromotionStats,
  getProductsForPromotion
} = require('../Controllers/promotionController');
const { adminAuthMiddleware, authMiddleware } = require('../Controllers/authMiddleware');

// Public routes (no authentication required)
router.get('/active', getActivePromotions);

// User routes (require user authentication)
router.post('/validate', authMiddleware, validatePromotionCode);
router.post('/apply', authMiddleware, applyPromotionToOrder);

// Mixed access routes - allow both admin and regular users
router.get('/', authMiddleware, getAllPromotions);
router.get('/products', authMiddleware, getProductsForPromotion);
router.post('/', authMiddleware, createPromotion);

// Admin routes (require admin authentication)
router.use(adminAuthMiddleware); // All routes below require admin authentication

// Parameterized routes (must come after specific routes)
router.get('/:id', getPromotionById);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

// Status management
router.patch('/:id/toggle-status', togglePromotionStatus);

// Statistics
router.get('/:id/stats', getPromotionStats);

module.exports = router;