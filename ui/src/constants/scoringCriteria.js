import { normalizeCategoryKey } from './categories.js';

/**
 * Official OPPI Annual Awards - Jury Scoring Logic
 * Each award category has its own criteria and weights summing to 100%.
 * Jury members grade each criterion on a 1–10 point scale:
 *   - Criterion weighted score (100-pt scale) = (points / 10) * weight
 *   - Criterion weighted score (10-pt Excel scale) = (points * weight) / 100
 */
export const CATEGORY_CRITERIA_MAP = {
  hr_excellence: {
    categoryName: 'OPPI HR Award - HR Excellence Award',
    criteria: [
      { name: 'Leadership & People Strategy', weight: 20 },
      { name: 'Talent Acquisition & Management', weight: 20 },
      { name: 'Talent and Organization Development', weight: 10 },
      { name: 'Employee Engagement, Communication and Organization Culture', weight: 20 },
      { name: 'Performance Management', weight: 10 },
      { name: 'Total Rewards Management', weight: 10 },
      { name: 'Digital, Analytics & Technological Innovation in HR', weight: 10 },
    ]
  },
  dni: {
    categoryName: 'OPPI HR Award - D&I Award',
    criteria: [
      { name: 'Diversity & Inclusion Strategy', weight: 20 },
      { name: 'Recruitment', weight: 20 },
      { name: 'Leadership and Internal Engagements', weight: 20 },
      { name: 'Enabling Policies', weight: 20 },
      { name: 'Talent Development and Growth', weight: 20 },
    ]
  },
  marketing_new: {
    categoryName: 'OPPI Marketing Excellence Awards - New Pharma Product',
    criteria: [
      { name: 'Product & Therapy Area', weight: 10 },
      { name: 'Product Specific Market Environment', weight: 10 },
      { name: 'Brand Performance', weight: 20 },
      { name: 'Brand Strategy', weight: 20 },
      { name: 'Sales Execution', weight: 20 },
      { name: 'Innovation', weight: 20 },
    ]
  },
  marketing_existing: {
    categoryName: 'OPPI Marketing Excellence Awards - Existing Pharma Product',
    criteria: [
      { name: 'Product & Therapy Area', weight: 10 },
      { name: 'Product Specific Market Environment', weight: 10 },
      { name: 'Brand Performance', weight: 20 },
      { name: 'Brand Strategy', weight: 20 },
      { name: 'Sales Execution', weight: 20 },
      { name: 'Innovation', weight: 20 },
    ]
  },
  sales_force: {
    categoryName: 'OPPI Sales Force Excellence Award',
    criteria: [
      { name: 'Improvement', weight: 10 },
      { name: 'Alignment', weight: 10 },
      { name: 'Execution', weight: 30 },
      { name: 'Acceptance', weight: 25 },
      { name: 'Impact', weight: 25 },
    ]
  },
  medical: {
    categoryName: 'OPPI Medical Excellence Award',
    criteria: [
      { name: 'Ethics', weight: 25 },
      { name: 'Innovation', weight: 25 },
      { name: 'Quality', weight: 25 },
      { name: 'outcomes/impact', weight: 25 },
    ]
  },
  communications: {
    categoryName: 'OPPI Healthcare Communications Award',
    criteria: [
      { name: 'Communication Idea- Originationality/ Creativity; Authentic', weight: 25 },
      { name: 'Choice of Medium & relevance', weight: 25 },
      { name: 'Impact', weight: 25 },
      { name: 'Measurability', weight: 25 },
    ]
  },
  sustainability: {
    categoryName: 'OPPI Sustainability Excellence Award',
    criteria: [
      { name: 'Environmental Impact', weight: 30 },
      { name: 'Sustainability', weight: 30 },
      { name: 'Collaboration & Partnerships', weight: 20 },
      { name: 'Transparency', weight: 20 },
    ]
  },
  patient_centricity: {
    categoryName: 'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
    criteria: [
      { name: 'Impact of the initiative/strategy', weight: 40 },
      { name: 'Scalability of the initiative/strategy', weight: 20 },
      { name: 'Awareness', weight: 20 },
      { name: 'Collaborations', weight: 10 },
      { name: 'Innovation', weight: 10 },
    ]
  }
};

export const getCategoryCriteriaMeta = (catName) => {
  if (!catName) return CATEGORY_CRITERIA_MAP.sales_force;

  const key = normalizeCategoryKey(catName);
  if (key && CATEGORY_CRITERIA_MAP[key]) {
    return CATEGORY_CRITERIA_MAP[key];
  }
  if (key === 'marketing_all') {
    return CATEGORY_CRITERIA_MAP.marketing_existing;
  }

  const c = String(catName).toLowerCase().trim();
  if (c.includes('patient') || c.includes('shahani')) return CATEGORY_CRITERIA_MAP.patient_centricity;
  if (c.includes('sustainab')) return CATEGORY_CRITERIA_MAP.sustainability;
  if (c.includes('communicat')) return CATEGORY_CRITERIA_MAP.communications;
  if (c.includes('medical')) return CATEGORY_CRITERIA_MAP.medical;
  if (c.includes('sales')) return CATEGORY_CRITERIA_MAP.sales_force;
  if (c.includes('diversity') || c.includes('d&i') || c.includes('d&amp;i') || c.includes('dni')) return CATEGORY_CRITERIA_MAP.dni;
  if (c.includes('hr excellence') || c.includes('hr award')) return CATEGORY_CRITERIA_MAP.hr_excellence;
  if (c.includes('new')) return CATEGORY_CRITERIA_MAP.marketing_new;
  if (c.includes('existing') || c.includes('marketing') || c.includes('nanji')) return CATEGORY_CRITERIA_MAP.marketing_existing;

  return CATEGORY_CRITERIA_MAP.sales_force;
};

export const getCategoryCriteria = (catName) => getCategoryCriteriaMeta(catName).criteria;

export const parseJuryReviewComments = (rawComments) => {
  if (!rawComments) return { remarks: '—', criterionScores: null };
  const trimmed = String(rawComments).trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        remarks: parsed.remarks && String(parsed.remarks).trim() ? String(parsed.remarks).trim() : '—',
        criterionScores: parsed.criterionScores && typeof parsed.criterionScores === 'object'
          ? parsed.criterionScores
          : null
      };
    } catch {
      return { remarks: trimmed, criterionScores: null };
    }
  }
  return { remarks: trimmed, criterionScores: null };
};

export const getCriterionPoint = (criterionScores, critName) => {
  if (!criterionScores || typeof criterionScores !== 'object') return null;
  if (criterionScores[critName] !== undefined && criterionScores[critName] !== null) {
    const val = Number(criterionScores[critName]);
    return isNaN(val) ? null : val;
  }
  const target = String(critName).trim().toLowerCase();
  const matchedKey = Object.keys(criterionScores).find(
    k => String(k).trim().toLowerCase() === target
  );
  if (matchedKey !== undefined && criterionScores[matchedKey] !== null) {
    const val = Number(criterionScores[matchedKey]);
    return isNaN(val) ? null : val;
  }
  return null;
};
