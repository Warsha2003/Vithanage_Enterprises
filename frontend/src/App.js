import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './Components/Navbar/Navbar';
import Home from './Components/Home/Home';
import Login from './Components/User/Login';
import Footer from './Components/Footer/Footer';
import AdminDashboard from './Components/Admin/AdminDashboard';
import Products from './Components/Products/Products';
import ProductDetail from './Components/Products/ProductDetail';
import Cart from './Components/Cart/Cart';
import { CartProvider } from './Components/Cart/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import CartDrawer from './Components/Cart/CartDrawer';
import PlaceOrder from './Components/Cart/PlaceOrder';
import MyOrders from './Components/Cart/MyOrders';
import MyReviewsPage from './Components/User/MyReviewsPage';


// Direct approach to protected routes without state management
// eslint-disable-next-line no-unused-vars
const ProtectedRoute = ({ children }) => {
  // Check token presence synchronously
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // If no token, redirect to login immediately
  if (!token || !userStr) {
    console.log("ProtectedRoute: Authentication failed - redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Try to parse user data
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.id) {
      console.log("ProtectedRoute: Invalid user data");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
    
    console.log("ProtectedRoute: User authenticated:", user.name);
    return children;
  } catch (error) {
    console.error("ProtectedRoute: Failed to parse user data", error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

// Admin route protection
const AdminRoute = ({ children }) => {
  // Check token and admin status synchronously
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!token || !userStr) {
    console.log("AdminRoute: Authentication failed - redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.isAdmin) {
      console.log("AdminRoute: User is not admin - access denied");
      return <Navigate to="/" replace />;
    }
    
    console.log("AdminRoute: Admin authenticated:", user.name);
    return children;
  } catch (error) {
    console.error("AdminRoute: Failed to parse user data", error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <SettingsProvider>
      <CartProvider>
        <div className="App" style={{ backgroundColor: '#f7f7f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {!isAdminPage && <Navbar />}
          <main style={{ flex: 1, backgroundColor: '#f7f7f7', padding: '20px 0' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              {/* Make products page accessible without login */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              {/* Make cart accessible without login, checking will happen inside */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/place-order" element={<PlaceOrder />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-reviews" element={<MyReviewsPage />} />
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          {!isAdminPage && <Footer />}
          <CartDrawer />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}

export default App;