import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Only consider user as logged in if both user data and token exist
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      // Clear any incomplete auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }

    // Fetch active promotions for banner display
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/promotions/active');
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };
  
  const handleShopNowClick = () => {
    // Go directly to products page without checking login
    navigate('/products');
  };

  // Featured products data (in a real app, this would come from an API)
  const featuredProducts = [
    {
      id: 1,
      name: "Samsung 55\" 4K Smart TV",
      price: 699.99,
      image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "TV"
    },
    {
      id: 2,
      name: "LG French Door Refrigerator",
      price: 1299.99,
      image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Fridge"
    },
    {
      id: 3,
      name: "iPhone 14 Pro",
      price: 999.99,
      image: "https://images.unsplash.com/photo-1592286927505-1def25115df9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Phone"
    },
    {
      id: 4,
      name: "Samsung Front Load Washing Machine",
      price: 799.99,
      image: "https://images.unsplash.com/photo-1626806787461-102c1a7f1c62?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Washing Machine"
    },
    {
    id: 5,
      name: "Samsung top Load Washing Machine",
      price: 799.99,
      image: "https://images.unsplash.com/photo-1626806787461-102c1a7f1c62?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Washing Machine"
    }
  ];

  // Categories 
  const categories = [
    { id: 1, name: "TVs", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" },
    { id: 2, name: "Refrigerators", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" },
    { id: 3, name: "Phones", image: "https://images.unsplash.com/photo-1592286927505-1def25115df9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" },
    { id: 4, name: "Washing Machines", image: "https://images.unsplash.com/photo-1626806787461-102c1a7f1c62?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" }
  ];

  return (
    <div className="home" style={{ backgroundColor: '#f7f7f7', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Vithanage Enterprises</h1>
          <p>Your one-stop shop for premium electrical appliances</p>
          {!user && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '10px 15px', 
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              <strong>Please Note:</strong> You need to login or register to view and purchase products.
            </div>
          )}
          <button className="shop-now-btn" onClick={handleShopNowClick}>
            {user ? 'Shop Now' : 'Login to Shop'}
          </button>
        </div>
      </div>

      {/* Promotional Banner */}
      {promotions.length > 0 && (
        <section className="promotions-section">
          {promotions.slice(0, 2).map(promotion => (
            <div key={promotion._id} className="promotion-banner">
              <h3>🎉 {promotion.name}</h3>
              <p>{promotion.description}</p>
              <div className="promo-code">
                Use Code: <strong>{promotion.code}</strong> - Save {promotion.discountValue}
                {promotion.type === 'percentage' ? '%' : '$'}!
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Browse Categories</h2>
        <div className="categories-container">
          {categories.map(category => (
            <div className="category-card" key={category.id}>
              <img src={category.image} alt={category.name} />
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <h2>Featured Products</h2>
        <div className="products-container">
          {featuredProducts.map(product => (
            <div className="product-card" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <button 
                  className="add-to-cart-btn"
                  onClick={user ? () => alert('Added to cart!') : () => navigate('/login')}
                >
                  {user ? 'Add to Cart' : 'Login to Buy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="special-offers">
        <h2>Special Offers</h2>
        <div className="offers-container">
          <div className="offer-card">
            <div className="offer-content">
              <h3>Summer Sale</h3>
              <p>Get up to 30% off on selected items</p>
              <button className="view-offers-btn" onClick={user ? () => navigate('/products') : () => navigate('/login')}>
                {user ? 'View Offers' : 'Login to View'}
              </button>
            </div>
          </div>
          <div className="offer-card">
            <div className="offer-content">
              <h3>New Arrivals</h3>
              <p>Check out our latest products</p>
              <button className="view-offers-btn" onClick={user ? () => navigate('/products') : () => navigate('/login')}>
                {user ? 'View Products' : 'Login to View'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;