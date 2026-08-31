import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Info, Eye, EyeOff } from 'lucide-react';
import { changePassword, getUser } from '../../utils/api';
import Captcha from '../../components/Captcha/Captcha';
import oppiLogo from '../../assets/Oppi-logo.png';
import trophyImg from '../../assets/Trophy4.webp';
import arrowIcon from '../../assets/Vector.png';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', captchaAnswer: '' });
  const [captchaTrigger, setCaptchaTrigger] = useState(0);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'VALIDATOR') return '/validator';
    if (user.role === 'JURY') return '/jury';
    if (user.role === 'PANEL_CHAIR') return '/panel-chair';
    return '/application';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setFieldErrors({});

    const errors = {};
    if (!oldPassword) {
      errors.oldPassword = 'Current Password is required';
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!newPassword) {
      errors.newPassword = 'New Password is required';
    } else if (!passwordRegex.test(newPassword)) {
      errors.newPassword = 'Password does not meet requirements';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm New Password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!captchaData.captchaAnswer || !captchaData.captchaAnswer.trim()) {
      errors.captcha = 'Please complete the reCAPTCHA challenge';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword(oldPassword, newPassword, captchaData.id, captchaData.captchaAnswer);
      setSuccessMsg('Your password has been changed successfully! Redirecting...');
      setTimeout(() => {
        navigate(getDashboardPath());
      }, 2500);
    } catch (err) {
      console.error('Password change failed:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('captcha')) {
        setFieldErrors({ captcha: msg });
        setCaptchaTrigger(prev => prev + 1);
      } else {
        setError(msg || 'Failed to change password. Please check your current password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOldPasswordChange = (e) => {
    setOldPassword(e.target.value);
    if (fieldErrors.oldPassword) {
      setFieldErrors(prev => ({ ...prev, oldPassword: '' }));
    }
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (fieldErrors.newPassword) {
      setFieldErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  return (
    <div className="change-password-page">
      {/* Background molecule network pattern */}
      <div className="molecule-network-bg"></div>

      <div className="change-password-page-container">
        {/* Floating Capsule Header */}
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>

          <div className="header-title-section">
            {/* Kept empty for figma spacing alignment */}
          </div>

          <div className="header-logout-section">
            <Link to={getDashboardPath()} className="header-logout-btn text-decoration-none">
              <span className="logout-text-part">BACK TO DASHBOARD</span>
              <div className="logout-icon-part">
                <img src={arrowIcon} width={16} height={16} alt="" />
              </div>
            </Link>
          </div>
        </header>

        {/* Change Password Split Card */}
        <div className="change-password-content-wrapper">
          <div className="change-password-card">
            {/* Left Image Section */}
            <div className="change-password-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="change-password-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="change-password-form-section">
              <div className="change-password-header">
                <h2>Change Password</h2>
                <p>Update your account password. Make sure to choose a strong password.</p>
              </div>

              <form onSubmit={handleSubmit} className="change-password-form" noValidate>
                {error && <div className="form-error">{error}</div>}
                {successMsg && <div className="form-success">{successMsg}</div>}

                <div className="form-group">
                  <label>
                    Current Password <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className={fieldErrors.oldPassword ? 'input-error' : ''}
                      value={oldPassword}
                      onChange={handleOldPasswordChange}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      disabled={isSubmitting}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.oldPassword && (
                    <span className="field-error-msg">{fieldErrors.oldPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    New Password <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      className={fieldErrors.newPassword ? 'input-error' : ''}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isSubmitting}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <span className="field-error-msg">{fieldErrors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Confirm New Password <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      className={fieldErrors.confirmPassword ? 'input-error' : ''}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span className="field-error-msg">{fieldErrors.confirmPassword}</span>
                  )}
                </div>

                <div className="password-instruction-box">
                  <Info size={13} className="instruction-icon" />
                  <p>
                    Password must contain at least 8 characters, including one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)
                  </p>
                </div>

                <Captcha onChange={setCaptchaData} errors={fieldErrors} trigger={captchaTrigger} />

                <div className="form-actions-row">
                  <button
                    type="button"
                    className="btn-cancel-pwd"
                    onClick={() => navigate(getDashboardPath())}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-login" disabled={isSubmitting}>
                    {isSubmitting ? 'SAVING...' : 'CHANGE PASSWORD'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
