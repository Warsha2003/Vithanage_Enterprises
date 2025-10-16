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

// Get single deal by ID (public)
// GET /api/deals/:id
router.get('/:id', getDailyDealById);

// Admin routes (require admin authentication)

// Get all daily deals with filtering (Admin only)
// GET /api/deals/admin/all
// Query params: status, search, dealType, sortBy, sortOrder
router.get('/admin/all', adminAuthMiddleware, getAllDailyDeals);

// Get deal statistics (Admin only)
// GET /api/deals/admin/statistics
router.get('/admin/statistics', adminAuthMiddleware, getDealStatistics);

// Create new daily deal (Admin only)
// POST /api/deals/admin/create
router.post('/admin/create', adminAuthMiddleware, createDailyDeal);

// Update daily deal (Admin only)
// PUT /api/deals/admin/:id
router.put('/admin/:id', adminAuthMiddleware, updateDailyDeal);

// Toggle deal status (Admin only)
// PATCH /api/deals/admin/:id/toggle-status
router.patch('/admin/:id/toggle-status', adminAuthMiddleware, toggleDealStatus);

// Delete daily deal (Admin only)
// DELETE /api/deals/admin/:id
router.delete('/admin/:id', adminAuthMiddleware, deleteDailyDeal);

module.exports = router;