/**
 * Utility for exporting data to styled Microsoft Word (.doc) documents
 */

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let str = String(dateStr).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return '—';
  }
};

const triggerDocDownload = (htmlContent, fileName) => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${fileName}</title>
      <style>
        body {
          font-family: Calibri, 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #222222;
          margin: 40px;
        }
        h1 {
          font-size: 20pt;
          color: #1F4E38;
          margin-bottom: 4px;
          padding-bottom: 6px;
          border-bottom: 2pt solid #1F4E38;
        }
        h2 {
          font-size: 14pt;
          color: #0F5257;
          margin-top: 24px;
          margin-bottom: 10px;
        }
        h3 {
          font-size: 12pt;
          color: #333333;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .meta-bar {
          font-size: 9.5pt;
          color: #555555;
          margin-bottom: 20px;
          font-style: italic;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0 24px 0;
          font-size: 10pt;
        }
        th {
          background-color: #1F4E38;
          color: #ffffff;
          font-weight: bold;
          padding: 8px 10px;
          border: 1px solid #143525;
          text-align: left;
        }
        td {
          padding: 8px 10px;
          border: 1px solid #D0D7DE;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #F8FAF9;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          font-size: 8.5pt;
          font-weight: bold;
          border-radius: 4px;
        }
        .badge-submitted { background-color: #DEF7EC; color: #03543F; }
        .badge-draft { background-color: #FEF08A; color: #854D0E; }
        .badge-registered { background-color: #E1EFFE; color: #1E429F; }
        .dossier-card {
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
          background-color: #FFFFFF;
          page-break-inside: avoid;
        }
        .label {
          font-weight: bold;
          color: #334155;
          width: 25%;
        }
        .field-val {
          color: #0F172A;
        }
        .section-divider {
          border-top: 1px dashed #CBD5E1;
          margin: 14px 0;
        }
      </style>
    </head>
    <body>
  `;
  const footer = '</body></html>';
  const fullHtml = header + htmlContent + footer;

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

/**
 * Export Registrations to Word (.doc) (one row per App ID)
 */
export const exportRegistrationsWord = (items = [], apps = []) => {
  const timestamp = formatDateTime(new Date());
  let rowsHtml = '';
  let totalCount = 0;

  const appendRow = (dateVal, appId, company, fullName, email, mobile, category) => {
    totalCount += 1;
    rowsHtml += `
      <tr>
        <td>${formatDateTime(dateVal)}</td>
        <td style="text-align: center;">${appId}</td>
        <td>${company}</td>
        <td><strong>${fullName}</strong></td>
        <td>${email}</td>
        <td>${mobile}</td>
        <td>${category}</td>
      </tr>
    `;
  };

  items.forEach((item) => {
    if (item && 'rowKey' in item) {
      appendRow(
        item.dateTime,
        item.appId || '—',
        item.organisation || '—',
        item.fullName || '—',
        item.email || '—',
        item.mobile || '—',
        item.category || '—'
      );
      return;
    }

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
      appendRow(
        u.createdAt || u.created_at,
        '—',
        u.organisation || '—',
        fullName,
        u.email || '—',
        u.mobile || '—',
        '—'
      );
    } else {
      userApps.forEach(a => {
        appendRow(
          a.createdAt || a.created_at || u.createdAt || u.created_at,
          `#${String(a.id).padStart(2, '0')}`,
          u.organisation || a.company || a.institute_name || a.instituteName || '—',
          fullName !== '—' ? fullName : (a.applicant_name || a.user_name || '—'),
          u.email || a.applicant_email || a.user_email || '—',
          u.mobile || a.applicant_mobile || a.user_mobile || a.mobile || '—',
          a.category?.trim() || '—'
        );
      });
    }
  });

  const content = `
    <h1>OPPI Annual Awards — User Registrations Tracking</h1>
    <div class="meta-bar">Generated on: ${timestamp} (IST) | Total Entries: ${totalCount}</div>
    <p>This report tracks all member company representatives registered on the OPPI Annual Awards portal.</p>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Date & Time</th>
          <th style="width: 10%;">App ID</th>
          <th style="width: 20%;">Organization</th>
          <th style="width: 18%;">Applicant Name</th>
          <th style="width: 18%;">Email id</th>
          <th style="width: 12%;">Mobile</th>
          <th style="width: 18%;">Category</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">No registered users found.</td></tr>'}
      </tbody>
    </table>
  `;

  const dateStr = new Date().toISOString().split('T')[0];
  triggerDocDownload(content, `OPPI_Annual_Awards_Registrations_${dateStr}.doc`);
};

/**
 * Export Draft Applications to Word (.doc)
 */
export const exportDraftApplicationsWord = (draftApps = [], users = []) => {
  const timestamp = formatDateTime(new Date());
  let rowsHtml = '';

  draftApps.forEach((app) => {
    const statusLabel = formatStatusLabel(app.status);
    rowsHtml += `
      <tr>
        <td>${formatDateTime(app.submittedAt || app.submitted_at || app.createdAt || app.created_at)}</td>
        <td style="text-align: center;"><strong>#${String(app.id).padStart(2, '0')}</strong></td>
        <td>${app.company || app.institute_name || app.instituteName || '—'}</td>
        <td>${app.applicant_name || app.user_name || '—'}</td>
        <td>${app.applicant_email || app.user_email || '—'}</td>
        <td>${resolveAppMobile(app, users)}</td>
        <td>${app.category || '—'}</td>
        <td><span class="badge badge-draft">${statusLabel}</span></td>
      </tr>
    `;
  });

  const content = `
    <h1>OPPI Annual Awards — Draft Applications Report</h1>
    <div class="meta-bar">Generated on: ${timestamp} (IST) | Total Drafts: ${draftApps.length}</div>
    <p>The following member companies have initiated nominations that are currently in draft or saved status.</p>
    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Date & Time</th>
          <th style="width: 8%;">App ID</th>
          <th style="width: 16%;">Organization</th>
          <th style="width: 14%;">Applicant Name</th>
          <th style="width: 16%;">Email id</th>
          <th style="width: 10%;">Mobile</th>
          <th style="width: 14%;">Category</th>
          <th style="width: 8%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" style="text-align: center;">No draft applications found.</td></tr>'}
      </tbody>
    </table>
  `;

  const dateStr = new Date().toISOString().split('T')[0];
  triggerDocDownload(content, `OPPI_Annual_Awards_Drafts_${dateStr}.doc`);
};

/**
 * Export Final Submissions Dossier to Word (.doc)
 */
export const exportSubmissionsDossierWord = (submittedApps = [], users = []) => {
  const timestamp = formatDateTime(new Date());
  let summaryRowsHtml = '';
  let dossiersHtml = '';

  submittedApps.forEach((app, idx) => {
    const displayId = `#${String(app.id).padStart(2, '0')}`;
    const dateTime = formatDateTime(app.submittedAt || app.submitted_at || app.createdAt || app.created_at);
    const org = app.company || app.institute_name || app.instituteName || '—';
    const applicantName = app.applicant_name || app.user_name || '—';
    const email = app.applicant_email || app.user_email || '—';
    const mobile = resolveAppMobile(app, users);
    const category = app.category || '—';
    const statusLabel = formatStatusLabel(app.status);

    summaryRowsHtml += `
      <tr>
        <td>${dateTime}</td>
        <td style="text-align: center;"><strong>${displayId}</strong></td>
        <td>${org}</td>
        <td>${applicantName}</td>
        <td>${email}</td>
        <td>${mobile}</td>
        <td>${category}</td>
        <td><span class="badge badge-submitted">${statusLabel}</span></td>
      </tr>
    `;

    dossiersHtml += `
      <div class="dossier-card">
        <h2>${idx + 1}. Application ${displayId} — ${app.category || 'Annual Award Nomination'}</h2>
        <table style="margin-top: 8px;">
          <tr>
            <td class="label">Date & Time</td>
            <td class="field-val">${dateTime}</td>
            <td class="label">App ID</td>
            <td class="field-val"><strong>${displayId}</strong></td>
          </tr>
          <tr>
            <td class="label">Organization</td>
            <td class="field-val"><strong>${org}</strong></td>
            <td class="label">Applicant Name</td>
            <td class="field-val">${applicantName}</td>
          </tr>
          <tr>
            <td class="label">Email id</td>
            <td class="field-val">${email}</td>
            <td class="label">Mobile</td>
            <td class="field-val">${mobile}</td>
          </tr>
          <tr>
            <td class="label">Category</td>
            <td class="field-val">${category}</td>
            <td class="label">Status</td>
            <td class="field-val"><span class="badge badge-submitted">${statusLabel}</span></td>
          </tr>
          <tr>
            <td class="label">Designation</td>
            <td class="field-val">${app.designation || '—'}</td>
            <td class="label">Jury Score</td>
            <td class="field-val">${app.average_score > 0 ? app.average_score.toFixed(2) : 'Under Review'}</td>
          </tr>
          ${app.brief_description ? `
          <tr>
            <td class="label">Brief Description</td>
            <td class="field-val" colspan="3" style="white-space: pre-wrap;">${app.brief_description}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;
  });

  const content = `
    <h1>OPPI Annual Awards — Final Submissions Dossier</h1>
    <div class="meta-bar">Generated on: ${timestamp} (IST) | Total Final Submissions: ${submittedApps.length}</div>
    <p>Comprehensive compilation of finalized and submitted nominations across all OPPI Annual Award categories.</p>
    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Date & Time</th>
          <th style="width: 8%;">App ID</th>
          <th style="width: 16%;">Organization</th>
          <th style="width: 14%;">Applicant Name</th>
          <th style="width: 16%;">Email id</th>
          <th style="width: 10%;">Mobile</th>
          <th style="width: 14%;">Category</th>
          <th style="width: 8%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRowsHtml || '<tr><td colspan="8" style="text-align: center;">No final submissions found.</td></tr>'}
      </tbody>
    </table>
    ${dossiersHtml || '<p>No final submissions found.</p>'}
  `;

  const dateStr = new Date().toISOString().split('T')[0];
  triggerDocDownload(content, `OPPI_Annual_Awards_Submissions_Dossier_${dateStr}.doc`);
};

/**
 * Export Individual Application Dossier to Word (.doc)
 */
export const exportSingleApplicationDossierWord = (appData) => {
  if (!appData) return;
  const timestamp = formatDateTime(new Date());
  const appId = appData.id;
  const pInfo = appData.personal_info || {};
  const comp = pInfo.company_name || appData.user_organisation || appData.applicant_detail?.instituteName || '—';
  const cat = pInfo.award_category || appData.application_detail?.category || '—';
  const repName = appData.user_name || `${appData.applicant_detail?.firstName || ''} ${appData.applicant_detail?.lastName || ''}`.trim() || '—';
  const files = appData.file_uploads || [];

  const filesListHtml = files.length > 0 
    ? `<ul>${files.map(f => `<li><strong>${f.Section || f.section}:</strong> ${f.FileName || f.fileName} (${f.FileSize ? (f.FileSize / (1024 * 1024)).toFixed(2) : '1.0'} MB)</li>`).join('')}</ul>`
    : '<p>No files uploaded.</p>';

  const content = `
    <h1>OPPI Annual Awards — Nomination Dossier #${appId}</h1>
    <div class="meta-bar">Generated on: ${timestamp} (IST) | Status: ${appData.status}</div>

    <div class="dossier-card">
      <h2>Nomination Summary</h2>
      <table>
        <tr>
          <td class="label">Award Category</td>
          <td class="field-val" colspan="3"><strong>${cat}</strong></td>
        </tr>
        <tr>
          <td class="label">OPPI Member Company</td>
          <td class="field-val"><strong>${comp}</strong></td>
          <td class="label">Submission Date</td>
          <td class="field-val">${formatDateTime(appData.submitted_at || appData.submittedAt)}</td>
        </tr>
        <tr>
          <td class="label">Representative Name</td>
          <td class="field-val">${repName}</td>
          <td class="label">Designation</td>
          <td class="field-val">${pInfo.designation || '—'}</td>
        </tr>
        <tr>
          <td class="label">Email Address</td>
          <td class="field-val">${appData.user_email || appData.applicant_detail?.email || '—'}</td>
          <td class="label">Mobile Number</td>
          <td class="field-val">${appData.user_mobile || appData.applicant_detail?.mobile || '—'}</td>
        </tr>
      </table>

      <h2>Brief Description of the Nomination</h2>
      <p style="background-color: #F8FAFC; padding: 12px; border-left: 4px solid #1F4E38; white-space: pre-wrap;">${pInfo.company_brief || appData.application_detail?.briefStatement || 'No description provided.'}</p>

      <h2>Attached Supporting Documents & Media</h2>
      ${filesListHtml}
    </div>
  `;

  const safeComp = comp.replace(/[^a-zA-Z0-9]/g, '_');
  triggerDocDownload(content, `Nomination_Dossier_App_${appId}_${safeComp}.doc`);
};
