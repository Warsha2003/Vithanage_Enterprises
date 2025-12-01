import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFire, faClock, faTag, faShoppingCart, 
  faHeart, faEye, faStar, faPercentage,
  faSpinner, faFilter, faSort
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../Cart/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import SimpleLoader from '../Common/SimpleLoader';
import './TodaysDeals.css';

function TodaysDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('discount');
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchActiveDeals();
  }, []);

  const fetchActiveDeals = async () => {
    try {
      setLoading(true);
      console.log('Fetching active deals from API...');
      const response = await fetch('http://localhost:5000/api/deals/active');
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch deals');
      }
      
      setDeals(data.data || []);
      console.log('Deals loaded:', data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setError('Failed to load today\'s deals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end - now;
    
    if (timeDiff <= 0) return 'Expired';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 24) {
      return `${hours}h ${minutes}m left`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} days left`;
    }
  };

  const handleAddToCart = async (deal) => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      console.log('Adding deal to cart:', deal);
      const result = await addItem(deal.productId._id, 1);
      
      if (result?.ok) {
        alert(`${deal.productId.name} added to cart at deal price!`);
      } else {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  const filteredAndSortedDeals = deals
    .filter(deal => {
      if (filter === 'all') return true;
      if (filter === 'ending-soon') {
        const hoursLeft = (new Date(deal.endDate) - new Date()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 24;
      }
      if (filter === 'high-discount') return deal.discountPercentage >= 30;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discountPercentage - a.discountPercentage;
        case 'price-low':
          return a.dealPrice - b.dealPrice;
        case 'price-high':
          return b.dealPrice - a.dealPrice;
        case 'ending-soon':
          return new Date(a.endDate) - new Date(b.endDate);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <SimpleLoader 
        message="Loading Today's Deals"
        subtitle="Finding the best discounts..."
      />
    );
  }

  return (
    <div className="todays-deals-page">
      <div className="deals-container">
        {/* Header */}
        <div className="deals-header">
          <div className="header-content">
            <div className="header-text">
              <h1>
                <FontAwesomeIcon icon={faFire} className="header-icon" />
                Today's Deals
              </h1>
              <p>Limited time offers - grab them before they're gone!</p>
            </div>
            <div className="deals-stats">
              <span className="stat">
                <FontAwesomeIcon icon={faTag} />
                {deals.length} Active Deals
              </span>
              <span className="stat">
                <FontAwesomeIcon icon={faClock} />
                Limited Time Only
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchActiveDeals} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* No Deals State */}
        {!error && filteredAndSortedDeals.length === 0 && !loading && (
          <div className="no-deals">
            <FontAwesomeIcon icon={faTag} className="no-deals-icon" />
            <h3>No Active Deals</h3>
            <p>Check back soon for amazing deals and discounts!</p>
            <Link to="/products" className="browse-products-btn">
              Browse All Products
            </Link>
          </div>
        )}

        {/* Filters and Sorting */}
        {deals.length > 0 && (
          <div className="deals-controls">
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All Deals
              </button>
              <button 
                className={filter === 'ending-soon' ? 'active' : ''}
                onClick={() => setFilter('ending-soon')}
              >
                <FontAwesomeIcon icon={faClock} />
                Ending Soon
              </button>
              <button 
                className={filter === 'high-discount' ? 'active' : ''}
                onClick={() => setFilter('high-discount')}
              >
                <FontAwesomeIcon icon={faPercentage} />
                30%+ Off
              </button>
            </div>
            
            <div className="sort-options">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="discount">Highest Discount</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="ending-soon">Ending Soon</option>
              </select>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {filteredAndSortedDeals.length > 0 && (
          <div className="deals-grid">
            {filteredAndSortedDeals.map(deal => (
              <div key={deal._id} className="deal-card">
                {/* Deal Badge */}
                <div className="deal-badge">
                  <span className="discount-percent">
                    {deal.discountPercentage}% OFF
                  </span>
                  <div className="time-remaining">
                    <FontAwesomeIcon icon={faClock} />
                    {getTimeRemaining(deal.endDate)}
                  </div>
                </div>

                {/* Product Image */}
                <div className="deal-image">
                  <img 
                    src={deal.productId.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={deal.productId.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                  <div className="deal-overlay">
                    <Link 
                      to={`/products/${deal.productId._id}`}
                      className="view-product-btn"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      View Product
                    </Link>
                  </div>
                </div>

                {/* Deal Content */}
                <div className="deal-content">
                  <div className="deal-header-info">
                    <h3 className="deal-title">{deal.dealTitle}</h3>
                    <p className="product-name">{deal.productId.name}</p>
                  </div>

                  <div className="deal-pricing">
                    <div className="price-info">
                      <span className="deal-price">
                        {formatPrice(deal.dealPrice)}
                      </span>
                      <span className="original-price">
                        {formatPrice(deal.originalPrice)}
                      </span>
                    </div>
                    <div className="savings">
                      Save {formatPrice(deal.originalPrice - deal.dealPrice)}
                    </div>
                  </div>

                  <div className="deal-quantity">
                    <div className="quantity-bar">
                      <div 
                        className="quantity-progress"
                        style={{
                          width: `${Math.min(100, (deal.soldQuantity / deal.dealQuantity) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="quantity-text">
                      {Math.max(0, deal.dealQuantity - (deal.soldQuantity || 0))} left in stock
                    </span>
                  </div>

                  <div className="deal-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(deal)}
                      disabled={deal.remainingQuantity <= 0}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} />
                      {deal.remainingQuantity <= 0 ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    <button className="wishlist-btn">
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysDeals;