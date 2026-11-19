
import './DashboardLayout.css';

import { Outlet, Link, useNavigate } from 'react-router';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const DashboardLayout = () => {
  const { logout, username } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <h2 className="dashboard-brand-title">J&L Fashions</h2>
          <p className="dashboard-brand-subtitle">Administration</p>
        </div>

        <nav className="dashboard-navigation">
          <ul className="dashboard-navigation-list">
            <li className="dashboard-navigation-item">
              <Link
                to="/admin/dashboard"
                className="dashboard-navigation-link"
              >
                Overview
              </Link>
            </li>

            <li className="dashboard-navigation-item">
              <Link
                to="/admin/products"
                className="dashboard-navigation-link"
              >
                Products
              </Link>
            </li>

            <li className="dashboard-navigation-item">
              <Link
                to="/admin/orders"
                className="dashboard-navigation-link"
              >
                Orders
              </Link>
            </li>

          </ul>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-welcome">
            <p className="dashboard-header-label">Welcome back</p>
            <h2 className="dashboard-header-username">
              {username || 'Admin'}
            </h2>
          </div>

          <button
            className="dashboard-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
