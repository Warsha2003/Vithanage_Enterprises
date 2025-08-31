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

// Create sample products for testing
const createSampleProducts = async (req, res) => {
  try {
    // Check if products already exist
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Sample products already exist' });
    }

    // Sample product data
    const sampleProducts = [
      {
        name: 'Samsung 55" 4K Smart TV',
        description: 'Experience stunning 4K resolution and smart features',
        price: 699.99,
        category: 'TV',
        brand: 'Samsung',
        imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stock: 15,
        rating: 4.5,
        featured: true
      },
      {
        name: 'LG French Door Refrigerator',
        description: 'Spacious refrigerator with modern features',
        price: 1299.99,
        category: 'Fridge',
        brand: 'LG',
        imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stock: 8,
        rating: 4.7,
        featured: true
      },
      {
        name: 'iPhone 14 Pro',
        description: 'The latest iPhone with advanced features',
        price: 999.99,
        category: 'Phone',
        brand: 'Apple',
        imageUrl: 'https://images.unsplash.com/photo-1592286927505-1def25115df9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stock: 20,
        rating: 4.8,
        featured: true
      },
      {
        name: 'Samsung Front Load Washing Machine',
        description: 'Efficient washing machine with multiple programs',
        price: 799.99,
        category: 'Washing Machine',
        brand: 'Samsung',
        imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1a7f1c62?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        stock: 12,
        rating: 4.3,
        featured: false
      }
    ];

    // Insert the sample products
    await Product.insertMany(sampleProducts);

    res.status(201).json({ message: 'Sample products created successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAllProducts, getProductById, createSampleProducts };
