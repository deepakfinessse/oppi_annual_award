import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ApplicationPreview from '../../components/ApplicationPreview/ApplicationPreview';
import { getPanelChairApplications, panelChairApprove, panelChairReject, getScientistApplication, getApplicationReview } from '../../utils/api';
import './PanelChairPortal.css';

const PanelChairPortal = () => {
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Rejection UI
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Full detail (including reviews) for the selected app
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);

  const loadApps = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPanelChairApplications();
      setApps(response);
      if (response.length > 0 && !selectedAppId) {
        setSelectedAppId(response[0].id);
      } else if (response.length === 0) {
        setSelectedAppId(null);
      }
    } catch (err) {
      console.error('Failed to load Panel Chair applications:', err);
      setError('Failed to fetch applications awaiting Panel Chair decision.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  // When selected application changes, load the jury reviews if needed, or we can fetch them
  // Wait, let's fetch the full application details (which also fetches reviews from review endpoint!)
  // In Program.cs: GET /application/review/{id} fetches user info, file uploads, AND jury_reviews!
  // Oh, that's perfect! Let's fetch it using fetch /application/review/{id} directly or add an API helper.
  // Wait, does api.js have a helper for getApplicationReview(id)?
  // Let's check api.js... No, let's add it or write a simple fetch call.
  // Actually, we can just do a fetch inside this component, or add getApplicationReview to api.js.
  // Let's add getApplicationReview(id) to api.js? Yes, let's write a simple fetch in this component first or edit api.js.
  // Let's see: we can do a direct fetch since we have BASE_URL and getHeaders()!
  // Wait, let's write a fetch helper inside the component:
  useEffect(() => {
    if (!selectedAppId) {
      setSelectedAppDetail(null);
      return;
    }
    
    const fetchReviews = async () => {
      try {
        const data = await getApplicationReview(selectedAppId);
        setSelectedAppDetail(data);
      } catch (err) {
        console.error('Failed to load application review details:', err);
      }
    };
    
    fetchReviews();
    setShowRejectForm(false);
    setRejectReason('');
  }, [selectedAppId]);

  const handleApprove = async () => {
    if (!selectedAppId) return;
    setActioning(true);
    setError('');
    try {
      await panelChairApprove(selectedAppId);
      setSuccessMsg(`Application #${selectedAppId} approved successfully by Panel Chair.`);
      
      const nextApps = apps.filter(a => a.id !== selectedAppId);
      setApps(nextApps);
      setSelectedAppId(nextApps.length > 0 ? nextApps[0].id : null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to approve application.');
    } finally {
      setActioning(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    
    setActioning(true);
    setError('');
    try {
      await panelChairReject(selectedAppId, rejectReason);
      setSuccessMsg(`Application #${selectedAppId} rejected with reason: "${rejectReason}".`);
      
      const nextApps = apps.filter(a => a.id !== selectedAppId);
      setApps(nextApps);
      setSelectedAppId(nextApps.length > 0 ? nextApps[0].id : null);
      setShowRejectForm(false);
      setRejectReason('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to reject application.');
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="panel-portal-page">
      <Navbar />
      <div className="panel-portal-container">
        <div className="panel-header-bar">
          <div>
            <h1>Panel Chair Portal</h1>
            <p>Final approval authority for external OPPI Scientist Awards</p>
          </div>
          <span className="pending-badge">{apps.length} JURY_APPROVED Apps</span>
        </div>

        {successMsg && <div className="portal-success-banner">✓ {successMsg}</div>}
        {error && <div className="portal-error-banner">⚠️ {error}</div>}

        <div className="panel-workspace">
          {/* Applications list */}
          <div className="panel-list-pane">
            <h3 className="pane-title">Applications</h3>
            
            {loading && apps.length === 0 ? (
              <div className="pane-loading">
                <span className="spinner-sm"></span> Loading...
              </div>
            ) : apps.length === 0 ? (
              <div className="empty-pane-msg">
                🎉 No applications waiting for Panel Chair review!
              </div>
            ) : (
              <div className="apps-card-list">
                {apps.map(app => (
                  <button
                    key={app.id}
                    className={`app-list-card ${selectedAppId === app.id ? 'active' : ''}`}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <div className="card-header-row">
                      <span className="app-id">#{String(app.id).padStart(2, '0')}</span>
                      <span className="score-badge">★ {app.average_score.toFixed(2)}</span>
                    </div>
                    <div className="applicant-name">{app.applicant_name || app.user_name || 'Anonymous'}</div>
                    <div className="applicant-category">{app.category || 'Scientist Awards'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Review Pane */}
          <div className="panel-review-pane">
            {selectedAppId ? (
              <>
                {/* Decision Panel */}
                <div className="panel-decision-section">
                  <div className="decision-header">
                    <h4>Panel Decision for Application #{String(selectedAppId).padStart(2, '0')}</h4>
                    <div className="decision-buttons">
                      {!showRejectForm ? (
                        <>
                          <button
                            className="btn-portal-reject"
                            onClick={() => setShowRejectForm(true)}
                            disabled={actioning}
                          >
                            Reject Application
                          </button>
                          <button
                            className="btn-portal-approve"
                            onClick={handleApprove}
                            disabled={actioning}
                          >
                            {actioning ? 'Processing...' : 'Approve & Release Award'}
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-portal-cancel-reject"
                          onClick={() => setShowRejectForm(false)}
                          disabled={actioning}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {showRejectForm && (
                    <form onSubmit={handleRejectSubmit} className="rejection-form-box">
                      <div className="form-group">
                        <label>Rejection Reason <span className="required">*</span></label>
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Provide a specific reason for rejection to the applicant..."
                          required
                          disabled={actioning}
                        />
                      </div>
                      <button type="submit" className="btn-portal-submit-rejection" disabled={actioning}>
                        {actioning ? 'Submitting...' : 'Confirm Rejection'}
                      </button>
                    </form>
                  )}

                  {/* Jury Scorecard details */}
                  {selectedAppDetail?.jury_reviews && selectedAppDetail.jury_reviews.length > 0 && (
                    <div className="jury-reviews-summary-card">
                      <h5>Jury Review Breakdown ({selectedAppDetail.jury_reviews.length} Approvals)</h5>
                      <div className="reviews-table-wrapper">
                        <table className="reviews-table">
                          <thead>
                            <tr>
                              <th>Jury Member</th>
                              <th>Innovation IP</th>
                              <th>Team Strength</th>
                              <th>Biz Plan</th>
                              <th>Impact</th>
                              <th>Avg Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAppDetail.jury_reviews.map((r, i) => (
                              <tr key={i}>
                                <td className="jury-name-cell">{r.jury_name}</td>
                                <td>{r.innovationIpScore} / 30</td>
                                <td>{r.teamStrengthScore} / 25</td>
                                <td>{r.businessPlanScore} / 25</td>
                                <td>{r.impactScore} / 20</td>
                                <td className="weighted-score-cell">{r.weightedScore.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="preview-pane-scrollable">
                  <ApplicationPreview appId={selectedAppId} />
                </div>
              </>
            ) : (
              <div className="empty-preview-placeholder">
                <h3>No Application Selected</h3>
                <p>Please select a pending application from the left panel to review and finalize the decision.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PanelChairPortal;
