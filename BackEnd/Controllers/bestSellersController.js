const Product = require('../Models/Product');
const Order = require('../Models/Order');

const getBestSellers = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Aggregate orders to find best sellers based on quantity sold
    const bestSellerData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped', 'processing'] } // Only successful orders
        }
      },
      {
        $unwind: '$items' // Break down order items
      },
      {
        $group: {
          _id: '$items.productId',
          totalQuantitySold: { $sum: '$items.quantity' }, // Count total sold
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalQuantitySold: -1 } // Sort by quantity sold (descending)
      },
      {
        $limit: 50 // Get top 50 products to populate with details
      }
    ]);

    if (bestSellerData.length === 0) {
      // Fallback: If no orders exist, return featured products or most recently added
      const fallbackProducts = await Product.find({ 
        stock: { $gt: 0 } 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      return res.json({
        products: fallbackProducts.map(product => ({
          ...product._doc,
          totalSold: 0,
          rank: 0
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(fallbackProducts.length / limit),
          totalProducts: fallbackProducts.length,
          hasNextPage: page * limit < fallbackProducts.length,
          hasPrevPage: page > 1
        }
      });
    }

    // Get product IDs from aggregation
    const productIds = bestSellerData.map(item => item._id);

    // Fetch full product details
    const products = await Product.find({ 
      _id: { $in: productIds },
      stock: { $gt: 0 } // Only show products in stock
    });

    // Combine product details with sales data
    const bestSellersWithDetails = products.map((product, index) => {
      const salesData = bestSellerData.find(item => 
        item._id.toString() === product._id.toString()
      );
      
      return {
        ...product._doc,
        totalSold: salesData?.totalQuantitySold || 0,
        totalRevenue: salesData?.totalRevenue || 0,
        orderCount: salesData?.orderCount || 0,
        rank: bestSellerData.findIndex(item => 
          item._id.toString() === product._id.toString()
        ) + 1
      };
    });

    // Sort by total sold (in case Product.find changed the order)
    bestSellersWithDetails.sort((a, b) => b.totalSold - a.totalSold);

    // Apply pagination
    const paginatedProducts = bestSellersWithDetails.slice(skip, skip + limit);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(bestSellersWithDetails.length / limit),
        totalProducts: bestSellersWithDetails.length,
        hasNextPage: page * limit < bestSellersWithDetails.length,
        hasPrevPage: page > 1
      },
      summary: {
        totalBestSellers: bestSellersWithDetails.length,
        topSeller: bestSellersWithDetails[0] ? {
          name: bestSellersWithDetails[0].name,
          totalSold: bestSellersWithDetails[0].totalSold
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({ 
      message: 'Error fetching best sellers', 
      error: error.message 
    });
  }
};

module.exports = {
  getBestSellers
};