import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFire, 
  faTrophy, 
  faShoppingCart, 
  faStar, 
  faFilter,
  faSort,
  faChevronLeft,
  faChevronRight,
  faSpinner,
  faTag,
  faEye,
  faCrown,
  faMedal
} from '@fortawesome/free-solid-svg-icons';
import './BestSellers.css';
import { useCart } from '../Cart/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import SimpleLoader from '../Common/SimpleLoader';

const BestSellers = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('totalSold'); // totalSold, revenue, name, price
  const [filterCategory, setFilterCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatCurrency } = useSettings();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchBestSellers();
  }, [currentPage, sortBy, filterCategory]);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `http://localhost:5000/api/best-sellers?page=${currentPage}&limit=12`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch best sellers');
      }
      
      const data = await response.json();
      
      let products = data.products || [];
      
      // Extract categories
      const uniqueCategories = ['All', ...new Set(products.map(p => p.category))];
      setCategories(uniqueCategories);
      
      // Apply category filter
      if (filterCategory !== 'All') {
        products = products.filter(p => p.category === filterCategory);
      }
      
      // Apply sorting
      products.sort((a, b) => {
        switch (sortBy) {
          case 'totalSold':
            return (b.totalSold || 0) - (a.totalSold || 0);
          case 'revenue':
            return (b.totalRevenue || 0) - (a.totalRevenue || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price':
            return a.price - b.price;
          case 'priceDesc':
            return b.price - a.price;
          default:
            return (b.totalSold || 0) - (a.totalSold || 0);
        }
      });
      
      setBestSellers(products);
      setTotalPages(data.pagination?.totalPages || 1);
      
    } catch (err) {
      console.error('Error fetching best sellers:', err);
      setError('Failed to load best sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to add products to your cart');
        navigate('/login');
        return;
      }

      const result = await addItem(product._id, 1);
      
      if (result?.ok) {
        alert(`${product.name} added to cart!`);
      } else {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const starRating = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i <= starRating ? 'star-filled' : 'star-empty'}
        />
      );
    }
    return stars;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <FontAwesomeIcon icon={faCrown} className="rank-gold" />;
    if (index === 1) return <FontAwesomeIcon icon={faMedal} className="rank-silver" />;
    if (index === 2) return <FontAwesomeIcon icon={faMedal} className="rank-bronze" />;
    return <span className="rank-number">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <SimpleLoader 
        message="Loading Best Sellers"
        subtitle="Finding our most popular products..."
      />
    );
  }

  if (error) {
    return (
      <div className="best-sellers-error">
        <p>{error}</p>
        <button onClick={fetchBestSellers} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="best-sellers-container">
      {/* Hero Section */}
      <div className="best-sellers-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <FontAwesomeIcon icon={faFire} />
          </div>
          <h1>Best Sellers</h1>
          <p>Discover our most popular products based on real sales data</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{bestSellers.length}</span>
              <span className="stat-label">Hot Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {bestSellers.reduce((sum, p) => sum + (p.totalSold || 0), 0)}
              </span>
              <span className="stat-label">Total Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="best-sellers-controls">
        <div className="controls-left">
          <div className="filter-group">
            <FontAwesomeIcon icon={faFilter} />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="controls-right">
          <div className="sort-group">
            <FontAwesomeIcon icon={faSort} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="totalSold">Most Sold</option>
              <option value="revenue">Highest Revenue</option>
              <option value="name">Name A-Z</option>
              <option value="price">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="best-sellers-grid">
        {bestSellers.map((product, index) => (
          <div key={product._id} className={`best-seller-card rank-${index + 1}`}>
            <div className="card-badges">
              <div className="rank-badge">
                {getRankIcon(index)}
              </div>
              <div className="sales-badge">
                <FontAwesomeIcon icon={faFire} />
                {product.totalSold || 0} sold
              </div>
            </div>
            
            <div className="bestsellers-image-container">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Product'} 
                alt={product.name}
                className="bestsellers-image"
                onClick={() => navigate(`/products/${product._id}`)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                  e.target.style.objectFit = 'contain';
                }}
                onLoad={(e) => {
                  e.target.style.opacity = '1';
                }}
                style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
              />
              <div className="image-overlay">
                <button 
                  className="quick-view-btn"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Quick View
                </button>
              </div>
            </div>
            
            <div className="bestsellers-product-info">
              <h3 
                className="bestsellers-product-title"
                onClick={() => navigate(`/products/${product._id}`)}
              >
                {product.name}
              </h3>
              
              <div className="bestsellers-product-category">{product.category}</div>
              
              <div className="bestsellers-product-rating">
                <div className="bestsellers-stars">
                  {renderStars(product.averageRating || product.rating || 4)}
                </div>
                <span className="bestsellers-rating-text">
                  ({(product.averageRating || product.rating || 4).toFixed(1)})
                </span>
              </div>
              
              <div className="bestsellers-product-price">
                <span className="bestsellers-current-price">{formatPrice(product.price)}</span>
              </div>
              
              <div className="bestsellers-product-actions">
                <button 
                  className="bestsellers-add-cart-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  <FontAwesomeIcon icon={faShoppingCart} />
                  Add to Cart
                </button>
                <button 
                  className="bestsellers-view-btn"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Previous
          </button>
          
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
      
      {bestSellers.length === 0 && !loading && (
        <div className="no-products">
          <FontAwesomeIcon icon={faFire} size="3x" />
          <h3>No Best Sellers Found</h3>
          <p>Check back later for our trending products!</p>
        </div>
      )}
    </div>
  );
};

export default BestSellers;