import React, { useState, useEffect } from 'react';
import { getScientistApplication, getFileUrl } from '../../utils/api';
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
        const response = await getScientistApplication(appId);
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

  const { applicant_detail: ad, application_detail: apd } = data;

  return (
    <div className="app-preview-container">
      <h3 className="preview-app-title">Application ID: #{appId ? String(appId).padStart(2, '0') : ''}</h3>

      {/* SECTION 1 - APPLICANT DETAILS */}
      <div className="preview-section-card">
        <h4 className="preview-card-title">Section 1 – Applicant Details</h4>

        {ad ? (
          <div className="preview-content-grid">
            {ad.photoPath && (
              <div className="preview-photo-frame">
                <img src={getFileUrl(ad.photoPath)} alt="Applicant photo" className="preview-img" />
              </div>
            )}

            <div className="preview-fields-layout">
              {[
                ['Full Name', `${ad.title || ''} ${ad.firstName || ''} ${ad.middleName || ''} ${ad.lastName || ''}`.trim()],
                ['Date of Birth', ad.dob || '—'],
                ['Gender', ad.gender || '—'],
                ['Email Address', ad.email || '—'],
                ['Mobile Number', ad.mobile || '—'],
                ['Telephone', ad.telephone || '—'],
                ['Discipline / Area', ad.discipline || '—'],
                ['Institute Category', (ad.instituteCategory === 'Others' && ad.instituteOtherDetails ? `Others (${ad.instituteOtherDetails})` : ad.instituteCategory) || '—'],
                ['Institute Name', ad.instituteName || '—']
              ].map(([label, val]) => (
                <div key={label} className="preview-data-field">
                  <span className="field-label">{label}</span>
                  <span className="field-value">{val}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="no-data-text">Applicant details are not filled yet.</p>
        )}
      </div>

      {/* SECTION 2 - APPLICATION DETAILS */}
      <div className="preview-section-card">
        <h4 className="preview-card-title">Section 2 – Application Details</h4>

        {apd ? (
          <div className="preview-fields-layout full-width">
            <div className="preview-data-field full-row">
              <span className="field-label">Award Category</span>
              <span className="field-value category-tag">{apd.category || '—'}</span>
            </div>

            <div className="preview-data-field full-row text-block">
              <span className="field-label">Brief Statement of Research Contribution</span>
              <span className="field-value pre-wrap">{apd.briefStatement || '—'}</span>
            </div>

            <div className="preview-data-field full-row text-block">
              <span className="field-label">Significant Contribution to Science or Technology Development</span>
              <span className="field-value pre-wrap">{apd.significantContribution || '—'}</span>
            </div>

            <div className="preview-data-field full-row text-block">
              <span className="field-label">Impact of Contribution to the Concerned Field</span>
              <span className="field-value pre-wrap">{apd.impactContribution || '—'}</span>
            </div>

            {/* RESEARCH PUBLICATIONS */}
            {(apd.hasPublication === true || (apd.hasPublication !== false && apd.hasPublication !== null && apd.hasPublication !== undefined && apd.patents?.some(p => (p.type || '').toUpperCase() === 'PUBLICATION' || !p.type))) && (
              <div className="preview-patents-block">
                <span className="field-label">Most Significant Research Publications</span>
                <div className="preview-patents-list">
                  {apd.patents?.filter(p => (p.type || '').toUpperCase() === 'PUBLICATION' || !p.type).map((p, index) => {
                    const filePath = p.attachmentPath || p.AttachmentPath || p.attachment_path || p.path || p.url || p.filePath || p.FilePath || p.file_path || '';
                    const fileName = p.attachmentFileName || p.AttachmentFileName || p.attachment_file_name || p.fileName || p.name || (filePath ? filePath.split('/').pop() : '');
                    const isImg = isImageFile(fileName || filePath);
                    return (
                      <div key={p.id || index} className="preview-patent-item">
                        <span className="patent-idx">#{index + 1}</span>
                        <div className="patent-details">
                          <span className="patent-title">{p.title || 'Untitled Publication'}</span>
                          <div className="patent-metadata-row">
                            <span className="meta-badge">Primary Writer: {p.isPrimaryWriter ? 'Yes' : 'No'}</span>
                            {filePath ? (
                              isImg ? (
                                <div className="attachment-preview-card img-type">
                                  <a href={getFileUrl(filePath)} target="_blank" rel="noreferrer" className="preview-img-anchor" title="View Full Image">
                                    <img src={getFileUrl(filePath)} alt={fileName} className="preview-attachment-img" />
                                  </a>
                                  <div className="attachment-card-info">
                                    <span className="file-type-badge img-badge">🖼️ Image Attachment</span>
                                    <a href={getFileUrl(filePath)} target="_blank" rel="noreferrer" className="patent-attachment-link">
                                      View Image ({fileName || 'View Image'}) ↗
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="attachment-preview-card pdf-type">
                                  <span className="file-type-badge pdf-badge">📕 PDF Document</span>
                                  <a href={getFileUrl(filePath)} target="_blank" rel="noreferrer" className="patent-attachment-link">
                                    View PDF ({fileName || 'View Document'}) ↗
                                  </a>
                                </div>
                              )
                            ) : fileName ? (
                              <span className="no-attachment-text" style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                Attached: {fileName} (No file uploaded)
                              </span>
                            ) : (
                              <span className="no-attachment-text" style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                No attachment uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PATENTS */}
            {(apd.hasPatent === true || (apd.hasPatent !== false && apd.hasPatent !== null && apd.hasPatent !== undefined && apd.patents?.some(p => (p.type || '').toUpperCase() === 'PATENT'))) && (
              <div className="preview-patents-block" style={{ marginTop: '1.5rem' }}>
                <span className="field-label">Most Significant Patents</span>
                <div className="preview-patents-list">
                  {apd.patents?.filter(p => (p.type || '').toUpperCase() === 'PATENT').map((p, index) => {
                    const filePath = p.attachmentPath || p.AttachmentPath || p.attachment_path || p.path || p.url || p.filePath || p.FilePath || p.file_path || '';
                    const fileName = p.attachmentFileName || p.AttachmentFileName || p.attachment_file_name || p.fileName || p.name || (filePath ? filePath.split('/').pop() : '');
                    return (
                      <div key={p.id || index} className="preview-patent-item">
                        <span className="patent-idx">#{index + 1}</span>
                        <div className="patent-details">
                          <span className="patent-title">{p.title || 'Untitled Patent'}</span>
                          <div className="patent-metadata-row">
                            <span className="meta-badge">Primary Writer: {p.isPrimaryWriter ? 'Yes' : 'No'}</span>
                            {filePath ? (
                              <a href={getFileUrl(filePath)} target="_blank" rel="noreferrer" className="patent-attachment-link">
                                📎 View Attachment ({fileName || 'View Document'}) ↗
                              </a>
                            ) : fileName ? (
                              <span className="no-attachment-text" style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                Attached: {fileName} (No file uploaded)
                              </span>
                            ) : (
                              <span className="no-attachment-text" style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>

                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ATTACHED DOCUMENTS (CV & AUTHENTICATION CERTIFICATE) */}
            <div className="preview-files-row" style={{ marginTop: '1.5rem' }}>
              <div className="preview-data-field">
                <span className="field-label">Curriculum Vitae (CV)</span>
                <span className="field-value">
                  {apd.cvFilePath ? (
                    <a href={getFileUrl(apd.cvFilePath)} target="_blank" rel="noreferrer" className="preview-file-link">
                      📄 View CV Document ↗
                    </a>
                  ) : 'Not uploaded'}
                </span>
              </div>

              <div className="preview-data-field">
                <span className="field-label">Authentication Certificate</span>
                <span className="field-value">
                  {apd.authCertFilePath ? (
                    <a href={getFileUrl(apd.authCertFilePath)} target="_blank" rel="noreferrer" className="preview-file-link">
                      📄 View Certificate ↗
                    </a>
                  ) : 'Not uploaded'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data-text">Application details are not filled yet.</p>
        )}
      </div>
    </div>
  );
};

export default ApplicationPreview;
