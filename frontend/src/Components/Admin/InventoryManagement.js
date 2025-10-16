import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxOpen, faPlus, faMinus, faEdit, faEye, faExclamationTriangle,
  faSearch, faFilter, faDownload, faWarehouse, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './InventoryManagement.css';

const InventoryManagement = () => {
  const { settings, formatCurrency } = useSettings();
  const { formatPrice } = useCurrency();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState('add'); // 'add', 'remove', 'adjust'
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalStockValue: 0
  });

  const [stockForm, setStockForm] = useState({
    quantity: '',
    newQuantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });

      const response = await fetch(`http://localhost:5000/api/admin/inventory?${queryParams}`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/inventory/stats', {
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
      console.error('Error fetching inventory stats:', error);
    }
  };

  const handleStockAction = async (action, product) => {
    setStockAction(action);
    setSelectedProduct(product);
    setStockForm({
      quantity: '',
      newQuantity: action === 'adjust' ? product.currentStock.toString() : '',
      reason: '',
      reference: '',
      notes: ''
    });
    setShowStockModal(true);
  };

  // Toggle New Arrival status
  const toggleNewArrival = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }

      const endpoint = currentStatus ? 'remove-new-arrival' : 'mark-new-arrival';
      const response = await fetch(`http://localhost:5000/api/products/${productId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update new arrival status');
      }

      // Refresh inventory list to show updated status
      fetchInventory();
      
      const action = currentStatus ? 'removed from' : 'marked as';
      alert(`Product ${action} new arrivals successfully!`);
      
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const submitStockAction = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      let endpoint = '';
      let payload = {};

      // Get the actual product ID from the inventory object
      const productId = selectedProduct.productInfo?._id || selectedProduct.product?._id || selectedProduct.productId;
      
      console.log('Stock Action Debug:');
      console.log('Selected Product:', selectedProduct);
      console.log('Product ID:', productId);
      console.log('Stock Action:', stockAction);
      
      if (!productId) {
        alert('Error: Could not find product ID');
        return;
      }
      
      switch (stockAction) {
        case 'add':
          endpoint = `http://localhost:5000/api/admin/inventory/product/${productId}/add-stock`;
          payload = {
            quantity: parseInt(stockForm.quantity),
            reason: stockForm.reason,
            reference: stockForm.reference,
            notes: stockForm.notes
          };
          break;
        case 'remove':
          endpoint = `http://localhost:5000/api/admin/inventory/product/${productId}/remove-stock`;
          payload = {
            quantity: parseInt(stockForm.quantity),
            reason: stockForm.reason,
            reference: stockForm.reference,
            notes: stockForm.notes
          };
          break;
        case 'adjust':
          endpoint = `http://localhost:5000/api/admin/inventory/product/${productId}/adjust-stock`;
          payload = {
            newQuantity: parseInt(stockForm.newQuantity),
            reason: stockForm.reason,
            notes: stockForm.notes
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Stock ${stockAction}ed successfully!`);
        setShowStockModal(false);
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || `Failed to ${stockAction} stock`);
      }
    } catch (error) {
      console.error(`Error ${stockAction}ing stock:`, error);
      alert(`Error ${stockAction}ing stock`);
    }
  };

  const initializeInventory = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/inventory/initialize', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchInventory();
        fetchStats();
      } else {
        alert(data.message || 'Failed to initialize inventory');
      }
    } catch (error) {
      console.error('Error initializing inventory:', error);
      alert('Error initializing inventory');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return '#28a745';
      case 'low_stock': return '#ffc107';
      case 'out_of_stock': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'low_stock': return faExclamationTriangle;
      case 'out_of_stock': return faExclamationTriangle;
      default: return faBoxOpen;
    }
  };

  return (
    <div className="inventory-management">
      <div className="inventory-header">
        <h2>
          <FontAwesomeIcon icon={faWarehouse} /> Inventory Management
        </h2>
        
        {/* Stats Cards */}
        <div className="inventory-stats">
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p>{stats.totalProducts}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#28a745'}}>
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
            <div className="stat-info">
              <h3>In Stock</h3>
              <p>{stats.inStock}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#ffc107'}}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="stat-info">
              <h3>Low Stock</h3>
              <p>{stats.lowStock}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#dc3545'}}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="stat-info">
              <h3>Out of Stock</h3>
              <p>{stats.outOfStock}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faChartLine} /></div>
            <div className="stat-info">
              <h3>Total Stock Value</h3>
              <p>{formatPrice(stats.totalStockValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="inventory-controls">
        <div className="search-filters">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        
        <button className="primary-btn" onClick={initializeInventory}>
          Initialize Inventory
        </button>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min/Max Levels</th>
                <th>Reorder Point</th>
                <th>Status</th>
                <th>New Arrival</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="product-info">
                      <strong>{item.productInfo.name}</strong>
                      <br />
                      <small>ID: {item.productInfo._id}</small>
                    </div>
                  </td>
                  <td>{item.productInfo.category}</td>
                  <td>
                    <span className="stock-quantity">{item.currentStock}</span>
                  </td>
                  <td>
                    <span className="stock-levels">
                      Min: {item.minStockLevel}<br/>
                      Max: {item.maxStockLevel}
                    </span>
                  </td>
                  <td>{item.reorderPoint}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(item.status), color: 'white' }}
                    >
                      <FontAwesomeIcon icon={getStatusIcon(item.status)} />
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleNewArrival(item.productInfo._id, item.productInfo.isNewArrival)}
                      className={`new-arrival-btn ${item.productInfo.isNewArrival ? 'active' : ''}`}
                      title={item.productInfo.isNewArrival ? 'Remove from New Arrivals' : 'Mark as New Arrival'}
                    >
                      {item.productInfo.isNewArrival ? '✓ New' : '+ New'}
                    </button>
                  </td>
                  <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button 
                      className="action-btn add-btn"
                      onClick={() => handleStockAction('add', item)}
                      title="Add Stock"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <button 
                      className="action-btn remove-btn"
                      onClick={() => handleStockAction('remove', item)}
                      title="Remove Stock"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <button 
                      className="action-btn adjust-btn"
                      onClick={() => handleStockAction('adjust', item)}
                      title="Adjust Stock"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Stock Action Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {stockAction === 'add' && 'Add Stock'}
                {stockAction === 'remove' && 'Remove Stock'}
                {stockAction === 'adjust' && 'Adjust Stock'}
              </h3>
              <button onClick={() => setShowStockModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="product-info">
                <h4>{selectedProduct?.productInfo?.name}</h4>
                <p>Current Stock: {selectedProduct?.currentStock}</p>
              </div>
              
              <div className="stock-form">
                {stockAction !== 'adjust' && (
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                      min="1"
                      required
                    />
                  </div>
                )}
                
                {stockAction === 'adjust' && (
                  <div className="form-group">
                    <label>New Quantity</label>
                    <input
                      type="number"
                      value={stockForm.newQuantity}
                      onChange={(e) => setStockForm({...stockForm, newQuantity: e.target.value})}
                      min="0"
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    value={stockForm.reason}
                    onChange={(e) => setStockForm({...stockForm, reason: e.target.value})}
                    required
                  >
                    <option value="">Select reason</option>
                    {stockAction === 'add' && (
                      <>
                        <option value="Purchase">Purchase</option>
                        <option value="Return">Return</option>
                        <option value="Restocking">Restocking</option>
                      </>
                    )}
                    {stockAction === 'remove' && (
                      <>
                        <option value="Sale">Sale</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Expired">Expired</option>
                        <option value="Lost">Lost</option>
                      </>
                    )}
                    {stockAction === 'adjust' && (
                      <>
                        <option value="Stock Count">Stock Count</option>
                        <option value="Correction">Correction</option>
                        <option value="System Sync">System Sync</option>
                      </>
                    )}
                  </select>
                </div>
                
                {stockAction !== 'adjust' && (
                  <div className="form-group">
                    <label>Reference</label>
                    <input
                      type="text"
                      value={stockForm.reference}
                      onChange={(e) => setStockForm({...stockForm, reference: e.target.value})}
                      placeholder="Order ID, Invoice #, etc."
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={stockForm.notes}
                    onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setShowStockModal(false)}>Cancel</button>
              <button 
                onClick={submitStockAction}
                className="primary-btn"
                disabled={!stockForm.reason || (!stockForm.quantity && stockAction !== 'adjust') || (!stockForm.newQuantity && stockAction === 'adjust')}
              >
                {stockAction === 'add' && 'Add Stock'}
                {stockAction === 'remove' && 'Remove Stock'}
                {stockAction === 'adjust' && 'Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;