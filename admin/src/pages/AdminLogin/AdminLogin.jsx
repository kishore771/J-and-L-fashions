
import './AdminLogin.css';

import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

const AdminLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setIsLoading(true);

      await login(username, password);

      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">

        {/* BRAND */}
        <div className="admin-login-brand">
          <h1>J&L Fashions</h1>
          <span>ADMINISTRATION</span>
        </div>

        {/* LOGIN HEADING */}
        <div className="admin-login-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your store.</p>
        </div>

        {/* LOGIN FORM */}
        <form className="admin-login-form" onSubmit={handleSubmit}>

          <div className="admin-login-form-group">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-login-form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="admin-login-error">
              {error}
            </p>
          )}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <p className="admin-login-footer">
          J&L Fashions Admin Portal
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;
