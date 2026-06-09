const express = require('express');
const router = express.Router();
const {
  getMyPoints,
  redeemPoints,
  getTransactionHistory,
  adjustPoints,
  getPointsConfig,
  previewRedemption
} = require('../Controllers/loyaltyController');
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Public routes
router.get('/config', getPointsConfig);

// User routes (require authentication)
router.get('/my-points', authMiddleware, getMyPoints);
router.get('/history', authMiddleware, getTransactionHistory);
router.post('/preview', authMiddleware, previewRedemption);
router.post('/redeem', authMiddleware, redeemPoints);

// Admin routes
router.post('/adjust', adminAuthMiddleware, adjustPoints);

module.exports = router;
