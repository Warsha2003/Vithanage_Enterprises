import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faEdit, faSave, faTimes, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './MyProfile.css';

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sri Lanka'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your profile');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const userData = await response.json();
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || 'Sri Lanka'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setUser(data.user);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      setSuccess('Password changed successfully!');
      
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
    setError('');
    setSuccess('');
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      country: user?.country || 'Sri Lanka'
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="my-profile-container">
      <div className="profile-header">
        <div className="profile-hero">
          <div className="profile-avatar">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="profile-info">
            <h1>My Profile</h1>
            <p>Manage your account information and preferences</p>
          </div>
        </div>
      </div>

      <div className="profile-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-sections">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing && !isChangingPassword && (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">
                      <FontAwesomeIcon icon={faUser} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">
                      <FontAwesomeIcon icon={faPhone} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    >
                      <option value="Sri Lanka">Sri Lanka</option>
                      <option value="India">India</option>
                      <option value="Maldives">Maldives</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    <FontAwesomeIcon icon={faSave} />
                    Save Changes
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <FontAwesomeIcon icon={faUser} />
                      Full Name
                    </div>
                    <div className="info-value">{user?.name || 'Not provided'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email Address
                    </div>
                    <div className="info-value">{user?.email}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FontAwesomeIcon icon={faPhone} />
                      Phone Number
                    </div>
                    <div className="info-value">{user?.phone || 'Not provided'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      City
                    </div>
                    <div className="info-value">{user?.city || 'Not provided'}</div>
                  </div>
                  <div className="info-item full-width">
                    <div className="info-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Address
                    </div>
                    <div className="info-value">{user?.address || 'Not provided'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Postal Code</div>
                    <div className="info-value">{user?.postalCode || 'Not provided'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Country</div>
                    <div className="info-value">{user?.country || 'Sri Lanka'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Security</h2>
              {!isEditing && !isChangingPassword && (
                <button 
                  className="edit-btn"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <FontAwesomeIcon icon={faLock} />
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <FontAwesomeIcon icon={faLock} />
                    Current Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    <FontAwesomeIcon icon={faLock} />
                    New Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FontAwesomeIcon icon={faLock} />
                    Confirm New Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    <FontAwesomeIcon icon={faSave} />
                    Change Password
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="security-info">
                <div className="info-item">
                  <div className="info-label">
                    <FontAwesomeIcon icon={faLock} />
                    Password
                  </div>
                  <div className="info-value">••••••••••</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Account Created</div>
                  <div className="info-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Last Updated</div>
                  <div className="info-value">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;