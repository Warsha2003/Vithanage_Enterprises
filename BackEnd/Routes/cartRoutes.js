const express = require('express');
const router = express.Router();
const cartController = require('../Controllers/cartController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// All cart routes are protected - require authentication
router.use(authMiddleware);

// Get cart items
router.get('/', cartController.getCartItems);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Get cart count
router.get('/count', cartController.getCartCount);

// Transfer guest cart to user cart
router.post('/transfer', cartController.transferGuestCart);

module.exports = router;
