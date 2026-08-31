import React, { useState, useEffect } from 'react';
import './Hero.css';

const Countdown = () => {
  const getTimeLeft = () => {
    const deadline = new Date('2026-09-12T23:59:59+05:30');
    const now = new Date();
    const diff = Math.max(0, deadline - now);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown">
      <div className="countdown-item">
        <span className="count">{timeLeft.days.toString().padStart(2, '0')}</span>
        <span className="label">Days</span>
      </div>
      <div className="countdown-divider">:</div>
      <div className="countdown-item">
        <span className="count">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="label">Hours</span>
      </div>
      <div className="countdown-divider">:</div>
      <div className="countdown-item">
        <span className="count">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="label">Mins</span>
      </div>
    </div>
  );
};

export default Countdown;
