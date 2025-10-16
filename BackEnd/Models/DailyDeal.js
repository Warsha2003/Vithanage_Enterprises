const mongoose = require('mongoose');

const dailyDealSchema = new mongoose.Schema({
  dealTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  dealPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value < this.originalPrice;
      },
      message: 'Deal price must be less than original price'
    }
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  dealQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  dealType: {
    type: String,
    enum: ['flash', 'daily', 'weekend', 'limited'],
    default: 'daily'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
dailyDealSchema.index({ startDate: 1, endDate: 1 });
dailyDealSchema.index({ isActive: 1 });
dailyDealSchema.index({ productId: 1 });
dailyDealSchema.index({ dealType: 1 });

// Virtual for remaining quantity
dailyDealSchema.virtual('remainingQuantity').get(function() {
  return Math.max(0, this.dealQuantity - this.soldQuantity);
});

// Virtual for deal status (active, expired, upcoming)
dailyDealSchema.virtual('dealStatus').get(function() {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'expired';
  if (this.remainingQuantity <= 0) return 'soldout';
  return 'active';
});

// Virtual for savings amount
dailyDealSchema.virtual('savingsAmount').get(function() {
  return this.originalPrice - this.dealPrice;
});

// Pre-save middleware to calculate discount percentage
dailyDealSchema.pre('save', function(next) {
  if (this.originalPrice && this.dealPrice) {
    this.discountPercentage = Math.round(((this.originalPrice - this.dealPrice) / this.originalPrice) * 100);
  }
  next();
});

// Static method to find active deals
dailyDealSchema.statics.findActiveDeals = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('productId', 'name description images category price stock')
    .sort({ createdAt: -1 });
};

// Static method to find deals by status
dailyDealSchema.statics.findByStatus = function(status) {
  const now = new Date();
  let query = {};
  
  switch(status) {
    case 'active':
      query = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      };
      break;
    case 'upcoming':
      query = {
        isActive: true,
        startDate: { $gt: now }
      };
      break;
    case 'expired':
      query = {
        endDate: { $lt: now }
      };
      break;
    case 'inactive':
      query = { isActive: false };
      break;
    default:
      query = {};
  }
  
  return this.find(query)
    .populate('productId', 'name description images category price stock')
    .sort({ createdAt: -1 });
};

// Instance method to check if deal is currently active
dailyDealSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now && 
         this.remainingQuantity > 0;
};

// Instance method to reserve quantity for purchase
dailyDealSchema.methods.reserveQuantity = function(quantity) {
  if (this.remainingQuantity >= quantity) {
    this.soldQuantity += quantity;
    return this.save();
  } else {
    throw new Error('Not enough quantity available for this deal');
  }
};

// Ensure virtuals are included in JSON output
dailyDealSchema.set('toJSON', { virtuals: true });
dailyDealSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DailyDeal', dailyDealSchema);