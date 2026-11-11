
import {
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';

import './ContactInfo.css';

const ContactInfo = () => {
  return (
    <div className="contact-info-container">

      <div className="contact-info-header">
        <h2>Contact Information</h2>
        <p>Here's how you can reach us.</p>
      </div>

      <div className="contact-info-list">

        <div className="contact-info-item">
          <div className="contact-info-icon">
            <MapPin />
          </div>

          <div className="contact-info-details">
            <h3>Our Location</h3>
            <p>Naiks residency <br/>
            Plot No 318, Dr YSR Enclave, Secretariat Hills, CEO Enclave, Secretariat Employees Colony, Ibrahim Bagh, Neknampur, Hyderabad, Telangana 500089</p>
          </div>
        </div>

        <div className="contact-info-item">
          <div className="contact-info-icon">
            <Phone />
          </div>

          <div className="contact-info-details">
            <h3>Phone Number</h3>
            <p>7793945868</p>
          </div>
        </div>

        <div className="contact-info-item">
          <div className="contact-info-icon">
            <Mail />

          </div>

          <div className="contact-info-details">
            <h3>Email Address</h3>
            <p>jandlfashions27@gmail.com</p>
          </div>
        </div>

        <div className="contact-info-item">
          <div className="contact-info-icon">
            <Clock />
          </div>

          <div className="contact-info-details">
            <h3>Working Hours</h3>
            <p>Monday - Saturday: 10 AM - 7 PM</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ContactInfo;
