import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faShoppingCart, faTag, faPlus, faPercent } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../Cart/CartContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './ProductBundles.css';

const ProductBundles = ({ productId = null, limit = 3 }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchBundles();
  }, [productId]);

  const fetchBundles = async () => {
    try {
      const url = productId 
        ? `http://localhost:5000/api/bundles/suggested/${productId}`
        : 'http://localhost:5000/api/bundles';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBundles(limit ? data.slice(0, limit) : data);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBundleToCart = async (bundle) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Add all products in bundle to cart
      for (const item of bundle.products) {
        if (item.product && item.product._id) {
          await addItem(item.product._id, item.quantity || 1);
        }
      }
      openCart();
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <div className="bundles-section">
      <div className="bundles-header">
        <h3>
          <FontAwesomeIcon icon={faBoxOpen} className="header-icon" />
          {productId ? 'Buy Together & Save' : 'Special Bundles'}
        </h3>
        <p className="bundles-subtitle">Get more value with these product bundles</p>
      </div>

      <div className="bundles-grid">
        {bundles.map((bundle) => (
          <div key={bundle._id} className="bundle-card">
            <div className="bundle-discount-badge">
              <FontAwesomeIcon icon={faPercent} />
              Save {bundle.discountPercent}%
            </div>

            <div className="bundle-products">
              {bundle.products.slice(0, 3).map((item, index) => (
                <React.Fragment key={item.product?._id || index}>
                  <div className="bundle-product-item">
                    <img 
                      src={item.product?.imageUrl || 'https://via.placeholder.com/80'} 
                      alt={item.product?.name}
                      onClick={() => navigate(`/products/${item.product?._id}`)}
                    />
                    {item.quantity > 1 && (
                      <span className="product-quantity">x{item.quantity}</span>
                    )}
                  </div>
                  {index < bundle.products.slice(0, 3).length - 1 && (
                    <div className="plus-icon">
                      <FontAwesomeIcon icon={faPlus} />
                    </div>
                  )}
                </React.Fragment>
              ))}
              {bundle.products.length > 3 && (
                <div className="more-products">+{bundle.products.length - 3} more</div>
              )}
            </div>

            <div className="bundle-info">
              <h4 className="bundle-name">{bundle.name}</h4>
              {bundle.description && (
                <p className="bundle-description">{bundle.description}</p>
              )}
              
              <div className="bundle-pricing">
                <div className="original-price">
                  <span className="label">Original:</span>
                  <span className="price strikethrough">{formatPrice(bundle.originalPrice)}</span>
                </div>
                <div className="bundle-price">
                  <span className="label">Bundle Price:</span>
                  <span className="price">{formatPrice(bundle.bundlePrice)}</span>
                </div>
                <div className="savings">
                  <FontAwesomeIcon icon={faTag} />
                  You save {formatPrice(bundle.originalPrice - bundle.bundlePrice)}!
                </div>
              </div>

              <button 
                className="add-bundle-btn"
                onClick={() => handleAddBundleToCart(bundle)}
              >
                <FontAwesomeIcon icon={faShoppingCart} />
                Add Bundle to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductBundles;
