import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  ExternalLink,
  ArrowLeft,
  FolderOpen,
  ClipboardList,
  Building2,
  HeartHandshake,
  Download,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useForms } from '@/hooks/useForms';

// External links that don't change often (CMS, SSA, etc.)
interface ExternalLinkItem {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  keywords?: string[];
}

const EXTERNAL_LINKS: ExternalLinkItem[] = [
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
];

// Category configuration with icons
type CategoryKey = 'compliance' | 'client_intake' | 'cms' | 'assistance';

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: typeof ClipboardList;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'compliance', label: 'Compliance Forms', icon: ClipboardList },
  { key: 'client_intake', label: 'Client Intake', icon: FolderOpen },
  { key: 'cms', label: 'CMS Forms', icon: Building2 },
  { key: 'assistance', label: 'Client Assistance', icon: HeartHandshake },
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

export default function FormsLibraryPage() {
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('compliance');
  const { forms: dbForms, loading, error } = useForms();

  // Convert DB forms to display format and merge with external links
  const allForms = useMemo(() => {
    const displayForms: DisplayForm[] = [];

    // Add DB forms
    dbForms.forEach((form) => {
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
    EXTERNAL_LINKS.forEach((link) => {
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

  // Count forms per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      counts[cat.key] = allForms.filter((f) => f.category === cat.key).length;
    });
    return counts;
  }, [allForms]);

  // Filter forms by selected category and search query
  const filteredForms = useMemo(() => {
    return allForms.filter((form) => {
      // Must match category
      if (form.category !== selectedCategory) return false;

      // If search query, must match name, description, or keywords
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          form.name.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query) ||
          form.keywords?.some((kw) => kw.toLowerCase().includes(query));
        return matchesSearch;
      }

      return true;
    });
  }, [allForms, selectedCategory, searchQuery]);

  const currentCategory = CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
            </Link>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5c5552] hidden sm:block">{profile?.full_name || 'Agent'}</span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Back link + Title + Search row */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-semibold text-[#292524]">
                Forms Library
              </h1>
              {/* Search */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5552]" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#e8e4dd] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left sidebar - Categories */}
            <div className="col-span-3">
              <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden">
                {CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.key;
                  return (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-[#e8e4dd] last:border-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-stone-50 text-[#292524]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className={`w-4 h-4 ${
                            isSelected ? 'text-white/80' : 'text-[#5c5552]'
                          }`}
                        />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 text-[#5c5552]'
                        }`}
                      >
                        {categoryCounts[category.key] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right content - Forms list */}
            <div className="col-span-9">
              <div className="bg-white border border-[#e8e4dd] rounded-xl">
                {/* Category header */}
                <div className="px-5 py-4 border-b border-[#e8e4dd]">
                  <h2 className="font-serif text-lg font-semibold text-[#292524]">
                    {currentCategory?.label}
                  </h2>
                </div>

                {/* Forms list */}
                {loading ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-[#5c5552]">Loading forms...</p>
                  </div>
                ) : error ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-red-600">Failed to load forms. Please try again.</p>
                  </div>
                ) : filteredForms.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <FileText className="w-12 h-12 text-[#e8e4dd] mx-auto mb-3" />
                    <p className="text-sm text-[#5c5552]">
                      {searchQuery
                        ? `No forms found matching "${searchQuery}"`
                        : `No forms available in ${currentCategory?.label}`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e4dd]">
                    {filteredForms.map((form) => {
                      const isPdf = !form.isExternal || form.url.endsWith('.pdf');
                      return (
                        <a
                          key={form.id}
                          href={form.url}
                          target={form.isExternal ? '_blank' : undefined}
                          rel={form.isExternal ? 'noopener noreferrer' : undefined}
                          className="px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isPdf ? 'bg-red-50' : 'bg-blue-50'
                              }`}
                            >
                              {isPdf ? (
                                <FileText className="w-5 h-5 text-red-600" />
                              ) : (
                                <ExternalLink className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[#292524]">
                                  {form.name}
                                </p>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    isPdf
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {isPdf ? 'PDF' : 'Link'}
                                </span>
                              </div>
                              <p className="text-xs text-[#5c5552]">{form.description}</p>
                            </div>
                          </div>
                          <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                            {isPdf ? (
                              <>
                                <Download className="w-4 h-4" />
                                Download
                              </>
                            ) : (
                              <>
                                Open
                                <ExternalLink className="w-4 h-4" />
                              </>
                            )}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CMS Link */}
              <div className="mt-4 text-center">
                <p className="text-sm text-[#5c5552]">
                  Need something else?{' '}
                  <a
                    href="https://www.cms.gov/Medicare/CMS-Forms/CMS-Forms/CMS-Forms-List"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Browse CMS Forms Library
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
        <p className="text-xs text-[#5c5552]/50">
          Powered by <span className="text-[#5c5552]/70">Tyler Insurance Group</span>
        </p>
      </footer>
    </div>
  );
}
