import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { clearTokens, getHeaders, getUser, getFileUrl } from '../../utils/api';
import {
  FileText,
  Video,
  UploadCloud,
  CheckCircle,
  X,
  LogOut,
  Lock,
  ChevronDown,
  Check,
  Download,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';
import oppiLogo from '../../assets/Oppi-logo.png';
import exactFigmaBg from '../../assets/exact-figma-bg.png';
import Footer from '../../components/Footer/Footer';
import './ApplicationForm.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const AWARD_CATEGORIES = [
  'OPPI Marketing Excellence Awards - Existing Pharma Product',
  'OPPI Marketing Excellence Awards - New Pharma Product',
  'OPPI Sales Force Excellence Award',
  'OPPI HR Award - HR Excellence Award',
  'OPPI HR Award - D&I Award',
  'OPPI Healthcare Communications Award',
  'OPPI Medical Excellence Award',
  'OPPI Sustainability Excellence Award',
  'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
];

const normalizeCategory = (cat) => {
  if (!cat) return '';
  const trimmed = cat.trim();
  if (AWARD_CATEGORIES.includes(trimmed)) return trimmed;

  const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetClean = clean(trimmed);

  // Exact alphanumeric match
  const exact = AWARD_CATEGORIES.find(c => clean(c) === targetClean);
  if (exact) return exact;

  // Substring match
  const partial = AWARD_CATEGORIES.find(c => {
    const cClean = clean(c);
    return cClean.includes(targetClean) || targetClean.includes(cClean);
  });
  if (partial) return partial;

  // Keyword-based heuristics
  if (targetClean.includes('existing')) {
    return 'OPPI Marketing Excellence Awards - Existing Pharma Product';
  }
  if (targetClean.includes('newproduct') || targetClean.includes('newpharma')) {
    return 'OPPI Marketing Excellence Awards - New Pharma Product';
  }
  if (targetClean.includes('salesforce') || targetClean.includes('sales')) {
    return 'OPPI Sales Force Excellence Award';
  }
  if (targetClean.includes('hrexcellence')) {
    return 'OPPI HR Award - HR Excellence Award';
  }
  if (targetClean.includes('diversity') || targetClean.includes('di') || targetClean.includes('inclusion')) {
    return 'OPPI HR Award - D&I Award';
  }
  if (targetClean.includes('communication') || targetClean.includes('healthcarecomm')) {
    return 'OPPI Healthcare Communications Award';
  }
  if (targetClean.includes('medicalexcellence') || targetClean.includes('medical')) {
    return 'OPPI Medical Excellence Award';
  }
  if (targetClean.includes('sustainability')) {
    return 'OPPI Sustainability Excellence Award';
  }
  if (targetClean.includes('patientcentricity') || targetClean.includes('ranjitshahani')) {
    return 'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity';
  }

  return trimmed;
};

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryAppId = searchParams.get('appId');

  const [currentUser, setCurrentUser] = useState(getUser());
  const [appId, setAppId] = useState(queryAppId ? parseInt(queryAppId, 10) : null);
  const [formData, setFormData] = useState({
    awardCategory: '',
    organisationName: '',
    representativeName: '',
    designation: '',
    gender: 'Male',
    emailId: '',
    mobileNumber: '',
    briefDescription: '',
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [documentFiles, setDocumentFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [appStatus, setAppStatus] = useState('DRAFT');
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'preview'
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isReadOnly = appStatus === 'SUBMITTED' && !isAdmin;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch application data
    const loadApplication = async () => {
      try {
        const endpoint = queryAppId
          ? `${BASE_URL}/application/${queryAppId}`
          : `${BASE_URL}/application/mine`;

        const res = await fetch(endpoint, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAppId(data.id);
          const currentStatus = data.status || 'DRAFT';
          setAppStatus(currentStatus);

          // If already submitted and not admin in edit mode, open directly in preview mode
          if (currentStatus === 'SUBMITTED' && !isAdmin) {
            setViewMode('preview');
          } else {
            setViewMode('form');
          }

          if (data.user && !queryAppId) {
            setCurrentUser(data.user);
          }

          const repName = data.personal_info?.representative_name ||
            (data.user ? `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() : '');

          const rawCat = data.personal_info?.award_category || '';
          const matchedCategory = normalizeCategory(rawCat);

          setFormData({
            awardCategory: matchedCategory,
            organisationName: data.personal_info?.company_name || data.user?.organisation || '',
            representativeName: repName,
            designation: data.personal_info?.designation || '',
            gender: data.user?.gender || 'Male',
            emailId: data.user?.email || '',
            mobileNumber: data.user?.mobile || '',
            briefDescription: data.personal_info?.company_brief || '',
          });

          if (data.file_uploads) {
            const docs = data.file_uploads.filter(f => f.Section === 'document' || f.section === 'document');
            const vids = data.file_uploads.filter(f => f.Section === 'video' || f.section === 'video');
            setDocumentFiles(docs);
            setVideoFiles(vids);
          }
        }
      } catch (err) {
        console.error('Failed to load application:', err);
      }
    };

    loadApplication();
  }, [queryAppId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const saveApplicationData = async () => {
    if (!appId) return false;
    const res = await fetch(`${BASE_URL}/application/save/${appId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(formData),
    });
    return res.ok;
  };

  const handleSaveDraft = async () => {
    if (!appId) return;
    setIsSavingDraft(true);
    setMessage({ type: '', text: '' });
    try {
      const ok = await saveApplicationData();
      if (ok) {
        setMessage({ type: 'success', text: 'Application saved as draft successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save draft. Please try again.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Validates form and switches to Preview mode
  const handleGoToPreview = async (e) => {
    if (e) e.preventDefault();

    if (!formData.awardCategory) {
      setMessage({ type: 'error', text: 'Please select an Award Category.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.organisationName?.trim()) {
      setMessage({ type: 'error', text: 'Please enter Organisation Name.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.representativeName?.trim()) {
      setMessage({ type: 'error', text: 'Please enter Representative Name.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.designation?.trim()) {
      setMessage({ type: 'error', text: 'Please enter Designation.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.briefDescription?.trim()) {
      setMessage({ type: 'error', text: 'Please provide a Brief Description.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (documentFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please upload at least one required Document (PDF).' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setMessage({ type: '', text: '' });
    setIsSavingDraft(true);

    try {
      await saveApplicationData();
      setViewMode('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving before preview:', err);
      setViewMode('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Save & Exit handler from preview
  const handleSaveAndExit = async () => {
    if (!appId) return;
    setIsSavingAndExiting(true);
    setMessage({ type: '', text: '' });
    try {
      const ok = await saveApplicationData();
      if (ok) {
        setMessage({ type: 'success', text: 'Application saved successfully. Exiting...' });
        setTimeout(() => {
          navigate(isAdmin ? '/admin' : '/');
        }, 1200);
      } else {
        setMessage({ type: 'error', text: 'Failed to save application.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsSavingAndExiting(false);
    }
  };

  // Final submit & exit handler
  const handleSubmitAndExit = async () => {
    if (!appId) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Ensure latest data is saved first
      await saveApplicationData();

      // Submit application
      const res = await fetch(`${BASE_URL}/application/submit/${appId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (res.ok) {
        setAppStatus('SUBMITTED');
        setShowSubmitModal(true);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to submit application.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error submitting application.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Application Form (ZIP)
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Formatted application summary HTML
      const summaryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OPPI Annual Awards - Application Dossier</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 40px; line-height: 1.6; }
    .header { border-bottom: 3px solid #009be3; padding-bottom: 12px; margin-bottom: 24px; }
    h1 { color: #009be3; font-size: 24px; margin: 0 0 6px 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    .section-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13.5px; }
    th { background: #f8fafc; color: #0f172a; width: 32%; }
    td { color: #334155; }
    .desc-content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; white-space: pre-wrap; font-size: 13.5px; color: #334155; margin-top: 8px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Organisation of Pharmaceutical Producers of India (OPPI)</h1>
    <p class="subtitle">OPPI Annual Awards Nomination Dossier • Application #${appId || ''}</p>
  </div>

  <div class="section-box">
    <div class="section-title">Nomination Information</div>
    <table>
      <tr><th>Award Category</th><td><strong>${formData.awardCategory || '—'}</strong></td></tr>
      <tr><th>Organisation Name</th><td>${formData.organisationName || '—'}</td></tr>
      <tr><th>Representative Name</th><td>${formData.representativeName || '—'}</td></tr>
      <tr><th>Designation</th><td>${formData.designation || '—'}</td></tr>
      <tr><th>Gender</th><td>${formData.gender || '—'}</td></tr>
      <tr><th>Email Id</th><td>${formData.emailId || '—'}</td></tr>
      <tr><th>Mobile number</th><td>${formData.mobileNumber || '—'}</td></tr>
      <tr><th>Application Status</th><td><strong>${appStatus || 'DRAFT'}</strong></td></tr>
    </table>
  </div>

  <div class="section-box">
    <div class="section-title">Brief Description</div>
    <div class="desc-content">${formData.briefDescription || 'No description provided.'}</div>
  </div>

  <div class="section-box">
    <div class="section-title">Attached Supporting Files</div>
    <table>
      <thead>
        <tr><th>Type</th><th>File Name</th></tr>
      </thead>
      <tbody>
        ${documentFiles.map(d => `<tr><td>Document</td><td>${d.FileName || d.fileName || 'document.pdf'}</td></tr>`).join('')}
        ${videoFiles.map(v => `<tr><td>Video</td><td>${v.FileName || v.fileName || 'video.mp4'}</td></tr>`).join('')}
        ${documentFiles.length === 0 && videoFiles.length === 0 ? '<tr><td colspan="2">No files attached</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST • OPPI Annual Awards
  </div>
</body>
</html>`;

      zip.file("Application_Summary.html", summaryHtml);

      // Download and bundle attached documents and videos
      const allFiles = [
        ...documentFiles.map(f => ({ ...f, folder: 'Documents' })),
        ...videoFiles.map(f => ({ ...f, folder: 'Videos' }))
      ];

      for (const file of allFiles) {
        const fUrl = getFileUrl(file.FilePath || file.filePath);
        const fName = file.FileName || file.fileName || `file_${file.Id || '1'}`;
        if (fUrl) {
          try {
            const resp = await fetch(fUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              zip.file(`${file.folder}/${fName}`, blob);
            }
          } catch (err) {
            console.warn(`Could not add ${fName} to zip:`, err);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const safeOrg = (formData.organisationName || 'OPPI_Nomination').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `OPPI_Application_${safeOrg}_App${appId || ''}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Could not download ZIP. Please try again.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleFileUpload = async (section, files) => {
    if (!appId || !files || files.length === 0) return;

    const maxSizeBytes = section === 'video' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxMB = section === 'video' ? 10 : 5;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSizeBytes) {
        alert(`File "${files[i].name}" exceeds the maximum allowed size of ${maxMB} MB.`);
        return;
      }
    }

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('files', files[i]);
    }

    try {
      const res = await fetch(`${BASE_URL}/application/upload/${appId}/${section}`, {
        method: 'POST',
        headers: getHeaders(false),
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        if (section === 'document') {
          setDocumentFiles(prev => [...prev, ...data.files]);
        } else {
          setVideoFiles(prev => [...prev, ...data.files]);
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    }
  };

  const handleDeleteFile = async (section, fileId) => {
    try {
      const res = await fetch(`${BASE_URL}/application/upload/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        if (section === 'document') {
          setDocumentFiles(prev => prev.filter(f => f.Id !== fileId && f.id !== fileId));
        } else {
          setVideoFiles(prev => prev.filter(f => f.Id !== fileId && f.id !== fileId));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="application-page"
      style={{
        backgroundImage: `url(${exactFigmaBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="application-page-container">
        {/* Floating Capsule Header */}
        <header className="app-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>

          <div className="header-actions">
            <Link to="/change-password" className="btn-header-pill btn-change-pwd">
              <Lock size={15} />
              <span>CHANGE PASSWORD</span>
            </Link>
            <button onClick={handleLogout} className="btn-header-pill btn-logout">
              <span>LOG OUT</span>
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page Title */}
        <div className="app-page-title-section">
          <h1 className="app-page-title">
            {viewMode === 'preview' ? '' : 'Application'}
          </h1>
        </div>

        {/* ============================================================ */}
        {/* PREVIEW AND SUBMIT VIEW (Exact Figma Design) */}
        {/* ============================================================ */}
        {viewMode === 'preview' ? (
          <div className="application-card preview-card-figma">
            {/* Header row matching Figma */}
            <div className="preview-header-row">
              <div className="preview-title-group">
                <h2 className="preview-main-heading">Preview and Submit</h2>
                <p className="preview-sub-heading">
                  This is just the preview of your application. Check for any errors as you can not make changes after “Submit”
                </p>
              </div>
              <button
                type="button"
                className="btn-download-zip"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
              >
                <Download size={16} />
                <span>{isDownloadingZip ? 'DOWNLOADING...' : 'DOWNLOAD APPLICATION FORM(ZIP)'}</span>
              </button>
            </div>

            {message.text && (
              <div className={`alert-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Inner Bordered Box matching Figma */}
            <div className="preview-details-box">
              {/* Category Header */}
              <div className="preview-category-header">
                <span className="preview-category-label">Category:</span>
                <span className="preview-category-value">{formData.awardCategory || 'Category name'}</span>
              </div>

              <div className="preview-box-divider"></div>

              {/* Two Column Grid */}
              <div className="preview-grid-two-cols">
                <div className="preview-col">
                  <div className="preview-item">
                    <span className="preview-item-label">Organisation Name</span>
                    <span className="preview-item-value">{formData.organisationName || '—'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-item-label">Representative Name</span>
                    <span className="preview-item-value">{formData.representativeName || '—'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-item-label">Designation</span>
                    <span className="preview-item-value">{formData.designation || '—'}</span>
                  </div>
                </div>

                <div className="preview-col">
                  <div className="preview-item">
                    <span className="preview-item-label">Mobile number</span>
                    <span className="preview-item-value">{formData.mobileNumber || '—'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-item-label">Email Id</span>
                    <span className="preview-item-value">{formData.emailId || '—'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-item-label">Gender</span>
                    <span className="preview-item-value">{formData.gender || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Brief Description */}
              <div className="preview-desc-section">
                <label className="preview-desc-label">
                  Brief Description <span className="required">*</span>
                </label>
                <div className="preview-desc-content">
                  {formData.briefDescription || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Attached Files Section */}
            <div className="preview-attached-files-section">
              <h3 className="preview-files-heading">Attached Files</h3>
              <div className="preview-files-list">
                {documentFiles.length === 0 && videoFiles.length === 0 ? (
                  <div className="preview-no-files">No files attached.</div>
                ) : (
                  <>
                    {documentFiles.map((file, idx) => (
                      <div key={file.Id || file.id || `doc-${idx}`} className="preview-file-row">
                        <span className="preview-file-type">Document</span>
                        <span className="preview-file-name" title={file.FileName || file.fileName}>
                          {file.FileName || file.fileName || 'document.pdf'}
                        </span>
                        <button
                          type="button"
                          className="btn-view-file"
                          onClick={() => window.open(getFileUrl(file.FilePath || file.filePath), '_blank')}
                        >
                          View File
                        </button>
                      </div>
                    ))}
                    {videoFiles.map((file, idx) => (
                      <div key={file.Id || file.id || `vid-${idx}`} className="preview-file-row">
                        <span className="preview-file-type">Video</span>
                        <span className="preview-file-name" title={file.FileName || file.fileName}>
                          {file.FileName || file.fileName || 'video.mp4'}
                        </span>
                        <button
                          type="button"
                          className="btn-view-file"
                          onClick={() => window.open(getFileUrl(file.FilePath || file.filePath), '_blank')}
                        >
                          View File
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            {!isReadOnly ? (
              <div className="preview-actions-footer">
                <button
                  type="button"
                  className="btn-preview-back"
                  onClick={() => {
                    setViewMode('form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={isSubmitting || isSavingAndExiting}
                >
                  <ArrowLeft size={16} />
                  <span>Edit Application</span>
                </button>

                <div className="preview-actions-right">
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-preview-back"
                      onClick={() => navigate('/admin')}
                      style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                    >
                      Exit to Admin
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-preview-save-exit"
                    onClick={handleSaveAndExit}
                    disabled={isSubmitting || isSavingAndExiting}
                  >
                    {isSavingAndExiting ? 'Saving & Exiting...' : 'Save & Exit'}
                  </button>
                  <button
                    type="button"
                    className="btn-preview-submit-exit"
                    onClick={handleSubmitAndExit}
                    disabled={isSubmitting || isSavingAndExiting}
                  >
                    {isSubmitting ? 'Submitting...' : (isAdmin ? 'Submit / Update & Exit' : 'Submit & Exit')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="preview-submitted-banner">
                <CheckCircle2 size={24} className="text-success" />
                <div className="submitted-banner-text">
                  <strong>Application Submitted Successfully</strong>
                  <span>Your application is locked and under review by the jury. You can download the full application archive above.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* APPLICATION FORM VIEW (Edit / Draft Mode) */
          /* ============================================================ */
          <div className="application-card">
            {isAdmin && queryAppId && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#92400e',
                fontWeight: 500
              }}>
                <div>
                  <strong>Admin Mode:</strong> Editing Application #{queryAppId} &bull; Status: <strong>{appStatus}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={{
                    background: '#92400e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Exit to Admin Dashboard
                </button>
              </div>
            )}
            <div className="card-header">
              <h2>Fill in your details</h2>
              <p className="card-subtitle">
                All details entered during registration will be auto-filled. Please verify and complete the remaining fields.
              </p>
            </div>

            {message.text && (
              <div className={`alert-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleGoToPreview} className="application-form">
              {/* Row 1: Award Category */}
              <div className="form-group full-width">
                <label>
                  Award Category <span className="required">*</span>
                </label>
                <div className="custom-category-dropdown" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className={`dropdown-trigger-box ${formData.awardCategory ? 'has-selection' : ''} ${isCategoryDropdownOpen ? 'open' : ''}`}
                    onClick={() => !isReadOnly && setIsCategoryDropdownOpen(prev => !prev)}
                    disabled={isReadOnly}
                  >
                    <span className="dropdown-trigger-label">
                      {formData.awardCategory || 'Choose a category'}
                    </span>
                    <ChevronDown size={18} className={`dropdown-arrow-icon ${isCategoryDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="dropdown-options-menu">
                      {AWARD_CATEGORIES.map((cat, idx) => {
                        const isSelected = formData.awardCategory === cat;
                        return (
                          <div
                            key={idx}
                            className={`dropdown-option-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, awardCategory: cat }));
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <span className="dropdown-option-text">{cat}</span>
                            {isSelected && <Check size={16} className="dropdown-check-icon" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Organisation & Representative Name */}
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>
                    Organisation Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="organisationName"
                    placeholder="enter your registered organisation name"
                    value={formData.organisationName}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Representative Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="representativeName"
                    placeholder="enter representative name"
                    value={formData.representativeName}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Designation & Gender */}
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>
                    Designation <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="designation"
                    placeholder="enter representative designation"
                    value={formData.designation}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Gender <span className="required">*</span>
                  </label>
                  <div className="radio-options-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={handleChange}
                        disabled={isReadOnly}
                      />
                      <span>Male</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={handleChange}
                        disabled={isReadOnly}
                      />
                      <span>Female</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="Others"
                        checked={formData.gender === 'Others'}
                        onChange={handleChange}
                        disabled={isReadOnly}
                      />
                      <span>Others</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 4: Email & Mobile Number */}
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>
                    Email Id <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="emailId"
                    placeholder="example@mail.com"
                    value={formData.emailId}
                    onChange={handleChange}
                    disabled={isReadOnly && !isAdmin}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Mobile Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="+91 00000 00000"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    disabled={isReadOnly && !isAdmin}
                    required
                  />
                </div>
              </div>

              {/* Row 5: Brief Description */}
              <div className="form-group full-width">
                <label>
                  Brief Description <span className="required">*</span>
                </label>
                <textarea
                  name="briefDescription"
                  placeholder="Maximum 500 words"
                  rows={4}
                  value={formData.briefDescription}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  required
                ></textarea>
              </div>

              {/* Upload Document Section */}
              <div className="form-group full-width upload-section-block">
                <label>
                  Upload Document <span className="required">*</span>
                </label>
                <div className="upload-container-split">
                  <div className="upload-dropzone">
                    <FileText className="upload-icon-large" size={38} />
                    <p>Drop your Document here, or <span className="browse-text">browse</span></p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload('document', e.target.files)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="upload-requirements">
                    <p className="req-title">Requirement</p>
                    <p>• Format: PDF only</p>
                    <p>• Size: Upto 5 mb</p>
                  </div>
                </div>

                {documentFiles.length > 0 && (
                  <div className="attached-files-list">
                    {documentFiles.map((file, idx) => {
                      const sizeMb = file.FileSize ? (file.FileSize / (1024 * 1024)).toFixed(1) : '1.2';
                      return (
                        <div key={file.Id || file.id || idx} className="file-item-card">
                          <div className="file-item-main">
                            <div className="file-info-left">
                              <FileText size={20} className="file-type-icon" />
                              <div className="file-name-meta">
                                <span className="file-name">{file.FileName || file.fileName || 'image.pdf'}</span>
                                <span className="file-size-sub">{sizeMb} MB</span>
                              </div>
                            </div>
                            <div className="file-actions-right">
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn-delete-file"
                                  onClick={() => handleDeleteFile('document', file.Id || file.id)}
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <CheckCircle size={18} className="file-check-icon" />
                            </div>
                          </div>
                          <div className="file-progress-track">
                            <div className="file-progress-fill"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upload Video Section */}
              <div className="form-group full-width upload-section-block">
                <label>Upload Video</label>
                <div className="upload-container-split">
                  <div className="upload-dropzone">
                    <Video className="upload-icon-large" size={38} />
                    <p>Drop your Video here, or <span className="browse-text">browse</span></p>
                    <input
                      type="file"
                      accept=".mp4,.mov,.webm"
                      onChange={(e) => handleFileUpload('video', e.target.files)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="upload-requirements">
                    <p className="req-title">Requirement</p>
                    <p>• Format: mp4, mov only</p>
                    <p>• Size: Upto 10 mb</p>
                  </div>
                </div>

                {videoFiles.length > 0 && (
                  <div className="attached-files-list">
                    {videoFiles.map((file, idx) => {
                      const sizeMb = file.FileSize ? (file.FileSize / (1024 * 1024)).toFixed(1) : '1.2';
                      return (
                        <div key={file.Id || file.id || idx} className="file-item-card">
                          <div className="file-item-main">
                            <div className="file-info-left">
                              <Video size={20} className="file-type-icon" />
                              <div className="file-name-meta">
                                <span className="file-name">{file.FileName || file.fileName || 'video.mp4'}</span>
                                <span className="file-size-sub">{sizeMb} MB</span>
                              </div>
                            </div>
                            <div className="file-actions-right">
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn-delete-file"
                                  onClick={() => handleDeleteFile('video', file.Id || file.id)}
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <CheckCircle size={18} className="file-check-icon" />
                            </div>
                          </div>
                          <div className="file-progress-track">
                            <div className="file-progress-fill"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Form Actions */}
              {!isReadOnly ? (
                <div className="form-actions-footer">
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-back-admin"
                      onClick={() => navigate('/admin')}
                      style={{
                        marginRight: 'auto',
                        padding: '10px 18px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to Admin
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-save-draft"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                  >
                    {isSavingDraft ? 'Saving...' : (isAdmin ? 'Save Changes' : 'Save as Draft')}
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-app"
                    disabled={isSavingDraft}
                  >
                    {isAdmin ? 'Save & Review' : 'Submit'}
                  </button>
                </div>
              ) : (
                <div className="submitted-notice">
                  <CheckCircle size={20} />
                  <span>Your application has been submitted and is currently under review.</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Submission Success Modal */}
      {showSubmitModal && (
        <div className="submission-modal-backdrop">
          <div className="submission-modal-box">
            <div className="submission-modal-icon">
              <CheckCircle2 size={54} color="#16a34a" />
            </div>
            <h3 className="submission-modal-title">Application Submitted Successfully!</h3>
            <p className="submission-modal-desc">
              Thank you for submitting your nomination. Your application is now locked and under review by the jury panel. A confirmation email has also been sent to your registered email address.
            </p>
            <div className="submission-modal-actions">
              <button
                type="button"
                className="btn-modal-download"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
              >
                <Download size={16} />
                <span>{isDownloadingZip ? 'Downloading...' : 'Download Form (ZIP)'}</span>
              </button>
              <button
                type="button"
                className="btn-modal-exit"
                onClick={() => {
                  setShowSubmitModal(false);
                  navigate(isAdmin ? '/admin' : '/');
                }}
              >
                {isAdmin ? 'Exit to Admin' : 'Exit to Home'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ApplicationForm;
