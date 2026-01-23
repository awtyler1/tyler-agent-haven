import { useState, useMemo } from 'react';
import { Download, ExternalLink, Search, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useForms } from '@/hooks/useForms';
import type { Form } from '@/types/forms';

// External links that don't change often (CMS, SSA, etc.)
interface ExternalLink {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  keywords?: string[];
}

const EXTERNAL_LINKS: ExternalLink[] = [
  // CMS Official Forms
  {
    id: 'cms-l564',
    name: 'CMS-L564',
    description: 'Employment verification for SEP eligibility',
    category: 'cms',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564.pdf',
    keywords: ['sep', 'employer', 'group coverage'],
  },
  {
    id: 'cms-1696',
    name: 'CMS-1696',
    description: 'Appointment of Representative form',
    category: 'cms',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1696.pdf',
    keywords: ['representative', 'authorization', 'poa'],
  },
  {
    id: 'cms-1490s',
    name: 'CMS-1490S',
    description: 'Patient request for medical payment',
    category: 'cms',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1490s.pdf',
    keywords: ['reimbursement', 'payment', 'claim'],
  },
  {
    id: 'medicare-card',
    name: 'Medicare Card Request',
    description: 'Replacement card through Medicare.gov',
    category: 'cms',
    url: 'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/get-your-medicare-card',
    keywords: ['card', 'replacement', 'lost'],
  },

  // Client Assistance Programs
  {
    id: 'ssa-44',
    name: 'SSA-44 (Extra Help)',
    description: 'Low Income Subsidy application',
    category: 'assistance',
    url: 'https://www.ssa.gov/forms/ssa-44.pdf',
    keywords: ['lis', 'low income', 'extra help', 'subsidy'],
  },
  {
    id: 'msp-ky',
    name: 'Medicare Savings (KY)',
    description: 'QMB/SLMB/QI application for Kentucky',
    category: 'assistance',
    url: 'https://chfs.ky.gov/agencies/dcbs/dfs/mps/Pages/default.aspx',
    keywords: ['msp', 'qmb', 'slmb', 'medicaid', 'kentucky'],
  },
  {
    id: 'ship',
    name: 'SHIP Referral',
    description: 'Free Medicare counseling program',
    category: 'assistance',
    url: 'https://www.shiphelp.org/',
    keywords: ['ship', 'counseling', 'assistance'],
  },
  {
    id: 'liheap',
    name: 'LIHEAP',
    description: 'Utility assistance program',
    category: 'assistance',
    url: 'https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap',
    keywords: ['liheap', 'utility', 'energy'],
  },
  {
    id: 'benefits',
    name: 'BenefitsCheckUp',
    description: 'NCOA benefits finder tool',
    category: 'assistance',
    url: 'https://www.benefitscheckup.org/',
    keywords: ['benefits', 'ncoa', 'seniors'],
  },

  // Tools & Platforms
  {
    id: 'sunfire',
    name: 'SunFire Platform',
    description: 'Multi-carrier enrollment system',
    category: 'tools',
    url: 'https://www.sunfirematrix.com/',
    keywords: ['sunfire', 'enrollment', 'multi-carrier'],
  },
  {
    id: 'connecture',
    name: 'Connecture',
    description: 'Alternative enrollment platform',
    category: 'tools',
    url: 'https://www.connecture.com/',
    keywords: ['connecture', 'gohealth', 'enrollment'],
  },
];

// Category configuration
type CategoryKey = 'all' | 'compliance' | 'client_intake' | 'cms' | 'assistance' | 'tools';
const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'client_intake', label: 'Client Intake' },
  { key: 'cms', label: 'CMS Forms' },
  { key: 'assistance', label: 'Client Assistance' },
  { key: 'tools', label: 'Tools' },
];

// Unified form type for display
interface DisplayForm {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  isExternal: boolean;
  keywords?: string[];
}

// Form Row Component
function FormRow({ form }: { form: DisplayForm }) {
  return (
    <a
      href={form.url}
      target={form.isExternal ? '_blank' : undefined}
      rel={form.isExternal ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group border-t border-border/30 first:border-t-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {form.name}
        </p>
        <p className="text-sm text-muted-foreground truncate">{form.description}</p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
        <span className="text-xs">{form.isExternal ? 'Link' : 'PDF'}</span>
        {form.isExternal ? (
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const { forms: dbForms, loading, error } = useForms();

  // Convert DB forms to display format and merge with external links
  const allForms = useMemo(() => {
    const displayForms: DisplayForm[] = [];

    // Add DB forms
    dbForms.forEach(form => {
      displayForms.push({
        id: form.id,
        name: form.name,
        description: form.description || '',
        category: form.category,
        url: form.file_path,
        isExternal: form.file_path.startsWith('http'),
      });
    });

    // Add external links
    EXTERNAL_LINKS.forEach(link => {
      displayForms.push({
        id: link.id,
        name: link.name,
        description: link.description,
        category: link.category,
        url: link.url,
        isExternal: true,
        keywords: link.keywords,
      });
    });

    return displayForms;
  }, [dbForms]);

  // Group forms by category with filtering
  const formsByCategory = useMemo(() => {
    const filtered = allForms.filter((form) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          form.name.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query) ||
          form.keywords?.some((kw) => kw.toLowerCase().includes(query));
        return matchesSearch;
      }
      if (selectedCategory !== 'all') {
        return form.category === selectedCategory;
      }
      return true;
    });

    if (selectedCategory !== 'all' || searchQuery) {
      return [{ category: null as string | null, label: null as string | null, forms: filtered }];
    }

    // Group by category for "All" view
    const groups: { category: string | null; label: string | null; forms: DisplayForm[] }[] = [
      { category: 'compliance', label: 'Compliance', forms: [] },
      { category: 'client_intake', label: 'Client Intake', forms: [] },
      { category: 'cms', label: 'CMS Forms', forms: [] },
      { category: 'assistance', label: 'Client Assistance', forms: [] },
      { category: 'tools', label: 'Tools & Platforms', forms: [] },
    ];

    filtered.forEach((form) => {
      const group = groups.find((g) => g.category === form.category);
      if (group) group.forms.push(form);
    });

    return groups.filter((g) => g.forms.length > 0);
  }, [allForms, searchQuery, selectedCategory]);

  const totalResults = formsByCategory.reduce((acc, g) => acc + g.forms.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      <Navigation />

      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold text-foreground mb-3">Forms Library</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-muted/30 border-border/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 bg-white border-b border-border/50">
          <div className="max-w-3xl mx-auto flex items-center gap-6 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'py-3 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
                  selectedCategory === cat.key
                    ? 'font-medium text-foreground border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                {cat.label}
              </button>
            ))}
            {searchQuery && (
              <span className="text-xs text-muted-foreground ml-auto">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Forms List */}
        <div className="px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading forms...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load forms. Please try again.</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No forms found</p>
              </div>
            ) : (
              formsByCategory.map((group, idx) => (
                <div key={group.category || idx}>
                  {group.label && (
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                      {group.label}
                    </h2>
                  )}
                  <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
                    {group.forms.map((form) => (
                      <FormRow key={form.id} form={form} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Link */}
        <div className="px-6 py-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Need something else?{' '}
              <a
                href="https://www.cms.gov/Medicare/CMS-Forms/CMS-Forms/CMS-Forms-List"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                CMS Forms Library
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
