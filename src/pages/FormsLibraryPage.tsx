import { useState, useMemo } from 'react';
import {
  Download,
  ExternalLink,
  Search,
  FileText,
  FileEdit,
  X,
  Star
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  featured?: boolean;
  keywords?: string[];
}

// Category configuration
const CATEGORIES: { key: FormCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Forms' },
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
    featured: true,
    keywords: ['part b', 'enrollment', 'iep', 'gep'],
  },
  {
    id: 'cms-l564',
    name: 'CMS-L564',
    description: 'Employment verification for SEP eligibility',
    category: 'cms',
    type: 'external',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564.pdf',
    featured: true,
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
    featured: true,
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
    featured: true,
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

// Form Card Component
function FormCard({ form, compact = false }: { form: Form; compact?: boolean }) {
  const isExternal = form.type === 'external' || form.url.startsWith('http');

  const getTypeIcon = () => {
    switch (form.type) {
      case 'pdf':
        return <Download className="h-4 w-4" />;
      case 'external':
        return <ExternalLink className="h-4 w-4" />;
      case 'fillable':
        return <FileEdit className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (form.category) {
      case 'cms':
        return 'border-l-blue-400';
      case 'compliance':
        return 'border-l-emerald-400';
      case 'assistance':
        return 'border-l-amber-400';
      case 'carrier':
        return 'border-l-slate-400';
    }
  };

  if (compact) {
    // Featured card style - horizontal layout
    return (
      <a
        href={form.url}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all group"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
          <FileText className="h-4 w-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate">{form.name}</p>
          <p className="text-xs text-slate-500 truncate">{form.description}</p>
        </div>
        <div className="shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors">
          {getTypeIcon()}
        </div>
      </a>
    );
  }

  // Grid card style
  return (
    <div className={cn(
      "flex flex-col p-3 bg-white border border-slate-200 border-l-2 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all group",
      getCategoryColor()
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <h3 className="text-sm font-medium text-slate-900 truncate cursor-default">
              {form.name}
            </h3>
          </TooltipTrigger>
          <TooltipContent>{form.name}</TooltipContent>
        </Tooltip>
        <div className="shrink-0 text-slate-400">
          {form.type === 'pdf' ? (
            <FileText className="h-4 w-4" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{form.description}</p>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      >
        <a
          href={form.url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {getTypeIcon()}
          <span className="ml-1.5">{form.type === 'pdf' ? 'Download' : 'Open'}</span>
        </a>
      </Button>
    </div>
  );
}

// Main Component
export default function FormsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'all'>('all');

  // Featured forms for quick access
  const featuredForms = FORMS.filter((form) => form.featured);

  // Filtered forms
  const filteredForms = useMemo(() => {
    return FORMS.filter((form) => {
      // Don't show featured forms in main grid when showing all
      if (selectedCategory === 'all' && !searchQuery && form.featured) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && form.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = form.name.toLowerCase().includes(query);
        const matchesDescription = form.description.toLowerCase().includes(query);
        const matchesKeywords = form.keywords?.some((kw) => kw.toLowerCase().includes(query));
        return matchesName || matchesDescription || matchesKeywords;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* Main Content */}
      <div className="pt-16">
        {/* Header Row - Compact with inline search */}
        <div className="px-6 py-3 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-slate-900 shrink-0">Forms Library</h1>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Row */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="px-6 py-3 bg-gradient-to-b from-amber-50/50 to-slate-50 border-b border-slate-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Quick Access</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {featuredForms.map((form) => (
                  <FormCard key={form.id} form={form} compact />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-6 py-2 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  selectedCategory === cat.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat.label}
              </button>
            ))}
            {searchQuery && (
              <span className="text-xs text-slate-500 ml-auto pl-4">
                {filteredForms.length} result{filteredForms.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Forms Grid */}
        <div className="px-6 py-4">
          <div className="max-w-6xl mx-auto">
            {filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  {searchQuery ? 'No forms match your search' : 'No forms in this category'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery ? 'Try different keywords' : 'Check back later for updates'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredForms.map((form) => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help Footer - Minimal */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Need a form not listed? Check the{' '}
              <a
                href="https://www.cms.gov/Medicare/CMS-Forms/CMS-Forms/CMS-Forms-List"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 underline"
              >
                CMS Forms Library
              </a>
            </p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500"
            >
              <a href="/contact">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
