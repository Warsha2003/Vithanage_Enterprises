const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  processPayment,
  getPayment,
  getUserPayments,
  verifyPayment,
  adminGetAllPayments,
  adminRefundPayment,
  getPaymentStats
} = require('../Controllers/paymentController');
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');

// User routes (protected)
router.post('/create-intent', authMiddleware, createPaymentIntent);
router.post('/process', authMiddleware, processPayment);
router.get('/my-payments', authMiddleware, getUserPayments);
router.get('/:paymentId', authMiddleware, getPayment);
router.get('/verify/:paymentIntentId', authMiddleware, verifyPayment);

// Admin routes (admin protected)
router.get('/admin/all', adminAuthMiddleware, adminGetAllPayments);
router.get('/admin/stats', adminAuthMiddleware, getPaymentStats);
router.post('/admin/refund/:paymentId', adminAuthMiddleware, adminRefundPayment);

module.exports = router;
