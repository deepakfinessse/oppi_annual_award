import React from 'react';
import { motion } from 'framer-motion';
import trophyImg from '../../assets/gold-trophy.png';
import './AnnualAwards.css';

const AnnualAwards = () => {
  return (
    <section className="annual-awards-section section-padding">
      <div className="container">
        <div className="annual-awards-grid">
          <motion.div 
            className="annual-awards-text"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="annual-awards-title">
              Annual Awards <span className="highlight-year">2027</span>
            </h2>
            <p className="annual-awards-desc">
              The Annual Awards acknowledge drivers, innovators and professionals who amend excellence across relevant categories. Over the years, the Annual Awards have become a gold standard in the pharmaceutical industry. They will be presented at the 58th Annual Day celebrations.
            </p>
          </motion.div>

          <motion.div 
            className="annual-awards-trophy-wrapper"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img src={trophyImg} alt="OPPI Annual Awards Gold Trophy" className="gold-trophy-img" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AnnualAwards;
