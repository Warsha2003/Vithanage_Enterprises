import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;

  // Check if we're coming from cart navigation
  useEffect(() => {
    const redirectSource = sessionStorage.getItem('loginRedirect');
    if (redirectSource === '/cart') {
      // We're coming from cart, show a message
      console.log("Login required to view cart");
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAdminLogin = () => {
    // Reset form data and errors when switching between admin and user login
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setIsAdminLogin(!isAdminLogin);
    setIsLogin(true); // Always default to login mode when switching
  };
  
  // Function to transfer guest cart to user cart
  const transferGuestCartToUser = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('No token available for transferring cart');
        return;
      }
      
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[]}');
      
      if (guestCart.items && guestCart.items.length > 0) {
        // Call API to transfer cart items to the user's cart
        const response = await fetch('http://localhost:5000/api/cart/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: guestCart.items })
        });
        
        if (response.ok) {
          // Clear guest cart after successful transfer
          localStorage.removeItem('guestCart');
          console.log('Guest cart transferred successfully');
        } else {
          console.error('Failed to transfer guest cart:', response.statusText);
        }
      }
    } catch (error) {
      console.error('Error transferring guest cart:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log("Login attempt with:", { email, password, isAdminLogin });

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Determine the appropriate endpoint based on the form state
      let endpoint;
      if (isLogin) {
        endpoint = isAdminLogin ? '/api/admin-auth/login' : '/api/auth/login';
      } else {
        if (isAdminLogin) {
          setError('Admin registration is not allowed');
          return;
        }
        endpoint = '/api/auth/register';
      }
      
      // Remove confirmPassword from data sent to backend
      const dataToSend = isLogin 
        ? { email, password } 
        : { name, email, password };
      
      console.log("Sending request to:", `http://localhost:5000${endpoint}`);
      console.log("Request data:", dataToSend);
      
      // IMPORTANT: If you need to preserve cart, read here before clearing auth
      
      // Clear previous auth data before attempting login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response received:", data);

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Ensure token exists
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      console.log("Got token from server, length:", data.token.length);
      
      // Store token and user data in both storage types for reliability
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('token');
        console.log("Token stored successfully:", !!storedToken, "length:", storedToken ? storedToken.length : 0);
        
        console.log("Auth data stored successfully:", data.user);
        
        // If we had existing cart data, we need to fetch from API but then merge with existing cart
        // We'll do this by dispatching the auth-change event, which will trigger fetchCart in Navbar
        // No need to manually merge - the backend handles persistent cart data for the user
        
        // Dispatch a custom event to notify other components about the login
        window.dispatchEvent(new Event('auth-change'));
        
        // Transfer guest cart to user cart if needed
        const guestCart = localStorage.getItem('guestCart');
        if (guestCart) {
          const parsedCart = JSON.parse(guestCart);
          if (parsedCart.items && parsedCart.items.length > 0) {
            console.log("Transferring guest cart to user cart:", parsedCart.items.length, "items");
            await transferGuestCartToUser();
          }
        }
        
      } catch (storageError) {
        console.error("Error storing auth data:", storageError);
        alert("Error storing login information. Please try again.");
        return;
      }
      
      // Determine redirect destination - if coming from cart page, go back to cart
      const redirectDestination = sessionStorage.getItem('loginRedirect') || '/';
      sessionStorage.removeItem('loginRedirect');
      
      // Check if user is admin and redirect accordingly
      if (data.user && data.user.isAdmin) {
        console.log("Admin user detected, redirecting to admin dashboard");
        navigate('/admin');
      } else {
        // Redirect regular users to the appropriate page
        console.log("Regular user detected, redirecting to:", redirectDestination);
        navigate(redirectDestination);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="modern-login-container">
      {/* Left column - Content/Info section */}
      <div className="login-info-column">
        <div className="login-info-content">
          <h1>Welcome to Vithanage Enterprises</h1>
          <p className="tagline">Your Premium Electrical Appliances Destination</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Wide range of premium electrical products</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Exceptional customer service</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Fast delivery across Sri Lanka</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Warranty on all products</div>
            </div>
          </div>
          
          <div className="info-footer">
            <p>Experience quality you can trust since 2020</p>
          </div>
        </div>
      </div>
      
      {/* Right column - Login Form */}
      <div className="login-form-column">
        <div className="login-form-container">
          <h2>{isAdminLogin ? 'Admin Login' : (isLogin ? 'User Login' : 'User Registration')}</h2>
          
          {sessionStorage.getItem('loginRedirect') === '/cart' && (
            <div className="login-message">
              <p>Please log in to view your cart</p>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && !isAdminLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  required={!isLogin && !isAdminLogin}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                placeholder={isAdminLogin ? "Admin Email" : "Your Email"}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                required
                placeholder={isAdminLogin ? "Admin Password" : "Your Password"}
              />
            </div>
            
            {!isLogin && !isAdminLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  required={!isLogin && !isAdminLogin}
                  placeholder="Confirm Your Password"
                />
              </div>
            )}
            
            <button type="submit" className="login-button">
              {isAdminLogin ? 'Login as Admin' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>
          
          {!isAdminLogin && (
            <div className="toggle-form">
              <p>
                {isLogin 
                  ? "Don't have an account?" 
                  : "Already have an account?"}
                <span onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? ' Sign up now' : ' Login'}
                </span>
              </p>
            </div>
          )}
          
          <div className="admin-login-section">
            <button onClick={toggleAdminLogin} className="admin-login-button">
              {isAdminLogin ? 'Back to User Login' : 'Admin Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;