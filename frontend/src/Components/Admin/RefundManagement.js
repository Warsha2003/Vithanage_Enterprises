import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUndo, faClock, faCheckCircle, faTimesCircle, faChartLine,
  faSearch, faSyncAlt, faEye, faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import './RefundManagement.css';

const RefundManagement = () => {
    const { settings, formatCurrency } = useSettings();
    const [refunds, setRefunds] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [adminResponse, setAdminResponse] = useState('');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Processing', 'Completed'];

    useEffect(() => {
        fetchRefunds();
        fetchStats();
    }, [currentPage, statusFilter]);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/refunds?page=${currentPage}&limit=10`;
            if (statusFilter !== 'All') {
                url += `&status=${statusFilter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setRefunds(data.data.refunds);
                setTotalPages(data.data.pages);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching refunds:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/refunds/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
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

    const refreshData = () => {
        setLoading(true);
        fetchRefunds();
        fetchStats();
    };

    const filteredRefunds = refunds.filter(refund => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            refund.orderId?.orderNumber?.toLowerCase().includes(searchLower) ||
            refund.userId?.name?.toLowerCase().includes(searchLower) ||
            refund.userId?.email?.toLowerCase().includes(searchLower) ||
            refund.productId?.name?.toLowerCase().includes(searchLower) ||
            refund.reason?.toLowerCase().includes(searchLower)
        );
    });

    const handleAction = (refund, action) => {
        setSelectedRefund(refund);
        setActionType(action);
        setAdminResponse('');
        setShowModal(true);
    };

    const executeAction = async () => {
        if (!selectedRefund || !actionType) return;
        
        if (actionType === 'reject' && !adminResponse.trim()) {
            alert('Admin response is required when rejecting a refund');
            return;
        }

        setProcessing(true);

        try {
            const token = localStorage.getItem('token');
            const url = `http://localhost:5000/api/admin/refunds/${selectedRefund._id}/${actionType}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    adminResponse: adminResponse || undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Refund ${actionType}d successfully!`);
                fetchRefunds();
                fetchStats();
                setShowModal(false);
            } else {
                alert(data.message || `Failed to ${actionType} refund`);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing refund:`, error);
            alert(`Error ${actionType}ing refund. Please try again.`);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#ffc107';
            case 'Approved': return '#28a745';
            case 'Rejected': return '#dc3545';
            case 'Processing': return '#007bff';
            case 'Completed': return '#6f42c1';
            default: return '#6c757d';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionButtons = (refund) => {
        switch (refund.status) {
            case 'Pending':
                return (
                    <div className="action-buttons">
                        <button 
                            className="approve-btn"
                            onClick={() => handleAction(refund, 'approve')}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                            Approve
                        </button>
                        <button 
                            className="reject-btn"
                            onClick={() => handleAction(refund, 'reject')}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                            Reject
                        </button>
                    </div>
                );
            case 'Approved':
                return (
                    <div className="action-buttons">
                        <button 
                            className="process-btn"
                            onClick={() => handleAction(refund, 'processing')}
                        >
                            Mark Processing
                        </button>
                    </div>
                );
            case 'Processing':
                return (
                    <div className="action-buttons">
                        <button 
                            className="complete-btn"
                            onClick={() => handleAction(refund, 'complete')}
                        >
                            Mark Completed
                        </button>
                    </div>
                );
            default:
                return <span className="status-final">Final Status</span>;
        }
    };

    if (loading) {
        return (
            <div className="refund-management-loading">
                <div className="spinner"></div>
                <p>Loading refund management...</p>
            </div>
        );
    }

    return (
        <div className="refund-management">
            <div className="page-header">
                <h2>Refund Management</h2>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={refreshData}>
                        <FontAwesomeIcon icon={faSyncAlt} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faUndo} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.total || 0}</div>
                            <div className="stat-label">Total Refunds</div>
                        </div>
                    </div>
                    
                    <div className="stat-card pending">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.pending || 0}</div>
                            <div className="stat-label">Pending</div>
                        </div>
                    </div>
                    
                    <div className="stat-card approved">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.approved || 0}</div>
                            <div className="stat-label">Approved</div>
                        </div>
                    </div>
                    
                    <div className="stat-card rejected">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faTimesCircle} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.rejected || 0}</div>
                            <div className="stat-label">Rejected</div>
                        </div>
                    </div>
                    
                    <div className="stat-card processing">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.avgProcessingTime > 0 ? stats.avgProcessingTime : (stats.processing || 0)}</div>
                            <div className="stat-label">{stats.avgProcessingTime > 0 ? 'Avg Days' : 'Processing'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="search-section">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search refunds..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button className="search-btn">
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                    <button className="refresh-btn" onClick={refreshData}>
                        <FontAwesomeIcon icon={faSyncAlt} />
                    </button>
                </div>
                
                <div className="filter-container">
                    <select 
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Refunds Table */}
            <div className="table-section">
                <div className="table-header">
                    <h3>Refund Requests ({filteredRefunds.length})</h3>
                </div>
                
                {filteredRefunds.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faUndo} />
                        <p>No refund requests found</p>
                        {searchTerm && (
                            <button className="btn-secondary" onClick={() => setSearchTerm('')}>
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRefunds.map((refund, index) => (
                                    <tr key={refund._id}>
                                        <td className="row-number">{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>
                                            <div className="order-info">
                                                <span className="order-number">#{refund.orderId?.orderNumber}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-info">
                                                <span className="customer-name">{refund.userId?.name}</span>
                                                <span className="customer-email">{refund.userId?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-info">
                                                <span className="product-name">{refund.productId?.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="amount">{formatCurrency(refund.refundAmount)}</span>
                                        </td>
                                        <td>
                                            <span className="reason-badge">{refund.reason}</span>
                                        </td>
                                        <td>
                                            <span 
                                                className={`status-badge status-${refund.status.toLowerCase()}`}
                                            >
                                                {refund.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="date">{formatDate(refund.createdAt)}</span>
                                        </td>
                                        <td className="actions-cell">
                                            {getActionButtons(refund)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Previous
                    </button>
                    
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Action Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Refund Request
                            </h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="refund-summary">
                                <p><strong>Customer:</strong> {selectedRefund?.userId?.name}</p>
                                <p><strong>Product:</strong> {selectedRefund?.productId?.name}</p>
                                <p><strong>Amount:</strong> {formatCurrency(selectedRefund?.refundAmount)}</p>
                                <p><strong>Reason:</strong> {selectedRefund?.reason}</p>
                                <p><strong>Description:</strong> {selectedRefund?.description}</p>
                            </div>

                            <div className="response-section">
                                <label htmlFor="adminResponse">
                                    Admin Response {actionType === 'reject' && '*'}:
                                </label>
                                <textarea
                                    id="adminResponse"
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder={`Enter your ${actionType} message...`}
                                    rows="4"
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="secondary-btn" 
                                onClick={() => setShowModal(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button 
                                className={`primary-btn ${actionType}-btn`}
                                onClick={executeAction}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefundManagement;