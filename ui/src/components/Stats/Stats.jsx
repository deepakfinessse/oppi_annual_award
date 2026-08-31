import React from 'react';
import { motion } from 'framer-motion';
import './Stats.css';

const Stats = () => {
  const statsList = [
    { value: '9', label: 'Award Categories' },
    { value: '37', label: 'Jury Members' },
    { value: '26+', label: 'Years of Excellence' },
    { value: '500+', label: 'Past Honorees' },
  ];

  return (
    <div className="stats-container-wrapper" id="about">
      <div className="container">
        <motion.div 
          className="stats-floating-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {statsList.map((stat, index) => (
            <React.Fragment key={index}>
              <div className="stat-col">
                <h3 className="stat-num">{stat.value}</h3>
                <p className="stat-txt">{stat.label}</p>
              </div>
              {index < statsList.length - 1 && <div className="stat-vert-divider" />}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Stats;
