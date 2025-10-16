const DailyDeal = require('../Models/DailyDeal');
const Product = require('../Models/Product');
const jwt = require('jsonwebtoken');

// JWT Secret (matches other controllers)
const JWT_SECRET = 'vithanage_enterprises_secret';

// Get all daily deals with filtering and population
const getAllDailyDeals = async (req, res) => {
  try {
    const { status, search, dealType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    // Status filtering
    if (status && status !== 'all') {
      const now = new Date();
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
          query = { endDate: { $lt: now } };
          break;
        case 'inactive':
          query = { isActive: false };
          break;
      }
    }
    
    // Deal type filtering
    if (dealType && dealType !== 'all') {
      query.dealType = dealType;
    }
    
    // Search filtering
    let deals;
    if (search && search.trim()) {
      // First get deals with title match
      const titleQuery = {
        ...query,
        dealTitle: { $regex: search, $options: 'i' }
      };
      
      deals = await DailyDeal.find(titleQuery)
        .populate('productId', 'name description images category price stock')
        .populate('createdBy', 'username email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
      
      // If no results, search in populated product names
      if (deals.length === 0) {
        const allDeals = await DailyDeal.find(query)
          .populate('productId', 'name description images category price stock')
          .populate('createdBy', 'username email');
        
        deals = allDeals.filter(deal => 
          deal.productId && 
          deal.productId.name.toLowerCase().includes(search.toLowerCase())
        );
      }
    } else {
      deals = await DailyDeal.find(query)
        .populate('productId', 'name description images category price stock')
        .populate('createdBy', 'username email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
    }
    
    // Add computed fields
    const enrichedDeals = deals.map(deal => ({
      ...deal.toJSON(),
      dealStatus: deal.dealStatus,
      remainingQuantity: deal.remainingQuantity,
      savingsAmount: deal.savingsAmount
    }));
    
    res.status(200).json({
      success: true,
      count: enrichedDeals.length,
      data: enrichedDeals
    });
    
  } catch (error) {
    console.error('Error fetching daily deals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily deals',
      error: error.message
    });
  }
};

// Get active deals for public consumption
const getActiveDeals = async (req, res) => {
  try {
    const { limit = 20, page = 1, category, sortBy = 'createdAt' } = req.query;
    
    let query = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    };
    
    // Add category filter if provided
    if (category && category !== 'all') {
      // First find products in the category, then filter deals
      const productsInCategory = await Product.find({ category }).select('_id');
      const productIds = productsInCategory.map(p => p._id);
      query.productId = { $in: productIds };
    }
    
    const skip = (page - 1) * parseInt(limit);
    
    const deals = await DailyDeal.find(query)
      .populate('productId', 'name description images category price stock')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Filter out deals where product is out of stock or deal is sold out
    const availableDeals = deals.filter(deal => 
      deal.productId && 
      deal.productId.stock > 0 && 
      deal.remainingQuantity > 0
    );
    
    // Add computed fields
    const enrichedDeals = availableDeals.map(deal => ({
      ...deal.toJSON(),
      dealStatus: deal.dealStatus,
      remainingQuantity: deal.remainingQuantity,
      savingsAmount: deal.savingsAmount
    }));
    
    res.status(200).json({
      success: true,
      count: enrichedDeals.length,
      data: enrichedDeals
    });
    
  } catch (error) {
    console.error('Error fetching active deals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active deals',
      error: error.message
    });
  }
};

// Get single daily deal by ID
const getDailyDealById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deal = await DailyDeal.findById(id)
      .populate('productId', 'name description images category price stock')
      .populate('createdBy', 'username email');
    
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Daily deal not found'
      });
    }
    
    const enrichedDeal = {
      ...deal.toJSON(),
      dealStatus: deal.dealStatus,
      remainingQuantity: deal.remainingQuantity,
      savingsAmount: deal.savingsAmount
    };
    
    res.status(200).json({
      success: true,
      data: enrichedDeal
    });
    
  } catch (error) {
    console.error('Error fetching daily deal:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily deal',
      error: error.message
    });
  }
};

// Create new daily deal (Admin only)
const createDailyDeal = async (req, res) => {
  try {
    // The adminAuthMiddleware sets req.admin
    const adminId = req.admin.id;
    const {
      dealTitle,
      productId,
      originalPrice,
      dealPrice,
      dealQuantity,
      dealType,
      startDate,
      endDate,
      isActive = true
    } = req.body;
    
    // Validate required fields
    if (!dealTitle || !productId || !originalPrice || !dealPrice || !dealQuantity || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Validate pricing
    if (dealPrice >= originalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Deal price must be less than original price'
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Check if there's already an active deal for this product in the time range
    const existingDeal = await DailyDeal.findOne({
      productId,
      isActive: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    
    if (existingDeal) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active deal for this product in the specified time range'
      });
    }
    
    // Create new daily deal
    const newDeal = new DailyDeal({
      dealTitle,
      productId,
      originalPrice,
      dealPrice,
      dealQuantity,
      dealType: dealType || 'daily',
      startDate: start,
      endDate: end,
      isActive,
      createdBy: adminId
    });
    
    await newDeal.save();
    
    // Populate the created deal
    const populatedDeal = await DailyDeal.findById(newDeal._id)
      .populate('productId', 'name description images category price stock')
      .populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Daily deal created successfully',
      data: {
        ...populatedDeal.toJSON(),
        dealStatus: populatedDeal.dealStatus,
        remainingQuantity: populatedDeal.remainingQuantity,
        savingsAmount: populatedDeal.savingsAmount
      }
    });
    
  } catch (error) {
    console.error('Error creating daily deal:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating daily deal',
      error: error.message
    });
  }
};

// Update daily deal (Admin only)
const updateDailyDeal = async (req, res) => {
  try {
    // Admin verification handled by middleware
    const { id } = req.params;
    const updates = req.body;
    
    // Validate deal exists
    const existingDeal = await DailyDeal.findById(id);
    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: 'Daily deal not found'
      });
    }
    
    // If updating product, validate it exists
    if (updates.productId && updates.productId !== existingDeal.productId.toString()) {
      const product = await Product.findById(updates.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    }
    
    // Validate pricing if provided
    const newOriginalPrice = updates.originalPrice || existingDeal.originalPrice;
    const newDealPrice = updates.dealPrice || existingDeal.dealPrice;
    
    if (newDealPrice >= newOriginalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Deal price must be less than original price'
      });
    }
    
    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const newStartDate = new Date(updates.startDate || existingDeal.startDate);
      const newEndDate = new Date(updates.endDate || existingDeal.endDate);
      
      if (newEndDate <= newStartDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }
    
    // Update deal
    const updatedDeal = await DailyDeal.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate('productId', 'name description images category price stock')
    .populate('createdBy', 'username email');
    
    res.status(200).json({
      success: true,
      message: 'Daily deal updated successfully',
      data: {
        ...updatedDeal.toJSON(),
        dealStatus: updatedDeal.dealStatus,
        remainingQuantity: updatedDeal.remainingQuantity,
        savingsAmount: updatedDeal.savingsAmount
      }
    });
    
  } catch (error) {
    console.error('Error updating daily deal:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating daily deal',
      error: error.message
    });
  }
};

// Toggle deal status (Admin only)
const toggleDealStatus = async (req, res) => {
  try {
    // Admin verification handled by middleware
    const { id } = req.params;
    
    const deal = await DailyDeal.findById(id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Daily deal not found'
      });
    }
    
    deal.isActive = !deal.isActive;
    await deal.save();
    
    const populatedDeal = await DailyDeal.findById(id)
      .populate('productId', 'name description images category price stock')
      .populate('createdBy', 'username email');
    
    res.status(200).json({
      success: true,
      message: `Deal ${deal.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        ...populatedDeal.toJSON(),
        dealStatus: populatedDeal.dealStatus,
        remainingQuantity: populatedDeal.remainingQuantity,
        savingsAmount: populatedDeal.savingsAmount
      }
    });
    
  } catch (error) {
    console.error('Error toggling deal status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling deal status',
      error: error.message
    });
  }
};

// Delete daily deal (Admin only)
const deleteDailyDeal = async (req, res) => {
  try {
    // Admin verification handled by middleware
    const { id } = req.params;
    
    const deal = await DailyDeal.findById(id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Daily deal not found'
      });
    }
    
    // Check if deal has any sales before deleting
    if (deal.soldQuantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete deal that has sales recorded. Consider deactivating instead.'
      });
    }
    
    await DailyDeal.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Daily deal deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting daily deal:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting daily deal',
      error: error.message
    });
  }
};

// Get deal statistics (Admin only)
const getDealStatistics = async (req, res) => {
  try {
    // Admin verification handled by middleware
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    // Get various counts
    const totalDeals = await DailyDeal.countDocuments();
    const activeDeals = await DailyDeal.countDocuments({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    const monthlyDeals = await DailyDeal.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    // Get top performing deals
    const topDeals = await DailyDeal.find({ soldQuantity: { $gt: 0 } })
      .populate('productId', 'name')
      .sort({ soldQuantity: -1 })
      .limit(5)
      .select('dealTitle productId soldQuantity dealQuantity savingsAmount');
    
    // Get deals by status
    const dealsByStatus = await DailyDeal.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get deals by type
    const dealsByType = await DailyDeal.aggregate([
      {
        $group: {
          _id: '$dealType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalDeals,
        activeDeals,
        monthlyDeals,
        topDeals: topDeals.map(deal => ({
          ...deal.toJSON(),
          savingsAmount: deal.savingsAmount
        })),
        dealsByStatus: dealsByStatus.reduce((acc, item) => {
          acc[item._id ? 'active' : 'inactive'] = item.count;
          return acc;
        }, {}),
        dealsByType: dealsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Error fetching deal statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deal statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllDailyDeals,
  getActiveDeals,
  getDailyDealById,
  createDailyDeal,
  updateDailyDeal,
  toggleDealStatus,
  deleteDailyDeal,
  getDealStatistics
};