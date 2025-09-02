import React, { useEffect, useState } from 'react';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your orders.');
          setLoading(false);
          return;
        }
        const res = await fetch('http://localhost:5000/api/orders/mine', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json().catch(() => ([]));
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setError(data?.message || 'Failed to load orders');
        }
      } catch (e) {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="orders-page"><div className="orders-card">Loading your orders...</div></div>;
  }

  if (error) {
    return <div className="orders-page"><div className="orders-card error">{error}</div></div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h2>My Orders</h2>
        {orders.length === 0 ? (
          <div className="orders-card">You have no orders yet.</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-item" key={order._id}>
                <div className="order-header">
                  <div><strong>Order ID:</strong> {order._id}</div>
                  <div><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="order-items">
                  {order.items.map((it, idx) => (
                    <div className="order-line" key={idx}>
                      <span>{it.name} × {it.quantity}</span>
                      <span>${(it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-totals">
                  <div className="total-row"><span>Status</span><span><span className={`badge ${order.status}`}>{order.status}</span></span></div>
                  {order.status === 'approved' && (
                    <div style={{ margin: '8px 0 4px', color: '#555' }}>
                      <div>Processing</div>
                      <div className="progress-steps">
                        {[1,2,3,4,5].map((idx) => (
                          <div 
                            key={idx}
                            className={`progress-step ${ (order.processing?.stepIndex || 0) >= idx ? 'active' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="total-row"><span>Subtotal</span><span>${order.totals?.subtotal?.toFixed(2)}</span></div>
                  <div className="total-row"><span>Shipping</span><span>${order.totals?.shipping?.toFixed(2)}</span></div>
                  <div className="total-row total"><span>Total</span><span>${order.totals?.total?.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;


