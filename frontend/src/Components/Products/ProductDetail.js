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
  faDollarSign,
  faHeart,
  faShare,
  faTruck,
  faShieldAlt,
  faMinus,
  faPlus,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import './ProductDetail.css';
import { useCart } from '../Cart/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import ReviewDisplay from '../Reviews/ReviewDisplay';
import ReviewForm from '../Reviews/ReviewForm';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Get user token
    const token = localStorage.getItem('token');
    setUserToken(token);
    
    // Fetch product details
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]); // Re-fetch when product ID changes

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        setSelectedImage(data.imageUrl);
        // Fetch related products from same category
        fetchRelatedProducts(data.category, data._id);
      } else {
        console.error('Failed to fetch product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category, currentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products`);
      if (response.ok) {
        const allProducts = await response.json();
        
        // Get 5 products from same category (excluding current)
        const sameCategory = allProducts
          .filter(p => p.category === category && p._id !== currentId)
          .slice(0, 5);
        
        // Get 3 products from other categories (excluding current and same category)
        const sameCategoryIds = sameCategory.map(p => p._id);
        const otherCategories = allProducts
          .filter(p => p._id !== currentId && p.category !== category && !sameCategoryIds.includes(p._id))
          .sort(() => Math.random() - 0.5) // Shuffle
          .slice(0, 3);
        
        // Combine and shuffle all products for variety
        const combined = [...sameCategory, ...otherCategories]
          .sort(() => Math.random() - 0.5);
        
        setRelatedProducts(combined);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
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
      const result = await addItem(product._id, quantity);
      if (result?.ok) {
        alert(`${quantity} item(s) added to cart!`);
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

  const handleBuyNow = async () => {
    if (!userToken) {
      alert('Please log in to proceed with your purchase');
      sessionStorage.setItem('loginRedirect', window.location.pathname);
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const result = await addItem(product._id, quantity);
      if (result?.ok) {
        // Navigate to place order page immediately
        navigate('/place-order');
      } else {
        alert('Failed to add product to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to process your request. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
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
        <button onClick={() => navigate('/products')} className="btn-add-to-cart">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="modern-product-page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-container">
        <div className="container">
          <div className="breadcrumb">
            <span onClick={() => navigate('/')} className="breadcrumb-link">Home</span>
            <span className="separator">›</span>
            <span onClick={() => navigate('/products')} className="breadcrumb-link">Products</span>
            <span className="separator">›</span>
            <span onClick={() => navigate('/products?category=' + product.category)} className="breadcrumb-link">{product.category}</span>
            <span className="separator">›</span>
            <span className="breadcrumb-current">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container">
        <div className="product-main-section">
          {/* Left - Image Gallery */}
          <div className="product-gallery">
            <div className="main-image-container">
              <img 
                src={selectedImage || product.imageUrl || 'https://via.placeholder.com/600?text=Product'} 
                alt={product.name}
                className="main-product-image"
              />
              {product.featured && <div className="featured-badge">Featured</div>}
            </div>
          </div>

          {/* Right - Product Info */}
          <div className="product-details-panel">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-meta">
              <div className="rating-section">
                <div className="stars-large">
                  {renderStars(Math.round(product.averageRating || product.rating || 0))}
                </div>
                <span className="rating-score">{(product.averageRating || product.rating || 0).toFixed(1)}</span>
                <span className="review-count">({product.totalReviews || 0} Reviews)</span>
              </div>
              <div className="brand-tag">
                <FontAwesomeIcon icon={faStore} />
                <span>Brand: <strong>{product.brand}</strong></span>
              </div>
            </div>

            <div className="price-section">
              <div className="current-price">{formatPrice(product.price)}</div>
            </div>

            <div className="stock-delivery-info">
              <div className="stock-status">
                <FontAwesomeIcon icon={faBox} className={product.stock > 0 ? 'stock-icon-available' : 'stock-icon-out'} />
                <span className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>
                  {product.stock > 0 ? `${product.stock} units available` : 'Out of Stock'}
                </span>
              </div>
              <div className="delivery-info">
                <FontAwesomeIcon icon={faTruck} />
                <span>Free delivery on orders over $50</span>
              </div>
              <div className="warranty-info">
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>100% Authentic & Warranty</span>
              </div>
            </div>

            <div className="quantity-cart-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button onClick={decreaseQuantity} disabled={quantity <= 1} className="qty-btn">
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <input type="number" value={quantity} readOnly className="qty-input" />
                  <button onClick={increaseQuantity} disabled={quantity >= product.stock} className="qty-btn">
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock === 0}
                  className="btn-add-to-cart"
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
                <button 
                  className="btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={addingToCart || product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Tabs */}
        <div className="product-info-tabs">
          <div className="tab-section">
            <h2 className="section-title">Product Description</h2>
            <div className="description-content">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="tab-section">
            <h2 className="section-title">Product Specifications</h2>
            <table className="specifications-table">
              <tbody>
                <tr>
                  <td className="spec-label">Brand</td>
                  <td className="spec-value">{product.brand}</td>
                </tr>
                <tr>
                  <td className="spec-label">Category</td>
                  <td className="spec-value">{product.category}</td>
                </tr>
                <tr>
                  <td className="spec-label">SKU</td>
                  <td className="spec-value">{product._id}</td>
                </tr>
                <tr>
                  <td className="spec-label">Availability</td>
                  <td className="spec-value">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section-modern">
          <h2 className="section-title">Customer Reviews ({product.totalReviews || 0})</h2>
          
          <div className="write-review-modern">
            <ReviewForm 
              productId={product._id}
              userToken={userToken}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>

          <div className="reviews-list-modern">
            <ReviewDisplay 
              productId={product._id}
              userToken={userToken}
            />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="section-title">You May Also Like</h2>
            <div className="related-products-grid">
              {relatedProducts.map(relatedProduct => (
                <div 
                  key={relatedProduct._id} 
                  className="related-product-card"
                  onClick={() => navigate(`/products/${relatedProduct._id}`)}
                >
                  <div className="related-product-image">
                    <img 
                      src={relatedProduct.imageUrl || 'https://via.placeholder.com/200'} 
                      alt={relatedProduct.name}
                    />
                  </div>
                  <div className="related-product-info">
                    <h3 className="related-product-name">{relatedProduct.name}</h3>
                    <div className="related-product-rating">
                      {renderStars(Math.round(relatedProduct.averageRating || relatedProduct.rating || 0))}
                      <span>({relatedProduct.totalReviews || 0})</span>
                    </div>
                    <div className="related-product-price">{formatPrice(relatedProduct.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;