import React, { useState, useEffect } from 'react';
import './FinancialManagement.css';

const FinancialManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('promotions');
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    discountValue: '',
    maxDiscountAmount: '',
    minimumOrderValue: '0',
    maxUsageCount: '',
    maxUsagePerUser: '1',
    startDate: '',
    endDate: '',
    applicableProducts: [],
    applicableCategories: [],
    isApplicableToAll: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual products loading for debugging
  const loadProductsManually = async () => {
    console.log('Manual product loading started...');
    setProductsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Manual fetch response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Manual fetch data:', data);
        setProducts(Array.isArray(data) ? data : []);
        setSuccess(`Loaded ${data.length} products manually`);
      } else {
        console.error('Manual fetch failed:', response.status);
        setError(`Failed to load products: ${response.status}`);
      }
    } catch (error) {
      console.error('Manual fetch error:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/promotions', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setPromotions(data.data);
      } else {
        setError('Failed to fetch promotions');
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setError('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    console.log('Starting to fetch products...');
    
    try {
      // Use the standard products endpoint that we know works
      console.log('Fetching from standard products endpoint...');
      const response = await fetch('http://localhost:5000/api/products');
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const products = await response.json();
        console.log('Raw response:', products);
        
        // Handle different response formats
        if (Array.isArray(products)) {
          setProducts(products);
          console.log('Successfully loaded products (array format):', products.length);
        } else if (products.data && Array.isArray(products.data)) {
          setProducts(products.data);
          console.log('Successfully loaded products (object format):', products.data.length);
        } else if (products.success && Array.isArray(products.products)) {
          setProducts(products.products);
          console.log('Successfully loaded products (success format):', products.products.length);
        } else {
          console.error('Unexpected response format:', products);
          setProducts([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch products:', response.status, errorText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Network error fetching products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'isApplicableToAll') {
        setFormData({
          ...formData,
          [name]: checked,
          applicableProducts: checked ? [] : formData.applicableProducts
        });
      } else if (name === 'applicableProducts') {
        const productId = value;
        const updatedProducts = checked
          ? [...formData.applicableProducts, productId]
          : formData.applicableProducts.filter(id => id !== productId);
        
        setFormData({
          ...formData,
          applicableProducts: updatedProducts
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'percentage',
      discountValue: '',
      maxDiscountAmount: '',
      minimumOrderValue: '0',
      maxUsageCount: '',
      maxUsagePerUser: '1',
      startDate: '',
      endDate: '',
      applicableProducts: [],
      applicableCategories: [],
      isApplicableToAll: true
    });
    setSelectedPromotion(null);
    setError('');
    setSuccess('');
  };

  const openModal = (promotion = null) => {
    if (promotion) {
      setSelectedPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description,
        code: promotion.code,
        type: promotion.type,
        discountValue: promotion.discountValue.toString(),
        maxDiscountAmount: promotion.maxDiscountAmount?.toString() || '',
        minimumOrderValue: promotion.minimumOrderValue?.toString() || '0',
        maxUsageCount: promotion.maxUsageCount?.toString() || '',
        maxUsagePerUser: promotion.maxUsagePerUser?.toString() || '1',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        applicableProducts: promotion.applicableProducts?.map(p => p._id) || [],
        applicableCategories: promotion.applicableCategories || [],
        isApplicableToAll: promotion.isApplicableToAll
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = selectedPromotion
        ? `http://localhost:5000/api/promotions/${selectedPromotion._id}`
        : 'http://localhost:5000/api/promotions';
      
      const method = selectedPromotion ? 'PUT' : 'POST';
      
      const submissionData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        minimumOrderValue: parseFloat(formData.minimumOrderValue) || 0,
        maxUsageCount: formData.maxUsageCount ? parseInt(formData.maxUsageCount) : null,
        maxUsagePerUser: parseInt(formData.maxUsagePerUser) || 1
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(selectedPromotion ? 'Promotion updated successfully' : 'Promotion created successfully');
        fetchPromotions();
        closeModal();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting promotion:', error);
      setError('Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/promotions/${promotionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Promotion deleted successfully');
        fetchPromotions();
      } else {
        setError(data.message || 'Failed to delete promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      setError('Failed to delete promotion');
    }
  };

  const togglePromotionStatus = async (promotionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/promotions/${promotionId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchPromotions();
      } else {
        setError(data.message || 'Failed to update promotion status');
      }
    } catch (error) {
      console.error('Error toggling promotion status:', error);
      setError('Failed to update promotion status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDiscount = (promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.discountValue}%`;
    } else if (promotion.type === 'fixed_amount') {
      return `$${promotion.discountValue}`;
    } else if (promotion.type === 'free_shipping') {
      return 'Free Shipping';
    }
    return promotion.discountValue;
  };

  const getPromotionStatus = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return { text: 'Inactive', class: 'status-inactive' };
    } else if (now < startDate) {
      return { text: 'Scheduled', class: 'status-scheduled' };
    } else if (now > endDate) {
      return { text: 'Expired', class: 'status-expired' };
    } else if (promotion.maxUsageCount && promotion.usageCount >= promotion.maxUsageCount) {
      return { text: 'Usage Limit Reached', class: 'status-limit' };
    } else {
      return { text: 'Active', class: 'status-active' };
    }
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="financial-management">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="financial-management">
      <div className="page-header">
        <h2>Financial & Promotion Management</h2>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => openModal()}
          >
            Create New Promotion
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>&times;</button>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions ({promotions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'promotions' && (
        <div className="promotions-section">
          {promotions.length === 0 ? (
            <div className="empty-state">
              <p>No promotions created yet</p>
              <button className="btn-primary" onClick={() => openModal()}>
                Create Your First Promotion
              </button>
            </div>
          ) : (
            <div className="promotions-grid">
              {promotions.map((promotion) => {
                const status = getPromotionStatus(promotion);
                return (
                  <div key={promotion._id} className="promotion-card">
                    <div className="promotion-header">
                      <h3>{promotion.name}</h3>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="promotion-details">
                      <div className="detail-row">
                        <span className="label">Code:</span>
                        <span className="code">{promotion.code}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="label">Discount:</span>
                        <span className="value">{formatDiscount(promotion)}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="label">Usage:</span>
                        <span className="value">
                          {promotion.usageCount}
                          {promotion.maxUsageCount && ` / ${promotion.maxUsageCount}`}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="label">Valid:</span>
                        <span className="value">
                          {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                        </span>
                      </div>
                      
                      {promotion.minimumOrderValue > 0 && (
                        <div className="detail-row">
                          <span className="label">Min Order:</span>
                          <span className="value">${promotion.minimumOrderValue}</span>
                        </div>
                      )}
                    </div>

                    <div className="promotion-description">
                      <p>{promotion.description}</p>
                    </div>

                    <div className="promotion-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => openModal(promotion)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn-toggle ${promotion.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => togglePromotionStatus(promotion._id)}
                      >
                        {promotion.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(promotion._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="stat-card">
              <h3>Total Promotions</h3>
              <div className="stat-value">{promotions.length}</div>
            </div>
            <div className="stat-card">
              <h3>Active Promotions</h3>
              <div className="stat-value">
                {promotions.filter(p => {
                  const status = getPromotionStatus(p);
                  return status.text === 'Active';
                }).length}
              </div>
            </div>
            <div className="stat-card">
              <h3>Total Usage</h3>
              <div className="stat-value">
                {promotions.reduce((total, p) => total + p.usageCount, 0)}
              </div>
            </div>
            <div className="stat-card">
              <h3>Avg Discount</h3>
              <div className="stat-value">
                {promotions.length > 0
                  ? (promotions.reduce((total, p) => 
                      total + (p.type === 'percentage' ? p.discountValue : 0), 0
                    ) / promotions.filter(p => p.type === 'percentage').length || 0).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedPromotion ? 'Edit Promotion' : 'Create New Promotion'}</h3>
              <button className="close-button" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Promotion Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Summer Sale"
                  />
                </div>

                <div className="form-group">
                  <label>Promotion Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., SUMMER20"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Describe your promotion..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Discount Value *
                    {formData.type === 'percentage' && ' (%)'}
                    {formData.type === 'fixed_amount' && ' ($)'}
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div className="form-group">
                    <label>Max Discount Amount ($)</label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Optional cap"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Minimum Order Value ($)</label>
                  <input
                    type="number"
                    name="minimumOrderValue"
                    value={formData.minimumOrderValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Total Usage</label>
                  <input
                    type="number"
                    name="maxUsageCount"
                    value={formData.maxUsageCount}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="form-group">
                  <label>Max Usage Per User</label>
                  <input
                    type="number"
                    name="maxUsagePerUser"
                    value={formData.maxUsagePerUser}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="promotion-scope-label">Promotion Scope</label>
                  <div className="scope-options">
                    <label className="scope-option">
                      <input
                        type="radio"
                        name="promotionScope"
                        checked={formData.isApplicableToAll}
                        onChange={() => setFormData({...formData, isApplicableToAll: true, applicableProducts: []})}
                      />
                      <span>Apply to ALL products</span>
                    </label>
                    <label className="scope-option">
                      <input
                        type="radio"
                        name="promotionScope"
                        checked={!formData.isApplicableToAll}
                        onChange={() => setFormData({...formData, isApplicableToAll: false})}
                      />
                      <span>Apply to specific products</span>
                    </label>
                  </div>
                </div>

                {!formData.isApplicableToAll && (
                  <div className="form-group full-width">
                    <label>Select Products for Promotion</label>
                    <div className="selected-count">
                      {formData.applicableProducts.length} of {products.length} products selected
                    </div>
                    
                    {productsLoading ? (
                      <div className="products-loading">
                        <div className="loading-spinner">Loading products...</div>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="no-products">
                        <p>No products loaded. Check browser console (F12) for details.</p>
                        <div className="debug-buttons">
                          <button type="button" onClick={fetchProducts} className="retry-btn">
                            Retry Loading Products
                          </button>
                          <button type="button" onClick={loadProductsManually} className="test-btn">
                            Load Products Manually
                          </button>
                          <button type="button" onClick={() => {
                            fetch('http://localhost:5000/api/products')
                              .then(res => res.json())
                              .then(data => {
                                console.log('Direct API test:', data);
                                alert(`Found ${data.length} products! Check console for details.`);
                              })
                              .catch(err => {
                                console.error('Direct API test failed:', err);
                                alert(`API Error: ${err.message}`);
                              });
                          }} className="test-btn">
                            Test API
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="product-selection">
                        {products.map((product) => (
                          <label key={product._id} className="product-option">
                            <input
                              type="checkbox"
                              name="applicableProducts"
                              value={product._id}
                              checked={formData.applicableProducts.includes(product._id)}
                              onChange={handleInputChange}
                            />
                            <div className="product-info">
                              <span className="product-name">{product.name}</span>
                              <span className="product-price">${product.price}</span>
                              <span className="product-category">{product.category}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (selectedPromotion ? 'Update Promotion' : 'Create Promotion')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;