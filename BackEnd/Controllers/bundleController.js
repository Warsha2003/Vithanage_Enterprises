const ProductBundle = require('../Models/ProductBundle');
const Product = require('../Models/Product');

// Get all active bundles
exports.getActiveBundles = async (req, res) => {
  try {
    const now = new Date();
    
    const bundles = await ProductBundle.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    })
      .populate('products.product', 'name imageUrl price stock brand category')
      .sort({ createdAt: -1 });

    res.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({ message: 'Error fetching bundles' });
  }
};

// Get single bundle
exports.getBundleById = async (req, res) => {
  try {
    const bundle = await ProductBundle.findById(req.params.id)
      .populate('products.product', 'name imageUrl price stock brand category description');

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res.json(bundle);
  } catch (error) {
    console.error('Error fetching bundle:', error);
    res.status(500).json({ message: 'Error fetching bundle' });
  }
};

// Create bundle (admin only)
exports.createBundle = async (req, res) => {
  try {
    const { name, description, products, bundlePrice, imageUrl, startDate, endDate } = req.body;

    // Validate products exist and calculate original price
    let originalPrice = 0;
    const productIds = products.map(p => p.product);
    
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products not found' });
    }

    // Calculate original price
    for (const item of products) {
      const product = existingProducts.find(p => p._id.toString() === item.product);
      if (product) {
        originalPrice += product.price * (item.quantity || 1);
      }
    }

    // Calculate discount percentage
    const discountPercent = Math.round(((originalPrice - bundlePrice) / originalPrice) * 100);

    const bundle = new ProductBundle({
      name,
      description,
      products,
      originalPrice,
      bundlePrice,
      discountPercent,
      imageUrl,
      startDate: startDate || new Date(),
      endDate
    });

    await bundle.save();
    await bundle.populate('products.product', 'name imageUrl price');

    res.status(201).json({
      message: 'Bundle created successfully',
      bundle
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(500).json({ message: 'Error creating bundle' });
  }
};

// Update bundle (admin only)
exports.updateBundle = async (req, res) => {
  try {
    const { name, description, products, bundlePrice, imageUrl, isActive, startDate, endDate } = req.body;

    const bundle = await ProductBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Recalculate original price if products changed
    if (products) {
      let originalPrice = 0;
      const productIds = products.map(p => p.product);
      const existingProducts = await Product.find({ _id: { $in: productIds } });

      for (const item of products) {
        const product = existingProducts.find(p => p._id.toString() === item.product);
        if (product) {
          originalPrice += product.price * (item.quantity || 1);
        }
      }

      bundle.products = products;
      bundle.originalPrice = originalPrice;
      bundle.discountPercent = Math.round(((originalPrice - (bundlePrice || bundle.bundlePrice)) / originalPrice) * 100);
    }

    if (name) bundle.name = name;
    if (description !== undefined) bundle.description = description;
    if (bundlePrice) bundle.bundlePrice = bundlePrice;
    if (imageUrl !== undefined) bundle.imageUrl = imageUrl;
    if (isActive !== undefined) bundle.isActive = isActive;
    if (startDate) bundle.startDate = startDate;
    if (endDate !== undefined) bundle.endDate = endDate;

    await bundle.save();
    await bundle.populate('products.product', 'name imageUrl price');

    res.json({
      message: 'Bundle updated successfully',
      bundle
    });
  } catch (error) {
    console.error('Error updating bundle:', error);
    res.status(500).json({ message: 'Error updating bundle' });
  }
};

// Delete bundle (admin only)
exports.deleteBundle = async (req, res) => {
  try {
    const bundle = await ProductBundle.findByIdAndDelete(req.params.id);
    
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    res.status(500).json({ message: 'Error deleting bundle' });
  }
};

// Get all bundles (admin)
exports.getAllBundles = async (req, res) => {
  try {
    const bundles = await ProductBundle.find()
      .populate('products.product', 'name imageUrl price stock')
      .sort({ createdAt: -1 });

    res.json(bundles);
  } catch (error) {
    console.error('Error fetching all bundles:', error);
    res.status(500).json({ message: 'Error fetching bundles' });
  }
};

// Get suggested bundles for a product
exports.getSuggestedBundles = async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();

    // Find bundles containing this product
    const bundles = await ProductBundle.find({
      isActive: true,
      'products.product': productId,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    })
      .populate('products.product', 'name imageUrl price stock')
      .limit(3);

    res.json(bundles);
  } catch (error) {
    console.error('Error fetching suggested bundles:', error);
    res.status(500).json({ message: 'Error fetching bundles' });
  }
};
