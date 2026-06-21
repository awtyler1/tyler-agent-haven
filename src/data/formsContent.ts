// ============================================================================
// TIG FORMS LIBRARY — the single, editable source for the Forms page.
// ----------------------------------------------------------------------------
// Add a form by adding an entry below. Drop its PDF in /public/forms/ and set
// `file` to that path (e.g. '/forms/scope-of-appointment.pdf'). Until `file`
// is set, the form shows as "Coming soon" instead of a broken download link.
//
//   • CMS forms  → download the current version from cms.gov, drop in /public/forms
//   • TIG forms  → our branded fact finders and worksheets
//
// To reorder, reorder the entries within a category. To add a category, add it
// to FORM_CATEGORIES (the page renders categories in that order).
// ============================================================================

export type FormCategory = 'cms' | 'fact_finder' | 'intake' | 'specialty';

export interface FormCategoryMeta {
  key: FormCategory;
  label: string;
}

export const FORM_CATEGORIES: FormCategoryMeta[] = [
  { key: 'cms', label: 'CMS & Compliance' },
  { key: 'fact_finder', label: 'Fact Finders & Worksheets' },
  { key: 'intake', label: 'Client Intake & Permissions' },
  { key: 'specialty', label: 'Specialty & Cross-Sell' },
];

export interface FormItem {
  id: string;
  category: FormCategory;
  name: string;
  description?: string;
  source: 'CMS' | 'TIG';
  file?: string; // '/forms/xyz.pdf' — omit until the PDF is added (shows "Coming soon")
  year?: number;
}

export const forms: FormItem[] = [
  // ── CMS & Compliance (download current versions from cms.gov) ──
  { id: 'soa', category: 'cms', source: 'CMS', name: 'Scope of Appointment (SOA)', description: 'Required before any Medicare Advantage or Part D sales appointment.', file: '/forms/scope-of-appointment.pdf' },
  { id: 'cms-40b', category: 'cms', source: 'CMS', name: 'CMS-40B: Apply for Part B', description: 'Application for enrollment in Medicare Part B.', file: '/forms/cms-40b-part-b-application.pdf' },
  { id: 'tpmo', category: 'cms', source: 'CMS', name: 'TPMO Disclaimer', description: 'Read within the first minute of the call.', file: '/forms/tpmo-disclaimer.pdf' },
  { id: 'medicare-and-you', category: 'cms', source: 'CMS', name: 'Medicare & You Handbook', description: 'The official CMS handbook clients ask for.', year: 2026, file: '/forms/10050-medicare-and-you.pdf' },

  // ── Fact Finders & Worksheets (TIG-branded) ──
  { id: 'medicare-factfinder', category: 'fact_finder', source: 'TIG', name: 'Medicare Fact Finder', description: 'Fillable. Doctors, drugs, coverage, health, budget, and priorities.', file: '/forms/medicare-fact-finder.pdf' },
  { id: 'aca-factfinder', category: 'fact_finder', source: 'TIG', name: 'ACA / Under-65 Fact Finder', description: 'Fillable. Household, income for subsidy, doctors, drugs, and priorities.', file: '/forms/aca-fact-finder.pdf' },
  { id: 'drug-worksheet', category: 'fact_finder', source: 'TIG', name: 'Prescription Drug Worksheet', description: 'Meds, dosages, and pharmacy for accurate plan comparison.' },
  { id: 'provider-worksheet', category: 'fact_finder', source: 'TIG', name: 'Provider & Doctor Worksheet', description: 'The doctors and hospitals to check against plan networks.' },

  // ── Client Intake & Permissions (TIG-branded) ──
  { id: 'ptc', category: 'intake', source: 'TIG', name: 'Permission to Contact (PTC)', description: 'Lets you legally follow up and review other coverage.' },
  { id: 'intake', category: 'intake', source: 'TIG', name: 'Client Intake Sheet', description: 'Demographics, Medicare ID, and contact info in one place.' },
  { id: 'hipaa', category: 'intake', source: 'TIG', name: 'HIPAA Authorization', description: 'Handle and discuss protected health information cleanly.' },

  // ── Specialty & Cross-Sell (TIG-branded) ──
  { id: 'lis-screener', category: 'specialty', source: 'TIG', name: 'Extra Help / LIS & MSP Screener', description: 'Spot dual-eligible and low-income help fast.' },
  { id: 'medsupp-worksheet', category: 'specialty', source: 'TIG', name: 'Med Supp Needs Worksheet', description: 'For the Original Medicare plus Medigap path.' },
  { id: 'final-expense', category: 'specialty', source: 'TIG', name: 'Final Expense Fact Finder', description: 'A natural cross-sell for your Medicare clients.' },
];

export function categoryLabel(key: FormCategory): string {
  return FORM_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
