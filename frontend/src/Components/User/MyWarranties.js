import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faCheckCircle, 
  faExclamationTriangle,
  faTimesCircle,
  faSpinner,
  faClipboardList,
  faClock,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import './MyWarranties.css';

const MyWarranties = () => {
  const { formatPrice } = useCurrency();
  const [warranties, setWarranties] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [claimModal, setClaimModal] = useState({ show: false, warrantyId: null });
  const [claimIssue, setClaimIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-token': token
    };
  };

  const fetchWarranties = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/warranties/my-warranties', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setWarranties(data.warranties || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getStatusBadge = (warranty) => {
    const daysRemaining = calculateDaysRemaining(warranty.expiryDate);
    
    if (warranty.status === 'expired' || daysRemaining === 0) {
      return <span className="status-badge expired"><FontAwesomeIcon icon={faTimesCircle} /> Expired</span>;
    }
    if (daysRemaining <= 30) {
      return <span className="status-badge expiring"><FontAwesomeIcon icon={faExclamationTriangle} /> Expiring Soon</span>;
    }
    return <span className="status-badge active"><FontAwesomeIcon icon={faCheckCircle} /> Active</span>;
  };

  const handleSubmitClaim = async () => {
    if (!claimIssue.trim()) {
      alert('Please describe the issue');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/warranties/${claimModal.warrantyId}/claim`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ issue: claimIssue })
      });

      if (response.ok) {
        alert('Warranty claim submitted successfully!');
        setClaimModal({ show: false, warrantyId: null });
        setClaimIssue('');
        fetchWarranties();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="warranties-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading warranties...</p>
      </div>
    );
  }

  return (
    <div className="my-warranties-container">
      <div className="warranties-header">
        <h1><FontAwesomeIcon icon={faShieldAlt} /> My Warranties</h1>
        <p>Track and manage your product warranties</p>
      </div>

      {/* Summary Cards */}
      <div className="warranty-summary">
        <div className="summary-card total">
          <span className="summary-number">{summary.total}</span>
          <span className="summary-label">Total Products</span>
        </div>
        <div className="summary-card active">
          <span className="summary-number">{summary.active}</span>
          <span className="summary-label">Active</span>
        </div>
        <div className="summary-card expiring">
          <span className="summary-number">{summary.expiringSoon}</span>
          <span className="summary-label">Expiring Soon</span>
        </div>
        <div className="summary-card expired">
          <span className="summary-number">{summary.expired}</span>
          <span className="summary-label">Expired</span>
        </div>
      </div>

      {/* Warranties List */}
      <div className="warranties-list">
        {warranties.length > 0 ? (
          warranties.map(warranty => {
            const daysRemaining = calculateDaysRemaining(warranty.expiryDate);
            const isExpanded = expandedId === warranty._id;
            const isActive = warranty.status === 'active' && daysRemaining > 0;

            return (
              <div key={warranty._id} className={`warranty-card ${warranty.status}`}>
                <div 
                  className="warranty-header"
                  onClick={() => setExpandedId(isExpanded ? null : warranty._id)}
                >
                  <div className="warranty-product">
                    {warranty.product?.imageUrl && (
                      <img 
                        src={warranty.product.imageUrl} 
                        alt={warranty.productName}
                        onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                      />
                    )}
                    <div className="product-info">
                      <h3>{warranty.productName}</h3>
                      <p className="product-brand">{warranty.product?.brand}</p>
                    </div>
                  </div>
                  <div className="warranty-status">
                    {getStatusBadge(warranty)}
                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="warranty-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Purchase Date</span>
                        <span className="detail-value">
                          {new Date(warranty.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Warranty Period</span>
                        <span className="detail-value">{warranty.warrantyPeriodMonths} months</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Expiry Date</span>
                        <span className="detail-value">
                          {new Date(warranty.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Days Remaining</span>
                        <span className={`detail-value ${daysRemaining <= 30 ? 'warning' : ''}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                        </span>
                      </div>
                    </div>

                    {/* Claims History */}
                    {warranty.claims && warranty.claims.length > 0 && (
                      <div className="claims-section">
                        <h4><FontAwesomeIcon icon={faClipboardList} /> Claim History</h4>
                        {warranty.claims.map((claim, idx) => (
                          <div key={idx} className={`claim-item ${claim.status}`}>
                            <div className="claim-info">
                              <p className="claim-issue">{claim.issue}</p>
                              <span className="claim-date">
                                {new Date(claim.claimDate).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`claim-status ${claim.status}`}>
                              {claim.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Claim Button */}
                    {isActive && (
                      <button 
                        className="claim-warranty-btn"
                        onClick={() => setClaimModal({ show: true, warrantyId: warranty._id })}
                      >
                        <FontAwesomeIcon icon={faClipboardList} /> Submit Warranty Claim
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-warranties">
            <FontAwesomeIcon icon={faShieldAlt} size="3x" />
            <h3>No Warranties Found</h3>
            <p>Warranties will appear here after your orders are delivered.</p>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimModal.show && (
        <div className="claim-modal-overlay" onClick={() => setClaimModal({ show: false, warrantyId: null })}>
          <div className="claim-modal" onClick={e => e.stopPropagation()}>
            <h2>Submit Warranty Claim</h2>
            <p>Describe the issue you're experiencing with this product:</p>
            <textarea
              value={claimIssue}
              onChange={(e) => setClaimIssue(e.target.value)}
              placeholder="Please describe the problem in detail..."
              rows={5}
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setClaimModal({ show: false, warrantyId: null })}
              >
                Cancel
              </button>
              <button 
                className="submit-btn"
                onClick={handleSubmitClaim}
                disabled={submitting}
              >
                {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWarranties;
