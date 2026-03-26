const express = require('express');
const router = express.Router();
const wishlistController = require('../Controllers/wishlistController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get wishlist
router.get('/', wishlistController.getWishlist);

// Get wishlist count
router.get('/count', wishlistController.getWishlistCount);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

// Add to wishlist
router.post('/add', wishlistController.addToWishlist);

// Move to cart
router.post('/move-to-cart', wishlistController.moveToCart);

// Remove from wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Clear wishlist
router.delete('/clear', wishlistController.clearWishlist);

module.exports = router;
