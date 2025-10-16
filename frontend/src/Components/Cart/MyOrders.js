import React, { useEffect, useState } from 'react';
import './MyOrders.css';
import RefundRequest from '../Refund/RefundRequest';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const MyOrders = () => {
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefundItem, setSelectedRefundItem] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [refunds, setRefunds] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your orders.');
          setLoading(false);
          return;
        }

        // Fetch orders
        const ordersRes = await fetch('http://localhost:5000/api/orders/mine', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        const ordersData = await ordersRes.json().catch(() => ([]));
        
        if (ordersRes.ok) {
          const ordersList = Array.isArray(ordersData) ? ordersData : [];
          setOrders(ordersList);

          // Fetch refunds for these orders
          try {
            const refundsRes = await fetch('http://localhost:5000/api/refunds', {
              headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Refunds API response status:', refundsRes.status);
            
            if (refundsRes.ok) {
              const refundsData = await refundsRes.json();
              console.log('Refunds data received:', refundsData);
              
              if (refundsData.success) {
                // Create a map of refunds by orderId and productId
                const refundMap = {};
                const localRefundUpdates = {};
                
                refundsData.data.refunds.forEach(refund => {
                  const key = `${refund.orderId._id || refund.orderId}-${refund.productId._id || refund.productId}`;
                  refundMap[key] = refund;
                  localRefundUpdates[key] = refund.status;
                  console.log('Adding refund to map:', { key, status: refund.status });
                });
                
                // Update localStorage with latest refund statuses
                try {
                  const existingLocal = JSON.parse(localStorage.getItem('userRefunds') || '{}');
                  const updatedLocal = { ...existingLocal, ...localRefundUpdates };
                  localStorage.setItem('userRefunds', JSON.stringify(updatedLocal));
                } catch (e) {
                  console.log('Could not update localStorage:', e);
                }
                
                console.log('Final refund map:', refundMap);
                setRefunds(refundMap);
              }
            } else {
              console.log('Refunds API failed:', refundsRes.status);
            }
          } catch (refundError) {
            console.log('Could not fetch refunds:', refundError);
          }
        } else {
          setError(ordersData?.message || 'Failed to load orders');
        }
      } catch (e) {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    // Refresh the page to show the new refund status
    window.location.reload();
  };

  // Function to get refund status for a specific order item
  const getRefundStatus = (orderId, item) => {
    const productId = item.productId || item.product;
    const refundKey = `${orderId}-${productId}`;
    console.log('Checking refund status:', { orderId, productId, refundKey, hasRefund: !!refunds[refundKey] });
    const refund = refunds[refundKey];
    if (refund) {
      console.log('Found refund:', refund);
    }
    return refund;
  };

  // Function to get refund status display
  const getRefundStatusDisplay = (refundStatus) => {
    if (!refundStatus) return null;
    
    const statusColors = {
      'Pending': '#ffc107',
      'Approved': '#28a745', 
      'Processing': '#007bff',
      'Completed': '#6f42c1',
      'Rejected': '#dc3545'
    };

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: statusColors[refundStatus] || '#6c757d',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        marginLeft: '8px'
      }}>
        Refund: {refundStatus}
      </div>
    );
  };

  // Function to check if item has refund request in localStorage
  const getLocalRefundStatus = (orderId, item) => {
    try {
      const localRefunds = JSON.parse(localStorage.getItem('userRefunds') || '{}');
      const productId = item.productId || item.product;
      const key = `${orderId}-${productId}`;
      return localRefunds[key] || null;
    } catch (e) {
      return null;
    }
  };

  const handleCancelOrder = async (order) => {
    // Show confirmation dialog
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel this order?\n\nOrder ID: ${order._id}\nTotal: ${formatPrice(order.totals?.total)}\n\nThis action cannot be undone.`
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
                  {order.items.map((it, idx) => {
                    const refundStatus = getRefundStatus(order._id, it);
                    const localRefundStatus = getLocalRefundStatus(order._id, it);
                    return (
                      <div className="order-line" key={idx}>
                        <div className="item-info">
                          <span>{it.name} × {it.quantity}</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>{formatPrice(it.price * it.quantity)}</span>
                            {getRefundStatusDisplay(refundStatus?.status || localRefundStatus)}
                          </div>
                        </div>
                        {/* Show order status */}
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
                  );
                  })}
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
                  <div className="total-row"><span>Subtotal</span><span>{formatPrice(order.totals?.subtotal)}</span></div>
                  {order.promotion && (
                    <div className="total-row promotion-used">
                      <span>🎉 Promotion "{order.promotion.code}" Applied</span>
                      <span>-{formatPrice(order.totals?.discount || 0)}</span>
                    </div>
                  )}
                  <div className="total-row"><span>Shipping</span><span>{formatPrice(order.totals?.shipping)}</span></div>
                  <div className="total-row total"><span>Total</span><span>{formatPrice(order.totals?.total)}</span></div>
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


