import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './Components/Navbar/Navbar';
import Home from './Components/Home/Home';
import Login from './Components/User/Login';
import Footer from './Components/Footer/Footer';
import AdminDashboard from './Components/Admin/AdminDashboard';
import Products from './Components/Products/Products';

// Direct approach to protected routes without state management
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
    <div className="App">
      {!isAdminPage && <Navbar />}
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
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } 
        />
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default App;