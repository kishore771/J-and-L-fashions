import TransparentLogo from '../../assets/logos/Transparent-logo.png';
import { Link } from 'react-router';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">

      {/* Footer Main Content */}
      <div className="footer-main">

        {/* Brand Section */}
        <div className="footer-brand">
          <img
  src={TransparentLogo}
  alt="J&L Fashions"
  className="footer-logo"
/>
          <p>
            Discover timeless fashion and redefine
            your everyday style.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
  <li><Link to="/">Home</Link></li>
  <li><Link to="/men">Men</Link></li>
  <li><Link to="/women">Women</Link></li>
  <li><Link to="/collections">Collections</Link></li>
</ul>
        </div>

        {/* Customer Service */}
        <div className="footer-service">
          <h3>Customer Service</h3>
          <ul>
  <li><Link to="/about">About Us</Link></li>
  <li><Link to="/contact">Contact Us</Link></li>
</ul>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>© 2026 J&L Fashions. All rights reserved.</p>
      </div>

    </footer>
  );
};

export default Footer;
