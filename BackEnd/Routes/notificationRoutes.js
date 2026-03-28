const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../Controllers/authMiddleware');
const {
  getTwilioStatus,
  sendTestWhatsApp,
  sendTestSMS
} = require('../Controllers/notificationController');

// Rate limiter for notification endpoints to prevent Twilio API abuse
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many notification requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(notificationLimiter);
router.use(authMiddleware);

router.get('/twilio-status', getTwilioStatus);
router.post('/test-whatsapp', sendTestWhatsApp);
router.post('/test-sms', sendTestSMS);

module.exports = router;
