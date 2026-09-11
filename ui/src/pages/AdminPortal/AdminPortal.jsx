import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import ApplicationPreview from '../../components/ApplicationPreview/ApplicationPreview';
import {
  getAdminApplications,
  getAdminUsers,
  getAdminPanelChairReport,
  getApplicationReview,
  getPublicPanelMembers,
  adminCreatePanelMember,
  adminUpdatePanelMember,
  adminDeletePanelMember,
  adminUploadPanelMemberImage,
  getPublicPastWinners,
  adminCreatePastWinner,
  adminUpdatePastWinner,
  adminDeletePastWinner,
  adminUploadPastWinnerImage,
  getFileUrl,
  logout,
  clearTokens,
  adminDeleteApplication
} from '../../utils/api';
import {
  exportValidatorApplicationsExcel,
  exportJuryApplicationsExcel,
  exportApplicationsExcel,
  exportRegistrationsExcel,
  exportDraftApplicationsExcel,
  exportSubmissionsExcel
} from '../../utils/excelExport';
import {
  exportRegistrationsWord,
  exportDraftApplicationsWord,
  exportSubmissionsDossierWord,
  exportSingleApplicationDossierWord
} from '../../utils/wordExport';
import { LogOut, Download, Filter, Eye, EyeOff, Pencil, X, ChevronDown, Plus, Upload, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import oppiLogo from '../../assets/OPPI-logo-black.png';
import prabhatImg from '../../assets/Prabhat.png';
import wellingImg from '../../assets/Welling.png';
import shekharImg from '../../assets/Shekhar.png';
import balaramImg from '../../assets/Balaram.png';
import akamanchiImg from '../../assets/Akamanchi.png';
import ykImg from '../../assets/YK.png';
import './AdminPortal.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let str = String(dateStr).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return '—';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let str = String(dateStr).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return '—';
  }
};

const AdminPortal = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [panelMembers, setPanelMembers] = useState([]);
  const [pastWinners, setPastWinners] = useState([]);

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Selected app details/reviews
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);

  // Filters
  const [userFilter, setUserFilter] = useState('ALL');
  const [appFilter, setAppFilter] = useState('ALL');
  const [showUserFilterDropdown, setShowUserFilterDropdown] = useState(false);
  const [showAppFilterDropdown, setShowAppFilterDropdown] = useState(false);
  const [showExcelDropdown, setShowExcelDropdown] = useState(false);
  const [showAppExportDropdown, setShowAppExportDropdown] = useState(false);
  const [showUserExportDropdown, setShowUserExportDropdown] = useState(false);

  // Pagination
  const [appPage, setAppPage] = useState(1);
  const appPageSize = 10;
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 10;

  const userDropdownRef = useRef(null);
  const appDropdownRef = useRef(null);
  const excelDropdownRef = useRef(null);
  const appExportDropdownRef = useRef(null);
  const userExportDropdownRef = useRef(null);

  // Panel Member Form States
  const [showPanelForm, setShowPanelForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [panelName, setPanelName] = useState('');
  const [panelRole, setPanelRole] = useState('');
  const [panelType, setPanelType] = useState('JURY');
  const [panelImagePath, setPanelImagePath] = useState('');
  const [panelSortOrder, setPanelSortOrder] = useState(0);
  const [panelEmail, setPanelEmail] = useState('');
  const [panelPassword, setPanelPassword] = useState('');
  const [showPanelPassword, setShowPanelPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Past Winners Form States
  const [showWinnerForm, setShowWinnerForm] = useState(false);
  const [editingWinner, setEditingWinner] = useState(null);
  const [selectedExistingApplicant, setSelectedExistingApplicant] = useState('');
  const [winnerYear, setWinnerYear] = useState(new Date().getFullYear());
  const [winnerCategory, setWinnerCategory] = useState('SCIENTIST OF THE YEAR');
  const [winnerName, setWinnerName] = useState('');
  const [winnerDescription, setWinnerDescription] = useState('');
  const [winnerImagePath, setWinnerImagePath] = useState('');
  const [winnerColor, setWinnerColor] = useState('#00468E');
  const [uploadingWinnerImage, setUploadingWinnerImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [appsRes, usersRes, panelMembersRes, pastWinnersRes] = await Promise.all([
        getAdminApplications(),
        getAdminUsers(),
        getPublicPanelMembers(),
        getPublicPastWinners()
      ]);
      setApps(appsRes || []);
      setUsers(usersRes || []);
      setPanelMembers(panelMembersRes || []);
      setPastWinners(pastWinnersRes || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to fetch administrative data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (appId) => {
    if (!window.confirm(`Are you sure you want to permanently delete application #${appId}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminDeleteApplication(appId);
      setSuccess(`Application #${appId} deleted successfully.`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete application:', err);
      setError(err?.message || 'Failed to delete application.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedAppId || !showModal) {
      setSelectedAppDetail(null);
      return;
    }
    const fetchAppDetail = async () => {
      try {
        const data = await getApplicationReview(selectedAppId);
        setSelectedAppDetail(data);
      } catch (err) {
        console.error('Failed to load application detail:', err);
      }
    };
    fetchAppDetail();
  }, [selectedAppId, showModal]);

  // Click outside listener for filter dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserFilterDropdown(false);
      }
      if (appDropdownRef.current && !appDropdownRef.current.contains(e.target)) {
        setShowAppFilterDropdown(false);
      }
      if (excelDropdownRef.current && !excelDropdownRef.current.contains(e.target)) {
        setShowExcelDropdown(false);
      }
      if (appExportDropdownRef.current && !appExportDropdownRef.current.contains(e.target)) {
        setShowAppExportDropdown(false);
      }
      if (userExportDropdownRef.current && !userExportDropdownRef.current.contains(e.target)) {
        setShowUserExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter handlers
  const filteredUsers = users.filter(u => {
    // Only show users with the role 'USER'
    if (u.role.toUpperCase() !== 'USER') return false;

    // Get user's application status
    const userApp = apps.find(app => (app.user_email === u.email || app.applicant_email === u.email));
    const status = !userApp ? 'REGISTERED' : (userApp.status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED');

    if (userFilter === 'ALL') return true;
    if (userFilter === 'REGISTERED' || userFilter === 'NEW') return status === 'REGISTERED';
    return status === userFilter;
  });

  const ANNUAL_AWARD_CATEGORIES = [
    'OPPI Marketing Excellence Awards - Existing Pharma Product',
    'OPPI Marketing Excellence Awards - New Pharma Product',
    'OPPI Sales Force Excellence Award',
    'OPPI HR Award - HR Excellence Award',
    'OPPI HR Award - D&I Award',
    'OPPI Healthcare Communications Award',
    'OPPI Medical Excellence Award',
    'OPPI Sustainability Excellence Award',
    'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity'
  ];

  const filteredApps = apps.filter(app => {
    if (appFilter === 'ALL') return true;
    if (appFilter === 'DRAFT') return app.status === 'DRAFT';
    if (appFilter === 'SUBMITTED') return app.status === 'SUBMITTED';
    if (appFilter === 'VALIDATOR') return app.status.startsWith('VALIDATOR');
    if (appFilter === 'JURY') return app.status.startsWith('JURY') || app.status === 'UNDER_JURY_REVIEW';
    if (appFilter === 'PANEL_CHAIR') return app.status.startsWith('PANEL');
    if (appFilter === 'REJECTED') return app.status?.endsWith('_REJECTED') || ['VALIDATOR_REJECTED', 'JURY_REJECTED', 'PANEL_REJECTED'].includes(app.status);
    if (ANNUAL_AWARD_CATEGORIES.includes(appFilter)) return app.category === appFilter;
    return true;
  });

  const handleAppFilterChange = (filter) => {
    setAppFilter(filter);
    setAppPage(1);
    setShowAppFilterDropdown(false);
  };

  const handleUserFilterChange = (filter) => {
    setUserFilter(filter);
    setUserPage(1);
    setShowUserFilterDropdown(false);
  };

  const totalAppPages = Math.ceil(filteredApps.length / appPageSize) || 1;
  const paginatedApps = filteredApps.slice((appPage - 1) * appPageSize, appPage * appPageSize);

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  // Role casing mapper
  const getRoleLabel = (role) => {
    switch (role?.toUpperCase()) {
      case 'VALIDATOR': return 'Validator';
      case 'PANEL_CHAIR': return 'Panel chair';
      case 'JURY': return 'Jury';
      case 'ADMIN': return 'Admin';
      case 'USER': return 'User';
      default: return role || '';
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('API logout failed, clearing local session anyway:', e);
    }
    clearTokens();
    window.location.href = '/';
  };

  // CSV download handlers
  const downloadUsersCSV = () => {
    const headers = ['Date & Time Stamp', 'Representative Name', 'Member Company', 'Email ID', 'Mobile', 'Nomination Category', 'Status'];
    const rows = filteredUsers.map((u) => {
      const userApp = apps.find(app => (app.user_email === u.email || app.applicant_email === u.email));
      const statusLabel = !userApp ? 'Registered' : (userApp.status === 'DRAFT' ? 'Draft' : 'Submitted');
      return [
        formatDateTime(u.createdAt || u.created_at),
        `${u.firstName} ${u.lastName}`.trim(),
        u.organisation || userApp?.company || userApp?.institute_name || '—',
        u.email,
        u.mobile || '',
        userApp?.category || '—',
        statusLabel
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OPPI_Annual_Awards_Registered_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAppsCSV = () => {
    const headers = ['Submit Date', 'App ID', 'Representative Name', 'Member Company', 'Award Category', 'Email', 'Status', 'Validator Score', 'Jury Score'];
    const rows = filteredApps.map(app => {
      let valScore = 'Pending';
      if (app.has_validator_review || (app.validator_score !== undefined && app.validator_score > 0)) {
        valScore = app.validator_score.toFixed(2);
      } else if (app.status === 'VALIDATOR_REJECTED') {
        valScore = 'Rejected';
      } else if (app.status === 'DRAFT') {
        valScore = '—';
      } else if (['VALIDATOR_APPROVED', 'UNDER_JURY_REVIEW', 'JURY_APPROVED', 'JURY_REJECTED', 'PANEL_APPROVED', 'PANEL_REJECTED'].includes(app.status)) {
        valScore = 'Approved';
      }

      let juryScore = '—';
      if (app.status === 'VALIDATOR_APPROVED') juryScore = 'Pending';
      else if (['UNDER_JURY_REVIEW', 'JURY_APPROVED', 'PANEL_APPROVED', 'PANEL_REJECTED'].includes(app.status)) juryScore = app.average_score.toFixed(2);
      else if (app.status === 'JURY_REJECTED') juryScore = 'Rejected';

      return [
        formatDate(app.submittedAt || app.submitted_at),
        `#${app.id}`,
        app.applicant_name || app.user_name || 'Anonymous',
        app.company || app.institute_name || '',
        app.category || '',
        app.applicant_email || app.user_email || '',
        app.status.replace('_', ' '),
        valScore,
        juryScore
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OPPI_Annual_Awards_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Multi-format export helpers for Applications
  const handleExportFinalSubmissionsExcel = async () => {
    setShowAppExportDropdown(false);
    const submitted = apps.filter(a => a.status !== 'DRAFT');
    await exportSubmissionsExcel(submitted);
    setSuccess('Final Submissions Excel report downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleExportDraftsExcel = async () => {
    setShowAppExportDropdown(false);
    const drafts = apps.filter(a => a.status === 'DRAFT');
    await exportDraftApplicationsExcel(drafts);
    setSuccess('Draft Applications Excel report downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleExportAllAppsExcel = async () => {
    setShowAppExportDropdown(false);
    await exportApplicationsExcel(filteredApps, 'OPPI Annual Awards — Applications Report', 'OPPI_Annual_Awards_Applications');
    setSuccess('Filtered applications Excel sheet downloaded successfully.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleExportFinalSubmissionsWord = () => {
    setShowAppExportDropdown(false);
    const submitted = apps.filter(a => a.status !== 'DRAFT');
    exportSubmissionsDossierWord(submitted);
    setSuccess('Final Submissions Word Dossier downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleExportDraftsWord = () => {
    setShowAppExportDropdown(false);
    const drafts = apps.filter(a => a.status === 'DRAFT');
    exportDraftApplicationsWord(drafts);
    setSuccess('Draft Applications Word Report downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  // Multi-format export helpers for Users
  const handleExportUsersExcel = async () => {
    setShowUserExportDropdown(false);
    await exportRegistrationsExcel(filteredUsers, apps);
    setSuccess('Registered Members Excel report downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleExportUsersWord = () => {
    setShowUserExportDropdown(false);
    exportRegistrationsWord(filteredUsers, apps);
    setSuccess('Registered Members Word Report downloaded.');
    setTimeout(() => setSuccess(''), 3500);
  };

  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const handleExportExcel = async (type) => {
    setShowExcelDropdown(false);
    setDownloadingExcel(true);
    setError('');
    try {
      if (type === 'VALIDATOR_APPROVED') {
        const valApproved = apps.filter(a => a.status !== 'DRAFT' && a.status !== 'SUBMITTED' && a.status !== 'VALIDATOR_REJECTED');
        await exportValidatorApplicationsExcel(valApproved, 'APPROVED');
        setSuccess('Validator Approved applications Excel sheet downloaded successfully.');
      } else if (type === 'VALIDATOR_REJECTED') {
        const valRejected = apps.filter(a => a.status === 'VALIDATOR_REJECTED');
        await exportValidatorApplicationsExcel(valRejected, 'REJECTED');
        setSuccess('Validator Rejected applications Excel sheet downloaded successfully.');
      } else if (type === 'JURY_APPROVED') {
        const juryApproved = apps.filter(a => a.status === 'JURY_APPROVED' || a.status === 'PANEL_APPROVED' || a.status === 'PANEL_REJECTED');
        await exportJuryApplicationsExcel(juryApproved, 'SCORED');
        setSuccess('Jury Approved applications Excel sheet downloaded successfully.');
      } else {
        await exportApplicationsExcel(filteredApps, 'OPPI Scientist Award — Applications Report', 'Applications_Report');
        setSuccess('Filtered applications Excel sheet downloaded successfully.');
      }
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      setError('Failed to export Excel file.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPanelChairExcel = async () => {
    setDownloadingExcel(true);
    setError('');
    try {
      const reportData = await getAdminPanelChairReport();
      await generatePanelChairExcel(reportData);
      setSuccess('Final Excel for Panel Chair generated and downloaded successfully!');
    } catch (err) {
      console.error('Failed to fetch/generate Panel Chair report:', err);
      const errMsg = typeof err === 'string' ? err : (err?.message || err?.detail || err?.error || (err?.title ? `${err.title}: ${err.detail || ''}` : 'Failed to generate Panel Chair Excel file.'));
      setError(errMsg);
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Panel Member CRUD Handlers
  const handleOpenCreateForm = () => {
    setEditingMember(null);
    setPanelName('');
    setPanelRole('');
    setPanelType('JURY');
    setPanelImagePath('');
    setPanelSortOrder(panelMembers.length + 1);
    setPanelEmail('');
    setPanelPassword('');
    setShowPanelPassword(false);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setShowPanelForm(true);
  };

  const handleOpenEditForm = (member) => {
    setEditingMember(member);
    setPanelName(member.name);
    setPanelRole(member.role);
    setPanelType(member.type);
    setPanelImagePath(member.imagePath || '');
    setPanelSortOrder(member.sortOrder);
    setPanelEmail(member.email || '');
    setPanelPassword('');
    setShowPanelPassword(false);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setShowPanelForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    setFieldErrors(prev => ({ ...prev, image: null }));
    try {
      const response = await adminUploadPanelMemberImage(file);
      setPanelImagePath(response.url);
      setSuccess('Image uploaded successfully.');
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePanelMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const validationErrors = {};
    if (!panelName || !panelName.trim()) {
      validationErrors.name = 'Full Name is required.';
    }
    if (!panelRole || !panelRole.trim()) {
      validationErrors.role = 'Role description is required.';
    }
    if (!panelEmail || !panelEmail.trim()) {
      validationErrors.email = 'Email ID is required.';
    }
    if (!panelImagePath || !panelImagePath.trim()) {
      validationErrors.image = 'Photo upload is required.';
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!editingMember) {
      if (!panelPassword || !panelPassword.trim()) {
        validationErrors.password = 'Password is required.';
      } else if (!passwordRegex.test(panelPassword)) {
        validationErrors.password = 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.';
      }
    } else {
      if (panelPassword && panelPassword.trim().length > 0 && !passwordRegex.test(panelPassword)) {
        validationErrors.password = 'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const payload = {
      name: panelName,
      role: panelRole,
      type: panelType,
      imagePath: panelImagePath,
      sortOrder: parseInt(panelSortOrder) || 0,
      email: panelEmail,
      password: panelPassword
    };

    setLoading(true);
    try {
      if (editingMember) {
        await adminUpdatePanelMember(editingMember.id, payload);
        setSuccess('Panel member updated successfully.');
      } else {
        await adminCreatePanelMember(payload);
        setSuccess('Panel member created successfully.');
      }
      setShowPanelForm(false);
      const updatedList = await getPublicPanelMembers();
      setPanelMembers(updatedList || []);
    } catch (err) {
      console.error('Failed to save panel member:', err);
      setError(err.message || 'Failed to save panel member details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePanelMember = (member) => {
    setDeleteTarget({ type: 'MEMBER', id: member.id, name: member.name });
  };

  // Past Winners Handlers
  const handleOpenWinnerCreate = () => {
    setEditingWinner(null);
    setSelectedExistingApplicant('');
    setWinnerYear(new Date().getFullYear());
    setWinnerCategory('SCIENTIST OF THE YEAR');
    setWinnerName('');
    setWinnerDescription('');
    setWinnerImagePath('');
    setWinnerColor('#00468E');
    setError('');
    setSuccess('');
    setFieldErrors({});
    setShowWinnerForm(true);
  };

  const handleOpenWinnerEdit = (w) => {
    setEditingWinner(w);
    setSelectedExistingApplicant('');
    setWinnerYear(w.year);
    setWinnerCategory(w.category);
    setWinnerName(w.name);
    setWinnerDescription(w.description);
    setWinnerImagePath(w.imagePath || '');
    setWinnerColor(w.color || '#00468E');
    setError('');
    setSuccess('');
    setFieldErrors({});
    setShowWinnerForm(true);
  };

  const handleWinnerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingWinnerImage(true);
    setError('');
    setFieldErrors(prev => ({ ...prev, image: null }));
    try {
      const response = await adminUploadPastWinnerImage(file);
      setWinnerImagePath(response.url);
      setSuccess('Winner photo uploaded successfully.');
    } catch (err) {
      console.error('Winner image upload failed:', err);
      setError('Image upload failed.');
    } finally {
      setUploadingWinnerImage(false);
    }
  };

  const handleSaveWinner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const currentYear = new Date().getFullYear();
    const validationErrors = {};
    if (!winnerName || !winnerName.trim()) {
      validationErrors.name = "Winner's Full Name is required.";
    }
    if (!winnerYear) {
      validationErrors.year = 'Award Year is required.';
    } else if (parseInt(winnerYear) > currentYear) {
      validationErrors.year = `Award Year cannot be in the future (max ${currentYear}).`;
    }
    if (!winnerDescription || !winnerDescription.trim()) {
      validationErrors.description = 'Winner description is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const payload = {
      year: parseInt(winnerYear) || 2025,
      category: winnerCategory,
      name: winnerName,
      description: winnerDescription,
      imagePath: winnerImagePath,
      color: winnerColor
    };

    setLoading(true);
    try {
      if (editingWinner) {
        await adminUpdatePastWinner(editingWinner.id, payload);
        setSuccess('Winner details updated successfully.');
      } else {
        await adminCreatePastWinner(payload);
        setSuccess('Winner created successfully.');
      }
      setShowWinnerForm(false);
      const list = await getPublicPastWinners();
      setPastWinners(list || []);
    } catch (err) {
      console.error('Failed to save past winner:', err);
      setError(err.message || 'Failed to save past winner details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWinner = (winner) => {
    setDeleteTarget({ type: 'WINNER', id: winner.id, name: winner.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    setDeleteTarget(null);
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (type === 'MEMBER') {
        await adminDeletePanelMember(id);
        setSuccess('Panel member deleted.');
        const updatedList = await getPublicPanelMembers();
        setPanelMembers(updatedList || []);
      } else if (type === 'WINNER') {
        await adminDeletePastWinner(id);
        setSuccess('Winner record deleted successfully.');
        const list = await getPublicPastWinners();
        setPastWinners(list || []);
      }
    } catch (err) {
      console.error(`Failed to delete ${type.toLowerCase()}:`, err);
      setError(err.message || `Failed to delete ${type.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const getResolvedImage = (path, type = 'JURY') => {
    if (!path || (typeof path === 'string' && !path.trim())) {
      if (type === 'VALIDATOR') return prabhatImg;
      if (type === 'PANEL_CHAIR') return wellingImg;
      return shekharImg;
    }
    if (typeof path !== 'string') return path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    if (path.includes('Prabhat') || path.includes('validator.png')) return prabhatImg;
    if (path.includes('Welling') || path.includes('jury1.png')) return wellingImg;
    if (path.includes('Shekhar') || path.includes('jury2.png')) return shekharImg;
    if (path.includes('Balaram')) return balaramImg;
    if (path.includes('Akamanchi')) return akamanchiImg;
    if (path.includes('YK')) return ykImg;

    if (path.startsWith('/') && !path.startsWith('/uploads')) return path;
    return getFileUrl(path);
  };

  const triggerViewApp = (id) => {
    setSelectedAppId(id);
    setShowModal(true);
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        {/* Floating Capsule Header */}
        <header className="admin-floating-header">
          <div className="header-logo-section">
            <img src={oppiLogo} alt="OPPI Logo" className="header-logo-img" />
          </div>

          <div className="header-title-section">
            <h2>ADMIN DASHBOARD</h2>
          </div>

          <div className="header-logout-section">
            <button className="header-logout-btn" onClick={handleLogout}>
              <span className="logout-text-part">LOG OUT</span>
              <div className="logout-icon-part">
                <LogOut size={16} />
              </div>
            </button>
          </div>
        </header>

        {/* Centered Main Page Title & Top Action Bar */}
        {/* <div className="dashboard-title-row"> */}
        {/* <h1>Admin</h1> */}
        {/* <button
            className="btn-excel-primary-top"
            onClick={handleDownloadPanelChairExcel}
            disabled={downloadingExcel}
          >
            <Download size={18} />
            <span>{downloadingExcel ? 'GENERATING EXCEL...' : 'FINAL EXCEL FOR PANEL CHAIR'}</span>
          </button>
        </div> */}

        {error && !showPanelForm && !showWinnerForm && !showModal && <div className="portal-error-banner">⚠️ {error}</div>}
        {success && !showPanelForm && !showWinnerForm && !showModal && <div className="portal-success-banner">✓ {success}</div>}

        {/* FOUR CARDS STACKED VERTICALLY */}
        <div className="dashboard-content-stack">
          {/* Card 1: Applications */}
          <div className="dashboard-card">
            <div className="card-header-bar">
              <h3 className="card-title">Applications ({String(filteredApps.length).padStart(2, '0')})</h3>

              <div className="card-actions">
                <div className="filter-dropdown-container" ref={appDropdownRef}>
                  <button
                    className={`btn-card-action filter-btn ${appFilter !== 'ALL' ? 'active' : ''}`}
                    onClick={() => setShowAppFilterDropdown(!showAppFilterDropdown)}
                  >
                    <span>
                      {appFilter === 'DRAFT' ? 'Status: Draft' :
                        appFilter === 'SUBMITTED' ? 'Status: Submitted' :
                          appFilter === 'VALIDATOR' ? 'Status: Validator Reviewed' :
                            appFilter === 'JURY' ? 'Status: Jury Reviewed' :
                              appFilter === 'PANEL_CHAIR' ? 'Status: Panel Chair Reviewed' :
                                appFilter === 'REJECTED' ? 'Status: Rejected' :
                                  ANNUAL_AWARD_CATEGORIES.includes(appFilter) ? appFilter : 'FILTER'}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {showAppFilterDropdown && (
                    <div className="filter-dropdown-menu" style={{ minWidth: '320px', maxHeight: '420px', overflowY: 'auto' }}>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('ALL')}><strong>All Applications</strong></div>
                      <div style={{ borderTop: '1px solid #edf2f7', margin: '4px 0' }} />
                      <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>Filter By Category</div>
                      {ANNUAL_AWARD_CATEGORIES.map(cat => (
                        <div key={cat} className="filter-menu-item" onClick={() => handleAppFilterChange(cat)}>
                          {cat}
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid #edf2f7', margin: '4px 0' }} />
                      <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>Filter By Status</div>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('SUBMITTED')}>Final Submissions</div>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('DRAFT')}>Draft / Saved Applications</div>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('VALIDATOR')}>Validator Reviewed</div>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('JURY')}>Jury Reviewed</div>
                      <div className="filter-menu-item" onClick={() => handleAppFilterChange('REJECTED')}>Rejected</div>
                    </div>
                  )}
                </div>

                {/* Multi-Format Export Dropdown */}
                <div className="filter-dropdown-container" ref={appExportDropdownRef}>
                  <button
                    className="btn-card-action download-btn"
                    onClick={() => setShowAppExportDropdown(!showAppExportDropdown)}
                  >
                    <span>EXPORT</span>
                    <ChevronDown size={14} />
                  </button>
                  {showAppExportDropdown && (
                    <div className="filter-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '220px' }}>
                      <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>Excel Format (.xlsx)</div>
                      <div className="filter-menu-item" onClick={handleExportFinalSubmissionsExcel}>Final Submissions (.xlsx)</div>
                      <div className="filter-menu-item" onClick={handleExportDraftsExcel}>Draft Applications (.xlsx)</div>
                      <div className="filter-menu-item" onClick={handleExportAllAppsExcel}>All Filtered Apps (.xlsx)</div>

                      <div style={{ borderTop: '1px solid #edf2f7', margin: '4px 0' }} />
                      <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>Word Format (.doc)</div>
                      <div className="filter-menu-item" onClick={handleExportFinalSubmissionsWord}>Submissions Dossier (.doc)</div>
                      <div className="filter-menu-item" onClick={handleExportDraftsWord}>Drafts Report (.doc)</div>

                      <div style={{ borderTop: '1px solid #edf2f7', margin: '4px 0' }} />
                      <div className="filter-menu-item" onClick={() => { setShowAppExportDropdown(false); downloadAppsCSV(); }}>Download CSV (.csv)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="oppi-dashboard-table">
                <thead>
                  <tr>
                    <th>Representative</th>
                    <th>Award Category</th>
                    <th>Member Company</th>
                    <th>Email ID</th>
                    <th>Status</th>
                    <th>Validator Score</th>
                    <th>Jury Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && apps.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-loading">Loading applications...</td>
                    </tr>
                  ) : filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty">No submitted applications found.</td>
                    </tr>
                  ) : (
                    paginatedApps.map((app) => {
                      let valScore = 'Pending';
                      let valClass = 'pending';
                      if (app.has_validator_review || (app.validator_score !== undefined && app.validator_score > 0)) {
                        valScore = `${app.validator_score.toFixed(1)}/100`;
                        valClass = 'score';
                      } else if (app.status === 'VALIDATOR_REJECTED') {
                        valScore = 'Rejected';
                        valClass = 'rejected';
                      } else if (app.status === 'DRAFT') {
                        valScore = '—';
                        valClass = 'none';
                      } else if (['VALIDATOR_APPROVED', 'UNDER_JURY_REVIEW', 'JURY_APPROVED', 'JURY_REJECTED', 'PANEL_APPROVED', 'PANEL_REJECTED'].includes(app.status)) {
                        valScore = 'Approved';
                        valClass = 'approved';
                      }

                      let juryScore = '—';
                      let juryClass = 'none';
                      if (app.status === 'VALIDATOR_APPROVED') {
                        juryScore = 'Pending';
                        juryClass = 'pending';
                      } else if (['UNDER_JURY_REVIEW', 'JURY_APPROVED', 'PANEL_APPROVED', 'PANEL_REJECTED'].includes(app.status)) {
                        juryScore = `${app.average_score.toFixed(1)}/100`;
                        juryClass = 'score';
                      } else if (app.status === 'JURY_REJECTED') {
                        juryScore = 'Rejected';
                        juryClass = 'rejected';
                      }

                      return (
                        <tr key={app.id}>
                          <td className="bold-text">{app.applicant_name || app.user_name || 'Anonymous'}</td>
                          <td>{app.category || '—'}</td>
                          <td>{app.institute_name || app.instituteName || app.company || '—'}</td>
                          <td className="email-text">{app.applicant_email || app.user_email || '—'}</td>
                          <td>
                            <span className={`oppi-status-tag status-${app.status.toLowerCase()}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`score-status status-text-${valClass}`}>{valScore}</span>
                          </td>
                          <td>
                            <span className={`score-status status-text-${juryClass}`}>{juryScore}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn-view" onClick={() => triggerViewApp(app.id)}>
                                <Eye size={14} />
                                <span>View</span>
                              </button>
                              <button className="action-btn-view" onClick={() => navigate(`/application?appId=${app.id}`)}>
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                              <button className="action-btn-delete" onClick={() => handleDeleteApp(app.id)}>
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-pagination-bar">
              <div className="pagination-info">
                Showing <strong>{filteredApps.length === 0 ? 0 : (appPage - 1) * appPageSize + 1}</strong> to <strong>{Math.min(appPage * appPageSize, filteredApps.length)}</strong> of <strong>{filteredApps.length}</strong> entries
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setAppPage(p => Math.max(p - 1, 1))}
                  disabled={appPage === 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-page-indicator">
                  Page <strong>{appPage}</strong> of <strong>{totalAppPages}</strong>
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setAppPage(p => Math.min(p + 1, totalAppPages))}
                  disabled={appPage >= totalAppPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Registered Users */}
          <div className="dashboard-card">
            <div className="card-header-bar">
              <h3 className="card-title">Registered Users({String(filteredUsers.length).padStart(2, '0')})</h3>

              <div className="card-actions">
                <div className="filter-dropdown-container" ref={userDropdownRef}>
                  <button
                    className={`btn-card-action filter-btn ${userFilter !== 'ALL' ? 'active' : ''}`}
                    onClick={() => setShowUserFilterDropdown(!showUserFilterDropdown)}
                  >
                    <span>
                      {userFilter === 'SUBMITTED' ? 'Status: Submitted' :
                        userFilter === 'DRAFT' ? 'Status: Draft' :
                          (userFilter === 'REGISTERED' || userFilter === 'NEW') ? 'Status: Registered' : 'FILTER'}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {showUserFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      <div className="filter-menu-item" onClick={() => handleUserFilterChange('ALL')}>All Users</div>
                      <div className="filter-menu-item" onClick={() => handleUserFilterChange('SUBMITTED')}>Submitted</div>
                      <div className="filter-menu-item" onClick={() => handleUserFilterChange('DRAFT')}>Draft</div>
                      <div className="filter-menu-item" onClick={() => handleUserFilterChange('REGISTERED')}>Registered</div>
                    </div>
                  )}
                </div>

                {/* Multi-Format Export Dropdown for Users */}
                <div className="filter-dropdown-container" ref={userExportDropdownRef}>
                  <button
                    className="btn-card-action download-btn"
                    onClick={() => setShowUserExportDropdown(!showUserExportDropdown)}
                  >
                    <span>EXPORT</span>
                    <ChevronDown size={14} />
                  </button>
                  {showUserExportDropdown && (
                    <div className="filter-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '220px' }}>
                      <div className="filter-menu-item" onClick={handleExportUsersExcel}>Export Excel (.xlsx)</div>
                      <div className="filter-menu-item" onClick={handleExportUsersWord}>Export Word (.doc)</div>
                      <div className="filter-menu-item" onClick={() => { setShowUserExportDropdown(false); downloadUsersCSV(); }}>Export CSV (.csv)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="oppi-dashboard-table">
                <thead>
                  <tr>
                    <th>Date & Time Stamp</th>
                    <th>Representative Name</th>
                    <th>Member Company</th>
                    <th>Nomination Category</th>
                    <th>Email ID</th>
                    <th>Mobile</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-loading">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">No registered users found.</td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const userApp = apps.find(app => (app.user_email === u.email || app.applicant_email === u.email));
                      let badgeClass = 'badge-user';
                      let statusLabel = 'Registered';
                      if (userApp) {
                        if (userApp.status === 'DRAFT') {
                          badgeClass = 'badge-jury';
                          statusLabel = 'Draft';
                        } else {
                          badgeClass = 'badge-validator';
                          statusLabel = 'Submitted';
                        }
                      }
                      return (
                        <tr key={u.id}>
                          <td>{formatDateTime(u.createdAt || u.created_at)}</td>
                          <td className="bold-text">{u.firstName} {u.lastName}</td>
                          <td>{u.organisation || userApp?.company || userApp?.institute_name || '—'}</td>
                          <td>{userApp?.category || '—'}</td>
                          <td className="email-text">{u.email}</td>
                          <td>{u.mobile || '—'}</td>
                          <td>
                            <span className={`oppi-badge-pill ${badgeClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-pagination-bar">
              <div className="pagination-info">
                Showing <strong>{filteredUsers.length === 0 ? 0 : (userPage - 1) * userPageSize + 1}</strong> to <strong>{Math.min(userPage * userPageSize, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> entries
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setUserPage(p => Math.max(p - 1, 1))}
                  disabled={userPage === 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-page-indicator">
                  Page <strong>{userPage}</strong> of <strong>{totalUserPages}</strong>
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setUserPage(p => Math.min(p + 1, totalUserPages))}
                  disabled={userPage >= totalUserPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-title-row">
            {/* <h1>Admin</h1> */}
            <button
              className="btn-excel-primary-top"
              onClick={handleDownloadPanelChairExcel}
              disabled={downloadingExcel}
            >
              <Download size={18} />
              <span>{downloadingExcel ? 'GENERATING EXCEL...' : 'FINAL EXCEL FOR PANEL CHAIR'}</span>
            </button>
          </div>

          {/* Card 3: Website Panel Members */}
          <div className="dashboard-card">
            <div className="card-header-bar">
              <h3 className="card-title">Website Panel Members({String(panelMembers.length).padStart(2, '0')})</h3>

              <div className="card-actions">
                <button className="btn-card-action download-btn" onClick={handleOpenCreateForm}>
                  <Plus size={14} />
                  <span>Add Panel Member</span>
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="oppi-dashboard-table">
                <thead>
                  <tr>
                    <th>Sort Order</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Panel Role</th>
                    <th>Email ID</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && panelMembers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-loading">Loading panel members...</td>
                    </tr>
                  ) : panelMembers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">No custom panel members configured.</td>
                    </tr>
                  ) : (
                    [...panelMembers].sort((a, b) => {
                      const getPrio = (t) => {
                        if (t === 'VALIDATOR') return 1;
                        if (t === 'JURY') return 2;
                        if (t === 'PANEL_CHAIR') return 3;
                        return 4;
                      };
                      const diff = getPrio(a.type) - getPrio(b.type);
                      if (diff !== 0) return diff;
                      return a.sortOrder - b.sortOrder;
                    }).map(m => (
                      <tr key={m.id}>
                        <td>{m.sortOrder}</td>
                        <td>
                          <img
                            src={getResolvedImage(m.imagePath, m.type)}
                            alt={m.name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                          />
                        </td>
                        <td className="bold-text">{m.name}</td>
                        <td>
                          <span className={`oppi-badge-pill badge-${m.type.toLowerCase().replace('_', '-')}`}>
                            {getRoleLabel(m.type)}
                          </span>
                        </td>
                        <td className="email-text">{m.email || 'N/A'}</td>
                        <td className="email-text" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                          {m.role}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn-view" onClick={() => handleOpenEditForm(m)}>Edit</button>
                            <button className="action-btn-delete" onClick={() => handleDeletePanelMember(m)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Website Past Winners */}
          <div className="dashboard-card">
            <div className="card-header-bar">
              <h3 className="card-title">Website Past Winners({String(pastWinners.length).padStart(2, '0')})</h3>

              <div className="card-actions">
                <button className="btn-card-action download-btn" onClick={handleOpenWinnerCreate}>
                  <Plus size={14} />
                  <span>Add Winner Record</span>
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="oppi-dashboard-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Color</th>
                    <th>Affiliation / Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && pastWinners.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-loading">Loading winners...</td>
                    </tr>
                  ) : pastWinners.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">No past winners configured.</td>
                    </tr>
                  ) : (
                    pastWinners.map(w => (
                      <tr key={w.id}>
                        <td className="bold-text text-orange">{w.year}</td>
                        <td>
                          <img
                            src={getResolvedImage(w.imagePath)}
                            alt={w.name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                          />
                        </td>
                        <td className="bold-text">{w.name}</td>
                        <td>
                          <span className="oppi-badge-pill badge-user" style={{ color: '#0b5fa5', background: '#e0f2fe' }}>
                            {w.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: w.color || '#00468E', border: '1px solid #cbd5e1', display: 'inline-block' }} />
                            <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: '600', color: '#475569' }}>
                              {w.color || '#00468E'}
                            </span>
                          </div>
                        </td>
                        <td className="email-text" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                          {w.description}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn-view" onClick={() => handleOpenWinnerEdit(w)}>Edit</button>
                            <button className="action-btn-delete" onClick={() => handleDeleteWinner(w)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM APPLICATION PREVIEW / AUDIT MODAL */}
      {showModal && selectedAppId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <h2>Application Audit Trail & Details — #{String(selectedAppId).padStart(2, '0')}</h2>
              <button
                className="admin-modal-close-btn"
                onClick={() => { setShowModal(false); setSelectedAppId(null); }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {selectedAppDetail ? (
                <div className="modal-audit-content">
                  <div className="modal-status-banner">
                    <span className="status-label">Current Stage Status:</span>
                    <span className={`oppi-status-tag status-${selectedAppDetail.status?.toLowerCase()}`}>
                      {selectedAppDetail.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Validator Reviews breakdown */}
                  {selectedAppDetail.validator_review && selectedAppDetail.validator_review.length > 0 && (
                    <div className="modal-reviews-section">
                      <h3>Validator Review Score Breakdown ({selectedAppDetail.validator_review.length} reviews)</h3>
                      <div className="table-wrapper">
                        <table className="modal-reviews-table">
                          <thead>
                            <tr>
                              <th>Validator</th>
                              <th>Significance/Impact</th>
                              <th>Approach</th>
                              <th>Nature Innovation</th>
                              <th>Credentials</th>
                              <th>Total Score</th>
                              <th>Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAppDetail.validator_review.map((r, i) => (
                              <tr key={i}>
                                <td className="bold-text">{r.validator_name}</td>
                                <td>{r.innovationIpScore}/30</td>
                                <td>{r.teamStrengthScore}/25</td>
                                <td>{r.businessPlanScore}/25</td>
                                <td>{r.impactScore}/20</td>
                                <td className="modal-score-highlight">{r.weightedScore}/100</td>
                                <td className="comment-text-cell">{r.comments || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Jury Reviews breakdown */}
                  {selectedAppDetail.jury_reviews && selectedAppDetail.jury_reviews.length > 0 && (
                    <div className="modal-reviews-section">
                      <h3>Jury Review Score Breakdown ({selectedAppDetail.jury_reviews.length} reviews)</h3>
                      <div className="table-wrapper">
                        <table className="modal-reviews-table">
                          <thead>
                            <tr>
                              <th>Jury Member</th>
                              <th>Significance/Impact</th>
                              <th>Approach</th>
                              <th>Nature Innovation</th>
                              <th>Credentials</th>
                              <th>Total Score</th>
                              <th>Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAppDetail.jury_reviews.map((r, i) => (
                              <tr key={i}>
                                <td className="bold-text">{r.jury_name}</td>
                                <td>{r.innovationIpScore}/30</td>
                                <td>{r.teamStrengthScore}/25</td>
                                <td>{r.businessPlanScore}/25</td>
                                <td>{r.impactScore}/20</td>
                                <td className="modal-score-highlight">{r.weightedScore}/100</td>
                                <td className="comment-text-cell">{r.comments || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rejection box if panel rejected */}
                  {selectedAppDetail.status === 'PANEL_REJECTED' && selectedAppDetail.rejection_reason && (
                    <div className="modal-rejection-reason-box">
                      <h4>Panel Chair Rejection Comments:</h4>
                      <p>"{selectedAppDetail.rejection_reason}"</p>
                    </div>
                  )}

                  {/* Complete Application Form Details Section */}
                  <div className="modal-form-details-section">
                    <h3>Submitted Form Content</h3>
                    <div className="form-preview-card">
                      <ApplicationPreview appId={selectedAppId} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-loading-state">
                  <div className="spinner"></div>
                  <span>Fetching application details & audit trail...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM PANEL MEMBER CREATE/EDIT MODAL */}
      {showPanelForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container compact-modal">
            <div className="admin-modal-header">
              <h2>{editingMember ? 'Edit Panel Member' : 'Add New Panel Member'}</h2>
              <button
                className="admin-modal-close-btn"
                onClick={() => setShowPanelForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {error && <div className="modal-error-banner">⚠️ {error}</div>}
              {success && <div className="modal-success-banner">✓ {success}</div>}
              <form onSubmit={handleSavePanelMember} className="modal-crud-form">
                <div className="modal-form-row">
                  <div className={`modal-form-group ${fieldErrors.name ? 'has-error' : ''}`}>
                    <label>Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={panelName}
                      onChange={(e) => {
                        setPanelName(e.target.value);
                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
                      }}
                      placeholder="Dr. John Doe"
                      required
                    />
                    {fieldErrors.name && <span className="field-error-message">⚠️ {fieldErrors.name}</span>}
                  </div>

                  <div className="modal-form-group">
                    <label>Panel Role Type <span className="req">*</span></label>
                    <select value={panelType} onChange={(e) => setPanelType(e.target.value)}>
                      <option value="VALIDATOR">Validator</option>
                      <option value="PANEL_CHAIR">Panel Chair</option>
                      <option value="JURY">Jury Member</option>
                    </select>
                  </div>
                </div>

                <div className={`modal-form-group full-width ${fieldErrors.role ? 'has-error' : ''}`}>
                  <label>Designation &amp; Affiliation Description <span className="req">*</span></label>
                  <textarea
                    value={panelRole}
                    onChange={(e) => {
                      setPanelRole(e.target.value);
                      if (fieldErrors.role) setFieldErrors(prev => ({ ...prev, role: null }));
                    }}
                    placeholder="Chief Scientist & Head, division name, institute name, etc."
                    rows="3"
                    required
                  />
                  {fieldErrors.role && <span className="field-error-message">⚠️ {fieldErrors.role}</span>}
                </div>

                {!(editingMember && panelType === 'PANEL_CHAIR') && (
                  <div className="modal-form-row">
                    <div className={`modal-form-group ${fieldErrors.email ? 'has-error' : ''}`}>
                      <label>Email ID <span className="req">*</span></label>
                      <input
                        type="email"
                        value={panelEmail}
                        onChange={(e) => {
                          setPanelEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                        }}
                        placeholder="panel.member@example.com"
                        required
                      />
                      {fieldErrors.email && <span className="field-error-message">⚠️ {fieldErrors.email}</span>}
                    </div>

                    <div className={`modal-form-group ${fieldErrors.password ? 'has-error' : ''}`}>
                      <label>Password {!editingMember && <span className="req">*</span>}</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPanelPassword ? 'text' : 'password'}
                          value={panelPassword}
                          onChange={(e) => {
                            setPanelPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                          }}
                          placeholder={editingMember ? "Leave blank to keep unchanged" : "••••••••"}
                          required={!editingMember}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPanelPassword(!showPanelPassword)}
                        >
                          {showPanelPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <span className="field-hint-text">Minimum 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 number</span>
                      {fieldErrors.password && <span className="field-error-message">⚠️ {fieldErrors.password}</span>}
                    </div>
                  </div>
                )}

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Sort Order Index</label>
                    <input
                      type="number"
                      value={panelSortOrder}
                      onChange={(e) => setPanelSortOrder(e.target.value)}
                      min="0"
                    />
                  </div>

                  <div className={`modal-form-group ${fieldErrors.image ? 'has-error' : ''}`}>
                    <label>Upload Photo <span className="req">*</span></label>
                    <div className="modal-file-upload-wrapper">
                      <Upload size={18} style={{ color: '#0284c7', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                        {uploadingImage ? 'Uploading image...' : 'Choose image file'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="modal-file-input"
                      />
                    </div>
                    {fieldErrors.image && <span className="field-error-message">⚠️ {fieldErrors.image}</span>}
                  </div>
                </div>

                {panelImagePath && (
                  <div className="modal-upload-preview">
                    <img
                      src={getResolvedImage(panelImagePath)}
                      alt="Preview"
                      className="modal-avatar-preview"
                    />
                    <span className="modal-avatar-path">{panelImagePath}</span>
                  </div>
                )}

                <div className="modal-form-actions">
                  <button
                    type="submit"
                    className="btn-save-item"
                    disabled={uploadingImage || loading}
                  >
                    {loading ? 'Saving...' : 'Save Panel Member'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-item"
                    onClick={() => setShowPanelForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM PAST WINNER CREATE/EDIT MODAL */}
      {showWinnerForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container compact-modal">
            <div className="admin-modal-header">
              <h2>{editingWinner ? 'Edit Winner Record' : 'Add New Winner Record'}</h2>
              <button
                className="admin-modal-close-btn"
                onClick={() => setShowWinnerForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {error && <div className="modal-error-banner">⚠️ {error}</div>}
              {success && <div className="modal-success-banner">✓ {success}</div>}
              <form onSubmit={handleSaveWinner} className="modal-crud-form">
                <div className="modal-form-group full-width" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <label style={{ color: '#0f172a', fontWeight: '700' }}>Select Existing Applicant (Optional)</label>
                  <select
                    value={selectedExistingApplicant}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedExistingApplicant(val);
                      if (val) {
                        const selectedApp = apps.find(a => String(a.Id) === String(val));
                        if (selectedApp) {
                          const name = selectedApp.applicant_name || selectedApp.user_name || '';
                          const category = selectedApp.category || '';
                          let winnerCat = 'SCIENTIST OF THE YEAR';
                          if (category.toUpperCase().includes('WOMAN')) winnerCat = 'WOMAN SCIENTIST OF THE YEAR';
                          else if (category.toUpperCase().includes('YOUNG')) winnerCat = 'YOUNG SCIENTIST OF THE YEAR';

                          const institute = selectedApp.company || '';
                          const desc = institute ? `Scientist at ${institute}` : '';

                          if (name) setWinnerName(name);
                          setWinnerCategory(winnerCat);
                          if (desc) setWinnerDescription(desc);
                        }
                      }
                    }}
                  >
                    <option value="">-- Custom / Non-Existing Winner --</option>
                    {apps
                      .filter(app => String(app.Id || app.id) === String(selectedExistingApplicant) || (app.status && app.status.includes('APPROVED')))
                      .map(app => {
                        const appId = app.Id || app.id;
                        return (
                          <option key={appId} value={appId}>
                            App #{appId} - {app.applicant_name || app.user_name} {app.company ? `(${app.company})` : ''}
                          </option>
                        );
                      })}
                  </select>
                  <span className="field-hint-text">Select an approved applicant to pre-fill winner details, or leave as custom to manually add an external winner.</span>
                </div>

                <div className="modal-form-row">
                  <div className={`modal-form-group ${fieldErrors.name ? 'has-error' : ''}`}>
                    <label>Winner's Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={winnerName}
                      onChange={(e) => {
                        setWinnerName(e.target.value);
                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
                      }}
                      placeholder="Dr. Winner Name"
                      required
                    />
                    {fieldErrors.name && <span className="field-error-message">⚠️ {fieldErrors.name}</span>}
                  </div>

                  <div className={`modal-form-group ${fieldErrors.year ? 'has-error' : ''}`}>
                    <label>Award Year <span className="req">*</span></label>
                    <input
                      type="number"
                      value={winnerYear}
                      onChange={(e) => {
                        setWinnerYear(e.target.value);
                        if (fieldErrors.year) setFieldErrors(prev => ({ ...prev, year: null }));
                      }}
                      placeholder={String(new Date().getFullYear())}
                      required
                      min="2000"
                      max={new Date().getFullYear()}
                    />
                    {fieldErrors.year && <span className="field-error-message">⚠️ {fieldErrors.year}</span>}
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label>Award Category <span className="req">*</span></label>
                    <select value={winnerCategory} onChange={(e) => setWinnerCategory(e.target.value)}>
                      <option value="SCIENTIST OF THE YEAR">Scientist of the Year</option>
                      <option value="WOMAN SCIENTIST OF THE YEAR">Woman Scientist of the Year</option>
                      <option value="YOUNG SCIENTIST OF THE YEAR">Young Scientist of the Year</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label>Card Accent Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={winnerColor || '#00468E'}
                        onChange={(e) => setWinnerColor(e.target.value)}
                        style={{ width: '40px', height: '38px', padding: '2px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        value={winnerColor}
                        onChange={(e) => setWinnerColor(e.target.value)}
                        placeholder="#00468E"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group full-width">
                    <label>Upload Photo</label>
                    <div className="modal-file-upload-wrapper">
                      <Upload size={18} style={{ color: '#0284c7', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                        {uploadingWinnerImage ? 'Uploading photo...' : 'Choose photo file'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWinnerImageUpload}
                        className="modal-file-input"
                      />
                    </div>
                  </div>
                </div>

                <div className={`modal-form-group full-width ${fieldErrors.description ? 'has-error' : ''}`}>
                  <label>Designation &amp; Affiliation Description <span className="req">*</span></label>
                  <textarea
                    value={winnerDescription}
                    onChange={(e) => {
                      setWinnerDescription(e.target.value);
                      if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null }));
                    }}
                    placeholder="PhD, Professor or Head of department at institute/university name..."
                    rows="3"
                    required
                  />
                  {fieldErrors.description && <span className="field-error-message">⚠️ {fieldErrors.description}</span>}
                </div>

                {winnerImagePath && (
                  <div className="modal-upload-preview">
                    <img
                      src={getResolvedImage(winnerImagePath)}
                      alt="Preview"
                      className="modal-avatar-preview"
                    />
                    <span className="modal-avatar-path">{winnerImagePath}</span>
                  </div>
                )}

                <div className="modal-form-actions">
                  <button
                    type="submit"
                    className="btn-save-item"
                    disabled={uploadingWinnerImage || loading}
                  >
                    {loading ? 'Saving...' : 'Save Winner'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-item"
                    onClick={() => setShowWinnerForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container compact-modal confirmation-modal">
            <div className="admin-modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <h2 style={{ color: '#dc2626' }}>Confirm Deletion</h2>
              <button
                className="admin-modal-close-btn"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', lineHeight: 1 }}>⚠️</div>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                Are you sure you want to delete this {deleteTarget.type === 'MEMBER' ? 'panel member' : 'winner record'}?
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#dc2626', marginBottom: '1.25rem' }}>
                {deleteTarget.name}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="modal-form-actions" style={{ justifyContent: 'center', gap: '1rem', padding: '1rem 1.5rem 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="btn-save-item"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn-cancel-item"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminPortal;
