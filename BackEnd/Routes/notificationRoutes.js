const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../Controllers/authMiddleware');
const {
  getTwilioStatus,
  sendTestWhatsApp,
  sendTestSMS
} = require('../Controllers/notificationController');

router.use(authMiddleware);

router.get('/twilio-status', getTwilioStatus);
router.post('/test-whatsapp', sendTestWhatsApp);
router.post('/test-sms', sendTestSMS);

module.exports = router;
