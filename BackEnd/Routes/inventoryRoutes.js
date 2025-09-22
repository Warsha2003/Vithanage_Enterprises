const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getProductInventory,
  addStock,
  removeStock,
  adjustStock,
  updateInventorySettings,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryStats,
  getStockMovements,
  initializeInventory
} = require('../Controllers/inventoryController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

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

// Inventory settings
router.put('/product/:productId/settings', updateInventorySettings);

// Utility routes
router.post('/initialize', initializeInventory);

module.exports = router;