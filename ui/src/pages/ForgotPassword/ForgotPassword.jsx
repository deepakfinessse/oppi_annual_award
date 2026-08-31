import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../utils/api';
import Captcha from '../../components/Captcha/Captcha';
import oppiLogo from '../../assets/Oppi-logo.png';
import trophyImg from '../../assets/Trophy4.webp';
import arrowIcon from '../../assets/Vector.png';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [captchaData, setCaptchaData] = useState({ id: '', captchaAnswer: '' });
  const [captchaTrigger, setCaptchaTrigger] = useState(0);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setFieldErrors({});
    setIsSubmitting(true);

    const errors = {};
    if (!email) {
      errors.email = 'Email Id is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!captchaData.captchaAnswer || !captchaData.captchaAnswer.trim()) {
      errors.captcha = 'Please complete the reCAPTCHA challenge';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await forgotPassword(email, captchaData.id, captchaData.captchaAnswer);
      setSuccessMsg(response.message || 'A password reset link has been sent to your email.');
      setEmail('');
    } catch (err) {
      console.error('Request reset link failed:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('captcha')) {
        setFieldErrors({ captcha: msg });
        setCaptchaTrigger(prev => prev + 1);
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setFieldErrors({ email: msg });
      } else {
        setError(msg || 'Failed to request reset link. Please check your email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };

  return (
    <div className="login-page forgot-password-page">
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
            <Link to="/" className="header-logout-btn text-decoration-none">
              <span className="logout-text-part">BACK TO HOME</span>
              <div className="logout-icon-part">
                <img src={arrowIcon} width={16} height={16} alt="" />
              </div>
            </Link>
          </div>
        </header>

        {/* Forgot Password Split Card */}
        <div className="login-content-wrapper">
          <div className="login-card">
            {/* Left Image Section */}
            <div className="login-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="login-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="login-form-section">
              <div className="login-header">
                <h2>Forgot Password</h2>
                <p>Enter your registered email address below, and we'll email you a link to reset your password.</p>
              </div>

              {error && <div className="form-error">{error}</div>}
              {successMsg && <div className="form-success">{successMsg}</div>}

              <form onSubmit={handleRequestOtp} className="login-form" noValidate>
                <div className="form-group">
                  <label>
                    Email Id <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className={fieldErrors.email ? 'input-error' : ''}
                    value={email}
                    onChange={handleEmailChange}
                    required
                    disabled={isSubmitting}
                  />
                  {fieldErrors.email && (
                    <span className="field-error-msg">{fieldErrors.email}</span>
                  )}
                </div>

                <Captcha onChange={setCaptchaData} errors={fieldErrors} trigger={captchaTrigger} />

                <div className="form-footer">
                  <button type="submit" className="btn-login" disabled={isSubmitting}>
                    {isSubmitting ? 'SENDING LINK...' : 'SEND RESET LINK'}
                  </button>
                  <div className="back-to-login">
                    <Link to="/login" className="register-link">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
