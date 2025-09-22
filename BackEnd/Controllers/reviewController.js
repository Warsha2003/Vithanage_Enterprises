const Review = require('../Models/Review');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const User = require('../Models/User');
const mongoose = require('mongoose');

// Helper function to get user ID from req.user (handles both _id and id formats)
const getUserId = (user) => {
  return user._id || user.id;
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const rating = req.query.rating;

    const query = { 
      product: productId, 
      isApproved: true 
    };

    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ [sort]: order })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments(query);
    const stats = await Review.calculateAverageRating(productId);

    res.json({
      success: true,
      data: {
        reviews,
        stats,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = getUserId(req.user);

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name image price')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        reviews,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your reviews',
      error: error.message
    });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment, title, images } = req.body;

    console.log('=== CREATE REVIEW DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    console.log('productId:', productId);
    console.log('userId from req.user:', req.user?._id);

    // Validate required fields
    if (!productId || !rating || !comment || !title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // TEMPORARY: Skip order check for testing
    // TODO: Uncomment this when you have test orders
    /*
    // Check if order exists and belongs to user
    let order;
    if (orderId) {
      order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        'items.product': productId,
        $or: [
          { 'processing.step': 'finished' },
          { status: 'approved' }
        ]
      });
    } else {
      // Find any completed order containing this product
      order = await Order.findOne({
        user: req.user._id,
        'items.product': productId,
        $or: [
          { 'processing.step': 'finished' },
          { status: 'approved' }
        ]
      });
    }

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products from completed/approved orders'
      });
    }
    */
    
    // Create fake order for review (temporary) - use proper ObjectId
    const fakeOrderId = new mongoose.Types.ObjectId();

    // Check if user already reviewed this product
    const currentUserId = req.user._id || req.user.id;
    const existingReview = await Review.findOne({
      user: currentUserId,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Ensure user is properly set
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Handle both _id and id formats
    const userId = req.user._id || req.user.id;
    console.log('About to create review with userId:', userId);

    const review = new Review({
      user: userId,
      product: productId,
      order: fakeOrderId,
      rating,
      comment,
      title,
      images: images || []
    });

    console.log('Review object created:', review);

    console.log('About to save review...');
    await review.save();
    console.log('Review saved successfully!');

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('product', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    console.error('=== CREATE REVIEW ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating review'
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, title, images } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if review belongs to user
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Check if review can be edited (within 30 days)
    if (!review.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be edited within 30 days of creation'
      });
    }

    // Update fields if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (title !== undefined) review.title = title;
    if (images !== undefined) review.images = images;

    await review.save();

    const updatedReview = await Review.findById(id)
      .populate('user', 'name email')
      .populate('product', 'name');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating review'
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if review belongs to user
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.remove();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// @desc    Like/Unlike a review
// @route   POST /api/reviews/:id/like
// @access  Private
const toggleReviewLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const likedIndex = review.likedBy.indexOf(userId);

    if (likedIndex > -1) {
      // User already liked, so unlike
      review.likedBy.splice(likedIndex, 1);
      review.likes = review.likedBy.length;
    } else {
      // User hasn't liked, so like
      review.likedBy.push(userId);
      review.likes = review.likedBy.length;
    }

    await review.save();

    res.json({
      success: true,
      message: likedIndex > -1 ? 'Review unliked' : 'Review liked',
      data: {
        likes: review.likes,
        isLiked: likedIndex === -1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review like',
      error: error.message
    });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for reporting'
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reportedBy.find(
      report => report.user.toString() === userId.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    review.reportedBy.push({
      user: userId,
      reason,
      reportedAt: new Date()
    });

    review.isReported = true;

    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
};

// @desc    Check if user can review a specific product
// @route   GET /api/reviews/can-review/:productId
// @access  Private
const getReviewableProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        message: 'You have already reviewed this product'
      });
    }

    // TEMPORARY: Allow reviews without purchase for testing
    // TODO: Uncomment this when you have test orders
    /*
    // Check if user has purchased this product in a completed order
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      $or: [
        { 'processing.step': 'finished' },
        { status: 'approved' }
      ]
    });

    if (!deliveredOrder) {
      return res.json({
        success: true,
        canReview: false,
        message: 'You can only review products you have purchased'
      });
    }
    */

    res.json({
      success: true,
      canReview: true,
      message: 'You can review this product'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviewable products',
      error: error.message
    });
  }
};

module.exports = {
  getProductReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewLike,
  reportReview,
  getReviewableProducts
};