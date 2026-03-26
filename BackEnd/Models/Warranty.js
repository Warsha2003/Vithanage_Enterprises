const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String
  },
  warrantyPeriodMonths: {
    type: Number,
    required: true,
    default: 12
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'claimed', 'void'],
    default: 'active'
  },
  claims: [{
    claimDate: {
      type: Date,
      default: Date.now
    },
    issue: String,
    resolution: String,
    resolvedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual to check if warranty is currently active
warrantySchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() < this.expiryDate;
});

// Virtual for days remaining
warrantySchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Index for querying user warranties
warrantySchema.index({ user: 1, expiryDate: -1 });
warrantySchema.index({ expiryDate: 1, status: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);
