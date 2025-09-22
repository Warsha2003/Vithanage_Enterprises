const Promotion = require('../Models/Promotion');
const Product = require('../Models/Product');
const mongoose = require('mongoose');

// Get all promotions (admin only)
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('createdBy', 'username email')
      .populate('applicableProducts', 'name price')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      error: error.message
    });
  }
};

// Get active promotions (public)
const getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.getActivePromotions();
    
    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active promotions',
      error: error.message
    });
  }
};

// Get promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID'
      });
    }
    
    const promotion = await Promotion.findById(id)
      .populate('createdBy', 'username email')
      .populate('applicableProducts', 'name price category');
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotion',
      error: error.message
    });
  }
};

// Create new promotion
const createPromotion = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      type,
      discountValue,
      maxDiscountAmount,
      minimumOrderValue,
      maxUsageCount,
      maxUsagePerUser,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
      isApplicableToAll
    } = req.body;
    
    // Validation
    if (!name || !description || !code || !type || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: code.toUpperCase() 
    });
    
    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }
    
    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Validate discount value based on type
    if (type === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      });
    }
    
    if (type === 'fixed_amount' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed amount discount must be greater than 0'
      });
    }
    
    // Get admin ID - handle both admin and user tokens
    let adminId;
    if (req.admin && req.admin.id) {
      adminId = req.admin.id;
    } else if (req.user && req.user.id) {
      // If logged in as user, find or create a default admin entry
      const Admin = require('../Models/Admin');
      let defaultAdmin = await Admin.findOne({ email: 'admin@vithanage.com' });
      if (!defaultAdmin) {
        defaultAdmin = new Admin({
          name: 'System Admin',
          email: 'admin@vithanage.com',
          password: 'admin123',
          role: 'admin'
        });
        await defaultAdmin.save();
      }
      adminId = defaultAdmin._id;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Create promotion
    const promotion = new Promotion({
      name,
      description,
      code: code.toUpperCase(),
      type,
      discountValue,
      maxDiscountAmount: maxDiscountAmount || null,
      minimumOrderValue: minimumOrderValue || 0,
      maxUsageCount: maxUsageCount || null,
      maxUsagePerUser: maxUsagePerUser || 1,
      startDate,
      endDate,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      isApplicableToAll: isApplicableToAll !== undefined ? isApplicableToAll : true,
      createdBy: adminId
    });
    
    const savedPromotion = await promotion.save();
    await savedPromotion.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: savedPromotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating promotion',
      error: error.message
    });
  }
};

// Update promotion
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID'
      });
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    // Check if trying to update code and if it conflicts
    if (updateData.code && updateData.code.toUpperCase() !== promotion.code) {
      const existingPromotion = await Promotion.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'Promotion code already exists'
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }
    
    // Validate dates if provided
    const startDate = updateData.startDate || promotion.startDate;
    const endDate = updateData.endDate || promotion.endDate;
    
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Validate discount value if type is being updated
    const type = updateData.type || promotion.type;
    const discountValue = updateData.discountValue || promotion.discountValue;
    
    if (type === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      });
    }
    
    if (type === 'fixed_amount' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed amount discount must be greater than 0'
      });
    }
    
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email')
     .populate('applicableProducts', 'name price');
    
    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: updatedPromotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating promotion',
      error: error.message
    });
  }
};

// Delete promotion
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID'
      });
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    // Check if promotion has been used
    if (promotion.usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete promotion that has been used. Consider deactivating it instead.'
      });
    }
    
    await Promotion.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting promotion',
      error: error.message
    });
  }
};

// Toggle promotion status (activate/deactivate)
const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID'
      });
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    promotion.isActive = !promotion.isActive;
    await promotion.save();
    
    res.status(200).json({
      success: true,
      message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`,
      data: promotion
    });
  } catch (error) {
    console.error('Error toggling promotion status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling promotion status',
      error: error.message
    });
  }
};

// Validate promotion code (for checkout)
const validatePromotionCode = async (req, res) => {
  try {
    const { code, orderValue, products } = req.body;
    const userId = req.user ? req.user._id : null;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code is required'
      });
    }
    
    if (!orderValue || orderValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid order value is required'
      });
    }
    
    const result = await Promotion.validateCode(code, userId, orderValue, products);
    
    if (result.valid) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          promotionId: result.promotion._id,
          discountAmount: result.discountAmount,
          promotion: result.promotion
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error validating promotion code:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating promotion code',
      error: error.message
    });
  }
};

// Get promotion usage statistics
const getPromotionStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID'
      });
    }
    
    const promotion = await Promotion.findById(id)
      .populate('usedBy.user', 'username email');
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    const stats = {
      totalUsage: promotion.usageCount,
      maxUsage: promotion.maxUsageCount,
      usagePercentage: promotion.maxUsageCount ? 
        (promotion.usageCount / promotion.maxUsageCount * 100).toFixed(2) : null,
      totalDiscountGiven: promotion.usedBy.reduce((total, usage) => 
        total + (usage.discountApplied || 0), 0),
      averageOrderValue: promotion.usedBy.length > 0 ? 
        promotion.usedBy.reduce((total, usage) => total + (usage.orderValue || 0), 0) / promotion.usedBy.length : 0,
      recentUsages: promotion.usedBy.slice(-10).reverse() // Last 10 usages
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching promotion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotion stats',
      error: error.message
    });
  }
};

// Apply promotion to order
const applyPromotionToOrder = async (req, res) => {
  try {
    const { code, orderValue, products, userId } = req.body;
    
    if (!code || !orderValue || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Code, order value, and user ID are required'
      });
    }

    // Validate the promotion code
    const result = await Promotion.validateCode(code, userId, orderValue, products);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update promotion usage count and add user to usedBy array
    const promotion = result.promotion;
    promotion.usageCount += 1;
    promotion.usedBy.push({
      user: userId,
      usedAt: new Date(),
      orderValue: orderValue,
      discountApplied: result.discountAmount
    });
    
    await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        promotionId: promotion._id,
        code: promotion.code,
        discountAmount: result.discountAmount,
        finalTotal: orderValue - result.discountAmount
      }
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying promotion',
      error: error.message
    });
  }
};

// Get all products for promotion assignment
const getProductsForPromotion = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('name price category imageUrl')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

module.exports = {
  getAllPromotions,
  getActivePromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  validatePromotionCode,
  applyPromotionToOrder,
  getPromotionStats,
  getProductsForPromotion
};