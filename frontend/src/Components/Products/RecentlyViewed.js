import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faClock, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRecentlyViewed } from './RecentlyViewedContext';
import { useCart } from '../Cart/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './RecentlyViewed.css';

const RecentlyViewed = ({ limit = 6, showTitle = true }) => {
  const navigate = useNavigate();
  const { items, clearRecentlyViewed } = useRecentlyViewed();
  const { addItem, openCart } = useCart();
  const { formatPrice } = useCurrency();

  const displayItems = limit ? items.slice(0, limit) : items;

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const result = await addItem(product._id, 1);
    if (result.ok) {
      openCart();
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FontAwesomeIcon 
          key={i} 
          icon={faStar} 
          className={i < fullStars ? 'star-filled' : 'star-empty'} 
        />
      );
    }
    return stars;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed-section">
      {showTitle && (
        <div className="recently-viewed-header">
          <h2>
            <FontAwesomeIcon icon={faClock} className="header-icon" />
            Recently Viewed
          </h2>
          {items.length > 0 && (
            <button className="clear-history-btn" onClick={clearRecentlyViewed}>
              <FontAwesomeIcon icon={faTrash} /> Clear
            </button>
          )}
        </div>
      )}
      
      <div className="recently-viewed-grid">
        {displayItems.map(product => (
          <div key={product._id} className="recently-viewed-card">
            <div className="rv-image-container">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/150'} 
                alt={product.name}
                onClick={() => navigate(`/products/${product._id}`)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
            </div>
            <div className="rv-info">
              <h4 onClick={() => navigate(`/products/${product._id}`)}>
                {product.name}
              </h4>
              <div className="rv-rating">
                {renderStars(product.rating)}
              </div>
              <p className="rv-price">{formatPrice(product.price)}</p>
              <button 
                className="rv-add-cart-btn"
                onClick={() => handleAddToCart(product)}
              >
                <FontAwesomeIcon icon={faShoppingCart} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > limit && (
        <div className="view-all-link">
          <button onClick={() => navigate('/products')}>
            View All Products →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;
