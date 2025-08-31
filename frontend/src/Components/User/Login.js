import React, { useState } from 'react';
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

  const { name, email, password, confirmPassword } = formData;

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
      
      // Store token and user data in both storage types for reliability
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      console.log("Auth data stored successfully:", data.user);
      
      // Check if user is admin and redirect accordingly with forced page reload
      if (data.user && data.user.isAdmin) {
        console.log("Admin user detected, redirecting to admin dashboard");
        setTimeout(() => {
          window.location.href = '/admin';
        }, 500);
      } else {
        // Redirect regular users to products page directly with forced page reload
        console.log("Regular user detected, redirecting to products page");
        setTimeout(() => {
          window.location.href = '/products';
        }, 500);
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