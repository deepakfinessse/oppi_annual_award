import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Info, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../../utils/api';
import Captcha from '../../components/Captcha/Captcha';
import oppiLogo from '../../assets/Oppi-logo.png';
import trophyImg from '../../assets/Trophy4.webp';
import arrowIcon from '../../assets/Vector.png';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', captchaAnswer: '' });
  const [captchaTrigger, setCaptchaTrigger] = useState(0);

  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const paramToken = searchParams.get('token');
    if (!paramEmail || !paramToken) {
      setIsLinkInvalid(true);
      setError('Invalid or expired password reset link. Please request a new reset link.');
    } else {
      setEmail(paramEmail);
      setToken(paramToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setFieldErrors({});

    if (isLinkInvalid) {
      setError('Cannot reset password. Please request a new reset link.');
      return;
    }

    const errors = {};
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
      const response = await resetPassword(email, token, newPassword, captchaData.id, captchaData.captchaAnswer);
      setSuccessMsg(response.message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset failed:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('captcha')) {
        setFieldErrors({ captcha: msg });
        setCaptchaTrigger(prev => prev + 1);
      } else {
        setError(msg || 'Failed to reset password. The link may have expired.');
      }
    } finally {
      setIsSubmitting(false);
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
    <div className="login-page reset-password-page">
      {/* Background molecule network pattern */}
      <div className="molecule-network-bg"></div>

      <div className="login-page-container">
        {/* Floating Capsule Header */}
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>
          
          <div className="header-title-section">
            {/* Kept empty for figma spacing alignment */}
          </div>

          <div className="header-logout-section">
            <Link to="/login" className="header-logout-btn text-decoration-none">
              <span className="logout-text-part">BACK TO LOGIN</span>
              <div className="logout-icon-part">
                <img src={arrowIcon} width={16} height={16} alt="" />
              </div>
            </Link>
          </div>
        </header>

        {/* Reset Password Split Card */}
        <div className="login-content-wrapper">
          <div className="login-card">
            {/* Left Image Section */}
            <div className="login-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="login-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="login-form-section">
              <div className="login-header">
                <h2>Reset Password</h2>
                <p>Set a strong new password for your account.</p>
              </div>

              {error && <div className="form-error">{error}</div>}
              {successMsg && <div className="form-success">{successMsg}</div>}

              {!isLinkInvalid && (
                <form onSubmit={handleSubmit} className="login-form" noValidate>
                  <div className="form-group">
                    <label>New Password <span className="required">*</span></label>
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
                    <label>Confirm New Password <span className="required">*</span></label>
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

                <Captcha onChange={setCaptchaData} errors={fieldErrors} trigger={captchaTrigger} />

                  <div className="password-instruction-box">
                    <Info size={16} className="instruction-icon" />
                    <p>
                      Password must contain at least 8 characters, including one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)
                    </p>
                  </div>

                  <div className="form-footer">
                    <button type="submit" className="btn-login" disabled={isSubmitting}>
                      {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
