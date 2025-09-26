import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import './AdminDashboard.css';
import './stat-detail.css';
import './dashboard-header.css';
import ProductManagement from './ProductManagement';
import RefundManagement from './RefundManagement';
import InventoryManagement from './InventoryManagement';
import FinancialManagement from './FinancialManagement';
// Add Font Awesome for icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faBoxOpen, faShoppingCart, faMoneyBillWave, 
  faChartLine, faStar, faExchangeAlt, faHome, faBell,
  faCog, faSignOutAlt, faClipboardList, faWarehouse, faPercent, faInfoCircle, faEye, faSearch, faFilePdf, faSync
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
  // Settings hook for global configuration
  const { settings, updateSettings, formatCurrency } = useSettings();
  
  // Admin dashboard states
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(3); // Example notification count
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Predefined categories and brands for product form
  const CATEGORIES = [
    'Televisions',
    'Laptops', 
    'Kitchen Appliances',
    'Air Conditioners',
    'Home Appliances',
    'Refrigerators',
    'Mobile Phones',
    'Audio Systems',
    'Washing Machines',
    'Tablets',
    'Computer Accessories'
  ];

  const BRANDS = [
    'ASUS', 'Acer', 'Apple', 'Bosch', 'Bose', 'Breville', 'Brita', 'Conair',
    'Cuisinart', 'Daikin', 'Dell', 'Dyson', 'Google', 'HP', 'Haier', 'Honeywell',
    'Huawei', 'Instant Pot', 'JBL', 'KitchenAid', 'LG', 'Lasko', 'Lenovo',
    'Logitech', 'Microsoft', 'Nokia', 'OnePlus', 'Oppo', 'Panasonic', 'Philips',
    'Razer', 'Realme', 'Rowenta', 'Samsung', 'Siemens', 'Sonos', 'Sony', 'TCL',
    'TaoTronics', 'Vivo', 'Whirlpool', 'Xiaomi', 'Zojirushi'
  ];

  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    adminUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    cancelledOrders: 0,
    lowStockItems: 0
  });
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  
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

  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMessage, setUserMessage] = useState({ type: '', message: '' });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isAdmin: false
  });

  // Review management state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewApprovalFilter, setReviewApprovalFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0,
    flaggedReviews: 0
  });
  const [reviewMessage, setReviewMessage] = useState({ type: '', message: '' });

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [settingsMessage, setSettingsMessage] = useState({ type: '', message: '' });

  // Admin management state
  const [admins, setAdmins] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminViewModal, setShowAdminViewModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminMessage, setAdminMessage] = useState({ type: '', message: '' });
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  // Product management state
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productMessage, setProductMessage] = useState({ type: '', message: '' });
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    imageUrl: '',
    stock: '',
    rating: '',
    featured: false
  });

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
      
      // Settings are now loaded automatically by SettingsContext
      
      // Fetch data for admin
      fetchUsers();
      fetchAdmins();
      fetchProducts();
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
      console.log('Fetching users with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Users API response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      console.log(`Found ${data.length} users`);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    }
  };

  // User CRUD functions
  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear messages when user starts typing
    if (userMessage.message) {
      setUserMessage({ type: '', message: '' });
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      isAdmin: false
    });
    setEditingUser(null);
    setUserMessage({ type: '', message: '' });
  };

  const viewUser = (user) => {
    setSelectedUser(user);
    setShowUserViewModal(true);
  };

  const editUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      isAdmin: user.isAdmin
    });
    setShowUserModal(true);
    setShowUserViewModal(false);
  };

  const saveUser = async () => {
    try {
      // Validate form
      if (!userForm.name.trim() || !userForm.email.trim()) {
        setUserMessage({ type: 'error', message: 'Name and email are required' });
        return;
      }

      if (!editingUser && !userForm.password.trim()) {
        setUserMessage({ type: 'error', message: 'Password is required for new users' });
        return;
      }

      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `http://localhost:5000/api/users/${editingUser._id}`
        : 'http://localhost:5000/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const body = editingUser 
        ? {
            name: userForm.name,
            email: userForm.email,
            phone: userForm.phone,
            isAdmin: userForm.isAdmin,
            ...(userForm.password.trim() && { password: userForm.password })
          }
        : userForm;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }

      setUserMessage({ 
        type: 'success', 
        message: `User ${editingUser ? 'updated' : 'created'} successfully!` 
      });
      
      // Refresh users list
      fetchUsers();
      
      // Close modal after delay
      setTimeout(() => {
        setShowUserModal(false);
        resetUserForm();
      }, 1500);

    } catch (error) {
      setUserMessage({ type: 'error', message: error.message });
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setUserMessage({ type: 'success', message: 'User deleted successfully!' });
      
      // Refresh users list
      fetchUsers();

      // Clear message after delay
      setTimeout(() => {
        setUserMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      setUserMessage({ type: 'error', message: error.message });
    }
  };

  const searchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = userSearchQuery.trim() 
        ? `http://localhost:5000/api/users?query=${encodeURIComponent(userSearchQuery.trim())}`
        : 'http://localhost:5000/api/users';

      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users');
      }

      setUsers(data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Admin CRUD functions
  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching admins with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/admin/admin-management', {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Admins API response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admins');
      }
      
      console.log(`Found ${data.length} admins`);
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError(error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching products with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Products API response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      console.log(`Found ${data.length} products`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    }
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when admin starts typing
    if (adminMessage.message) {
      setAdminMessage({ type: '', message: '' });
    }
  };

  const resetAdminForm = () => {
    setAdminForm({
      name: '',
      email: '',
      password: '',
      role: 'admin'
    });
    setEditingAdmin(null);
    setAdminMessage({ type: '', message: '' });
  };

  const viewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowAdminViewModal(true);
  };

  const editAdmin = (admin) => {
    setEditingAdmin(admin);
    setAdminForm({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role
    });
    setShowAdminModal(true);
    setShowAdminViewModal(false);
  };

  const saveAdmin = async () => {
    try {
      // Validate form
      if (!adminForm.name.trim() || !adminForm.email.trim()) {
        setAdminMessage({ type: 'error', message: 'Name and email are required' });
        return;
      }

      if (!editingAdmin && !adminForm.password.trim()) {
        setAdminMessage({ type: 'error', message: 'Password is required for new admins' });
        return;
      }

      const token = localStorage.getItem('token');
      const url = editingAdmin 
        ? `http://localhost:5000/api/admin/admin-management/${editingAdmin._id}`
        : 'http://localhost:5000/api/admin/admin-management';
      
      const method = editingAdmin ? 'PUT' : 'POST';
      
      const body = editingAdmin 
        ? {
            name: adminForm.name,
            email: adminForm.email,
            role: adminForm.role,
            ...(adminForm.password.trim() && { password: adminForm.password })
          }
        : adminForm;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${editingAdmin ? 'update' : 'create'} admin`);
      }

      setAdminMessage({ 
        type: 'success', 
        message: `Admin ${editingAdmin ? 'updated' : 'created'} successfully!` 
      });
      
      // Refresh admins list
      fetchAdmins();
      
      // Close modal after delay
      setTimeout(() => {
        setShowAdminModal(false);
        resetAdminForm();
      }, 1500);

    } catch (error) {
      setAdminMessage({ type: 'error', message: error.message });
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/admin-management/${adminId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete admin');
      }

      setAdminMessage({ type: 'success', message: 'Admin deleted successfully!' });
      
      // Refresh admins list
      fetchAdmins();

      // Clear message after delay
      setTimeout(() => {
        setAdminMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      setAdminMessage({ type: 'error', message: error.message });
    }
  };

  const searchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = adminSearchQuery.trim() 
        ? `http://localhost:5000/api/admin/admin-management?query=${encodeURIComponent(adminSearchQuery.trim())}`
        : 'http://localhost:5000/api/admin/admin-management';

      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search admins');
      }

      setAdmins(data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Product CRUD functions
  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear messages when user starts typing
    if (productMessage.message) {
      setProductMessage({ type: '', message: '' });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      brand: '',
      imageUrl: '',
      stock: '',
      rating: '',
      featured: false
    });
    setEditingProduct(null);
    setProductMessage({ type: '', message: '' });
  };

  const viewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductViewModal(true);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand,
      imageUrl: product.imageUrl || '',
      stock: product.stock.toString(),
      rating: product.rating ? product.rating.toString() : '',
      featured: product.featured || false
    });
    setShowProductModal(true);
    setShowProductViewModal(false);
  };

  const saveProduct = async () => {
    try {
      // Validate form
      if (!productForm.name.trim() || !productForm.description.trim() || !productForm.price || !productForm.category.trim() || !productForm.brand.trim() || !productForm.stock) {
        setProductMessage({ type: 'error', message: 'Name, description, price, category, brand, and stock are required' });
        return;
      }

      if (parseFloat(productForm.price) <= 0) {
        setProductMessage({ type: 'error', message: 'Price must be greater than 0' });
        return;
      }

      if (parseInt(productForm.stock) < 0) {
        setProductMessage({ type: 'error', message: 'Stock cannot be negative' });
        return;
      }

      const token = localStorage.getItem('token');
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : 'http://localhost:5000/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const body = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        brand: productForm.brand,
        imageUrl: productForm.imageUrl || '',
        stock: parseInt(productForm.stock),
        rating: productForm.rating ? parseFloat(productForm.rating) : undefined,
        featured: productForm.featured
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      setProductMessage({ 
        type: 'success', 
        message: `Product ${editingProduct ? 'updated' : 'created'} successfully!` 
      });
      
      // Refresh products list
      fetchProducts();
      
      // Close modal after delay
      setTimeout(() => {
        setShowProductModal(false);
        resetProductForm();
      }, 1500);

    } catch (error) {
      setProductMessage({ type: 'error', message: error.message });
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      setProductMessage({ type: 'success', message: 'Product deleted successfully!' });
      
      // Refresh products list
      fetchProducts();

      // Clear message after delay
      setTimeout(() => {
        setProductMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      setProductMessage({ type: 'error', message: error.message });
    }
  };

  const searchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search products');
      }

      // Filter products based on search query
      const filteredProducts = data.filter(product => {
        const query = productSearchQuery.toLowerCase().trim();
        return !query || 
               product.name.toLowerCase().includes(query) ||
               product.category.toLowerCase().includes(query) ||
               product.brand.toLowerCase().includes(query) ||
               product.description.toLowerCase().includes(query);
      });

      setProducts(filteredProducts);
    } catch (error) {
      setError(error.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = orderQuery.trim().toLowerCase();
    const idMatch = (o._id || '').toLowerCase().includes(q);
    const nameMatch = (o.customer?.fullName || '').toLowerCase().includes(q);
    const statusMatch = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;
    return (q ? (idMatch || nameMatch) : true) && statusMatch;
  });

  const generateOrdersReport = () => {
    try {
      const doc = new jsPDF('p', 'pt');
      const margin = 40;
      let y = margin;

      doc.setFontSize(18);
      doc.text('Orders Report', margin, y);
      y += 24;

      const totalOrders = filteredOrders.length;
      const byStatus = filteredOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
      const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totals?.total || 0), 0);
      doc.setFontSize(12);
      doc.text(`Total Orders: ${totalOrders}`, margin, y); y += 16;
      doc.text(`Pending: ${byStatus.pending || 0}  Approved: ${byStatus.approved || 0}  Rejected: ${byStatus.rejected || 0}`, margin, y); y += 16;
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, margin, y); y += 24;

      const rows = filteredOrders.map(o => [
        o._id?.slice(-8),
        o.customer?.fullName || '-',
        o.customer?.email || '-',
        o.status,
        new Date(o.createdAt).toLocaleString(),
        `$${(o.totals?.total || 0).toFixed(2)}`
      ]);
      autoTable(doc, {
        startY: y,
        head: [[ 'Order #', 'Customer', 'Email', 'Status', 'Date', 'Total' ]],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [35, 47, 62] }
      });

      doc.save(`orders-report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error('Report generation failed', e);
      alert('Failed to generate report');
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
        approvedOrders: data.approvedOrders || 0,
        rejectedOrders: data.rejectedOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
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
        approvedOrders: 0,
        rejectedOrders: 0,
        cancelledOrders: 0,
        lowStockItems: 0
      });
    }
  };

  const fetchAllOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status');
      // refresh orders
      fetchAllOrders();
    } catch (err) {
      console.error('Update order status error:', err);
      alert(err.message || 'Failed to update order');
    }
  };

  const updateProcessing = async (orderId, step) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/processing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ step })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update processing');
      fetchAllOrders();
    } catch (err) {
      console.error('Update processing error:', err);
      alert(err.message || 'Failed to update processing');
    }
  };

  // Load orders when Orders module is active
  useEffect(() => {
    if (activeModule === 'orders') {
      fetchAllOrders();
    }
  }, [activeModule]);

  // Load reviews when Reviews module is active
  useEffect(() => {
    if (activeModule === 'reviews') {
      fetchAllReviews();
    }
  }, [activeModule]);

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

  const toggleSettingsModal = () => {
    setShowSettingsModal(!showSettingsModal);
    setActiveSettingsTab('general');
    if (settingsMessage.message) {
      setSettingsMessage({ type: '', message: '' });
    }
  };

  const handleSettingsInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === 'checkbox' ? checked : value;
    
    // Update global settings through context
    updateSettings({
      [name]: updatedValue
    });
  };

  const saveSettings = async () => {
    try {
      // Settings are automatically saved through the context
      // Just show success message
      setSettingsMessage({ type: 'success', message: 'Settings saved successfully and applied site-wide!' });
      
      setTimeout(() => {
        setSettingsMessage({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setSettingsMessage({ type: 'error', message: 'Failed to save settings. Please try again.' });
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings = {
        siteName: 'Vithanage Enterprises',
        siteDescription: 'Premium Electronics & Home Appliances',
        contactEmail: 'admin@vithanageenterprises.com',
        supportPhone: '+94 77 123 4567',
        businessAddress: 'Colombo, Sri Lanka',
        currency: 'LKR',
        currencySymbol: 'Rs',
        taxRate: 0.15,
        shippingRate: 500,
        freeShippingThreshold: 5000,
        lowStockThreshold: 10,
        emailNotifications: true,
        orderNotifications: true,
        stockAlerts: true,
        reviewNotifications: true,
        promotionNotifications: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        twoFactorAuth: false,
        loginAttempts: 5,
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        cacheEnabled: true,
        compressionEnabled: true,
        cdnEnabled: false
      };
      
      // Update through context
      updateSettings(defaultSettings);
      setSettingsMessage({ type: 'success', message: 'Settings reset to default values!' });
    }
  };

  // loadSavedSettings function removed as it's now handled by SettingsContext
  
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
      case 'admins':
        return renderAdmins();
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
      
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="dashboard-stat-info">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
            <div className="dashboard-stat-detail">
              <span>Regular Users: {stats.regularUsers}</span>
              <span>Admin Users: {stats.adminUsers}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon"><FontAwesomeIcon icon={faBoxOpen} /></div>
          <div className="dashboard-stat-info">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon"><FontAwesomeIcon icon={faShoppingCart} /></div>
          <div className="dashboard-stat-info">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
            <div className="dashboard-stat-detail">
              <span>Pending: {stats.pendingOrders}</span>
              <span>Approved: {stats.approvedOrders}</span>
              <span>Rejected: {stats.rejectedOrders}</span>
              <span>Cancelled: {stats.cancelledOrders}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
          <div className="dashboard-stat-info">
            <h3>Total Revenue</h3>
            <p>${(stats.totalRevenue || 0).toFixed(2)}</p>
            <div className="dashboard-stat-detail">
              <span>From approved & delivered orders</span>
            </div>
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

      <div className="admin-section">
        <h3>Business Information</h3>
        <div className="business-info-grid">
          <div className="info-card">
            <div className="info-label">Contact Email</div>
            <div className="info-value">{settings.contactEmail}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Support Phone</div>
            <div className="info-value">{settings.supportPhone}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Business Address</div>
            <div className="info-value">{settings.businessAddress}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Currency</div>
            <div className="info-value">{settings.currency}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Tax Rate</div>
            <div className="info-value">{(settings.taxRate * 100).toFixed(1)}%</div>
          </div>
          <div className="info-card">
            <div className="info-label">Free Shipping</div>
            <div className="info-value">{formatCurrency(settings.freeShippingThreshold)}+</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faUsers} /> User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {userMessage.message && (
        <div className={`message ${userMessage.type}`}>
          <FontAwesomeIcon icon={userMessage.type === 'success' ? faUsers : faSignOutAlt} />
          {userMessage.message}
        </div>
      )}
      
      <div className="admin-actions">
        <div className="action-buttons-left">
          <button className="primary-btn" onClick={() => {
            resetUserForm();
            setShowUserModal(true);
          }}>
            <FontAwesomeIcon icon={faUsers} /> Add New User
          </button>
          <button className="refresh-btn" onClick={fetchUsers}>
            <FontAwesomeIcon icon={faChartLine} /> Refresh
          </button>
        </div>
        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search users by name, email..." 
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <button className="search-btn" onClick={searchUsers}>
              <FontAwesomeIcon icon={faSearch} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-section">
        {/* User count display */}
        <div className="users-summary">
          <h3>
            <FontAwesomeIcon icon={faUsers} /> 
            Total Users: <span className="user-count">{users.length}</span>
          </h3>
        </div>
        
        <table className="user-management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user._id}>
                  <td className="user-number">{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={user.isAdmin ? 'badge admin' : 'badge user'}>{user.isAdmin ? 'Admin' : 'User'}</span></td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button className="view-btn" title="View Details" onClick={() => viewUser(user)}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button className="edit-btn" title="Edit User" onClick={() => editUser(user)}>
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                    <button className="delete-btn" title="Delete User" onClick={() => deleteUser(user._id)}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Modal for Create/Edit */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faUsers} /> 
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button className="close-btn" onClick={() => {
                setShowUserModal(false);
                resetUserForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label><FontAwesomeIcon icon={faUsers} /> Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={userForm.name} 
                  onChange={handleUserFormChange}
                  placeholder="Enter user name" 
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faUsers} /> Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={userForm.email} 
                  onChange={handleUserFormChange}
                  placeholder="Enter email address" 
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faUsers} /> Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={userForm.phone} 
                  onChange={handleUserFormChange}
                  placeholder="Enter phone number" 
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faSignOutAlt} /> Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={userForm.password} 
                    onChange={handleUserFormChange}
                    placeholder="Enter password" 
                  />
                </div>
              )}
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="isAdmin" 
                    checked={userForm.isAdmin} 
                    onChange={handleUserFormChange}
                  />
                  <span style={{ marginLeft: '8px' }}>Admin User</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowUserModal(false);
                resetUserForm();
              }}>Cancel</button>
              <button className="save-btn" onClick={saveUser}>
                <FontAwesomeIcon icon={faCog} /> {editingUser ? 'Update' : 'Create'} User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User View Modal */}
      {showUserViewModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserViewModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faUsers} /> User Details</h2>
              <button className="close-btn" onClick={() => setShowUserViewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="detail-row">
                  <strong>Name:</strong> {selectedUser.name}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div className="detail-row">
                  <strong>Phone:</strong> {selectedUser.phone || 'Not provided'}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> 
                  <span className={selectedUser.isAdmin ? 'badge admin' : 'badge user'}>
                    {selectedUser.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                </div>
                {selectedUser.address && (
                  <div className="detail-row">
                    <strong>Address:</strong> 
                    <div>
                      {selectedUser.address.street && <div>{selectedUser.address.street}</div>}
                      {selectedUser.address.city && <div>{selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.postalCode}</div>}
                      {selectedUser.address.country && <div>{selectedUser.address.country}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUserViewModal(false)}>Close</button>
              <button className="save-btn" onClick={() => {
                setShowUserViewModal(false);
                editUser(selectedUser);
              }}>
                <FontAwesomeIcon icon={faCog} /> Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdmins = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faCog} /> Admin Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {adminMessage.message && (
        <div className={`message ${adminMessage.type}`}>
          <FontAwesomeIcon icon={adminMessage.type === 'success' ? faCog : faSignOutAlt} />
          {adminMessage.message}
        </div>
      )}
      
      <div className="admin-actions">
        <div className="action-buttons-left">
          <button className="primary-btn" onClick={() => {
            resetAdminForm();
            setShowAdminModal(true);
          }}>
            <FontAwesomeIcon icon={faCog} /> Add New Admin
          </button>
          <button className="refresh-btn" onClick={fetchAdmins}>
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
        </div>
        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search admins..." 
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAdmins()}
            />
            <button className="search-btn" onClick={searchAdmins}>
              <FontAwesomeIcon icon={faSearch} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-section">
        {/* Admin count display */}
        <div className="admins-summary">
          <h3>
            <FontAwesomeIcon icon={faCog} /> 
            Total Admins: <span className="admin-count">{admins.length}</span>
          </h3>
        </div>
        
        <table className="admin-management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length > 0 ? (
              admins.map((admin, index) => (
                <tr key={admin._id}>
                  <td className="admin-number">{index + 1}</td>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td><span className={admin.role === 'super_admin' ? 'badge admin' : 'badge user'}>{admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button className="view-btn" title="View Details" onClick={() => viewAdmin(admin)}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button className="edit-btn" title="Edit Admin" onClick={() => editAdmin(admin)}>
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                    <button className="delete-btn" title="Delete Admin" onClick={() => deleteAdmin(admin._id)}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No admins found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Modal for Create/Edit */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faCog} /> 
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h2>
              <button className="close-btn" onClick={() => {
                setShowAdminModal(false);
                resetAdminForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label><FontAwesomeIcon icon={faCog} /> Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={adminForm.name} 
                  onChange={handleAdminFormChange}
                  placeholder="Enter admin name" 
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faCog} /> Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={adminForm.email} 
                  onChange={handleAdminFormChange}
                  placeholder="Enter email address" 
                />
              </div>
              {!editingAdmin && (
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faSignOutAlt} /> Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={adminForm.password} 
                    onChange={handleAdminFormChange}
                    placeholder="Enter password" 
                  />
                </div>
              )}
              <div className="form-group">
                <label><FontAwesomeIcon icon={faCog} /> Role</label>
                <select 
                  name="role" 
                  value={adminForm.role} 
                  onChange={handleAdminFormChange}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAdminModal(false);
                resetAdminForm();
              }}>Cancel</button>
              <button className="save-btn" onClick={saveAdmin}>
                <FontAwesomeIcon icon={faCog} /> {editingAdmin ? 'Update' : 'Create'} Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin View Modal */}
      {showAdminViewModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setShowAdminViewModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faCog} /> Admin Details</h2>
              <button className="close-btn" onClick={() => setShowAdminViewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="detail-row">
                  <strong>Name:</strong> {selectedAdmin.name}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedAdmin.email}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> 
                  <span className={selectedAdmin.role === 'super_admin' ? 'badge admin' : 'badge user'}>
                    {selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {new Date(selectedAdmin.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAdminViewModal(false)}>Close</button>
              <button className="save-btn" onClick={() => {
                setShowAdminViewModal(false);
                editAdmin(selectedAdmin);
              }}>
                <FontAwesomeIcon icon={faCog} /> Edit Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faBoxOpen} /> Product Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {productMessage.message && (
        <div className={`message ${productMessage.type}`}>
          <FontAwesomeIcon icon={productMessage.type === 'success' ? faBoxOpen : faSignOutAlt} />
          {productMessage.message}
        </div>
      )}
      
      <div className="admin-actions">
        <div className="action-buttons-left">
          <button className="primary-btn" onClick={() => {
            resetProductForm();
            setShowProductModal(true);
          }}>
            <FontAwesomeIcon icon={faBoxOpen} /> Add New Product
          </button>
          <button className="refresh-btn" onClick={fetchProducts}>
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
        </div>
        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
            />
            <button className="search-btn" onClick={searchProducts}>
              <FontAwesomeIcon icon={faSearch} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-section">
        {/* Product count display */}
        <div className="products-summary">
          <h3>
            <FontAwesomeIcon icon={faBoxOpen} /> 
            Total Products: <span className="product-count">{products.length}</span>
          </h3>
        </div>
        
        <table className="product-management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product, index) => (
                <tr key={product._id}>
                  <td className="product-number">{index + 1}</td>
                  <td>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                        onError={(e) => {e.target.style.display = 'none'}}
                      />
                    ) : (
                      <div style={{width: '40px', height: '40px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px'}}>
                        <FontAwesomeIcon icon={faBoxOpen} style={{color: '#ccc'}} />
                      </div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td><span className="badge category">{product.category}</span></td>
                  <td>{product.brand}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>
                    <span className={product.stock < 10 ? 'badge low-stock' : 'badge in-stock'}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                      <FontAwesomeIcon icon={faStar} style={{color: '#ffd700'}} />
                      {product.rating ? product.rating.toFixed(1) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    {product.featured ? (
                      <span className="badge featured">Featured</span>
                    ) : (
                      <span className="badge regular">Regular</span>
                    )}
                  </td>
                  <td className="action-buttons">
                    <button className="view-btn" title="View Details" onClick={() => viewProduct(product)}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button className="edit-btn" title="Edit Product" onClick={() => editProduct(product)}>
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                    <button className="delete-btn" title="Delete Product" onClick={() => deleteProduct(product._id)}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal for Create/Edit */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faBoxOpen} /> 
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button className="close-btn" onClick={() => {
                setShowProductModal(false);
                resetProductForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faBoxOpen} /> Product Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={productForm.name} 
                    onChange={handleProductFormChange}
                    placeholder="Enter product name" 
                  />
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faBoxOpen} /> Category</label>
                  <select 
                    name="category" 
                    value={productForm.category} 
                    onChange={handleProductFormChange}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faBoxOpen} /> Brand</label>
                  <select 
                    name="brand" 
                    value={productForm.brand} 
                    onChange={handleProductFormChange}
                  >
                    <option value="">Select Brand</option>
                    {BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faMoneyBillWave} /> Price ($)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={productForm.price} 
                    onChange={handleProductFormChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faInfoCircle} /> Description</label>
                <textarea 
                  name="description" 
                  value={productForm.description} 
                  onChange={handleProductFormChange}
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faInfoCircle} /> Image URL</label>
                <input 
                  type="url" 
                  name="imageUrl" 
                  value={productForm.imageUrl} 
                  onChange={handleProductFormChange}
                  placeholder="Enter image URL (optional)" 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faWarehouse} /> Stock Quantity</label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={productForm.stock} 
                    onChange={handleProductFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faStar} /> Rating (Optional)</label>
                  <input 
                    type="number" 
                    name="rating" 
                    value={productForm.rating} 
                    onChange={handleProductFormChange}
                    placeholder="0.0"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="featured" 
                    checked={productForm.featured} 
                    onChange={handleProductFormChange}
                  />
                  <span style={{ marginLeft: '8px' }}><FontAwesomeIcon icon={faStar} /> Featured Product</span>
                </label>
              </div>
              {productMessage.message && (
                <div className={`message ${productMessage.type}`}>
                  {productMessage.message}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowProductModal(false);
                resetProductForm();
              }}>Cancel</button>
              <button className="save-btn" onClick={saveProduct}>
                <FontAwesomeIcon icon={faCog} /> {editingProduct ? 'Update' : 'Create'} Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      {showProductViewModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowProductViewModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faBoxOpen} /> Product Details</h2>
              <button className="close-btn" onClick={() => setShowProductViewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="product-details">
                {selectedProduct.imageUrl && (
                  <div className="detail-row">
                    <strong>Image:</strong>
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px'}}
                    />
                  </div>
                )}
                <div className="detail-row">
                  <strong>Name:</strong> {selectedProduct.name}
                </div>
                <div className="detail-row">
                  <strong>Description:</strong> {selectedProduct.description}
                </div>
                <div className="detail-row">
                  <strong>Category:</strong> 
                  <span className="badge category">{selectedProduct.category}</span>
                </div>
                <div className="detail-row">
                  <strong>Brand:</strong> {selectedProduct.brand}
                </div>
                <div className="detail-row">
                  <strong>Price:</strong> <span style={{color: '#2e8b57', fontWeight: 'bold'}}>${selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <strong>Stock:</strong> 
                  <span className={selectedProduct.stock < 10 ? 'badge low-stock' : 'badge in-stock'}>
                    {selectedProduct.stock} units
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Rating:</strong>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <FontAwesomeIcon icon={faStar} style={{color: '#ffd700'}} />
                    {selectedProduct.rating ? selectedProduct.rating.toFixed(1) : 'Not rated yet'}
                  </div>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  {selectedProduct.featured ? (
                    <span className="badge featured">Featured Product</span>
                  ) : (
                    <span className="badge regular">Regular Product</span>
                  )}
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {new Date(selectedProduct.createdAt).toLocaleString()}
                </div>
                {selectedProduct.updatedAt && (
                  <div className="detail-row">
                    <strong>Last Updated:</strong> {new Date(selectedProduct.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowProductViewModal(false)}>Close</button>
              <button className="save-btn" onClick={() => {
                setShowProductViewModal(false);
                editProduct(selectedProduct);
              }}>
                <FontAwesomeIcon icon={faCog} /> Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => {
    return (
      <div className="module-content">
        <h2><FontAwesomeIcon icon={faShoppingCart} /> Order Management</h2>
        <div className="admin-actions">
          <div className="action-buttons-left">
            <button className="refresh-btn" onClick={fetchAllOrders}>
              <FontAwesomeIcon icon={faSync} /> Refresh
            </button>
          </div>
          <div className="search-container">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search by Order ID or Customer name" 
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchAllOrders()}
              />
              <button className="search-btn" onClick={fetchAllOrders}>
                <FontAwesomeIcon icon={faSearch} />
                <span>Search</span>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="order-status-filter"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                background: '#fff',
                color: '#333',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="primary-btn" onClick={() => generateOrdersReport()}>
              <FontAwesomeIcon icon={faFilePdf} /> Download Report
            </button>
          </div>
        </div>

        {/* Order Count Display */}
        <div className="orders-summary">
          <div className="order-count-card total">
            <div className="order-count-info">
              <h4>Total Orders</h4>
              <p className="count">{filteredOrders.length}</p>
            </div>
            <div className="order-count-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
          </div>
          
          <div className="order-count-card pending">
            <div className="order-count-info">
              <h4>Pending Orders</h4>
              <p className="count">{filteredOrders.filter(order => order.status === 'pending').length}</p>
            </div>
            <div className="order-count-icon">
              <FontAwesomeIcon icon={faClipboardList} />
            </div>
          </div>
          
          <div className="order-count-card approved">
            <div className="order-count-info">
              <h4>Approved Orders</h4>
              <p className="count">{filteredOrders.filter(order => order.status === 'approved').length}</p>
            </div>
            <div className="order-count-icon">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
          </div>
          
          <div className="order-count-card rejected">
            <div className="order-count-info">
              <h4>Rejected Orders</h4>
              <p className="count">{filteredOrders.filter(order => order.status === 'rejected').length}</p>
            </div>
            <div className="order-count-icon">
              <FontAwesomeIcon icon={faExchangeAlt} />
            </div>
          </div>
          
          <div className="order-count-card cancelled">
            <div className="order-count-info">
              <h4>Cancelled Orders</h4>
              <p className="count">{filteredOrders.filter(order => order.status === 'cancelled').length}</p>
            </div>
            <div className="order-count-icon">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
          </div>
        </div>

        <div className="admin-section">
          {ordersLoading ? (
            <div>Loading orders...</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No orders</td></tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o._id}>
                      <td>{o._id?.slice(-8)}</td>
                      <td>{o.customer?.fullName || '-'}</td>
                      <td>
                        <span className={`badge ${o.status}`}>{o.status}</span>
                      </td>
                      <td>{o.customer?.email || '-'}</td>
                      <td>{o.customer?.phone || '-'}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td>${o.totals?.total?.toFixed(2)}</td>
                      <td className="action-buttons">
                        <button
                          className="view-btn"
                          title="Details"
                          onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }}
                          style={{ marginRight: '8px', background: 'none', boxShadow: 'none' }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        {/* Show approve/reject buttons only for pending orders */}
                        {o.status === 'pending' && (
                          <>
                            <button 
                              title="Approve" 
                              onClick={() => updateOrderStatus(o._id, 'approved')}
                              style={{ 
                                background: '#2e7d32', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px'
                              }}
                            >Approve</button>
                            <button 
                              title="Reject" 
                              onClick={() => updateOrderStatus(o._id, 'rejected')}
                              style={{ 
                                background: '#c62828', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >Reject</button>
                          </>
                        )}
                        
                        {/* Show message for cancelled orders */}
                        {o.status === 'cancelled' && (
                          <span style={{ 
                            color: '#ff6b6b', 
                            fontSize: '0.9rem', 
                            fontStyle: 'italic',
                            padding: '6px 10px'
                          }}>
                            Cancelled by {o.cancelledBy || 'user'}
                            {o.cancelledAt && (
                              <>
                                <br />
                                <small>{new Date(o.cancelledAt).toLocaleString()}</small>
                              </>
                            )}
                          </span>
                        )}
                        
                        {/* Show message for already processed orders */}
                        {(o.status === 'approved' || o.status === 'rejected') && (
                          <span style={{ 
                            color: o.status === 'approved' ? '#2e7d32' : '#c62828', 
                            fontSize: '0.9rem', 
                            fontWeight: '600',
                            padding: '6px 10px'
                          }}>
                            Already {o.status}
                          </span>
                        )}
                        {o.status === 'approved' && (
                          <select
                            value={o.processing?.step || 'none'}
                            onChange={(e) => updateProcessing(o._id, e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="none">Processing...</option>
                            <option value="preparing">Preparing</option>
                            <option value="packing">Packing</option>
                            <option value="waiting_to_delivery">Waiting to delivery</option>
                            <option value="on_the_way">On the way</option>
                            <option value="finished">Finished</option>
                          </select>
                        )}
                        
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {showOrderModal && selectedOrder && (
          <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FontAwesomeIcon icon={faInfoCircle} /> Order Details</h2>
                <button className="close-btn" onClick={() => setShowOrderModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="admin-section">
                  <h3>Order Info</h3>
                  <div className="data-table" style={{ border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                    <p><strong>Status:</strong> <span className={`badge ${selectedOrder.status}`}>{selectedOrder.status}</span></p>
                    <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <p><strong>Total:</strong> ${selectedOrder.totals?.total?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Customer</h3>
                  <div className="data-table" style={{ border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
                    <p><strong>Name:</strong> {selectedOrder.customer?.fullName || '-'}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer?.email || '-'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer?.phone || '-'}</p>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Shipping Address</h3>
                  <div className="data-table" style={{ border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
                    <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                    {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}</p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Payment</h3>
                  <div className="data-table" style={{ border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
                    <p><strong>Method:</strong> {selectedOrder.payment?.method}</p>
                    <p><strong>Status:</strong> {selectedOrder.payment?.status}</p>
                    {selectedOrder.payment?.last4 && (
                      <p><strong>Card Last4:</strong> **** **** **** {selectedOrder.payment.last4}</p>
                    )}
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Items</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.name}</td>
                          <td>{it.quantity}</td>
                          <td>${it.price?.toFixed(2)}</td>
                          <td>${(it.price * it.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowOrderModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventory = () => (
    <InventoryManagement />
  );

  const renderFinancial = () => <FinancialManagement />;

  // Review management functions
  const fetchAllReviews = async () => {
    try {
      setReviewsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }
      
      console.log('Reviews API response:', data);
      
      // Handle the correct response structure from adminReviewController
      if (data.success && data.data) {
        setReviews(data.data.reviews || []);
        setReviewStats({
          totalReviews: data.data.stats?.totalReviews || 0,
          averageRating: data.data.stats?.averageRating || 0,
          pendingReviews: data.data.stats?.pendingReviews || 0,
          flaggedReviews: data.data.stats?.reportedReviews || 0
        });
      } else {
        setReviews([]);
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          pendingReviews: 0,
          flaggedReviews: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setReviewStats({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        flaggedReviews: 0
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/reviews/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setReviewStats(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const updateReviewApproval = async (reviewId, approved) => {
    try {
      setReviewMessage({ type: '', message: '' });
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reviews/${reviewId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: approved })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update review approval');
      }

      setReviewMessage({ 
        type: 'success', 
        message: `Review ${approved ? 'approved' : 'disapproved'} successfully!` 
      });
      fetchAllReviews(); // Refresh reviews
      
      // Clear message after 3 seconds
      setTimeout(() => setReviewMessage({ type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error updating review approval:', error);
      setReviewMessage({ type: 'error', message: error.message || 'Failed to update review' });
    }
  };

  const addAdminResponse = async (reviewId, response) => {
    if (!response.trim()) {
      setReviewMessage({ type: 'error', message: 'Please enter a response comment' });
      return;
    }

    try {
      setReviewMessage({ type: '', message: '' });
      const token = localStorage.getItem('token');
      const responseData = await fetch(`http://localhost:5000/api/admin/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: response })
      });

      const data = await responseData.json();
      if (!responseData.ok) {
        throw new Error(data.message || 'Failed to add admin response');
      }

      setReviewMessage({ type: 'success', message: 'Admin response added successfully!' });
      setAdminResponse('');
      setShowReviewModal(false);
      fetchAllReviews(); // Refresh reviews
      
      // Clear message after 3 seconds
      setTimeout(() => setReviewMessage({ type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error adding admin response:', error);
      setReviewMessage({ type: 'error', message: error.message || 'Failed to add response' });
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setReviewMessage({ type: '', message: '' });
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review');
      }

      setReviewMessage({ type: 'success', message: 'Review deleted successfully!' });
      setShowReviewModal(false);
      fetchAllReviews(); // Refresh reviews
      
      // Clear message after 3 seconds
      setTimeout(() => setReviewMessage({ type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error deleting review:', error);
      setReviewMessage({ type: 'error', message: error.message || 'Failed to delete review' });
    }
  };

  // Filter reviews based on search and filters
  const filteredReviews = (reviews || []).filter(review => {
    const matchesSearch = !reviewSearchQuery || 
      review.product?.name?.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      review.user?.name?.toLowerCase().includes(reviewSearchQuery.toLowerCase());
    
    const matchesRating = reviewRatingFilter === 'all' || 
      review.rating.toString() === reviewRatingFilter;
    
    const matchesApproval = reviewApprovalFilter === 'all' ||
      (reviewApprovalFilter === 'approved' && review.isApproved) ||
      (reviewApprovalFilter === 'pending' && !review.isApproved);

    return matchesSearch && matchesRating && matchesApproval;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffd700' : '#ddd' }}>★</span>
    ));
  };

  const renderReviews = () => (
    <div className="module-content">
      <h2><FontAwesomeIcon icon={faStar} /> Review Management</h2>
      
      {/* Review Management Message */}
      {reviewMessage.message && (
        <div className={`message ${reviewMessage.type}`} style={{ marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={reviewMessage.type === 'success' ? faCog : faSignOutAlt} />
          {reviewMessage.message}
        </div>
      )}
      
      {/* Review Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faStar} /></div>
          <div className="stat-info">
            <h3>Total Reviews</h3>
            <p>{reviewStats.totalReviews}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faStar} /></div>
          <div className="stat-info">
            <h3>Average Rating</h3>
            <p>{(reviewStats.averageRating || 0).toFixed(1)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faCog} /></div>
          <div className="stat-info">
            <h3>Pending Approval</h3>
            <p>{reviewStats.pendingReviews}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faExchangeAlt} /></div>
          <div className="stat-info">
            <h3>Flagged Reviews</h3>
            <p>{reviewStats.flaggedReviews}</p>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <div className="action-buttons-left">
          <button className="refresh-btn" onClick={fetchAllReviews}>
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
        </div>
        <div className="filter-group">
          <select 
            value={reviewRatingFilter} 
            onChange={(e) => setReviewRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select 
            value={reviewApprovalFilter} 
            onChange={(e) => setReviewApprovalFilter(e.target.value)}
          >
            <option value="all">All Reviews</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search product or customer..." 
              value={reviewSearchQuery}
              onChange={(e) => setReviewSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchAllReviews()}
            />
            <button className="search-btn" onClick={fetchAllReviews}>
              <FontAwesomeIcon icon={faSearch} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-section">
        {reviewsLoading ? (
          <div>Loading reviews...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No reviews found</td>
                </tr>
              ) : (
                filteredReviews.map(review => (
                  <tr key={review._id}>
                    <td>{review.product?.name || 'Unknown Product'}</td>
                    <td>{review.user?.name || 'Anonymous'}</td>
                    <td>
                      <div className="star-rating">
                        <div className="stars">
                          {renderStars(review.rating)}
                        </div>
                        <span className="rating-text">{review.rating}/5</span>
                      </div>
                    </td>
                    <td className="review-text" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.comment.length > 100 ? `${review.comment.substring(0, 100)}...` : review.comment}
                    </td>
                    <td>
                      <span className={`badge ${review.isApproved ? 'approved' : 'pending'}`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button 
                        className="view-btn" 
                        title="View Full Review" 
                        onClick={() => {
                          setSelectedReview(review);
                          setShowReviewModal(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      {review.isApproved ? (
                        <button 
                          className="reject-btn" 
                          title="Unapprove Review"
                          onClick={() => updateReviewApproval(review._id, false)}
                          style={{ background: '#f39c12', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}
                        >
                          Unapprove
                        </button>
                      ) : (
                        <button 
                          className="approve-btn" 
                          title="Approve Review"
                          onClick={() => updateReviewApproval(review._id, true)}
                          style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        className="delete-btn" 
                        title="Delete Review" 
                        onClick={() => deleteReview(review._id)}
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Details Modal */}
      {showReviewModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faStar} /> Review Details</h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="review-details">
                <div className="detail-row">
                  <strong>Product:</strong> {selectedReview.product?.name || 'Unknown Product'}
                </div>
                <div className="detail-row">
                  <strong>Customer:</strong> {selectedReview.user?.name || 'Anonymous'} ({selectedReview.user?.email || 'No email'})
                </div>
                <div className="detail-row">
                  <strong>Rating:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                    {renderStars(selectedReview.rating)}
                    <span>{selectedReview.rating}/5</span>
                  </div>
                </div>
                <div className="detail-row">
                  <strong>Review:</strong>
                  <p style={{ marginTop: '5px', lineHeight: '1.5' }}>{selectedReview.comment}</p>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span className={`badge ${selectedReview.approved ? 'approved' : 'pending'}`}>
                    {selectedReview.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Submitted:</strong> {new Date(selectedReview.createdAt).toLocaleString()}
                </div>
                {selectedReview.likes && selectedReview.likes.length > 0 && (
                  <div className="detail-row">
                    <strong>Likes:</strong> {selectedReview.likes.length}
                  </div>
                )}
                {selectedReview.adminResponse && (
                  <div className="detail-row">
                    <strong>Admin Response:</strong>
                    <p style={{ marginTop: '5px', lineHeight: '1.5', fontStyle: 'italic' }}>
                      {selectedReview.adminResponse.comment || selectedReview.adminResponse}
                    </p>
                    {selectedReview.adminResponse.respondedAt && (
                      <small style={{ color: '#666', fontSize: '0.8em' }}>
                        Responded on: {new Date(selectedReview.adminResponse.respondedAt).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Response Section */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h3>Admin Response</h3>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder={(selectedReview.adminResponse?.comment || selectedReview.adminResponse) ? "Update admin response..." : "Add admin response..."}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowReviewModal(false)}>Close</button>
              <button 
                className="save-btn" 
                onClick={() => addAdminResponse(selectedReview._id, adminResponse)}
                disabled={!adminResponse.trim()}
              >
                <FontAwesomeIcon icon={faCog} /> 
                {(selectedReview.adminResponse?.comment || selectedReview.adminResponse) ? 'Update Response' : 'Add Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRefunds = () => (
    <RefundManagement />
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>{settings.siteName}</h2>
          <p>Admin Panel</p>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            <span>{adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}</span>
          </div>
          <div className="user-info">
            <h3>{adminUser.name || 'Admin User'}</h3>
            <p>{adminUser.email || settings.contactEmail}</p>
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
            <li className={activeModule === 'admins' ? 'active' : ''} onClick={() => setActiveModule('admins')}>
              <FontAwesomeIcon icon={faCog} /> Admin Management
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
          <button className="settings-btn" onClick={toggleSettingsModal}>
            <FontAwesomeIcon icon={faCog} /> Settings
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </div>
      </div>
      
      <div className="admin-main">
        <div className="admin-header">
          <div className="header-info">
            <h1 className="site-name">{settings.siteName} - Admin Panel</h1>
            <p className="site-description">{settings.siteDescription}</p>
          </div>          
          <div className="header-actions">
            <div className="header-contact">
              <span className="contact-info">
                <FontAwesomeIcon icon={faBell} /> {settings.contactEmail}
              </span>
            </div>
            <div className="header-user">
              <button className="user-btn" onClick={toggleProfileModal}>
                <FontAwesomeIcon icon={faCog} />
                <span>{adminUser.name ? adminUser.name : 'Admin'}</span>
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

      {/* Comprehensive Admin Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faCog} /> System Settings</h2>
              <button className="close-btn" onClick={() => setShowSettingsModal(false)}>&times;</button>
            </div>
            
            <div className="settings-tabs">
              <button 
                className={`tab-btn ${activeSettingsTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('general')}
              >
                <FontAwesomeIcon icon={faHome} /> General
              </button>
              <button 
                className={`tab-btn ${activeSettingsTab === 'ecommerce' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('ecommerce')}
              >
                <FontAwesomeIcon icon={faShoppingCart} /> E-commerce
              </button>
              <button 
                className={`tab-btn ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('notifications')}
              >
                <FontAwesomeIcon icon={faBell} /> Notifications
              </button>
              <button 
                className={`tab-btn ${activeSettingsTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('security')}
              >
                <FontAwesomeIcon icon={faSignOutAlt} /> Security
              </button>
              <button 
                className={`tab-btn ${activeSettingsTab === 'backup' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('backup')}
              >
                <FontAwesomeIcon icon={faClipboardList} /> Backup
              </button>
            </div>

            <div className="settings-content">
              {settingsMessage.message && (
                <div className={`message ${settingsMessage.type}`}>
                  <FontAwesomeIcon icon={settingsMessage.type === 'success' ? faUsers : faSignOutAlt} />
                  {settingsMessage.message}
                </div>
              )}

              {/* General Settings Tab */}
              {activeSettingsTab === 'general' && (
                <div className="settings-section">
                  <h3><FontAwesomeIcon icon={faHome} /> General Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Site Name</label>
                      <input
                        type="text"
                        name="siteName"
                        value={settings.siteName}
                        onChange={handleSettingsInputChange}
                        placeholder="Enter site name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Site Description</label>
                      <input
                        type="text"
                        name="siteDescription"
                        value={settings.siteDescription}
                        onChange={handleSettingsInputChange}
                        placeholder="Enter site description"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Email</label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={settings.contactEmail}
                        onChange={handleSettingsInputChange}
                        placeholder="Enter contact email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Support Phone</label>
                      <input
                        type="text"
                        name="supportPhone"
                        value={settings.supportPhone}
                        onChange={handleSettingsInputChange}
                        placeholder="Enter support phone"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Business Address</label>
                      <textarea
                        name="businessAddress"
                        value={settings.businessAddress}
                        onChange={handleSettingsInputChange}
                        placeholder="Enter business address"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* E-commerce Settings Tab */}
              {activeSettingsTab === 'ecommerce' && (
                <div className="settings-section">
                  <h3><FontAwesomeIcon icon={faShoppingCart} /> E-commerce Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        name="currency"
                        value={settings.currency}
                        onChange={handleSettingsInputChange}
                      >
                        <option value="LKR">LKR - Sri Lankan Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tax Rate (%)</label>
                      <input
                        type="number"
                        name="taxRate"
                        value={settings.taxRate * 100}
                        onChange={(e) => handleSettingsInputChange({target: {name: 'taxRate', value: e.target.value / 100}})}
                        placeholder="15"
                        step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Shipping Rate</label>
                      <input
                        type="number"
                        name="shippingRate"
                        value={settings.shippingRate}
                        onChange={handleSettingsInputChange}
                        placeholder="500"
                      />
                    </div>
                    <div className="form-group">
                      <label>Free Shipping Threshold</label>
                      <input
                        type="number"
                        name="freeShippingThreshold"
                        value={settings.freeShippingThreshold}
                        onChange={handleSettingsInputChange}
                        placeholder="5000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Low Stock Threshold</label>
                      <input
                        type="number"
                        name="lowStockThreshold"
                        value={settings.lowStockThreshold}
                        onChange={handleSettingsInputChange}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings Tab */}
              {activeSettingsTab === 'notifications' && (
                <div className="settings-section">
                  <h3><FontAwesomeIcon icon={faBell} /> Notification Settings</h3>
                  <div className="form-grid checkbox-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={settings.emailNotifications}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Email Notifications</span>
                      </label>
                      <small>Receive general email notifications</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="orderNotifications"
                          checked={settings.orderNotifications}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Order Notifications</span>
                      </label>
                      <small>Notifications for new orders and order updates</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="stockAlerts"
                          checked={settings.stockAlerts}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Stock Alerts</span>
                      </label>
                      <small>Alerts when products are running low on stock</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="reviewNotifications"
                          checked={settings.reviewNotifications}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Review Notifications</span>
                      </label>
                      <small>Notifications for new customer reviews</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="promotionNotifications"
                          checked={settings.promotionNotifications}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Promotion Notifications</span>
                      </label>
                      <small>Notifications about running promotions</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings Tab */}
              {activeSettingsTab === 'security' && (
                <div className="settings-section">
                  <h3><FontAwesomeIcon icon={faSignOutAlt} /> Security Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Session Timeout (minutes)</label>
                      <input
                        type="number"
                        name="sessionTimeout"
                        value={settings.sessionTimeout}
                        onChange={handleSettingsInputChange}
                        placeholder="30"
                        min="5"
                        max="480"
                      />
                    </div>
                    <div className="form-group">
                      <label>Password Expiry (days)</label>
                      <input
                        type="number"
                        name="passwordExpiry"
                        value={settings.passwordExpiry}
                        onChange={handleSettingsInputChange}
                        placeholder="90"
                        min="30"
                        max="365"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Login Attempts</label>
                      <input
                        type="number"
                        name="loginAttempts"
                        value={settings.loginAttempts}
                        onChange={handleSettingsInputChange}
                        placeholder="5"
                        min="3"
                        max="10"
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="twoFactorAuth"
                          checked={settings.twoFactorAuth}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Enable Two-Factor Authentication</span>
                      </label>
                      <small>Add an extra layer of security to admin accounts</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup Settings Tab */}
              {activeSettingsTab === 'backup' && (
                <div className="settings-section">
                  <h3><FontAwesomeIcon icon={faClipboardList} /> Backup & Performance</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="autoBackup"
                          checked={settings.autoBackup}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Enable Automatic Backups</span>
                      </label>
                      <small>Automatically backup system data</small>
                    </div>
                    <div className="form-group">
                      <label>Backup Frequency</label>
                      <select
                        name="backupFrequency"
                        value={settings.backupFrequency}
                        onChange={handleSettingsInputChange}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Backup Retention (days)</label>
                      <input
                        type="number"
                        name="backupRetention"
                        value={settings.backupRetention}
                        onChange={handleSettingsInputChange}
                        placeholder="30"
                        min="1"
                        max="365"
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="cacheEnabled"
                          checked={settings.cacheEnabled}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Enable Caching</span>
                      </label>
                      <small>Improve site performance with caching</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="compressionEnabled"
                          checked={settings.compressionEnabled}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Enable Compression</span>
                      </label>
                      <small>Compress data to reduce bandwidth usage</small>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="cdnEnabled"
                          checked={settings.cdnEnabled}
                          onChange={handleSettingsInputChange}
                        />
                        <span>Enable CDN</span>
                      </label>
                      <small>Use Content Delivery Network for faster loading</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer settings-footer">
              <div className="footer-left">
                <button className="reset-btn" onClick={resetSettings}>
                  <FontAwesomeIcon icon={faSync} /> Reset to Default
                </button>
              </div>
              <div className="footer-right">
                <button className="cancel-btn" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={saveSettings}>
                  <FontAwesomeIcon icon={faCog} /> Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
