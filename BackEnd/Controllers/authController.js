const User = require('../Models/User');
const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../Services/emailService');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Register user
const register = async (req, res) => {
  try {
    console.log('Registration attempt received:', req.body);
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists (in both User and Admin collections)
    let user = await User.findOne({ email });
    let admin = await Admin.findOne({ email });
    
    if (user || admin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password, // password hashing is handled by the model's pre-save hook
      phone,
      address
    });

    await user.save();
    console.log('User saved successfully:', user.email);

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        isAdmin: false
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      console.log('Registration successful, sending response');
      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: false
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log("Login attempt received:", req.body);
    const { email, password } = req.body;

    // First check if it's a regular user
    const user = await User.findOne({ email });
    if (user) {
      console.log(`Regular user found: ${user.email}`);
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log("Password does not match for regular user");
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log("Password matches for regular user");
      
      // Create JWT token
      const payload = {
        user: {
          id: user.id,
          isAdmin: false
        }
      };
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          console.error("JWT Sign error:", err);
          throw err;
        }
        console.log("Regular user login successful, sending response");
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: false
          }
        });
      });
      
      return;
    }
    
    // If not a regular user, check if it's an admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      console.log(`Admin found: ${admin.email}, role: ${admin.role}`);
      
      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        console.log("Password does not match for admin");
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log("Password matches for admin");
      
      // Create JWT token for admin
      const payload = {
        admin: {
          id: admin.id,
          role: admin.role
        }
      };
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          console.error("JWT Sign error:", err);
          throw err;
        }
        console.log("Admin login successful, sending response");
        res.json({ 
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            isAdmin: true,
            role: admin.role
          }
        });
      });
      
      return;
    }
    
    // If user not found in either collection
    console.log(`User not found with email: ${email}`);
    return res.status(400).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    // Check if it's a regular user request
    if (req.user) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({
        ...user._doc,
        isAdmin: false
      });
    }
    
    // Check if it's an admin request
    if (req.admin) {
      const admin = await Admin.findById(req.admin.id).select('-password');
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json({
        ...admin._doc,
        isAdmin: true
      });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log('Profile update attempt received:', req.body);
    const { name, email, phone, address, city, postalCode, country } = req.body;

    // Check if it's a regular user request
    if (req.user) {
      // Check if email is being changed and if it already exists
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
        const existingAdmin = await Admin.findOne({ email });
        
        if (existingUser || existingAdmin) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { 
          name, 
          email, 
          phone, 
          address, 
          city, 
          postalCode, 
          country,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User profile updated successfully:', updatedUser.email);
      return res.json({ 
        message: 'Profile updated successfully',
        user: {
          ...updatedUser._doc,
          isAdmin: false
        }
      });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    console.log('Password change attempt received');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Check if it's a regular user request
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password (hashing will be handled by the model's pre-save hook)
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();

      console.log('User password changed successfully:', user.email);
      return res.json({ message: 'Password changed successfully' });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Forgot password - send reset token via email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to user (expires in 1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(user, resetToken);
      console.log('Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.updatedAt = new Date();
    await user.save();

    console.log('Password reset successful for:', user.email);
    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { register, login, getCurrentUser, updateProfile, changePassword, forgotPassword, resetPassword };