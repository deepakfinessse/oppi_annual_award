import React from 'react';
import './Strip.css';

const labels = [
  'NANOTECHNOLOGY',
  'PHARMACOGNOSY',
  'PHYTOCHEMISTRY',
  'CLINICAL RESEARCH',
  'PHARMACEUTICAL CHEMISTRY',
  'DRUG DELIVERY SYSTEMS',
  'PHARMACOLOGY',
];

const Strip = () => {
  return (
    <section className="strip-band" aria-label="Disciplines strip">
      <div className="strip-track">
        {[...labels].map((label, index) => (
          <span key={`${label}-${index}`} className="strip-item">
            <span className="strip-dot">•</span>
            <span className="strip-label">{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default Strip;