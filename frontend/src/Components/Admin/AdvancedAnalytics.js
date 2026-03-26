import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faShoppingCart, 
  faDollarSign,
  faBoxes,
  faTrophy,
  faArrowUp,
  faArrowDown,
  faCalendar,
  faSpinner,
  faChartBar,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { useCurrency } from '../../contexts/CurrencyContext';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [customerInsights, setCustomerInsights] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-token': token
    };
  };

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      
      // Fetch all analytics data in parallel
      const [statsRes, trendsRes, productsRes, categoryRes, customerRes] = await Promise.all([
        fetch(`http://localhost:5000/api/analytics/dashboard?days=${dateRange}`, { headers }),
        fetch(`http://localhost:5000/api/analytics/sales-trends?days=${dateRange}`, { headers }),
        fetch(`http://localhost:5000/api/analytics/top-products?limit=10`, { headers }),
        fetch(`http://localhost:5000/api/analytics/category-performance`, { headers }),
        fetch(`http://localhost:5000/api/analytics/customer-insights`, { headers })
      ]);

      if (!statsRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [stats, trends, products, categories, customers] = await Promise.all([
        statsRes.json(),
        trendsRes.json(),
        productsRes.json(),
        categoryRes.json(),
        customerRes.json()
      ]);

      setDashboardStats(stats);
      setSalesTrends(trends);
      setTopProducts(products);
      setCategoryPerformance(categories);
      setCustomerInsights(customers);
    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (current, previous) => {
    if (!previous || previous === 0) return { value: '0%', positive: true };
    const change = ((current - previous) / previous * 100).toFixed(1);
    return {
      value: `${change > 0 ? '+' : ''}${change}%`,
      positive: change >= 0
    };
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>Error: {error}</p>
        <button onClick={fetchAllAnalytics}>Retry</button>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h1>
          <FontAwesomeIcon icon={faChartLine} /> Advanced Analytics
        </h1>
        <div className="date-range-selector">
          <FontAwesomeIcon icon={faCalendar} />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardStats && (
        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">
              <FontAwesomeIcon icon={faDollarSign} />
            </div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">{formatPrice(dashboardStats.totalRevenue)}</p>
              {dashboardStats.previousPeriodRevenue && (
                <span className={`metric-change ${formatChange(dashboardStats.totalRevenue, dashboardStats.previousPeriodRevenue).positive ? 'positive' : 'negative'}`}>
                  <FontAwesomeIcon icon={formatChange(dashboardStats.totalRevenue, dashboardStats.previousPeriodRevenue).positive ? faArrowUp : faArrowDown} />
                  {formatChange(dashboardStats.totalRevenue, dashboardStats.previousPeriodRevenue).value}
                </span>
              )}
            </div>
          </div>

          <div className="metric-card orders">
            <div className="metric-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <div className="metric-content">
              <h3>Total Orders</h3>
              <p className="metric-value">{dashboardStats.totalOrders}</p>
              <span className="metric-subtitle">
                {dashboardStats.averageOrderValue && `Avg: ${formatPrice(dashboardStats.averageOrderValue)}`}
              </span>
            </div>
          </div>

          <div className="metric-card customers">
            <div className="metric-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="metric-content">
              <h3>Total Customers</h3>
              <p className="metric-value">{dashboardStats.totalUsers}</p>
              <span className="metric-subtitle">
                {dashboardStats.newCustomers} new this period
              </span>
            </div>
          </div>

          <div className="metric-card products">
            <div className="metric-icon">
              <FontAwesomeIcon icon={faBoxes} />
            </div>
            <div className="metric-content">
              <h3>Products</h3>
              <p className="metric-value">{dashboardStats.totalProducts}</p>
              <span className="metric-subtitle">
                {dashboardStats.lowStockProducts} low stock
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sales Trends Chart */}
      <div className="analytics-section">
        <h2>
          <FontAwesomeIcon icon={faChartBar} /> Sales Trends
        </h2>
        <div className="sales-chart">
          {salesTrends.length > 0 ? (
            <div className="chart-bars">
              {salesTrends.map((day, index) => {
                const maxRevenue = Math.max(...salesTrends.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue * 100) : 0;
                return (
                  <div key={index} className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${day._id}: ${formatPrice(day.revenue)} (${day.count} orders)`}
                    >
                      <span className="bar-value">{formatPrice(day.revenue)}</span>
                    </div>
                    <span className="bar-label">{day._id.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No sales data for this period</p>
          )}
        </div>
      </div>

      <div className="analytics-row">
        {/* Top Products */}
        <div className="analytics-section half">
          <h2>
            <FontAwesomeIcon icon={faTrophy} /> Top Selling Products
          </h2>
          <div className="top-products-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product._id} className="top-product-item">
                  <span className="rank">#{index + 1}</span>
                  <img 
                    src={product.productDetails?.imageUrl || '/placeholder-product.png'} 
                    alt={product.productDetails?.name}
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />
                  <div className="product-info">
                    <h4>{product.productDetails?.name || 'Unknown Product'}</h4>
                    <p>{product.totalQuantity} sold • {formatPrice(product.totalRevenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No product data available</p>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="analytics-section half">
          <h2>
            <FontAwesomeIcon icon={faChartPie} /> Category Performance
          </h2>
          <div className="category-list">
            {categoryPerformance.length > 0 ? (
              categoryPerformance.map((category, index) => {
                const maxRevenue = Math.max(...categoryPerformance.map(c => c.totalRevenue));
                const width = maxRevenue > 0 ? (category.totalRevenue / maxRevenue * 100) : 0;
                const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
                return (
                  <div key={category._id || index} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{category._id || 'Uncategorized'}</span>
                      <span className="category-revenue">{formatPrice(category.totalRevenue)}</span>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="category-bar-fill" 
                        style={{ 
                          width: `${width}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                      />
                    </div>
                    <span className="category-orders">{category.totalOrders} orders</span>
                  </div>
                );
              })
            ) : (
              <p className="no-data">No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      {customerInsights && (
        <div className="analytics-section">
          <h2>
            <FontAwesomeIcon icon={faUsers} /> Customer Insights
          </h2>
          <div className="customer-insights-grid">
            <div className="insight-card">
              <h4>Average Order Value</h4>
              <p className="insight-value">{formatPrice(customerInsights.averageOrderValue)}</p>
            </div>
            <div className="insight-card">
              <h4>Top Customers</h4>
              <div className="top-customers">
                {customerInsights.topCustomers?.slice(0, 5).map((customer, index) => (
                  <div key={customer._id} className="top-customer">
                    <span className="customer-rank">#{index + 1}</span>
                    <span className="customer-name">{customer.customerName}</span>
                    <span className="customer-spend">{formatPrice(customer.totalSpent)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="insight-card">
              <h4>Repeat Customer Rate</h4>
              <p className="insight-value">
                {customerInsights.repeatCustomerRate 
                  ? `${customerInsights.repeatCustomerRate.toFixed(1)}%` 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
