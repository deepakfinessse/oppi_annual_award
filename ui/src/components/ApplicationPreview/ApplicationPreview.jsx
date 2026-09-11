import React, { useState, useEffect } from 'react';
import { getScientistApplication, getApplicationReview, getFileUrl } from '../../utils/api';
import { exportSingleApplicationDossierWord } from '../../utils/wordExport';
import { FileText, Video, Download, CheckCircle, ExternalLink } from 'lucide-react';
import './ApplicationPreview.css';

const isImageFile = (fileNameOrPath) => {
  if (!fileNameOrPath) return false;
  const cleanName = fileNameOrPath.split('?')[0].split('#')[0];
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(cleanName);
};

const ApplicationPreview = ({ appId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appId) return;

    const loadApp = async () => {
      setLoading(true);
      setError('');
      try {
        // Try getting comprehensive review/application data
        let response = null;
        try {
          response = await getApplicationReview(appId);
        } catch (e) {
          response = await getScientistApplication(appId);
        }
        setData(response);
      } catch (err) {
        console.error('Failed to load application preview:', err);
        setError('Failed to load application details. Make sure you have the correct permissions.');
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [appId]);

  if (!appId) {
    return (
      <div className="preview-placeholder">
        <p>Select an application from the list to view details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="preview-loading">
        <span className="spinner"></span>
        <p>Loading application #{appId ? String(appId).padStart(2, '0') : ''} details...</p>
      </div>
    );
  }

  if (error) {
    return <div className="preview-error">⚠️ {error}</div>;
  }

  if (!data) return null;

  const pInfo = data.personal_info;
  const fileUploads = data.file_uploads || [];
  const { applicant_detail: ad, application_detail: apd } = data;

  const compName = pInfo?.company_name || data.user_organisation || ad?.instituteName || '—';
  const categoryName = pInfo?.award_category || apd?.category || '—';
  const repName = data.user_name || `${ad?.firstName || ''} ${ad?.lastName || ''}`.trim() || '—';
  const designation = pInfo?.designation || '—';
  const briefDesc = pInfo?.company_brief || apd?.briefStatement || '';

  return (
    <div className="app-preview-container">
      {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 className="preview-app-title" style={{ margin: 0 }}>Application ID: #{appId ? String(appId).padStart(2, '0') : ''}</h3>
        <button
          className="btn-card-action download-btn"
          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => exportSingleApplicationDossierWord(data)}
        >
          <FileText size={15} />
          <span>Export Word Dossier</span>
        </button>
      </div> */}

      {/* SECTION 1 - NOMINATION & COMPANY DETAILS */}
      <div className="preview-section-card">
        <h4 className="preview-card-title">Section 1 – Member Company & Representative Details</h4>
        <div className="preview-fields-layout">
          {[
            ['Award Category', categoryName],
            ['OPPI Member Company', compName],
            ['Representative Name', repName],
            ['Designation', designation],
            ['Gender', data.user?.gender || ad?.gender || '—'],
            ['Email Address', data.user_email || ad?.email || '—'],
            ['Mobile Number', data.user_mobile || ad?.mobile || '—'],
            ['Submission Status', data.status || '—'],
          ].map(([label, val]) => (
            <div key={label} className="preview-data-field">
              <span className="field-label">{label}</span>
              <span className="field-value" style={label === 'Award Category' ? { fontWeight: '700', color: '#1F4E38' } : {}}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 - BRIEF DESCRIPTION */}
      <div className="preview-section-card">
        <h4 className="preview-card-title">Section 2 – Brief Description of the Nomination</h4>
        {briefDesc ? (
          <div className="preview-data-field full-row text-block">
            <span className="field-value pre-wrap" style={{ lineHeight: '1.6', fontSize: '14px', color: '#2d3748' }}>{briefDesc}</span>
          </div>
        ) : (
          <p className="no-data-text">No brief description provided.</p>
        )}
      </div>

      {/* SECTION 3 - ATTACHED DOCUMENTS & MEDIA */}
      {fileUploads && fileUploads.length > 0 && (
        <div className="preview-section-card">
          <h4 className="preview-card-title">Section 3 – Supporting Documents & Videos ({fileUploads.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {fileUploads.map((file, idx) => {
              const fUrl = getFileUrl(file.FilePath || file.filePath);
              const fName = file.FileName || file.fileName || `Attachment ${idx + 1}`;
              const isVid = (file.Section || file.section) === 'video' || /\.(mp4|mov|avi|webm)$/i.test(fName);
              const fSize = file.FileSize || file.fileSize;
              const sizeMB = fSize ? (fSize / (1024 * 1024)).toFixed(1) + ' MB' : '';

              return (
                <div key={file.Id || file.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    {isVid ? <Video size={24} style={{ color: '#0F5257', flexShrink: 0 }} /> : <FileText size={24} style={{ color: '#1F4E38', flexShrink: 0 }} />}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a202c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }} title={fName}>
                        {fName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096' }}>
                        {(file.Section || file.section || 'File').toUpperCase()} {sizeMB && `• ${sizeMB}`}
                      </div>
                    </div>
                  </div>
                  <a href={fUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', backgroundColor: '#edf2f7', color: '#2b6cb0', textDecoration: 'none' }} title="Open file">
                    <ExternalLink size={16} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OPTIONAL LEGACY ATTACHMENTS (IF PRESENT) */}
      {apd && (apd.patents?.length > 0 || apd.cvFilePath || apd.authCertFilePath) && (
        <div className="preview-section-card">
          <h4 className="preview-card-title">Additional Attached Documents</h4>
          <div className="preview-files-row">
            {apd.cvFilePath && (
              <div className="preview-data-field">
                <span className="field-label">Curriculum Vitae</span>
                <span className="field-value">
                  <a href={getFileUrl(apd.cvFilePath)} target="_blank" rel="noreferrer" className="preview-file-link">
                    📄 View CV Document ↗
                  </a>
                </span>
              </div>
            )}
            {apd.authCertFilePath && (
              <div className="preview-data-field">
                <span className="field-label">Authentication Certificate</span>
                <span className="field-value">
                  <a href={getFileUrl(apd.authCertFilePath)} target="_blank" rel="noreferrer" className="preview-file-link">
                    📄 View Certificate ↗
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationPreview;
