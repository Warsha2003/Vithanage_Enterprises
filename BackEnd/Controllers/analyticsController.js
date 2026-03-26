const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');

// Get dashboard overview stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total orders stats
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Today's revenue
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfToday },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Users stats
    const [totalUsers, newUsersThisMonth] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } })
    ]);

    // Products stats
    const [totalProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: 0 })
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders
      },
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        today: todayRevenue[0]?.total || 0,
        averageOrderValue: revenueStats[0]?.averageOrderValue || 0
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      orderStatusBreakdown: orderStatusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

// Get sales trends (daily/weekly/monthly)
exports.getSalesTrends = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let groupFormat;
    switch (period) {
      case 'weekly':
        groupFormat = { $week: '$createdAt' };
        break;
      case 'monthly':
        groupFormat = { $month: '$createdAt' };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const salesTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          items: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesTrends);
  } catch (error) {
    console.error('Error getting sales trends:', error);
    res.status(500).json({ message: 'Error fetching sales trends' });
  }
};

// Get top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          imageUrl: '$product.imageUrl',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({ message: 'Error fetching top products' });
  }
};

// Get category performance
exports.getCategoryPerformance = async (req, res) => {
  try {
    const categoryStats = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(categoryStats);
  } catch (error) {
    console.error('Error getting category performance:', error);
    res.status(500).json({ message: 'Error fetching category performance' });
  }
};

// Get customer insights
exports.getCustomerInsights = async (req, res) => {
  try {
    // Top customers by order value
    const topCustomers = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1
        }
      }
    ]);

    // Customer acquisition by month
    const customerGrowth = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    // Repeat vs new customers
    const repeatCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { $cond: [{ $gt: ['$orderCount', 1] }, 'repeat', 'new'] },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      topCustomers,
      customerGrowth,
      customerTypes: repeatCustomers.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error getting customer insights:', error);
    res.status(500).json({ message: 'Error fetching customer insights' });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('orderNumber total status createdAt user items');

    const activity = recentOrders.map(order => ({
      type: 'order',
      orderNumber: order.orderNumber,
      customer: order.user?.name || 'Guest',
      total: order.total,
      status: order.status,
      itemCount: order.items?.length || 0,
      timestamp: order.createdAt
    }));

    res.json(activity);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
};
