import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GH } from '@/config/golden-hour';

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
  const { forms: dbForms, loading, error } = useForms();

  // URL state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') as CategoryKey) || 'client_intake';

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };

  // Preview doc state (transient - doesn't need URL persistence)
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
    <div className="min-h-screen flex flex-col grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between pt-6 pb-4 px-4 sm:px-6 max-w-[1100px] mx-auto w-full">
        <Link to={homePath} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Title + Search row */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold" style={{ fontFamily: GH.serif, color: GH.textPrimary }}>
                Forms Library
              </h1>
              {/* Search */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GH.textMuted }} />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => updateParams({ q: e.target.value || null })}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-2xl bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  style={{ border: `1px solid ${GH.border}`, color: GH.textPrimary }}
                />
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left sidebar - Categories */}
            <div className="col-span-3">
              <GlassPanel padding={0} style={{ overflow: 'hidden' }}>
                {CATEGORIES.map((category, idx) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.key;
                  return (
                    <button
                      key={category.key}
                      onClick={() => updateParams({ category: category.key, q: null })}
                      className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                      style={{
                        background: isSelected ? GH.tileHover : 'transparent',
                        fontWeight: isSelected ? 600 : 400,
                        color: GH.textPrimary,
                        borderBottom: idx < CATEGORIES.length - 1 ? `1px solid ${GH.border}` : 'none',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = GH.tileHover; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className="w-4 h-4"
                          style={{ color: isSelected ? GH.textPrimary : GH.textSecondary }}
                        />
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: isSelected ? GH.border : GH.tileBg,
                          color: GH.textSecondary,
                        }}
                      >
                        {categoryCounts[category.key] || 0}
                      </span>
                    </button>
                  );
                })}
              </GlassPanel>
            </div>

            {/* Right content - Forms list */}
            <div className="col-span-9">
              <GlassPanel padding={0}>
                {/* Category header */}
                <div className="px-5 py-3" style={{ borderBottom: `1px solid ${GH.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: GH.textMuted }}>
                    {currentCategory?.label}
                  </span>
                </div>

                {/* Forms list */}
                {loading ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm" style={{ color: GH.textSecondary }}>Loading forms...</p>
                  </div>
                ) : error ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-red-600">Failed to load forms. Please try again.</p>
                  </div>
                ) : filteredForms.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: GH.textFaint }} />
                    <p className="text-sm" style={{ color: GH.textSecondary }}>
                      {searchQuery
                        ? `No forms found matching "${searchQuery}"`
                        : `No forms available in ${currentCategory?.label}`}
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredForms.map((form, idx) => {
                      const isPreviewable = canPreview(form);
                      const isWordDoc = form.url.toLowerCase().endsWith('.doc') || form.url.toLowerCase().endsWith('.docx');
                      const isPdf = form.url.toLowerCase().endsWith('.pdf');
                      const isLink = !isPdf && !isWordDoc;
                      return (
                        <div
                          key={form.id}
                          className="px-5 py-3 flex items-center justify-between transition-colors group cursor-pointer"
                          style={{ borderTop: idx > 0 ? `1px solid ${GH.border}` : 'none' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
                                <p className="text-sm font-medium" style={{ color: GH.textPrimary }}>
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
                              <p className="text-xs" style={{ color: GH.textSecondary }}>{form.description}</p>
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
                                  className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
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
              </GlassPanel>

              {/* CMS Link */}
              <div className="mt-4 text-center">
                <p className="text-sm" style={{ color: GH.textSecondary }}>
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
