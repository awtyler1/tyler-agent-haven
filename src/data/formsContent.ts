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

export type FormCategory = 'planning' | 'cms' | 'fact_finder' | 'intake' | 'specialty';

export interface FormCategoryMeta {
  key: FormCategory;
  label: string;
}

export const FORM_CATEGORIES: FormCategoryMeta[] = [
  // Pinned first through AEP season — every agent works from these two.
  // Move below 'cms' once AEP wraps.
  { key: 'planning', label: 'AEP & Business Planning' },
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
  // ── AEP & Business Planning (print both; they work as a pair) ──
  { id: 'top-20-activities', category: 'planning', source: 'TIG', name: 'Top 20 Activities to Generate Medicare Business', description: 'Step 1: the idea menu. Twenty proven activities across community, referrals, partnerships, and outreach. Pick the four to six that fit your market, strengths, and budget.', file: '/forms/top-20-medicare-activities.pdf' },
  { id: 'aep-business-plan', category: 'planning', source: 'TIG', name: 'Medicare AEP Business Plan', description: 'Step 2: the one-page plan. Print it, set your enrollment goal, write in your four to six activities with weekly targets, and sign the commitment with your manager. This is the plan we work all AEP.', file: '/forms/aep-business-plan.pdf' },
  { id: 'quality-scorecard', category: 'planning', source: 'TIG', name: 'Agent Quality Scorecard', description: 'The four metrics carriers now grade: CTM complaints, HRA completion, rapid disenrollment, and PCP selection on the app. What each one is, the bar to beat, and how to protect yours. Companion to the "Carriers are grading your book" article.', file: '/forms/agent-quality-scorecard.pdf' },
  { id: 'triage-checklist-2027', category: 'planning', source: 'TIG', name: '2027 Client Triage Checklist', description: 'The September playbook for plan exits and Part D premium jumps: sort your book by county, flag PDP-only clients, call before the letters land, and log every save. Includes the three-sentence heads-up call script.', file: '/forms/2027-client-triage-checklist.pdf' },

  // ── CMS & Compliance (download current versions from cms.gov) ──
  { id: 'soa', category: 'cms', source: 'CMS', name: 'Scope of Appointment (SOA)', description: 'Required before any Medicare Advantage or Part D sales appointment.', file: '/forms/scope-of-appointment.pdf' },
  { id: 'cms-40b', category: 'cms', source: 'CMS', name: 'CMS-40B: Apply for Part B', description: 'Application for enrollment in Medicare Part B.', file: '/forms/cms-40b-part-b-application.pdf' },
  { id: 'cms-l564', category: 'cms', source: 'CMS', name: 'CMS-L564: Request for Employment Information', description: 'Proof of employer coverage for the Part B Special Enrollment Period. Client fills Section A, employer fills Section B. Submit with the CMS-40B.', file: '/forms/cms-l564-employment-information.pdf' },
  { id: 'tpmo', category: 'cms', source: 'CMS', name: 'TPMO Disclaimer', description: 'Read within the first minute of the call.', file: '/forms/tpmo-disclaimer.pdf' },
  { id: 'medicare-and-you', category: 'cms', source: 'CMS', name: 'Medicare & You Handbook', description: 'The official CMS handbook clients ask for.', year: 2026, file: '/forms/10050-medicare-and-you.pdf' },

  // ── Fact Finders & Worksheets (TIG-branded) ──
  { id: 'medicare-factfinder', category: 'fact_finder', source: 'TIG', name: 'Medicare Fact Finder', description: 'Fillable. Doctors, drugs, coverage, health, budget, and priorities.', file: '/forms/medicare-fact-finder.pdf' },
  { id: 'aca-factfinder', category: 'fact_finder', source: 'TIG', name: 'ACA / Under-65 Fact Finder', description: 'Fillable. Household, income for subsidy, doctors, drugs, and priorities.', file: '/forms/aca-fact-finder.pdf' },
  { id: 'doctor-med-list', category: 'fact_finder', source: 'TIG', name: 'Doctor & Medication List', description: 'Fillable. List every doctor and prescription to check against plans.', file: '/forms/doctor-medication-worksheet.pdf' },
  { id: 'cert-tracker', category: 'fact_finder', source: 'TIG', name: '2027 Certification Tracker', description: 'Fillable. Check off AHIP and each carrier cert with dates — save or print. Also on the Certifications page.', year: 2027, file: '/forms/2027-certification-tracker.pdf' },

  // ── Client Intake & Permissions (TIG-branded) ──
  { id: 'ptc', category: 'intake', source: 'TIG', name: 'Permission to Contact (PTC)', description: 'Consent-to-contact form. Lets you legally follow up and review other coverage.', file: '/forms/permission-to-contact.pdf' },
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
