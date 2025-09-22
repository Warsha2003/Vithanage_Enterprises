import React, { useEffect, useState } from 'react';
import './MyOrders.css';
import RefundRequest from '../Refund/RefundRequest';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefundItem, setSelectedRefundItem] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

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

  const handleRefundRequest = (order, item) => {
    const productId = item.productId || item.product;
    
    console.log('Refund request for:', { 
      orderId: order._id, 
      productId, 
      itemName: item.name,
      orderStatus: order.status 
    });
    
    setSelectedRefundItem({
      orderId: order._id,
      productId: productId,
      productName: item.name,
      productPrice: item.price * item.quantity
    });
    setShowRefundModal(true);
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedRefundItem(null);
    // Optionally refresh orders or show a success message
  };

  const handleCancelOrder = async (order) => {
    // Show confirmation dialog
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel this order?\n\nOrder ID: ${order._id}\nTotal: $${order.totals?.total?.toFixed(2)}\n\nThis action cannot be undone.`
    );
    
    if (!confirmCancel) return;

    setCancellingOrder(order._id);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      console.log('Cancelling order request:', {
        orderId: order._id,
        token: token ? 'Present' : 'Missing',
        url: `http://localhost:5000/api/orders/${order._id}/cancel`
      });

      const response = await fetch(`http://localhost:5000/api/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o._id === order._id 
              ? { ...o, status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'user' }
              : o
          )
        );
        alert('Order cancelled successfully!');
      } else {
        console.error('Cancel failed:', data);
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`Error cancelling order: ${error.message}`);
    } finally {
      setCancellingOrder(null);
    }
  };

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
                  <div>
                    <div><strong>Order ID:</strong> {order._id}</div>
                    <div><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  
                  {/* Cancel Order Button */}
                  {(order.status === 'pending' || order.status === 'approved') && (
                    <button 
                      className="cancel-order-btn"
                      onClick={() => handleCancelOrder(order)}
                      disabled={cancellingOrder === order._id}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
                <div className="order-items">
                  {order.items.map((it, idx) => (
                    <div className="order-line" key={idx}>
                      <div className="item-info">
                        <span>{it.name} × {it.quantity}</span>
                        <span>${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                      {/* Show status */}
                      <small style={{color: '#666', fontSize: '0.8rem'}}>
                        Status: {order.status}
                      </small>
                      
                      {/* Show refund button only for approved/delivered orders */}
                      {(order.status === 'approved' || order.status === 'Delivered' || 
                        (order.status === 'approved' && order.processing && order.processing.step === 'finished')) && (
                        <button 
                          className="refund-btn"
                          onClick={() => handleRefundRequest(order, it)}
                        >
                          Request Refund
                        </button>
                      )}
                      
                      {/* Show appropriate message for other statuses */}
                      {order.status === 'pending' && (
                        <small style={{color: '#ffa500', fontSize: '0.8rem', fontStyle: 'italic'}}>
                          Awaiting admin approval
                        </small>
                      )}
                      {order.status === 'rejected' && (
                        <small style={{color: '#ff6b6b', fontSize: '0.8rem', fontStyle: 'italic'}}>
                          Order rejected - Refund not available
                        </small>
                      )}
                      {order.status === 'cancelled' && (
                        <small style={{color: '#ff6b6b', fontSize: '0.8rem', fontStyle: 'italic'}}>
                          Order cancelled - Refund not available
                        </small>
                      )}
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
                  {order.promotion && (
                    <div className="total-row promotion-used">
                      <span>🎉 Promotion "{order.promotion.code}" Applied</span>
                      <span>-${order.totals?.discount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="total-row"><span>Shipping</span><span>${order.totals?.shipping?.toFixed(2)}</span></div>
                  <div className="total-row total"><span>Total</span><span>${order.totals?.total?.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Refund Request Modal */}
      {showRefundModal && selectedRefundItem && (
        <RefundRequest
          orderId={selectedRefundItem.orderId}
          productId={selectedRefundItem.productId}
          productName={selectedRefundItem.productName}
          productPrice={selectedRefundItem.productPrice}
          onClose={() => setShowRefundModal(false)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
};

export default MyOrders;


