
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import { Navigate, useNavigate } from 'react-router';

import {
  UserRound,
  Mail,
  BadgeCheck,
  ShoppingBag,
  ArrowRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

import './Profile.css';

const Profile = () => {
  const {
    user,
    isAuthenticated,
    authLoading,
    logout,
  } = useAuth();

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

      setLogoutError(
        'Unable to log out. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  if (authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Customer';

  const displayName =
    firstName || user?.username || 'Customer';

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* PAGE INTRODUCTION */}

<div className="profile-intro">
  <div className="profile-intro-header">
    <div>
      <p className="profile-eyebrow">
        YOUR ACCOUNT
      </p>

      <h1>My Profile</h1>

      <p className="profile-intro-description">
        Manage your account and explore
        your shopping history.
      </p>
    </div>

    <button
      className="profile-logout"
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
    >
      <LogOut size={17} />
      {loggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  </div>

  {logoutError && (
    <p className="profile-logout-error" role="alert">
      {logoutError}
    </p>
  )}
</div>

        {/* PROFILE HERO */}

        <section className="profile-hero">
          <div className="profile-hero-content">

            <div
              className="profile-avatar"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="profile-hero-text">
              <span className="profile-welcome-label">
                WELCOME BACK
              </span>

              <h2>{displayName}!</h2>

              <p>
                Your personal space at
                J & L Fashions.
              </p>
            </div>
          </div>

          <div className="profile-hero-decoration">
            <span>J&amp;L</span>
            <small>FASHIONS</small>
          </div>
        </section>

        {/* ACCOUNT CONTENT */}

        <div className="profile-dashboard">

          {/* PERSONAL INFORMATION */}

          <section className="profile-details">
            <div className="profile-section-heading">
              <div className="profile-heading-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h2>Personal Information</h2>
                <p>Your account details</p>
              </div>
            </div>

            <div className="profile-info-grid">

              <div className="profile-info-item">
                <span className="profile-info-label">
                  First Name
                </span>

                <strong>
                  {user?.first_name || 'Not provided'}
                </strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  Last Name
                </span>

                <strong>
                  {user?.last_name || 'Not provided'}
                </strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  Username
                </span>

                <strong>
                  {user?.username || 'Not provided'}
                </strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  Email Address
                </span>

                <strong className="profile-email-value">
                  {user?.email || 'Not provided'}
                </strong>
              </div>

            </div>
          </section>

          {/* QUICK ACTIONS */}

          <aside className="profile-sidebar">

            <div className="profile-action-card">
              <div className="profile-action-icon">
                <ShoppingBag size={23} />
              </div>

              <h3>My Orders</h3>

              <p>
                View your purchases, check order
                statuses, and track your shopping
                history.
              </p>

              <button
                type="button"
                className="profile-orders-button"
                onClick={() => navigate('/my-orders')}
              >
                View My Orders
                <ArrowRight size={17} />
              </button>
            </div>

            <div className="profile-security-card">
              <ShieldCheck size={21} />

              <div>
                <h3>Your Account</h3>
                <p>
                  Your profile is accessible
                  when you're signed in.
                </p>
              </div>
            </div>

          </aside>

        </div>

        {/* ACCOUNT SUMMARY */}

        <section className="profile-account-strip">
          <div className="profile-account-strip-icon">
            <BadgeCheck size={20} />
          </div>

          <div>
            <h3>Account Information</h3>
            <p>
              Signed in as {user?.username || 'Customer'}
            </p>
          </div>

          {user?.email && (
            <div className="profile-account-email">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          )}
        </section>

        {/* ORDER HISTORY */}

        <section className="profile-orders-section">
          <div className="profile-orders-heading">
            <div>
              <p className="profile-eyebrow">
                YOUR PURCHASES
              </p>

              <h2>Order History</h2>

              <p>
                A look at your recent shopping activity.
              </p>
            </div>

            <button
              type="button"
              className="profile-view-all"
              onClick={() => navigate('/my-orders')}
            >
              View All Orders
              <ArrowRight size={17} />
            </button>
          </div>

          <OrderHistory />
        </section>

      </div>
    </main>
  );
};

export default Profile;
