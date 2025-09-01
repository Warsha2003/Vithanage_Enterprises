import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart, faStar, faCheck, faSliders, faTag } from '@fortawesome/free-solid-svg-icons';
import './Products.css';
import './FilterStyles.css';

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

  useEffect(() => {
    // Fetch user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || 'Guest');
    }
    
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
  }, []);

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
          <div className="cart-icon">
            <FontAwesomeIcon icon={faShoppingCart} />
            <span className="cart-count">0</span>
          </div>
        </div>
        
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img src={product.imageUrl || 'https://via.placeholder.com/150?text=Product'} alt={product.name} />
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <div className="product-rating">
                    {renderStars(product.rating)}
                    <span className="rating-number">({product.rating})</span>
                  </div>
                  <div className="product-price">${product.price}</div>
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => {
                      const userData = localStorage.getItem('user');
                      const token = localStorage.getItem('token');
                      if (userData && token) {
                        alert('Added to cart!');
                      } else {
                        window.location.href = '/login';
                      }
                    }}
                  >
                    {localStorage.getItem('token') ? 'Add to Cart' : 'Login to Buy'}
                  </button>
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
