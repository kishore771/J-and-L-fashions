import TransparentLogo from '../../assets/logos/Transparent-logo.png';
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
  <li><a href="/">Home</a></li>
  <li><a href="/men">Men</a></li>
  <li><a href="/women">Women</a></li>
  <li><a href="/collections">Collections</a></li>
</ul>
        </div>

        {/* Customer Service */}
        <div className="footer-service">
          <h3>Customer Service</h3>
          <ul>
  <li><a href="/about">About Us</a></li>
  <li><a href="/contact">Contact Us</a></li>
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
