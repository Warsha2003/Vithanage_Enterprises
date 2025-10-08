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
router.get('/homepage', async (req, res) => {
  try {
    const Promotion = require('../Models/Promotion');
    // Get all promotions for homepage with minimal filtering
    const promotions = await Promotion.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }, // Include promotions without isActive field
        { name: { $exists: true }, code: { $exists: true } } // Include any promotion with name and code
      ]
    }).limit(10).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching homepage promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      data: []
    });
  }
});

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