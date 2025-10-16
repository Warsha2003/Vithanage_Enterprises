const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'Defective Product',
            'Wrong Item Received',
            'Not as Described',
            'Damaged During Shipping',
            'Changed Mind',
            'Size/Color Issue',
            'Late Delivery',
            'Other'
        ]
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    refundAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Processing', 'Completed'],
        default: 'Pending'
    },
    adminResponse: {
        type: String,
        maxlength: 500
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    images: [{
        url: String,
        description: String
    }],
    refundMethod: {
        type: String,
        enum: ['Original Payment Method', 'Bank Transfer', 'Store Credit'],
        default: 'Original Payment Method'
    },
    estimatedProcessingDays: {
        type: Number,
        default: 7
    },
    actualProcessingDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ orderId: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

// Calculate refund statistics
refundSchema.statics.getRefundStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$refundAmount' }
            }
        }
    ]);
    
    const totalRefunds = await this.countDocuments();
    const pendingRefunds = await this.countDocuments({ status: 'Pending' });
    const approvedRefunds = await this.countDocuments({ status: 'Approved' });
    const rejectedRefunds = await this.countDocuments({ status: 'Rejected' });
    const processingRefunds = await this.countDocuments({ status: 'Processing' });
    const completedRefunds = await this.countDocuments({ status: 'Completed' });
    
    // Calculate average processing time in days for completed refunds
    const processingTimeStats = await this.aggregate([
        {
            $match: { 
                status: 'Completed',
                actualProcessingDate: { $exists: true }
            }
        },
        {
            $project: {
                processingDays: {
                    $divide: [
                        { $subtract: ['$actualProcessingDate', '$createdAt'] },
                        1000 * 60 * 60 * 24 // Convert milliseconds to days
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                avgProcessingTime: { $avg: '$processingDays' }
            }
        }
    ]);
    
    const avgProcessingTime = processingTimeStats.length > 0 
        ? Math.round(processingTimeStats[0].avgProcessingTime) 
        : 0;
    
    return {
        total: totalRefunds,
        pending: pendingRefunds,
        approved: approvedRefunds,
        rejected: rejectedRefunds,
        processing: processingRefunds,
        completed: completedRefunds,
        avgProcessingTime,
        byStatus: stats
    };
};

// Get refunds by user
refundSchema.statics.getUserRefunds = async function(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const refunds = await this.find({ userId })
        .populate('orderId', 'orderNumber totalAmount createdAt')
        .populate('productId', 'name imageUrl price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await this.countDocuments({ userId });
    
    return {
        refunds,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
    };
};

// Check if refund is eligible
refundSchema.statics.isRefundEligible = async function(orderId, productId) {
    const Order = mongoose.model('Order');
    
    const order = await Order.findById(orderId);
    if (!order) return { eligible: false, reason: 'Order not found' };
    
    // Check if order is approved and completed
    const eligibleStatuses = ['Delivered', 'approved'];
    const isFinishedProcessing = order.status === 'approved' && order.processing && order.processing.step === 'finished';
    
    // Explicitly reject refunds for rejected orders
    if (order.status === 'rejected' || order.status === 'cancelled') {
        return { eligible: false, reason: 'Cannot request refund for rejected or cancelled orders' };
    }
    
    if (!eligibleStatuses.includes(order.status) && !isFinishedProcessing) {
        return { eligible: false, reason: 'Order must be approved and completed to request refund' };
    }
    
    // Check if refund period (30 days) has passed
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = Math.floor((new Date() - deliveryDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 30) {
        return { eligible: false, reason: 'Refund period (30 days) has expired' };
    }
    
    // Check if refund already exists
    const existingRefund = await this.findOne({ 
        orderId, 
        productId, 
        status: { $in: ['Pending', 'Approved', 'Processing'] }
    });
    
    if (existingRefund) {
        return { eligible: false, reason: 'Refund request already exists for this item' };
    }
    
    return { eligible: true, daysSinceDelivery };
};

module.exports = mongoose.model('Refund', refundSchema);