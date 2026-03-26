const mongoose = require('mongoose');

const productBundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  // Original total price (sum of all products)
  originalPrice: {
    type: Number,
    required: true
  },
  // Discounted bundle price
  bundlePrice: {
    type: Number,
    required: true
  },
  // Discount percentage
  discountPercent: {
    type: Number,
    default: 0
  },
  // Bundle image (optional, can use first product image)
  imageUrl: {
    type: String
  },
  // Is bundle active?
  isActive: {
    type: Boolean,
    default: true
  },
  // Valid date range
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  // Track how many times bundle was purchased
  purchaseCount: {
    type: Number,
    default: 0
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

// Virtual for savings amount
productBundleSchema.virtual('savings').get(function() {
  return this.originalPrice - this.bundlePrice;
});

// Update timestamps
productBundleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtuals are included in JSON
productBundleSchema.set('toJSON', { virtuals: true });
productBundleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductBundle', productBundleSchema);
