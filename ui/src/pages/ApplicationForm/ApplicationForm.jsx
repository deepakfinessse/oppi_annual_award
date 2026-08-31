import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clearTokens, getHeaders, getUser } from '../../utils/api';
import { FileText, Video, UploadCloud, CheckCircle, X, LogOut, Lock } from 'lucide-react';
import oppiLogo from '../../assets/Oppi-logo.png';
import exactFigmaBg from '../../assets/exact-figma-bg.png';
import Footer from '../../components/Footer/Footer';
import './ApplicationForm.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser());
  const [appId, setAppId] = useState(null);
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

  const [documentFiles, setDocumentFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [appStatus, setAppStatus] = useState('DRAFT');

  useEffect(() => {
    // Fetch my application or initialize
    const loadApplication = async () => {
      try {
        const res = await fetch(`${BASE_URL}/application/mine`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAppId(data.id);
          setAppStatus(data.status || 'DRAFT');

          if (data.user) {
            setCurrentUser(data.user);
            setFormData(prev => ({
              ...prev,
              representativeName: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
              emailId: data.user.email || '',
              mobileNumber: data.user.mobile || '',
              gender: data.user.gender || 'Male',
            }));
          }

          if (data.personal_info) {
            setFormData(prev => ({
              ...prev,
              awardCategory: data.personal_info.award_category || '',
              organisationName: data.personal_info.company_name || '',
              designation: data.personal_info.designation || '',
              briefDescription: data.personal_info.company_brief || '',
            }));
          }

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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const handleSaveDraft = async () => {
    if (!appId) return;
    setIsSavingDraft(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${BASE_URL}/application/save/${appId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });
      if (res.ok) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.awardCategory) {
      setMessage({ type: 'error', text: 'Please select an Award Category.' });
      return;
    }
    if (!formData.organisationName || !formData.representativeName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // First save details
      await fetch(`${BASE_URL}/application/save/${appId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      // Submit application
      const res = await fetch(`${BASE_URL}/application/submit/${appId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (res.ok) {
        setAppStatus('SUBMITTED');
        setMessage({ type: 'success', text: 'Your application has been submitted successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to submit application.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error submitting application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (section, files) => {
    if (!appId || !files || files.length === 0) return;
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
    <div className="application-page" style={{ backgroundImage: `url(${exactFigmaBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
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
          <h1 className="app-page-title">Application</h1>
        </div>

        {/* Form Card */}
        <div className="application-card">
          <div className="card-header">
            <h2>Fill in your details</h2>
            <div className="autofill-notice">
              All details entered during registration will be auto-filled. Please verify and complete the remaining fields.
            </div>
          </div>

          {message.text && (
            <div className={`alert-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="application-form">
            {/* Row 1: Award Category */}
            <div className="form-group full-width">
              <label>
                Award Category <span className="required">*</span>
              </label>
              <select
                name="awardCategory"
                value={formData.awardCategory}
                onChange={handleChange}
                disabled={appStatus === 'SUBMITTED'}
                required
              >
                <option value="">Choose a category</option>
                <option value="OPPI Scientist Award">OPPI Scientist Award</option>
                <option value="OPPI Young Scientist Award">OPPI Young Scientist Award</option>
                <option value="OPPI Special Award for Women Scientist">OPPI Special Award for Women Scientist</option>
                <option value="OPPI Innovation Award">OPPI Innovation Award</option>
              </select>
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
                  placeholder="Enter your registered organisation name"
                  value={formData.organisationName}
                  onChange={handleChange}
                  disabled={appStatus === 'SUBMITTED'}
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
                  placeholder="Enter representative name"
                  value={formData.representativeName}
                  onChange={handleChange}
                  disabled={appStatus === 'SUBMITTED'}
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
                  placeholder="Enter representative designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={appStatus === 'SUBMITTED'}
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
                      disabled={appStatus === 'SUBMITTED'}
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
                      disabled={appStatus === 'SUBMITTED'}
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
                      disabled={appStatus === 'SUBMITTED'}
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
                  placeholder="example@email.com"
                  value={formData.emailId}
                  onChange={handleChange}
                  disabled
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
                  placeholder="+91 90000 00000"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  disabled
                  required
                />
              </div>
            </div>

            {/* Row 5: Brief Description */}
            <div className="form-group full-width">
              <label>Brief Description</label>
              <textarea
                name="briefDescription"
                placeholder="Maximum 500 words"
                rows={4}
                value={formData.briefDescription}
                onChange={handleChange}
                disabled={appStatus === 'SUBMITTED'}
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
                    disabled={appStatus === 'SUBMITTED'}
                  />
                </div>
                <div className="upload-requirements">
                  <p className="req-title">Requirements:</p>
                  <p>• Format: PDF, DOC</p>
                  <p>• Max Size: 5 MB</p>
                </div>
              </div>

              {documentFiles.length > 0 && (
                <div className="attached-files-list">
                  {documentFiles.map((file, idx) => (
                    <div key={file.Id || file.id || idx} className="file-item-card">
                      <div className="file-info-left">
                        <FileText size={18} className="file-type-icon" />
                        <span className="file-name">{file.FileName || file.fileName || 'image.pdf'}</span>
                        <span className="file-size">({(file.FileSize ? file.FileSize / (1024 * 1024) : 1.2).toFixed(1)} MB)</span>
                      </div>
                      <div className="file-actions-right">
                        <CheckCircle size={18} className="file-check-icon" />
                        {appStatus !== 'SUBMITTED' && (
                          <button
                            type="button"
                            className="btn-delete-file"
                            onClick={() => handleDeleteFile('document', file.Id || file.id)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                    disabled={appStatus === 'SUBMITTED'}
                  />
                </div>
                <div className="upload-requirements">
                  <p className="req-title">Requirements:</p>
                  <p>• Format: MP4, MOV, WEBM</p>
                  <p>• Max Size: 50 MB</p>
                </div>
              </div>

              {videoFiles.length > 0 && (
                <div className="attached-files-list">
                  {videoFiles.map((file, idx) => (
                    <div key={file.Id || file.id || idx} className="file-item-card">
                      <div className="file-info-left">
                        <Video size={18} className="file-type-icon" />
                        <span className="file-name">{file.FileName || file.fileName || 'video.mp4'}</span>
                        <span className="file-size">({(file.FileSize ? file.FileSize / (1024 * 1024) : 42.5).toFixed(1)} MB)</span>
                      </div>
                      <div className="file-actions-right">
                        <CheckCircle size={18} className="file-check-icon" />
                        {appStatus !== 'SUBMITTED' && (
                          <button
                            type="button"
                            className="btn-delete-file"
                            onClick={() => handleDeleteFile('video', file.Id || file.id)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            {appStatus !== 'SUBMITTED' ? (
              <div className="form-actions-footer">
                <button
                  type="button"
                  className="btn-save-draft"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="submit"
                  className="btn-submit-app"
                  disabled={isSubmitting || isSavingDraft}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
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
      </div>
      <Footer />
    </div>
  );
};

export default ApplicationForm;
