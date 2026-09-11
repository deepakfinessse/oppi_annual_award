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

/**
 * Export Registrations to Word (.doc)
 */
export const exportRegistrationsWord = (users = [], apps = []) => {
  const timestamp = formatDateTime(new Date());
  let rowsHtml = '';

  users.forEach((u, idx) => {
    const userApp = apps.find(a => (a.user_email === u.email || a.applicant_email === u.email));
    const status = !userApp ? 'REGISTERED' : userApp.status;
    const category = userApp?.category || '—';
    const company = u.organisation || userApp?.company || userApp?.institute_name || '—';

    rowsHtml += `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${u.firstName || ''} ${u.lastName || ''}</strong></td>
        <td>${company}</td>
        <td>${u.email}</td>
        <td>${u.mobile || '—'}</td>
        <td>${category}</td>
        <td><span class="badge badge-${status.toLowerCase().includes('sub') ? 'submitted' : (status.includes('DRAFT') ? 'draft' : 'registered')}">${status}</span></td>
        <td>${formatDateTime(u.createdAt || u.created_at)}</td>
      </tr>
    `;
  });

  const content = `
    <h1>OPPI Annual Awards — User Registrations Tracking</h1>
    <div class="meta-bar">Generated on: ${timestamp} (IST) | Total Registered Members: ${users.length}</div>
    <p>This report tracks all member company representatives registered on the OPPI Annual Awards portal.</p>
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 18%;">Representative Name</th>
          <th style="width: 20%;">Member Company</th>
          <th style="width: 18%;">Email ID</th>
          <th style="width: 12%;">Mobile</th>
          <th style="width: 15%;">Nomination Category</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 15%;">Registered On</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" style="text-align: center;">No registered users found.</td></tr>'}
      </tbody>
    </table>
  `;

  const dateStr = new Date().toISOString().split('T')[0];
  triggerDocDownload(content, `OPPI_Annual_Awards_Registrations_${dateStr}.doc`);
};

/**
 * Export Draft Applications to Word (.doc)
 */
export const exportDraftApplicationsWord = (draftApps = []) => {
  const timestamp = formatDateTime(new Date());
  let rowsHtml = '';

  draftApps.forEach((app, idx) => {
    rowsHtml += `
      <tr>
        <td style="text-align: center;"><strong>#${app.id}</strong></td>
        <td>${app.company || app.institute_name || '—'}</td>
        <td>${app.category || 'Not yet selected'}</td>
        <td>${app.applicant_name || app.user_name || '—'}</td>
        <td>${app.applicant_email || app.user_email || '—'}</td>
        <td>${app.designation || '—'}</td>
        <td><span class="badge badge-draft">DRAFT</span></td>
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
          <th style="width: 8%;">App ID</th>
          <th style="width: 22%;">Member Company</th>
          <th style="width: 25%;">Award Category</th>
          <th style="width: 18%;">Representative</th>
          <th style="width: 18%;">Email</th>
          <th style="width: 15%;">Designation</th>
          <th style="width: 10%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">No draft applications found.</td></tr>'}
      </tbody>
    </table>
  `;

  const dateStr = new Date().toISOString().split('T')[0];
  triggerDocDownload(content, `OPPI_Annual_Awards_Drafts_${dateStr}.doc`);
};

/**
 * Export Final Submissions Dossier to Word (.doc)
 */
export const exportSubmissionsDossierWord = (submittedApps = []) => {
  const timestamp = formatDateTime(new Date());
  let dossiersHtml = '';

  submittedApps.forEach((app, idx) => {
    dossiersHtml += `
      <div class="dossier-card">
        <h2>${idx + 1}. Application #${app.id} — ${app.category || 'Annual Award Nomination'}</h2>
        <table style="margin-top: 8px;">
          <tr>
            <td class="label">Member Company</td>
            <td class="field-val"><strong>${app.company || app.institute_name || '—'}</strong></td>
            <td class="label">Award Category</td>
            <td class="field-val">${app.category || '—'}</td>
          </tr>
          <tr>
            <td class="label">Representative Name</td>
            <td class="field-val">${app.applicant_name || app.user_name || '—'}</td>
            <td class="label">Designation</td>
            <td class="field-val">${app.designation || '—'}</td>
          </tr>
          <tr>
            <td class="label">Email Address</td>
            <td class="field-val">${app.applicant_email || app.user_email || '—'}</td>
            <td class="label">Submission Date</td>
            <td class="field-val">${formatDateTime(app.submittedAt || app.submitted_at)}</td>
          </tr>
          <tr>
            <td class="label">Application Status</td>
            <td class="field-val"><span class="badge badge-submitted">${app.status}</span></td>
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
    <p>Comprehensive compilation of finalized and submitted nominations across all 9 OPPI Annual Award categories.</p>
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
