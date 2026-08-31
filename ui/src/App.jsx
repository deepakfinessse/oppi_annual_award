import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import ChangePassword from './pages/ChangePassword/ChangePassword'
import ApplicationForm from './pages/ApplicationForm/ApplicationForm'
import AdminPortal from './pages/AdminPortal/AdminPortal'
import ValidatorPortal from './pages/ValidatorPortal/ValidatorPortal'
import JuryPortal from './pages/JuryPortal/JuryPortal'
import PanelChairPortal from './pages/PanelChairPortal/PanelChairPortal'
import { isLoggedIn, getUser, isTokenExpired, clearTokens } from './utils/api'
import './App.css'

const ProtectedRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login?reason=expired" replace />
}

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = isLoggedIn();
  const user = getUser();

  if (!isAuth) {
    return <Navigate to="/login?reason=expired" replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have the required permissions to view this portal dashboard.</p>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
          Go to Home
        </button>
      </div>
    );
  }

  return children;
}

// Session Expiry & Auto Logout Listener
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout

const AutoLogoutListener = () => {
  useEffect(() => {
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const getBasePath = () => {
      return window.location.pathname.startsWith('/') ? '/' : '';
    };

    const performLogout = (reason) => {
      console.warn(`Session limit reached or inactive (${reason}). Auto logging out...`);
      clearTokens();
      const basePath = getBasePath();
      const loginUrl = `${basePath}/login?reason=${reason}`;
      if (!window.location.pathname.includes('/login')) {
        window.location.href = loginUrl;
      }
    };

    const checkSession = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // 1. Check token expiration
      if (isTokenExpired()) {
        performLogout('expired');
        return;
      }

      // 2. Check idle inactivity (30 mins of no user interaction)
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        performLogout('idle');
        return;
      }
    };

    // User activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    // Check session status immediately on mount
    checkSession();

    // Periodically check session status every 15 seconds
    const intervalId = setInterval(checkSession, 15000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
      clearInterval(intervalId);
    };
  }, []);

  return null;
};

function App() {
  return (
    <>
      <AutoLogoutListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application"
          element={
            <ProtectedRoute>
              <ApplicationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPortal />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/validator"
          element={
            <RoleProtectedRoute allowedRoles={['VALIDATOR', 'ADMIN']}>
              <ValidatorPortal />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/jury"
          element={
            <RoleProtectedRoute allowedRoles={['JURY', 'ADMIN']}>
              <JuryPortal />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/panel-chair"
          element={
            <RoleProtectedRoute allowedRoles={['PANEL_CHAIR', 'ADMIN']}>
              <PanelChairPortal />
            </RoleProtectedRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

export default App

