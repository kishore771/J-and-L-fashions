import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import { Navigate, useNavigate } from 'react-router';
import './Profile.css';

const Profile = () => {
  const { user, isAuthenticated, authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutError('Unable to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  // Wait for Django to check the existing session.
  if (authLoading) {
    return (
      <div className="profile-container">
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Redirect only after the session check finishes.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="profile-container">
      <p>Profile</p>

      <h1>
        Welcome back, {user.first_name || user.username}!
      </h1>

      <div className="profile-details">
        <h2>Personal Information</h2>

        <p>
          <strong>Username:</strong> {user.username}
        </p>

        <p>
          <strong>First Name:</strong>{' '}
          {user.first_name || 'Not provided'}
        </p>

        <p>
          <strong>Last Name:</strong>{' '}
          {user.last_name || 'Not provided'}
        </p>

        <p>
          <strong>Email:</strong>{' '}
          {user.email || 'Not provided'}
        </p>
      </div>

      <OrderHistory />

      {logoutError && (
        <p role="alert">{logoutError}</p>
      )}

      <button
        className="profile-logout"
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  );
};

export default Profile;