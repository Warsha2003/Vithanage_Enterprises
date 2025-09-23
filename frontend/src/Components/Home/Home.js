import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await fetch('http://localhost:5000/api/products');
      const allProducts = await productsResponse.json();
      
      // Get categories
      const uniqueCategories = [...new Set(allProducts.map(product => product.category))];
      setCategories(uniqueCategories.slice(0, 6));
      
      // Get featured products (first 8 products)
      setFeaturedProducts(allProducts.slice(0, 8));
      
      // Get trending products (products with rating >= 4.0)
      const trending = allProducts.filter(product => (product.rating || 4) >= 4.0).slice(0, 6);
      setTrendingProducts(trending);
      
      // Get new arrivals (last 6 products added)
      setNewArrivals(allProducts.slice(-6).reverse());
      
      // Fetch promotions
      try {
        const promoResponse = await fetch('http://localhost:5000/api/promotions/active');
        if (promoResponse.ok) {
          const promoData = await promoResponse.json();
          setPromotions(promoData.data || []);
        }
      } catch (error) {
        console.log('No promotions available');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };
  
  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading amazing deals...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Main Hero Banner */}
      <section className="hero-section">
        <div className="hero-banner">
          <div className="hero-content">
            <div className="hero-badge">🔥 MEGA SALE</div>
            <h1>Up to 70% OFF</h1>
            <p>On Premium Electronics & Fashion Items</p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/products')}>
                Shop Now
              </button>
              <button className="btn-secondary" onClick={() => navigate('/products')}>
                View All Deals
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=MEGA+SALE+70%25+OFF" alt="Mega Sale" />
          </div>
        </div>
      </section>

      {/* Promotional Banners - Real Database Promotions */}
      {promotions.length > 0 && (
        <section className="promo-banners">
          {promotions.slice(0, 3).map((promotion, index) => {
            // Determine promotion type for styling and icons
            const getPromotionStyle = (type) => {
              switch (type) {
                case 'percentage':
                  return { class: 'flash-deal', icon: '⚡' };
                case 'fixed_amount':
                  return { class: 'flash-deal', icon: '💰' };
                case 'free_shipping':
                  return { class: 'free-shipping', icon: '🚚' };
                default:
                  return { class: 'new-arrivals', icon: '✨' };
              }
            };

            const style = getPromotionStyle(promotion.type);
            
            // Format discount display
            const getDiscountText = () => {
              if (promotion.type === 'percentage') {
                return `${promotion.discountValue}% OFF`;
              } else if (promotion.type === 'fixed_amount') {
                return `$${promotion.discountValue} OFF`;
              } else if (promotion.type === 'free_shipping') {
                return 'FREE SHIPPING';
              } else {
                return 'SPECIAL OFFER';
              }
            };

            return (
              <div key={promotion._id} className={`promo-banner ${style.class}`}>
                <div className="promo-icon">{style.icon}</div>
                <div className="promo-content">
                  <h3>{promotion.name}</h3>
                  <p>{promotion.description}</p>
                  <span className="promo-discount">{getDiscountText()}</span>
                  <div className="promo-code">Code: {promotion.code}</div>
                  {promotion.minimumOrderValue > 0 && (
                    <small className="promo-min-order">
                      Min order: ${promotion.minimumOrderValue}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Fallback Promotional Banners - If no database promotions */}
      {promotions.length === 0 && (
        <section className="promo-banners">
          <div className="promo-banner flash-deal">
            <div className="promo-icon">⚡</div>
            <div className="promo-content">
              <h3>Flash Deal</h3>
              <p>Limited Time Only!</p>
              <span className="promo-discount">50% OFF</span>
            </div>
          </div>
          <div className="promo-banner free-shipping">
            <div className="promo-icon">🚚</div>
            <div className="promo-content">
              <h3>Free Shipping</h3>
              <p>On orders over $50</p>
              <span className="promo-code">FREE50</span>
            </div>
          </div>
          <div className="promo-banner new-arrivals">
            <div className="promo-icon">✨</div>
            <div className="promo-content">
              <h3>New Arrivals</h3>
              <p>Latest Collection</p>
              <span className="promo-text">Explore Now</span>
            </div>
          </div>
        </section>
      )}

      {/* Categories Showcase */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Shop by Categories</h2>
          <p>Explore our wide range of products</p>
        </div>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="category-card"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="category-image">
                <img 
                  src={`https://via.placeholder.com/200x150/4ECDC4/FFFFFF?text=${category}`}
                  alt={category}
                />
                <div className="category-overlay">
                  <span>Shop Now</span>
                </div>
              </div>
              <h3>{category}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header">
          <h2>🔥 Featured Products</h2>
          <p>Hand-picked items just for you</p>
        </div>
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <div 
              key={product._id}
              className="product-card featured"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/FF9F43/FFFFFF?text=No+Image'} 
                  alt={product.name}
                />
                <div className="product-badge featured">Featured</div>
                <div className="product-overlay">
                  <button className="quick-view">Quick View</button>
                </div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <div className="product-rating">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  <span className="rating-text">({product.rating || 4.0})</span>
                </div>
                <div className="product-price">
                  <span className="current-price">${product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="view-more">
          <button className="btn-outline" onClick={() => navigate('/products')}>
            View All Products
          </button>
        </div>
      </section>

      {/* Trending Products */}
      <section className="trending-section">
        <div className="section-header">
          <h2>🚀 Trending Now</h2>
          <p>Most popular items this week</p>
        </div>
        <div className="products-grid trending">
          {trendingProducts.map((product) => (
            <div 
              key={product._id}
              className="product-card trending"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/2ECC71/FFFFFF?text=No+Image'} 
                  alt={product.name}
                />
                <div className="product-badge trending">Trending</div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-rating">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  <span className="rating-text">({product.rating || 4.0})</span>
                </div>
                <div className="product-price">
                  <span className="current-price">${product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="new-arrivals-section">
        <div className="section-header">
          <h2>✨ New Arrivals</h2>
          <p>Fresh products just added to our collection</p>
        </div>
        <div className="products-grid new-arrivals">
          {newArrivals.map((product) => (
            <div 
              key={product._id}
              className="product-card new"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/9B59B6/FFFFFF?text=No+Image'} 
                  alt={product.name}
                />
                <div className="product-badge new">New</div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-price">
                  <span className="current-price">${product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Explore More?</h2>
          <p>Discover thousands of amazing products with incredible deals</p>
          <button className="cta-button" onClick={() => navigate('/products')}>
            Browse All Products
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;