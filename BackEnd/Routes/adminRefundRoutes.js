const express = require('express');
const router = express.Router();
const {
    getAllRefunds,
    getRefundByIdAdmin,
    approveRefund,
    rejectRefund,
    markRefundProcessing,
    completeRefund,
    getRefundDashboardStats,
    bulkUpdateRefundStatus
} = require('../Controllers/adminRefundController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Admin refund routes - all require admin authentication
router.use(adminAuthMiddleware);

// Get refund dashboard statistics
router.get('/stats', getRefundDashboardStats);

// Get all refund requests with filters and pagination
router.get('/', getAllRefunds);

// Get single refund details (admin view)
router.get('/:id', getRefundByIdAdmin);

// Approve refund request
router.put('/:id/approve', approveRefund);

// Reject refund request
router.put('/:id/reject', rejectRefund);

// Mark refund as processing
router.put('/:id/processing', markRefundProcessing);

// Mark refund as completed
router.put('/:id/complete', completeRefund);

// Bulk update refund status
router.put('/bulk/update', bulkUpdateRefundStatus);

module.exports = router;