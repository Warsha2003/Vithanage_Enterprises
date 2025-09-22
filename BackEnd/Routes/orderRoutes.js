const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../Controllers/authMiddleware');
const orderController = require('../Controllers/orderController');

router.use(authMiddleware);

// Create order
router.post('/', orderController.createOrder);

// Get current user's orders
router.get('/mine', orderController.getMyOrders);

// Get a single order
router.get('/:id', orderController.getOrderById);

// Cancel order
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;


