import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, ArrowRight } from 'lucide-react';
import trophyImg from '../../assets/login-trophy-figma.png';
import oppiLogo from '../../assets/Oppi-logo.png';
import exactFigmaBg from '../../assets/exact-figma-bg.png';
import { register, saveTokens } from '../../utils/api';
import Captcha from '../../components/Captcha/Captcha';
import './Register.css';

const ORGANISATIONS = [
  'AbbVie India',
  'Amgen India',
  'AstraZeneca Pharma India Ltd',
  'Bayer Pharmaceuticals',
  'Boehringer Ingelheim India',
  'Bristol Myers Squibb',
  'Eli Lilly and Company India',
  'GlaxoSmithKline Pharmaceuticals',
  'Janssen India (Johnson & Johnson)',
  'Merck Specialties Pvt Ltd',
  'Novartis Healthcare Pvt Ltd',
  'Novo Nordisk India',
  'Pfizer Limited',
  'Roche Products India Pvt Ltd',
  'Sanofi India Limited',
  'Takeda Biopharmaceuticals India',
  'Viatris India',
  'Other Organisation'
];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: 'Mr',
    firstName: '',
    middleName: '',
    lastName: '',
    organisation: '',
    mobileNumber: '',
    emailId: '',
    createPassword: '',
    confirmPassword: '',
    dob: '2000-01-01',
    gender: 'Male'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState({ id: '', captchaAnswer: '' });
  const [captchaTrigger, setCaptchaTrigger] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobileNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prevState => ({
        ...prevState,
        mobileNumber: digitsOnly
      }));
      if (fieldErrors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required';
    if (!formData.organisation) errors.organisation = 'Organisation is required';
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required';
    } else if (formData.mobileNumber.length !== 10) {
      errors.mobileNumber = 'Mobile Number must be exactly 10 digits';
    }
    if (!formData.emailId.trim()) {
      errors.emailId = 'Email Id is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      errors.emailId = 'Please enter a valid email address';
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formData.createPassword) {
      errors.createPassword = 'Password is required';
    } else if (!passwordRegex.test(formData.createPassword)) {
      errors.createPassword = 'Password does not meet requirements';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required';
    } else if (formData.createPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!captchaData.captchaAnswer || !captchaData.captchaAnswer.trim()) {
      errors.captcha = 'Please complete the reCAPTCHA challenge';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Title: formData.title || '',
        First_Name: formData.firstName,
        Middle_Name: formData.middleName || '',
        Last_Name: formData.lastName,
        Organisation: formData.organisation,
        Email: formData.emailId,
        Mobile: formData.mobileNumber,
        Password: formData.createPassword,
        CaptchaId: captchaData.id,
        CaptchaAnswer: captchaData.captchaAnswer
      };
      const response = await register(payload);
      saveTokens(response);
      navigate('/application');
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('captcha')) {
        setFieldErrors({ captcha: msg });
        setCaptchaTrigger(prev => prev + 1);
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ emailId: msg });
      } else if (msg.toLowerCase().includes('mobile') || msg.toLowerCase().includes('phone')) {
        setFieldErrors({ mobileNumber: msg });
      } else if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.join(', '));
      } else {
        setError(msg || 'An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ backgroundImage: `url(${exactFigmaBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="register-page-container">
        {/* Floating White Capsule Header */}
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>
          <div className="header-logout-section">
            <Link to="/" className="header-back-pill">
              <span>Back to home</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        {/* Register Split Card */}
        <div className="register-content-wrapper">
          <div className="register-card">
            {/* Left Image Section */}
            <div className="register-image-section">
              <img src={trophyImg} alt="OPPI Excellence Award Trophy" className="register-trophy" />
            </div>

            {/* Right Form Section */}
            <div className="register-form-section">
              <div className="register-header">
                <h2>Register</h2>
                <p>
                  Already Registered?{' '}
                  <Link to="/login" className="green-link">
                    Log in
                  </Link>
                </p>
              </div>

              {error && <div className="error-container">{error}</div>}

              <form onSubmit={handleSubmit} className="register-form" noValidate>
                {/* Name */}
                <div className="form-group">
                  <label className="main-field-label">
                    Name <span className="required">*</span>
                  </label>
                  <div className="name-inputs-row">
                    <div className="name-input-container">
                      <input
                        type="text"
                        name="firstName"
                        className={fieldErrors.firstName ? 'input-error' : ''}
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="name-input-container">
                      <input
                        type="text"
                        name="middleName"
                        placeholder="Middle name(optional)"
                        value={formData.middleName}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="name-input-container">
                      <input
                        type="text"
                        name="lastName"
                        className={fieldErrors.lastName ? 'input-error' : ''}
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  {(fieldErrors.firstName || fieldErrors.lastName) && (
                    <div className="name-errors-row">
                      {fieldErrors.firstName && <span className="field-error-msg">{fieldErrors.firstName}</span>}
                      {fieldErrors.lastName && <span className="field-error-msg">{fieldErrors.lastName}</span>}
                    </div>
                  )}
                </div>

                {/* Organisation */}
                <div className="form-group">
                  <label className="main-field-label">
                    Organisation <span className="required">*</span>
                  </label>
                  <div className="select-dropdown-wrapper">
                    <select
                      name="organisation"
                      className={fieldErrors.organisation ? 'input-error' : ''}
                      value={formData.organisation}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    >
                      <option value="">Select your organisation name</option>
                      {ORGANISATIONS.map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.organisation && <span className="field-error-msg">{fieldErrors.organisation}</span>}
                </div>

                {/* Mobile Number & Email Id */}
                <div className="form-row-grid mobile-email-grid">
                  <div className="form-group">
                    <label className="main-field-label">
                      Mobile Number <span className="required">*</span>
                    </label>
                    <div className={`mobile-input-group ${fieldErrors.mobileNumber ? 'input-error' : ''}`}>
                      <div className="country-code-selector">
                        <span className="flag-icon">🇮🇳</span>
                        <span className="code-value">+91</span>
                      </div>
                      <input
                        type="tel"
                        name="mobileNumber"
                        placeholder="00000 00000"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    {fieldErrors.mobileNumber && <span className="field-error-msg">{fieldErrors.mobileNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label className="main-field-label">
                      Email Id <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="emailId"
                      className={fieldErrors.emailId ? 'input-error' : ''}
                      placeholder="clara.rodricks@indiaoppi.com"
                      value={formData.emailId}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.emailId && <span className="field-error-msg">{fieldErrors.emailId}</span>}
                  </div>
                </div>

                {/* Passwords */}
                <div className="form-row-grid password-grid">
                  <div className="form-group">
                    <label className="main-field-label">
                      Create Password <span className="required">*</span>
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        name="createPassword"
                        className={fieldErrors.createPassword ? 'input-error' : ''}
                        placeholder="Create Password"
                        value={formData.createPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        disabled={loading}
                      >
                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.createPassword && <span className="field-error-msg">{fieldErrors.createPassword}</span>}
                  </div>

                  <div className="form-group">
                    <label className="main-field-label">
                      Confirm Password <span className="required">*</span>
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className={fieldErrors.confirmPassword ? 'input-error' : ''}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Password instruction box */}
                <div className="password-instruction-box">
                  <Info size={16} className="instruction-icon" />
                  <p>
                    Password must contain at least 8 characters, including one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)
                  </p>
                </div>

                {/* Captcha & Register Button */}
                <div className="form-row-grid captcha-register-grid">
                  <div className="captcha-wrapper">
                    <Captcha onChange={setCaptchaData} errors={fieldErrors} trigger={captchaTrigger} />
                  </div>
                  <div className="register-btn-wrapper">
                    <button type="submit" className="btn-register" disabled={loading}>
                      {loading ? 'REGISTERING...' : 'REGISTER'}
                    </button>
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

export default Register;