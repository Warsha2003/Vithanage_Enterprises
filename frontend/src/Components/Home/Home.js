import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './Home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(0);
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();

  // Banner slides data - Just images, no text
  const bannerSlides = [
    { id: 1, image: "/images/banners/banner1.jpg" },
    { id: 2, image: "/images/banners/banner2.jpg" },
    { id: 3, image: "/images/banners/banner3.jpg" },
    { id: 4, image: "/images/banners/banner4.jpg" },
    { id: 5, image: "/images/banners/banner5.jpg" },
    { id: 6, image: "/images/banners/banner6.jpg" }
  ];

  // Auto slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerSlides.length]);
  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };
  
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
      
      // Fetch new arrivals from dedicated API endpoint (products marked by admin)
      try {
        console.log('🆕 Fetching new arrivals from dedicated API...');
        const newArrivalsResponse = await fetch('http://localhost:5000/api/products/new-arrivals');
        if (newArrivalsResponse.ok) {
          const newArrivalsData = await newArrivalsResponse.json();
          console.log('✅ New arrivals fetched:', newArrivalsData.length);
          setNewArrivals(newArrivalsData.slice(0, 6)); // Show only 6 on home page
        } else {
          console.warn('⚠️ New arrivals API failed, falling back to recent products');
          setNewArrivals(allProducts.slice(-6).reverse());
        }
      } catch (error) {
        console.error('❌ Error fetching new arrivals:', error);
        setNewArrivals(allProducts.slice(-6).reverse()); // Fallback to recent products
      }
      
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
      {/* Hero Section with Banner and Promos */}
      <section className="hero-main-section">
        <div className="hero-content-wrapper">
          {/* Banner Slider - 3/4 width */}
          <div className="hero-banner-slider">
            <div className="banner-container">
              {bannerSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`banner-slide ${index === currentBanner ? 'active' : ''}`}
                  style={{
                    backgroundImage: `url(${slide.image})`
                  }}
                  onClick={() => navigate('/products')}
                />
              ))}
              
              {/* Navigation Arrows */}
              <button className="banner-arrow banner-arrow-left" onClick={prevBanner}>
                &#8249;
              </button>
              <button className="banner-arrow banner-arrow-right" onClick={nextBanner}>
                &#8250;
              </button>
              
              {/* Dots Indicator */}
              <div className="banner-dots">
                {bannerSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentBanner ? 'active' : ''}`}
                    onClick={() => setCurrentBanner(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Promotions in Banner Space - 1/4 width */}
          <div className="scrollable-promotions">
            <div className="promo-scroll-header">
              <h4>Promotions</h4>
              <span className="scroll-indicator">↕️ Scroll</span>
            </div>
            
            <div className="promo-scroll-container">
              {promotions.length > 0 ? (
                promotions.map((promotion, index) => {
                  const getPromotionStyle = (type) => {
                    switch (type) {
                      case 'percentage':
                        return { class: 'flash-deal', icon: '⚡' };
                      case 'fixed_amount':
                        return { class: 'free-shipping', icon: '💰' };
                      case 'free_shipping':
                        return { class: 'free-shipping', icon: '🚚' };
                      default:
                        return { class: 'new-customer', icon: '🎁' };
                    }
                  };

                  const style = getPromotionStyle(promotion.type);

                  return (
                    <div key={promotion._id} className="scroll-promo-card">
                      <div className="scroll-promo-icon">{style.icon}</div>
                      <div className="scroll-promo-content">
                        <h5>{promotion.name}</h5>
                        <p>{promotion.description}</p>
                        <div className="promo-code-section">
                          <span className="scroll-promo-code">{promotion.code}</span>
                          <button 
                            className="copy-code-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(promotion.code).then(() => {
                                const btn = e.target;
                                const originalText = btn.textContent;
                                btn.textContent = '✓';
                                btn.classList.add('copied');
                                setTimeout(() => {
                                  btn.textContent = originalText;
                                  btn.classList.remove('copied');
                                }, 1500);
                              });
                            }}
                            title="Copy promotion code"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-more-promos">
                  <p>No promotions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
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
        <div className="home-products-grid">
          {featuredProducts.map((product) => (
            <div 
              key={product._id}
              className="home-product-card home-featured"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="home-product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/FF9F43/FFFFFF?text=No+Image'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    e.target.style.objectFit = 'contain';
                  }}
                  onLoad={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                />
                <div className="home-product-badge home-featured-badge">Featured</div>
                <div className="home-product-overlay">
                  <button className="home-quick-view">Quick View</button>
                </div>
              </div>
              <div className="home-product-info">
                <h3>{product.name}</h3>
                <p className="home-product-category">{product.category}</p>
                <div className="home-product-rating">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  <span className="home-rating-text">({product.rating || 4.0})</span>
                </div>
                <div className="home-product-price">
                  <span className="home-current-price">{formatPrice(product.price)}</span>
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
        <div className="home-products-grid home-trending">
          {trendingProducts.map((product) => (
            <div 
              key={product._id}
              className="home-product-card home-trending"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="home-product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/2ECC71/FFFFFF?text=No+Image'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    e.target.style.objectFit = 'contain';
                  }}
                  onLoad={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                />
                <div className="home-product-badge home-trending-badge">Trending</div>
              </div>
              <div className="home-product-info">
                <h3>{product.name}</h3>
                <div className="home-product-category">{product.category}</div>
                <div className="home-product-rating">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  <span className="home-rating-text">({product.rating || 4.0})</span>
                </div>
                <div className="home-product-price">
                  <span className="home-current-price">{formatPrice(product.price)}</span>
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
        <div className="home-products-grid home-new-arrivals">
          {newArrivals.map((product) => (
            <div 
              key={product._id}
              className="home-product-card home-new"
              onClick={() => handleProductClick(product._id)}
            >
              <div className="home-product-image">
                <img 
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/250x200/9B59B6/FFFFFF?text=No+Image'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    e.target.style.objectFit = 'contain';
                  }}
                  onLoad={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                />
                <div className="home-product-badge home-new-badge">New</div>
              </div>
              <div className="home-product-info">
                <h3>{product.name}</h3>
                <div className="home-product-category">{product.category}</div>
                <div className="home-product-rating">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  <span className="home-rating-text">({product.rating || 4.0})</span>
                </div>
                <div className="home-product-price">
                  <span className="home-current-price">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <button className="cta-button" onClick={() => navigate('/products')}>
            Browse All Products
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;