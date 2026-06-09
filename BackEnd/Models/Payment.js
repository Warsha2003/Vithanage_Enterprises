const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guestEmail: { type: String },
  guestName: { type: String },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  // Payment gateway details
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true,
    default: 'card'
  },
  // Stripe payment intent ID
  stripePaymentIntentId: {
    type: String
  },
  // Stripe charge ID (for completed payments)
  stripeChargeId: {
    type: String
  },
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    required: true
  },
  // Amount details
  amount: {
    total: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  },
  // Card details (for display, not storing full card number)
  cardDetails: {
    brand: String,      // visa, mastercard, amex, etc.
    last4: String,      // last 4 digits
    expMonth: Number,
    expYear: Number
  },
  savedPaymentMethodId: { type: mongoose.Schema.Types.ObjectId, default: null },
  savedPaymentMethodLabel: { type: String },
  providerPaymentMethodId: { type: String },
  // Billing address
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  // Payment metadata
  metadata: {
    customerEmail: String,
    customerName: String,
    customerPhone: String,
    ipAddress: String,
    userAgent: String
  },
  // Error handling
  errorMessage: String,
  errorCode: String,
  // Refund information
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date
  },
  // Timestamps for payment lifecycle
  attemptedAt: { type: Date, default: Date.now },
  succeededAt: Date,
  failedAt: Date,
  refundedAt: Date
}, { timestamps: true });

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ guestEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
