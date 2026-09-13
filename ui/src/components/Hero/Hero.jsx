import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroBg from '../../assets/annual-hero-bg.jpg';
import './Hero.css';

const Hero = () => {
  // Target deadline for countdown timer
  const deadline = new Date('2026-09-12T23:59:59+05:30');

  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00'
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);

        setTimeLeft({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0')
        });
      } else {
        setTimeLeft({ days: '00', hours: '00', minutes: '00' });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-annual" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="hero-annual-overlay" />
      
      <div className="container hero-annual-container">
        <motion.div
          className="hero-annual-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-annual-title">
            <span>Celebrating Excellence.</span>
            <span>Honouring Impact.</span>
          </h1>

          <div className="hero-annual-action">
            <Link to="/login" className="annual-apply-pill">
              <span>APPLY NOW</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="deadline-wrapper">
            <div className="deadline-line"></div>
            <p className="deadline-text">
              Submit the entry before
            </p>
            <div className="deadline-line"></div>
          </div>

          {/* <p className="submit-entry-text">Submit the entry before</p> */}

          {/* Countdown Timer Block */}
          <div className="hero-countdown-wrapper">
            <div className="countdown-box">
              <span className="countdown-num">{timeLeft.days}</span>
              <span className="countdown-text">Days</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-box">
              <span className="countdown-num">{timeLeft.hours}</span>
              <span className="countdown-text">Hours</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-box">
              <span className="countdown-num">{timeLeft.minutes}</span>
              <span className="countdown-text">Minutes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
