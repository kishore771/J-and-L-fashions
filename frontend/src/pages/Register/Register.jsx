
import { useState } from 'react';
import { useNavigate } from 'react-router';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
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

  if (formData.password !== formData.confirm_password) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const response = await fetch('/api/accounts/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();


        if (!response.ok) {
        // Email already registered
        if (data.email) {
            alert(
            'An account with this email already exists. Please sign in instead.'
            );
            return;
        }

        // Username already taken
        if (data.username) {
            alert(
            'This username is already taken. Please choose another.'
            );
            return;
        }

        // Other validation errors
        const message = Object.entries(data)
            .map(([field, errors]) => {
            const details = Array.isArray(errors)
                ? errors.join(', ')
                : String(errors);

            return `${field}: ${details}`;
            })
            .join('\n');

        alert(message || 'Registration failed. Please try again.');
        return;
        }


    navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully! Please sign in.' },
        });

    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    });
  } catch (error) {
    console.error('Registration error:', error);
    alert('Unable to connect to the server.');
  }
};


  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Create Account</h1>
        <p>Join J&L Fashions and enjoy a better shopping experience.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />

          <label htmlFor="register-first-name">First Name</label>
          <input
            id="register-first-name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            autoComplete="given-name"
            required
          />

          <label htmlFor="register-last-name">Last Name</label>
          <input
            id="register-last-name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            autoComplete="family-name"
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <label htmlFor="register-confirm-password">
            Confirm Password
          </label>
          <input
            id="register-confirm-password"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <button type="submit">Create Account</button>
        </form>

        <p className="register-login-link">
          Already have an account? <a href="/login">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
