export const AWARD_CATEGORIES = [
  'OPPI Marketing Excellence Awards - Existing Pharma Product',
  'OPPI Marketing Excellence Awards - New Pharma Product',
  'OPPI Sales Force Excellence Award',
  'OPPI HR Award - HR Excellence Award',
  'OPPI HR Award - D&I Award',
  'OPPI Healthcare Communications Award',
  'OPPI Medical Excellence Award',
  'OPPI Sustainability Excellence Award',
  'OPPI Ranjit Shahani Memorial Award For Excellence In Patient Centricity',
];

export const normalizeCategoryKey = (cat) => {
  if (!cat) return '';
  const s = String(cat).trim().toLowerCase();
  if (s === 'all' || s === 'all categories') return 'all';

  if (s.includes('patient') || s.includes('shahani')) return 'patient_centricity';
  if (s.includes('sustainab')) return 'sustainability';
  if (s.includes('communication')) return 'communications';
  if (s.includes('medical')) return 'medical';
  if (s.includes('sales')) return 'sales_force';

  // D&I: check diversity, inclusion, d&i, dni, or word di
  if (s.includes('diversity') || s.includes('inclusion') || s.includes('d&i') || s.includes('dni') || /\bdi\b/.test(s)) {
    return 'dni';
  }

  // HR Excellence
  if (s.includes('hr excellence') || (s.includes('hr') && s.includes('excellence')) || (s.includes('hr award') && !s.includes('d&i') && !s.includes('di'))) {
    return 'hr_excellence';
  }

  // Marketing: existing, new, or both
  if (s.includes('marketing') || s.includes('nanji')) {
    const hasExisting = s.includes('existing');
    const hasNew = s.includes('new');
    if (hasExisting && hasNew) return 'marketing_all';
    if (hasExisting) return 'marketing_existing';
    if (hasNew) return 'marketing_new';
    return 'marketing_all';
  }

  return '';
};

export const isCategoryMatch = (catA, catB) => {
  if (!catA || !catB) return false;
  if (catA === catB) return true;

  const aRaw = String(catA).trim().toLowerCase();
  const bRaw = String(catB).trim().toLowerCase();
  if (aRaw === 'all' || aRaw === 'all categories' || bRaw === 'all' || bRaw === 'all categories') return true;

  const keyA = normalizeCategoryKey(catA);
  const keyB = normalizeCategoryKey(catB);

  if (!keyA || !keyB) {
    const cleanA = aRaw.replace(/[^a-z0-9]/g, '');
    const cleanB = bRaw.replace(/[^a-z0-9]/g, '');
    return cleanA === cleanB;
  }

  if (keyA === keyB) return true;

  if ((keyA === 'marketing_all' && (keyB === 'marketing_existing' || keyB === 'marketing_new')) ||
      (keyB === 'marketing_all' && (keyA === 'marketing_existing' || keyA === 'marketing_new'))) {
    return true;
  }

  return false;
};
