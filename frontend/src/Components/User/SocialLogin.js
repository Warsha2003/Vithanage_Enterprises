import React, { useState, useEffect, useRef } from 'react';
import './SocialLogin.css';

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const SocialLogin = ({ onSuccess, onError }) => {
  const [googleReady, setGoogleReady] = useState(false);
  const [socialStatus, setSocialStatus] = useState({ google: false, facebook: false });
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    checkSocialStatus();
  }, []);

  useEffect(() => {
    if (socialStatus.google) {
      loadGoogleScript();
    }
  }, [socialStatus.google]);

  const checkSocialStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/social/status');
      if (response.ok) {
        const data = await response.json();
        console.log('Social status:', data);
        setSocialStatus(data);
      }
    } catch (error) {
      console.log('Social login status check failed:', error);
    }
  };

  const loadGoogleScript = () => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google script loaded');
      initializeGoogle();
    };
    script.onerror = () => {
      console.error('Failed to load Google script');
    };
    document.body.appendChild(script);
  };

  const initializeGoogle = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    console.log('Initializing Google with client ID:', clientId ? 'Present' : 'Missing');
    
    if (window.google && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        setGoogleReady(true);
        console.log('Google initialized successfully');
        
        // Render the Google button in hidden div (needed for popup to work)
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: '100%'
          });
        }
      } catch (error) {
        console.error('Google init error:', error);
      }
    } else {
      console.error('Google not available or missing client ID');
    }
  };

  const handleGoogleResponse = async (response) => {
    console.log('Google response received');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/social/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        if (onError) {
          onError(data.message || 'Google login failed');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (onError) {
        onError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    console.log('Google button clicked, ready:', googleReady);
    if (window.google && googleReady) {
      // Try prompt first (One Tap)
      window.google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap doesn't work, click the hidden Google button
          const googleBtn = googleButtonRef.current?.querySelector('[role="button"]');
          if (googleBtn) {
            googleBtn.click();
          }
        }
      });
    } else {
      console.log('Google not ready');
      if (onError) {
        onError('Google Sign-In is loading. Please try again.');
      }
    }
  };

  if (!socialStatus.google && !socialStatus.facebook) {
    return null;
  }

  return (
    <div className="social-login-container">
      <div className="social-divider">
        <span>Or continue with</span>
      </div>

      {/* Hidden Google button for fallback */}
      <div ref={googleButtonRef} style={{ display: 'none' }}></div>

      <div className="social-buttons">
        {socialStatus.google && (
          <button 
            type="button"
            className="social-btn google-btn"
            onClick={handleGoogleClick}
            disabled={!googleReady || loading}
          >
            <GoogleIcon />
            <span>{loading ? 'Signing in...' : 'Google'}</span>
          </button>
        )}

        {socialStatus.facebook && (
          <button 
            type="button"
            className="social-btn facebook-btn"
            onClick={() => {/* Facebook login */}}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialLogin;
