const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewLike,
  reportReview,
  getReviewableProducts
} = require('../Controllers/reviewController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.use(authMiddleware); // All routes below require authentication

// User review routes
router.get('/my-reviews', getUserReviews);
router.get('/can-review/:productId', getReviewableProducts);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/like', toggleReviewLike);
router.post('/:id/report', reportReview);

module.exports = router;