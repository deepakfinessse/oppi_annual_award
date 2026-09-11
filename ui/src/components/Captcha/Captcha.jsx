import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import './Captcha.css';

const Captcha = ({ onChange, errors, trigger }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load reCAPTCHA script
  useEffect(() => {
    if (window.grecaptcha && window.grecaptcha.render) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const checkGrecaptcha = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        clearInterval(checkGrecaptcha);
        setScriptLoaded(true);
      }
    }, 100);

    return () => clearInterval(checkGrecaptcha);
  }, []);

  // Render the widget
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    const siteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // TEST MODE

    // Clear container to avoid double render errors
    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    containerRef.current.appendChild(wrapper);

    try {
      const widgetId = window.grecaptcha.render(wrapper, {
        sitekey: siteKey,
        callback: (token) => {
          onChange({ id: 'recaptcha', captchaAnswer: token });
        },
        'expired-callback': () => {
          onChange({ id: 'recaptcha', captchaAnswer: '' });
        },
        'error-callback': () => {
          onChange({ id: 'recaptcha', captchaAnswer: '' });
        }
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error("Error rendering reCAPTCHA:", err);
    }
  }, [scriptLoaded, onChange]);

  // Handle resetting the captcha if trigger changes
  useEffect(() => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
        onChange({ id: 'recaptcha', captchaAnswer: '' });
      } catch (err) {
        console.error("Error resetting reCAPTCHA:", err);
      }
    }
  }, [trigger]);

  return (
    <div className="captcha-container">
      <div ref={containerRef} className="g-recaptcha-wrapper"></div>
      {errors?.captcha && (
        <div className="field-error-text">
          <AlertCircle size={14} className="error-icon" />
          <span>{errors.captcha}</span>
        </div>
      )}
    </div>
  );
};

export default Captcha;
