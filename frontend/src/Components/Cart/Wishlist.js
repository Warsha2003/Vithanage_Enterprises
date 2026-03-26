import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faTrash, faStar, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useWishlist } from './WishlistContext';
import { useCart } from './CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { items, loading, removeFromWishlist, moveToCart, clearWishlist, fetchWishlist } = useWishlist();
  const { openCart } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleMoveToCart = async (productId) => {
    const result = await moveToCart(productId);
    if (result.ok) {
      openCart();
    }
  };

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      await clearWishlist();
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
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

  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-empty">
          <FontAwesomeIcon icon={faHeart} className="empty-icon" />
          <h2>Please Login to View Your Wishlist</h2>
          <p>Sign in to save items you love and access them anytime.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1>
          <FontAwesomeIcon icon={faHeart} className="header-icon" />
          My Wishlist
        </h1>
        {items.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll} disabled={loading}>
            <FontAwesomeIcon icon={faTrash} /> Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <FontAwesomeIcon icon={faHeart} className="empty-icon" />
          <h2>Your Wishlist is Empty</h2>
          <p>Save items you love by clicking the heart icon on any product.</p>
          <button className="btn-primary" onClick={() => navigate('/products')}>
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <p className="wishlist-count">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          <div className="wishlist-grid">
            {items.map(product => (
              <div key={product._id} className="wishlist-card">
                <div className="wishlist-image-container">
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/200x200?text=Product'} 
                    alt={product.name}
                    onClick={() => navigate(`/products/${product._id}`)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                  />
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemove(product._id)}
                    disabled={loading}
                    title="Remove from wishlist"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                
                <div className="wishlist-info">
                  <h3 onClick={() => navigate(`/products/${product._id}`)}>
                    {product.name}
                  </h3>
                  
                  <p className="wishlist-category">{product.category}</p>
                  
                  {product.rating && (
                    <div className="wishlist-rating">
                      {renderStars(product.rating)}
                      <span>({product.rating.toFixed(1)})</span>
                    </div>
                  )}
                  
                  <p className="wishlist-price">{formatPrice(product.price)}</p>
                  
                  <div className="wishlist-stock">
                    {product.stock > 0 ? (
                      <span className="in-stock">In Stock</span>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>
                  
                  <button 
                    className="move-to-cart-btn"
                    onClick={() => handleMoveToCart(product._id)}
                    disabled={loading || product.stock === 0}
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                    {product.stock > 0 ? 'Move to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
