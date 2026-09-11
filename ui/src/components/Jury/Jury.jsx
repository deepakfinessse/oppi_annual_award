import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicPanelMembers, getFileUrl } from '../../utils/api';

// Available high-res portrait assets
import shekharImg from '../../assets/Shekhar.png';
import balaramImg from '../../assets/Balaram.png';
import akamanchiImg from '../../assets/Akamanchi.png';
import ykImg from '../../assets/YK.png';
import wellingImg from '../../assets/Welling.png';
import meenaGaneshImg from '../../assets/meena-ganesh--with-round-bg.png';
import karthikeyanImg from '../../assets/Dr-Karthikeyan-Ponnalagu--with-round-bg.png';
import ashutoshImg from '../../assets/Ashutosh-Pastor-with-round-bg.png';
import directorImg from '../../assets/director_new1--with-round-bg.png';
import elloraImg from '../../assets/Ellora.jpg';
import jyotirmayeeImg from '../../assets/Jyotirmayee.jpg';
import vinaykumarImg from '../../assets/Vinaykumar.jpg';

import './Jury.css';

const FIGMA_CATEGORIES = [
  'Marketing Excellence',
  'Sales Force Excellence',
  'HR Excellence',
  'Healthcare Communications',
  'Patient Centricity',
  'Medical Excellence',
  'HR Diversity & Inclusion',
  'Sustainability Excellence',
];

const DEFAULT_AVATARS = [
  meenaGaneshImg,
  elloraImg,
  jyotirmayeeImg,
  shekharImg,
  karthikeyanImg,
  ashutoshImg,
  directorImg,
  balaramImg,
  akamanchiImg,
  ykImg,
  vinaykumarImg,
  wellingImg,
];

const DEFAULT_JURY_MEMBERS = [
  // 1. Marketing Excellence
  {
    id: 'm1',
    name: 'Archana Jain',
    role: 'CEO, PR Pundit Havas Red',
    category: 'Marketing Excellence',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },
  {
    id: 'm2',
    name: 'Jitendra Tyagi',
    role: 'Senior Advisor and independent consultant',
    category: 'Marketing Excellence',
    type: 'JURY',
    defaultImage: directorImg,
  },
  {
    id: 'm3',
    name: 'Praful Akali',
    role: 'Founder & MD, Medulla Communications Pvt. Ltd.',
    category: 'Marketing Excellence',
    type: 'JURY',
    defaultImage: ashutoshImg,
  },
  {
    id: 'm4',
    name: 'Salil S. Kallianpur',
    role: 'Founder & MD, ARKS Knowledge Consulting Pvt. Ltd.',
    category: 'Marketing Excellence',
    type: 'JURY',
    defaultImage: balaramImg,
  },
  {
    id: 'm5',
    name: 'Susan Josi',
    role: 'Former MD, Havas Health & You , South East Asia & Middle East',
    category: 'Marketing Excellence',
    type: 'JURY',
    defaultImage: elloraImg,
  },

  // 2. Sales Force Excellence
  {
    id: 's1',
    name: 'Ariz Rizvi',
    role: 'Head – Health Risk Management, Aon',
    category: 'Sales Force Excellence',
    type: 'JURY',
    defaultImage: karthikeyanImg,
  },
  {
    id: 's2',
    name: 'Gauri Pathak',
    role: 'Country Service Line Leader, Healthcare, Ipsos',
    category: 'Sales Force Excellence',
    type: 'JURY',
    defaultImage: jyotirmayeeImg,
  },
  {
    id: 's3',
    name: 'Pawan Garg',
    role: 'CEO-Volo Health',
    category: 'Sales Force Excellence',
    type: 'JURY',
    defaultImage: vinaykumarImg,
  },

  // 3. HR Excellence
  {
    id: 'hr1',
    name: 'Ashwini D Prakash',
    role: 'Managing Partner and Board Director, Singapore and India at Stanton Chase',
    category: 'HR Excellence',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },
  {
    id: 'hr2',
    name: 'Kavi Arasu',
    role: 'Principal, Flyntrok Consulting',
    category: 'HR Excellence',
    type: 'JURY',
    defaultImage: directorImg,
  },
  {
    id: 'hr3',
    name: 'Sanjay Banerjee',
    role: 'Proprietor, Banerjee Consulting',
    category: 'HR Excellence',
    type: 'JURY',
    defaultImage: akamanchiImg,
  },
  {
    id: 'hr4',
    name: 'Shilpa Gentela',
    role: 'Senior Client Partner, Korn Ferry',
    category: 'HR Excellence',
    type: 'JURY',
    defaultImage: elloraImg,
  },

  // 4. Healthcare Communications
  {
    id: 'hc1',
    name: 'Aman Gupta',
    role: 'Managing Partner - Health Practice Asia Lead, FINN Partners',
    category: 'Healthcare Communications',
    type: 'JURY',
    defaultImage: ashutoshImg,
  },
  {
    id: 'hc2',
    name: 'Dilip Yadav',
    role: 'Founding Partner, First Partners',
    category: 'Healthcare Communications',
    type: 'JURY',
    defaultImage: directorImg,
  },
  {
    id: 'hc3',
    name: 'Srikanth Srinivas',
    role: 'Strategic Communications Consultant',
    category: 'Healthcare Communications',
    type: 'JURY',
    defaultImage: shekharImg,
  },
  {
    id: 'hc4',
    name: 'Viveka Roychowdhury',
    role: 'Editor, Express Pharma & Express Healthcare, Indian Express',
    category: 'Healthcare Communications',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },

  // 5. Patient Centricity (Matches Figma screenshot exactly)
  {
    id: 'pc1',
    name: 'Ranjeeta Vinil',
    role: 'Founder Director of Saarathi and Co Prometheus Healthcare Pvt. Ltd',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },
  {
    id: 'pc2',
    name: 'Dr. Ratna Devi',
    role: 'CEO, DakshamA Health, Director, PAIR, Steering Committee Member NCD Labs, WHO Geneva',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: elloraImg,
  },
  {
    id: 'pc3',
    name: 'Viji Venkatesh',
    role: 'Member of the Board of Directors, The Max Foundation and Founder, Managing Trustee, Friends of Max',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: jyotirmayeeImg,
  },
  {
    id: 'pc4',
    name: 'Raj Shankar Ghosh',
    role: 'Lead, Health Consultancy, Nangia & Co. LLP',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: shekharImg,
  },
  {
    id: 'pc5',
    name: 'Prasanna Shirol',
    role: 'Co founder and Executive Director, Organization for Rare Diseases India (ORDI)',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: karthikeyanImg,
  },
  {
    id: 'pc6',
    name: 'Dr. Indu Bhushan',
    role: 'President - iLEP, Former CEO Ayushman Bharat/National Health Authority',
    category: 'Patient Centricity',
    type: 'JURY',
    defaultImage: ashutoshImg,
  },

  // 6. Medical Excellence
  {
    id: 'me1',
    name: 'Dr Arun Bhatt',
    role: 'Consultant – Clinical Research & Drug Development',
    category: 'Medical Excellence',
    type: 'JURY',
    defaultImage: balaramImg,
  },
  {
    id: 'me2',
    name: 'Dr Milind Antani',
    role: 'Nishith Desai Associates, Legal & Tax Counseling Worldwide',
    category: 'Medical Excellence',
    type: 'JURY',
    defaultImage: karthikeyanImg,
  },
  {
    id: 'me3',
    name: 'Dr Rashmi Kulshrestha',
    role: 'Founder and CEO, Regulatory Wisdom',
    category: 'Medical Excellence',
    type: 'JURY',
    defaultImage: jyotirmayeeImg,
  },
  {
    id: 'me4',
    name: 'Dr Suresh Menon',
    role: 'Director - Medical, Themis Medicare',
    category: 'Medical Excellence',
    type: 'JURY',
    defaultImage: akamanchiImg,
  },
  {
    id: 'me5',
    name: 'Dr. Purvish M. Parikh',
    role: 'MD, DNB, FICP, PhD, ECMO, CPI, Medical Oncology & Hematology, Prof & Head of Clinical Hematology, MGMC&H, Jaipur',
    category: 'Medical Excellence',
    type: 'JURY',
    defaultImage: ykImg,
  },

  // 7. HR Diversity & Inclusion
  {
    id: 'di1',
    name: 'Deepa Shankar',
    role: 'Founder - Authempic Consulting / Diversity & Inclusion Consultant',
    category: 'HR Diversity & Inclusion',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },
  {
    id: 'di2',
    name: 'Dr Niru Kumar',
    role: 'Founder & CEO, Ask Insight',
    category: 'HR Diversity & Inclusion',
    type: 'JURY',
    defaultImage: elloraImg,
  },
  {
    id: 'di3',
    name: 'Karthik Ekambaram',
    role: 'Co-founder and Head of Solutions, Avtar Group',
    category: 'HR Diversity & Inclusion',
    type: 'JURY',
    defaultImage: karthikeyanImg,
  },
  {
    id: 'di4',
    name: 'Roma Balwani',
    role: 'Co-Founder, RB Foundation, Mentor| Independent Director | CEO & Brand Custodian, Indian Deaf Cricket Association, | Advisory Committee Member',
    category: 'HR Diversity & Inclusion',
    type: 'JURY',
    defaultImage: jyotirmayeeImg,
  },
  {
    id: 'di5',
    name: 'Sonica Aron',
    role: 'CEO, Marching Sheep, Board Member, Gender@Work India Trust',
    category: 'HR Diversity & Inclusion',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },

  // 8. Sustainability Excellence
  {
    id: 'se1',
    name: 'Dr. Pragnya Ram',
    role: 'Group Executive President - CSR, Legacy Documentation & Archives, Aditya Birla Management Corporation Pvt. Ltd.',
    category: 'Sustainability Excellence',
    type: 'JURY',
    defaultImage: meenaGaneshImg,
  },
  {
    id: 'se2',
    name: 'Ravi Menon',
    role: 'Senior Business Leader and Professional - Pharmaceuticals/Healthcare',
    category: 'Sustainability Excellence',
    type: 'JURY',
    defaultImage: shekharImg,
  },
  {
    id: 'se3',
    name: 'Sanjiv Navangul',
    role: 'Managing Director and CEO, Bharat Serums and Vaccines Limited',
    category: 'Sustainability Excellence',
    type: 'JURY',
    defaultImage: directorImg,
  },
  {
    id: 'se4',
    name: 'Yugal Sikri',
    role: 'Operating Advisor, TA Associates and Abu Dhabi Investment Authority (ADIA); Board Director and Former MD, RPG Life Sciences; Former India Region CEO, Ranbaxy',
    category: 'Sustainability Excellence',
    type: 'JURY',
    defaultImage: wellingImg,
  },
];

const matchesCategory = (memberCat, targetCat) => {
  if (!memberCat) return false;
  const m = memberCat.toLowerCase().trim();
  const t = targetCat.toLowerCase().trim();

  if (t === 'marketing excellence') return m.includes('marketing');
  if (t === 'sales force excellence') return m.includes('sales force');
  if (t === 'hr excellence') return m.includes('hr excellence') || (m.includes('hr') && !m.includes('diversity') && !m.includes('d&i'));
  if (t === 'healthcare communications') return m.includes('communication');
  if (t === 'patient centricity') return m.includes('patient');
  if (t === 'medical excellence') return m.includes('medical');
  if (t === 'hr diversity & inclusion') return m.includes('diversity') || m.includes('d&i');
  if (t === 'sustainability excellence') return m.includes('sustainability');
  return m === t || m.includes(t);
};

const Jury = () => {
  const [panelMembers, setPanelMembers] = useState(DEFAULT_JURY_MEMBERS);
  const [activeCategory, setActiveCategory] = useState('Patient Centricity');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getPublicPanelMembers();
        if (data && data.length > 0) {
          // Strictly only include members with the JURY role
          const juryOnly = data.filter(m => {
            const roleType = (m.type || m.Type || '').toUpperCase();
            return roleType === 'JURY' || roleType === 'JURY_MEMBER';
          });

          if (juryOnly.length > 0) {
            // Merge with default dataset so existing pictures/names are retained
            const merged = [...DEFAULT_JURY_MEMBERS];
            juryOnly.forEach(apiMember => {
              const idx = merged.findIndex(def => 
                def.name.toLowerCase().trim() === apiMember.name?.toLowerCase().trim()
              );
              if (idx >= 0) {
                merged[idx] = { 
                  ...merged[idx], 
                  ...apiMember,
                  // If API has imagePath use it, else keep defaultImage
                  defaultImage: apiMember.imagePath ? null : merged[idx].defaultImage 
                };
              } else {
                merged.push(apiMember);
              }
            });
            setPanelMembers(merged);
          }
        }
      } catch (err) {
        console.error('Failed to load panel members:', err);
      }
    };
    fetchMembers();
  }, []);

  const currentMembers = panelMembers.filter(m => matchesCategory(m.category, activeCategory));

  const getResolvedImage = (member, idx) => {
    const path = member?.imagePath;
    if (path) {
      if (path.includes('Shekhar') || path.includes('jury2.png')) return shekharImg;
      if (path.includes('Balaram')) return balaramImg;
      if (path.includes('Akamanchi')) return akamanchiImg;
      if (path.includes('YK')) return ykImg;
      if (path.includes('Welling') || path.includes('jury1.png')) return wellingImg;
      return getFileUrl(path);
    }
    if (member?.defaultImage) return member.defaultImage;
    return DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
  };

  return (
    <section className="jury-section section-padding" id="jury">
      <div className="container">
        <div className="jury-layout-grid">
          {/* Left Sidebar: Title & Category Pills */}
          <div className="jury-left-sidebar">
            <div className="jury-title-block">
              <h2 className="jury-section-title">
                Meet the <br />
                <span className="jury-title-highlight">Jury</span>
              </h2>
            </div>

            <div className="jury-category-pills">
              {FIGMA_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    className={`jury-category-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: 3-column Jury Cards Grid */}
          <div className="jury-cards-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                className="jury-cards-grid"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {currentMembers.length === 0 ? (
                  <div className="jury-empty-message">
                    <p>No jury members assigned for {activeCategory} yet.</p>
                  </div>
                ) : (
                  currentMembers.map((member, idx) => {
                    const resolvedImg = getResolvedImage(member, idx);

                    return (
                      <motion.div
                        key={member.id || member.name || idx}
                        className="jury-member-card"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <div className="jury-member-photo-frame">
                          <img
                            src={resolvedImg}
                            alt={member.name}
                            className="jury-member-photo"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
                            }}
                          />
                        </div>

                        <div className="jury-member-info">
                          <h4 className="jury-member-name">{member.name}</h4>
                          <p className="jury-member-role">{member.role}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Jury;
