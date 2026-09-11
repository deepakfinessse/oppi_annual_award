import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  TrendingUp, 
  Users, 
  UserCheck, 
  HeartHandshake, 
  MessageSquare, 
  Stethoscope, 
  Leaf, 
  Heart,
  ChevronRight
} from 'lucide-react';
import moleculeBg from '../../assets/molecule-bg-pattern.png';
import './Categories.css';

const categoryData = [
  {
    id: 'c1',
    title: 'OPPI Marketing Excellence Awards - New Pharma Product',
    tag: 'Marketing Excellence',
    icon: Award,
    eligibility: [
      'An OPPI member company; only one entry per member company per category.',
      'Recognizes outstanding strategic marketing, market entry execution, and commercial impact for a new pharmaceutical product introduced in the Indian market.',
      'The product launch must have occurred within the last 24 months.'
    ],
    judging: [
      'Innovation and strategic positioning in launch campaign.',
      'Measurable market penetration and healthcare provider adoption.',
      'Compliance with regulatory and ethical marketing standards.'
    ]
  },
  {
    id: 'c2',
    title: 'OPPI Marketing Excellence Awards - Existing Pharma Product',
    tag: 'Marketing Excellence',
    icon: TrendingUp,
    eligibility: [
      'An OPPI member company; only one entry per member company per category.',
      'Applies to mature or established pharmaceutical products showing exceptional lifecycle management, campaign innovation, or market growth strategy in India.'
    ],
    judging: [
      'Sustained growth trajectory and competitive differentiation.',
      'Creative educational and patient-awareness outreach.',
      'Overall ROI and brand equity advancement.'
    ]
  },
  {
    id: 'c3',
    title: 'OPPI Sales Force Excellence Award',
    tag: 'Sales Force',
    icon: Users,
    eligibility: [
      'An OPPI member company; open to sales leadership and execution teams.',
      'Recognizes operational efficiency, digital enablement, and performance excellence among sales personnel across India.'
    ],
    judging: [
      'Productivity improvements and capability-building programs.',
      'Adoption of digital detailing and CRM tools.',
      'Demonstrated integrity, customer engagement, and ethical sales practices.'
    ]
  },
  {
    id: 'c4',
    title: 'OPPI HR Award - HR Excellence Award',
    tag: 'HR Excellence',
    icon: UserCheck,
    eligibility: [
      'An OPPI member company.',
      'Focuses on innovative HR practices, talent acquisition, leadership development, and workplace wellness in the pharmaceutical sector.'
    ],
    judging: [
      'Impact of HR initiatives on employee engagement and retention.',
      'Innovative learning and development programs.',
      'Measurable organizational culture improvements.'
    ]
  },
  {
    id: 'c5',
    title: 'OPPI HR Award - D&I Award',
    tag: 'Diversity & Inclusion',
    icon: HeartHandshake,
    eligibility: [
      'An OPPI member company.',
      'Recognizes exceptional initiatives fostering diversity, gender parity, equal opportunities, and inclusive work environments.'
    ],
    judging: [
      'Percentage growth in diverse talent representation across levels.',
      'Structured mentorship and inclusion policies.',
      'Employee feedback and cultural impact.'
    ]
  },
  {
    id: 'c6',
    title: 'OPPI Healthcare Communications Award',
    tag: 'Communications',
    icon: MessageSquare,
    eligibility: [
      'An OPPI member company or communication team.',
      'Covers public health awareness campaigns, scientific communication, and media relations initiatives.'
    ],
    judging: [
      'Clarity, accuracy, and reach of public health communications.',
      'Multi-channel media campaign effectiveness.',
      'Positive societal or patient behavior impact.'
    ]
  },
  {
    id: 'c7',
    title: 'OPPI Medical Excellence Award',
    tag: 'Medical Affairs',
    icon: Stethoscope,
    eligibility: [
      'An OPPI member company.',
      'Honors excellence in medical affairs, clinical trials execution, real-world evidence (RWE) generation, and medical education.'
    ],
    judging: [
      'Scientific rigor and contribution to medical literature.',
      'Quality of Key Opinion Leader (KOL) engagement.',
      'Impact on improving clinical practice and patient outcomes.'
    ]
  },
  {
    id: 'c8',
    title: 'OPPI Sustainability Excellence Award',
    tag: 'Sustainability',
    icon: Leaf,
    eligibility: [
      'An OPPI member company.',
      'Recognizes ESG initiatives, green manufacturing practices, carbon reduction, and sustainable supply chain initiatives.'
    ],
    judging: [
      'Quantifiable reduction in emissions, waste, or water usage.',
      'Scalability of green technology integration.',
      'Alignment with global SDG framework.'
    ]
  },
  {
    id: 'c9',
    title: 'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
    tag: 'Patient Centricity',
    icon: Heart,
    eligibility: [
      'An OPPI member company; only one entry per member company per category.',
      'The initiative/strategy of the company re: patient centricity and its impact in India.'
    ],
    judging: [
      'Tangible improvement in patient access and therapy adherence.',
      'Scale and reach of patient support initiatives across India.',
      'Cross-stakeholder collaboration with NGOs and healthcare systems.'
    ]
  }
];

const Categories = () => {
  // Default active category selected (e.g. Ranjit Shahani Memorial Award)
  const [selectedCategory, setSelectedCategory] = useState(categoryData[8]);
  const [activeTab, setActiveTab] = useState('eligibility');

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
  };

  return (
    <section 
      className="categories-section section-padding" 
      id="categories"
      style={{ backgroundImage: `url(${moleculeBg})` }}
    >
      <div className="container">
        <div className="categories-header text-center">
          <motion.h2 
            className="categories-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Award Categories
          </motion.h2>
          <motion.p 
            className="categories-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Nine pillars of pharmaceutical excellence — each honouring a distinct dimension of innovation and leadership.
          </motion.p>
        </div>

        {/* 3x3 Category Cards Grid */}
        <div className="categories-grid">
          {categoryData.map((cat, idx) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory?.id === cat.id;

            return (
              <motion.div 
                key={cat.id} 
                className={`category-card ${isSelected ? 'selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => selectCategory(cat)}
              >
                <div className="category-card-top">
                  <div className="category-icon-box">
                    <IconComp size={22} className="cat-green-icon" />
                  </div>
                  <h3 className="category-card-title">{cat.title}</h3>
                </div>
                
                <button 
                  className="category-view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCategory(cat);
                  }}
                >
                  <span>VIEW DETAILS</span>
                  <span className="view-arrow">↓</span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Inline Category Details Panel matching Figma */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div 
              key={selectedCategory.id}
              className="category-inline-detail-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="detail-box-heading">{selectedCategory.title}</h3>

              <div className="detail-box-tabs">
                <button 
                  className={`detail-tab-pill ${activeTab === 'eligibility' ? 'active' : ''}`}
                  onClick={() => setActiveTab('eligibility')}
                >
                  Eligibility Criteria
                </button>
                <button 
                  className={`detail-tab-pill ${activeTab === 'judging' ? 'active' : ''}`}
                  onClick={() => setActiveTab('judging')}
                >
                  Judging Criteria
                </button>
              </div>

              <div className="detail-box-content">
                <ul className="criteria-rows-list">
                  {(activeTab === 'eligibility' ? selectedCategory.eligibility : selectedCategory.judging).map((item, idx) => (
                    <li key={idx} className="criteria-row-item">
                      <ChevronRight size={16} className="criteria-row-arrow" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Categories;
