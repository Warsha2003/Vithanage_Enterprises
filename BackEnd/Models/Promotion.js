const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  // Basic Promotion Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minLength: 3,
    maxLength: 20
  },
  
  // Promotion Type
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
    required: true
  },
  
  // Discount Details
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null // For percentage discounts, cap the maximum discount
  },
  
  // Conditions
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsageCount: {
    type: Number,
    default: null // null = unlimited usage
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsagePerUser: {
    type: Number,
    default: 1
  },
  
  // Validity Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Applicable Products/Categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  isApplicableToAll: {
    type: Boolean,
    default: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage Tracking
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderValue: {
      type: Number
    },
    discountApplied: {
      type: Number
    }
  }],
  
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for checking if promotion is currently valid
promotionSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (this.maxUsageCount === null || this.usageCount < this.maxUsageCount);
});

// Method to check if user can use this promotion
promotionSchema.methods.canUserUse = function(userId) {
  if (!this.isCurrentlyValid) return false;
  
  const userUsageCount = this.usedBy.filter(usage => 
    usage.user.toString() === userId.toString()
  ).length;
  
  return userUsageCount < this.maxUsagePerUser;
};

// Method to calculate discount for given order value
promotionSchema.methods.calculateDiscount = function(orderValue, products = []) {
  if (!this.isCurrentlyValid) return 0;
  if (orderValue < this.minimumOrderValue) return 0;
  
  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (orderValue * this.discountValue) / 100;
      if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
        discount = this.maxDiscountAmount;
      }
      break;
      
    case 'fixed_amount':
      discount = Math.min(this.discountValue, orderValue);
      break;
      
    case 'free_shipping':
      // This should be handled in shipping calculation
      discount = 0;
      break;
      
    case 'buy_x_get_y':
      // This requires more complex logic based on products
      discount = 0;
      break;
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Static method to get active promotions
promotionSchema.statics.getActivePromotions = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { maxUsageCount: null },
      { $expr: { $lt: ['$usageCount', '$maxUsageCount'] } }
    ]
  }).populate('applicableProducts');
};

// Static method to validate promotion code
promotionSchema.statics.validateCode = async function(code, userId, orderValue, products = []) {
  const promotion = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  }).populate('applicableProducts');
  
  if (!promotion) {
    return { valid: false, message: 'Invalid promotion code' };
  }
  
  if (!promotion.isCurrentlyValid) {
    return { valid: false, message: 'Promotion code has expired or is not active' };
  }
  
  if (!promotion.canUserUse(userId)) {
    return { valid: false, message: 'You have already used this promotion code' };
  }
  
  if (orderValue < promotion.minimumOrderValue) {
    return { 
      valid: false, 
      message: `Minimum order value of $${promotion.minimumOrderValue} required` 
    };
  }
  
  const discountAmount = promotion.calculateDiscount(orderValue, products);
  
  return {
    valid: true,
    promotion: promotion,
    discountAmount: discountAmount,
    message: `Discount of $${discountAmount} applied`
  };
};

// Pre-save middleware to ensure end date is after start date
promotionSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

// Index for performance (code already has unique index from schema definition)
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
promotionSchema.index({ createdBy: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;