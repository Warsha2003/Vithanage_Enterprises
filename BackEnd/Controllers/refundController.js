const Refund = require('../Models/Refund');
const Order = require('../Models/Order');
const Product = require('../Models/Product');

// Create refund request
const createRefundRequest = async (req, res) => {
    try {
        const { orderId, productId, reason, description, refundAmount } = req.body;
        const userId = req.user.id;

        console.log('Creating refund request:', { 
            orderId, 
            productId, 
            userId, 
            reason, 
            refundAmount 
        });
        console.log('User object:', req.user);
        console.log('Admin object:', req.admin);

        // Validate required fields
        if (!orderId || !productId || !reason || !description || !refundAmount) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check refund eligibility
        const eligibilityCheck = await Refund.isRefundEligible(orderId, productId);
        if (!eligibilityCheck.eligible) {
            return res.status(400).json({
                success: false,
                message: eligibilityCheck.reason
            });
        }

        // Verify order belongs to user
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            console.log('Order lookup failed:', { orderId, userId });
            return res.status(404).json({
                success: false,
                message: 'Order not found or does not belong to you'
            });
        }

        // Verify product exists in order (check both product and productId fields)
        const orderItem = order.items.find(item => 
            (item.product && item.product.toString() === productId) ||
            (item.productId && item.productId.toString() === productId)
        );
        if (!orderItem) {
            console.log('Product not found in order:', { 
                productId, 
                orderItems: order.items.map(item => ({ 
                    product: item.product, 
                    productId: item.productId, 
                    name: item.name 
                }))
            });
            return res.status(400).json({
                success: false,
                message: 'Product not found in this order'
            });
        }

        // Validate refund amount doesn't exceed item price
        const maxRefundAmount = orderItem.price * orderItem.quantity;
        if (refundAmount > maxRefundAmount) {
            return res.status(400).json({
                success: false,
                message: `Refund amount cannot exceed ${maxRefundAmount}`
            });
        }

        // Create refund request
        const refund = new Refund({
            orderId,
            userId,
            productId,
            reason,
            description,
            refundAmount
        });

        await refund.save();

        // Populate the refund with related data
        await refund.populate('orderId', 'orderNumber totalAmount createdAt');
        await refund.populate('productId', 'name imageUrl price');

        res.status(201).json({
            success: true,
            message: 'Refund request created successfully',
            data: refund
        });

    } catch (error) {
        console.error('Error creating refund request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user's refund requests
const getUserRefunds = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await Refund.getUserRefunds(userId, page, limit);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching user refunds:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single refund details
const getRefundById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const refund = await Refund.findOne({ _id: id, userId })
            .populate('orderId', 'orderNumber totalAmount createdAt deliveredAt')
            .populate('productId', 'name imageUrl price')
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

// Update refund request (only if pending)
const updateRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, description, refundAmount } = req.body;
        const userId = req.user.id;

        const refund = await Refund.findOne({ _id: id, userId });

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update refund request that is not pending'
            });
        }

        // Update fields
        if (reason) refund.reason = reason;
        if (description) refund.description = description;
        if (refundAmount) {
            // Validate refund amount
            const order = await Order.findById(refund.orderId);
            const orderItem = order.items.find(item => item.productId.toString() === refund.productId.toString());
            const maxRefundAmount = orderItem.price * orderItem.quantity;
            
            if (refundAmount > maxRefundAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Refund amount cannot exceed ${maxRefundAmount}`
                });
            }
            refund.refundAmount = refundAmount;
        }

        await refund.save();

        res.json({
            success: true,
            message: 'Refund request updated successfully',
            data: refund
        });

    } catch (error) {
        console.error('Error updating refund request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Cancel refund request (only if pending)
const cancelRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const refund = await Refund.findOne({ _id: id, userId });

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Refund request not found'
            });
        }

        if (refund.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel refund request that is not pending'
            });
        }

        await refund.deleteOne();

        res.json({
            success: true,
            message: 'Refund request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling refund request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check refund eligibility for an order item
const checkRefundEligibility = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const userId = req.user.id;

        console.log('Checking eligibility for:', { orderId, productId, userId });

        // Verify order belongs to user
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            console.log('Order not found for user:', userId);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log('Order found:', { 
            orderId: order._id, 
            status: order.status, 
            processing: order.processing 
        });

        const eligibilityCheck = await Refund.isRefundEligible(orderId, productId);
        
        console.log('Eligibility result:', eligibilityCheck);

        res.json({
            success: true,
            data: eligibilityCheck
        });

    } catch (error) {
        console.error('Error checking refund eligibility:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createRefundRequest,
    getUserRefunds,
    getRefundById,
    updateRefundRequest,
    cancelRefundRequest,
    checkRefundEligibility
};