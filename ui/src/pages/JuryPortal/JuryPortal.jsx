import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ApplicationPreview from '../../components/ApplicationPreview/ApplicationPreview';
import { getJuryApplications, juryApprove, saveJuryDraft, getUser, getPublicPanelMembers, clearTokens, logout } from '../../utils/api';
import { Eye, X, Download, CheckCircle2, ChevronDown, LogOut, Award, Filter } from 'lucide-react';
import { exportJuryApplicationsExcel } from '../../utils/excelExport';
import './JuryPortal.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let str = String(dateStr).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return '—';
  }
};

export const getCategoryShortName = (catName) => {
  if (!catName) return '';
  const c = catName.toLowerCase().trim();
  if (c.includes('new pharma') || (c.includes('new') && c.includes('product'))) return 'New Product';
  if (c.includes('existing pharma') || (c.includes('existing') && c.includes('product'))) return 'Existing Product';
  if (c.includes('sales')) return 'Sales Force Excellence';
  if (c.includes('diversity') || c.includes('d&i') || c.includes('dni')) return 'D&I Award';
  if (c.includes('hr excellence') || c.includes('hr award')) return 'HR Excellence Award';
  if (c.includes('communication')) return 'Healthcare Communications';
  if (c.includes('medical')) return 'Medical Excellence';
  if (c.includes('sustainab')) return 'Sustainability Excellence';
  if (c.includes('patient') || c.includes('shahani')) return 'Patient Centricity';
  return catName;
};

export const CATEGORY_CRITERIA_MAP = {
  hr_excellence: {
    categoryName: 'OPPI HR Award - HR Excellence Award',
    criteria: [
      { name: 'Leadership & People Strategy', weight: 20 },
      { name: 'Talent Acquisition & Management', weight: 20 },
      { name: 'Talent and Organization Development', weight: 10 },
      { name: 'Employee Engagement, Communication and Organization Culture', weight: 20 },
      { name: 'Performance Management', weight: 10 },
      { name: 'Total Rewards Management', weight: 10 },
      { name: 'Digital, Analytics & Technological Innovation in HR', weight: 10 },
    ]
  },
  dni: {
    categoryName: 'OPPI HR Award - D&I Award',
    criteria: [
      { name: 'Diversity & Inclusion Strategy', weight: 20 },
      { name: 'Recruitment', weight: 20 },
      { name: 'Leadership and Internal Engagements', weight: 20 },
      { name: 'Enabling Policies', weight: 20 },
      { name: 'Talent Development and Growth', weight: 20 },
    ]
  },
  marketing_new: {
    categoryName: 'Dr. H. R. Nanji Memorial OPPI Marketing Excellence Awards New Product',
    criteria: [
      { name: 'Product & Therapy Area', weight: 10 },
      { name: 'Product Specific Market Environment', weight: 10 },
      { name: 'Brand Performance', weight: 20 },
      { name: 'Brand Strategy', weight: 20 },
      { name: 'Sales Execution', weight: 20 },
      { name: 'Innovation', weight: 20 },
    ]
  },
  marketing_existing: {
    categoryName: 'Dr. H. R. Nanji Memorial OPPI Marketing Excellence Awards Existing Product',
    criteria: [
      { name: 'Product & Therapy Area', weight: 10 },
      { name: 'Product Specific Market Environment', weight: 10 },
      { name: 'Brand Performance', weight: 20 },
      { name: 'Brand Strategy', weight: 20 },
      { name: 'Sales Execution', weight: 20 },
      { name: 'Innovation', weight: 20 },
    ]
  },
  sales_force: {
    categoryName: 'OPPI Sales Force Excellence Award',
    criteria: [
      { name: 'Improvement', weight: 10 },
      { name: 'Alignment', weight: 10 },
      { name: 'Execution', weight: 30 },
      { name: 'Acceptance', weight: 25 },
      { name: 'Impact', weight: 25 },
    ]
  },
  medical: {
    categoryName: 'OPPI Medical Excellence Award',
    criteria: [
      { name: 'Ethics', weight: 25 },
      { name: 'Innovation', weight: 25 },
      { name: 'Quality', weight: 25 },
      { name: 'outcomes/impact', weight: 25 },
    ]
  },
  communications: {
    categoryName: 'OPPI Healthcare Communications Award',
    criteria: [
      { name: 'Communication Idea- Originationality/ Creativity; Authentic', weight: 25 },
      { name: 'Choice of Medium & relevance', weight: 25 },
      { name: 'Impact', weight: 25 },
      { name: 'Measurability', weight: 25 },
    ]
  },
  sustainability: {
    categoryName: 'OPPI Sustainability Excellence Award',
    criteria: [
      { name: 'Environmental Impact', weight: 30 },
      { name: 'Sustainability', weight: 30 },
      { name: 'Collaboration & Partnerships', weight: 20 },
      { name: 'Transparency', weight: 20 },
    ]
  },
  patient_centricity: {
    categoryName: 'Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
    criteria: [
      { name: 'Impact of the initiative/strategy', weight: 40 },
      { name: 'Scalability of the initiative/strategy', weight: 20 },
      { name: 'Awareness', weight: 20 },
      { name: 'Collaborations', weight: 10 },
      { name: 'Innovation', weight: 10 },
    ]
  }
};

export const getCategoryCriteria = (catName) => {
  if (!catName) return CATEGORY_CRITERIA_MAP.sales_force.criteria;
  const c = catName.toLowerCase().trim();

  if (c.includes('patient')) return CATEGORY_CRITERIA_MAP.patient_centricity.criteria;
  if (c.includes('sustainab')) return CATEGORY_CRITERIA_MAP.sustainability.criteria;
  if (c.includes('communicat')) return CATEGORY_CRITERIA_MAP.communications.criteria;
  if (c.includes('medical')) return CATEGORY_CRITERIA_MAP.medical.criteria;
  if (c.includes('sales')) return CATEGORY_CRITERIA_MAP.sales_force.criteria;
  if (c.includes('diversity') || c.includes('d&i') || c.includes('dni')) return CATEGORY_CRITERIA_MAP.dni.criteria;
  if (c.includes('hr excellence') || c.includes('hr award')) return CATEGORY_CRITERIA_MAP.hr_excellence.criteria;
  if (c.includes('new')) return CATEGORY_CRITERIA_MAP.marketing_new.criteria;
  if (c.includes('existing') || c.includes('marketing')) return CATEGORY_CRITERIA_MAP.marketing_existing.criteria;

  return CATEGORY_CRITERIA_MAP.sales_force.criteria;
};

const JuryPortal = () => {
  const navigate = useNavigate();
  const [currentUser] = useState(getUser());
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Category filter and tabs state
  const [assignedCategory, setAssignedCategory] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  // Evaluation state: { [criterionName]: scoreBetween1And10 }
  const [criterionScores, setCriterionScores] = useState({});
  const [remarks, setRemarks] = useState('');

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadApps = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getJuryApplications();
      setApps(response);
      if (Array.isArray(response) && response.length > 0 && response[0].assigned_category) {
        setAssignedCategory(response[0].assigned_category);
      }
    } catch (err) {
      console.error('Failed to load jury applications:', err);
      setError('Failed to fetch applications for review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    const fetchPanelCategory = async () => {
      try {
        if (currentUser?.role === 'ADMIN') {
          setAssignedCategory('All Categories (Administrator)');
          return;
        }
        const members = await getPublicPanelMembers();
        if (Array.isArray(members) && currentUser?.email) {
          const found = members.find(
            m => m.email && m.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
          );
          if (found && found.category) {
            setAssignedCategory(found.category);
          }
        }
      } catch (e) {
        console.error('Failed to load panel category:', e);
      }
    };
    fetchPanelCategory();
  }, [currentUser]);

  // Derive dropdown options for this jury panel (e.g. New Product, Existing Product for Marketing)
  const dropdownOptions = useMemo(() => {
    const assigned = (assignedCategory || '').toLowerCase();
    const isMarketing = assigned.includes('marketing') || assigned.includes('nanji');
    const isHrExcellence = assigned.includes('hr excellence');
    const isHrDni = assigned.includes('diversity') || assigned.includes('d&i') || assigned.includes('dni');
    const isSales = assigned.includes('sales');
    const isMedical = assigned.includes('medical');
    const isComm = assigned.includes('communicat');
    const isSustain = assigned.includes('sustainab');
    const isPatient = assigned.includes('patient') || assigned.includes('shahani');

    if (isMarketing) {
      return [
        { label: 'New Product', value: 'New Product' },
        { label: 'Existing Product', value: 'Existing Product' }
      ];
    }
    if (isHrExcellence) {
      return [{ label: 'HR Excellence Award', value: 'HR Excellence Award' }];
    }
    if (isHrDni) {
      return [{ label: 'D&I Award', value: 'D&I Award' }];
    }
    if (isSales) {
      return [{ label: 'Sales Force Excellence', value: 'Sales Force Excellence' }];
    }
    if (isMedical) {
      return [{ label: 'Medical Excellence', value: 'Medical Excellence' }];
    }
    if (isComm) {
      return [{ label: 'Healthcare Communications', value: 'Healthcare Communications' }];
    }
    if (isSustain) {
      return [{ label: 'Sustainability Excellence', value: 'Sustainability Excellence' }];
    }
    if (isPatient) {
      return [{ label: 'Patient Centricity', value: 'Patient Centricity' }];
    }

    // Dynamic extraction from loaded apps
    const foundCategories = Array.from(new Set(apps.map(a => getCategoryShortName(a.category)).filter(Boolean)));
    if (foundCategories.length > 0) {
      return foundCategories.map(c => ({ label: c, value: c }));
    }
    if (assignedCategory) {
      return [{ label: getCategoryShortName(assignedCategory), value: getCategoryShortName(assignedCategory) }];
    }
    return [];
  }, [assignedCategory, apps]);

  // Filter applications by category
  const categoryFilteredApps = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return apps;
    return apps.filter(a => {
      const shortName = getCategoryShortName(a.category);
      if (shortName.toLowerCase() === selectedCategoryFilter.toLowerCase()) return true;
      if (a.category && a.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase())) return true;
      return false;
    });
  }, [apps, selectedCategoryFilter]);

  // Categorize into pending and scored based on filtered apps
  const pendingApps = categoryFilteredApps.filter(a => !a.review || a.review.isDraft);
  const scoredApps = categoryFilteredApps.filter(a => a.review && !a.review.isDraft);

  // Tab-filtered applications to show in table
  const displayedApps = useMemo(() => {
    if (activeTab === 'PENDING') return pendingApps;
    if (activeTab === 'COMPLETED') return scoredApps;
    return categoryFilteredApps;
  }, [activeTab, categoryFilteredApps, pendingApps, scoredApps]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearTokens();
      navigate('/login');
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await exportJuryApplicationsExcel(displayedApps, activeTab);
      setSuccessMsg(`Jury applications Excel sheet downloaded successfully.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to download Jury Excel:', err);
      setError('Failed to download Excel file.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);
  const isFinalized = selectedApp ? selectedApp.review?.isDraft === false : false;
  const currentCriteriaList = getCategoryCriteria(selectedApp?.category);

  // Initialize or restore criteria scores when selectedAppId changes
  useEffect(() => {
    if (!selectedAppId) {
      setCriterionScores({});
      setRemarks('');
      return;
    }

    const app = apps.find(a => a.id === selectedAppId);
    if (app && app.review) {
      let parsedRemarks = '';
      let parsedCriteria = {};

      try {
        if (app.review.comments && app.review.comments.startsWith('{')) {
          const parsed = JSON.parse(app.review.comments);
          parsedRemarks = parsed.remarks || '';
          parsedCriteria = parsed.criterionScores || {};
        } else {
          parsedRemarks = app.review.comments || '';
        }
      } catch (e) {
        parsedRemarks = app.review.comments || '';
      }

      setRemarks(parsedRemarks);
      setCriterionScores(parsedCriteria);
    } else {
      setCriterionScores({});
      setRemarks('');
    }
  }, [selectedAppId, apps]);

  const handlePointSelect = (critName, point) => {
    if (isFinalized || actioning) return;
    setCriterionScores(prev => ({
      ...prev,
      [critName]: point
    }));
  };

  // Calculate live total score (out of 100)
  const calculateTotalScore = (scoresMap, criteriaList) => {
    let sum = 0;
    criteriaList.forEach(crit => {
      const point = scoresMap[crit.name];
      if (point !== undefined && point !== null) {
        sum += (Number(point) / 10) * Number(crit.weight);
      }
    });
    return Math.round(sum * 10) / 10;
  };

  const currentTotalScore = calculateTotalScore(criterionScores, currentCriteriaList);
  const completedCount = currentCriteriaList.filter(
    c => criterionScores[c.name] !== undefined && criterionScores[c.name] !== null
  ).length;

  const handleOpenScores = (appId) => {
    setSelectedAppId(appId);
    setError('');
    setCommentsError('');
    setSuccessMsg('');
    setShowScoreModal(true);
  };

  const handleOpenPreview = (appId) => {
    setSelectedAppId(appId);
    setError('');
    setSuccessMsg('');
    setShowPreviewModal(true);
  };

  const preparePayload = (totalScore) => {
    const commentsPayload = JSON.stringify({
      remarks: remarks.trim(),
      criterionScores: criterionScores
    });

    // Allocate breakdown to satisfy legacy checks (30, 25, 25, 20)
    const ip = Math.min(30, Math.round((totalScore / 100) * 30));
    const team = Math.min(25, Math.round((totalScore / 100) * 25));
    const biz = Math.min(25, Math.round((totalScore / 100) * 25));
    const rem = Math.max(0, Math.min(20, Math.round(totalScore - (ip + team + biz))));

    return {
      InnovationIpScore: ip,
      TeamStrengthScore: team,
      BusinessPlanScore: biz,
      ImpactScore: rem,
      WeightedScore: totalScore,
      Comments: commentsPayload
    };
  };

  const handleSaveDraft = async () => {
    if (!selectedAppId) return;
    if (!remarks || !remarks.trim()) {
      setCommentsError('Remarks are mandatory.');
      return;
    }
    setCommentsError('');
    setActioning(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = preparePayload(currentTotalScore);
      await saveJuryDraft(selectedAppId, payload);
      setSuccessMsg(`Evaluation draft saved successfully for application #${String(selectedAppId).padStart(2, '0')}.`);
      await loadApps();
      setShowScoreModal(false);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err?.message || 'Failed to save draft.');
    } finally {
      setActioning(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!selectedAppId) return;
    if (completedCount < currentCriteriaList.length) {
      setError(`Please score all ${currentCriteriaList.length} criteria before submitting final evaluation.`);
      return;
    }
    if (!remarks || !remarks.trim()) {
      setCommentsError('Remarks are mandatory when submitting final score.');
      return;
    }
    setCommentsError('');
    setActioning(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = preparePayload(currentTotalScore);
      await juryApprove(selectedAppId, payload);
      setSuccessMsg(`Score submitted successfully for application #${String(selectedAppId).padStart(2, '0')}.`);
      await loadApps();
      setShowScoreModal(false);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err?.message || 'Failed to submit jury evaluation.');
    } finally {
      setActioning(false);
    }
  };

  const activeFilterLabel = selectedCategoryFilter === 'ALL'
    ? 'CATEGORY'
    : `CATEGORY: ${selectedCategoryFilter}`;



  return (
    <div className="jury-portal-page">
      <Navbar />
      <div className="jury-portal-container">
        {successMsg && <div className="portal-success-banner">✓ {successMsg}</div>}
        {error && <div className="portal-error-banner">⚠️ {error}</div>}

        {/* Figma Table Card */}
        <div className="portal-section-card figma-main-card">
          <div className="figma-card-header-bar">
            {/* Tabs on Left */}
            <div className="figma-tabs-bar">
              <button
                className={`figma-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                All Applications ({categoryFilteredApps.length})
              </button>
              <button
                className={`figma-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                Pending ({pendingApps.length})
              </button>
              <button
                className={`figma-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setActiveTab('COMPLETED')}
              >
                Completed ({scoredApps.length})
              </button>
            </div>

            {/* Actions on Right: CATEGORY Dropdown + DOWNLOAD Button */}
            <div className="figma-header-actions-right">
              {/* Category Dropdown matching Figma */}
              <div className="figma-category-dropdown-container" ref={categoryDropdownRef}>
                <button
                  type="button"
                  className={`figma-category-btn ${isCategoryMenuOpen ? 'open' : ''} ${selectedCategoryFilter !== 'ALL' ? 'filtered' : ''}`}
                  onClick={() => setIsCategoryMenuOpen(prev => !prev)}
                >
                  <span>{activeFilterLabel}</span>
                  <ChevronDown size={18} className={`figma-chevron ${isCategoryMenuOpen ? 'open' : ''}`} />
                </button>

                {isCategoryMenuOpen && (
                  <div className="figma-dropdown-popover">
                    <button
                      type="button"
                      className={`figma-popover-item ${selectedCategoryFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => { setSelectedCategoryFilter('ALL'); setIsCategoryMenuOpen(false); }}
                    >
                      All Categories
                    </button>
                    {dropdownOptions.map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        className={`figma-popover-item ${selectedCategoryFilter === opt.value ? 'active' : ''}`}
                        onClick={() => { setSelectedCategoryFilter(opt.value); setIsCategoryMenuOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download Excel Button matching Figma */}
              <button
                type="button"
                className="figma-download-btn"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel || displayedApps.length === 0}
                title="Download Applications Excel Sheet"
              >
                <span>{downloadingExcel ? 'DOWNLOADING...' : 'DOWNLOAD'}</span>
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Table matching Figma */}
          <div className="portal-table-wrapper">
            {loading && apps.length === 0 ? (
              <div className="pane-loading">
                <span className="spinner-sm"></span> Loading applications...
              </div>
            ) : displayedApps.length === 0 ? (
              <div className="empty-pane-msg">
                🎉 No applications found for this selection.
              </div>
            ) : (
              <table className="portal-table figma-styled-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Applicant Name</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedApps.map(app => {
                    const isScored = app.review && !app.review.isDraft;
                    const scoreVal = isScored
                      ? (app.review.weightedScore || Math.round((app.review.innovationIpScore || 0) + (app.review.teamStrengthScore || 0) + (app.review.businessPlanScore || 0) + (app.review.impactScore || 0)))
                      : '-';

                    return (
                      <tr key={app.id}>
                        <td><strong>#{String(app.id).padStart(2, '0')}</strong></td>
                        <td>{app.applicant_name || app.user_name || '—'}</td>
                        <td><span className="figma-company-cell">{app.company || app.institute_name || '—'}</span></td>
                        {/* <td>
                          <span className="figma-category-cell">
                            {getCategoryShortName(app.category) || app.category || '—'}
                          </span>
                        </td> */}
                        <td>
                          {isScored ? (
                            <span className="figma-status-badge completed">Completed</span>
                          ) : (
                            <span className="figma-status-badge pending">Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`figma-score-cell ${isScored ? 'scored' : 'empty'}`}>
                            {scoreVal}
                          </span>
                        </td>
                        <td className="table-actions-cell" style={{ textAlign: 'center' }}>
                          <div className="figma-table-actions">
                            <button
                              className="figma-action-view"
                              onClick={() => handleOpenPreview(app.id)}
                              title="View Application Details"
                            >
                              View
                            </button>
                            <button
                              className="figma-action-score"
                              onClick={() => handleOpenScores(app.id)}
                              title={isScored ? "Review Evaluation Score" : "Evaluate Application"}
                            >
                              Score
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Figma-Style Evaluation Scorecard Modal */}
      {showScoreModal && selectedApp && (
        <div className="portal-modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="eval-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="eval-modal-header">
              <div>
                <h3 className="eval-modal-title">Your Evaluation</h3>
                <p className="eval-modal-subtitle">
                  Grading scale of 1 to 10 (10 being the highest score and 1 being the lowest score)
                </p>
              </div>
              <button
                className="eval-modal-close-btn"
                onClick={() => setShowScoreModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="portal-error-banner" style={{ margin: '1rem 0' }}>⚠️ {error}</div>}

            {/* Score Banner matching Figma */}
            <div className="eval-score-banner">
              <div className="eval-total-score-box">
                <span className="eval-score-label">Total Score</span>
                <div className="eval-score-digits">
                  <span className="eval-score-val">{currentTotalScore.toFixed(1)}</span>
                  <span className="eval-score-max"> / 100</span>
                </div>
              </div>
              <div className="eval-progress-badge">
                <CheckCircle2 size={16} className="eval-check-icon" />
                <span>{completedCount} / {currentCriteriaList.length} Criteria Completed</span>
              </div>
            </div>

            {/* Evaluation Criteria Rows */}
            <div className="eval-criteria-list">
              {currentCriteriaList.map((crit, idx) => {
                const selectedPoint = criterionScores[crit.name];
                const weight = crit.weight;

                return (
                  <div key={crit.name} className="eval-criterion-row">
                    <div className="eval-crit-index-col">
                      <span className="eval-index-badge">{idx + 1}</span>
                    </div>

                    <div className="eval-crit-details-col">
                      <h4 className="eval-crit-name">{crit.name}</h4>
                      <span className="eval-crit-weight">Weight: {weight}%</span>
                    </div>

                    <div className="eval-points-scale-col">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pt) => {
                        const isSelected = selectedPoint === pt;
                        return (
                          <button
                            key={pt}
                            type="button"
                            className={`eval-point-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handlePointSelect(crit.name, pt)}
                            disabled={isFinalized || actioning}
                          >
                            {pt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="eval-crit-score-col">
                      <span className="eval-score-sublabel">Your Score</span>
                      <strong className="eval-crit-score-display">
                        {selectedPoint !== undefined && selectedPoint !== null ? `${selectedPoint}/10` : '—/10'}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remarks Textarea */}
            <div className="eval-remarks-group">
              <label className="eval-remarks-label">
                Remarks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                className="eval-remarks-textarea"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (e.target.value.trim()) setCommentsError('');
                }}
                disabled={isFinalized || actioning}
                placeholder="Strong initiative with effective execution and measurable impact..."
                style={commentsError ? { borderColor: '#ef4444' } : {}}
              />
              {commentsError && (
                <div className="eval-field-error">
                  ⚠️ {commentsError}
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="eval-modal-footer">
              {!isFinalized ? (
                <>
                  <button
                    type="button"
                    className="eval-btn-draft"
                    onClick={handleSaveDraft}
                    disabled={actioning}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="eval-btn-submit"
                    onClick={handleSubmitScore}
                    disabled={actioning}
                  >
                    {actioning ? 'Submitting...' : 'Submit Score'}
                  </button>
                </>
              ) : (
                <div className="eval-finalized-badge">
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>Evaluation Finalized &amp; Submitted ({selectedApp.review?.weightedScore} / 100)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Details Preview Modal */}
      {showPreviewModal && selectedAppId && (
        <div className="portal-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="portal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h2>Application Details — #{String(selectedAppId).padStart(2, '0')}</h2>
              <button className="portal-modal-close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="portal-modal-body">
              <ApplicationPreview appId={selectedAppId} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default JuryPortal;
