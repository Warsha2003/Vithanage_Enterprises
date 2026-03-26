const express = require('express');
const router = express.Router();
const {
  googleLogin,
  facebookLogin,
  getSocialLoginStatus
} = require('../Controllers/socialAuthController');

// Check which social logins are available
router.get('/status', getSocialLoginStatus);

// Google login
router.post('/google', googleLogin);

// Facebook login
router.post('/facebook', facebookLogin);

module.exports = router;
