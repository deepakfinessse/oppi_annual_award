import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPublicPanelMembers, getFileUrl } from '../../utils/api';
import shekharImg from '../../assets/Shekhar.png';
import balaramImg from '../../assets/Balaram.png';
import akamanchiImg from '../../assets/Akamanchi.png';
import ykImg from '../../assets/YK.png';
import wellingImg from '../../assets/Welling.png';
import prabhatImg from '../../assets/Prabhat.png';
import './Jury.css';

const juryCategories = [
  'Marketing Excellence',
  'Sales Force Excellence',
  'HR Excellence',
  'Healthcare Communications',
  'Patient Centricity',
  'Medical Excellence',
  'HR Diversity & Inclusion',
  'Sustainability Excellence',
];

const mockJuryData = {
  'Patient Centricity': [
    { name: 'Ranjeeta Vinod', role: 'Global Commercial Lead, Rare Disease', company: 'Novartis', img: prabhatImg },
    { name: 'Dr. Ratna Devi', role: 'CEO & Co-Founder, Daksham Health Foundation', company: 'Daksham Health', img: wellingImg },
    { name: 'Viji Venkatesh', role: 'Region Head, India & South Asia', company: 'The Max Foundation', img: shekharImg },
    { name: 'Raj Shankar Ghosh', role: 'Senior Advisor, Vaccine Delivery & Public Health', company: 'Bill & Melinda Gates Foundation', img: balaramImg },
    { name: 'Prasanna Shirol', role: 'Co-Founder & Executive Director', company: 'ORDI (Organization for Rare Diseases India)', img: akamanchiImg },
    { name: 'Dr. Indu Bhushan', role: 'Former CEO, Ayushman Bharat & National Health Authority', company: 'Government of India', img: ykImg }
  ],
  'Marketing Excellence': [
    { name: 'Shekhar C. Mande', role: 'Distinguished Professor, Savitribai Phule Pune University', company: 'Pune University', img: shekharImg },
    { name: 'Prof. P. Balaram', role: 'Former Director, IISc Bangalore', company: 'IISc', img: balaramImg }
  ],
  'Sales Force Excellence': [
    { name: 'Dr. M. N. Welling', role: 'Advisor to President, SVKM & NMIMS', company: 'NMIMS', img: wellingImg },
    { name: 'Prof. K. G. Akamanchi', role: 'Professor of Pharmaceutical Technology', company: 'ICT Mumbai', img: akamanchiImg }
  ],
  'HR Excellence': [
    { name: 'Prof. Y K Gupta', role: 'President, AIIMS Jammu', company: 'AIIMS', img: ykImg },
    { name: 'Dr. Prabhat Ranjan Mishra', role: 'Chief Scientist & Head', company: 'CSIR-CDRI', img: prabhatImg }
  ],
  'Healthcare Communications': [
    { name: 'Dr. Ratna Devi', role: 'CEO & Co-Founder', company: 'Daksham Health', img: wellingImg },
    { name: 'Viji Venkatesh', role: 'Region Head', company: 'The Max Foundation', img: shekharImg }
  ],
  'Medical Excellence': [
    { name: 'Shekhar C. Mande', role: 'Distinguished Professor', company: 'Pune University', img: shekharImg },
    { name: 'Prof. P. Balaram', role: 'Former Director', company: 'IISc Bangalore', img: balaramImg }
  ],
  'HR Diversity & Inclusion': [
    { name: 'Ranjeeta Vinod', role: 'Global Commercial Lead', company: 'Novartis', img: prabhatImg },
    { name: 'Viji Venkatesh', role: 'Region Head', company: 'The Max Foundation', img: shekharImg }
  ],
  'Sustainability Excellence': [
    { name: 'Raj Shankar Ghosh', role: 'Senior Advisor', company: 'BMGF', img: balaramImg },
    { name: 'Dr. Indu Bhushan', role: 'Former CEO', company: 'NHA', img: ykImg }
  ]
};

const Jury = () => {
  const [activeCategory, setActiveCategory] = useState('Patient Centricity');
  const [panelMembers, setPanelMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getPublicPanelMembers();
        if (data && data.length > 0) {
          setPanelMembers(data);
        }
      } catch (err) {
        console.error('Failed to load panel members:', err);
      }
    };
    fetchMembers();
  }, []);

  const currentMembers = mockJuryData[activeCategory] || mockJuryData['Patient Centricity'];

  return (
    <section className="jury-section section-padding" id="jury">
      <div className="container">
        <h2 className="jury-section-title">Meet the Jury</h2>

        <div className="jury-layout-grid">
          {/* Category Tabs Sidebar */}
          <div className="jury-categories-sidebar">
            {juryCategories.map((cat) => (
              <button
                key={cat}
                className={`jury-cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Jury Members Grid */}
          <div className="jury-cards-grid">
            {currentMembers.map((member, idx) => (
              <motion.div
                key={idx}
                className="jury-member-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="jury-member-photo-frame">
                  <img src={member.img} alt={member.name} className="jury-member-photo" />
                </div>
                <div className="jury-member-info">
                  <h4 className="jury-member-name">{member.name}</h4>
                  <p className="jury-member-role">{member.role}</p>
                  <span className="jury-member-company">{member.company}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Jury;
