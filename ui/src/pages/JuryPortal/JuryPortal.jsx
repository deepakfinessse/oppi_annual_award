import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ApplicationPreview from '../../components/ApplicationPreview/ApplicationPreview';
import { getJuryApplications, juryApprove, saveJuryDraft } from '../../utils/api';
import { Eye, X, Download } from 'lucide-react';
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

const JuryPortal = () => {
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const handleDownloadExcel = async (type) => {
    setDownloadingExcel(true);
    try {
      const targetApps = type === 'SCORED' ? scoredApps : pendingApps;
      await exportJuryApplicationsExcel(targetApps, type);
      setSuccessMsg(`Jury ${type} applications Excel sheet downloaded successfully.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to download Jury Excel:', err);
      setError('Failed to download Excel file.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Jury scoring inputs
  const [scores, setScores] = useState({
    innovationIpScore: 0,
    teamStrengthScore: 0,
    businessPlanScore: 0,
    impactScore: 0,
    comments: ''
  });

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadApps = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getJuryApplications();
      setApps(response);
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

  const handleScoreChange = (criteria, value) => {
    const intVal = parseInt(value, 10);
    setScores(prev => ({
      ...prev,
      [criteria]: intVal
    }));
  };

  // Group applications by status:
  const pendingApps = apps.filter(a => !a.review || a.review.isDraft);
  const scoredApps = apps.filter(a => a.review && !a.review.isDraft);

  useEffect(() => {
    if (!selectedAppId) {
      setScores({
        innovationIpScore: 0,
        teamStrengthScore: 0,
        businessPlanScore: 0,
        impactScore: 0,
        comments: ''
      });
      return;
    }
    const app = apps.find(a => a.id === selectedAppId);
    if (app && app.review) {
      setScores({
        innovationIpScore: app.review.innovationIpScore ?? 0,
        teamStrengthScore: app.review.teamStrengthScore ?? 0,
        businessPlanScore: app.review.businessPlanScore ?? 0,
        impactScore: app.review.impactScore ?? 0,
        comments: app.review.comments ?? ''
      });
    } else {
      setScores({
        innovationIpScore: 0,
        teamStrengthScore: 0,
        businessPlanScore: 0,
        impactScore: 0,
        comments: ''
      });
    }
  }, [selectedAppId, apps]);

  const selectedApp = apps.find(a => a.id === selectedAppId);
  const isFinalized = selectedApp ? selectedApp.review?.isDraft === false : false;

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

  const handleSaveDraft = async () => {
    if (!selectedAppId) return;
    if (!scores.comments || !scores.comments.trim()) {
      setCommentsError('Remarks / Comments are mandatory.');
      return;
    }
    setCommentsError('');
    setActioning(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        InnovationIpScore: scores.innovationIpScore,
        TeamStrengthScore: scores.teamStrengthScore,
        BusinessPlanScore: scores.businessPlanScore,
        ImpactScore: scores.impactScore,
        Comments: scores.comments
      };
      await saveJuryDraft(selectedAppId, payload);
      setSuccessMsg(`Draft saved successfully for application #${String(selectedAppId).padStart(2, '0')}.`);
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
    if (!scores.comments || !scores.comments.trim()) {
      setCommentsError('Remarks / Comments are mandatory when submitting evaluation.');
      return;
    }
    setCommentsError('');
    setActioning(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        InnovationIpScore: scores.innovationIpScore,
        TeamStrengthScore: scores.teamStrengthScore,
        BusinessPlanScore: scores.businessPlanScore,
        ImpactScore: scores.impactScore,
        Comments: scores.comments
      };
      await juryApprove(selectedAppId, payload);
      setSuccessMsg(`Evaluation submitted successfully for application #${String(selectedAppId).padStart(2, '0')}.`);
      await loadApps();
      setShowScoreModal(false);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err?.message || 'Failed to submit jury evaluation.');
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="jury-portal-page">
      <Navbar />
      <div className="jury-portal-container">
        {successMsg && <div className="portal-success-banner">✓ {successMsg}</div>}
        {error && <div className="portal-error-banner">⚠️ {error}</div>}

        {/* Section 1: Pending Applications */}
        <div className="portal-section-card" style={{ marginTop: '2rem' }}>
          <div className="portal-card-header-bar">
            <h2 className="portal-card-title">
              Pending Applications for Jury Review ({pendingApps.length})
            </h2>
            {pendingApps.length > 0 && (
              <button
                className="btn-excel-download"
                onClick={() => handleDownloadExcel('PENDING')}
                disabled={downloadingExcel}
                title="Download Pending Applications Excel sheet"
              >
                <Download size={16} />
                <span>{downloadingExcel ? 'GENERATING...' : 'DOWNLOAD EXCEL'}</span>
              </button>
            )}
          </div>

          <div className="portal-table-wrapper">
            {loading && apps.length === 0 ? (
              <div className="pane-loading">
                <span className="spinner-sm"></span> Loading...
              </div>
            ) : pendingApps.length === 0 ? (
              <div className="empty-pane-msg">
                🎉 No pending applications for review!
              </div>
            ) : (
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Submit Date</th>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Award Category</th>
                    <th>Institute Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApps.map(app => (
                    <tr key={app.id}>
                      <td>{formatDate(app.submittedAt || app.submitted_at)}</td>
                      <td><strong>{app.id}</strong></td>
                      <td>{app.applicant_name || app.user_name || 'Anonymous'}</td>
                      <td>{app.category || '—'}</td>
                      <td>{app.institute_name || app.instituteName || app.company || '—'}</td>
                      <td className="table-actions-cell">
                        <button
                          className="btn-action-icon"
                          onClick={() => handleOpenPreview(app.id)}
                          title="View Application Details"
                        >
                          {/* <Eye size={18} /> */}
                          View
                        </button>
                        <button
                          className="btn-action-scores"
                          onClick={() => handleOpenScores(app.id)}
                        >
                          Scores
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section 2: Scored Applications */}
        <div className="portal-section-card">
          <div className="portal-card-header-bar">
            <div className="portal-tabs-bar">
              <button className="portal-tab-item active">
                Scored Applications ({scoredApps.length})
              </button>
            </div>
            {scoredApps.length > 0 && (
              <button
                className="btn-excel-download"
                onClick={() => handleDownloadExcel('SCORED')}
                disabled={downloadingExcel}
                title="Download Scored Applications Excel sheet"
              >
                <Download size={16} />
                <span>{downloadingExcel ? 'GENERATING...' : 'DOWNLOAD SCORED EXCEL'}</span>
              </button>
            )}
          </div>

          <div className="portal-table-wrapper">
            {scoredApps.length === 0 ? (
              <div className="empty-pane-msg">
                No scored applications yet.
              </div>
            ) : (
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Submit Date</th>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Award Category</th>
                    <th>Total Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scoredApps.map(app => (
                    <tr key={app.id}>
                      <td>{formatDate(app.submittedAt || app.submitted_at)}</td>
                      <td><strong>{app.id}</strong></td>
                      <td>{app.applicant_name || app.user_name || 'Anonymous'}</td>
                      <td>{app.applicant_email || app.user_email || '—'}</td>
                      <td>{app.category || '—'}</td>
                      <td>
                        <strong>{app.review ? app.review.weightedScore + ' / 100' : '—'}</strong>
                      </td>
                      <td className="table-actions-cell">
                        <button
                          className="btn-action-icon"
                          onClick={() => handleOpenPreview(app.id)}
                          title="View Application Details"
                        >
                          {/* <Eye size={18} /> */}
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Scorecard Modal Popup */}
      {showScoreModal && selectedAppId && (
        <div className="portal-modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="portal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h2>Evaluation Scorecard for #{String(selectedAppId).padStart(2, '0')} {isFinalized && <span className="finalized-label">(Finalized)</span>}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="btn-view-full-app"
                  onClick={() => {
                    setShowScoreModal(false);
                    setShowPreviewModal(true);
                  }}
                >
                  <Eye size={16} /> View Application Details
                </button>
                <button className="portal-modal-close-btn" onClick={() => setShowScoreModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="portal-modal-body">
              {error && <div className="portal-error-banner" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
              <div className="jury-scoring-panel" style={{ borderRadius: '12px' }}>
                <div className="scores-inputs-grid">
                  {[
                    { key: 'innovationIpScore', label: 'Significance/Impact of Research work', max: 30 },
                    { key: 'teamStrengthScore', label: 'Approach towards Research Work', max: 25 },
                    { key: 'businessPlanScore', label: 'Nature Innovation', max: 25 },
                    { key: 'impactScore', label: 'Investigator\'s Credentials', max: 20 }
                  ].map(({ key, label, max }) => {
                    const val = typeof scores[key] === 'number' ? scores[key] : (parseInt(scores[key], 10) || 0);
                    return (
                      <div key={key} className="score-control-group custom-score-card">
                        <label className="score-control-label">{label}</label>
                        <div className="score-stepper-container">
                          <button
                            type="button"
                            className="stepper-btn decrement"
                            onClick={() => handleScoreChange(key, Math.max(0, val - 1))}
                            disabled={actioning || isFinalized || val <= 0}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={max}
                            value={scores[key] === '' ? '' : (scores[key] ?? 0)}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v === '') {
                                setScores(prev => ({ ...prev, [key]: '' }));
                                return;
                              }
                              let intVal = parseInt(v, 10);
                              if (isNaN(intVal)) intVal = 0;
                              if (intVal < 0) intVal = 0;
                              if (intVal > max) intVal = max;
                              handleScoreChange(key, intVal);
                            }}
                            onBlur={() => {
                              if (scores[key] === '' || scores[key] === undefined || scores[key] === null || isNaN(scores[key]) || scores[key] < 0) {
                                handleScoreChange(key, 0);
                              }
                            }}
                            disabled={actioning || isFinalized}
                            className="score-stepper-input"
                          />
                          <button
                            type="button"
                            className="stepper-btn increment"
                            onClick={() => handleScoreChange(key, Math.min(max, val + 1))}
                            disabled={actioning || isFinalized || val >= max}
                          >
                            +
                          </button>
                          <span className="score-max-badge">/ {max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="comments-input-group">
                  <label>Remarks / Comments <span style={{ color: '#ef4444' }}>*</span>:</label>
                  <textarea
                    rows={3}
                    value={scores.comments}
                    onChange={(e) => {
                      setScores(p => ({ ...p, comments: e.target.value }));
                      if (e.target.value.trim()) setCommentsError('');
                    }}
                    disabled={actioning || isFinalized}
                    placeholder='In case of no remarks, Kindly update as "NA"'
                    className="portal-comments-textarea"
                    style={commentsError ? { borderColor: '#ef4444' } : {}}
                  />
                  {commentsError && (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.35rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ⚠️ {commentsError}
                    </div>
                  )}
                </div>

                <div className="scoring-summary-row">
                  <div className="average-score-display">
                    Total Score: <strong>{((Number(scores.innovationIpScore) || 0) + (Number(scores.teamStrengthScore) || 0) + (Number(scores.businessPlanScore) || 0) + (Number(scores.impactScore) || 0))} / 100</strong>
                  </div>
                  <div className="scoring-action-buttons">
                    {!isFinalized ? (
                      <>
                        <button
                          className="btn-portal-draft"
                          onClick={handleSaveDraft}
                          disabled={actioning}
                        >
                          Save Draft
                        </button>
                        <button
                          className="btn-portal-approve"
                          onClick={handleSubmitScore}
                          disabled={actioning}
                        >
                          {actioning ? 'Submitting...' : 'Submit Evaluation'}
                        </button>
                      </>
                    ) : (
                      <span className="finalized-label" style={{ fontSize: '1rem' }}>Score Submitted</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Preview Modal Popup */}
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
