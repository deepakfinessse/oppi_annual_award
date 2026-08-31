import React from 'react';
import { motion } from 'framer-motion';
import './Quote.css';

const Quote = () => {
  return (
    <section className="quote-section">
      <div className="container">
        <motion.div 
          className="quote-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <p className="quote-text">
            "Innovation in healthcare is not a luxury — it is the infrastructure of a healthier India."
          </p>
          <span className="quote-author">— OPPI Mission Statement</span>
        </motion.div>
        
        <div className="quote-desc">
          <p>
            The Organization of Pharmaceutical Producers of India (OPPI) works closely with the government and other 
            stakeholders to foster a productive environment for innovation. As one of OPPI's three core 
            pillars, Innovation has consistently been prioritized. OPPI works to place India at the forefront of 
            introducing groundbreaking medical solutions to the Indian market.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Quote;
