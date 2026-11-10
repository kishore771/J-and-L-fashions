
import './ContactForm.css';

const ContactForm = () => {
  return (
    <div className="contact-form-container">

      <div className="contact-form-header">
        <h2>Send Us a Message</h2>
        <p>Fill out the form below and we'll get back to you.</p>
      </div>

      <form className="contact-form">

        <div className="contact-form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email address"
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="What is this regarding?"
          />
        </div>

        <div className="contact-form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows="5"
            placeholder="Write your message here..."
          />
        </div>

        <button type="submit" className="contact-form-button">
          Send Message
        </button>

      </form>

    </div>
  );
};

export default ContactForm;
