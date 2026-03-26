import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faCoins, 
  faGift, 
  faHistory,
  faArrowUp,
  faArrowDown,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './LoyaltyPoints.css';

const LoyaltyPoints = () => {
  const { points, pointsValue, config, transactions, loading, fetchMyPoints } = useLoyalty();
  const { formatPrice } = useCurrency();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchMyPoints();
  }, []);

  if (loading) {
    return (
      <div className="loyalty-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Loading points...</span>
      </div>
    );
  }

  return (
    <div className="loyalty-points-container">
      {/* Points Summary Card */}
      <div className="points-summary-card">
        <div className="points-icon">
          <FontAwesomeIcon icon={faCoins} />
        </div>
        <div className="points-info">
          <h2>My Loyalty Points</h2>
          <div className="points-value">
            <span className="points-number">{points.toLocaleString()}</span>
            <span className="points-label">points</span>
          </div>
          <p className="points-worth">
            Worth <strong>{formatPrice(pointsValue)}</strong> in discounts
          </p>
        </div>
      </div>

      {/* How Points Work */}
      {config && (
        <div className="points-info-cards">
          <div className="info-card earn">
            <FontAwesomeIcon icon={faArrowUp} />
            <h3>Earn Points</h3>
            <p>Get <strong>{config.pointsPer100LKR} point</strong> for every LKR 100 spent</p>
          </div>
          <div className="info-card redeem">
            <FontAwesomeIcon icon={faGift} />
            <h3>Redeem Points</h3>
            <p><strong>{config.minRedeemPoints}+ points</strong> = Discounts at checkout</p>
          </div>
          <div className="info-card value">
            <FontAwesomeIcon icon={faStar} />
            <h3>Points Value</h3>
            <p><strong>1 point = {formatPrice(config.pointsValueLKR)}</strong> discount</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="points-history-section">
        <div className="history-header" onClick={() => setShowHistory(!showHistory)}>
          <h3>
            <FontAwesomeIcon icon={faHistory} /> Points History
          </h3>
          <span className="toggle-btn">{showHistory ? '▲' : '▼'}</span>
        </div>

        {showHistory && (
          <div className="transactions-list">
            {transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <div key={tx._id || index} className={`transaction-item ${tx.type}`}>
                  <div className="tx-icon">
                    <FontAwesomeIcon 
                      icon={tx.points > 0 ? faArrowUp : faArrowDown} 
                    />
                  </div>
                  <div className="tx-details">
                    <p className="tx-description">{tx.description}</p>
                    <span className="tx-date">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className={`tx-points ${tx.points > 0 ? 'positive' : 'negative'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-transactions">No transactions yet. Start shopping to earn points!</p>
            )}
          </div>
        )}
      </div>

      {/* Bonus Opportunities */}
      <div className="bonus-opportunities">
        <h3>🎁 Ways to Earn More Points</h3>
        <ul>
          <li>✅ Sign up bonus: <strong>{config?.signupBonus || 50} points</strong></li>
          <li>✅ Write a product review: <strong>{config?.reviewBonus || 10} points</strong></li>
          <li>✅ Shop during promotions for <strong>2x points</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default LoyaltyPoints;
