import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faSearch, faSyncAlt, 
  faBuilding, faUser, faEnvelope, faPhone, faBox, 
  faDollarSign, faCheck, faTimes, faChevronLeft,
  faShop, faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './SupplierManagement.css';

const SupplierManagement = ({ onBack }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalOrderValue: 0
  });

  const [formData, setFormData] = useState({
    supplierName: '',
    shopName: '',
    email: '',
    contactNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    status: 'Active',
    paymentTerms: 'Net 30',
    notes: '',
    products: []
  });

  const [productFormData, setProductFormData] = useState({
    product: '',
    quantity: '',
    unitPrice: ''
  });

  // State for adding products in the main form
  const [newProduct, setNewProduct] = useState({
    productId: '',
    quantity: '',
    unitPrice: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchStats();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(Array.isArray(data.data) ? data.data : []);
      } else {
        setError('Failed to fetch suppliers');
        setSuppliers([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to fetch suppliers');
      setSuppliers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Set empty array on error
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers/stats', {
        headers: getAuthHeaders()
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
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      shopName: '',
      email: '',
      contactNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      },
      status: 'Active',
      paymentTerms: 'Net 30',
      notes: '',
      products: []
    });
    setSelectedSupplier(null);
    setError('');
    setSuccess('');
    setNewProduct({
      productId: '',
      quantity: '',
      unitPrice: ''
    });
  };

  const resetProductForm = () => {
    setProductFormData({
      product: '',
      quantity: '',
      unitPrice: ''
    });
  };

  // Functions for managing products in the main form
  const addProductToForm = () => {
    const { productId, quantity, unitPrice } = newProduct;
    
    if (!productId || !quantity || !unitPrice) {
      setError('Please fill all product fields');
      return;
    }

    const product = products.find(p => p._id === productId);
    if (!product) {
      setError('Selected product not found');
      return;
    }

    // Check if product already exists
    const existingProductIndex = formData.products.findIndex(p => p.product === productId);
    
    if (existingProductIndex >= 0) {
      // Update existing product
      const updatedProducts = [...formData.products];
      updatedProducts[existingProductIndex] = {
        product: productId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice)
      };
      setFormData(prev => ({ ...prev, products: updatedProducts }));
    } else {
      // Add new product
      const newProductEntry = {
        product: productId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice)
      };
      setFormData(prev => ({ 
        ...prev, 
        products: [...prev.products, newProductEntry] 
      }));
    }

    // Reset new product form
    setNewProduct({ productId: '', quantity: '', unitPrice: '' });
    setError('');
  };

  const removeProductFromForm = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.product !== productId)
    }));
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormData({
        supplierName: supplier.supplierName,
        shopName: supplier.shopName,
        email: supplier.email,
        contactNumber: supplier.contactNumber,
        address: supplier.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        status: supplier.status,
        paymentTerms: supplier.paymentTerms,
        notes: supplier.notes || '',
        products: (supplier.products || []).map(item => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
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

  const openProductModal = (supplier) => {
    setSelectedSupplier(supplier);
    resetProductForm();
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedSupplier(null);
    resetProductForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = selectedSupplier
        ? `http://localhost:5000/api/suppliers/${selectedSupplier._id}`
        : 'http://localhost:5000/api/suppliers';
      
      const method = selectedSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(selectedSupplier ? 'Supplier updated successfully' : 'Supplier created successfully');
        fetchSuppliers();
        fetchStats();
        closeModal();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting supplier:', error);
      setError('Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${selectedSupplier._id}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: productFormData.product,
          quantity: parseInt(productFormData.quantity),
          unitPrice: parseFloat(productFormData.unitPrice)
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Product added successfully');
        fetchSuppliers();
        fetchStats();
        closeProductModal();
      } else {
        setError(data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product');
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Supplier deleted successfully');
        fetchSuppliers();
        fetchStats();
      } else {
        setError(data.message || 'Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError('Failed to delete supplier');
    }
  };

  const handleRemoveProduct = async (supplierId, productId) => {
    if (!window.confirm('Are you sure you want to remove this product from the supplier?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Product removed successfully');
        fetchSuppliers();
        fetchStats();
      } else {
        setError(data.message || 'Failed to remove product');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      setError('Failed to remove product');
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchSuppliers();
    fetchProducts();
    fetchStats();
  };

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF();
      

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Vithanage Enterprises', 20, 25);
    
    doc.setFontSize(16);
    doc.text('Supplier Management Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 45);
    doc.text(`Total Suppliers: ${suppliers.length}`, 20, 52);
    
    // Add company info
    doc.setFontSize(8);
    doc.text('Contact: info@vithanage.com | Phone: +94 77 123 4567', pageWidth - 120, 15);
    doc.text('Address: 123 Main St, Colombo, Sri Lanka', pageWidth - 120, 22);
    
    // Statistics Summary
    let yPosition = 65;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary Statistics', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    
    const statsData = [
      ['Total Suppliers', stats.totalSuppliers.toString()],
      ['Active Suppliers', stats.activeSuppliers.toString()],
      ['Inactive Suppliers', stats.inactiveSuppliers.toString()],
      ['Total Order Value', `$${stats.totalOrderValue?.toFixed(2) || '0.00'}`],
      ['Average Order Value', `$${stats.totalSuppliers > 0 ? (stats.totalOrderValue / stats.totalSuppliers).toFixed(2) : '0.00'}`]
    ];
    
    // Display statistics as simple text for now
    statsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Suppliers Table
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Supplier Details', 20, yPosition);
    
    yPosition += 10;
    
    const supplierTableData = filteredSuppliers.map((supplier, index) => {
      const products = supplier.products || [];
      const productList = products.length > 0 
        ? products.map(item => `${item.product?.name || 'Unknown'} (${item.quantity})`).join(', ')
        : 'No products';
      
      return [
        (index + 1).toString(),
        supplier.supplierName || 'N/A',
        supplier.shopName || 'N/A',
        supplier.email || 'N/A',
        supplier.contactNumber || 'N/A',
        products.length.toString(),
        `$${supplier.totalOrderValue?.toFixed(2) || '0.00'}`,
        supplier.status || 'N/A'
      ];
    });
    
    // Display supplier data as simple text
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    
    // Table header
    doc.text('# | Supplier Name | Shop Name | Email | Contact | Products | Total Value | Status', 20, yPosition);
    yPosition += 5;
    
    // Draw a line under header
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    // Display each supplier
    supplierTableData.forEach((row, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;
      }
      
      const displayText = `${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} products | ${row[6]} | ${row[7]}`;
      doc.text(displayText, 20, yPosition);
      yPosition += 6;
    });
    
    // Add detailed products section if there's space or on new page
    let currentY = yPosition + 20;
    
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // Products Details Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Product Details by Supplier', 20, currentY);
    
    currentY += 10;
    
    const productTableData = [];
    filteredSuppliers.forEach((supplier) => {
      if (supplier.products && supplier.products.length > 0) {
        supplier.products.forEach((item, index) => {
          productTableData.push([
            supplier.supplierName || 'N/A',
            item.product?.name || 'Unknown Product',
            item.product?.category || 'N/A',
            item.quantity?.toString() || '0',
            `$${item.unitPrice?.toFixed(2) || '0.00'}`,
            `$${(item.quantity * item.unitPrice)?.toFixed(2) || '0.00'}`
          ]);
        });
      }
    });
    
    if (productTableData.length > 0) {
      // Add page break if needed
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 30;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Product Details Breakdown', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(8);
      doc.text('Supplier | Product Name | Category | Quantity | Unit Price | Total Price', 20, currentY);
      currentY += 5;
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 8;
      
      // Display each product
      productTableData.forEach((row, index) => {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 30;
        }
        
        const displayText = `${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]}`;
        doc.text(displayText, 20, currentY);
        currentY += 6;
      });
    }
    
    // Add footer with generation info
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('This report is confidential and proprietary to Vithanage Enterprises', 20, pageHeight - 10);
    }
    
    // Save the PDF
    const fileName = `Supplier_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    setSuccess(`PDF report "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please check if all required libraries are loaded.');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!supplier) return false;
    
    const matchesSearch = (supplier.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.contactNumber || '').includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && suppliers.length === 0) {
    return (
      <div className="supplier-management">
        <div className="loading-spinner">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="supplier-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to Financial Management
          </button>
          <h2>Supplier Management</h2>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={refreshData}>
            <FontAwesomeIcon icon={faSyncAlt} />
            Refresh
          </button>
          <button className="btn-download" onClick={generatePDFReport}>
            <FontAwesomeIcon icon={faFilePdf} />
            Download Report
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <FontAwesomeIcon icon={faPlus} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSuppliers}</div>
            <div className="stat-label">Total Suppliers</div>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeSuppliers}</div>
            <div className="stat-label">Active Suppliers</div>
          </div>
        </div>
        
        <div className="stat-card inactive">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactiveSuppliers}</div>
            <div className="stat-label">Inactive Suppliers</div>
          </div>
        </div>
        
        <div className="stat-card value">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.totalOrderValue?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Total Order Value</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="quick-actions-card">
          <h3>Report Generation</h3>
          <p>Generate comprehensive supplier reports with all details, statistics, and product information.</p>
          <div className="quick-action-buttons">
            <button className="btn-download-large" onClick={generatePDFReport}>
              <FontAwesomeIcon icon={faFilePdf} />
              <span>
                <strong>Download Full Report</strong>
                <small>All suppliers, products & statistics</small>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
        
        <div className="filter-container">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="suppliers-section">
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBuilding} />
            <p>No suppliers found</p>
            <button className="btn-primary" onClick={() => openModal()}>
              Add Your First Supplier
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Supplier Info</th>
                  <th>Contact</th>
                  <th>Products</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>
                      <div className="supplier-info">
                        <div className="supplier-name">
                          <FontAwesomeIcon icon={faUser} className="icon" />
                          {supplier.supplierName}
                        </div>
                        <div className="shop-name">
                          <FontAwesomeIcon icon={faShop} className="icon" />
                          {supplier.shopName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="email">
                          <FontAwesomeIcon icon={faEnvelope} className="icon" />
                          {supplier.email}
                        </div>
                        <div className="phone">
                          <FontAwesomeIcon icon={faPhone} className="icon" />
                          {supplier.contactNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="products-info">
                        <div className="products-count">
                          <FontAwesomeIcon icon={faBox} className="icon" />
                          {supplier.products?.length || 0} Products
                        </div>
                        <div className="products-list">
                          {supplier.products && supplier.products.slice(0, 2).map((item, index) => (
                            <div key={index} className="product-item">
                              {item.product?.name || 'Unknown Product'} (Qty: {item.quantity || 0})
                            </div>
                          ))}
                          {supplier.products && supplier.products.length > 2 && (
                            <div className="more-products">
                              +{supplier.products.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="total-value">
                        <FontAwesomeIcon icon={faDollarSign} className="icon" />
                        ${supplier.totalOrderValue?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${supplier.status.toLowerCase()}`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-add"
                          onClick={() => openProductModal(supplier)}
                          title="Add Product"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openModal(supplier)}
                          title="Edit Supplier"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(supplier._id)}
                          title="Delete Supplier"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="close-button" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="form-group">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </div>

                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="Enter state/province"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="Enter country"
                  />
                </div>

                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    placeholder="Enter postal code"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Products Section */}
              <div className="products-section">
                <h4>Products</h4>
                
                {/* Add New Product */}
                <div className="add-product-section">
                  <div className="product-form-grid">
                    <div className="form-group">
                      <label>Select Product</label>
                      <select
                        value={newProduct.productId}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, productId: e.target.value }))}
                      >
                        <option value="">Choose a product...</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} - ${product.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Enter quantity"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Unit Price ($)</label>
                      <input
                        type="number"
                        value={newProduct.unitPrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: e.target.value }))}
                        placeholder="Enter unit price"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <button 
                        type="button" 
                        className="btn-add-product"
                        onClick={addProductToForm}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Add Product
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product List */}
                {formData.products.length > 0 && (
                  <div className="selected-products">
                    <h5>Selected Products ({formData.products.length})</h5>
                    <div className="products-list">
                      {formData.products.map((item, index) => {
                        const product = products.find(p => p._id === item.product);
                        return (
                          <div key={index} className="product-item-form">
                            <div className="product-info">
                              <strong>{product?.name || 'Unknown Product'}</strong>
                              <span>Qty: {item.quantity} × ${item.unitPrice} = ${(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                            <button
                              type="button"
                              className="btn-remove-product"
                              onClick={() => removeProductFromForm(item.product)}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="products-total">
                      Total Value: ${formData.products.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (selectedSupplier ? 'Update Supplier' : 'Create Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Product to {selectedSupplier?.supplierName}</h3>
              <button className="close-button" onClick={closeProductModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    name="product"
                    value={productFormData.product}
                    onChange={handleProductInputChange}
                    required
                  >
                    <option value="">Select a product</option>
                    {products && products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name || 'Unknown Product'} - ${product.price || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={productFormData.quantity}
                    onChange={handleProductInputChange}
                    required
                    min="1"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
                  <label>Unit Price ($) *</label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={productFormData.unitPrice}
                    onChange={handleProductInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeProductModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;