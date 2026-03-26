const express = require('express');
const router = express.Router();
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');
const {
  getDashboardStats,
  getSalesTrends,
  getTopProducts,
  getCategoryPerformance,
  getCustomerInsights,
  getRecentActivity
} = require('../Controllers/analyticsController');

// All routes require admin authentication
router.use(adminAuthMiddleware);

// Dashboard overview
router.get('/dashboard', getDashboardStats);

// Sales trends
router.get('/sales-trends', getSalesTrends);

// Top products
router.get('/top-products', getTopProducts);

// Category performance
router.get('/categories', getCategoryPerformance);

// Customer insights
router.get('/customers', getCustomerInsights);

// Recent activity
router.get('/activity', getRecentActivity);

module.exports = router;
