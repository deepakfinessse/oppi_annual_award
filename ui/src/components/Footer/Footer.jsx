import React from 'react';
import { Mail, Phone, Globe, Send } from 'lucide-react';
import './Footer.css';
import oppiLogo from '../../assets/Oppi-logo.png';
import oppi60 from '../../assets/OPPI-60.png';

const Footer = () => {
  return (
    <footer className="footer" id="help">
      <div className="container footer-main">
        <div className="footer-brand">
          <div className="logos-container">
            <img src={oppiLogo} alt="OPPI Logo" className="footer-logo" />
          </div>
          <div className="logos-container">
            <img src={oppi60} alt="OPPI Logo" className="footer-logo" />
          </div>
        </div>

        <div className="footer-col contact-col divider-left">
          <h3>Contact</h3>
          <div className="contact-item">
            <Globe size={18} className="icon" />
            <span>indiaoppi.com</span>
          </div>
          <div className="contact-item">
            <Mail size={18} className="icon" />
            <span>Communications@indiaoppi.com</span>
          </div>
          <div className="contact-item">
            <Phone size={18} className="icon" />
            <span>+91 22 66627007</span>
          </div>
        </div>

        <div className="footer-col address-col divider-left">
          <h3>Mumbai :</h3>
          <p>
            Organisation of Pharmaceutical Producers of India<br />
            1620, C Wing,<br />
            ONE BKC G Block, Plot No. C 66,<br />
            Bandra Kurla Complex,<br />
            Bandra East,<br />
            Mumbai 400051
          </p>
        </div>

        <div className="footer-col address-col divider-left">
          <h3>Delhi :</h3>
          <p>
            Organisation of Pharmaceutical Producers of India,<br />
            Avanta Business Centre,<br />
            Cabin No. 8, 3rd Floor,<br />
            Ambadeep Building,<br />
            K. G. Marg, Connaught Place,<br />
            New Delhi 110001
          </p>
        </div>
      </div>

      <div className="footer-copyright">
        <p>© OPPI 2026. All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
