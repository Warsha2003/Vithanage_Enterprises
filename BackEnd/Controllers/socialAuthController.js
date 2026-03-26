const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Google OAuth Client
// To enable: Go to https://console.developers.google.com
// 1. Create a project
// 2. Enable Google+ API
// 3. Create OAuth credentials
// 4. Add to .env: GOOGLE_CLIENT_ID=your_client_id

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'vithanage_enterprises_secret';

// Verify Google token and login/register user
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ 
        message: 'Google login not configured. Please contact admin.' 
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.profilePicture && picture) {
          user.profilePicture = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
        isVerified: true, // Google accounts are pre-verified
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) // Random password
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { user: { id: user._id, email: user.email, role: user.role } },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// Facebook login (structure for future implementation)
exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;

    if (!process.env.FACEBOOK_APP_ID) {
      return res.status(503).json({ 
        message: 'Facebook login not configured. Please contact admin.' 
      });
    }

    // Verify Facebook token
    const verifyUrl = `https://graph.facebook.com/${userID}?fields=id,name,email,picture&access_token=${accessToken}`;
    const fbResponse = await fetch(verifyUrl);
    const fbData = await fbResponse.json();

    if (fbData.error) {
      return res.status(401).json({ message: 'Invalid Facebook token' });
    }

    const { id: facebookId, name, email, picture } = fbData;
    const profilePicture = picture?.data?.url;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email permission required for Facebook login' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.facebookId) {
        user.facebookId = facebookId;
        if (!user.profilePicture && profilePicture) {
          user.profilePicture = profilePicture;
        }
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        facebookId,
        profilePicture,
        isVerified: true,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
      });
      await user.save();
    }

    const token = jwt.sign(
      { user: { id: user._id, email: user.email, role: user.role } },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(401).json({ message: 'Facebook login failed' });
  }
};

// Check social login availability
exports.getSocialLoginStatus = async (req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    facebook: !!process.env.FACEBOOK_APP_ID
  });
};
