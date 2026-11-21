
import { useState } from 'react';
import './ContactForm.css';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/contact/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Object.values(data)
          .flat()
          .join(' ');

        throw new Error(
          message || 'Unable to send your message.'
        );
      }

      setSuccess(
        data.message ||
        'Your message has been sent successfully!'
      );

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError(
        err.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-container">

      <div className="contact-form-header">
        <h2>Send Us a Message</h2>

        <p>
          Fill out the form below and we'll get back to you.
        </p>
      </div>

      <form
        className="contact-form"
        onSubmit={handleSubmit}
      >

        <div className="contact-form-group">
          <label htmlFor="fullName">
            Full Name
          </label>

          <input
            type="text"
            id="fullName"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="email">
            Email Address
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            maxLength={254}
            required
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="subject">
            Subject
          </label>

          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="What is this regarding?"
            value={formData.subject}
            onChange={handleChange}
            maxLength={200}
            required
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="message">
            Message
          </label>

          <textarea
            id="message"
            name="message"
            rows="5"
            placeholder="Write your message here..."
            value={formData.message}
            onChange={handleChange}
            maxLength={5000}
            required
          />
        </div>

        {success && (
          <p
            className="contact-form-success"
            role="status"
          >
            {success}
          </p>
        )}

        {error && (
          <p
            className="contact-form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="contact-form-button"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>

      </form>
    </div>
  );
};

export default ContactForm;
