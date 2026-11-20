
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router';
import './Login.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // 1. Ask Django to initialize the CSRF cookie.
    const csrfResponse = await fetch('/api/accounts/csrf/', {
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('Unable to initialize CSRF protection.');
    }

    // 2. Read the CSRF token from the browser cookie.
    const csrfToken = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('csrftoken='))
      ?.split('=')[1];

    if (!csrfToken) {
      throw new Error('CSRF token was not found.');
    }

    // 3. Log in using Django session authentication.
    const response = await fetch('/api/accounts/login/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': decodeURIComponent(csrfToken),
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Login failed. Please try again.');
      return;
    }

    // Django stores authentication in the session cookie.
    login(data.user);

    navigate('/', { replace: true });
  } catch (error) {
    console.error('Login error:', error);
    alert('Unable to sign in. Please try again.');
  }
};

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome Back</h1>
        {location.state?.message && (
            <p className="login-success" role="status">
                {location.state.message}
            </p>
            )}
        <p>Sign in to your J&L Fashions account</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
            <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your registered email"
            autoComplete="email"
            required
            />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <button type="submit">Sign In</button>
        </form>

        <p>
          Don't have an account? <a href="/register">Create one</a>
        </p>
      </div>
    </div>
  );
};

export default Login;