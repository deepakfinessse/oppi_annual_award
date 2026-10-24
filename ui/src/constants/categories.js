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

export const cleanCat = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const isCategoryMatch = (catA, catB) => {
  if (!catA || !catB) return false;
  if (catA === catB) return true;
  const aRaw = String(catA).trim().toLowerCase();
  const bRaw = String(catB).trim().toLowerCase();
  if (aRaw === 'all' || aRaw === 'all categories' || bRaw === 'all' || bRaw === 'all categories') return true;

  const a = cleanCat(catA);
  const b = cleanCat(catB);
  if (a === b) return true;

  // Marketing: distinguish Existing vs New
  if (a.includes('marketing') && b.includes('marketing')) {
    const aExisting = a.includes('existing');
    const bExisting = b.includes('existing');
    const aNew = a.includes('new');
    const bNew = b.includes('new');
    if (aExisting && bExisting) return true;
    if (aNew && bNew) return true;
    if (!aExisting && !aNew && (bExisting || bNew)) return true;
    if (!bExisting && !bNew && (aExisting || aNew)) return true;
    return false;
  }

  // HR: distinguish HR Excellence vs D&I
  const aDni = a.includes('diversity') || a.includes('di') || a.includes('inclusion');
  const bDni = b.includes('diversity') || b.includes('di') || b.includes('inclusion');
  if (aDni || bDni) return aDni && bDni;

  const aHr = a.includes('hrexcellence') || a.includes('hr');
  const bHr = b.includes('hrexcellence') || b.includes('hr');
  if (aHr && bHr && !aDni && !bDni) return true;

  // Healthcare Communications
  if (a.includes('communication') && b.includes('communication')) return true;

  // Medical Excellence
  if (a.includes('medical') && b.includes('medical')) return true;

  // Sales Force Excellence
  if (a.includes('sales') && b.includes('sales')) return true;

  // Sustainability
  if (a.includes('sustainab') && b.includes('sustainab')) return true;

  // Patient Centricity
  if ((a.includes('patient') || a.includes('shahani')) && (b.includes('patient') || b.includes('shahani'))) return true;

  return a.includes(b) || b.includes(a);
};
