import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faStar, 
  faArrowLeft, 
  faSpinner,
  faCheck,
  faBox,
  faTag,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import './ProductDetail.css';
import { useCart } from '../Cart/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import ReviewDisplay from '../Reviews/ReviewDisplay';
import ReviewForm from '../Reviews/ReviewForm';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatCurrency } = useSettings();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Get user token
    const token = localStorage.getItem('token');
    setUserToken(token);
    
    // Fetch product details
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        console.error('Failed to fetch product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!userToken) {
      alert('Please log in to add products to your cart');
      sessionStorage.setItem('loginRedirect', window.location.pathname);
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const result = await addItem(product._id, 1);
      if (result?.ok) {
        alert('Product added to cart!');
      } else {
        alert('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FontAwesomeIcon 
        key={i} 
        icon={faStar} 
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  const handleReviewSubmitted = () => {
    // Refresh the review display
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/products')} className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <button onClick={() => navigate('/products')} className="back-btn">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Products
        </button>
      </div>

      <div className="product-detail-main">
        <div className="product-images">
          <img 
            src={product.imageUrl || 'https://via.placeholder.com/400?text=Product'} 
            alt={product.name}
          />
        </div>

        <div className="product-info">
          <div className="product-category">
            <FontAwesomeIcon icon={faTag} />
            {product.category}
          </div>
          
          <h1>{product.name}</h1>
          
          <div className="product-rating">
            <div className="stars">
              {renderStars(Math.round(product.averageRating || product.rating || 0))}
            </div>
            <span className="rating-text">
              {(product.averageRating || product.rating || 0).toFixed(1)} 
              ({product.totalReviews || 0} reviews)
            </span>
          </div>

          <div className="product-price">
            <FontAwesomeIcon icon={faDollarSign} />
            <span className="price">{formatCurrency(product.price)}</span>
          </div>

          <div className="product-brand">
            <strong>Brand:</strong> {product.brand}
          </div>

          <div className="product-stock">
            <FontAwesomeIcon icon={faBox} />
            <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="product-actions">
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="add-to-cart-btn"
            >
              {addingToCart ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Adding...
                </>
              ) : product.stock === 0 ? (
                'Out of Stock'
              ) : (
                <>
                  <FontAwesomeIcon icon={faShoppingCart} />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="description-section">
        <h3>Product Description</h3>
        <p>{product.description}</p>
        
        <div className="product-specifications">
          <h4>Product Details</h4>
          <ul>
            <li><strong>Category:</strong> {product.category}</li>
            <li><strong>Brand:</strong> {product.brand}</li>
            <li><strong>SKU:</strong> {product._id}</li>
            {product.featured && (
              <li>
                <strong>Featured Product</strong>
                <FontAwesomeIcon icon={faCheck} style={{ color: '#4CAF50', marginLeft: '8px' }} />
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Write Review Section */}
      <div className="write-review-section">
        <h3>Write a Review</h3>
        <ReviewForm 
          productId={product._id}
          userToken={userToken}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>

      {/* All Reviews Display */}
      <div className="all-reviews-section">
        <h3>Customer Reviews ({product.totalReviews || 0})</h3>
        <ReviewDisplay 
          productId={product._id}
          userToken={userToken}
        />
      </div>
    </div>
  );
};

export default ProductDetail;