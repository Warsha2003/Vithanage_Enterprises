const Warranty = require('../Models/Warranty');
const Order = require('../Models/Order');
const Product = require('../Models/Product');

// Create warranty when order is delivered
exports.createWarrantyForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('items.product');
    
    if (!order || order.status !== 'delivered') return;

    const warranties = [];
    
    for (const item of order.items) {
      if (!item.product) continue;
      
      // Get warranty period from product or default to 12 months
      const warrantyMonths = item.product.warrantyMonths || 12;
      
      const purchaseDate = order.deliveredAt || order.updatedAt || new Date();
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

      // Check if warranty already exists
      const existingWarranty = await Warranty.findOne({
        order: order._id,
        product: item.product._id
      });

      if (!existingWarranty) {
        const warranty = await Warranty.create({
          user: order.user._id || order.user,
          order: order._id,
          product: item.product._id,
          productName: item.product.name,
          warrantyPeriodMonths: warrantyMonths,
          purchaseDate,
          expiryDate,
          status: 'active'
        });
        warranties.push(warranty);
      }
    }

    return warranties;
  } catch (error) {
    console.error('Create warranty error:', error);
  }
};

// Get user's warranties
exports.getMyWarranties = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const warranties = await Warranty.find(query)
      .populate('product', 'name imageUrl brand category')
      .populate('order', 'total createdAt')
      .sort({ expiryDate: 1 });

    // Update expired warranties
    const now = new Date();
    for (const warranty of warranties) {
      if (warranty.status === 'active' && warranty.expiryDate < now) {
        warranty.status = 'expired';
        await warranty.save();
      }
    }

    // Categorize warranties
    const active = warranties.filter(w => w.status === 'active' && w.expiryDate > now);
    const expiringSoon = active.filter(w => {
      const daysLeft = Math.ceil((w.expiryDate - now) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30;
    });
    const expired = warranties.filter(w => w.status === 'expired' || w.expiryDate <= now);

    res.json({
      warranties,
      summary: {
        total: warranties.length,
        active: active.length,
        expiringSoon: expiringSoon.length,
        expired: expired.length
      }
    });
  } catch (error) {
    console.error('Get warranties error:', error);
    res.status(500).json({ message: 'Failed to get warranties' });
  }
};

// Get single warranty details
exports.getWarrantyById = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { id } = req.params;

    const warranty = await Warranty.findOne({ _id: id, user: userId })
      .populate('product', 'name imageUrl brand category description')
      .populate('order', 'total createdAt items');

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((warranty.expiryDate - now) / (1000 * 60 * 60 * 24)));

    res.json({
      ...warranty.toObject(),
      daysRemaining,
      isActive: warranty.status === 'active' && warranty.expiryDate > now
    });
  } catch (error) {
    console.error('Get warranty error:', error);
    res.status(500).json({ message: 'Failed to get warranty details' });
  }
};

// Submit warranty claim
exports.submitClaim = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ message: 'Issue description is required' });
    }

    const warranty = await Warranty.findOne({ _id: id, user: userId });
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    // Check if warranty is still active
    if (warranty.status !== 'active' || warranty.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Warranty has expired' });
    }

    // Add claim
    warranty.claims.push({
      issue,
      status: 'pending'
    });
    await warranty.save();

    res.json({
      success: true,
      message: 'Warranty claim submitted successfully',
      warranty
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ message: 'Failed to submit warranty claim' });
  }
};

// Admin: Get all warranty claims
exports.getAllClaims = async (req, res) => {
  try {
    const { status } = req.query;

    const warranties = await Warranty.find({
      'claims.0': { $exists: true }
    })
      .populate('user', 'name email phone')
      .populate('product', 'name imageUrl')
      .sort({ 'claims.claimDate': -1 });

    // Flatten claims with warranty info
    let claims = [];
    for (const warranty of warranties) {
      for (const claim of warranty.claims) {
        if (!status || claim.status === status) {
          claims.push({
            warrantyId: warranty._id,
            claimId: claim._id,
            user: warranty.user,
            product: warranty.product,
            productName: warranty.productName,
            purchaseDate: warranty.purchaseDate,
            expiryDate: warranty.expiryDate,
            ...claim.toObject()
          });
        }
      }
    }

    // Sort by claim date
    claims.sort((a, b) => new Date(b.claimDate) - new Date(a.claimDate));

    res.json(claims);
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({ message: 'Failed to get claims' });
  }
};

// Admin: Update claim status
exports.updateClaimStatus = async (req, res) => {
  try {
    const { warrantyId, claimId } = req.params;
    const { status, resolution } = req.body;

    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    const claim = warranty.claims.id(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    claim.status = status;
    if (resolution) {
      claim.resolution = resolution;
    }
    if (status === 'completed') {
      claim.resolvedDate = new Date();
    }

    await warranty.save();

    res.json({
      success: true,
      message: 'Claim status updated',
      claim
    });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ message: 'Failed to update claim' });
  }
};

// Check warranty by product/order (public endpoint)
exports.checkWarranty = async (req, res) => {
  try {
    const { orderId, productId, email } = req.query;

    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    const order = await Order.findById(orderId).populate('user');
    if (!order || order.user.email !== email) {
      return res.status(404).json({ message: 'Order not found or email does not match' });
    }

    const query = { order: orderId };
    if (productId) {
      query.product = productId;
    }

    const warranties = await Warranty.find(query)
      .populate('product', 'name imageUrl');

    res.json(warranties);
  } catch (error) {
    console.error('Check warranty error:', error);
    res.status(500).json({ message: 'Failed to check warranty' });
  }
};
