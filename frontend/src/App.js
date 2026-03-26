import React, { useState, useEffect } from 'react';
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
import { WishlistProvider } from './Components/Cart/WishlistContext';
import Wishlist from './Components/Cart/Wishlist';
import { CompareProvider } from './Components/Products/CompareContext';
import Compare from './Components/Products/Compare';
import { RecentlyViewedProvider } from './Components/Products/RecentlyViewedContext';
import { StockAlertProvider } from './Components/Products/StockAlertContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
import ChatWidget from './Components/Chat/ChatWidget';
import Checkout from './Components/Cart/Checkout';
import OrderConfirmation from './Components/Cart/OrderConfirmation';
import AdvancedAnalytics from './Components/Admin/AdvancedAnalytics';
import LoyaltyPoints from './Components/User/LoyaltyPoints';
import MyWarranties from './Components/User/MyWarranties';
import { LoyaltyProvider } from './contexts/LoyaltyContext';

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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage or sessionStorage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [location]);

  return (
    <LanguageProvider>
    <SettingsProvider>
      <CurrencyProvider>
        <CartProvider>
          <LoyaltyProvider>
          <WishlistProvider>
          <CompareProvider>
          <RecentlyViewedProvider>
          <StockAlertProvider>
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
              <Route 
                path="/admin/analytics"
                element={
                  <AdminRoute>
                    <AdvancedAnalytics />
                  </AdminRoute>
                }
              />
              {/* Make products page accessible without login */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/todays-deals" element={<TodaysDeals />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              {/* Make cart accessible without login, checking will happen inside */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/place-order" element={<PlaceOrder />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/invoice/" element={<InvoicePage />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-reviews" element={<MyReviewsPage />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/my-points" element={<LoyaltyPoints />} />
              <Route path="/my-warranties" element={<MyWarranties />} />
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
          {!isAdminPage && <ChatWidget user={currentUser} />}
          <CartDrawer />
          </div>
          </StockAlertProvider>
          </RecentlyViewedProvider>
          </CompareProvider>
          </WishlistProvider>
          </LoyaltyProvider>
        </CartProvider>
      </CurrencyProvider>
    </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;