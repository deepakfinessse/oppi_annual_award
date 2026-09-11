import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getPublicPastWinners, getFileUrl } from '../../utils/api';
import ceremonyPhoto from '../../assets/past-winner-ceremony.jpg';
import moleculeBg from '../../assets/molecule-bg-pattern.png';
import './PastWinners.css';

const fallbackWinners = [
  {
    id: 1,
    year: 2026,
    yearStr: '2025-2026',
    position: 'Winner',
    category: 'OPPI Sustainability Excellence Award',
    organisation: 'Company name 123',
    name: 'Shrey',
    caption: 'Excellence in eco-friendly pharmaceutical manufacturing operations and green energy adoption.',
    imagePath: ''
  },
  {
    id: 2,
    year: 2026,
    yearStr: '2025-2026',
    position: '1st Runner up',
    category: 'OPPI Sustainability Excellence Award',
    organisation: 'Company name 123',
    name: 'Shivam',
    caption: 'Outstanding breakthrough in sustainable supply chain and biodegradable packaging solutions.',
    imagePath: ''
  },
  {
    id: 3,
    year: 2024,
    yearStr: '2023-2024',
    position: 'Winner',
    category: 'OPPI Sustainability Excellence Award',
    organisation: 'Company name 124',
    name: 'Amandeep',
    caption: 'Significant reduction in carbon footprint across global formulation and distribution facilities.',
    imagePath: ''
  }
];

const PastWinners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPublicPastWinners()
      .then(data => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setWinners(data);
        } else {
          setWinners(fallbackWinners);
        }
      })
      .catch(err => {
        console.error('Failed to load past winners for home page:', err);
        if (isMounted) setWinners(fallbackWinners);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const availableYears = Array.from(
    new Set(winners.map(w => w.yearStr || String(w.year)).filter(Boolean))
  );

  const activeWinners = winners.filter(w => {
    if (selectedYear === 'ALL') return true;
    return (w.yearStr === selectedYear) || (String(w.year) === selectedYear);
  });

  const displayWinners = activeWinners.length > 0 ? activeWinners : (winners.length > 0 ? winners : fallbackWinners);
  const totalSlides = displayWinners.length;
  const currentWinner = displayWinners[activeIndex % totalSlides] || displayWinners[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getWinnerImage = (path) => {
    if (!path || (typeof path === 'string' && (path.includes('winner') || !path.trim()))) {
      return ceremonyPhoto;
    }
    if (typeof path !== 'string') return path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    if (path.startsWith('/') && !path.startsWith('/uploads')) return path;
    return getFileUrl(path);
  };

  const isRunnerUp = currentWinner?.position && (
    currentWinner.position.toLowerCase().includes('runner') || 
    currentWinner.position.includes('1st') || 
    currentWinner.position.includes('2nd')
  );

  return (
    <section 
      className="past-winners-section section-padding" 
      id="past-winners"
      style={{ backgroundImage: `url(${moleculeBg})` }}
    >
      <div className="container">
        <div className="past-winners-header">
          <h2 className="past-winners-title">Past Winners</h2>
          <div className="years-pills-container" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {availableYears.length > 1 && (
              <div 
                className={`year-pill-green ${selectedYear === 'ALL' ? 'active' : ''}`}
                onClick={() => { setSelectedYear('ALL'); setActiveIndex(0); }}
                style={{ 
                  cursor: 'pointer', 
                  opacity: selectedYear === 'ALL' ? 1 : 0.6,
                  transform: selectedYear === 'ALL' ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>All Sessions</span>
              </div>
            )}
            {availableYears.map(yr => {
              const isActive = selectedYear === yr || (availableYears.length === 1);
              return (
                <div
                  key={yr}
                  className={`year-pill-green ${isActive ? 'active' : ''}`}
                  onClick={() => { setSelectedYear(yr); setActiveIndex(0); }}
                  style={{ 
                    cursor: 'pointer', 
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{yr}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outer Carousel Container with Navigation Arrows on sides */}
        <div className="past-winners-carousel-wrapper">
          <button className="carousel-side-arrow left" onClick={handlePrev} aria-label="Previous">
            <ArrowLeft size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentWinner.id}-${activeIndex}`}
              className="past-winner-main-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Content */}
              <div className="winner-card-left">
                <h3 className="winner-category-title">{currentWinner.category}</h3>
                
                <span 
                  className="winner-badge-green"
                  style={{
                    color: isRunnerUp ? '#f97316' : (currentWinner.color || '#10b981')
                  }}
                >
                  {`${currentWinner.yearStr || currentWinner.year} ${(currentWinner.position || 'WINNER').toUpperCase()}`}
                </span>

                <div className="winner-company-block">
                  <p className="winner-company-line">
                    {currentWinner.organisation || currentWinner.companyName || 'Organisation'}
                  </p>
                  
                  {currentWinner.name && currentWinner.name !== (currentWinner.organisation || currentWinner.companyName) && (
                    <p className="winner-representative-line" style={{ fontSize: '16px', fontWeight: '700', color: '#0b72c4', margin: '4px 0 0 0' }}>
                      {currentWinner.name}
                    </p>
                  )}

                  {(currentWinner.caption || currentWinner.description) && (
                    <p className="winner-caption-text" style={{ fontSize: '13px', color: '#64748b', margin: '10px 0 0 0', lineHeight: 1.5, maxWidth: '420px' }}>
                      {currentWinner.caption || currentWinner.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Ceremony Image */}
              <div className="winner-card-right">
                <img 
                  src={getWinnerImage(currentWinner.imagePath)} 
                  alt={currentWinner.name || 'Past Winner Ceremony'} 
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
        {totalSlides > 1 && (
          <div className="carousel-dots-wrapper">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <span
                key={index}
                className={`carousel-dot ${activeIndex % totalSlides === index ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PastWinners;
