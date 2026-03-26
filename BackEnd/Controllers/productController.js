const Product = require('../Models/Product');

// Get all products with search, filter, and sort
const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sortBy,
      sortOrder,
      page,
      limit,
      paginated  // New flag to request paginated response
    } = req.query;

    // Build query object
    let query = {};

    // Text search on name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter (case-insensitive)
    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Brand filter (can be multiple, comma-separated)
    if (brand) {
      const brands = brand.split(',').map(b => b.trim());
      query.brand = { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query.$or = query.$or || [];
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'price':
          sort.price = order;
          break;
        case 'rating':
          sort.averageRating = order === 1 ? -1 : 1; // Default high to low for rating
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        case 'name':
          sort.name = order;
          break;
        default:
          sort.createdAt = -1;
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Return paginated response only if explicitly requested
    if (paginated === 'true') {
      const total = await Product.countDocuments(query);
      return res.json({
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    }

    // Default: return just the array for backward compatibility
    res.json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all unique categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.filter(c => c).sort());
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all unique brands
const getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json(brands.filter(b => b).sort());
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get price range
const getPriceRange = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    if (result.length > 0) {
      res.json({
        min: result[0].minPrice || 0,
        max: result[0].maxPrice || 0
      });
    } else {
      res.json({ min: 0, max: 0 });
    }
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
  const Inventory = require('../Models/Inventory');

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
    // Create inventory record immediately for the new product (if not exists)
    try {
      const existingInventory = await Inventory.findOne({ product: savedProduct._id });
      if (!existingInventory) {
        const inv = new Inventory({
          product: savedProduct._id,
          currentStock: savedProduct.stock || 0,
          minStockLevel: 10,
          maxStockLevel: 100,
          reorderPoint: 15
        });
        await inv.save();
      }
    } catch (invErr) {
      console.error('Failed to create inventory record for new product:', invErr.message || invErr);
      // Don't fail product creation if inventory creation fails; just log.
    }
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

// Compare products - get multiple products by IDs
const compareProducts = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ message: 'Please provide product IDs' });
    }

    const productIds = ids.split(',').slice(0, 4); // Max 4 products
    
    const products = await Product.find({
      _id: { $in: productIds }
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error comparing products:', error.message);
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
  removeFromNewArrivals,
  getCategories,
  getBrands,
  getPriceRange,
  compareProducts
};
