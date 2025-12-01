import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGift, faClock, faShoppingCart, 
  faEye, faStar, faCalendarPlus, faBox,
  faSpinner, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../Cart/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import SimpleLoader from '../Common/SimpleLoader';
import './NewArrivals.css';

function NewArrivals() {
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const productsPerPage = 12;

  useEffect(() => {
    fetchNewArrivals();
  }, [currentPage, filter, sortBy]);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      console.log('Fetching new arrivals...');
      
      // Fetch only products marked as new arrivals by admin
      const response = await fetch('http://localhost:5000/api/products/new-arrivals');
      const newArrivals = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch new arrivals');
      }
      
      setNewProducts(newArrivals);
      console.log('New arrivals loaded:', newArrivals.length);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      setError('Failed to load new arrivals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      console.log('Adding new arrival to cart:', product);
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

  const getDaysAgo = (product) => {
    // Use newArrivalAddedAt if available, otherwise use createdAt
    const dateString = product.newArrivalAddedAt || product.createdAt;
    
    if (!dateString) return 'New';
    
    const productDate = new Date(dateString);
    const now = new Date();
    const diffTime = now - productDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Added Today';
    if (diffDays === 1) return 'Added Yesterday';
    if (diffDays <= 7) return `Added ${diffDays} days ago`;
    if (diffDays <= 30) return `Added ${Math.floor(diffDays / 7)} weeks ago`;
    return 'New Arrival';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon key={`full-${i}`} icon={faStar} className="newarrivals-star-filled" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon key="half" icon={faStar} className="newarrivals-star-half" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <FontAwesomeIcon key={`empty-${i}`} icon={faStar} className="newarrivals-star-empty" />
      );
    }

    return stars;
  };

  const filteredProducts = newProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toDateString();
      const dateToCheck = product.newArrivalAddedAt || product.createdAt;
      return dateToCheck ? new Date(dateToCheck).toDateString() === today : false;
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const dateToCheck = product.newArrivalAddedAt || product.createdAt;
      return dateToCheck ? new Date(dateToCheck) >= weekAgo : false;
    }
    return true;
  });

  // Paginate the filtered results
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) {
    return (
      <SimpleLoader 
        message="Loading New Arrivals"
        subtitle="Finding the latest products..."
      />
    );
  }

  return (
    <div className="newarrivals-page">
      <div className="newarrivals-container">
        {/* Hero Section */}
        <div className="newarrivals-hero">
          <div className="newarrivals-hero-content">
            <div className="newarrivals-hero-text">
              <h1>
                <FontAwesomeIcon icon={faGift} className="newarrivals-hero-icon" />
                New Arrivals
              </h1>
              <p>Fresh products just added to our collection</p>
            </div>
            <div className="newarrivals-stats">
              <div className="newarrivals-stat">
                <FontAwesomeIcon icon={faBox} />
                <span>{filteredProducts.length} New Products</span>
              </div>
              <div className="newarrivals-stat">
                <FontAwesomeIcon icon={faCalendarPlus} />
                <span>Updated Daily</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="newarrivals-controls">
          <div className="newarrivals-search">
            <FontAwesomeIcon icon={faSearch} className="newarrivals-search-icon" />
            <input
              type="text"
              placeholder="Search new arrivals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="newarrivals-search-input"
            />
          </div>

          <div className="newarrivals-filters">
            <button 
              className={`newarrivals-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All New
            </button>
            <button 
              className={`newarrivals-filter-btn ${filter === 'today' ? 'active' : ''}`}
              onClick={() => setFilter('today')}
            >
              <FontAwesomeIcon icon={faClock} />
              Today
            </button>
            <button 
              className={`newarrivals-filter-btn ${filter === 'week' ? 'active' : ''}`}
              onClick={() => setFilter('week')}
            >
              This Week
            </button>
          </div>

          <div className="newarrivals-sort">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="newarrivals-sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="newarrivals-error">
            <p>{error}</p>
            <button onClick={fetchNewArrivals} className="newarrivals-retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="newarrivals-grid">
          {paginatedProducts.map((product) => (
            <div key={product._id} className="newarrivals-card">
              <div className="newarrivals-badges">
                <div className="newarrivals-date-badge">
                  {getDaysAgo(product)}
                </div>
              </div>
              
              <div className="newarrivals-image-container">
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Product'} 
                  alt={product.name}
                  className="newarrivals-image"
                  onClick={() => navigate(`/products/${product._id}`)}
                />
                <div className="newarrivals-image-overlay">
                  <button 
                    className="newarrivals-quick-view-btn"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Quick View
                  </button>
                </div>
              </div>
              
              <div className="newarrivals-product-info">
                <h3 
                  className="newarrivals-product-title"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {product.name}
                </h3>
                
                <div className="newarrivals-product-category">{product.category}</div>
                
                <div className="newarrivals-product-rating">
                  <div className="newarrivals-stars">
                    {renderStars(product.averageRating || product.rating || 4)}
                  </div>
                  <span className="newarrivals-rating-text">
                    ({(product.averageRating || product.rating || 4).toFixed(1)})
                  </span>
                </div>
                
                <div className="newarrivals-product-price">
                  <span className="newarrivals-current-price">{formatPrice(product.price)}</span>
                </div>
                
                <div className="newarrivals-product-actions">
                  <button 
                    className="newarrivals-add-cart-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                    Add to Cart
                  </button>
                  <button 
                    className="newarrivals-view-btn"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Products State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="newarrivals-no-products">
            <FontAwesomeIcon icon={faBox} className="newarrivals-no-products-icon" />
            <h3>No New Arrivals Found</h3>
            <p>Check back soon for the latest products!</p>
          </div>
        )}

        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <div className="newarrivals-pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="newarrivals-pagination-btn"
            >
              Previous
            </button>
            
            <span className="newarrivals-pagination-info">
              Page {currentPage} of {totalFilteredPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalFilteredPages))}
              disabled={currentPage === totalFilteredPages}
              className="newarrivals-pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewArrivals;