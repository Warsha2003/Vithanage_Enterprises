const Refund = require('../Models/Refund');
const Order = require('../Models/Order');
const User = require('../Models/User');

// Get all refund requests (admin)
const getAllRefunds = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (status && status !== 'All') {
            query.status = status;
        }

        // Get refunds with pagination
        const refunds = await Refund.find(query)
            .populate('userId', 'name email')
            .populate('orderId', 'orderNumber totalAmount createdAt')
            .populate('productId', 'name imageUrl price')
            .populate('adminId', 'name')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Refund.countDocuments(query);

        // Get refund statistics
        const stats = await Refund.getRefundStats();

        res.json({
            success: true,
            data: {
                refunds,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                stats
            }
        });

    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single refund details (admin)
const getRefundByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const refund = await Refund.findById(id)
            .populate('userId', 'name email phone')
            .populate('orderId', 'orderNumber totalAmount createdAt deliveredAt shippingAddress')
            .populate('productId', 'name imageUrl price category brand')
            .populate('adminId', 'name email');

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        res.json({
            success: true,
            data: refund
        });

    } catch (error) {
        console.error('Error fetching refund:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Approve refund request
const approveRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse, refundMethod, estimatedProcessingDays } = req.body;
        const adminId = req.user.id;

        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only approve pending refund requests'
            });
        }

        // Update refund status
        refund.status = 'Approved';
        refund.adminId = adminId;
        refund.adminResponse = adminResponse || 'Refund request has been approved';
        
        if (refundMethod) refund.refundMethod = refundMethod;
        if (estimatedProcessingDays) refund.estimatedProcessingDays = estimatedProcessingDays;

        await refund.save();

        // Populate for response
        await refund.populate('userId', 'name email');
        await refund.populate('productId', 'name');
        await refund.populate('adminId', 'name');

        res.json({
            success: true,
            message: 'Refund request approved successfully',
            data: refund
        });

    } catch (error) {
        console.error('Error approving refund:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Reject refund request
const rejectRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse } = req.body;
        const adminId = req.user.id;

        if (!adminResponse || adminResponse.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Admin response is required when rejecting a refund'
            });
        }

        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only reject pending refund requests'
            });
        }

        // Update refund status
        refund.status = 'Rejected';
        refund.adminId = adminId;
        refund.adminResponse = adminResponse;

        await refund.save();

        // Populate for response
        await refund.populate('userId', 'name email');
        await refund.populate('productId', 'name');
        await refund.populate('adminId', 'name');

        res.json({
            success: true,
            message: 'Refund request rejected',
            data: refund
        });

    } catch (error) {
        console.error('Error rejecting refund:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Mark refund as processing
const markRefundProcessing = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse } = req.body;
        const adminId = req.user.id;

        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Can only process approved refund requests'
            });
        }

        refund.status = 'Processing';
        refund.adminId = adminId;
        if (adminResponse) refund.adminResponse = adminResponse;

        await refund.save();

        res.json({
            success: true,
            message: 'Refund marked as processing',
            data: refund
        });

    } catch (error) {
        console.error('Error marking refund as processing:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Mark refund as completed
const completeRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminResponse } = req.body;
        const adminId = req.user.id;

        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Processing') {
            return res.status(400).json({
                success: false,
                message: 'Can only complete processing refund requests'
            });
        }

        refund.status = 'Completed';
        refund.adminId = adminId;
        refund.actualProcessingDate = new Date();
        if (adminResponse) refund.adminResponse = adminResponse;

        await refund.save();

        res.json({
            success: true,
            message: 'Refund completed successfully',
            data: refund
        });

    } catch (error) {
        console.error('Error completing refund:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get refund statistics for dashboard
const getRefundDashboardStats = async (req, res) => {
    try {
        const stats = await Refund.getRefundStats();
        
        // Additional analytics
        const todayRefunds = await Refund.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        const monthlyRefunds = await Refund.countDocuments({
            createdAt: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            }
        });

        // Average processing time for completed refunds
        const completedRefunds = await Refund.find({ 
            status: 'Completed',
            actualProcessingDate: { $exists: true }
        });

        let avgProcessingTime = 0;
        if (completedRefunds.length > 0) {
            const totalProcessingTime = completedRefunds.reduce((total, refund) => {
                const processingTime = Math.floor((refund.actualProcessingDate - refund.createdAt) / (1000 * 60 * 60 * 24));
                return total + processingTime;
            }, 0);
            avgProcessingTime = Math.round(totalProcessingTime / completedRefunds.length);
        }

        res.json({
            success: true,
            data: {
                ...stats,
                todayRefunds,
                monthlyRefunds,
                avgProcessingTime
            }
        });

    } catch (error) {
        console.error('Error fetching refund dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk update refund status
const bulkUpdateRefundStatus = async (req, res) => {
    try {
        const { refundIds, status, adminResponse } = req.body;
        const adminId = req.user.id;

        if (!refundIds || !Array.isArray(refundIds) || refundIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Refund IDs are required'
            });
        }

        if (!status || !['Approved', 'Rejected', 'Processing', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        const updateData = {
            status,
            adminId,
            ...(adminResponse && { adminResponse }),
            ...(status === 'Completed' && { actualProcessingDate: new Date() })
        };

        const result = await Refund.updateMany(
            { 
                _id: { $in: refundIds },
                status: status === 'Approved' ? 'Pending' : 
                       status === 'Processing' ? 'Approved' : 
                       status === 'Completed' ? 'Processing' : 'Pending'
            },
            updateData
        );

        res.json({
            success: true,
            message: `Updated ${result.modifiedCount} refund requests`,
            data: { updated: result.modifiedCount }
        });

    } catch (error) {
        console.error('Error bulk updating refunds:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllRefunds,
    getRefundByIdAdmin,
    approveRefund,
    rejectRefund,
    markRefundProcessing,
    completeRefund,
    getRefundDashboardStats,
    bulkUpdateRefundStatus
};