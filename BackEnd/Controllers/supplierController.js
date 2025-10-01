const Supplier = require('../Models/Supplier');
const Product = require('../Models/Product');

// Get all suppliers with their products
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.getWithProducts();
    
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
};

// Get single supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('products.product', 'name category price imageUrl');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message
    });
  }
};

// Create new supplier
const createSupplier = async (req, res) => {
  try {
    const {
      supplierName,
      shopName,
      email,
      contactNumber,
      address,
      status,
      paymentTerms,
      notes,
      products
    } = req.body;

    // Check if supplier with this email already exists
    const existingSupplier = await Supplier.findOne({ email: email.toLowerCase() });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    // Validate products if provided
    if (products && products.length > 0) {
      for (const product of products) {
        const productExists = await Product.findById(product.product);
        if (!productExists) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${product.product} not found`
          });
        }
      }
    }

    const newSupplier = new Supplier({
      supplierName,
      shopName,
      email: email.toLowerCase(),
      contactNumber,
      address: address || {},
      status: status || 'Active',
      paymentTerms: paymentTerms || 'Net 30',
      notes: notes || '',
      products: products || []
    });

    const savedSupplier = await newSupplier.save();
    
    // Populate the saved supplier before returning
    const populatedSupplier = await Supplier.findById(savedSupplier._id)
      .populate('products.product', 'name category price imageUrl');

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: populatedSupplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Ensure email is lowercase if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // Validate products if provided
    if (updateData.products && updateData.products.length > 0) {
      for (const product of updateData.products) {
        const productExists = await Product.findById(product.product);
        if (!productExists) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${product.product} not found`
          });
        }
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('products.product', 'name category price imageUrl');

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      data: deletedSupplier
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};

// Add product to supplier
const addProductToSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, quantity, unitPrice } = req.body;

    console.log('Adding product to supplier - Request data:', { id, productId, quantity, unitPrice });

    // Validate input
    if (!productId || !quantity || !unitPrice) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity, and unit price are required'
      });
    }

    // Validate types
    if (isNaN(quantity) || isNaN(unitPrice)) {
      console.log('Validation failed - invalid number format');
      return res.status(400).json({
        success: false,
        message: 'Quantity and unit price must be valid numbers'
      });
    }

    // Check if product exists
    console.log('Checking if product exists:', productId);
    const productExists = await Product.findById(productId);
    if (!productExists) {
      console.log('Product not found:', productId);
      return res.status(400).json({
        success: false,
        message: 'Product not found'
      });
    }
    console.log('Product found:', productExists.name);

    // Find supplier
    console.log('Finding supplier:', id);
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      console.log('Supplier not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    console.log('Supplier found:', supplier.supplierName);

    // Add or update product
    console.log('Adding/updating product to supplier...');
    await supplier.addOrUpdateProduct(productId, Number(quantity), Number(unitPrice));
    console.log('Product added/updated successfully');
    
    // Return updated supplier with populated products
    const updatedSupplier = await Supplier.findById(id)
      .populate('products.product', 'name category price imageUrl');

    console.log('Returning updated supplier with products count:', updatedSupplier.products.length);
    res.json({
      success: true,
      message: 'Product added/updated successfully',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error adding product to supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to supplier',
      error: error.message
    });
  }
};

// Remove product from supplier
const removeProductFromSupplier = async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Find supplier
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Remove product
    await supplier.removeProduct(productId);
    
    // Return updated supplier with populated products
    const updatedSupplier = await Supplier.findById(id)
      .populate('products.product', 'name category price imageUrl');

    res.json({
      success: true,
      message: 'Product removed successfully',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error removing product from supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from supplier',
      error: error.message
    });
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ status: 'Active' });
    const inactiveSuppliers = await Supplier.countDocuments({ status: 'Inactive' });
    
    // Calculate total order values
    const suppliers = await Supplier.find();
    const totalOrderValue = suppliers.reduce((sum, supplier) => sum + supplier.totalOrderValue, 0);
    const averageOrderValue = totalSuppliers > 0 ? totalOrderValue / totalSuppliers : 0;

    // Get top suppliers by order value
    const topSuppliers = await Supplier.find()
      .sort({ totalOrderValue: -1 })
      .limit(5)
      .populate('products.product', 'name');

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        totalOrderValue,
        averageOrderValue,
        topSuppliers
      }
    });
  } catch (error) {
    console.error('Error fetching supplier statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier statistics',
      error: error.message
    });
  }
};

// Search suppliers
const searchSuppliers = async (req, res) => {
  try {
    const { query, status } = req.query;
    
    let searchCriteria = {};
    
    if (query) {
      searchCriteria.$or = [
        { supplierName: { $regex: query, $options: 'i' } },
        { shopName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { contactNumber: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'All') {
      searchCriteria.status = status;
    }

    const suppliers = await Supplier.find(searchCriteria)
      .populate('products.product', 'name category price imageUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search suppliers',
      error: error.message
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addProductToSupplier,
  removeProductFromSupplier,
  getSupplierStats,
  searchSuppliers
};