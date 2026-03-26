const express = require('express');
const router = express.Router();
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptionStatus
} = require('../Controllers/pushNotificationController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Public routes
router.get('/vapid-public-key', getVapidPublicKey);

// User routes (require authentication)
router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/subscribe', authMiddleware, subscribe);
router.post('/unsubscribe', authMiddleware, unsubscribe);

module.exports = router;
