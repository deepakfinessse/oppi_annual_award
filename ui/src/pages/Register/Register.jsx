import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Info, Eye, EyeOff } from 'lucide-react';
import trophyImg from '../../assets/Trophy4.webp';
import oppiLogo from '../../assets/Oppi-logo.png';
import { register, saveTokens } from '../../utils/api';
import arrowIcon from '../../assets/Vector.png';
import Captcha from '../../components/Captcha/Captcha';
import './Register.css';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
].map((m, i) => ({ label: m, value: String(i + 1).padStart(2, '0') }));
const YEARS = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - i));

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    mobileNumber: '',
    emailId: '',
    createPassword: '',
    confirmPassword: '',
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

    if (name === 'dobDay' || name === 'dobMonth' || name === 'dobYear') {
      if (fieldErrors.dob) {
        setFieldErrors(prev => ({ ...prev, dob: '' }));
      }
    } else if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.firstName.trim()) errors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required';
    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) errors.dob = 'Date of Birth is required';
    if (!formData.gender) errors.gender = 'Gender is required';
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
      const dobStr = formData.dobYear && formData.dobMonth && formData.dobDay
        ? `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`
        : '';
      const payload = {
        Title: formData.title,
        First_Name: formData.firstName,
        Middle_Name: formData.middleName || '',
        Last_Name: formData.lastName,
        Dob: dobStr,
        Gender: formData.gender,
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
    <div className="register-page">
      <div className="register-page-container">
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>
          <div className="header-title-section" />
          <div className="header-logout-section">
            <Link to="/" className="header-logout-btn text-decoration-none">
              <span className="logout-text-part">BACK TO HOME</span>
              <div className="logout-icon-part">
                <img src={arrowIcon} width={16} height={16} alt="" />
              </div>
            </Link>
          </div>
        </header>

        <div className="register-content-wrapper">
          <div className="register-card">
            <div className="register-image-section">
              <img src={trophyImg} alt="OPPI Excellence in Innovation Award" className="register-trophy" />
            </div>

            <div className="register-form-section">
              <div className="register-header">
                <h2>Register</h2>
                <p>
                  Already Registered?{' '}
                  <Link to="/login" className="login-link">
                    Log in
                  </Link>
                </p>
              </div>

              {error && <div className="error-container">{error}</div>}

              <form onSubmit={handleSubmit} className="register-form" noValidate>
                {/* Row 1: Name (Title, First, Middle, Last) */}
                <div className="form-group name-group-wrapper">
                  <label className="main-field-label">Name <span className="required">*</span></label>
                  <div className="name-inputs-row">
                    <div className="title-select-container">
                      <select
                        name="title"
                        className={fieldErrors.title ? 'input-error' : ''}
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      >
                        <option value="" disabled>Select</option>
                        {['Mr', 'Miss', 'Mrs', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
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
                        placeholder="Middle name"
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
                  {/* Error messages row */}
                  {(fieldErrors.title || fieldErrors.firstName || fieldErrors.lastName) && (
                    <div className="name-errors-row">
                      {fieldErrors.title && <span className="field-error-msg">{fieldErrors.title}</span>}
                      {fieldErrors.firstName && <span className="field-error-msg">{fieldErrors.firstName}</span>}
                      {fieldErrors.lastName && <span className="field-error-msg">{fieldErrors.lastName}</span>}
                    </div>
                  )}
                </div>

                {/* Row 2: DOB and Gender */}
                <div className="form-row-grid dob-gender-grid">
                  <div className="form-group dob-form-group">
                    <label className="main-field-label">Date of Birth <span className="required">*</span></label>
                    <div className="dob-selects">
                      <select name="dobDay" value={formData.dobDay} onChange={handleChange} disabled={loading}>
                        <option value="" disabled>DD</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select name="dobMonth" value={formData.dobMonth} onChange={handleChange} disabled={loading}>
                        <option value="" disabled>MM</option>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <select name="dobYear" value={formData.dobYear} onChange={handleChange} disabled={loading}>
                        <option value="" disabled>YYYY</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    {fieldErrors.dob && <span className="field-error-msg">{fieldErrors.dob}</span>}
                  </div>

                  <div className="form-group gender-form-group">
                    <label className="main-field-label">Gender <span className="required">*</span></label>
                    <select
                      name="gender"
                      className={fieldErrors.gender ? 'input-error' : ''}
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    >
                      <option value="" disabled>Select</option>
                      {['Male', 'Female'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {fieldErrors.gender && <span className="field-error-msg">{fieldErrors.gender}</span>}
                  </div>
                </div>

                {/* Row 3: Mobile Number and Email Id */}
                <div className="form-row-grid mobile-email-grid">
                  <div className="form-group mobile-form-group">
                    <label className="main-field-label">Mobile Number <span className="required">*</span></label>
                    <div className={`mobile-input-group ${fieldErrors.mobileNumber ? 'input-error' : ''}`}>
                      <div className="country-code-selector">
                        {/* <span className="flag-icon">🇮🇳</span> */}
                        <span className="code-value">+91</span>
                        <span className="dropdown-arrow-mini">▼</span>
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

                  <div className="form-group email-form-group">
                    <label className="main-field-label">Email Id <span className="required">*</span></label>
                    <input
                      type="email"
                      name="emailId"
                      className={fieldErrors.emailId ? 'input-error' : ''}
                      placeholder="youremail@gmail.com"
                      value={formData.emailId}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.emailId && <span className="field-error-msg">{fieldErrors.emailId}</span>}
                  </div>
                </div>

                {/* Row 4: Passwords */}
                <div className="form-row-grid password-grid">
                  <div className="form-group password-form-group">
                    <label className="main-field-label">Create Password <span className="required">*</span></label>
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
                        {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.createPassword && <span className="field-error-msg">{fieldErrors.createPassword}</span>}
                  </div>

                  <div className="form-group confirm-password-form-group">
                    <label className="main-field-label">Confirm Password <span className="required">*</span></label>
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
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                <div className="password-instruction-box">
                  <Info size={14} className="instruction-icon" />
                  <p>
                    Password must contain at least 8 characters, including one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)
                  </p>
                </div>

                {/* Row 5: Captcha and Register Button */}
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