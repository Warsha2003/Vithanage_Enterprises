const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  images: [{
    type: String,
    trim: true
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    comment: {
      type: String,
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    respondedAt: {
      type: Date
    }
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isReported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1 });

// Virtual for review age
reviewSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Static method to calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { 
        product: mongoose.Types.ObjectId(productId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const result = stats[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratings.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(result.avgRating * 10) / 10,
      totalReviews: result.totalReviews,
      distribution: distribution
    };
  } else {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

// Instance method to check if user can edit review (within 30 days)
reviewSchema.methods.canEdit = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.createdAt > thirtyDaysAgo;
};

// Pre-save middleware to ensure user has purchased the product
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    // TEMPORARY: Skip order validation for testing
    // TODO: Uncomment this when you have proper orders
    /*
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: this.order,
      user: this.user,
      'items.product': this.product,
      $or: [
        { 'processing.step': 'finished' },
        { status: 'approved' }
      ]
    });
    
    if (!order) {
      return next(new Error('You can only review products from completed/approved orders'));
    }
    */

    // Check if user already reviewed this product
    const existingReview = await this.constructor.findOne({
      user: this.user,
      product: this.product
    });

    if (existingReview) {
      return next(new Error('You have already reviewed this product'));
    }
  }
  next();
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    ratingDistribution: stats.distribution
  });
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    ratingDistribution: stats.distribution
  });
});

module.exports = mongoose.model('Review', reviewSchema);