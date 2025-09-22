const Inventory = require('../Models/Inventory');
const Product = require('../Models/Product');

// Get all inventory items with pagination and filtering
const getAllInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    
    // Build filter
    let filter = {};
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Build aggregation pipeline
    let pipeline = [
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ];
    
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'productInfo.name': { $regex: search, $options: 'i' } },
            { 'productInfo.category': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }
    
    if (status !== 'all') {
      pipeline.push({ $match: { status: status } });
    }
    
    // Add sorting
    pipeline.push({ $sort: { updatedAt: -1 } });
    
    // Get total count for pagination
    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Inventory.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    
    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });
    
    const inventory = await Inventory.aggregate(pipeline);
    
    res.json({
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get inventory for specific product
const getProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const inventory = await Inventory.findOne({ product: productId })
      .populate('product')
      .populate('movements.performedBy', 'name');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add stock to product
const addStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason, reference, notes } = req.body;
    const performedBy = req.admin.id;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const inventory = await Inventory.addStock(
      productId,
      parseInt(quantity),
      reason,
      performedBy,
      reference || '',
      notes || ''
    );
    
    await inventory.populate('product');
    
    res.json({
      success: true,
      message: 'Stock added successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Remove stock from product
const removeStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason, reference, notes } = req.body;
    const performedBy = req.admin.id;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const inventory = await Inventory.removeStock(
      productId,
      parseInt(quantity),
      reason,
      performedBy,
      reference || '',
      notes || ''
    );
    
    await inventory.populate('product');
    
    res.json({
      success: true,
      message: 'Stock removed successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Adjust stock (set exact quantity)
const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newQuantity, reason, notes } = req.body;
    const performedBy = req.admin.id;
    
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const inventory = await Inventory.adjustStock(
      productId,
      parseInt(newQuantity),
      reason,
      performedBy,
      notes || ''
    );
    
    await inventory.populate('product');
    
    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update inventory settings (min/max/reorder levels)
const updateInventorySettings = async (req, res) => {
  try {
    const { productId } = req.params;
    const { minStockLevel, maxStockLevel, reorderPoint } = req.body;
    
    const inventory = await Inventory.findOne({ product: productId });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }
    
    if (minStockLevel !== undefined) inventory.minStockLevel = minStockLevel;
    if (maxStockLevel !== undefined) inventory.maxStockLevel = maxStockLevel;
    if (reorderPoint !== undefined) inventory.reorderPoint = reorderPoint;
    
    await inventory.save();
    await inventory.populate('product');
    
    res.json({
      success: true,
      message: 'Inventory settings updated successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.getLowStockItems();
    
    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get out of stock items
const getOutOfStockItems = async (req, res) => {
  try {
    const outOfStockItems = await Inventory.getOutOfStockItems();
    
    res.json({
      success: true,
      data: outOfStockItems
    });
  } catch (error) {
    console.error('Error fetching out of stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.getInventoryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get stock movement history
const getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const inventory = await Inventory.findOne({ product: productId })
      .populate('movements.performedBy', 'name');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }
    
    // Sort movements by newest first
    const movements = inventory.movements
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);
    
    res.json({
      success: true,
      data: movements,
      pagination: {
        page,
        limit,
        total: inventory.movements.length,
        pages: Math.ceil(inventory.movements.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Initialize inventory for all products (one-time setup)
const initializeInventory = async (req, res) => {
  try {
    const products = await Product.find();
    let initialized = 0;
    
    for (const product of products) {
      const existingInventory = await Inventory.findOne({ product: product._id });
      
      if (!existingInventory) {
        const inventory = new Inventory({
          product: product._id,
          currentStock: product.stock || 0,
          minStockLevel: 10,
          maxStockLevel: 100,
          reorderPoint: 15
        });
        
        await inventory.save();
        initialized++;
      }
    }
    
    res.json({
      success: true,
      message: `Initialized inventory for ${initialized} products`
    });
  } catch (error) {
    console.error('Error initializing inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllInventory,
  getProductInventory,
  addStock,
  removeStock,
  adjustStock,
  updateInventorySettings,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryStats,
  getStockMovements,
  initializeInventory
};