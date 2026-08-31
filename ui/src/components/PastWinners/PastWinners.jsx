import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ceremonyPhoto from '../../assets/past-winner-ceremony.jpg';
import moleculeBg from '../../assets/molecule-bg-pattern.png';
import './PastWinners.css';

const winnersList = [
  {
    id: 1,
    year: '2026',
    winnerBadge: '2025-2026 WINNER',
    category: 'OPPI Ranjit Shahani Memorial Award For Excellence in Patient Centricity',
    companyName: 'Company name',
    subCompany: 'Company name',
    image: ceremonyPhoto
  },
  {
    id: 2,
    year: '2026',
    winnerBadge: '2025-2026 WINNER',
    category: 'OPPI Marketing Excellence Awards New Product',
    companyName: 'Company name',
    subCompany: 'Company name',
    image: ceremonyPhoto
  },
  {
    id: 3,
    year: '2026',
    winnerBadge: '2025-2026 WINNER',
    category: 'OPPI Sales Force Excellence Award',
    companyName: 'Company name',
    subCompany: 'Company name',
    image: ceremonyPhoto
  }
];

const PastWinners = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = 10;

  const currentWinner = winnersList[activeIndex % winnersList.length];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section 
      className="past-winners-section section-padding" 
      id="past-winners"
      style={{ backgroundImage: `url(${moleculeBg})` }}
    >
      <div className="container">
        <div className="past-winners-header">
          <h2 className="past-winners-title">Past Winners</h2>
          <div className="year-pill-green">
            <span>2026</span>
          </div>
        </div>

        {/* Outer Carousel Container with Navigation Arrows on sides */}
        <div className="past-winners-carousel-wrapper">
          <button className="carousel-side-arrow left" onClick={handlePrev} aria-label="Previous">
            <ArrowLeft size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeIndex}
              className="past-winner-main-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Content */}
              <div className="winner-card-left">
                <h3 className="winner-category-title">{currentWinner.category}</h3>
                <span className="winner-badge-green">{currentWinner.winnerBadge}</span>
                <div className="winner-company-block">
                  <p className="winner-company-line">{currentWinner.companyName}</p>
                  <p className="winner-company-line">{currentWinner.subCompany}</p>
                </div>
              </div>

              {/* Right Ceremony Image */}
              <div className="winner-card-right">
                <img 
                  src={currentWinner.image} 
                  alt="Past Winner Ceremony" 
                  className="winner-ceremony-image" 
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <button className="carousel-side-arrow right" onClick={handleNext} aria-label="Next">
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="carousel-dots-wrapper">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <span
              key={index}
              className={`carousel-dot ${activeIndex % totalSlides === index ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PastWinners;
