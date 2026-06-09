const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getProductInventory,
  addStock,
  removeStock,
  adjustStock,
  bulkAdjustStock,
  updateInventorySettings,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryStats,
  getStockMovements,
  initializeInventory
} = require('../Controllers/inventoryController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({ field: error.path, message: error.msg }))
    });
  }
  next();
};

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

// Inventory overview routes
router.get('/', getAllInventory);
router.get('/stats', getInventoryStats);
router.get('/low-stock', getLowStockItems);
router.get('/out-of-stock', getOutOfStockItems);

// Product-specific inventory routes
router.get('/product/:productId', getProductInventory);
router.get('/product/:productId/movements', getStockMovements);

// Stock management routes
router.post('/product/:productId/add-stock', addStock);
router.post('/product/:productId/remove-stock', removeStock);
router.post('/product/:productId/adjust-stock', adjustStock);
router.post(
  '/bulk-adjust',
  [
    body('updates').isArray({ min: 1 }).withMessage('updates must be a non-empty array')
  ],
  validateRequest,
  bulkAdjustStock
);

// Inventory settings
router.put('/product/:productId/settings', updateInventorySettings);

// Utility routes
router.post('/initialize', initializeInventory);

module.exports = router;