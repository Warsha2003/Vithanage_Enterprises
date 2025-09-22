import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart, faStar, faCheck, faSliders, faTag, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './Products.css';
import './FilterStyles.css';
import '../Cart/CartIconStyles.css';
import { useCart } from '../Cart/CartContext';

const Products = () => {
  // States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [currentPriceRange, setCurrentPriceRange] = useState({ min: 0, max: 2000 });
  const [userName, setUserName] = useState('Guest');
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { openCart, addItem } = useCart();
  const navigate = useNavigate();

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
    
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        console.log('Fetching products from backend database...');
        const response = await fetch('http://localhost:5000/api/products');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully loaded', data.length, 'products from database');
          setProducts(data);
          setFilteredProducts(data);
          
          // Extract categories from products
          const allCategories = ['All', ...new Set(data.map(product => product.category))];
          setCategories(allCategories);
          
          // Extract brands from products
          const allBrands = [...new Set(data.map(product => product.brand))].sort();
          setBrands(allBrands);
          
          // Find min and max prices from products
          const prices = data.map(product => product.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          setCurrentPriceRange({ min: minPrice, max: maxPrice });
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
  
  // Apply filters when any filter changes
  useEffect(() => {
    let result = products;
    
    // Filter by category
    if (selectedCategory !== 'All') {
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
  }, [products, selectedCategory, selectedBrands, currentPriceRange]);

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
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrands([]);
    setCurrentPriceRange(priceRange);
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
    <div className="products-container">
      {/* Left Side - User greeting and Categories (1/4 width) */}
      <div className="sidebar">
        <div className="user-greeting">
          <FontAwesomeIcon icon={faUser} className="user-icon" />
          <div className="greeting-text">
            <h3>Hi, {userName}</h3>
            <p>Welcome to Vithanage Enterprises</p>
          </div>
        </div>
        
        <div className="categories-section">
          <h3>Categories</h3>
          <ul className="categories-list">
            {categories.map((category, index) => (
              <li 
                key={index} 
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                <div className="category-checkbox">
                  {selectedCategory === category && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                </div>
                <span className="category-name">{category}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Price Filter */}
        <div className="filter-section">
          <h3><FontAwesomeIcon icon={faSliders} /> Price Range</h3>
          <div className="price-filter">
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Min ($)</label>
                <input 
                  type="number" 
                  value={currentPriceRange.min} 
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  min={priceRange.min}
                  max={currentPriceRange.max}
                />
              </div>
              <div className="price-input-group">
                <label>Max ($)</label>
                <input 
                  type="number" 
                  value={currentPriceRange.max} 
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  min={currentPriceRange.min}
                  max={priceRange.max}
                />
              </div>
            </div>
            <div className="price-range">
              <span>${priceRange.min}</span>
              <input 
                type="range" 
                min={priceRange.min} 
                max={priceRange.max} 
                value={currentPriceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="range-slider"
              />
              <span>${priceRange.max}</span>
            </div>
          </div>
        </div>
        
        {/* Brand Filter */}
        <div className="filter-section">
          <h3><FontAwesomeIcon icon={faTag} /> Brands</h3>
          <ul className="brand-list">
            {brands.map(brand => (
              <li key={brand}>
                <label className="brand-checkbox" onClick={() => toggleBrand(brand)}>
                  <div className="checkbox">
                    {selectedBrands.includes(brand) && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                  </div>
                  <span>
                    {brand}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Reset Filters */}
        <button 
          className="reset-filters-btn" 
          onClick={resetFilters}
        >
          Reset All Filters
        </button>
      </div>
      
      {/* Right Side - Products Display (3/4 width) */}
      <div className="products-display">
        <div className="products-header">
          <h2>{selectedCategory} Products</h2>
          <div className="cart-container products-display">
            <div className="cart-icon-wrapper" onClick={handleCartClick} style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              const wrapper = e.currentTarget;
              wrapper.style.transform = 'scale(1.1) translateY(-2px)';
              wrapper.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              const wrapper = e.currentTarget;
              wrapper.style.transform = 'scale(1) translateY(0)';
              wrapper.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
            }}>
              <FontAwesomeIcon icon={faShoppingCart} style={{
                fontSize: '20px',
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
              {cartCount > 0 && (
                <span className="cart-count" style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'linear-gradient(135deg, #ff9900 0%, #ff6b35 100%)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  minWidth: '22px',
                  height: '22px',
                  borderRadius: '11px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0 6px',
                  boxShadow: '0 4px 12px rgba(255, 153, 0, 0.4)',
                  border: '2px solid white',
                  animation: 'pulse 2s infinite'
                }}>
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div 
                  className="product-image"
                  onClick={() => navigate(`/products/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={product.imageUrl || 'https://via.placeholder.com/150?text=Product'} alt={product.name} />
                </div>
                <div className="product-info">
                  <h4 
                    onClick={() => navigate(`/products/${product._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {product.name}
                  </h4>
                  <div className="product-rating">
                    {renderStars(product.averageRating || product.rating || 0)}
                    <span className="rating-number">
                      ({(product.averageRating || product.rating || 0).toFixed(1)}) 
                      {product.totalReviews > 0 && ` • ${product.totalReviews} reviews`}
                    </span>
                  </div>
                  <div className="product-price">${product.price}</div>
                  <div className="product-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      View Details
                    </button>
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={loading}
                    >
                      {loading ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">No products found in this category.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
