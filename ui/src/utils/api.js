//export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const BASE_URL = import.meta.env.VITE_API_URL || '/scientistapi';

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/uploads/') && !path.startsWith('uploads/')) {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/uploads/${cleanPath}`;
  }
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getHeaders = (isJson = true) => {
  const token = localStorage.getItem('access_token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handle = async (res) => {
  if (res.status === 401) {
    clearTokens();
    const isScientistSubpath = window.location.pathname.startsWith('/scientist/');
    const basePath = isScientistSubpath ? '/scientist' : '';
    if (!window.location.pathname.includes('/login')) {
      window.location.href = `${basePath}/login?reason=expired`;
    }
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

// ── Auth ────────────────────────────────────────────────────────────────
export const login = (email, password, captchaId, captchaAnswer) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, captchaId, captchaAnswer }),
  }).then(handle);

export const getCaptcha = () =>
  fetch(`${BASE_URL}/auth/captcha`).then(handle);

export const register = (payload) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);

export const getMe = () =>
  fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() }).then(handle);

export const forgotPassword = (email, captchaId, captchaAnswer) =>
  fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, captchaId, captchaAnswer }),
  }).then(handle);

export const resetPassword = (email, token, newPassword, captchaId, captchaAnswer) =>
  fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword, captchaId, captchaAnswer }),
  }).then(handle);

export const changePassword = (oldPassword, newPassword, captchaId, captchaAnswer) =>
  fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ Old_Password: oldPassword, New_Password: newPassword, captchaId, captchaAnswer }),
  }).then(handle);

export const logout = () =>
  fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handle);

// ── Application lifecycle ─────────────────────────────────────────────
export const createApplication = () =>
  fetch(`${BASE_URL}/application/create`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handle);

// ── Scientist – Section 1 ─────────────────────────────────────────────
export const saveApplicantDetail = (appId, data) =>
  fetch(`${BASE_URL}/scientist/applicant-detail/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  }).then(handle);

export const uploadPhoto = (appId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`${BASE_URL}/scientist/upload-photo/${appId}`, {
    method: 'POST',
    headers: getHeaders(false),
    body: fd,
  }).then(handle);
};

// ── Scientist – Section 2 ─────────────────────────────────────────────
export const saveApplicationDetail = (appId, data) =>
  fetch(`${BASE_URL}/scientist/application-detail/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  }).then(handle);

export const savePatents = (appId, patents) =>
  fetch(`${BASE_URL}/scientist/patents/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ patents }),
  }).then(handle);

export const uploadPatentAttachment = (patentId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`${BASE_URL}/scientist/upload-patent-attachment/${patentId}`, {
    method: 'POST',
    headers: getHeaders(false),
    body: fd,
  }).then(handle);
};

export const uploadDocument = (appId, docType, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`${BASE_URL}/scientist/upload-document/${appId}/${docType}`, {
    method: 'POST',
    headers: getHeaders(false),
    body: fd,
  }).then(handle);
};

// ── Scientist – Preview / Submit ──────────────────────────────────────
export const getScientistApplication = (appId) =>
  fetch(`${BASE_URL}/scientist/application/${appId}`, {
    headers: getHeaders(),
  }).then(handle);

export const submitApplication = (appId) =>
  fetch(`${BASE_URL}/scientist/submit/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handle);

// ── Helpers ───────────────────────────────────────────────────────────
export const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 Hours in Milliseconds

export const saveTokens = ({ access_token, refresh_token, user }) => {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('login_time', Date.now().toString());
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('login_time');
};

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

export const isTokenExpired = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return true;

  // Enforce 1-day (24 hours) session lifetime
  const loginTimeStr = localStorage.getItem('login_time');
  if (loginTimeStr) {
    const loginTime = parseInt(loginTimeStr, 10);
    if (!isNaN(loginTime) && Date.now() - loginTime >= ONE_DAY_MS) {
      return true;
    }
  }

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(base64));
    if (!decoded || !decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

export const isLoggedIn = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  if (isTokenExpired()) {
    clearTokens();
    return false;
  }
  return true;
};

// ── Validator Portal ───────────────────────────────────────────────────
export const getValidatorApplications = () =>
  fetch(`${BASE_URL}/validator/applications`, { headers: getHeaders() }).then(handle);

export const validatorApprove = (appId, scores) =>
  fetch(`${BASE_URL}/validator/approve/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scores),
  }).then(handle);

export const validatorReject = (appId, scores) =>
  fetch(`${BASE_URL}/validator/reject/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scores),
  }).then(handle);

export const saveValidatorDraft = (appId, scores) =>
  fetch(`${BASE_URL}/validator/save-draft/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scores),
  }).then(handle);

// ── Jury Portal ────────────────────────────────────────────────────────
export const getJuryApplications = () =>
  fetch(`${BASE_URL}/jury/applications`, { headers: getHeaders() }).then(handle);

export const juryApprove = (appId, scores) =>
  fetch(`${BASE_URL}/jury/approve/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scores),
  }).then(handle);

export const juryReject = (appId) =>
  fetch(`${BASE_URL}/jury/reject/${appId}`, { method: 'POST', headers: getHeaders() }).then(handle);

export const saveJuryDraft = (appId, scores) =>
  fetch(`${BASE_URL}/jury/save-draft/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scores),
  }).then(handle);

// ── Panel Chair Portal ──────────────────────────────────────────────────
export const getPanelChairApplications = () =>
  fetch(`${BASE_URL}/panel-chair/applications`, { headers: getHeaders() }).then(handle);

export const panelChairApprove = (appId) =>
  fetch(`${BASE_URL}/panel-chair/approve/${appId}`, { method: 'POST', headers: getHeaders() }).then(handle);

export const panelChairReject = (appId, reason) =>
  fetch(`${BASE_URL}/panel-chair/reject/${appId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  }).then(handle);

// ── Application Review (shared by Admin & Panel Chair) ────────────
export const getApplicationReview = (appId) =>
  fetch(`${BASE_URL}/application/review/${appId}`, { headers: getHeaders() }).then(handle);

// ── Admin Portal ───────────────────────────────────────────────────────
export const getAdminApplications = () =>
  fetch(`${BASE_URL}/admin/applications`, { headers: getHeaders() }).then(handle);

export const getAdminUsers = () =>
  fetch(`${BASE_URL}/admin/users`, { headers: getHeaders() }).then(handle);

export const getAdminPanelChairReport = () =>
  fetch(`${BASE_URL}/admin/panel-chair-report`, { headers: getHeaders() }).then(handle);

// ── Admin Panel Members CRUD ───────────────────────────────────────
export const getPublicPanelMembers = () =>
  fetch(`${BASE_URL}/public/panel-members`, { headers: { 'Accept': 'application/json' } }).then(handle);

export const adminCreatePanelMember = (dto) =>
  fetch(`${BASE_URL}/admin/panel-members`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(dto),
  }).then(handle);

export const adminUpdatePanelMember = (id, dto) =>
  fetch(`${BASE_URL}/admin/panel-members/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(dto),
  }).then(handle);

export const adminDeletePanelMember = (id) =>
  fetch(`${BASE_URL}/admin/panel-members/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  }).then(handle);

export const adminUploadPanelMemberImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/admin/panel-members/upload`, {
    method: 'POST',
    headers: getHeaders(false),
    body: formData,
  }).then(handle);
};

// ── Admin Past Winners CRUD ────────────────────────────────────────
export const getPublicPastWinners = () =>
  fetch(`${BASE_URL}/public/past-winners`, { headers: { 'Accept': 'application/json' } }).then(handle);

export const adminCreatePastWinner = (dto) =>
  fetch(`${BASE_URL}/admin/past-winners`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(dto),
  }).then(handle);

export const adminUpdatePastWinner = (id, dto) =>
  fetch(`${BASE_URL}/admin/past-winners/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(dto),
  }).then(handle);

export const adminDeletePastWinner = (id) =>
  fetch(`${BASE_URL}/admin/past-winners/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  }).then(handle);

export const adminUploadPastWinnerImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/admin/past-winners/upload`, {
    method: 'POST',
    headers: getHeaders(false),
    body: formData,
  }).then(handle);
};

export const adminDeleteApplication = (appId) =>
  fetch(`${BASE_URL}/admin/applications/${appId}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  }).then(handle);
