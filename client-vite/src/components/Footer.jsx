import React from 'react';
import { Link } from 'react-router-dom';


const FooterSection = ({ title, children, className }) => (
  <div className={`footer-section ${className}`}>
    {title && <h3>{title}</h3>}
    {children}
  </div>
);

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <FooterSection className="brand">
          <h2>HOTELIER</h2>
          <p>“Chạm đến kỳ nghỉ trong mơ – Đặt phòng đẳng cấp chỉ với một cú click.”</p>
          <div className="social-icons">
            <a href="https://facebook.com/tandat0811" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
          </div>
        </FooterSection>

        {/* Contact Section */}
        <FooterSection title="CONTACT">
          <p><span className="icon">📍</span> 123 Street, Thu Duc, HCM</p>
          <p><span className="icon">📞</span> 0869708914</p>
          <p><span className="icon">✉️</span> Hotelier@gmail.com</p>
        </FooterSection>

        {/* Company Section */}
        <FooterSection title="COMPANY">
          <ul>
            <li><Link to="/">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Condition</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </FooterSection>

        {/* Services Section */}
        <FooterSection title="SERVICES">
          <ul>
            <li><Link to="/services">Food & Restaurant</Link></li>
            <li><Link to="/services">Spa & Fitness</Link></li>
            <li><Link to="/services">Sports & Gaming</Link></li>
            <li><Link to="/services">Event & Party</Link></li>
            <li><Link to="/services">Gym & Yoga</Link></li>
          </ul>
        </FooterSection>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <strong>HOTELIER</strong>. Designed by <a href="https://facebook.com/tandat0811" target="_blank" rel="noopener noreferrer">DatTon</a>
        </p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/help">Help</Link>
          <Link to="/faqs">FAQs</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
