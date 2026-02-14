import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  ExternalLink,
  FolderOpen,
  Building2,
} from 'lucide-react';
import { useForms } from '@/hooks/useForms';
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

  // Row hover state
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  // Rail hover state
  const [hoveredRail, setHoveredRail] = useState<string | null>(null);

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
    <div
      style={{
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          padding: '16px 24px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: title + stat badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Lora', serif",
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Forms
          </h1>
          <span
            style={{
              background: 'var(--bg-subtle)',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 8,
              color: 'var(--text-muted)',
            }}
          >
            {allForms.length} form{allForms.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: search input */}
        <div style={{ position: 'relative', width: 220 }}>
          <Search
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => updateParams({ q: e.target.value || null })}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 7,
              paddingBottom: 7,
              fontSize: 12,
              border: '1px solid var(--bg-muted)',
              borderRadius: 8,
              outline: 'none',
              color: 'var(--text-primary)',
              background: 'white',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bg-muted)'; }}
          />
        </div>
      </div>

      {/* ── Split Card Container ── */}
      <div
        style={{
          margin: '0 24px 14px',
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* ── Left Rail ── */}
        <div
          style={{
            width: 180,
            borderRight: '1px solid #F0EBE2',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Rail header */}
          <div
            style={{
              padding: '12px 16px 8px',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-faint)',
            }}
          >
            Categories
          </div>

          {/* Rail items */}
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.key;
            const isHovered = hoveredRail === category.key;
            const count = categoryCounts[category.key] || 0;

            return (
              <button
                key={category.key}
                onClick={() => updateParams({ category: category.key, q: null })}
                onMouseEnter={() => setHoveredRail(category.key)}
                onMouseLeave={() => setHoveredRail(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  border: 'none',
                  borderLeft: isSelected
                    ? '3px solid var(--gold)'
                    : '3px solid transparent',
                  background: isSelected
                    ? 'rgba(201,168,76,0.06)'
                    : isHovered
                      ? 'var(--bg-subtle)'
                      : 'transparent',
                  cursor: 'pointer',
                  opacity: count === 0 ? 0.35 : 1,
                  width: '100%',
                  textAlign: 'left',
                  font: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconComponent
                    style={{
                      width: 14,
                      height: 14,
                      color: isSelected ? 'var(--gold-dark)' : 'var(--text-muted)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {category.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: 10,
                    background: isSelected
                      ? 'rgba(201,168,76,0.15)'
                      : 'var(--bg-subtle)',
                    color: isSelected ? 'var(--gold-dark)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Detail Panel ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          {/* Detail header */}
          <div
            style={{
              padding: '10px 18px 8px',
              borderBottom: '1px solid #F0EBE2',
            }}
          >
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-faint)',
              }}
            >
              {currentCategory?.label} · {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Detail body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Loading forms...
                </p>
              </div>
            ) : error ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>
                  Failed to load forms. Please try again.
                </p>
              </div>
            ) : filteredForms.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 8,
                }}
              >
                <FileText
                  style={{ width: 28, height: 28, color: 'var(--text-faint)' }}
                />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {searchQuery
                    ? `No forms found matching "${searchQuery}"`
                    : `No forms available in ${currentCategory?.label}`}
                </p>
              </div>
            ) : (
              filteredForms.map((form, idx) => {
                const isPreviewable = canPreview(form);
                const isWordDoc =
                  form.url.toLowerCase().endsWith('.doc') ||
                  form.url.toLowerCase().endsWith('.docx');
                const isPdf = form.url.toLowerCase().endsWith('.pdf');
                const isLink = !isPdf && !isWordDoc;
                const isHovered = hoveredRow === form.id;

                return (
                  <div
                    key={form.id}
                    onMouseEnter={() => setHoveredRow(form.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      padding: '10px 18px',
                      borderBottom:
                        idx < filteredForms.length - 1
                          ? '1px solid #F0EBE2'
                          : 'none',
                      background: isHovered ? 'var(--bg-subtle)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 120ms',
                    }}
                  >
                    {/* Form icon square */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isPdf
                          ? 'rgba(196,74,63,0.08)'
                          : isWordDoc
                            ? 'rgba(74,127,181,0.08)'
                            : 'rgba(168,154,132,0.1)',
                        color: isPdf
                          ? 'var(--red)'
                          : isWordDoc
                            ? 'var(--blue)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {isLink ? (
                        <ExternalLink style={{ width: 14, height: 14 }} />
                      ) : (
                        <FileText style={{ width: 14, height: 14 }} />
                      )}
                    </div>

                    {/* Form info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {form.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {form.description}
                      </div>
                    </div>

                    {/* Type tag */}
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        flexShrink: 0,
                        background: isPdf
                          ? 'rgba(196,74,63,0.08)'
                          : isWordDoc
                            ? 'rgba(74,127,181,0.08)'
                            : 'rgba(168,154,132,0.1)',
                        color: isPdf
                          ? 'var(--red)'
                          : isWordDoc
                            ? 'var(--blue)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {isPdf ? 'PDF' : isWordDoc ? 'DOC' : 'Link'}
                    </span>

                    {/* Action buttons — visible on hover */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 150ms',
                        flexShrink: 0,
                      }}
                    >
                      {isPreviewable ? (
                        <>
                          <button
                            onClick={(e) => handleFormClick(form, e)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(74,127,181,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: 'var(--blue)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              font: 'inherit',
                            }}
                          >
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(form.url, '_blank');
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(74,127,181,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: 'var(--blue)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              font: 'inherit',
                            }}
                          >
                            Download
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => handleFormClick(form, e)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(74,127,181,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--blue)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          Open ↗
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CMS Footer */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid #F0EBE2',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Need something else?{' '}
              <a
                href="https://www.cms.gov/Medicare/CMS-Forms/CMS-Forms/CMS-Forms-List"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--blue)', textDecoration: 'none' }}
              >
                Browse CMS Forms Library →
              </a>
            </span>
          </div>
        </div>
      </div>

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
