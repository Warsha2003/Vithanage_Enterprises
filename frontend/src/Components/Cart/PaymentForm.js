import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './PaymentForm.css';

const PaymentForm = ({ clientSecret, orderData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Confirm the payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-processing',
      },
      redirect: 'if_required'
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful, now create the order
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            paymentMethod: 'card',
            orderData
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Navigate to order confirmation page
          navigate('/order-confirmation', { 
            state: { 
              order: data.order, 
              payment: data.payment 
            } 
          });
        } else {
          setMessage(data.message || 'Order creation failed');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Order creation error:', err);
        setMessage('Failed to create order. Please contact support.');
        setIsLoading(false);
      }
    } else {
      setMessage('Payment status: ' + paymentIntent.status);
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="payment-form-container">
        <PaymentElement id="payment-element" />
        
        <button 
          disabled={isLoading || !stripe || !elements} 
          id="submit"
          className="pay-button"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="spinner-small"></div>
            ) : (
              `Pay $${orderData.totals.total.toFixed(2)}`
            )}
          </span>
        </button>

        {message && <div id="payment-message" className="payment-message">{message}</div>}
      </div>
    </form>
  );
};

export default PaymentForm;
