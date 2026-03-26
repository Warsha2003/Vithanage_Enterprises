const express = require('express');
const router = express.Router();
const {
  getMyWarranties,
  getWarrantyById,
  submitClaim,
  getAllClaims,
  updateClaimStatus,
  checkWarranty
} = require('../Controllers/warrantyController');
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Public routes
router.get('/check', checkWarranty);

// User routes (require authentication)
router.get('/my-warranties', authMiddleware, getMyWarranties);
router.get('/:id', authMiddleware, getWarrantyById);
router.post('/:id/claim', authMiddleware, submitClaim);

// Admin routes
router.get('/admin/claims', adminAuthMiddleware, getAllClaims);
router.put('/admin/:warrantyId/claim/:claimId', adminAuthMiddleware, updateClaimStatus);

module.exports = router;
