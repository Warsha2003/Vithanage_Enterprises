const Review = require('../Models/Review');
const Product = require('../Models/Product');
const User = require('../Models/User');

// @desc    Get all reviews for admin
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let query = {};

    // Filter by status
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'reported') {
      query.isReported = true;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name image price')
      .populate('adminResponse.respondedBy', 'name')
      .sort({ [sort]: order })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments(query);

    // Get summary stats
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approvedReviews: {
            $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] }
          },
          pendingReviews: {
            $sum: { $cond: [{ $eq: ['$isApproved', false] }, 1, 0] }
          },
          reportedReviews: {
            $sum: { $cond: [{ $eq: ['$isReported', true] }, 1, 0] }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        stats: stats[0] || {
          totalReviews: 0,
          approvedReviews: 0,
          pendingReviews: 0,
          reportedReviews: 0,
          averageRating: 0
        },
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

// @desc    Get single review details for admin
// @route   GET /api/admin/reviews/:id
// @access  Private/Admin
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email phone createdAt')
      .populate('product', 'name image price category')
      .populate('order', 'orderNumber createdAt deliveredAt')
      .populate('adminResponse.respondedBy', 'name email')
      .populate('reportedBy.user', 'name email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// @desc    Approve/Disapprove a review
// @route   PUT /api/admin/reviews/:id/approval
// @access  Private/Admin
const updateReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isApproved = isApproved;
    await review.save();

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review approval',
      error: error.message
    });
  }
};

// @desc    Add admin response to review
// @route   POST /api/admin/reviews/:id/respond
// @access  Private/Admin
const addAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Response comment is required'
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.adminResponse = {
      comment,
      respondedBy: req.admin._id || req.admin.id,
      respondedAt: new Date()
    };

    await review.save();

    const updatedReview = await Review.findById(id)
      .populate('adminResponse.respondedBy', 'name');

    res.json({
      success: true,
      message: 'Admin response added successfully',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding admin response',
      error: error.message
    });
  }
};

// @desc    Delete admin response
// @route   DELETE /api/admin/reviews/:id/respond
// @access  Private/Admin
const deleteAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.adminResponse = undefined;
    await review.save();

    res.json({
      success: true,
      message: 'Admin response deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting admin response',
      error: error.message
    });
  }
};

// @desc    Delete a review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.deleteOne();

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

// @desc    Clear report flags from review
// @route   PUT /api/admin/reviews/:id/clear-reports
// @access  Private/Admin
const clearReviewReports = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.reportedBy = [];
    review.isReported = false;
    await review.save();

    res.json({
      success: true,
      message: 'Review reports cleared successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing review reports',
      error: error.message
    });
  }
};

// @desc    Get review analytics
// @route   GET /api/admin/reviews/analytics
// @access  Private/Admin
const getReviewAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await Review.aggregate([
      {
        $facet: {
          // Reviews by rating
          ratingDistribution: [
            { $match: { createdAt: { $gte: daysAgo } } },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Reviews over time
          reviewsOverTime: [
            { $match: { createdAt: { $gte: daysAgo } } },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Top reviewed products
          topReviewedProducts: [
            { $match: { createdAt: { $gte: daysAgo } } },
            {
              $group: {
                _id: '$product',
                reviewCount: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            {
              $project: {
                productName: '$product.name',
                reviewCount: 1,
                avgRating: { $round: ['$avgRating', 1] }
              }
            }
          ],

          // Most active reviewers
          activeReviewers: [
            { $match: { createdAt: { $gte: daysAgo } } },
            {
              $group: {
                _id: '$user',
                reviewCount: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            {
              $project: {
                userName: '$user.name',
                userEmail: '$user.email',
                reviewCount: 1,
                avgRating: { $round: ['$avgRating', 1] }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  updateReviewApproval,
  addAdminResponse,
  deleteAdminResponse,
  deleteReview,
  clearReviewReports,
  getReviewAnalytics
};