import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';
import { useCart } from './CartContext';
import './Checkout.css';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';

// Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_51SuFmfCmUMykNTCqS6iQG438BoDHJ0Xq6mabz4IQPU8sXJPepNgyadWgkMvhm9Spgnepz9wKXzDQ5R9tjRp0jq6F00tvurnP4v');

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderData } = location.state || {};
  
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [retryCount, setRetryCount] = useState(0);
  
  const { settings, getShippingCost } = useSettings();
  const { formatPrice } = useCurrency();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderData) {
      navigate('/cart');
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: orderData.totals.total,
            currency: 'usd',
            orderItems: orderData.items
          })
        });

        const data = await response.json();

        if (response.ok) {
          setClientSecret(data.clientSecret);
          setError(null);
        } else {
          setError(data.message || 'Unable to initialize payment. Please try again.');
        }
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError('Connection error. Please check your internet and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (paymentMethod === 'card') {
      createPaymentIntent();
    } else {
      setLoading(false);
    }
  }, [orderData, navigate, paymentMethod, retryCount]);

  const handleRetryPayment = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleCashOnDelivery = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: 'cash_on_delivery',
          orderData
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart after successful COD order
        await clearCart();
        
        navigate('/order-confirmation', { 
          state: { 
            order: data.order, 
            payment: data.payment 
          } 
        });
      } else {
        setError(data.message || 'Order creation failed');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError('Failed to create order');
    }
  };

  if (!orderData) {
    return (
      <div className="checkout-container">
        <p>No order data found. Please go to cart.</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <button 
            className="back-button" 
            onClick={() => navigate('/place-order', { state: { fromCheckout: true } })}
          >
            ← Back to Order
          </button>
        </div>

        <div className="checkout-layout">
          {/* Order Summary */}
          <div className="order-summary-section">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              <h3>Items ({orderData.items.length})</h3>
              {orderData.items.map((item, index) => (
                <div key={index} className="summary-item">
                  <span className="item-name">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="item-price">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(orderData.totals.subtotal)}</span>
              </div>
              {orderData.totals.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-{formatPrice(orderData.totals.discount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping:</span>
                <span>
                  {orderData.totals.shipping === 0 ? 'FREE' : formatPrice(orderData.totals.shipping)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatPrice(orderData.totals.total)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {orderData.shippingAddress && (
              <div className="shipping-info">
                <h3>Shipping Address</h3>
                <p>{orderData.customer?.fullName}</p>
                <p>{orderData.shippingAddress.addressLine1}</p>
                {orderData.shippingAddress.addressLine2 && (
                  <p>{orderData.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.postalCode}
                </p>
                <p>{orderData.shippingAddress.country}</p>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="payment-section">
            <h2>Payment Method</h2>
            
            <div className="payment-method-selector">
              <button
                className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Credit/Debit Card
              </button>
              <button
                className={`method-btn ${paymentMethod === 'cash_on_delivery' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash_on_delivery')}
              >
                💵 Cash on Delivery
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="card-payment-section">
                {loading ? (
                  <div className="payment-loading">
                    <div className="spinner"></div>
                    <p>Initializing secure payment...</p>
                  </div>
                ) : error ? (
                  <div className="payment-error-container">
                    <div className="payment-error-icon">⚠️</div>
                    <div className="payment-error-content">
                      <h3>Payment Initialization Issue</h3>
                      <p>{error}</p>
                      <div className="payment-error-actions">
                        <button 
                          className="retry-payment-btn"
                          onClick={handleRetryPayment}
                        >
                          🔄 Retry Payment
                        </button>
                        <button 
                          className="switch-cod-btn"
                          onClick={() => setPaymentMethod('cash_on_delivery')}
                        >
                          Switch to Cash on Delivery
                        </button>
                      </div>
                    </div>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm 
                      clientSecret={clientSecret} 
                      orderData={orderData}
                    />
                  </Elements>
                ) : (
                  <div className="payment-error-container">
                    <div className="payment-error-icon">⚠️</div>
                    <div className="payment-error-content">
                      <h3>Payment Setup Required</h3>
                      <p>Unable to initialize payment. Please retry or use Cash on Delivery.</p>
                      <div className="payment-error-actions">
                        <button 
                          className="retry-payment-btn"
                          onClick={handleRetryPayment}
                        >
                          🔄 Retry Payment
                        </button>
                        <button 
                          className="switch-cod-btn"
                          onClick={() => setPaymentMethod('cash_on_delivery')}
                        >
                          Switch to Cash on Delivery
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="cod-payment-section">
                <div className="cod-info">
                  <h3>Cash on Delivery</h3>
                  <p>Pay with cash when your order is delivered to your doorstep.</p>
                  <ul>
                    <li>✓ No advance payment required</li>
                    <li>✓ Pay only when you receive your order</li>
                    <li>✓ Inspect products before payment</li>
                  </ul>
                </div>
                <button 
                  className="place-order-btn"
                  onClick={handleCashOnDelivery}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="security-badge">
          <span>🔒 Secure Checkout</span>
          <span>|</span>
          <span>SSL Encrypted</span>
          <span>|</span>
          <span>Powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
