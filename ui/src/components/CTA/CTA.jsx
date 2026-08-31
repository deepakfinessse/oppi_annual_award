import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import hexBg from '../../assets/hex-gradient-bg.png';
import './CTA.css';

const CTA = () => {
  return (
    <section 
      className="cta-annual-section"
      style={{ backgroundImage: `url(${hexBg})` }}
    >
      <div className="cta-annual-overlay" />

      <motion.div 
        className="cta-annual-content"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="cta-annual-title">
          Your research deserves to be celebrated
        </h2>
        <p className="cta-annual-subtitle">
          Join India's most distinguished roster of pharmaceutical innovators. Applications close on 15th July 2026.
        </p>
        
        <Link to="/login" className="cta-annual-btn">
          <span>APPLY NOW</span>
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </section>
  );
};

export default CTA;
