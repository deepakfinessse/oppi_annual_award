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

/**
 * Format raw application data for Excel export
 */
const prepareAppRowData = (app) => {
  const rev = app.review || {};
  const score1 = typeof rev.innovationIpScore === 'number' ? rev.innovationIpScore : null;
  const score2 = typeof rev.teamStrengthScore === 'number' ? rev.teamStrengthScore : null;
  const score3 = typeof rev.businessPlanScore === 'number' ? rev.businessPlanScore : null;
  const score4 = typeof rev.impactScore === 'number' ? rev.impactScore : null;

  const hasScores = score1 !== null || score2 !== null || score3 !== null || score4 !== null;
  const totalScore = hasScores ? ((score1 || 0) + (score2 || 0) + (score3 || 0) + (score4 || 0)) : '—';

  return {
    id: app.id,
    applicant_name: app.applicant_name || app.user_name || 'Anonymous',
    applicant_email: app.applicant_email || app.user_email || '—',
    category: app.category || '—',
    institute_name: app.institute_name || app.instituteName || app.company || '—',
    submittedAt: (() => {
      const val = app.submittedAt || app.submitted_at;
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
    status: app.status || '—',
    score1: score1 !== null ? score1 : '—',
    score2: score2 !== null ? score2 : '—',
    score3: score3 !== null ? score3 : '—',
    score4: score4 !== null ? score4 : '—',
    totalScore,
    comments: rev.comments || '—'
  };
};

const COMMON_HEADERS = [
  { header: 'App ID', key: 'id', width: 10, align: 'center' },
  { header: 'Member Company / Organisation', key: 'institute_name', width: 30 },
  { header: 'Award Category', key: 'category', width: 34 },
  { header: 'Representative Name', key: 'applicant_name', width: 25 },
  { header: 'Designation', key: 'designation', width: 22 },
  { header: 'Email Address', key: 'applicant_email', width: 28 },
  { header: 'Status', key: 'status', width: 16, align: 'center' },
  { header: 'Submission Date', key: 'submittedAt', width: 22, align: 'center' },
  { header: 'Evaluation Score', key: 'totalScore', width: 16, align: 'center' },
  { header: 'Remarks / Comments', key: 'comments', width: 35 }
];

const REGISTRATION_HEADERS = [
  { header: 'S.No', key: 'sno', width: 8, align: 'center' },
  { header: 'Representative Name', key: 'name', width: 26 },
  { header: 'Member Company', key: 'company', width: 30 },
  { header: 'Email ID', key: 'email', width: 28 },
  { header: 'Mobile Number', key: 'mobile', width: 18, align: 'center' },
  { header: 'Nomination Category', key: 'category', width: 34 },
  { header: 'Application Status', key: 'status', width: 18, align: 'center' },
  { header: 'Registration Date', key: 'registeredAt', width: 22, align: 'center' }
];

/**
 * Export Registered Users Tracking Sheet
 */
export const exportRegistrationsExcel = async (users = [], apps = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Registered Members Tracking';
  const worksheet = workbook.addWorksheet('Registrations');

  const rows = users.map((u, idx) => {
    const userApp = apps.find(a => (a.user_email === u.email || a.applicant_email === u.email));
    const status = !userApp ? 'REGISTERED' : userApp.status;
    const category = userApp?.category || '—';
    const company = u.organisation || userApp?.company || userApp?.institute_name || '—';

    let regDate = '—';
    const rawDate = u.createdAt || u.created_at;
    if (rawDate) {
      try {
        let str = String(rawDate).trim();
        if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) str = str.replace(' ', 'T') + 'Z';
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          regDate = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
        }
      } catch (e) {}
    }

    return {
      sno: idx + 1,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      company,
      email: u.email,
      mobile: u.mobile || '—',
      category,
      status,
      registeredAt: regDate
    };
  });

  applyExcelStyling(worksheet, title, REGISTRATION_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Registrations_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Draft / Saved Applications Sheet
 */
export const exportDraftApplicationsExcel = async (draftApps = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Draft / Saved Applications';
  const worksheet = workbook.addWorksheet('Draft Applications');

  const rows = draftApps.map(prepareAppRowData);
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Drafts_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Final Submissions Sheet
 */
export const exportSubmissionsExcel = async (submittedApps = []) => {
  const workbook = new ExcelJS.Workbook();
  const title = 'OPPI Annual Awards — Final Submissions Report';
  const worksheet = workbook.addWorksheet('Final Submissions');

  const rows = submittedApps.map(prepareAppRowData);
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `OPPI_Annual_Awards_Submissions_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Validator Applications (Approved, Rejected, or All)
 */
export const exportValidatorApplicationsExcel = async (apps = [], type = 'APPROVED') => {
  const workbook = new ExcelJS.Workbook();
  const title = `OPPI Annual Awards — Validator ${type.toUpperCase()} Applications`;
  const sheetName = `Validator ${type} Apps`;
  const worksheet = workbook.addWorksheet(sheetName);

  const rows = apps.map(prepareAppRowData);
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Validator_${type}_Applications_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Jury Applications (Scored, Pending, or All)
 */
export const exportJuryApplicationsExcel = async (apps = [], type = 'SCORED') => {
  const workbook = new ExcelJS.Workbook();
  const title = `OPPI Annual Awards — Jury ${type.toUpperCase()} Applications`;
  const sheetName = `Jury ${type} Apps`;
  const worksheet = workbook.addWorksheet(sheetName);

  const rows = apps.map(prepareAppRowData);
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Jury_${type}_Applications_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};

/**
 * Export Generic Applications Sheet (Admin or custom filtering)
 */
export const exportApplicationsExcel = async (apps = [], title = 'OPPI Annual Awards — Applications Report', filePrefix = 'Applications_Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applications');

  const rows = apps.map(prepareAppRowData);
  applyExcelStyling(worksheet, title, COMMON_HEADERS, rows);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${filePrefix}_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
