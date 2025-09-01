import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import './AdminDashboard.css';
import './stat-detail.css';
import './dashboard-header.css';
import ProductManagement from './ProductManagement';
// Add Font Awesome for icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faBoxOpen, faShoppingCart, faMoneyBillWave, 
  faChartLine, faStar, faExchangeAlt, faHome, faBell,
  faCog, faSignOutAlt, faClipboardList, faWarehouse, faPercent
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  // Admin dashboard states
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(3); // Example notification count
  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    adminUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });
  
  // Admin user state
  const [adminUser, setAdminUser] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUpdateMessage, setProfileUpdateMessage] = useState({ type: '', message: '' });

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.isAdmin) {
      setIsAdmin(true);
      // Load admin details into state
      setAdminUser(prevState => ({
        ...prevState,
        name: user.name || '',
        email: user.email || ''
      }));
      // Fetch data for admin
      fetchUsers();
      fetchDashboardStats();
    }
    setLoading(false);

    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const headerUser = document.querySelector('.header-user');
      if (headerUser && !headerUser.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'x-auth-token': token
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      setUsers(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }
      
      console.log('Using token:', token.substring(0, 10) + '...');
      
      const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Dashboard stats received:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard stats');
      }
      
      setStats({
        totalUsers: data.totalUsers,
        regularUsers: data.regularUsers,
        adminUsers: data.adminUsers,
        totalProducts: data.totalProducts,
        totalOrders: data.totalOrders,
        totalRevenue: data.totalRevenue,
        pendingOrders: data.pendingOrders,
        lowStockItems: data.lowStockItems
      });
      
      console.log('Stats updated:', {
        totalUsers: data.totalUsers,
        regularUsers: data.regularUsers,
        adminUsers: data.adminUsers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to default stats if fetch fails
      setStats({
        totalUsers: 0,
        regularUsers: 0,
        adminUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockItems: 0
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setAdminUser(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous messages when user starts typing
    if (profileUpdateMessage.message) {
      setProfileUpdateMessage({ type: '', message: '' });
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
    // Clear any previous messages when opening/closing modal
    if (profileUpdateMessage.message) {
      setProfileUpdateMessage({ type: '', message: '' });
    }
  };

  const navigateToDashboard = () => {
    setActiveModule('dashboard');
    setShowDropdown(false);
  };

  const updateProfile = async () => {
    try {
      // Validate inputs
      if (!adminUser.name.trim() || !adminUser.email.trim()) {
        setProfileUpdateMessage({ type: 'error', message: 'Name and email are required.' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminUser.email)) {
        setProfileUpdateMessage({ type: 'error', message: 'Please enter a valid email address.' });
        return;
      }

      // Check if changing password
      if (adminUser.newPassword) {
        if (!adminUser.currentPassword) {
          setProfileUpdateMessage({ type: 'error', message: 'Current password is required to set a new password.' });
          return;
        }
        if (adminUser.newPassword.length < 6) {
          setProfileUpdateMessage({ type: 'error', message: 'New password must be at least 6 characters.' });
          return;
        }
        if (adminUser.newPassword !== adminUser.confirmPassword) {
          setProfileUpdateMessage({ type: 'error', message: 'New passwords do not match.' });
          return;
        }
      }

      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileUpdateMessage({ type: 'error', message: 'Authentication failed. Please login again.' });
        return;
      }

      // Prepare data for API
      const updateData = {
        name: adminUser.name,
        email: adminUser.email
      };

      // Add password data if changing password
      if (adminUser.newPassword) {
        updateData.currentPassword = adminUser.currentPassword;
        updateData.newPassword = adminUser.newPassword;
      }

      // Call API to update profile
      const response = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage with new user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update admin user state with new data
        setAdminUser(prevState => ({
          ...prevState,
          name: data.user.name,
          email: data.user.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      // If token was refreshed, update it
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      setProfileUpdateMessage({ type: 'success', message: 'Profile updated successfully!' });
      
      // Refresh page after successful update after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileUpdateMessage({ 
        type: 'error', 
        message: error.message || 'Failed to update profile. Please try again.' 
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect to login if not admin
  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  const renderActiveModule = () => {
    switch(activeModule) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'products':
        return renderProducts();
      case 'orders':
        return renderOrders();
      case 'inventory':
        return renderInventory();
      case 'financial':
        return renderFinancial();
      case 'reviews':
        return renderReviews();
      case 'refunds':
        return renderRefunds();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2><FontAwesomeIcon icon={faHome} /> Dashboard Overview</h2>
        <button 
          className="refresh-btn" 
          onClick={fetchDashboardStats}
          title="Refresh Dashboard Stats"
        >
          <FontAwesomeIcon icon={faUsers} /> Refresh Stats
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
            <div className="stat-detail">
              <span>Regular Users: {stats.regularUsers}</span>
              <span>Admin Users: {stats.adminUsers}</span>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faShoppingCart} /></div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p>${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>Action Required</h3>
        <div className="action-cards">
          <div className="action-card">
            <h4><FontAwesomeIcon icon={faShoppingCart} /> Pending Orders</h4>
            <p>{stats.pendingOrders} orders need processing</p>
            <button className="action-btn" onClick={() => setActiveModule('orders')}>View Orders</button>
          </div>
          
          <div className="action-card">
            <h4><FontAwesomeIcon icon={faWarehouse} /> Low Stock</h4>
            <p>{stats.lowStockItems} items are low in stock</p>
            <button className="action-btn" onClick={() => setActiveModule('inventory')}>Check Inventory</button>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-time">Today, 10:45 AM</div>
            <div className="activity-detail">New order #ORD7823 received for $175.99</div>
          </div>
          <div className="activity-item">
            <div className="activity-time">Today, 09:30 AM</div>
            <div className="activity-detail">User John D. left a 5-star review on Deluxe Microwave</div>
          </div>
          <div className="activity-item">
            <div className="activity-time">Yesterday, 03:15 PM</div>
            <div className="activity-detail">Inventory updated - Added 15 new Samsung Refrigerators</div>
          </div>
          <div className="activity-item">
            <div className="activity-time">Yesterday, 12:30 PM</div>
            <div className="activity-detail">New user Sarah J. registered</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faUsers} /> User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-actions">
        <button className="primary-btn"><FontAwesomeIcon icon={faUsers} /> Add New User</button>
        <div className="search-box">
          <input type="text" placeholder="Search users..." />
          <button>Search</button>
        </div>
      </div>
      
      <div className="admin-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={user.isAdmin ? 'badge admin' : 'badge user'}>{user.isAdmin ? 'Admin' : 'User'}</span></td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faUsers} /></button>
                    <button className="edit-btn" title="Edit User"><FontAwesomeIcon icon={faCog} /></button>
                    <button className="delete-btn" title="Delete User"><FontAwesomeIcon icon={faSignOutAlt} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <ProductManagement />
  );

  const renderOrders = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faShoppingCart} /> Order Management</h2>
      
      <div className="admin-actions">
        <div className="filter-group">
          <select>
            <option>All Orders</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Search order #..." />
          <button>Search</button>
        </div>
      </div>
      
      <div className="admin-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#ORD7823</td>
              <td>John Smith</td>
              <td>29 Aug 2025</td>
              <td>$175.99</td>
              <td><span className="badge pending">Pending</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Order"><FontAwesomeIcon icon={faShoppingCart} /></button>
                <button className="edit-btn" title="Update Status"><FontAwesomeIcon icon={faCog} /></button>
                <button className="print-btn" title="Print Invoice"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
            <tr>
              <td>#ORD7822</td>
              <td>Sarah Johnson</td>
              <td>28 Aug 2025</td>
              <td>$899.99</td>
              <td><span className="badge processing">Processing</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Order"><FontAwesomeIcon icon={faShoppingCart} /></button>
                <button className="edit-btn" title="Update Status"><FontAwesomeIcon icon={faCog} /></button>
                <button className="print-btn" title="Print Invoice"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
            <tr>
              <td>#ORD7821</td>
              <td>Michael Brown</td>
              <td>27 Aug 2025</td>
              <td>$249.50</td>
              <td><span className="badge delivered">Delivered</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Order"><FontAwesomeIcon icon={faShoppingCart} /></button>
                <button className="edit-btn" title="Update Status"><FontAwesomeIcon icon={faCog} /></button>
                <button className="print-btn" title="Print Invoice"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faWarehouse} /> Inventory Management</h2>
      
      <div className="admin-actions">
        <button className="primary-btn"><FontAwesomeIcon icon={faWarehouse} /> Update Inventory</button>
        <div className="search-box">
          <input type="text" placeholder="Search inventory..." />
          <button>Search</button>
        </div>
      </div>
      
      <div className="admin-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Smart TV 55"</td>
              <td>TV-55S-001</td>
              <td>12</td>
              <td><span className="badge in-stock">In Stock</span></td>
              <td>25 Aug 2025</td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faWarehouse} /></button>
                <button className="edit-btn" title="Update Stock"><FontAwesomeIcon icon={faCog} /></button>
                <button className="history-btn" title="View History"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
            <tr>
              <td>Microwave Oven</td>
              <td>MW-001</td>
              <td>2</td>
              <td><span className="badge low-stock">Low Stock</span></td>
              <td>27 Aug 2025</td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faWarehouse} /></button>
                <button className="edit-btn" title="Update Stock"><FontAwesomeIcon icon={faCog} /></button>
                <button className="history-btn" title="View History"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
            <tr>
              <td>Refrigerator</td>
              <td>REF-LG-001</td>
              <td>5</td>
              <td><span className="badge in-stock">In Stock</span></td>
              <td>26 Aug 2025</td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faWarehouse} /></button>
                <button className="edit-btn" title="Update Stock"><FontAwesomeIcon icon={faCog} /></button>
                <button className="history-btn" title="View History"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faMoneyBillWave} /> Financial & Promotions</h2>
      
      <div className="admin-tabs">
        <button className="tab-btn active">Financial Overview</button>
        <button className="tab-btn">Promotions</button>
        <button className="tab-btn">Discount Codes</button>
      </div>
      
      <div className="admin-section">
        <h3>Financial Summary</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p>$12,750.75</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faChartLine} /></div>
            <div className="stat-info">
              <h3>Monthly Sales</h3>
              <p>$4,580.25</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faPercent} /></div>
            <div className="stat-info">
              <h3>Active Promotions</h3>
              <p>3</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="admin-section">
        <h3>Active Promotions</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Promotion</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Summer Sale</td>
              <td>SUMMER25</td>
              <td>25%</td>
              <td>01 Aug 2025</td>
              <td>31 Aug 2025</td>
              <td><span className="badge active">Active</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faMoneyBillWave} /></button>
                <button className="edit-btn" title="Edit Promotion"><FontAwesomeIcon icon={faCog} /></button>
                <button className="delete-btn" title="End Promotion"><FontAwesomeIcon icon={faSignOutAlt} /></button>
              </td>
            </tr>
            <tr>
              <td>New Customer</td>
              <td>WELCOME10</td>
              <td>10%</td>
              <td>01 Jan 2025</td>
              <td>31 Dec 2025</td>
              <td><span className="badge active">Active</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faMoneyBillWave} /></button>
                <button className="edit-btn" title="Edit Promotion"><FontAwesomeIcon icon={faCog} /></button>
                <button className="delete-btn" title="End Promotion"><FontAwesomeIcon icon={faSignOutAlt} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faStar} /> Product Reviews & Ratings</h2>
      
      <div className="admin-actions">
        <div className="filter-group">
          <select>
            <option>All Reviews</option>
            <option>5 Star</option>
            <option>4 Star</option>
            <option>3 Star</option>
            <option>2 Star</option>
            <option>1 Star</option>
          </select>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Search product or user..." />
          <button>Search</button>
        </div>
      </div>
      
      <div className="admin-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Smart TV 55"</td>
              <td>John Smith</td>
              <td>
                <div className="star-rating">
                  <span className="stars">★★★★☆</span>
                  <span className="rating-text">4/5</span>
                </div>
              </td>
              <td className="review-text">Great TV, excellent picture quality but the smart features are a bit slow.</td>
              <td>25 Aug 2025</td>
              <td className="action-buttons">
                <button className="view-btn" title="View Full Review"><FontAwesomeIcon icon={faStar} /></button>
                <button className="reply-btn" title="Reply to Review"><FontAwesomeIcon icon={faCog} /></button>
                <button className="delete-btn" title="Delete Review"><FontAwesomeIcon icon={faSignOutAlt} /></button>
              </td>
            </tr>
            <tr>
              <td>Microwave Oven</td>
              <td>Sarah Johnson</td>
              <td>
                <div className="star-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">5/5</span>
                </div>
              </td>
              <td className="review-text">Absolutely love this microwave! It's perfect for my needs.</td>
              <td>27 Aug 2025</td>
              <td className="action-buttons">
                <button className="view-btn" title="View Full Review"><FontAwesomeIcon icon={faStar} /></button>
                <button className="reply-btn" title="Reply to Review"><FontAwesomeIcon icon={faCog} /></button>
                <button className="delete-btn" title="Delete Review"><FontAwesomeIcon icon={faSignOutAlt} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRefunds = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faExchangeAlt} /> Refund Management</h2>
      
      <div className="admin-actions">
        <div className="filter-group">
          <select>
            <option>All Refunds</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Search refund #..." />
          <button>Search</button>
        </div>
      </div>
      
      <div className="admin-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Refund #</th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#REF102</td>
              <td>#ORD7820</td>
              <td>Robert Wilson</td>
              <td>$129.99</td>
              <td>Item damaged during shipping</td>
              <td><span className="badge pending">Pending</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faExchangeAlt} /></button>
                <button className="approve-btn" title="Approve Refund"><FontAwesomeIcon icon={faCog} /></button>
                <button className="reject-btn" title="Reject Refund"><FontAwesomeIcon icon={faSignOutAlt} /></button>
              </td>
            </tr>
            <tr>
              <td>#REF101</td>
              <td>#ORD7815</td>
              <td>Emily Davis</td>
              <td>$75.50</td>
              <td>Wrong item received</td>
              <td><span className="badge approved">Approved</span></td>
              <td className="action-buttons">
                <button className="view-btn" title="View Details"><FontAwesomeIcon icon={faExchangeAlt} /></button>
                <button className="complete-btn" title="Mark as Completed"><FontAwesomeIcon icon={faCog} /></button>
                <button className="print-btn" title="Print Details"><FontAwesomeIcon icon={faClipboardList} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Vithanage</h2>
          <p>Admin Panel</p>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            <span>{adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}</span>
          </div>
          <div className="user-info">
            <h3>{adminUser.name || 'Admin User'}</h3>
            <p>{adminUser.email || 'admin@vithanage.com'}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={activeModule === 'dashboard' ? 'active' : ''} onClick={() => setActiveModule('dashboard')}>
              <FontAwesomeIcon icon={faHome} /> Dashboard
            </li>
            <li className={activeModule === 'users' ? 'active' : ''} onClick={() => setActiveModule('users')}>
              <FontAwesomeIcon icon={faUsers} /> User Management
            </li>
            <li className={activeModule === 'products' ? 'active' : ''} onClick={() => setActiveModule('products')}>
              <FontAwesomeIcon icon={faBoxOpen} /> Product Management
            </li>
            <li className={activeModule === 'orders' ? 'active' : ''} onClick={() => setActiveModule('orders')}>
              <FontAwesomeIcon icon={faShoppingCart} /> Order & Cart
            </li>
            <li className={activeModule === 'inventory' ? 'active' : ''} onClick={() => setActiveModule('inventory')}>
              <FontAwesomeIcon icon={faWarehouse} /> Inventory
            </li>
            <li className={activeModule === 'financial' ? 'active' : ''} onClick={() => setActiveModule('financial')}>
              <FontAwesomeIcon icon={faMoneyBillWave} /> Financial & Promotions
            </li>
            <li className={activeModule === 'reviews' ? 'active' : ''} onClick={() => setActiveModule('reviews')}>
              <FontAwesomeIcon icon={faStar} /> Reviews & Ratings
            </li>
            <li className={activeModule === 'refunds' ? 'active' : ''} onClick={() => setActiveModule('refunds')}>
              <FontAwesomeIcon icon={faExchangeAlt} /> Refund Management
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="settings-btn">
            <FontAwesomeIcon icon={faCog} /> Settings
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </div>
      </div>
      
      <div className="admin-main">
        <div className="admin-header">
          <div className="header-search">
            <input type="text" placeholder="Search..." />
          </div>
          
          <div className="header-actions">
            <div className="notifications">
              <button className="notification-btn">
                <FontAwesomeIcon icon={faBell} />
                {notifications > 0 && <span className="notification-badge">{notifications}</span>}
              </button>
            </div>
            
            <div className="header-user">
              <button className="user-btn" onClick={toggleProfileModal}>
                <span>{adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="admin-content">
          {error && <div className="error-message">{error}</div>}
          {renderActiveModule()}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={toggleProfileModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faCog} /> Edit Admin Profile</h2>
              <button className="close-btn" onClick={toggleProfileModal}>&times;</button>
            </div>
            <div className="modal-body">
              {profileUpdateMessage.message && (
                <div className={`message ${profileUpdateMessage.type}`}>
                  <FontAwesomeIcon icon={profileUpdateMessage.type === 'success' ? faUsers : faSignOutAlt} />
                  {profileUpdateMessage.message}
                </div>
              )}
              <div className="form-group">
                <label><FontAwesomeIcon icon={faUsers} /> Admin Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={adminUser.name || ''} 
                  onChange={handleProfileInputChange}
                  placeholder="Your Name" 
                  className={!adminUser.name.trim() && profileUpdateMessage.type === 'error' ? 'error' : ''}
                />
                {!adminUser.name.trim() && profileUpdateMessage.type === 'error' && (
                  <div className="input-error">
                    <FontAwesomeIcon icon={faSignOutAlt} /> Name is required
                  </div>
                )}
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faUsers} /> Admin Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={adminUser.email || ''} 
                  onChange={handleProfileInputChange}
                  placeholder="Your Email" 
                  className={(!adminUser.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminUser.email)) && profileUpdateMessage.type === 'error' ? 'error' : ''}
                />
                {!adminUser.email.trim() && profileUpdateMessage.type === 'error' && (
                  <div className="input-error">
                    <FontAwesomeIcon icon={faSignOutAlt} /> Email is required
                  </div>
                )}
                {adminUser.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminUser.email) && profileUpdateMessage.type === 'error' && (
                  <div className="input-error">
                    <FontAwesomeIcon icon={faSignOutAlt} /> Please enter a valid email address
                  </div>
                )}
              </div>
              <div className="password-section">
                <h3><FontAwesomeIcon icon={faSignOutAlt} /> Change Password</h3>
                <p className="hint">Leave password fields empty if you don't want to change your password.</p>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faSignOutAlt} /> Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={adminUser.currentPassword || ''} 
                    onChange={handleProfileInputChange}
                    placeholder="Current Password" 
                    className={adminUser.newPassword && !adminUser.currentPassword && profileUpdateMessage.type === 'error' ? 'error' : ''}
                  />
                  {adminUser.newPassword && !adminUser.currentPassword && profileUpdateMessage.type === 'error' && (
                    <div className="input-error">
                      <FontAwesomeIcon icon={faSignOutAlt} /> Current password is required to set a new password
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faSignOutAlt} /> New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={adminUser.newPassword || ''} 
                    onChange={handleProfileInputChange}
                    placeholder="New Password" 
                    className={adminUser.newPassword && adminUser.newPassword.length < 6 && profileUpdateMessage.type === 'error' ? 'error' : ''}
                  />
                  {adminUser.newPassword && adminUser.newPassword.length < 6 && profileUpdateMessage.type === 'error' && (
                    <div className="input-error">
                      <FontAwesomeIcon icon={faSignOutAlt} /> Password must be at least 6 characters
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faSignOutAlt} /> Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={adminUser.confirmPassword || ''} 
                    onChange={handleProfileInputChange}
                    placeholder="Confirm New Password" 
                    className={adminUser.newPassword && adminUser.newPassword !== adminUser.confirmPassword && profileUpdateMessage.type === 'error' ? 'error' : ''}
                  />
                  {adminUser.newPassword && adminUser.newPassword !== adminUser.confirmPassword && profileUpdateMessage.type === 'error' && (
                    <div className="input-error">
                      <FontAwesomeIcon icon={faSignOutAlt} /> Passwords do not match
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={toggleProfileModal}>Cancel</button>
              <button className="save-btn" onClick={updateProfile}>
                <FontAwesomeIcon icon={faCog} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
