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

// Categories will be derived dynamically from fetched panel members

// Mock data removed – panel members will be loaded from the API

const Jury = () => {
  const [panelMembers, setPanelMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getPublicPanelMembers();
        if (data && data.length > 0) {
          setPanelMembers(data);
          const cats = Array.from(new Set(data.map(m => m.category)));
          setCategories(cats);
          if (!activeCategory && cats.length > 0) {
            setActiveCategory(cats[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load panel members:', err);
      }
    };
    fetchMembers();
  }, []);

  const currentMembers = panelMembers.filter(m => m.category === activeCategory);

  return (
    <section className="jury-section section-padding" id="jury">
      <div className="container">
        <h2 className="jury-section-title">Meet the Jury</h2>

        <div className="jury-layout-grid">
          {/* Category Tabs Sidebar */}
          <div className="jury-categories-sidebar">
            {categories.map((cat) => (
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
                  <img src={member.imagePath ? getFileUrl(member.imagePath) : ''} alt={member.name} className="jury-member-photo" />
                </div>
                <div className="jury-member-info">
                  <h4 className="jury-member-name">{member.name}</h4>
                  <p className="jury-member-role">{member.role}</p>
                  <span className="jury-member-company">{member.email || ''}</span>
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
