const User = require('../Models/User');
const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../Services/emailService');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'vithanage_enterprises_secret'; // In production, use environment variables
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh`;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '24h';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildAuthPayload = (account, isAdmin = false) => ({
  ...(isAdmin
    ? { admin: { id: account.id, role: account.role } }
    : { user: { id: account.id, isAdmin: false } })
});

const buildPublicUser = (account, isAdmin = false) => ({
  id: account.id,
  name: account.name,
  email: account.email,
  isAdmin,
  ...(isAdmin && { role: account.role })
});

const normalizeDefaultSelection = (items, selectedId) => items.map(item => ({
  ...item,
  isDefault: String(item._id) === String(selectedId)
}));

const issueTokens = (account, isAdmin = false) => {
  const accessToken = jwt.sign(buildAuthPayload(account, isAdmin), JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const refreshToken = jwt.sign(
    {
      type: isAdmin ? 'admin' : 'user',
      id: account.id,
      role: isAdmin ? account.role : 'user'
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );

  return { accessToken, refreshToken };
};

const persistRefreshToken = async (account, refreshToken) => {
  account.refreshTokenHash = hashToken(refreshToken);
  account.refreshTokenExpiresAt = jwt.decode(refreshToken)?.exp ? new Date(jwt.decode(refreshToken).exp * 1000) : undefined;
  await account.save();
};

// Register user
const register = async (req, res) => {
  try {
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
    console.log('User registered successfully');

    const { accessToken, refreshToken } = issueTokens(user, false);
    await persistRefreshToken(user, refreshToken);

    console.log('Registration successful, sending response');
    res.status(201).json({ 
      token: accessToken,
      refreshToken,
      user: buildPublicUser(user, false)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if it's a regular user
    const user = await User.findOne({ email });
    if (user) {
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const { accessToken, refreshToken } = issueTokens(user, false);
      await persistRefreshToken(user, refreshToken);

      res.json({ 
        token: accessToken,
        refreshToken,
        user: buildPublicUser(user, false)
      });
      
      return;
    }
    
    // If not a regular user, check if it's an admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const { accessToken, refreshToken } = issueTokens(admin, true);
      await persistRefreshToken(admin, refreshToken);

      res.json({ 
        token: accessToken,
        refreshToken,
        user: buildPublicUser(admin, true)
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

      return res.json({ message: 'Password changed successfully' });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSavedAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('addresses defaultAddressId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ addresses: user.addresses || [], defaultAddressId: user.defaultAddressId || null });
  } catch (error) {
    console.error('Get saved addresses error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const saveAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { label, recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = {
      label: label || 'Home',
      recipientName: recipientName || user.name,
      phone: phone || user.phone || '',
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state: state || '',
      postalCode,
      country: country || user.country || 'Sri Lanka',
      isDefault: Boolean(isDefault)
    };

    if (!address.addressLine1 || !address.city || !address.postalCode) {
      return res.status(400).json({ message: 'Address line 1, city, and postal code are required' });
    }

    if (address.isDefault) {
      user.addresses = (user.addresses || []).map(item => ({ ...item.toObject?.() || item, isDefault: false }));
      user.defaultAddressId = undefined;
    }

    user.addresses = user.addresses || [];
    user.addresses.push(address);
    const savedAddress = user.addresses[user.addresses.length - 1];

    if (address.isDefault || user.addresses.length === 1) {
      user.addresses = normalizeDefaultSelection(user.addresses.map(item => item.toObject ? item.toObject() : item), savedAddress._id);
      user.defaultAddressId = savedAddress._id;
    }

    await user.save();
    res.status(201).json({ message: 'Address saved', address: user.addresses[user.addresses.length - 1], addresses: user.addresses, defaultAddressId: user.defaultAddressId || null });
  } catch (error) {
    console.error('Save address error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateSavedAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const { label, recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (label !== undefined) address.label = label;
    if (recipientName !== undefined) address.recipientName = recipientName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;

    if (typeof isDefault === 'boolean') {
      user.addresses.forEach(item => {
        item.isDefault = false;
      });
      address.isDefault = true;
      user.defaultAddressId = address._id;
    }

    await user.save();
    res.json({ message: 'Address updated', address, addresses: user.addresses, defaultAddressId: user.defaultAddressId || null });
  } catch (error) {
    console.error('Update address error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteSavedAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = user.defaultAddressId && String(user.defaultAddressId) === String(address._id);
    address.deleteOne();
    if (wasDefault) {
      const nextDefault = user.addresses[0] || null;
      user.defaultAddressId = nextDefault ? nextDefault._id : null;
      if (nextDefault) {
        user.addresses.forEach(item => {
          item.isDefault = String(item._id) === String(nextDefault._id);
        });
      }
    }

    await user.save();
    res.json({ message: 'Address deleted', addresses: user.addresses, defaultAddressId: user.defaultAddressId || null });
  } catch (error) {
    console.error('Delete address error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.forEach(item => {
      item.isDefault = String(item._id) === String(address._id);
    });
    user.defaultAddressId = address._id;
    await user.save();

    res.json({ message: 'Default address updated', addresses: user.addresses, defaultAddressId: user.defaultAddressId });
  } catch (error) {
    console.error('Default address error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSavedPaymentMethods = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('savedPaymentMethods defaultPaymentMethodId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ paymentMethods: user.savedPaymentMethods || [], defaultPaymentMethodId: user.defaultPaymentMethodId || null });
  } catch (error) {
    console.error('Get saved payment methods error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const savePaymentMethod = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { label, provider, type, providerPaymentMethodId, brand, last4, expMonth, expYear, billingAddress, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = {
      label: label || 'Card',
      provider: provider || 'stripe',
      type: type || 'card',
      providerPaymentMethodId: providerPaymentMethodId || '',
      brand: brand || '',
      last4: last4 || '',
      expMonth: expMonth || undefined,
      expYear: expYear || undefined,
      billingAddress: billingAddress || {},
      isDefault: Boolean(isDefault)
    };

    if (paymentMethod.isDefault) {
      user.savedPaymentMethods = (user.savedPaymentMethods || []).map(item => ({ ...item.toObject?.() || item, isDefault: false }));
      user.defaultPaymentMethodId = undefined;
    }

    user.savedPaymentMethods = user.savedPaymentMethods || [];
    user.savedPaymentMethods.push(paymentMethod);
    const savedMethod = user.savedPaymentMethods[user.savedPaymentMethods.length - 1];

    if (paymentMethod.isDefault || user.savedPaymentMethods.length === 1) {
      user.savedPaymentMethods = normalizeDefaultSelection(user.savedPaymentMethods.map(item => item.toObject ? item.toObject() : item), savedMethod._id);
      user.defaultPaymentMethodId = savedMethod._id;
    }

    await user.save();
    res.status(201).json({ message: 'Payment method saved', paymentMethod: user.savedPaymentMethods[user.savedPaymentMethods.length - 1], paymentMethods: user.savedPaymentMethods, defaultPaymentMethodId: user.defaultPaymentMethodId || null });
  } catch (error) {
    console.error('Save payment method error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = user.savedPaymentMethods.id(req.params.methodId);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const { label, provider, type, providerPaymentMethodId, brand, last4, expMonth, expYear, billingAddress, isDefault } = req.body;

    if (label !== undefined) paymentMethod.label = label;
    if (provider !== undefined) paymentMethod.provider = provider;
    if (type !== undefined) paymentMethod.type = type;
    if (providerPaymentMethodId !== undefined) paymentMethod.providerPaymentMethodId = providerPaymentMethodId;
    if (brand !== undefined) paymentMethod.brand = brand;
    if (last4 !== undefined) paymentMethod.last4 = last4;
    if (expMonth !== undefined) paymentMethod.expMonth = expMonth;
    if (expYear !== undefined) paymentMethod.expYear = expYear;
    if (billingAddress !== undefined) paymentMethod.billingAddress = billingAddress;

    if (typeof isDefault === 'boolean') {
      user.savedPaymentMethods.forEach(item => {
        item.isDefault = false;
      });
      paymentMethod.isDefault = true;
      user.defaultPaymentMethodId = paymentMethod._id;
    }

    await user.save();
    res.json({ message: 'Payment method updated', paymentMethod, paymentMethods: user.savedPaymentMethods, defaultPaymentMethodId: user.defaultPaymentMethodId || null });
  } catch (error) {
    console.error('Update payment method error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = user.savedPaymentMethods.id(req.params.methodId);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const wasDefault = user.defaultPaymentMethodId && String(user.defaultPaymentMethodId) === String(paymentMethod._id);
    paymentMethod.deleteOne();

    if (wasDefault) {
      const nextDefault = user.savedPaymentMethods[0] || null;
      user.defaultPaymentMethodId = nextDefault ? nextDefault._id : null;
      if (nextDefault) {
        user.savedPaymentMethods.forEach(item => {
          item.isDefault = String(item._id) === String(nextDefault._id);
        });
      }
    }

    await user.save();
    res.json({ message: 'Payment method deleted', paymentMethods: user.savedPaymentMethods, defaultPaymentMethodId: user.defaultPaymentMethodId || null });
  } catch (error) {
    console.error('Delete payment method error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = user.savedPaymentMethods.id(req.params.methodId);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    user.savedPaymentMethods.forEach(item => {
      item.isDefault = String(item._id) === String(paymentMethod._id);
    });
    user.defaultPaymentMethodId = paymentMethod._id;
    await user.save();

    res.json({ message: 'Default payment method updated', paymentMethods: user.savedPaymentMethods, defaultPaymentMethodId: user.defaultPaymentMethodId });
  } catch (error) {
    console.error('Default payment method error:', error.message);
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

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Refresh access token using a valid refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const tokenHash = hashToken(refreshToken);

    if (decoded.type !== 'user') {
      return res.status(403).json({ message: 'Invalid refresh token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash || user.refreshTokenHash !== tokenHash) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const accessToken = jwt.sign(
      { user: { id: user.id, isAdmin: false } },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    res.json({
      token: accessToken,
      user: buildPublicUser(user, false)
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout user by revoking stored refresh token
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (decoded.type !== 'user') {
      return res.status(200).json({ message: 'Logged out' });
    }

    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
    }

    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(200).json({ message: 'Logged out' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  getSavedAddresses,
  saveAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  getSavedPaymentMethods,
  savePaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout
};