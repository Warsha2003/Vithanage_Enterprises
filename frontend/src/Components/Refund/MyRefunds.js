import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './MyRefunds.css';

const MyRefunds = () => {
    const { settings, formatCurrency } = useSettings();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchRefunds();
    }, [currentPage]);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5000/api/refunds?page=${currentPage}&limit=10`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            
            if (data.success) {
                setRefunds(data.data.refunds);
                setTotalPages(data.data.pages);
            } else {
                console.error('Failed to fetch refunds');
            }
        } catch (error) {
            console.error('Error fetching refunds:', error);
        } finally {
            setLoading(false);
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return '⏳';
            case 'Approved': return '✅';
            case 'Rejected': return '❌';
            case 'Processing': return '🔄';
            case 'Completed': return '🎉';
            default: return '📋';
        }
    };

    const getStatusTimeline = (currentStatus) => {
        const statuses = ['Pending', 'Approved', 'Processing', 'Completed'];
        const rejectedStatuses = ['Pending', 'Rejected'];
        
        if (currentStatus === 'Rejected') {
            return rejectedStatuses.map((status, index) => ({
                name: status,
                icon: getStatusIcon(status),
                color: getStatusColor(status),
                isActive: index <= rejectedStatuses.indexOf(currentStatus),
                isCurrent: status === currentStatus
            }));
        }
        
        return statuses.map((status, index) => ({
            name: status,
            icon: getStatusIcon(status),
            color: getStatusColor(status),
            isActive: index <= statuses.indexOf(currentStatus),
            isCurrent: status === currentStatus
        }));
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

    if (loading) {
        return (
            <div className="my-refunds-loading">
                <div className="spinner"></div>
                <p>Loading your refunds...</p>
            </div>
        );
    }

    return (
        <div className="my-refunds">
            <div className="refunds-header">
                <h2>My Refund Requests</h2>
                <p>Track the status of your refund requests</p>
            </div>

            {refunds.length === 0 ? (
                <div className="no-refunds">
                    <div className="no-refunds-icon">📦</div>
                    <h3>No Refund Requests Yet</h3>
                    <p>You haven't requested any refunds. Refund requests can be made from your order history.</p>
                </div>
            ) : (
                <div className="refunds-list">
                    {refunds.map(refund => (
                        <div key={refund._id} className="refund-card">
                            <div className="refund-card-header">
                                <div className="refund-info">
                                    <h4>Order #{refund.orderId?.orderNumber}</h4>
                                    <p className="product-name">{refund.productId?.name}</p>
                                </div>
                                <div className="refund-status">
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(refund.status) }}
                                    >
                                        {getStatusIcon(refund.status)} {refund.status}
                                    </span>
                                </div>
                            </div>

                            {/* Enhanced Status Timeline */}
                            <div className="status-timeline">
                                <h5>Refund Progress</h5>
                                <div className="timeline-container">
                                    {getStatusTimeline(refund.status).map((step, index) => (
                                        <div 
                                            key={step.name}
                                            className={`timeline-step ${step.isActive ? 'active' : 'inactive'} ${step.isCurrent ? 'current' : ''}`}
                                        >
                                            <div 
                                                className="timeline-icon"
                                                style={{ 
                                                    backgroundColor: step.isActive ? step.color : '#e9ecef',
                                                    color: step.isActive ? '#fff' : '#6c757d'
                                                }}
                                            >
                                                {step.icon}
                                            </div>
                                            <div className="timeline-label">
                                                <span className={`step-name ${step.isCurrent ? 'current-step' : ''}`}>
                                                    {step.name}
                                                </span>
                                                {step.isCurrent && (
                                                    <div className="current-indicator">Current Status</div>
                                                )}
                                            </div>
                                            {index < getStatusTimeline(refund.status).length - 1 && (
                                                <div 
                                                    className={`timeline-line ${step.isActive ? 'active-line' : 'inactive-line'}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="refund-details">
                                <div className="detail-row">
                                    <span className="label">Reason:</span>
                                    <span className="value">{refund.reason}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Amount:</span>
                                    <span className="value amount">{formatCurrency(refund.refundAmount)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Requested:</span>
                                    <span className="value">{formatDate(refund.createdAt)}</span>
                                </div>
                                {refund.estimatedProcessingDays && (
                                    <div className="detail-row">
                                        <span className="label">Processing Time:</span>
                                        <span className="value">{refund.estimatedProcessingDays} days</span>
                                    </div>
                                )}
                            </div>

                            <div className="refund-description">
                                <p><strong>Description:</strong> {refund.description}</p>
                            </div>

                            {refund.adminResponse && (
                                <div className="admin-response">
                                    <div className="admin-badge">Admin Response</div>
                                    <p>{refund.adminResponse.comment || refund.adminResponse}</p>
                                    {refund.adminResponse.respondedAt && (
                                        <div className="response-date">
                                            Responded on: {new Date(refund.adminResponse.respondedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="refund-card-footer">
                                <div className="refund-method">
                                    <span>Refund Method: {refund.refundMethod}</span>
                                </div>
                                {refund.status === 'Completed' && refund.actualProcessingDate && (
                                    <div className="completed-date">
                                        <span>Completed: {formatDate(refund.actualProcessingDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
        </div>
    );
};

export default MyRefunds;