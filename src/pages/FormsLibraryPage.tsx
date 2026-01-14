import { useState, useMemo } from 'react';
import { Download, ExternalLink, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Types
type FormType = 'pdf' | 'external' | 'fillable';
type FormCategory = 'cms' | 'compliance' | 'assistance' | 'carrier';

interface Form {
  id: string;
  name: string;
  description: string;
  category: FormCategory;
  type: FormType;
  url: string;
  keywords?: string[];
}

// Category configuration
const CATEGORIES: { key: FormCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cms', label: 'CMS Forms' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'assistance', label: 'Client Assistance' },
  { key: 'carrier', label: 'Carrier Resources' },
];

// Forms data
const FORMS: Form[] = [
  // CMS Official Forms
  {
    id: 'cms-40b',
    name: 'CMS-40B',
    description: 'Part B enrollment for clients who missed IEP',
    category: 'cms',
    type: 'pdf',
    url: '/downloads/CMS-40B.pdf',
    keywords: ['part b', 'enrollment', 'iep', 'gep'],
  },
  {
    id: 'cms-l564',
    name: 'CMS-L564',
    description: 'Employment verification for SEP eligibility',
    category: 'cms',
    type: 'external',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564.pdf',
    keywords: ['sep', 'employer', 'group coverage'],
  },
  {
    id: 'cms-1696',
    name: 'CMS-1696',
    description: 'Appointment of Representative form',
    category: 'cms',
    type: 'external',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1696.pdf',
    keywords: ['representative', 'authorization', 'poa'],
  },
  {
    id: 'cms-1490s',
    name: 'CMS-1490S',
    description: 'Patient request for medical payment',
    category: 'cms',
    type: 'external',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1490s.pdf',
    keywords: ['reimbursement', 'payment', 'claim'],
  },
  {
    id: 'medicare-card',
    name: 'Medicare Card Request',
    description: 'Replacement card through Medicare.gov',
    category: 'cms',
    type: 'external',
    url: 'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/get-your-medicare-card',
    keywords: ['card', 'replacement', 'lost'],
  },

  // Compliance & Sales Process
  {
    id: 'soa',
    name: 'Scope of Appointment',
    description: 'Required before MA/Part D sales meeting',
    category: 'compliance',
    type: 'pdf',
    url: '/downloads/Scope-of-Appointment_2026.pdf',
    keywords: ['scope', 'appointment', 'ma', 'pdp'],
  },
  {
    id: 'factfinder',
    name: 'Medicare Factfinder',
    description: 'TIG needs assessment form',
    category: 'compliance',
    type: 'pdf',
    url: '/downloads/Fillable_TIG_Medicare_Intake_Form.pdf',
    keywords: ['intake', 'needs assessment', 'factfinder'],
  },
  {
    id: 'multi-carrier',
    name: 'Multi-Carrier Disclaimer',
    description: 'Disclosure for presenting multiple carriers',
    category: 'compliance',
    type: 'external',
    url: 'https://www.cms.gov/files/document/mcmg-chapter-3.pdf',
    keywords: ['disclaimer', 'multi-carrier', 'disclosure'],
  },
  {
    id: 'hipaa',
    name: 'HIPAA Authorization',
    description: 'Release of health information',
    category: 'compliance',
    type: 'external',
    url: 'https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/model-notices-of-privacy-practices/index.html',
    keywords: ['hipaa', 'privacy', 'authorization'],
  },

  // Client Assistance Programs
  {
    id: 'ssa-44',
    name: 'SSA-44 (Extra Help)',
    description: 'Low Income Subsidy application',
    category: 'assistance',
    type: 'external',
    url: 'https://www.ssa.gov/forms/ssa-44.pdf',
    keywords: ['lis', 'low income', 'extra help', 'subsidy'],
  },
  {
    id: 'msp-ky',
    name: 'Medicare Savings (KY)',
    description: 'QMB/SLMB/QI application for Kentucky',
    category: 'assistance',
    type: 'external',
    url: 'https://chfs.ky.gov/agencies/dcbs/dfs/mps/Pages/default.aspx',
    keywords: ['msp', 'qmb', 'slmb', 'medicaid', 'kentucky'],
  },
  {
    id: 'ship',
    name: 'SHIP Referral',
    description: 'Free Medicare counseling program',
    category: 'assistance',
    type: 'external',
    url: 'https://www.shiphelp.org/',
    keywords: ['ship', 'counseling', 'assistance'],
  },
  {
    id: 'liheap',
    name: 'LIHEAP',
    description: 'Utility assistance program',
    category: 'assistance',
    type: 'external',
    url: 'https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap',
    keywords: ['liheap', 'utility', 'energy'],
  },
  {
    id: 'benefits',
    name: 'BenefitsCheckUp',
    description: 'NCOA benefits finder tool',
    category: 'assistance',
    type: 'external',
    url: 'https://www.benefitscheckup.org/',
    keywords: ['benefits', 'ncoa', 'seniors'],
  },

  // Carrier Resources
  {
    id: 'sunfire',
    name: 'SunFire Platform',
    description: 'Multi-carrier enrollment system',
    category: 'carrier',
    type: 'external',
    url: 'https://www.sunfirematrix.com/',
    keywords: ['sunfire', 'enrollment', 'multi-carrier'],
  },
  {
    id: 'portals',
    name: 'Carrier Portals',
    description: 'Quick access to all carrier portals',
    category: 'carrier',
    type: 'external',
    url: '/carrier-portals',
    keywords: ['portal', 'carrier', 'login'],
  },
  {
    id: 'vcc',
    name: 'VCC Form',
    description: 'Chronic condition verification for C-SNP',
    category: 'carrier',
    type: 'pdf',
    url: '/downloads/Blank_Verification_of_Chronic_Condition_VCC.pdf',
    keywords: ['vcc', 'csnp', 'chronic condition'],
  },
  {
    id: 'connecture',
    name: 'Connecture',
    description: 'Alternative enrollment platform',
    category: 'carrier',
    type: 'external',
    url: 'https://www.connecture.com/',
    keywords: ['connecture', 'gohealth', 'enrollment'],
  },
];

// Form Row Component
function FormRow({ form }: { form: Form }) {
  const isExternal = form.type === 'external' || form.url.startsWith('http');

  return (
    <a
      href={form.url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-all duration-200 group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#b8860b] transition-colors duration-200">
          {form.name}
        </p>
        <p className="text-sm text-slate-500 truncate">{form.description}</p>
      </div>
      <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-500 transition-colors duration-200">
        <span className="text-xs">{form.type === 'pdf' ? 'PDF' : 'Link'}</span>
        {isExternal ? (
          <ExternalLink className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </div>
    </a>
  );
}

// Main Component
export default function FormsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'all'>('all');

  // Group forms by category
  const formsByCategory = useMemo(() => {
    const filtered = FORMS.filter((form) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          form.name.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query) ||
          form.keywords?.some((kw) => kw.toLowerCase().includes(query))
        );
      }
      if (selectedCategory !== 'all') {
        return form.category === selectedCategory;
      }
      return true;
    });

    if (selectedCategory !== 'all' || searchQuery) {
      return [{ category: null as FormCategory | null, label: null as string | null, forms: filtered }];
    }

    // Group by category for "All" view
    const groups: { category: FormCategory | null; label: string | null; forms: Form[] }[] = [
      { category: 'cms', label: 'CMS Forms', forms: [] },
      { category: 'compliance', label: 'Compliance', forms: [] },
      { category: 'assistance', label: 'Client Assistance', forms: [] },
      { category: 'carrier', label: 'Carrier Resources', forms: [] },
    ];

    filtered.forEach((form) => {
      const group = groups.find((g) => g.category === form.category);
      if (group) group.forms.push(form);
    });

    return groups.filter((g) => g.forms.length > 0);
  }, [searchQuery, selectedCategory]);

  const totalResults = formsByCategory.reduce((acc, g) => acc + g.forms.length, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navigation />

      <div className="pt-16">
        {/* Header */}
        <div className="px-6 py-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-medium text-[#1a1a1a] mb-3">Forms</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-slate-50 border-0 focus:ring-1 focus:ring-slate-200 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto flex items-center gap-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'py-3 text-sm transition-all duration-200 border-b-2 -mb-px',
                  selectedCategory === cat.key
                    ? 'font-medium text-[#1a1a1a] border-[#b8860b]'
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                )}
              >
                {cat.label}
              </button>
            ))}
            {searchQuery && (
              <span className="text-xs text-slate-400 ml-auto">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Forms List */}
        <div className="px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {totalResults === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">No forms found</p>
              </div>
            ) : (
              formsByCategory.map((group, idx) => (
                <div key={group.category || idx}>
                  {group.label && (
                    <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-4">
                      {group.label}
                    </h2>
                  )}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    {group.forms.map((form) => (
                      <FormRow key={form.id} form={form} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-slate-400">
              Need something else?{' '}
              <a
                href="https://www.cms.gov/Medicare/CMS-Forms/CMS-Forms/CMS-Forms-List"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-[#1a1a1a] transition-colors duration-200"
              >
                CMS Forms Library
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
