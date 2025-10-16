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
import { CurrencyProvider } from './contexts/CurrencyContext';
import CartDrawer from './Components/Cart/CartDrawer';
import PlaceOrder from './Components/Cart/PlaceOrder';
import MyOrders from './Components/Cart/MyOrders';
import MyReviewsPage from './Components/User/MyReviewsPage';
import InvoicePage from'./Components/Invoice/InvoicePage';
import BestSellers from './Components/Products/BestSellers';
import TodaysDeals from './Components/Products/TodaysDeals';
import NewArrivals from './Components/Products/NewArrivals';
import AboutUs from './Components/About/AboutUs';
import HowToBuy from './Components/HowToBuy/HowToBuy';
import TermsConditions from './Components/Terms/TermsConditions';
import RefundPolicy from './Components/Refund/RefundPolicy';
import HelpCenter from './Components/HelpCenter/HelpCenter';
import PrivacyPolicy from './Components/User/PrivacyPolicy';
import LegalInformation from './Components/User/LegalInformation';
import MyProfile from './Components/User/MyProfile';

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
      <CurrencyProvider>
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
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/todays-deals" element={<TodaysDeals />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              {/* Make cart accessible without login, checking will happen inside */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/place-order" element={<PlaceOrder />} />
              <Route path="/invoice/" element={<InvoicePage />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-reviews" element={<MyReviewsPage />} />
              <Route path="/my-profile" element={<MyProfile />} />
              {/* New footer pages - accessible to all users */}
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/how-to-buy" element={<HowToBuy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/legal-information" element={<LegalInformation />} />
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          {!isAdminPage && <Footer />}
          <CartDrawer />
          </div>
        </CartProvider>
      </CurrencyProvider>
    </SettingsProvider>
  );
}

export default App;