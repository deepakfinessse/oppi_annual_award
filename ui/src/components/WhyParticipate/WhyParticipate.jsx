import React from 'react';
import { motion } from 'framer-motion';
import discipline1 from '../../assets/1.png';
import discipline2 from '../../assets/2.png';
import discipline3 from '../../assets/3.png';
import discipline4 from '../../assets/4.png';
import discipline5 from '../../assets/5.png';
import './WhyParticipate.css';

const WhyParticipate = () => {
  const disciplines = [
    {
      image: discipline1,
      imageClassName: 'discipline-illustration discipline-illustration--chemistry',
      title: "Pharmaceutical Chemistry",
      lines: [
        { text: 'Pharmaceutical', emphasis: true },
        { text: 'Chemistry', emphasis: true }
      ]
    },
    {
      image: discipline2,
      imageClassName: 'discipline-illustration discipline-illustration--syringe',
      title: "Pharmaceutics:",
      lines: [
        { text: 'Pharmaceutics:', emphasis: true },
        { text: 'Novel & Improved', emphasis: false },
        { text: 'Drug Delivery', emphasis: false },
        { text: 'System', emphasis: false }
      ]
    },
    {
      image: discipline3,
      imageClassName: 'discipline-illustration discipline-illustration--pharmacology',
      title: "Pharmacology:",
      lines: [
        { text: 'Pharmacology:', emphasis: true },
        { text: 'New Models for', emphasis: false },
        { text: 'Evaluating Drugs', emphasis: false }
      ]
    },
    {
      image: discipline4,
      imageClassName: 'discipline-illustration discipline-illustration--dna',
      title: "Pharmaceutical Biotechnology/ Nanotechnology",
      lines: [
        { text: 'Pharmaceutical', emphasis: true },
        { text: 'Biotechnology/', emphasis: true },
        { text: 'Nanotechnology', emphasis: true }
      ]
    },
    {
      image: discipline5,
      imageClassName: 'discipline-illustration discipline-illustration--leaf',
      title: "Pharmacognosy & Phytochemistry:",
      lines: [
        { text: 'Pharmacognosy &', emphasis: true },
        { text: 'Phytochemistry:', emphasis: true },
        { text: 'Evaluation of Plants', emphasis: false },
        { text: '& Plant products for', emphasis: false },
        { text: 'treatment of unmet', emphasis: false },
        { text: 'medical needs', emphasis: false }
      ]
    },
  ];

  return (
    <section className="disciplines-section section-padding" id="categories">
      <div className="container">
        <h2 className="section-title">Discipline / Areas covered</h2>
        
        <div className="disciplines-grid">
          {disciplines.map((item, index) => (
            <motion.div 
              key={index}
              className="discipline-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="discipline-image-wrap">
                <img className={item.imageClassName} src={item.image} alt={item.title} />
              </div>
              <div className="discipline-copy">
                {item.lines.map((line, lineIndex) => (
                  <p
                    key={`${item.title}-${lineIndex}`}
                    className={line.emphasis ? 'discipline-line discipline-line--title' : 'discipline-line'}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyParticipate;
