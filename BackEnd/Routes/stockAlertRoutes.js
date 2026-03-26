const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../Controllers/authMiddleware');
const {
  createAlert,
  getMyAlerts,
  deleteAlert,
  checkAlert
} = require('../Controllers/stockAlertController');

// Create stock alert
router.post('/', authMiddleware, createAlert);

// Get user's alerts
router.get('/my-alerts', authMiddleware, getMyAlerts);

// Check if alert exists for product
router.get('/check/:productId', authMiddleware, checkAlert);

// Delete alert
router.delete('/:productId', authMiddleware, deleteAlert);

module.exports = router;
