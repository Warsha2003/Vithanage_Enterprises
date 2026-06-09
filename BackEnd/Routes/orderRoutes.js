const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../Controllers/authMiddleware');
const orderController = require('../Controllers/orderController');

// Public guest checkout / tracking
router.post('/guest', orderController.createGuestOrder);
router.get('/track/:orderNumber', orderController.getOrderTracking);

router.use(authMiddleware);

// Create order
router.post('/', orderController.createOrder);

// Get current user's orders
router.get('/mine', orderController.getMyOrders);

// Get a single order
router.get('/:id', orderController.getOrderById);

// Get tracking for an authenticated order
router.get('/:id/tracking', orderController.getOrderTracking);

// Cancel order
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;


