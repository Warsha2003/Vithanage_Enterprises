const express = require('express');
const router = express.Router();
const { sendPromotionalCampaign, getUsersForCampaign } = require('../Controllers/emailCampaignController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

// Send promotional campaign email (admin only)
router.post('/send-campaign', adminAuthMiddleware, sendPromotionalCampaign);

// Get users for targeting (admin only)
router.get('/target-users', adminAuthMiddleware, getUsersForCampaign);

module.exports = router;
