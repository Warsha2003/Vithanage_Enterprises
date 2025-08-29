import React from 'react';
import './Home.css';

function Home() {
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
    <div className="home">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Vithanage Enterprises</h1>
          <p>Your one-stop shop for premium electrical appliances</p>
          <button className="shop-now-btn">Shop Now</button>
        </div>
      </div>

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
                <button className="add-to-cart-btn">Add to Cart</button>
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
              <button className="view-offers-btn">View Offers</button>
            </div>
          </div>
          <div className="offer-card">
            <div className="offer-content">
              <h3>New Arrivals</h3>
              <p>Check out our latest products</p>
              <button className="view-offers-btn">View Products</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;