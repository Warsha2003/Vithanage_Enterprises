const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewById,
  updateReviewApproval,
  addAdminResponse,
  deleteAdminResponse,
  deleteReview,
  clearReviewReports,
  getReviewAnalytics
} = require('../Controllers/adminReviewController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

// All routes require admin authentication
router.use(adminAuthMiddleware);

// Review management routes
router.get('/', getAllReviews);
router.get('/analytics', getReviewAnalytics);
router.get('/:id', getReviewById);
router.put('/:id/approval', updateReviewApproval);
router.post('/:id/respond', addAdminResponse);
router.delete('/:id/respond', deleteAdminResponse);
router.put('/:id/clear-reports', clearReviewReports);
router.delete('/:id', deleteReview);

module.exports = router;