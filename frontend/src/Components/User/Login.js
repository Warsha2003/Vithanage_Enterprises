import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log("Login attempt with:", { email, password });

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      // Remove confirmPassword from data sent to backend
      const dataToSend = isLogin 
        ? { email, password } 
        : { name, email, password };
      
      console.log("Sending request to:", `http://localhost:5000${endpoint}`);
      console.log("Request data:", dataToSend);
      
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

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log("User logged in successfully:", data.user);
      
      // Check if user is admin and redirect accordingly
      if (data.user && data.user.isAdmin) {
        console.log("Admin user detected, redirecting to admin dashboard");
        window.location.href = '/admin';
      } else {
        console.log("Regular user detected, redirecting to home page");
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                required={!isLogin}
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
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}
          
          <button type="submit" className="login-button">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="toggle-form">
          <p>
            {isLogin 
              ? "Don't have an account?" 
              : "Already have an account?"}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? ' Register' : ' Login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;