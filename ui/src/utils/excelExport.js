import ExcelJS from 'exceljs';

/**
 * Common styling helper for Excel export
 */
const applyExcelStyling = (worksheet, titleText, headers, rowsData) => {
  worksheet.views = [{ showGridLines: true }];

  // 1. Title Row
  worksheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E38' } }; // OPPI Dark Green
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 36;

  // 2. Sub-title / Export timestamp
  worksheet.mergeCells(2, 1, 2, headers.length);
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = `Exported on: ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} (IST) | Total Records: ${rowsData.length}`;
  subTitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF555555' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F7' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Blank row
  worksheet.getRow(3).height = 10;

  // 3. Header Row
  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F5257' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // 4. Data Rows
  rowsData.forEach((data, rIdx) => {
    const row = worksheet.getRow(5 + rIdx);
    row.height = 22;
    const isEven = rIdx % 2 === 0;

    headers.forEach((h, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const val = data[h.key];
      cell.value = val !== undefined && val !== null ? val : '—';
      cell.font = { name: 'Arial', size: 9 };

      const isNumber = typeof val === 'number';
      const isCenter = h.align === 'center' || isNumber;

      cell.alignment = {
        vertical: 'middle',
        horizontal: isCenter ? 'center' : 'left',
        wrapText: true
      };

      if (isNumber) {
        cell.numFmt = Number.isInteger(val) ? '0' : '0.00';
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' }
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // Set column widths
  worksheet.columns = headers.map(h => ({ width: h.width || 18 }));
};

/**
 * Trigger file download in browser
 */
const downloadWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const formatStatusLabel = (status) => {
  const s = (status || '').toUpperCase().trim();
  if (!s || s === 'DRAFT') return 'Draft';
  if (s === 'SUBMITTED') return 'Submitted';
  if (s === 'UNDER_JURY_REVIEW') return 'Under Jury Review';
  if (s === 'VALIDATOR_APPROVED') return 'Validator Approved';
  if (s === 'VALIDATOR_REJECTED') return 'Validator Rejected';
  if (s === 'JURY_APPROVED') return 'Jury Approved';
  if (s === 'JURY_REJECTED') return 'Jury Rejected';
  if (s === 'PANEL_APPROVED') return 'Panel Approved';
  if (s === 'PANEL_REJECTED') return 'Panel Rejected';
  return s.replace(/_/g, ' ');
};

const resolveAppMobile = (app, users = []) => {
  const direct = app.applicant_mobile || app.user_mobile || app.mobile;
  if (direct && String(direct).trim()) return String(direct).trim();
  if (Array.isArray(users) && users.length > 0) {
    const appUserId = app.user_id || app.UserId;
    const appEmail = (app.applicant_email || app.user_email || '').toLowerCase().trim();
    const matched = users.find(u =>
      (appUserId && String(u.id || u.Id) === String(appUserId)) ||
      (appEmail && (u.email || '').toLowerCase().trim() === appEmail)
    );
    if (matched?.mobile && String(matched.mobile).trim()) return String(matched.mobile).trim();
  }
  return '—';
};

/**
 * Format raw application data for Excel export
 */
const prepareAppRowData = (app, users = []) => {
  const rev = app.review || {};
  const score1 = typeof rev.innovationIpScore === 'number' ? rev.innovationIpScore : null;
  const score2 = typeof rev.teamStrengthScore === 'number' ? rev.teamStrengthScore : null;
  const score3 = typeof rev.businessPlanScore === 'number' ? rev.businessPlanScore : null;
  const score4 = typeof rev.impactScore === 'number' ? rev.impactScore : null;

  let totalScore = '—';
  if (app.average_score !== undefined && app.average_score > 0) {
    totalScore = Number(app.average_score.toFixed(2));
  } else if (typeof app.score === 'number' && app.score > 0) {
    totalScore = Number(app.score.toFixed(2));
  } else {
    const hasScores = score1 !== null || score2 !== null || score3 !== null || score4 !== null;
    if (hasScores) {
      totalScore = (score1 || 0) + (score2 || 0) + (score3 || 0) + (score4 || 0);
    }
  }

  return {
    id: app.id,
    appId: app.id !== undefined && app.id !== null ? `#${String(app.id).padStart(2, '0')}` : '—',
    applicant_name: app.applicant_name || app.user_name || 'Anonymous',
    applicant_email: app.applicant_email || app.user_email || '—',
    mobile: resolveAppMobile(app, users),
    category: app.category || '—',
    institute_name: app.company || app.institute_name || app.instituteName || '—',
    submittedAt: (() => {
      const val = app.submittedAt || app.submitted_at || app.createdAt || app.created_at;
      if (!val) return '—';
      try {
        let str = String(val).trim();
        if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
          str = str.replace(' ', 'T') + 'Z';
        }
        const d = new Date(str);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      } catch (e) {
        return '—';
      }
    })(),
    designation: app.designation || '—',
    status: formatStatusLabel(app.status),
    score1: score1 !== null ? score1 : '—',
    score2: score2 !== null ? score2 : '—',
    score3: score3 !== null ? score3 : '—',
    score4: score4 !== null ? score4 : '—',
    totalScore,
    comments: rev.comments || '—'
  };
};

const COMMON_HEADERS = [
  { header: 'Date & Time', key: 'submittedAt', width: 22, align: 'center' },
  { header: 'App ID', key: 'appId', width: 12, align: 'center' },
  { header: 'Organization', key: 'institute_name', width: 30 },
  { header: 'Applicant Name', key: 'applicant_name', width: 26 },
  { header: 'Email id', key: 'applicant_email', width: 28 },
  { header: 'Mobile', key: 'mobile', width: 18, align: 'center' },
  { header: 'Category', key: 'category', width: 34 },
  { header: 'Status', key: 'status', width: 20, align: 'center' }
];

const REGISTRATION_HEADERS = [
  { header: 'Date & Time', key: 'registeredAt', width: 22, align: 'center' },
  { header: 'App ID', key: 'appId', width: 12, align: 'center' },
  { header: 'Organization', key: 'company', width: 30 },
  { header: 'Applicant Name', key: 'name', width: 26 },
  { header: 'Email id', key: 'email', width: 28 },
  { header: 'Mobile', key: 'mobile', width: 18, align: 'center' },
  { header: 'Category', key: 'category', width: 34 }
];

/**
 * Export Registered Users Tracking Sheet (one row per App ID)
 */
export const exportRegistrationsExcel = async (items = [], apps = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Registered Members Tracking';
  const worksheet = workbook.addWorksheet('Registrations');

  const formatRegDate = (rawDate) => {
    if (!rawDate) return '—';
    try {
      let str = String(rawDate).trim();
      if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) str = str.replace(' ', 'T') + 'Z';
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      }
    } catch (e) {}
    return '—';
  };

  const rows = [];
  items.forEach((item) => {
    // Support pre-expanded registrationRows (one row per App ID)
    if (item && 'rowKey' in item) {
      rows.push({
        registeredAt: formatRegDate(item.dateTime),
        appId: item.appId || '—',
        company: item.organisation || '—',
        name: item.fullName || '—',
        email: item.email || '—',
        mobile: item.mobile || '—',
        category: item.category || '—'
      });
      return;
    }

    // Fallback: expand raw user objects into one row per App ID
    const u = item;
    const userEmail = (u.email || '').toLowerCase().trim();
    const userId = u.id || u.Id;
    const userApps = apps.filter(a => {
      const aUserEmail = (a.user_email || '').toLowerCase().trim();
      const aApplicantEmail = (a.applicant_email || '').toLowerCase().trim();
      const matchesEmail = (aUserEmail && aUserEmail === userEmail) || (aApplicantEmail && aApplicantEmail === userEmail);
      const matchesUserId = userId && (a.user_id || a.UserId) && String(a.user_id || a.UserId) === String(userId);
      return matchesEmail || matchesUserId;
    });
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';

    if (userApps.length === 0) {
      rows.push({
        registeredAt: formatRegDate(u.createdAt || u.created_at),
        appId: '—',
        company: u.organisation || '—',
        name: fullName,
        email: u.email || '—',
        mobile: u.mobile || '—',
        category: '—'
      });
    } else {
      userApps.forEach(a => {
        rows.push({
          registeredAt: formatRegDate(a.createdAt || a.created_at || u.createdAt || u.created_at),
          appId: `#${String(a.id).padStart(2, '0')}`,
          company: u.organisation || a.company || a.institute_name || a.instituteName || '—',
          name: fullName !== '—' ? fullName : (a.applicant_name || a.user_name || '—'),
          email: u.email || a.applicant_email || a.user_email || '—',
          mobile: u.mobile || a.applicant_mobile || a.user_mobile || a.mobile || '—',
          category: a.category?.trim() || '—'
        });
      });
    }
  });

  applyExcelStyling(worksheet, title, REGISTRATION_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Registrations_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Draft / Saved Applications Sheet
 */
export const exportDraftApplicationsExcel = async (draftApps = [], users = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Draft / Saved Applications';
  const worksheet = workbook.addWorksheet('Draft Applications');

  const rows = draftApps.map(app => prepareAppRowData(app, users));
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Drafts_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Final Submissions Sheet
 */
export const exportSubmissionsExcel = async (submittedApps = [], users = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Final Submissions Report';
  const worksheet = workbook.addWorksheet('Final Submissions');

  const rows = submittedApps.map(app => prepareAppRowData(app, users));
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Submissions_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Validator Applications (Approved, Rejected, or All)
 */
export const exportValidatorApplicationsExcel = async (apps = [], type = 'APPROVED', users = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = `OPPI Annual Awards — Validator ${type.toUpperCase()} Applications`;
  const sheetName = `Validator ${type} Apps`;
  const worksheet = workbook.addWorksheet(sheetName);

  const rows = apps.map(app => prepareAppRowData(app, users));
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Validator_${type}_Applications_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Jury Applications (Scored, Pending, or All)
 */
export const exportJuryApplicationsExcel = async (apps = [], type = 'SCORED', users = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = `OPPI Annual Awards — Jury ${type.toUpperCase()} Applications`;
  const sheetName = `Jury ${type} Apps`;
  const worksheet = workbook.addWorksheet(sheetName);

  const rows = apps.map(app => prepareAppRowData(app, users));
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Jury_${type}_Applications_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Generic Applications Sheet (Admin or custom filtering)
 */
export const exportApplicationsExcel = async (apps = [], title = 'OPPI Annual Awards — Applications Report', filePrefix = 'Applications_Report', users = []) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applications');

  const rows = apps.map(app => prepareAppRowData(app, users));
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${filePrefix}_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Final Evaluation and Ranking Sheet matching Figma Table
 */
export const exportEvaluationRankingExcel = async (rankingData = [], juries = [], categoryName = 'All Categories') => {
  const workbook = new ExcelJS.Workbook();
  const title = `OPPI Annual Awards — Final Evaluation & Ranking (${categoryName})`;
  const worksheet = workbook.addWorksheet('Evaluation and Ranking');

  const headers = [
    { header: 'App ID', key: 'id', width: 10, align: 'center' },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Organisation', key: 'organisation', width: 30 },
    { header: 'Category', key: 'category', width: 34 },
    ...juries.map((j, idx) => ({ header: j.name, key: `jury_${j.juryKey ?? j.id ?? idx}`, width: 18, align: 'center' })),
    { header: 'Total', key: 'total', width: 14, align: 'center' },
    { header: 'Average', key: 'average', width: 14, align: 'center' },
    { header: 'Position', key: 'position', width: 18, align: 'center' }
  ];

  const rows = rankingData.map((item) => {
    const rowObj = {
      id: item.displayId,
      name: item.name,
      organisation: item.organisation,
      category: item.category,
      total: item.total,
      average: typeof item.average === 'number' && item.average > 0 ? item.average : '—',
      position: item.position
    };
    juries.forEach((j, idx) => {
      const lookupKey = j.juryKey ?? j.id;
      const val = item.scores ? item.scores[lookupKey] : undefined;
      rowObj[`jury_${j.juryKey ?? j.id ?? idx}`] = val !== undefined && val !== null ? val : '—';
    });
    return rowObj;
  });

  applyExcelStyling(worksheet, title, headers, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Final_Evaluation_and_Ranking_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

