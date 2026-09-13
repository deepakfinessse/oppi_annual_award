import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, saveTokens } from '../../utils/api';
import { Eye, EyeOff } from 'lucide-react';
import trophyImg from '../../assets/login-trophy-figma.png';
import oppiLogo from '../../assets/Oppi-logo.png';
import exactFigmaBg from '../../assets/annual-hero-bg.jpg';
import Captcha from '../../components/Captcha/Captcha';
import './Login.css';
import arrowIcon from '../../assets/Vector.png';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    emailId: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', captchaAnswer: '' });
  const [captchaTrigger, setCaptchaTrigger] = useState(0);

  useEffect(() => {
    const reason = searchParams.get('reason') || searchParams.get('expired');
    if (reason === 'idle') {
      setError('You have been automatically logged out due to inactivity. Please log in again.');
    } else if (reason === 'expired' || reason === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear field error as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.emailId) {
      errors.emailId = 'Email Id is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      errors.emailId = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    if (!captchaData.captchaAnswer || !captchaData.captchaAnswer.trim()) {
      errors.captcha = 'Please complete the reCAPTCHA challenge';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await login(formData.emailId, formData.password, captchaData.id, captchaData.captchaAnswer);
      saveTokens(response);

      const user = response.user;
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'VALIDATOR') {
        navigate('/validator', { replace: true });
      } else if (user.role === 'JURY') {
        navigate('/jury', { replace: true });
      } else if (user.role === 'PANEL_CHAIR') {
        navigate('/panel-chair', { replace: true });
      } else {
        navigate('/application', { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('captcha')) {
        setFieldErrors({ captcha: msg });
        setCaptchaTrigger(prev => prev + 1);
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setFieldErrors({ emailId: msg });
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: msg });
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${exactFigmaBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="login-page-container">
        {/* Floating White Capsule Header */}
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>

          <div className="header-logout-section">
            <Link to="/" className="btn-back-home">
              BACK TO HOME
              <img src={arrowIcon} width={16} height={16} alt="" />
            </Link>
          </div>
        </header>

        {/* Login Split Card */}
        <div className="login-content-wrapper">
          <div className="login-card">
            {/* Left Image Section */}
            <div className="login-image-section">
              <img src={trophyImg} alt="OPPI Excellence Award Trophy" className="login-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="login-form-section">
              <div className="login-header">
                <h2>Log In</h2>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="green-link">
                    Create an account
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="login-form" noValidate>
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label>
                    Email Id <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="emailId"
                    className={fieldErrors.emailId ? 'input-error' : ''}
                    placeholder="Enter your email address"
                    value={formData.emailId}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.emailId && (
                    <span className="field-error-msg">{fieldErrors.emailId}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Password <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={fieldErrors.password ? 'input-error' : ''}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="field-error-msg">{fieldErrors.password}</span>
                  )}
                </div>

                <Captcha onChange={setCaptchaData} errors={fieldErrors} trigger={captchaTrigger} />

                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" id="remember" />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                <div className="form-footer">
                  <button type="submit" className="btn-login" disabled={isSubmitting}>
                    {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
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

export default Login;