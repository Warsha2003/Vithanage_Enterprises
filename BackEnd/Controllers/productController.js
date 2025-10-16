const Product = require('../Models/Product');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, imageUrl, stock } = req.body;
    
    // Validation
    if (!name || !description || !price || !category || !brand) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      brand,
      imageUrl: imageUrl || 'https://via.placeholder.com/300',
      stock: stock || 0
    });
    
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, imageUrl, stock, rating, featured } = req.body;
    
    // Find product by ID
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.imageUrl = imageUrl || product.imageUrl;
    product.stock = stock !== undefined ? stock : product.stock;
    product.rating = rating || product.rating;
    product.featured = featured !== undefined ? featured : product.featured;
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create sample products for testing - uses existing products
const createSampleProducts = async (req, res) => {
  try {
    // Get existing products from the database
    const products = await Product.find();
    
    res.status(200).json({ 
      success: true,
      message: `Found ${products.length} products in the database`,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('Error fetching sample products:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: Failed to fetch sample products',
      error: error.message
    });
  }
};

// Get New Arrivals - products marked as new arrivals by admin
const getNewArrivals = async (req, res) => {
  try {
    const newArrivals = await Product.find({ isNewArrival: true })
      .sort({ newArrivalAddedAt: -1 }); // Sort by newest first
    
    res.json(newArrivals);
  } catch (error) {
    console.error('Error fetching new arrivals:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin: Mark product as new arrival
const markAsNewArrival = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      id,
      { 
        isNewArrival: true,
        newArrivalAddedAt: new Date()
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product marked as new arrival', product });
  } catch (error) {
    console.error('Error marking product as new arrival:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin: Remove from new arrivals
const removeFromNewArrivals = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      id,
      { 
        isNewArrival: false,
        newArrivalAddedAt: null
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product removed from new arrivals', product });
  } catch (error) {
    console.error('Error removing from new arrivals:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { 
  getAllProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  createSampleProducts,
  getNewArrivals,
  markAsNewArrival,
  removeFromNewArrivals
};
