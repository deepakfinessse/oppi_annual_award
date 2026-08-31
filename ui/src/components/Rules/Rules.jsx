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
              <h3 className="info-card-title">Eligibility</h3>
              <div className="info-items">
                <div className="info-item">
                  <div className="info-icon indian-flag"><img src={indialogo} alt="India Flag" className="india-flag-image" /></div>
                  <p>Scientist must be of Indian Nationality</p>
                </div>
                <div className="info-item">
                  <GraduationCap className="info-icon blue" width={34} height={34} />
                  <p>Must hold a Science / Pharmacy / Post-Graduate degree from a reputed university.</p>
                </div>
                <div className="info-item">
                  <User className="info-icon blue" width={34} height={34} />
                  <p><strong>OPPI Young Scientist Award:</strong> Age limit up to 40 years (as on the last date of application). Open to both male & female scientists.</p>
                </div>
                <div className="info-item">
                  <User className="info-icon blue" width={34} height={34} />
                  <p><strong>OPPI Scientist Award:</strong> Above 40 years (as on the last date of application). Open to both male & female scientists.</p>
                </div>
                <div className="info-item">
                  <Building2 className="info-icon blue" width={34} height={34} />
                  <p>Nominations/ Submissions are invited from all Biological Research Centres & institutions of Higher learning recognized by Government of India & its various agencies</p>
                </div>
              </div>
            </div>

            {/* Research Weightage Card */}
            <div className="info-card">
              <h3 className="info-card-title">Research Weightage</h3>
              <div className="info-items">
                <div className="info-item">
                  <ClipboardPenLine className="info-icon blue" width={34} height={34} />
                  <p>Patented research will receive additional weightage. Submissions must demonstrate commercial application.</p>
                </div>
                <div className="info-item">
                  <FileBadge className="info-icon blue" width={31} height={35} />
                  <p>Applicants must submit a certificate from their institution head confirming the work is original and does not infringe any Intellectual Property Rights.</p>
                </div>
              </div>
            </div>

            {/* Submission Card */}
            <div className="info-card">
              <h3 className="info-card-title">Submission</h3>
              <div className="info-items">
                <div className="info-item">
                  <BookmarkOff className="info-icon blue" width={34} height={34} />
                  <p>Recipients of the Young Scientist & Women Scientist Awards cannot reapply in the same category.</p>
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
