import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  ExternalLink,
  ArrowLeft,
  FolderOpen,
  Building2,
  Eye,
  Download,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useForms } from '@/hooks/useForms';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

// External links - will be populated with forms you provide
interface ExternalLinkItem {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  keywords?: string[];
}

// CMS and SSA forms
const EXTERNAL_LINKS: ExternalLinkItem[] = [
  // CMS Forms
  {
    id: 'cms-40b',
    name: 'Request for Enrollment in Medicare Part B',
    description: 'CMS-40B - Application to enroll in Medicare Part B during a Special Enrollment Period',
    category: 'cms',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms40b-e.pdf',
    keywords: ['part b', 'enrollment', 'sep', '40b', 'special enrollment'],
  },
  {
    id: 'cms-l564',
    name: 'Medicare Request for Employment Information',
    description: 'CMS-L564 - Employer verification for Part B Special Enrollment Period eligibility',
    category: 'cms',
    url: 'https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564e.pdf',
    keywords: ['employment', 'employer', 'l564', 'verification', 'sep', 'group coverage'],
  },
  {
    id: 'ssa-1020',
    name: 'Extra Help - LIS Form',
    description: 'SSA-1020 - Application for Extra Help with Medicare Prescription Drug Plan Costs (Low Income Subsidy)',
    category: 'cms',
    url: 'https://www.ssa.gov/forms/ssa-1020.pdf',
    keywords: ['extra help', 'lis', 'low income subsidy', 'prescription', 'drug costs', '1020'],
  },
];

// Category configuration with icons
type CategoryKey = 'client_intake' | 'cms';

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: typeof FolderOpen;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'client_intake', label: 'Client Intake', icon: FolderOpen },
  { key: 'cms', label: 'CMS Forms', icon: Building2 },
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
  const { homePath } = useNavigationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('client_intake');
  const { forms: dbForms, loading, error } = useForms();
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; downloadUrl: string } | null>(null);

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

  // Get preview URL - external PDFs and Word docs use Google Docs Viewer
  const getPreviewUrl = (url: string, isExternal: boolean): string => {
    const lowerUrl = url.toLowerCase();
    // Use Google Docs Viewer for Word docs and external PDFs (government sites block iframes)
    if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') || (isExternal && lowerUrl.endsWith('.pdf'))) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  // Check if a form can be previewed (PDF or Word doc)
  const canPreview = (form: DisplayForm): boolean => {
    const lowerUrl = form.url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx');
  };

  // Handle form click - preview if possible, otherwise open
  const handleFormClick = (form: DisplayForm, e: React.MouseEvent) => {
    e.preventDefault();
    if (canPreview(form)) {
      setPreviewDoc({
        url: getPreviewUrl(form.url, form.isExternal),
        name: form.name,
        downloadUrl: form.url // Original URL for download
      });
    } else {
      window.open(form.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Link to={homePath} className="flex items-center gap-2">
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
              to={homePath}
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
                      const isPreviewable = canPreview(form);
                      const isWordDoc = form.url.toLowerCase().endsWith('.doc') || form.url.toLowerCase().endsWith('.docx');
                      const isPdf = form.url.toLowerCase().endsWith('.pdf');
                      const isLink = !isPdf && !isWordDoc;
                      return (
                        <div
                          key={form.id}
                          className="px-5 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isPdf ? 'bg-red-50' : isWordDoc ? 'bg-blue-50' : 'bg-stone-50'
                              }`}
                            >
                              {isLink ? (
                                <ExternalLink className="w-5 h-5 text-stone-600" />
                              ) : (
                                <FileText className={`w-5 h-5 ${isPdf ? 'text-red-600' : 'text-blue-600'}`} />
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
                                      : isWordDoc
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {isPdf ? 'PDF' : isWordDoc ? 'DOC' : 'Link'}
                                </span>
                              </div>
                              <p className="text-xs text-[#5c5552]">{form.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPreviewable ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(form.url, '_blank');
                                  }}
                                  className="text-sm text-[#5c5552] hover:text-[#292524] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button
                                  onClick={(e) => handleFormClick(form, e)}
                                  className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Quick View"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => handleFormClick(form, e)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                Open
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
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

      {/* Document Preview Modal */}
      <DocumentPreview
        url={previewDoc?.url || ''}
        label={previewDoc?.name || ''}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        downloadUrl={previewDoc?.downloadUrl}
      />
    </div>
  );
}
