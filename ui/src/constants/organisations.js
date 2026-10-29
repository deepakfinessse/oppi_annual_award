export const ORGANISATIONS = [
  'AbbVie India',
  'Amgen India',
  'AstraZeneca Pharma India Ltd',
  'Bayer Pharmaceuticals',
  'Boehringer Ingelheim India',
  'Bristol Myers Squibb',
  'Eli Lilly and Company India',
  'GlaxoSmithKline Pharmaceuticals',
  'Janssen India (Johnson & Johnson)',
  'Merck Specialties Pvt Ltd',
  'Novartis Healthcare Pvt Ltd',
  'Novo Nordisk India',
  'Pfizer Limited',
  'Roche Products India Pvt Ltd',
  'Sanofi India Limited',
  'Takeda Biopharmaceuticals India',
  'Viatris India',
  'Other Organisation'
];

export const isOrgMatch = (itemOrg, filterOrg) => {
  if (!filterOrg || filterOrg === 'ALL') return true;
  if (!itemOrg) return false;
  const a = String(itemOrg).trim().toLowerCase();
  const b = String(filterOrg).trim().toLowerCase();
  if (a === b) return true;
  if (b === 'other organisation' || b === 'other') {
    const standard = ORGANISATIONS.filter(o => o !== 'Other Organisation').map(o => o.toLowerCase());
    return a === 'other organisation' || a === 'other' || !standard.some(s => s === a || a.includes(s));
  }
  return a.includes(b) || b.includes(a);
};
