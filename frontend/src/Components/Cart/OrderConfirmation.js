import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faReceipt, 
  faHome, 
  faBox 
} from '@fortawesome/free-solid-svg-icons';
import './OrderConfirmation.css';
import { useCurrency } from '../../contexts/CurrencyContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, payment } = location.state || {};
  const { formatPrice } = useCurrency();

  if (!order) {
    return (
      <div className="confirmation-container">
        <div className="no-order">
          <p>No order information found.</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-content">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <h1>Order Placed Successfully!</h1>
          <p className="thank-you">Thank you for your purchase</p>
        </div>

        {/* Order Details */}
        <div className="order-details-card">
          <div className="order-info-row">
            <div className="info-item">
              <span className="label">Order Number:</span>
              <span className="value">#{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="label">Order Date:</span>
              <span className="value">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="order-info-row">
            <div className="info-item">
              <span className="label">Payment Method:</span>
              <span className="value">
                {payment?.paymentMethod === 'card' && payment?.cardDetails?.last4
                  ? `Card ending in ${payment.cardDetails.last4}`
                  : payment?.paymentMethod === 'cash_on_delivery'
                  ? 'Cash on Delivery'
                  : 'Card Payment'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Payment Status:</span>
              <span className={`value status-${payment?.status || 'pending'}`}>
                {payment?.status === 'succeeded' ? 'Paid' : 
                 payment?.status === 'pending' ? 'Pending' : 
                 payment?.status || 'Paid'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h2><FontAwesomeIcon icon={faBox} /> Order Items</h2>
          <div className="items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">Qty: {item.quantity}</span>
                </div>
                <span className="item-price">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatPrice(order.totals.subtotal)}</span>
            </div>
            {order.totals.discount > 0 && (
              <div className="summary-row discount">
                <span>Discount:</span>
                <span>-{formatPrice(order.totals.discount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping:</span>
              <span>
                {order.totals.shipping === 0 ? 'FREE' : formatPrice(order.totals.shipping)}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total Paid:</span>
              <span>{formatPrice(order.totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="shipping-address-section">
            <h3>Shipping Address</h3>
            <div className="address-details">
              <p className="name">{order.customer?.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.customer?.phone && (
                <p className="phone">Phone: {order.customer.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Message */}
        <div className="confirmation-message">
          <p>
            <strong>✓ Confirmation email sent to:</strong> {order.customer?.email || 'your email'}
          </p>
          <p>
            We'll send you shipping updates and tracking information once your order ships.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate('/my-orders')}
          >
            <FontAwesomeIcon icon={faReceipt} /> View My Orders
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            <FontAwesomeIcon icon={faHome} /> Continue Shopping
          </button>
        </div>

        {/* Support Info */}
        <div className="support-info">
          <p>Need help with your order?</p>
          <p>Contact us at <a href="mailto:support@vithanage.com">support@vithanage.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
