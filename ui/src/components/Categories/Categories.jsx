import React, { useState, useRef } from 'react';
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
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import moleculeBg from '../../assets/molecule-bg-pattern.png';
import './Categories.css';

const categoryData = [
  {
    id: 'c1',
    title: 'OPPI Marketing Excellence Award: Existing Pharma Product',
    tag: 'Marketing Excellence',
    icon: TrendingUp,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'AIOCD-AWACS / IMS MAT DECEMBER 2023 to be considered as cut-off for Market Data. If the product is not reported in AIOCS-AWACS / IMS, Internal Sales certified by a Company Secretary / Chartered Accountant / Auditor will be considered',
      'Product that has been in the Market for more than three years, and has a turnover of over INR 10 Cr',
      'If you have applied for an existing product earlier and if your product has won in this category, kindly share the value edition & impact (please include in the Application form - uploaded pdf)'
    ],
    judging: {
      overview: "OPPI's prestigious Marketing Excellence Awards recognise and reward brilliance in the field of marketing, celebrating the finest minds within the profession. These awards are a fantastic way to raise awareness of the creativity and originality delivered by marketers, as well as showcase the successes of marketing teams.",
      items: [
        'Product and Therapy Area',
        'Product Specific Market Environment',
        'Competition (top 10 brands - MS%, GR%)',
        'Segment growth %',
        {
          title: 'Brand Performance',
          subItems: [
            'Sales (value Rs. / volume - units)',
            'Market share %',
            'Growth %',
            'Relative market share (MS% of brand / MS% of leading brand)',
            'Evolution index (Product Growth / Segment Growth x 100)',
            'Prescription share, if available'
          ]
        },
        {
          title: 'Brand Strategy',
          subItems: [
            'Overview of strategy',
            'Communication plan',
            'Key brand propositions',
            'Brand positioning',
            'Pricing strategy'
          ]
        },
        'Sales Execution - strategy and activities',
        'Innovation',
        'New market development initiatives',
        'Channel strategy',
        'Differentiation from competitors',
        'Customer segmentation',
        'Primary market research study (synopsis)'
      ]
    }
  },
  {
    id: 'c2',
    title: 'OPPI Marketing Excellence Award: New Pharma Product',
    tag: 'Marketing Excellence',
    icon: Award,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'AIOCD-AWACS / IMS MAT DECEMBER 2023 to be considered as cut-off for Market Data. If the product is not reported in AIOCS-AWACS / IMS, Internal Sales certified by a Company Secretary / Chartered Accountant / Auditor will be considered',
      'Product that has been in the Market for less than three years, and has a turnover of over INR 4 Cr',
      'If you have applied for a new product earlier and if your product has won in this category, kindly share the value edition & impact (please include in the Application form - uploaded pdf)'
    ],
    judging: {
      overview: "OPPI's prestigious Marketing Excellence Awards recognise and reward brilliance in the field of marketing, celebrating the finest minds within the profession. These awards are a fantastic way to raise awareness of the creativity and originality delivered by marketers, as well as showcase the successes of marketing teams.",
      items: [
        'Product and Therapy Area',
        'Product Specific Market Environment',
        'Competition (top 10 brands - MS%, GR%)',
        'Segment growth %',
        {
          title: 'Brand Performance',
          subItems: [
            'Sales (value Rs. / volume - units)',
            'Market share %',
            'Growth %',
            'Relative market share (MS% of brand / MS% of leading brand)',
            'Evolution index (Product Growth / Segment Growth x 100)',
            'Prescription share, if available'
          ]
        },
        {
          title: 'Brand Strategy',
          subItems: [
            'Overview of strategy',
            'Communication plan',
            'Key brand propositions',
            'Brand positioning',
            'Pricing strategy'
          ]
        },
        'Sales Execution - strategy and activities',
        'Innovation',
        'New market development initiatives',
        'Channel strategy',
        'Differentiation from competitors',
        'Customer segmentation',
        'Primary market research study (synopsis)'
      ]
    }
  },
  {
    id: 'c3',
    title: 'OPPI Sales Force Excellence Award',
    tag: 'Sales Force',
    icon: Users,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The initiative/ project conducted between January 2023 - December 2023'
    ],
    judging: {
      items: [
        'Outstanding work in the fields of sales force/commercial effectiveness',
        'Smart use of data to generate actionable insights',
        'Clear evidence of tangible positive impact on the Indian client business, patients and/or the NHS',
        'Overview of the Sales Force function',
        'Improvement - innovation, advancement and uniqueness',
        'Alignment - between various functions in the organisation viz., marketing, sales, training, etc. to conceive and implement the SFE practice',
        'Execution - rigour demonstrated by the company to implement the SFE practice, including resources and tools deployed',
        'Acceptance - scepticisms, challenges and resistance faced by SFE team in adopting the SFE practice. How did the SFE team bring about a paradigm shift in the organisational mindset and create a buy-in? Adoption level across the team',
        'Impact - SFE practice on sales, productivity and external customers. Feedback process and results'
      ]
    }
  },
  {
    id: 'c4',
    title: 'OPPI HR Award - HR Excellence',
    tag: 'HR Excellence',
    icon: UserCheck,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The initiative/ project conducted between January 2023 - December 2023'
    ],
    judging: {
      overview: 'OPPI HR Excellence Award will be bestowed upon organizations that have achieved overall excellence in their HR and people management practices, thus contributing to the needs of business, the profession, employees, industry and the nation. This award is not only the leading HR trailblazer and honors people management practices but also sets new benchmarks to inspire. OPPI HR Excellence Award stands for innovation used to solve problems and championing value creation through power of people by:',
      items: [
        'Leadership & people strategy',
        'Talent acquisition & management',
        'Talent & organization development',
        'Employee engagement, communication & organization culture',
        'Performance management',
        'Total rewards management',
        'Digital, analytics & technological innovation in HR',
        'Risk management',
        'Learning & development'
      ]
    }
  },
  {
    id: 'c5',
    title: 'OPPI HR Award – D&I Award (Diversity & Inclusion)',
    tag: 'Diversity & Inclusion',
    icon: HeartHandshake,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The submissions may cover one, some or all aspects of diversity- including but not limited to: age, ability, ethnicity, gender, sexual orientation, socio-economic status, race, and religion.',
      'The initiative/ project conducted between January 2023 - December 2023'
    ],
    judging: {
      overview: 'This award recognizes an organization that has diversity and inclusion at the heart of its business, providing outstanding support and opportunities to - women, people from BME backgrounds, people from the LGBTI community, disabled people and other minorities.',
      items: [
        "Evidence of the organization's diversity and inclusion statistics",
        'Evaluation of D&I statistics',
        {
          title: 'D&I Strategy',
          subItems: [
            'Implementation',
            'Communication',
            'Success'
          ]
        },
        'Evidence that D&I strategy is a part of the corporate ethos, not just with employment but also in how it serves the customers',
        'Use metrics and include anecdotes, employee/customer feedback and case studies',
        'Recruitment',
        'Leadership and internal engagement',
        'Talent development and growth'
      ]
    }
  },
  {
    id: 'c6',
    title: 'OPPI Healthcare Communications Award',
    tag: 'Communications',
    icon: MessageSquare,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'All submissions must comply with Drugs and Cosmetics Act 1940; Drugs and Cosmetics Rules 1945; Drugs and Magic Remedies Act 1954',
      'Entry must have aired, launched or been released to the public for the first time between January 2023 - December 2023, OR',
      'If you are entering a campaign that has run over two or more years, you will need to provide proof of the campaign\'s evolution from year to year (OPPI will have the right to decide if the entry has evolved sufficiently and can be deemed as a new, eligible entry)',
      'If you are entering a "Campaign of Executions" (e.g. for Print & publishing, outdoor, film, film craft, industry craft, and radio & audio entries) the whole campaign must fall within the eligibility period, AND',
      'If you are showcasing a continuation of a campaign that aired before the eligibility period then you must clearly show how the campaign has progressed year (OPPI will have the right to decide if the entry has evolved sufficiently and can be deemed as a new, eligible entry)',
      'All work entered has been created specifically to shape understanding of medical conditions, drive their treatment and/or advocate for the development or provision of those treatments.',
      'Work created to drive choice for a specific branded product, service or therapy intended for management of a disease or medical condition',
      'Work targeted direct to consumer/patient/healthcare professional and created to launch and/or promote a regulated product or service through traditional media channels'
    ],
    judging: {
      overview: "The OPPI healthcare Communications Award recognizes creative communications from our members operating in this highly-regulated industry. It's targeted at practitioners, patients and consumers i.e., work that brings science and innovation to life, facilitating diagnosis, prescription, disease mitigation or illness management.",
      items: [
        {
          title: 'Disease Awareness & Understanding',
          description: 'Work created to raise awareness and understanding of a disease or medical condition, change perceptions or overcome social stigma. Approaches may include, but are not limited to: redefining the way we think about disease and its treatment through the reframing of science; providing education on the signs and symptoms of various diseases, disorders and conditions; and encouraging responsible, proactive action and initiative. To include branded and unbranded communications.'
        },
        {
          title: 'Healthcare Professional Engagement',
          description: 'Work created with the intent of driving healthcare advancement, supporting management of a disease or medical condition, motivating treatment, supporting adherence, or aiding patient independence. Communications aimed at healthcare professionals, influencers, researchers and key opinion leaders to establish and continue scientific education, drive industry advancement and adopt technologies and programs associated to the development and distribution of research and treatment options. Approaches may include, but are not limited to, communication tools and devices to assist healthcare professionals with patient adherence, monitoring, data collection, analysis and reporting. It would be expected that entries here would convey a brand ethos as well as result in better patient outcomes.'
        },
        {
          title: 'Patient Engagement',
          description: 'Work created with the intent of driving healthcare advancement, supporting management of a disease or medical condition, motivating treatment, supporting adherence, or aiding patient independence. Communications aimed at patients intended to support adherence; drive proper, responsible usage of treatment; improve patient experience; and drive better outcomes while building a positive reputation for a client and/or brand. Approaches may include, but are not limited to, the use of data analytics and connective technology to enhance the patient journey, compliance programs, screening services, psychosocial support services.'
        },
        {
          title: 'Veterinary',
          description: 'Work created for products and solutions for animals requiring veterinary diagnosis, prescription and treatment.'
        },
        {
          title: 'Medium Eligible',
          subItems: [
            'Brand Experience & Activation — Physical, interactive and immersive events and experiences intended to prompt participant action, emotional engagement and response toward a brand, product or service. Entries may include promotional stunts and live advertising; interactive displays and kiosks; exhibitions, conference/symposium and trade shows; corporate entertainment.',
            'Branded Content & Entertainment — To include digital media (games, mobile apps), Film, TV and online film content.',
            'Digital — Including Social networks and platforms resulting in a successful commercial effect. Campaigns that use social networking sites, blogs, wikis, video-sharing sites, hosted services, etc.',
            'PR — Creative work which successfully builds trust and cultivates relationships with credible third-parties, utilizing mainly earned media tactics or channels to influence public dialogue and ultimately change perceptions and behaviors in ways that protect and enhance the reputation and business of an organization or brand with its target audiences.',
            'Radio & Audio — Content intended for radio, streaming audio content and downloadable audio content. Entries will be judged on the overall creative approach to transforming a brand idea or message into an audio context, which enhances the experience of the listener and meets the confines of the brief and regional regulations. All aspects of script and audio will be considered.'
          ]
        }
      ]
    }
  },
  {
    id: 'c7',
    title: 'OPPI Medical Excellence Award',
    tag: 'Medical Affairs',
    icon: Stethoscope,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The initiative/ project conducted between January 2023 – December 2023 functional project touching at least 2 or more functions (MA/RA/CO/PV)',
      'Demonstrated impact on external stakeholders (e.g. HCPs/Patients)',
      {
        title: 'Nomination Categories',
        subItems: [
          'New Product Launch',
          'KOL/KTL Engagement',
          'Data Generation/Dissemination',
          'HCP Capability Building',
          'Or any other'
        ]
      }
    ],
    judging: {
      overview: 'OPPI Medical Excellence Award recognises excellence in Medical Function (Medical Affairs / Clinical Operations / Regulatory Affairs / Pharmacovigilance). The jury will assess nominations based on:',
      items: [
        {
          title: 'Assessment Criteria',
          subItems: [
            'Ethics: Following policies/procedures',
            'Innovation: Utilising innovative approach',
            'Quality: Final quality of deliverables',
            'Clear outcomes/impact'
          ]
        },
        {
          title: 'Submission to Contain',
          subItems: [
            'Name of project/initiative',
            'Category of nomination e.g. new product launch',
            'Names of medical-regulatory working group member submitting the nomination',
            'Brief description of project: contribution; innovative solution/ approaches adopted; impact of project',
            'Endorsed by Medical Head and Head of Member Organisation'
          ]
        }
      ]
    }
  },
  {
    id: 'c8',
    title: 'OPPI Sustainability Excellence Award',
    tag: 'Sustainability',
    icon: Leaf,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The overall sustainability strategy and implemented initiatives of the company'
    ],
    about: {
      items: [
        {
          title: 'Enhance Impact and Innovation',
          subItems: [
            'Recognize and reward outstanding sustainability strategy and initiatives undertaken by pharmaceutical companies.',
            'Increase the scale and effectiveness of existing sustainability strategy and implemented initiatives.',
            'Encourage the development and implementation of innovative solutions to address the environmental challenges in the pharmaceutical sector.'
          ]
        },
        {
          title: 'Reduce the Environmental Footprint of the Pharmaceutical Industry',
          subItems: [
            'Promote energy efficiency and renewable energy use.',
            'Minimize waste generation and pollution.',
            'Conserve water and other resources.',
            'Ensure that the entire supply chain process is sustainable.',
            'Development of environmentally friendly medicines and packaging.'
          ]
        },
        {
          title: 'Foster Collaboration and Partnerships',
          subItems: [
            'Strengthen collaboration between pharmaceutical companies, NGOs, government agencies, and other stakeholders.',
            'Promote the sharing of best practices and innovative solutions for sustainable pharmaceutical practices.',
            'Leverage collective expertise and resources for greater impact.'
          ]
        },
        {
          title: 'Contribute to Sustainable Development Goals (SDGs)',
          subItems: [
            'Align award categories and selection criteria with specific SDGs.',
            'Track the progress of awarded initiatives towards achieving SDG targets.',
            'Promote the role of the pharmaceutical industry in contributing to a more sustainable future.',
            'Recognize companies that contribute significantly to achieving the SDGs through their sustainability efforts.'
          ]
        },
        {
          title: 'Increase Transparency and Accountability',
          subItems: [
            'Encourage companies to set ambitious sustainability goals and track their progress against measurable targets.',
            'Promote clear and transparent communication of sustainability strategy, implemented initiatives and their impact.'
          ]
        }
      ]
    },
    judging: {
      items: [
        {
          title: '1) Environmental Impact',
          subItems: [
            'The outcomes achieved by the sustainability strategy and implemented initiatives.',
            'The reduction in carbon dioxide emissions, energy consumption, and water usage.',
            'The decrease in waste generation and pollution levels.',
            'Eg: Are environmental-friendly medicines and packaging materials used.'
          ]
        },
        {
          title: '2) Sustainability',
          subItems: [
            'Allocation of adequate resources and budget to sustain the strategy and implemented initiatives.',
            'Are there any monitoring and evaluation mechanisms to track progress and measure impact.',
            'Long-term commitment to the sustainability strategy and initiatives with a clear plan for continued implementation.',
            'Contribution to the advancement of the Sustainable Development Goals (SDGs).'
          ]
        },
        {
          title: '3) Collaboration & Partnerships',
          subItems: [
            'Active involvement of stakeholders, including communities, NGOs, government agencies, and other relevant stakeholders.',
            'Shared decision-making and ownership of the sustainability strategy and implemented initiatives among stakeholders.'
          ]
        },
        {
          title: '4) Transparency',
          subItems: [
            'Clear and transparent communication of sustainability goals, strategies, and activities.',
            'Accessibility of information about the sustainability strategy and implemented initiatives to stakeholders and the public.'
          ]
        }
      ]
    }
  },
  {
    id: 'c9',
    title: 'Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
    tag: 'Patient Centricity',
    icon: Heart,
    eligibility: [
      'An OPPI member company',
      'Only one entry per member company',
      'The initiative/strategy of the company on patient centricity and its impact in India'
    ],
    about: {
      overview: 'The Ranjit Shahani Memorial Award for Excellence in Patient Centricity has been constituted to recognise and felicitate the pharmaceutical company that advocates for patient rights, access to healthcare, and a more inclusive impact. The award aims to honour Mr. Shahani’s profound commitment to championing the rights and well-being of patients and perpetuate Mr. Shahani’s enduring legacy of compassionate leadership.',
      items: [
        'Recognise the best initiatives/campaigns that are centered around the patient',
        'Recognise the initiatives that increase the awareness about a particular disease and raise awareness among patients about their healthcare rights and options',
        'Recognise the initiatives that aid in improving the access to treatment',
        'Recognise the initiatives where the patient groups have been actively involved in the discussions',
        {
          title: 'Recognise Innovative Patient-Centric Care',
          subItems: [
            'Recognise innovations, programs, and solutions that improve patient care, engagement, and outcomes',
            'The integration of advanced technologies including but not limited to AI driven diagnostic tools, wearable devices, health apps that monitor your health closely, and telemedicine into patient care'
          ]
        },
        {
          title: 'Foster Collaboration and Partnerships',
          subItems: [
            'Strengthen collaboration between pharmaceutical companies, NGOs, patient support groups, government agencies, and other stakeholders',
            'Promote the sharing of best practices and innovative solutions for improving patient centric care'
          ]
        }
      ]
    },
    judging: {
      items: [
        {
          title: 'Impact of the Initiative / Strategy',
          description: 'Mention the starting year of the program and share the impact data over the last three years of:',
          subItems: [
            'The number of people (in India) who have been positively impacted by the initiative/strategy',
            'Outcome of the initiative/strategy',
            'Impact through a policy change/intervention'
          ]
        },
        {
          title: 'Scalability of the Initiative / Strategy',
          subItems: [
            'Whether the initiative/strategy can be expanded to cater to a larger population',
            'Wherever applicable, share the urban-rural mix',
            'Whether the initiative/strategy can be expanded to cater to larger disease areas'
          ]
        },
        {
          title: 'Awareness',
          description: 'The initiative/strategy that was used to raise awareness –',
          subItems: [
            'How did they raise awareness',
            'What was the methodology to raise awareness'
          ]
        },
        {
          title: 'Collaborations',
          subItems: [
            'The involvement of multiple stakeholders, especially patients to improve patient care delivery',
            'Collaborations with the Government/ government machinery/ international organisations'
          ]
        },
        {
          title: 'Innovation',
          subItems: [
            'Evidence to show that innovative solutions were incorporated to improve patient care and safety',
            'What measures were undertaken to increase the reach of the initiative/strategy'
          ]
        }
      ]
    }
  }
];

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState(categoryData[0]);
  const [activeTab, setActiveTab] = useState('eligibility');
  const detailRef = useRef(null);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    if (activeTab === 'about' && !cat.about) {
      setActiveTab('eligibility');
    }
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const renderContentList = (data) => {
    if (!data) return null;
    const items = Array.isArray(data) ? data : (data.items || []);
    const overview = data.overview;

    return (
      <div className="criteria-content-body">
        {overview && (
          <div className="criteria-overview-box">
            <div className="criteria-overview-icon">
              <Sparkles size={18} />
            </div>
            <div className="criteria-overview-text">
              {overview}
            </div>
          </div>
        )}

        <div className="criteria-rows-list">
          {items.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <div key={idx} className="criteria-row-item">
                  <span className="criteria-row-icon-wrap">
                    <CheckCircle2 size={16} className="criteria-row-check" />
                  </span>
                  <span className="criteria-row-text">{item}</span>
                </div>
              );
            }

            // Structured Object item
            return (
              <div key={idx} className="criteria-card-item">
                {item.title && (
                  <div className="criteria-card-header">
                    <span className="criteria-card-bullet-icon">
                      <ChevronRight size={16} className="criteria-card-chevron" />
                    </span>
                    <h4 className="criteria-card-title">{item.title}</h4>
                  </div>
                )}
                {item.description && (
                  <p className="criteria-card-desc">{item.description}</p>
                )}
                {item.subItems && (
                  <div className="criteria-sublist">
                    {item.subItems.map((sub, sIdx) => (
                      <div key={sIdx} className="criteria-subitem">
                        <span className="subitem-dot" />
                        <span className="subitem-text">{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SelectedIcon = selectedCategory.icon;

  const currentTabData = activeTab === 'eligibility' 
    ? selectedCategory.eligibility 
    : activeTab === 'judging' 
      ? selectedCategory.judging 
      : selectedCategory.about;

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
            Nine pillars of pharmaceutical excellence — each honouring a distinct dimension of innovation, impact, and leadership.
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
                  <div>
                    <span className="category-card-tag">{cat.tag}</span>
                    <h3 className="category-card-title">{cat.title}</h3>
                  </div>
                </div>
                
                <button 
                  className="category-view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCategory(cat);
                  }}
                >
                  <span>{isSelected ? 'VIEWING DETAILS' : 'VIEW DETAILS'}</span>
                  <span className="view-arrow">{isSelected ? '✓' : '↓'}</span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Inline Category Details Panel matching Figma & Comprehensive Data */}
        <div ref={detailRef}>
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
                {/* Detail Box Top Bar */}
                <div className="detail-box-top-bar">
                  <div className="detail-box-icon-and-title">
                    <div className="detail-box-icon-wrap">
                      <SelectedIcon size={24} className="detail-cat-icon" />
                    </div>
                    <div>
                      <span className="detail-box-tag">{selectedCategory.tag}</span>
                      <h3 className="detail-box-heading">{selectedCategory.title}</h3>
                    </div>
                  </div>
                  <a href="/application" className="detail-apply-link-btn">
                    <span>Apply / Nominate</span>
                    <ArrowRight size={15} />
                  </a>
                </div>

                {/* Tabs */}
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
                  {selectedCategory.about && (
                    <button 
                      className={`detail-tab-pill ${activeTab === 'about' ? 'active' : ''}`}
                      onClick={() => setActiveTab('about')}
                    >
                      About the Award
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="detail-box-content">
                  {renderContentList(currentTabData)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Categories;
