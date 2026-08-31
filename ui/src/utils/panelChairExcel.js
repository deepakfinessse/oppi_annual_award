import ExcelJS from 'exceljs';
import { getPublicPanelMembers } from './api';

/**
 * Generates and downloads the Panel Chair Final Excel report matching the OPPI Scientist Award format.
 * 
 * @param {Object} params
 * @param {Array} params.juries - Array of Jury objects [{ id, name, email }]
 * @param {Array} params.applications - Array of Application objects [{ id, applicant_name, category, status }]
 * @param {Array} params.reviews - Array of JuryReview objects [{ application_id, jury_id, weighted_score }]
 */
export const generatePanelChairExcel = async ({ juries = [], applications = [], reviews = [] }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OPPI Scientist Award Admin';
  workbook.lastModifiedBy = 'OPPI Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Panel Chair Final Report');

  // Ensure gridlines are visible in Excel
  worksheet.views = [{ showGridLines: true }];

  // 1. Determine active juries directly from DB / API
  let activeJuries = Array.isArray(juries) && juries.length > 0 ? juries : [];

  if (activeJuries.length === 0) {
    try {
      const publicMembers = await getPublicPanelMembers();
      if (Array.isArray(publicMembers)) {
        activeJuries = publicMembers
          .filter(m => m && (m.type || m.Type || '').toUpperCase() === 'JURY')
          .map(m => ({
            id: m.id || m.Id,
            name: m.name || m.Name || 'Jury Member',
            email: m.email || m.Email || ''
          }));
      }
    } catch (err) {
      console.error('Error fetching jury panel members from DB:', err);
    }
  }

  // Safe number formatter to prevent runtime TypeError on toFixed
  const safeToFixed = (val, decimals = 4) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    return Number(num.toFixed(decimals));
  };

  // Helper to normalize review fields flexible across camelCase / snake_case / PascalCase and numeric comparison
  const findReview = (appId, jury) => {
    return (reviews || []).find(r => {
      if (!r) return false;
      const rAppId = r.application_id ?? r.applicationId ?? r.ApplicationId;
      const rJuryId = r.jury_id ?? r.juryId ?? r.JuryId;
      if (Number(rAppId) !== Number(appId)) return false;

      if (!jury) return false;

      const juryId = typeof jury === 'object' ? jury.id : jury;
      if (Number(rJuryId) === Number(juryId)) return true;

      if (typeof jury === 'object' && Array.isArray(jury.userIds)) {
        if (jury.userIds.some(id => Number(id) === Number(rJuryId))) return true;
      }

      return false;
    });
  };

  // 2. Filter for approved applications only and group by Category
  const approvedStatuses = ['PANEL_APPROVED', 'JURY_APPROVED', 'VALIDATOR_APPROVED', 'UNDER_JURY_REVIEW'];
  const approvedApps = (applications || []).filter(app => 
    app && (!app.status || approvedStatuses.includes(app.status) || app.status.endsWith('_APPROVED'))
  );

  const categoryGroups = {};
  approvedApps.forEach(app => {
    const cat = app.category || 'OPPI Scientist of the Year';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = [];
    }
    categoryGroups[cat].push(app);
  });

  const processedApplications = [];

  Object.keys(categoryGroups).forEach(catName => {
    const catApps = categoryGroups[catName];
    const categoryCount = catApps.length; // N_cat

    const appJuryStats = {};
    catApps.forEach(app => {
      appJuryStats[app.id] = {};
    });

    // Calculate rank, weighted rank, count/rank per jury within this category
    activeJuries.forEach(j => {
      const appScores = catApps.map(app => {
        const rev = findReview(app.id, j);
        const weightedScore = rev ? (rev.weighted_score ?? rev.weightedScore ?? rev.WeightedScore) : null;
        const score = rev && weightedScore !== undefined && weightedScore !== null && !isNaN(weightedScore) ? Number(weightedScore) : null;
        return { appId: app.id, score };
      });

      const scoredApps = appScores.filter(item => item.score !== null);
      scoredApps.sort((a, b) => b.score - a.score);

      scoredApps.forEach((item, index) => {
        const rank = index + 1;
        const weightedRank = 1 / rank;
        const countRank = categoryCount / rank;
        appJuryStats[item.appId][j.id] = {
          score: item.score,
          rank,
          weightedRank,
          countRank
        };
      });
    });

    // Calculate Final Score per app in category
    const catProcessed = catApps.map(app => {
      let countRankSum = 0;
      activeJuries.forEach(j => {
        const stats = appJuryStats[app.id]?.[j.id];
        if (stats && stats.countRank !== undefined && stats.countRank !== null && !isNaN(stats.countRank)) {
          countRankSum += stats.countRank;
        }
      });

      const numJuries = activeJuries.length > 0 ? activeJuries.length : 1;
      const finalScore = countRankSum / numJuries;

      return {
        ...app,
        categoryCount,
        juryStats: appJuryStats[app.id] || {},
        finalScore
      };
    });

    // Rank applications by Final Score descending within category
    catProcessed.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    catProcessed.forEach((app, index) => {
      app.finalRank = index + 1;
    });

    processedApplications.push(...catProcessed);
  });

  // 3. Define Column Widths
  const columns = [
    { key: 'srNo', width: 10 },
    { key: 'name', width: 28 },
    { key: 'category', width: 32 }
  ];

  activeJuries.forEach(() => {
    columns.push({ width: 10 }); // Score
    columns.push({ width: 10 }); // Rank
    columns.push({ width: 16 }); // Weighted Rank
    columns.push({ width: 16 }); // Count/Rank
  });

  columns.push({ width: 14 }); // Final Score
  columns.push({ width: 14 }); // Final Rank

  worksheet.columns = columns;

  // 4. Build Header Rows
  const row1Values = ['Sr No', 'Name', 'Category'];
  const row2Values = ['', '', ''];

  activeJuries.forEach((j, idx) => {
    row1Values.push(`Jury ${idx + 1} - ${j.name}`, '', '', '');
    row2Values.push('Score', 'Rank', 'Weighted Rank', 'Count/Rank');
  });

  row1Values.push('Final Score', 'Final Rank');
  row2Values.push('', '');

  worksheet.addRow(row1Values);
  worksheet.addRow(row2Values);

  // Merge Header Cells
  worksheet.mergeCells('A1:A2');
  worksheet.mergeCells('B1:B2');
  worksheet.mergeCells('C1:C2');

  let colIdx = 4; // Column D
  activeJuries.forEach(() => {
    const startCol = colIdx;
    const endCol = colIdx + 3;
    worksheet.mergeCells(1, startCol, 1, endCol);
    colIdx += 4;
  });

  worksheet.mergeCells(1, colIdx, 2, colIdx);         // Final Score
  worksheet.mergeCells(1, colIdx + 1, 2, colIdx + 1); // Final Rank

  // Style Header Rows
  const headerStyle = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  };

  for (let r = 1; r <= 2; r++) {
    const row = worksheet.getRow(r);
    row.height = 26;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.style = headerStyle;
    });
  }

  // 5. Populate Data Rows
  processedApplications.forEach(app => {
    const dataRowValues = [
      app.id,
      app.applicant_name || app.user_name || 'Anonymous',
      app.category || 'OPPI Scientist of the Year'
    ];

    activeJuries.forEach(j => {
      const stats = app.juryStats[j.id];
      if (stats && stats.score !== null && stats.score !== undefined) {
        dataRowValues.push(
          stats.score,
          stats.rank,
          safeToFixed(stats.weightedRank, 4) ?? '',
          safeToFixed(stats.countRank, 4) ?? ''
        );
      } else {
        dataRowValues.push('', '', '', '');
      }
    });

    dataRowValues.push(
      safeToFixed(app.finalScore, 4) ?? 0,
      app.finalRank || ''
    );

    const addedRow = worksheet.addRow(dataRowValues);
    addedRow.height = 22;

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const isLeftAlign = colNumber === 2 || colNumber === 3;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: isLeftAlign ? 'left' : 'center'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
        left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
        bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
        right: { style: 'thin', color: { argb: 'FFB0B0B0' } }
      };

      if (typeof cell.value === 'number') {
        if (!Number.isInteger(cell.value)) {
          cell.numFmt = '0.00##';
        } else {
          cell.numFmt = '0';
        }
      }
    });
  });

  // 6. Generate buffer and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Final_Excel_for_Panel_Chair_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};
