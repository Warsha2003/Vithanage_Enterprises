const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  movementType: {
    type: String,
    enum: ['stock_in', 'stock_out', 'adjustment', 'return', 'damaged', 'expired'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reference: {
    type: String, // Order ID, Supplier invoice, etc.
    default: ''
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  reorderPoint: {
    type: Number,
    required: true,
    min: 0,
    default: 15
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  movements: [inventoryMovementSchema],
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  }
}, { 
  timestamps: true 
});

// Update status based on current stock
inventorySchema.pre('save', function(next) {
  if (this.currentStock === 0) {
    this.status = 'out_of_stock';
  } else if (this.currentStock <= this.reorderPoint) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  next();
});

// Static methods for inventory management
inventorySchema.statics.addStock = async function(productId, quantity, reason, performedBy, reference = '', notes = '') {
  try {
    const Product = mongoose.model('Product');
    
    // Get current product and inventory
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    let inventory = await this.findOne({ product: productId }).populate('product');
    
    if (!inventory) {
      // Create new inventory record
      inventory = new this({
        product: productId,
        currentStock: 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        reorderPoint: 15
      });
    }
    
    const previousStock = inventory.currentStock;
    const newStock = previousStock + quantity;
    
    // Add movement record
    inventory.movements.push({
      product: productId,
      movementType: 'stock_in',
      quantity: quantity,
      previousStock: previousStock,
      newStock: newStock,
      reason: reason,
      reference: reference,
      performedBy: performedBy,
      notes: notes
    });
    
    // Update current stock
    inventory.currentStock = newStock;
    inventory.lastRestocked = new Date();
    
    // Update product stock as well
    product.stock = newStock;
    await product.save();
    
    await inventory.save();
    return inventory;
  } catch (error) {
    throw error;
  }
};

inventorySchema.statics.removeStock = async function(productId, quantity, reason, performedBy, reference = '', notes = '') {
  try {
    const Product = mongoose.model('Product');
    
    // Ensure productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }
    
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    let inventory = await this.findOne({ product: productId });
    if (!inventory) {
      // Create new inventory record if it doesn't exist
      inventory = new this({
        product: productId,
        currentStock: product.stock || 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        reorderPoint: 15
      });
    }
    
    const previousStock = inventory.currentStock;
    const newStock = Math.max(0, previousStock - quantity);
    
    // Add movement record
    inventory.movements.push({
      product: productId,
      movementType: 'stock_out',
      quantity: quantity,
      previousStock: previousStock,
      newStock: newStock,
      reason: reason,
      reference: reference,
      performedBy: performedBy,
      notes: notes
    });
    
    // Update current stock
    inventory.currentStock = newStock;
    
    // Update product stock as well
    product.stock = newStock;
    await product.save();
    
    await inventory.save();
    return inventory;
  } catch (error) {
    throw error;
  }
};

inventorySchema.statics.adjustStock = async function(productId, newQuantity, reason, performedBy, notes = '') {
  try {
    const Product = mongoose.model('Product');
    
    // Ensure productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }
    
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    let inventory = await this.findOne({ product: productId });
    if (!inventory) {
      inventory = new this({
        product: productId,
        currentStock: product.stock || 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        reorderPoint: 15
      });
    }
    
    const previousStock = inventory.currentStock;
    const adjustmentQuantity = newQuantity - previousStock;
    
    // Add movement record
    inventory.movements.push({
      product: productId,
      movementType: 'adjustment',
      quantity: Math.abs(adjustmentQuantity),
      previousStock: previousStock,
      newStock: newQuantity,
      reason: reason,
      performedBy: performedBy,
      notes: notes
    });
    
    // Update current stock
    inventory.currentStock = newQuantity;
    
    // Update product stock as well
    product.stock = newQuantity;
    await product.save();
    
    await inventory.save();
    return inventory;
  } catch (error) {
    throw error;
  }
};

inventorySchema.statics.getLowStockItems = async function() {
  return await this.find({ status: 'low_stock' }).populate('product');
};

inventorySchema.statics.getOutOfStockItems = async function() {
  return await this.find({ status: 'out_of_stock' }).populate('product');
};

inventorySchema.statics.getInventoryStats = async function() {
  const totalProducts = await this.countDocuments();
  const inStock = await this.countDocuments({ status: 'in_stock' });
  const lowStock = await this.countDocuments({ status: 'low_stock' });
  const outOfStock = await this.countDocuments({ status: 'out_of_stock' });
  
  const totalStockValue = await this.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $unwind: '$productInfo'
    },
    {
      $group: {
        _id: null,
        totalValue: {
          $sum: { $multiply: ['$currentStock', '$productInfo.price'] }
        }
      }
    }
  ]);
  
  return {
    totalProducts,
    inStock,
    lowStock,
    outOfStock,
    totalStockValue: totalStockValue[0]?.totalValue || 0
  };
};

module.exports = mongoose.model('Inventory', inventorySchema);