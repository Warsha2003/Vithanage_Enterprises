const express = require('express');
const router = express.Router();
const {
  getAllDailyDeals,
  getActiveDeals,
  getDailyDealById,
  createDailyDeal,
  updateDailyDeal,
  toggleDealStatus,
  deleteDailyDeal,
  getDealStatistics
} = require('../Controllers/dailyDealController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Public routes (no authentication required)

// Get active deals for public consumption
// GET /api/deals/active
router.get('/active', getActiveDeals);

// Admin routes (require admin authentication)

// Get deal statistics (Admin only)
// GET /api/deals/stats
router.get('/stats', adminAuthMiddleware, getDealStatistics);

// Get all daily deals with filtering (Admin only)
// GET /api/deals
// Query params: status, search, dealType, sortBy, sortOrder
router.get('/', adminAuthMiddleware, getAllDailyDeals);

// Create new daily deal (Admin only)
// POST /api/deals
router.post('/', adminAuthMiddleware, createDailyDeal);

// Toggle deal status (Admin only)
// PUT /api/deals/:id/toggle-status
router.put('/:id/toggle-status', adminAuthMiddleware, toggleDealStatus);

// Update daily deal (Admin only)
// PUT /api/deals/:id
router.put('/:id', adminAuthMiddleware, updateDailyDeal);

// Delete daily deal (Admin only)
// DELETE /api/deals/:id
router.delete('/:id', adminAuthMiddleware, deleteDailyDeal);

// Get single deal by ID (public)
// GET /api/deals/:id
router.get('/:id', getDailyDealById);

module.exports = router;