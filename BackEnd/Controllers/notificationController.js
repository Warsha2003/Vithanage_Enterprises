const User = require('../Models/User');
const { sendSMS, sendWhatsApp, validateTwilioAuth } = require('../Services/smsService');

// Get Twilio auth/health status for current environment
exports.getTwilioStatus = async (req, res) => {
  try {
    const status = await validateTwilioAuth();
    res.status(status.success ? 200 : 500).json(status);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send test WhatsApp message to current user phone or provided phone
exports.sendTestWhatsApp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('phone');
    const phone = req.body.phone || user?.phone;
    const message = req.body.message || 'Test WhatsApp message from Vithanage Enterprises backend.';

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required. Provide phone in request body or update user profile phone.'
      });
    }

    const result = await sendWhatsApp(phone, message);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'WhatsApp send failed',
        details: result
      });
    }

    res.status(200).json({
      success: true,
      message: 'WhatsApp sent successfully',
      phone,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send test SMS message to current user phone or provided phone
exports.sendTestSMS = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('phone');
    const phone = req.body.phone || user?.phone;
    const message = req.body.message || 'Test SMS message from Vithanage Enterprises backend.';

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required. Provide phone in request body or update user profile phone.'
      });
    }

    const result = await sendSMS(phone, message);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'SMS send failed',
        details: result
      });
    }

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      phone,
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
