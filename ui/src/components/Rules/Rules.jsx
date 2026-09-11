import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, User, ClipboardPenLine, Share2, FileBadge, BookmarkOff, Building2 } from 'lucide-react';
import trophyImg from '../../assets/Trophy5.webp';
import indialogo from '../../assets/india1.svg';
import './Rules.css';

const Rules = () => {
  return (
    <section className="eligibility-section section-padding" id="eligibility">
      <div className="container">
        <h2 className="section-title-alt">Who all can apply</h2>
        
        <div className="eligibility-grid">
          <motion.div 
            className="eligibility-content"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Eligibility Card */}
            <div className="info-card">
              <h3 className="info-card-title">Eligibility Criteria</h3>
              <div className="info-items">
                <div className="info-item">
                  <Building2 className="info-icon blue" width={34} height={34} />
                  <p><strong>OPPI Member Company:</strong> Open exclusively to registered OPPI member companies operating in India.</p>
                </div>
                <div className="info-item">
                  <BookmarkOff className="info-icon blue" width={34} height={34} />
                  <p><strong>Single Entry Per Category:</strong> A member company can apply for all 9 categories, but only one nomination entry per member company is permitted in each category.</p>
                </div>
                <div className="info-item">
                  <GraduationCap className="info-icon blue" width={34} height={34} />
                  <p><strong>Authorised Representation:</strong> Submissions must be made by an authorised representative or leadership team member.</p>
                </div>
              </div>
            </div>

            {/* Award Categories & Criteria Card */}
            <div className="info-card">
              <h3 className="info-card-title">Award Categories & Criteria</h3>
              <div className="info-items">
                <div className="info-item">
                  <ClipboardPenLine className="info-icon blue" width={34} height={34} />
                  <p><strong>9 Award Categories:</strong> Covering Marketing Excellence (New & Existing), Sales Force, HR Excellence, D&I, Communications, Medical Excellence, Sustainability, and Patient Centricity.</p>
                </div>
                <div className="info-item">
                  <FileBadge className="info-icon blue" width={31} height={35} />
                  <p>Detailed eligibility criteria and judging rubrics for each category are available on the application portal.</p>
                </div>
              </div>
            </div>

            {/* Submission Guidelines Card */}
            <div className="info-card">
              <h3 className="info-card-title">Submission Process</h3>
              <div className="info-items">
                <div className="info-item">
                  <User className="info-icon blue" width={34} height={34} />
                  <p>Register online, save your draft nomination anytime, and finalize your submission before the official deadline.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="rules-image">
            <img src={trophyImg} alt="Trophy" className="trophy-image" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rules;
