const express = require('express');
const router = express.Router();
const {
    createRefundRequest,
    getUserRefunds,
    getRefundById,
    updateRefundRequest,
    cancelRefundRequest,
    checkRefundEligibility
} = require('../Controllers/refundController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// User refund routes - all require authentication
router.use(authMiddleware);

// Create new refund request
router.post('/', createRefundRequest);

// Get user's refund requests
router.get('/', getUserRefunds);

// Check refund eligibility for an order item
router.get('/eligibility/:orderId/:productId', checkRefundEligibility);

// Get single refund details
router.get('/:id', getRefundById);

// Update refund request (only if pending)
router.put('/:id', updateRefundRequest);

// Cancel refund request (only if pending)
router.delete('/:id', cancelRefundRequest);

module.exports = router;