import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart, faStar, faCheck, faSliders, faTag, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './Products.css';
import './FilterStyles.css';
import '../Cart/CartIconStyles.css';
import { useCart } from '../Cart/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const Products = () => {
  // States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [currentPriceRange, setCurrentPriceRange] = useState({ min: 0, max: 2000 });
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('Guest');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [promotions, setPromotions] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const { openCart, addItem } = useCart();
  const { calculatePriceWithTax } = useSettings();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL parameters for filtering
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam && categories.length > 0 && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
      setSelectedCategory('All'); // Show all categories when searching
    }
  }, [location.search, categories]);

  useEffect(() => {
    // Fetch user data
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || 'Guest');
    }
    
    // Fetch cart count
    fetchCartCount();
    
    // Fetch active promotions
    fetchPromotions();
    
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        console.log('Fetching products from backend database...');
        const response = await fetch('http://localhost:5000/api/products');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully loaded', data.length, 'products from database');
          
          // Debug: Check price ranges to identify potential currency issues
          const validPrices = data.map(p => p.price).filter(p => p > 0);
          const minPrice = Math.min(...validPrices);
          const maxPrice = Math.max(...validPrices);
          console.log(`Price range: ${minPrice} - ${maxPrice} (should be LKR values)`);
          
          // Flag suspiciously low prices that might not be in LKR
          const suspiciousPrices = data.filter(p => p.price > 0 && p.price < 50);
          if (suspiciousPrices.length > 0) {
            console.warn('Products with suspiciously low prices (might not be LKR):', 
              suspiciousPrices.map(p => ({ name: p.name, price: p.price }))
            );
          }
          
          setProducts(data);
          setFilteredProducts(data);

          // Extract categories from products
          const allCategories = ['All', ...new Set(data.map(product => product.category))];
          setCategories(allCategories);
          
          // Extract brands from products
          const allBrands = [...new Set(data.map(product => product.brand))].sort();
          setBrands(allBrands);
          
          // Set price range for filters using the same price data
          const flooredMin = Math.floor(minPrice);
          const ceiledMax = Math.ceil(maxPrice);
          setPriceRange({ min: flooredMin, max: ceiledMax });
          setCurrentPriceRange({ min: flooredMin, max: ceiledMax });
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        
        // Use empty arrays if can't fetch from database
        setProducts([]);
        setFilteredProducts([]);
        
        // Default categories
        const defaultCategories = ['All'];
        setCategories(defaultCategories);
        
        // Default brands (empty)
        setBrands([]);
        
        // Default price range
        setPriceRange({ min: 0, max: 2000 });
        setCurrentPriceRange({ min: 0, max: 2000 });
      }
    };
    
    fetchProducts();
    
    // Listen for auth changes
    window.addEventListener('auth-change', handleAuthChange);
    
    // Listen for cart updates
    const handleCartUpdated = () => {
      fetchCartCount();
    };
    
    document.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('storage', handleCartUpdated);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      document.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, []);
  
  // Handle auth changes
  const handleAuthChange = () => {
    // Update user name
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || 'Guest');
    } else {
      setUserName('Guest');
    }
    
    // Update cart count
    fetchCartCount();
  };
  
  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      // If user is not logged in, set cart count to 0
      if (!token || !storedUser) {
        setCartCount(0);
        return;
      }
      
      // First try to get cart from localStorage for immediate display
      const savedCart = localStorage.getItem('userCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            const count = parsedCart.length;
            setCartCount(count);
          } else if (parsedCart.items && Array.isArray(parsedCart.items)) {
            const count = parsedCart.items.length;
            setCartCount(count);
          }
        } catch (err) {
          console.error("Error parsing cached cart:", err);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
      
      // If user is logged in, fetch from server for accurate count
      if (token && storedUser) {
        const response = await fetch('http://localhost:5000/api/cart', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const count = data.length;
          setCartCount(count);
          
          // Update localStorage with fresh cart data
          localStorage.setItem('userCart', JSON.stringify(data));
        } else {
          console.error('Failed to fetch cart count from server');
          // Keep using the count from localStorage
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      // Keep using the count from localStorage
    }
  };

  // Fetch active promotions
  const fetchPromotions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/promotions/active');
      if (response.ok) {
        const data = await response.json();
        const activePromotions = data.data || [];
        console.log('Fetched promotions:', activePromotions);
        setPromotions(activePromotions);
      } else {
        console.error('Failed to fetch promotions');
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    }
  };

  // Check if a product has an active promotion
  const getProductPromotion = (product) => {
    // Return null if no promotions exist
    if (!promotions || promotions.length === 0) {
      return null;
    }

    const matchedPromotion = promotions.find(promo => {
      // Skip inactive promotions
      if (!promo.isActive) {
        return false;
      }

      // Check if promotion has expired
      const now = new Date();
      const endDate = new Date(promo.endDate);
      if (endDate < now) {
        return false;
      }

      // If promotion applies to all products AND no specific products are selected
      if (promo.isApplicableToAll && (!promo.applicableProducts || promo.applicableProducts.length === 0)) {
        return true;
      }
      
      // If promotion has specific products selected, check if this product is included
      if (promo.applicableProducts && promo.applicableProducts.length > 0) {
        return promo.applicableProducts.some(p => p._id === product._id);
      }
      
      return false;
    });
  };

  // Calculate discounted price
  const getDiscountedPrice = (product) => {
    const promotion = getProductPromotion(product);
    if (!promotion) return product.price;

    if (promotion.type === 'percentage') {
      const discount = (product.price * promotion.discountValue) / 100;
      const maxDiscount = promotion.maxDiscountAmount;
      const finalDiscount = maxDiscount ? Math.min(discount, maxDiscount) : discount;
      return Math.max(0, product.price - finalDiscount);
    } else if (promotion.type === 'fixed_amount') {
      return Math.max(0, product.price - promotion.discountValue);
    }
    
    return product.price;
  };
  
  // Apply filters when any filter changes
  useEffect(() => {
    let result = products;
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by category (only if no search term)
    if (selectedCategory !== 'All' && !searchTerm) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by brands
    if (selectedBrands.length > 0) {
      result = result.filter(product => selectedBrands.includes(product.brand));
    }
    
    // Filter by price range
    result = result.filter(product => 
      product.price >= currentPriceRange.min && 
      product.price <= currentPriceRange.max
    );
    
    setFilteredProducts(result);
    // Reset pagination when filters change
    setCurrentPage(1);
  }, [products, selectedCategory, selectedBrands, currentPriceRange, searchTerm]);

  // Handle pagination - update displayed products when filtered products or page changes
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    setDisplayedProducts(productsToShow);
    setHasMore(endIndex < filteredProducts.length);
  }, [filteredProducts, currentPage, productsPerPage]);

  // Toggle brand selection
  const toggleBrand = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };
  
  // Update current price range
  const handlePriceChange = (type, value) => {
    const numValue = Number(value);
    if (type === 'min') {
      setCurrentPriceRange({
        ...currentPriceRange,
        min: numValue
      });
    } else {
      setCurrentPriceRange({
        ...currentPriceRange,
        max: numValue
      });
    }
  };

  // Apply price filter
  const applyPriceFilter = () => {
    // Already applied through useEffect
  };
  
  // Load more products
  const handleLoadMore = async () => {
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentPage(prevPage => prevPage + 1);
    setLoadingMore(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrands([]);
    setCurrentPriceRange(priceRange);
    setCurrentPage(1); // Reset pagination
  };
  
  // Handle cart icon click
  const handleCartClick = () => {
    try { openCart(); } catch (_) {}
  };

  // Add to cart handler
  const handleAddToCart = async (product) => {
    setLoading(true);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    try {
      if (token && storedUser) {
        const res = await addItem(product._id, 1);
        if (res?.ok) {
          const oldCount = cartCount;
          // recompute from local cache
          try {
            const saved = JSON.parse(localStorage.getItem('userCart') || '[]');
            const count = saved.reduce((t, it) => t + it.quantity, 0);
            setCartCount(count);
            if (count !== oldCount) animateCartCount();
          } catch (_) {}
          alert('Product added to cart!');
        } else {
          alert('Failed to add product to cart');
        }
      } else {
        // For non-logged in users, redirect to login
        alert('Please log in to add products to your cart');
        sessionStorage.setItem('loginRedirect', '/products');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Animate cart count when it changes
  const animateCartCount = () => {
    const cartCountElement = document.querySelector('.products-display .cart-count');
    if (cartCountElement) {
      // Remove the class if it exists
      cartCountElement.classList.remove('animate');
      
      // Force a reflow
      void cartCountElement.offsetWidth;
      
      // Add the class back to trigger the animation
      cartCountElement.classList.add('animate');
    }
  };

  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-filled" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-half" />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-empty" />);
      }
    }
    return stars;
  };

  return (
    <div className="ecommerce-products-page">
      {/* Top Filter Bar */}
      <div className="ecommerce-filters-top">
        <div className="ecommerce-filters-container">
          {/* User Greeting */}
          <div className="ecommerce-user-greeting">
            <FontAwesomeIcon icon={faUser} className="user-icon" />
            <span>Hi, {userName}!</span>
          </div>

          {/* Filter Controls */}
          <div className="ecommerce-filter-controls">
            {/* Categories */}
            <div className="ecommerce-filter-group">
              <label>Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ecommerce-filter-select"
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="ecommerce-filter-group">
              <label>Price:</label>
              <div className="ecommerce-price-inputs">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={currentPriceRange.min} 
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="ecommerce-price-input"
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={currentPriceRange.max} 
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="ecommerce-price-input"
                />
              </div>
            </div>

            {/* Brands */}
            <div className="ecommerce-filter-group">
              <label>Brands:</label>
              <div className="ecommerce-brand-chips">
                {brands.slice(0, 5).map(brand => (
                  <button 
                    key={brand}
                    className={`ecommerce-brand-chip ${selectedBrands.includes(brand) ? 'active' : ''}`}
                    onClick={() => toggleBrand(brand)}
                  >
                    {brand}
                  </button>
                ))}
                {brands.length > 5 && (
                  <span className="ecommerce-more-brands">+{brands.length - 5} more</span>
                )}
              </div>
            </div>

            {/* Reset & Cart */}
            <div className="ecommerce-filter-actions">
              <button className="ecommerce-reset-btn" onClick={resetFilters}>
                Reset
              </button>
              <div className="ecommerce-cart-wrapper" onClick={handleCartClick}>
                <FontAwesomeIcon icon={faShoppingCart} />
                {cartCount > 0 && (
                  <span className="ecommerce-cart-count">{cartCount}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="ecommerce-results-header">
        <div className="ecommerce-results-container">
          <div className="ecommerce-results-info">
            <h2>{selectedCategory} Products ({filteredProducts.length} items)</h2>
          </div>
          <div className="ecommerce-search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ecommerce-search-input"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="ecommerce-products-container">
        <div className="ecommerce-products-grid">
          {displayedProducts.length > 0 ? (
            displayedProducts.map(product => (
              <div key={product._id} className="ecommerce-product-card">
                {/* Product Image */}
                <div className="ecommerce-product-image-container">
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/200x200?text=Product'} 
                    alt={product.name}
                    className="ecommerce-product-image"
                    onClick={() => navigate(`/products/${product._id}`)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                      e.target.style.objectFit = 'contain';
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                  />
                  {(() => {
                    const promotion = getProductPromotion(product);
                    if (promotion && promotion.discountValue > 0) {
                      // Only show sale badge for meaningful discounts
                      let showBadge = false;
                      let discountText = '';
                      
                      if (promotion.type === 'percentage') {
                        // Only show for percentage discounts >= 5%
                        if (promotion.discountValue >= 5) {
                          showBadge = true;
                          discountText = `${promotion.discountValue}%`;
                        }
                      } else if (promotion.type === 'fixed_amount') {
                        // Only show for fixed discounts >= $5 or >= 10% of product price
                        const discountPercentage = (promotion.discountValue / product.price) * 100;
                        if (promotion.discountValue >= 5 || discountPercentage >= 10) {
                          showBadge = true;
                          discountText = `$${promotion.discountValue}`;
                        }
                      }
                      
                      if (showBadge) {
                        return (
                          <div className="ecommerce-sale-badge">
                            <FontAwesomeIcon icon={faTag} />
                            SALE -{discountText}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>

                {/* Product Info */}
                <div className="ecommerce-product-info">
                  <h3 
                    className="ecommerce-product-title"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    {product.name}
                  </h3>
                  
                  <div className="ecommerce-product-category">{product.category}</div>
                  
                  <div className="ecommerce-product-rating">
                    <div className="ecommerce-stars">
                      {renderStars(product.averageRating || product.rating || 0)}
                    </div>
                    <span className="ecommerce-rating-text">
                      ({(product.averageRating || product.rating || 0).toFixed(1)})
                    </span>
                  </div>

                  <div className="ecommerce-product-price">
                    {getProductPromotion(product) ? (
                      <div className="ecommerce-price-with-discount">
                        <span className="ecommerce-discounted-price">{formatPrice(getDiscountedPrice(product))}</span>
                        <span className="ecommerce-original-price">{formatPrice(product.price)}</span>
                      </div>
                    ) : (
                      <span className="ecommerce-current-price">{formatPrice(product.price)}</span>
                    )}
                  </div>

                  <div className="ecommerce-product-actions">
                    <button 
                      className="ecommerce-add-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={loading}
                    >
                      {loading ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faShoppingCart} />
                      )}
                    </button>
                    <button 
                      className="ecommerce-view-btn"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="ecommerce-no-products">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && displayedProducts.length > 0 && (
          <div className="ecommerce-load-more-container">
            <button 
              className="ecommerce-load-more-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Loading more products...
                </>
              ) : (
                <>
                  Load More Products ({filteredProducts.length - displayedProducts.length} remaining)
                </>
              )}
            </button>
          </div>
        )}

        {/* Show total when all loaded */}
        {!hasMore && displayedProducts.length > 0 && filteredProducts.length > productsPerPage && (
          <div className="ecommerce-all-loaded">
            <p>✅ All {filteredProducts.length} products loaded!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
