import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for adding/editing products
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    imageUrl: '',
    stock: ''
  });
  
  // Editing state
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  
  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission for adding a new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }
      
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `http://localhost:5000/api/products/${currentProductId}` 
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          brand: formData.brand,
          imageUrl: formData.imageUrl,
          stock: parseInt(formData.stock, 10)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      // Reset form and refresh product list
      resetForm();
      fetchProducts();
      
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Set up form for editing a product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      imageUrl: product.imageUrl,
      stock: product.stock.toString()
    });
    setEditMode(true);
    setCurrentProductId(product._id);
  };
  
  // Handle product deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to perform this action');
          return;
        }
        
        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete product');
        }
        
        // Refresh product list
        fetchProducts();
        
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  // Reset form and exit edit mode
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      brand: '',
      imageUrl: '',
      stock: ''
    });
    setEditMode(false);
    setCurrentProductId(null);
  };
  
  // Handle creating sample products
  const handleCreateSamples = async () => {
    try {
      if (window.confirm('This will replace all existing products with sample data. Continue?')) {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/products/setup/create-samples');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create sample products');
        }
        
        alert('Sample products created successfully!');
        fetchProducts();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }
  
  return (
    <div className="product-management">
      <h2>Product Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-content">
        <div className="admin-form-container">
          <h3>{editMode ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editMode ? 'Update Product' : 'Add Product'}
              </button>
              {editMode && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="admin-data-container">
          <div className="admin-table-header">
            <h3>Product List</h3>
            <button 
              className="btn-secondary" 
              onClick={handleCreateSamples}
            >
              Create Sample Products
            </button>
          </div>
          
          {products.length === 0 ? (
            <p>No products found. Add some products or create samples.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.brand}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td className="action-buttons">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
