
import './Dashboard.css';

import { useEffect, useState, useContext } from 'react';
import { getProducts } from '../../services/api';
import { Link } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { token } = useContext(AuthContext);

  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getProducts(token);

        setProductCount(
          data.count ??
          data.results?.length ??
          (Array.isArray(data) ? data.length : 0)
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProducts();
    } else {
      setIsLoading(false);
      setError('Please log in to view dashboard statistics.');
    }
  }, [token]);

  return (
    <div className="dashboard-page">

      {/* PAGE HEADER */}
      <div className="dashboard-page-header">
        <h1>Dashboard</h1>
        <p>Welcome to J&L Fashions Admin Portal.</p>
      </div>

      {/* LOADING AND ERROR */}
      {isLoading && (
        <p className="dashboard-message">
          Loading dashboard...
        </p>
      )}

      {error && (
        <p className="dashboard-error">
          {error}
        </p>
      )}

      {/* DASHBOARD STATISTICS */}
      {!isLoading && !error && (
        <div className="dashboard-stats">

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-card-header">
              <h3>Active Products</h3>
              <span className="dashboard-stat-icon">P</span>
            </div>

            <p className="dashboard-stat-number">
              {productCount}
            </p>

            <span className="dashboard-stat-description">
              Products in your catalogue
            </span>
          </div>

        </div>
      )}

      {/* QUICK ACTIONS */}
      <section className="dashboard-quick-actions">
        <div className="dashboard-quick-actions-header">
          <h2>Quick Actions</h2>
          <p>Manage your product catalogue.</p>
        </div>

        <div className="quick-action-links">
          <Link
            to="/admin/products"
            className="quick-action-primary"
          >
            Manage Products
          </Link>

          <Link
            to="/admin/products/add"
            className="quick-action-secondary"
          >
            Add New Product
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
