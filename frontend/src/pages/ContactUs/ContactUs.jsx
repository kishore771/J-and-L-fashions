import ContactInfo from '../../components/ContactUs/ContactInfo/ContactInfo';
import ContactForm from '../../components/ContactUs/ContactForm/ContactForm';
import './ContactUs.css';

const ContactUs = () => {
  return (
    <div className="contactus-page">

      {/* Contact Header */}
      <section className="contactus-header">
        <p className="contactus-subtitle">GET IN TOUCH</p>

        <h1 className="contactus-title">
          We'd Love to Hear From You
        </h1>

        <p className="contactus-description">
          Have a question or need assistance?
          We're always happy to help.
        </p>
      </section>

      {/* Contact Content */}
      <section className="contactus-content">

        {/* Contact Information */}
        <div className="contactus-info">
          <ContactInfo />
        </div>

        {/* Contact Form */}
        <div className="contactus-form">
            <ContactForm />
        </div>

      </section>

    </div>
  );
};

export default ContactUs;
