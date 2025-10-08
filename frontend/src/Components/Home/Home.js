import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import './Home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(0);
  const navigate = useNavigate();
  const { formatCurrency, settings } = useSettings();
  
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
        console.log('🔄 Fetching promotions from API...');
        console.log('📅 Current date/time:', new Date().toISOString());
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Use the new flexible homepage endpoint
        const promoResponse = await fetch('http://localhost:5000/api/promotions/homepage', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        console.log('📡 Promotions API response status:', promoResponse.status);
        
        if (promoResponse.ok) {
          const promoData = await promoResponse.json();
          console.log('📦 Promotions API full response:', promoData);
          
          let promotionsToShow = [];
          
          if (promoData.success && Array.isArray(promoData.data)) {
            // Get all promotions and filter more loosely
            const allPromotions = promoData.data;
            console.log('🎁 Total promotions found:', allPromotions.length);
            
            // Filter promotions more flexibly - show if ANY of these conditions are met:
            // 1. isActive is true
            // 2. No isActive field (assume active)
            // 3. Has a valid name and code
            promotionsToShow = allPromotions.filter(promo => {
              const hasBasicInfo = promo.name && promo.code;
              const isActiveField = promo.isActive !== false; // true or undefined
              const isNotExpired = !promo.endDate || new Date(promo.endDate) >= new Date();
              
              console.log(`🔍 Checking promotion: ${promo.name}`);
              console.log(`   - Has basic info: ${hasBasicInfo}`);
              console.log(`   - Active field: ${promo.isActive} (treating as ${isActiveField})`);
              console.log(`   - End date: ${promo.endDate} (expired: ${!isNotExpired})`);
              
              return hasBasicInfo && (isActiveField || isNotExpired);
            });
            
            // If still no promotions, just take the first 3 that have name and code
            if (promotionsToShow.length === 0 && allPromotions.length > 0) {
              console.log('🚨 FORCING promotions to show - taking first available promotions');
              promotionsToShow = allPromotions
                .filter(promo => promo.name && promo.code)
                .slice(0, 3);
            }
            
            console.log('✅ Final promotions to display:', promotionsToShow.length);
            promotionsToShow.forEach((promo, index) => {
              console.log(`   ${index + 1}. ${promo.name} (${promo.code}) - ${promo.type}`);
            });
            
            setPromotions(promotionsToShow);
          } else {
            console.warn('⚠️ Invalid promotions data structure:', promoData);
            setPromotions([]);
          }
        } else {
          console.error('❌ Promotions API failed with status:', promoResponse.status);
          const errorData = await promoResponse.text();
          console.error('Error response:', errorData);
          setPromotions([]); // Ensure fallback promotions show
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('❌ Promotions API request timed out');
        } else {
          console.error('❌ Error fetching promotions:', error);
        }
        setPromotions([]); // Ensure fallback promotions show
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
    if (productId) {
      navigate(`/products/${productId}`);
    } else {
      console.error('Product ID is missing');
    }
  };

  // Category carousel functions
  const CATEGORIES_PER_PAGE = 6;
  
  const staticCategories = [
    // First 6 categories with your local images
    { name: 'Televisions', image: '/images/categories/televisions.jpg' },
    { name: 'Laptops', image: '/images/categories/laptops.jpg' },
    { name: 'Mobile Phones', image: '/images/categories/smartphones.jpg' },
    { name: 'Kitchen Appliances', image: '/images/categories/kitchen-appliances.jpg' },
    { name: 'Refrigerators', image: '/images/categories/Refrigerators.jpg' },
    { name: 'Air Conditioners', image: '/images/categories/Air-Conditioners.jpg' },
    
    // Second page categories with local images where available
    { name: 'Audio Systems', image: '/images/categories/Audio-Systems.jpg' },
    { name: 'Washing Machines', image: '/images/categories/Washing-Machines.jpg' },
    { name: 'Computer Accessories', image: '/images/categories/Computer-Accessories.jpg' },
    { name: 'Tablets', image: '/images/categories/Tablets.jpg' },
    { name: 'Home Appliances', image: 'https://via.placeholder.com/250x180/4A90E2/FFFFFF?text=Home+Appliances' },
    { name: 'Cameras', image: '/images/categories/Cameras.jpg' }
  ];

  const getCurrentCategories = () => {
    const startIndex = currentCategoryPage * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    return staticCategories.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(staticCategories.length / CATEGORIES_PER_PAGE);
  };

  const nextCategoryPage = () => {
    if (currentCategoryPage < getTotalPages() - 1) {
      setCurrentCategoryPage(prev => prev + 1);
    }
  };

  const prevCategoryPage = () => {
    if (currentCategoryPage > 0) {
      setCurrentCategoryPage(prev => prev - 1);
    }
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
      <section className="hero-section" style={{backgroundImage: 'url(/images/categories/background.jpg)'}}>
        <div className="hero-banner">
          <div className="hero-content">
            <div className="hero-badge">✨ Vithanage Enterprises</div>
            <h1>Premium Electronics Store</h1>
            <p>Discover cutting-edge technology and innovative solutions for your digital lifestyle</p>
            <div className="hero-features">
              <div className="hero-feature">
                <span className="feature-icon">🚚</span>
                <span>Fast Shipping</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">🛡️</span>
                <span>Warranty Guaranteed</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">⭐</span>
                <span>Premium Quality</span>
              </div>
            </div>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/products')}>
                Explore Products
              </button>
              <button className="btn-secondary" onClick={() => navigate('/products')}>
                Latest Arrivals
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Debug info */}
      {console.log('Current promotions state:', promotions)}
      {console.log('Promotions length:', promotions.length)}
      
      {/* Promotion Section */}
      <section className="promo-banners">
        
        {/* Database promotions if available */}
        {promotions.length > 0 && promotions.slice(0, 3).map((promotion, index) => {
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
              return `${formatCurrency(promotion.discountValue)} OFF`;
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
                <div className="promo-code-container">
                  <div className="promo-code">Code: {promotion.code}</div>
                  <button 
                    className="copy-code-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(promotion.code).then(() => {
                        // Show success feedback
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.backgroundColor = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.backgroundColor = '';
                        }, 2000);
                      }).catch(() => {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = promotion.code;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.backgroundColor = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.backgroundColor = '';
                        }, 2000);
                      });
                    }}
                    title="Click to copy promotion code"
                  >
                    📋 Copy
                  </button>
                </div>
                {promotion.minimumOrderValue > 0 && (
                  <small className="promo-min-order">
                    Min order: {formatCurrency(promotion.minimumOrderValue)}
                  </small>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Fallback promotions if no database promotions */}
        {promotions.length === 0 && (
          <>
            <div className="promo-banner flash-deal">
              <div className="promo-icon">⚡</div>
              <div className="promo-content">
                <h3>Flash Deal</h3>
                <p>Limited Time Only!</p>
                <span className="promo-discount">50% OFF</span>
                <div className="promo-code-container">
                  <div className="promo-code">Code: FLASH50</div>
                  <button 
                    className="copy-code-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText('FLASH50').then(() => {
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.backgroundColor = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.backgroundColor = '';
                        }, 2000);
                      });
                    }}
                    title="Click to copy promotion code"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="promo-banner free-shipping">
              <div className="promo-icon">🚚</div>
              <div className="promo-content">
                <h3>Free Shipping</h3>
                <p>On orders over {formatCurrency(settings.freeShippingThreshold || 100)}</p>
                <span className="promo-discount">FREE DELIVERY</span>
                <div className="promo-code-container">
                  <div className="promo-code">Code: FREESHIP</div>
                  <button 
                    className="copy-code-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText('FREESHIP').then(() => {
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.backgroundColor = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.backgroundColor = '';
                        }, 2000);
                      });
                    }}
                    title="Click to copy promotion code"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="promo-banner new-arrivals">
              <div className="promo-icon">✨</div>
              <div className="promo-content">
                <h3>Special Offer</h3>
                <p>Latest Collection</p>
                <span className="promo-discount">30% OFF</span>
                <div className="promo-code-container">
                  <div className="promo-code">Code: SPECIAL30</div>
                  <button 
                    className="copy-code-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText('SPECIAL30').then(() => {
                        const btn = e.target;
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.backgroundColor = '#28a745';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.style.backgroundColor = '';
                        }, 2000);
                      });
                    }}
                    title="Click to copy promotion code"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      
      {/* Original Promotional Banners - Real Database Promotions */}
      {false && promotions.length > 0 && (
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
                return `${formatCurrency(promotion.discountValue)} OFF`;
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
                      Min order: {formatCurrency(promotion.minimumOrderValue)}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Fallback Promotional Banners - If no database promotions */}
      {false && promotions.length === 0 && (
        <section className="promo-banners">
          <div className="promo-banner flash-deal">
            <div className="promo-icon">⚡</div>
            <div className="promo-content">
              <h3>Flash Deal</h3>
              <p>Limited Time Only!</p>
              <span className="promo-discount">50% OFF</span>
              <div className="promo-code">Code: FLASH50</div>
            </div>
          </div>
          <div className="promo-banner free-shipping">
            <div className="promo-icon">🚚</div>
            <div className="promo-content">
              <h3>Free Shipping</h3>
              <p>On orders over {formatCurrency(settings.freeShippingThreshold || 100)}</p>
              <span className="promo-discount">FREE DELIVERY</span>
              <div className="promo-code">Code: FREESHIP</div>
            </div>
          </div>
          <div className="promo-banner new-arrivals">
            <div className="promo-icon">✨</div>
            <div className="promo-content">
              <h3>Special Offer</h3>
              <p>Latest Collection</p>
              <span className="promo-discount">30% OFF</span>
              <div className="promo-code">Code: SPECIAL30</div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Showcase - Carousel */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Shop by Categories</h2>
          <p>Explore our wide range of products</p>
        </div>
        
        <div className="category-carousel-wrapper">
          {/* Carousel Controls */}
          <button 
            className={`carousel-arrow carousel-arrow-left ${currentCategoryPage === 0 ? 'disabled' : ''}`}
            onClick={prevCategoryPage}
            disabled={currentCategoryPage === 0}
          >
            &#8249;
          </button>
          
          <button 
            className={`carousel-arrow carousel-arrow-right ${currentCategoryPage >= getTotalPages() - 1 ? 'disabled' : ''}`}
            onClick={nextCategoryPage}
            disabled={currentCategoryPage >= getTotalPages() - 1}
          >
            &#8250;
          </button>
          
          {/* Page Indicator */}
          <div className="page-indicator">
            {currentCategoryPage + 1} / {getTotalPages()}
          </div>
          
          {/* Categories Grid */}
          <div className="category-carousel-grid">
            {getCurrentCategories().map((category, index) => (
              <div 
                key={index} 
                className="carousel-category-card" 
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="category-image">
                  <img 
                    src={category.image}
                    alt={category.name}
                  />
                  <div className="category-overlay">
                    <span>Shop Now</span>
                  </div>
                </div>
                <h3>{category.name}</h3>
              </div>
            ))}
          </div>
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
                  <span className="current-price">{formatCurrency(product.price)}</span>
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
                  <span className="current-price">{formatCurrency(product.price)}</span>
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
                  <span className="current-price">{formatCurrency(product.price)}</span>
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