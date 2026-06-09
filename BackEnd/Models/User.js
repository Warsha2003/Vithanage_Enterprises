const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
});

const AddressSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: 'Home' },
  recipientName: { type: String, trim: true },
  phone: { type: String, trim: true },
  addressLine1: { type: String, trim: true, required: true },
  addressLine2: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, required: true },
  state: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, required: true },
  country: { type: String, trim: true, default: 'Sri Lanka' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const SavedPaymentMethodSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: 'Card' },
  provider: { type: String, trim: true, default: 'stripe' },
  type: { type: String, enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'], default: 'card' },
  providerPaymentMethodId: { type: String, trim: true },
  brand: { type: String, trim: true },
  last4: { type: String, trim: true },
  expMonth: { type: Number },
  expYear: { type: Number },
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  postalCode: {
    type: String
  },
  country: {
    type: String,
    default: 'Sri Lanka'
  },
  addresses: [AddressSchema],
  savedPaymentMethods: [SavedPaymentMethodSchema],
  defaultAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  defaultPaymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  cart: [CartItemSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Loyalty Points
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  // Social login fields
  googleId: {
    type: String,
    sparse: true
  },
  facebookId: {
    type: String,
    sparse: true
  },
  profilePicture: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // SMS preferences
  smsNotifications: {
    type: Boolean,
    default: true
  },
  // Push notification preferences
  pushNotifications: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  refreshTokenHash: {
    type: String
  },
  refreshTokenExpiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);