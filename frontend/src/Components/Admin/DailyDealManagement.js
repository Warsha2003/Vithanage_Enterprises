import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPercent, faPlus, faEdit, faTrash, faSearch, faSyncAlt,
  faEye, faToggleOn, faToggleOff, faBox, faCalendar,
  faDollarSign, faChevronLeft, faFilePdf, faClock
} from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './DailyDealManagement.css';

const DailyDealManagement = ({ onBack }) => {
  const { formatCurrency } = useSettings();
  const { formatPrice } = useCurrency();
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    upcomingDeals: 0,
    expiredDeals: 0,
    totalSavings: 0
  });

  const [formData, setFormData] = useState({
    productId: '',
    dealTitle: '',
    dealDescription: '',
    originalPrice: '',
    dealPrice: '',
    discountPercentage: '',
    dealQuantity: '',
    startDate: '',
    endDate: '',
    isActive: true,
    dealType: 'flash_sale',
    termsConditions: ''
  });

  const dealTypes = [
    { value: 'flash_sale', label: 'Flash Sale' },
    { value: 'weekend_deal', label: 'Weekend Deal' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'special_offer', label: 'Special Offer' }
  ];

  useEffect(() => {
    fetchDeals();
    fetchProducts();
    fetchStats();
  }, [statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Fetching deals with status:', statusFilter);
      console.log('Token available:', token ? 'Yes' : 'No');
      
      const response = await fetch(`http://localhost:5000/api/deals?status=${statusFilter}`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 500));
        setError('Server returned an invalid response. Please check if backend is running.');
        setDeals([]);
        return;
      }
      
      const data = await response.json();
      console.log('Deals response:', data);
      
      if (data.success) {
        setDeals(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || 'Failed to fetch deals');
        setDeals([]);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      setError(`Failed to fetch deals: ${error.message}`);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response from products API');
        setProducts([]);
        return;
      }
      
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/deals/stats', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'productId') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        setFormData({
          ...formData,
          productId: value,
          originalPrice: selectedProduct.price.toString()
        });
      }
    } else if (name === 'originalPrice' || name === 'dealPrice') {
      const original = name === 'originalPrice' ? parseFloat(value) || 0 : parseFloat(formData.originalPrice) || 0;
      const deal = name === 'dealPrice' ? parseFloat(value) || 0 : parseFloat(formData.dealPrice) || 0;
      
      const discount = original > 0 ? ((original - deal) / original * 100).toFixed(2) : 0;
      
      setFormData({
        ...formData,
        [name]: value,
        discountPercentage: discount
      });
    } else if (name === 'discountPercentage') {
      const original = parseFloat(formData.originalPrice) || 0;
      const discount = parseFloat(value) || 0;
      const dealPrice = (original * (1 - discount / 100)).toFixed(2);
      
      setFormData({
        ...formData,
        discountPercentage: value,
        dealPrice: dealPrice
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      dealTitle: '',
      dealDescription: '',
      originalPrice: '',
      dealPrice: '',
      discountPercentage: '',
      dealQuantity: '',
      startDate: '',
      endDate: '',
      isActive: true,
      dealType: 'flash_sale',
      termsConditions: ''
    });
    setSelectedDeal(null);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.productId || !formData.dealTitle || !formData.dealPrice || 
        !formData.dealQuantity || !formData.startDate || !formData.endDate) {
      setError('Please fill all required fields');
      return false;
    }

    if (parseFloat(formData.dealPrice) >= parseFloat(formData.originalPrice)) {
      setError('Deal price must be less than original price');
      return false;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }

    if (parseInt(formData.dealQuantity) <= 0) {
      setError('Deal quantity must be greater than 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = selectedDeal 
        ? `http://localhost:5000/api/deals/${selectedDeal._id}`
        : 'http://localhost:5000/api/deals';
      
      const method = selectedDeal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(selectedDeal ? 'Deal updated successfully!' : 'Deal created successfully!');
        setShowModal(false);
        resetForm();
        fetchDeals();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save deal');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      setError('Failed to save deal');
    }
  };

  const handleEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({
      productId: deal.productId?._id || '',
      dealTitle: deal.dealTitle || '',
      dealDescription: deal.dealDescription || '',
      originalPrice: deal.originalPrice?.toString() || '',
      dealPrice: deal.dealPrice?.toString() || '',
      discountPercentage: deal.discountPercentage?.toString() || '',
      dealQuantity: deal.dealQuantity?.toString() || '',
      startDate: deal.startDate ? new Date(deal.startDate).toISOString().split('T')[0] : '',
      endDate: deal.endDate ? new Date(deal.endDate).toISOString().split('T')[0] : '',
      isActive: deal.isActive ?? true,
      dealType: deal.dealType || 'flash_sale',
      termsConditions: deal.termsConditions || ''
    });
    setShowModal(true);
  };

  const handleView = (deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Deal deleted successfully!');
        fetchDeals();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete deal');
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      setError('Failed to delete deal');
    }
  };

  const toggleDealStatus = async (dealId, currentStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deals/${dealId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Deal ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        fetchDeals();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to toggle deal status');
      }
    } catch (error) {
      console.error('Error toggling deal status:', error);
      setError('Failed to toggle deal status');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Daily Deals Report', 14, 22);
    
    // Date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Stats
    doc.text(`Total Deals: ${stats.totalDeals}`, 14, 42);
    doc.text(`Active: ${stats.activeDeals} | Upcoming: ${stats.upcomingDeals} | Expired: ${stats.expiredDeals}`, 14, 48);
    
    // Table
    const tableData = filteredDeals.map((deal, index) => [
      index + 1,
      deal.dealTitle,
      deal.productId?.name || 'N/A',
      formatPrice(deal.originalPrice),
      formatPrice(deal.dealPrice),
      `${deal.discountPercentage}%`,
      deal.dealQuantity,
      new Date(deal.startDate).toLocaleDateString(),
      new Date(deal.endDate).toLocaleDateString(),
      deal.isActive ? 'Active' : 'Inactive'
    ]);

    doc.autoTable({
      head: [['#', 'Title', 'Product', 'Original', 'Deal Price', 'Discount', 'Qty', 'Start', 'End', 'Status']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save('daily-deals-report.pdf');
  };

  const getDealStatus = (deal) => {
    const now = new Date();
    const start = new Date(deal.startDate);
    const end = new Date(deal.endDate);

    if (!deal.isActive) return { text: 'Inactive', class: 'status-inactive' };
    if (now < start) return { text: 'Upcoming', class: 'status-upcoming' };
    if (now > end) return { text: 'Expired', class: 'status-expired' };
    return { text: 'Active', class: 'status-active' };
  };

  const filteredDeals = deals.filter(deal => {
    const searchMatch = !searchTerm || 
      deal.dealTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.dealType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  if (loading) {
    return <div className="loading">Loading daily deals...</div>;
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <FontAwesomeIcon icon={faChevronLeft} /> Back
          </button>
          <h2><FontAwesomeIcon icon={faPercent} /> Daily Deals Management</h2>
        </div>
      </div>

      {error && (
        <div className="dailydeal-error-alert">
          <div className="dailydeal-error-icon">⚠️</div>
          <div className="dailydeal-error-content">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      {success && (
        <div className="dailydeal-success-alert">
          <div className="dailydeal-success-icon">✓</div>
          <div className="dailydeal-success-content">
            <strong>Success:</strong> {success}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FontAwesomeIcon icon={faPercent} />
          </div>
          <div className="stat-details">
            <h3>{stats.totalDeals}</h3>
            <p>Total Deals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FontAwesomeIcon icon={faToggleOn} />
          </div>
          <div className="stat-details">
            <h3>{stats.activeDeals}</h3>
            <p>Active Deals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon upcoming">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-details">
            <h3>{stats.upcomingDeals}</h3>
            <p>Upcoming Deals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expired">
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <div className="stat-details">
            <h3>{stats.expiredDeals}</h3>
            <p>Expired Deals</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-left">
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FontAwesomeIcon icon={faPlus} /> Create Deal
          </button>
          <button className="btn-secondary" onClick={fetchDeals}>
            <FontAwesomeIcon icon={faSyncAlt} /> Refresh
          </button>
          <button className="btn-secondary" onClick={generatePDF}>
            <FontAwesomeIcon icon={faFilePdf} /> Export PDF
          </button>
        </div>
        <div className="action-right">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Deals</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Deal Title</th>
              <th>Product</th>
              <th>Type</th>
              <th>Original Price</th>
              <th>Deal Price</th>
              <th>Discount</th>
              <th>Quantity</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal, index) => {
                const status = getDealStatus(deal);
                return (
                  <tr key={deal._id}>
                    <td>{index + 1}</td>
                    <td className="deal-title">{deal.dealTitle}</td>
                    <td>{deal.productId?.name || 'N/A'}</td>
                    <td>
                      <span className="badge-type">
                        {dealTypes.find(t => t.value === deal.dealType)?.label || deal.dealType}
                      </span>
                    </td>
                    <td>{formatPrice(deal.originalPrice)}</td>
                    <td className="price-highlight">{formatPrice(deal.dealPrice)}</td>
                    <td className="discount-highlight">-{deal.discountPercentage}%</td>
                    <td>{deal.dealQuantity}</td>
                    <td>{new Date(deal.startDate).toLocaleDateString()}</td>
                    <td>{new Date(deal.endDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${status.class}`}>{status.text}</span>
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="btn-icon view" 
                        onClick={() => handleView(deal)}
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="btn-icon edit" 
                        onClick={() => handleEdit(deal)}
                        title="Edit Deal"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className={`btn-icon ${deal.isActive ? 'toggle-off' : 'toggle-on'}`}
                        onClick={() => toggleDealStatus(deal._id, deal.isActive)}
                        title={deal.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <FontAwesomeIcon icon={deal.isActive ? faToggleOff : faToggleOn} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleDelete(deal._id)}
                        title="Delete Deal"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="12" className="no-data">No deals found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FontAwesomeIcon icon={faPercent} />
                {selectedDeal ? ' Edit Deal' : ' Create New Deal'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faBox} /> Product *</label>
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - {formatPrice(product.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faPercent} /> Deal Title *</label>
                    <input
                      type="text"
                      name="dealTitle"
                      value={formData.dealTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., Flash Sale"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Deal Description</label>
                  <textarea
                    name="dealDescription"
                    value={formData.dealDescription}
                    onChange={handleInputChange}
                    placeholder="Enter deal description..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faDollarSign} /> Original Price *</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      readOnly={!!formData.productId}
                    />
                  </div>
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faDollarSign} /> Deal Price *</label>
                    <input
                      type="number"
                      name="dealPrice"
                      value={formData.dealPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faPercent} /> Discount %</label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Deal Quantity *</label>
                    <input
                      type="number"
                      name="dealQuantity"
                      value={formData.dealQuantity}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Deal Type</label>
                    <select
                      name="dealType"
                      value={formData.dealType}
                      onChange={handleInputChange}
                    >
                      {dealTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faCalendar} /> Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faCalendar} /> End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Terms & Conditions</label>
                  <textarea
                    name="termsConditions"
                    value={formData.termsConditions}
                    onChange={handleInputChange}
                    placeholder="Enter terms and conditions..."
                    rows="3"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Active Deal</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDeal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FontAwesomeIcon icon={faEye} /> Deal Details</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            <div className="modal-body view-modal">
              <div className="detail-row">
                <strong>Deal Title:</strong>
                <span>{selectedDeal.dealTitle}</span>
              </div>
              <div className="detail-row">
                <strong>Product:</strong>
                <span>{selectedDeal.productId?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <span>{selectedDeal.dealDescription || 'No description'}</span>
              </div>
              <div className="detail-row">
                <strong>Deal Type:</strong>
                <span>{dealTypes.find(t => t.value === selectedDeal.dealType)?.label || selectedDeal.dealType}</span>
              </div>
              <div className="detail-row">
                <strong>Original Price:</strong>
                <span>{formatPrice(selectedDeal.originalPrice)}</span>
              </div>
              <div className="detail-row">
                <strong>Deal Price:</strong>
                <span className="price-highlight">{formatPrice(selectedDeal.dealPrice)}</span>
              </div>
              <div className="detail-row">
                <strong>Discount:</strong>
                <span className="discount-highlight">{selectedDeal.discountPercentage}%</span>
              </div>
              <div className="detail-row">
                <strong>Savings:</strong>
                <span className="savings-highlight">{formatPrice(selectedDeal.originalPrice - selectedDeal.dealPrice)}</span>
              </div>
              <div className="detail-row">
                <strong>Quantity:</strong>
                <span>{selectedDeal.dealQuantity}</span>
              </div>
              <div className="detail-row">
                <strong>Start Date:</strong>
                <span>{new Date(selectedDeal.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>End Date:</strong>
                <span>{new Date(selectedDeal.endDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`badge ${getDealStatus(selectedDeal).class}`}>
                  {getDealStatus(selectedDeal).text}
                </span>
              </div>
              {selectedDeal.termsConditions && (
                <div className="detail-row">
                  <strong>Terms & Conditions:</strong>
                  <span>{selectedDeal.termsConditions}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Created:</strong>
                <span>{new Date(selectedDeal.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDealManagement;
