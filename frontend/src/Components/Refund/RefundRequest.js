import React, { useState, useEffect } from 'react';
import './RefundRequest.css';

const RefundRequest = ({ orderId, productId, productName, productPrice, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        refundAmount: productPrice || 0
    });
    const [loading, setLoading] = useState(false);
    const [eligibility, setEligibility] = useState(null);
    const [checkingEligibility, setCheckingEligibility] = useState(true);

    const refundReasons = [
        'Defective Product',
        'Wrong Item Received', 
        'Not as Described',
        'Damaged During Shipping',
        'Changed Mind',
        'Size/Color Issue',
        'Late Delivery',
        'Other'
    ];

    useEffect(() => {
        checkRefundEligibility();
    }, [orderId, productId]);

    const checkRefundEligibility = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            console.log('Checking eligibility for:', { orderId, productId });
            console.log('Token:', token ? 'Present' : 'Missing');
            
            const response = await fetch(
                `http://localhost:5000/api/refunds/eligibility/${orderId}/${productId}`,
                {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                setEligibility(data.data);
            } else {
                setEligibility({ eligible: false, reason: data.message || 'Unable to check eligibility' });
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            setEligibility({ eligible: false, reason: 'Error checking eligibility' });
        } finally {
            setCheckingEligibility(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.reason || !formData.description) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.refundAmount <= 0) {
            alert('Refund amount must be greater than 0');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/refunds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    orderId,
                    productId,
                    ...formData
                })
            });

            const data = await response.json();

            if (data.success) {
                // Save refund status to localStorage for immediate display
                try {
                    const localRefunds = JSON.parse(localStorage.getItem('userRefunds') || '{}');
                    const refundKey = `${orderId}-${productId}`;
                    localRefunds[refundKey] = 'Pending'; // Initial status
                    localStorage.setItem('userRefunds', JSON.stringify(localRefunds));
                } catch (e) {
                    console.log('Could not save to localStorage:', e);
                }
                
                alert('Refund request submitted successfully!');
                onSuccess && onSuccess(data.data);
                onClose();
            } else {
                alert(data.message || 'Failed to submit refund request');
            }
        } catch (error) {
            console.error('Error submitting refund request:', error);
            alert('Error submitting refund request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingEligibility) {
        return (
            <div className="refund-modal">
                <div className="refund-modal-content">
                    <div className="refund-loading">
                        <div className="spinner"></div>
                        <p>Checking refund eligibility...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!eligibility?.eligible) {
        return (
            <div className="refund-modal">
                <div className="refund-modal-content">
                    <div className="refund-header">
                        <h3>Refund Not Available</h3>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="refund-ineligible">
                        <div className="ineligible-icon">❌</div>
                        <p>{eligibility.reason}</p>
                        <button className="secondary-btn" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="refund-modal">
            <div className="refund-modal-content">
                <div className="refund-header">
                    <h3>Request Refund</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="product-info">
                    <h4>{productName}</h4>
                    <p className="product-price">Price: ${productPrice}</p>
                </div>

                <form onSubmit={handleSubmit} className="refund-form">
                    <div className="form-group">
                        <label htmlFor="reason">Reason for Refund *</label>
                        <select
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a reason</option>
                            {refundReasons.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Please provide detailed explanation for the refund request"
                            rows="4"
                            maxLength="500"
                            required
                        />
                        <span className="char-count">
                            {formData.description.length}/500
                        </span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="refundAmount">Refund Amount</label>
                        <input
                            type="number"
                            id="refundAmount"
                            name="refundAmount"
                            value={formData.refundAmount}
                            onChange={handleInputChange}
                            min="0.01"
                            max={productPrice}
                            step="0.01"
                            required
                        />
                        <span className="amount-note">
                            Maximum refund amount: ${productPrice}
                        </span>
                    </div>

                    <div className="refund-policy">
                        <h5>Refund Policy</h5>
                        <ul>
                            <li>Refunds are processed within 7-10 business days</li>
                            <li>Items must be in original condition</li>
                            <li>Refund will be processed to original payment method</li>
                            <li>Shipping costs are non-refundable</li>
                        </ul>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="secondary-btn" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="primary-btn"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Refund Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RefundRequest;