# Forms Library & Auth Pages — Homestead Redesign Audit

**Generated:** 2026-02-13
**Purpose:** Complete file contents + dependency map for design lead handoff

---

## Table of Contents

1. [Forms Library Page](#1-forms-library-page)
2. [Forms Library Dependencies](#2-forms-library-dependencies)
3. [Auth Pages](#3-auth-pages)
4. [Auth Page Dependencies](#4-auth-page-dependencies)
5. [Shared Design System: golden-hour.ts](#5-shared-design-system-golden-hourts)
6. [Routing Summary](#6-routing-summary)
7. [Design Pattern Summary](#7-design-pattern-summary)

---

## 1. Forms Library Page

**File:** `src/pages/FormsLibraryPage.tsx`
**Lines:** 405
**Route:** `/forms-library` — inside `<AgentShell />` (protected, requires auth)
**Uses golden-hour.ts:** YES — `import { GH } from '@/config/golden-hour'`
**Uses GlassPanel:** YES — `import { GlassPanel } from '@/components/ui/GlassPanel'`
**Forms data:** Hybrid — DB forms fetched via `useForms()` hook (Supabase `forms` table) + hardcoded `EXTERNAL_LINKS` array for CMS/SSA forms

### Full File Contents

```tsx
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  ExternalLink,
  FolderOpen,
  Building2,
  Eye,
  Download,
} from 'lucide-react';
import { useForms } from '@/hooks/useForms';
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
    <div className="px-8 py-5">
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
```

### Custom Imports Summary

| Import | File Path | golden-hour? |
|--------|-----------|-------------|
| `useForms` | `src/hooks/useForms.ts` | No |
| `DocumentPreview` | `src/components/ui/DocumentPreview.tsx` | No |
| `GlassPanel` | `src/components/ui/GlassPanel.tsx` | YES |
| `GH` | `src/config/golden-hour.ts` | YES (it IS the file) |

---

## 2. Forms Library Dependencies

### `src/hooks/useForms.ts` (56 lines)

```ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Form, FormsByCategory, FormCategory } from '@/types/forms';

interface UseFormsReturn {
  forms: Form[];
  formsByCategory: FormsByCategory;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useForms(): UseFormsReturn {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('forms')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setForms((data as Form[]) || []);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch forms'));
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
  }, [refreshKey]);

  // Group forms by category
  const formsByCategory: FormsByCategory = {
    compliance: forms.filter(f => f.category === 'compliance'),
    client_intake: forms.filter(f => f.category === 'client_intake'),
    enrollment: forms.filter(f => f.category === 'enrollment'),
    other: forms.filter(f => !['compliance', 'client_intake', 'enrollment'].includes(f.category)),
  };

  const refetch = () => setRefreshKey(k => k + 1);

  return { forms, formsByCategory, loading, error, refetch };
}
```

### `src/types/forms.ts` (30 lines)

```ts
export type FormCategory = 'compliance' | 'client_intake' | 'enrollment' | 'other';

export interface Form {
  id: string;
  category: FormCategory;
  name: string;
  description: string | null;
  file_path: string;
  year: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormsByCategory {
  compliance: Form[];
  client_intake: Form[];
  enrollment: Form[];
  other: Form[];
}

// Display labels for categories
export const FORM_CATEGORY_LABELS: Record<FormCategory, string> = {
  compliance: 'Compliance Forms',
  client_intake: 'Client Intake',
  enrollment: 'Enrollment Forms',
  other: 'Other Forms',
};
```

### `src/components/ui/DocumentPreview.tsx` (69 lines)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';

interface DocumentPreviewProps {
  url: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  /** Original document URL for download (if different from preview URL) */
  downloadUrl?: string;
}

export function DocumentPreview({ url, label, isOpen, onClose, downloadUrl }: DocumentPreviewProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
  const actualDownloadUrl = downloadUrl || url;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
          <DialogTitle className="font-medium text-foreground">{label}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.open(actualDownloadUrl, '_blank')}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.open(actualDownloadUrl, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in New Tab
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted min-h-[400px]">
          {isImage ? (
            <div className="flex items-center justify-center p-4 h-full">
              <img
                src={url}
                alt={label}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
              />
            </div>
          ) : (
            <iframe
              src={url}
              title={label}
              className="w-full h-[70vh] border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### `src/components/ui/GlassPanel.tsx` (39 lines)

```tsx
import { forwardRef, type ElementType, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { GH } from '@/config/golden-hour';

type GlassPanelProps<T extends ElementType = 'div'> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  padding?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'style'>;

export const GlassPanel = forwardRef<HTMLElement, GlassPanelProps>(
  ({ as: Component = 'div', children, className, padding = 16, borderRadius = 18, style, ...rest }, ref) => {
    const Tag = Component as ElementType;

    return (
      <Tag
        ref={ref}
        className={className}
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          boxShadow: GH.glassShadow,
          borderRadius,
          padding,
          ...style,
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
```

---

## 3. Auth Pages

### 3a. `src/pages/AuthPage.tsx` (387 lines)

**Route:** `/auth` — standalone, NO shell
**Uses golden-hour.ts:** YES — `import { GH } from '@/config/golden-hour'`
**Uses GlassPanel:** NO (glass styles applied inline)

#### Imports

| Import | Source | Custom? |
|--------|--------|---------|
| `useState, useEffect` | react | No |
| `useNavigate, Link` | react-router-dom | No |
| `supabase` | `@/integrations/supabase/client` | Infra |
| `useAuth` | `@/hooks/useAuth` | YES |
| `Button` | `@/components/ui/button` | UI primitive |
| `Input` | `@/components/ui/input` | UI primitive |
| `Label` | `@/components/ui/label` | UI primitive |
| `Textarea` | `@/components/ui/textarea` | UI primitive |
| `Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription` | `@/components/ui/dialog` | UI primitive |
| `GH` | `@/config/golden-hour` | YES |
| `toast` | sonner | No |
| `Loader2, Mail, CheckCircle2, Send` | lucide-react | No |
| `tylerLogo` | `@/assets/tyler-logo.webp` | YES (brand asset) |
| `formatPhoneNumber` | `@/lib/formatters` | YES |
| `logActivity, ActivityAction` | `@/utils/activityLogger` | YES |

#### Full File Contents

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { GH } from '@/config/golden-hour';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle2, Send } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.webp';
import { formatPhoneNumber } from '@/lib/formatters';
import { logActivity, ActivityAction } from '@/utils/activityLogger';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDefaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isAuthenticated, loading, navigate, getDefaultRoute]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if user account is active
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active, first_login_at')
          .eq('user_id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          // Sign out the inactive user immediately
          await supabase.auth.signOut();
          toast.error('Your account has been deactivated. Please contact support.');
          return;
        }

        // Set first_login_at for agents who haven't had it recorded yet
        if (profile && !profile.first_login_at) {
          await supabase
            .from('profiles')
            .update({ first_login_at: new Date().toISOString() })
            .eq('user_id', data.user.id);
        }
      }

      // Log successful login
      await logActivity(ActivityAction.LOGIN);

      toast.success('Welcome back!');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryName.trim() || !inquiryEmail.trim()) {
      toast.error('Please provide your name and email');
      return;
    }

    // Client-side rate limiting
    const lastSubmission = localStorage.getItem('inquiry_last_submit');
    const cooldownMs = 10 * 60 * 1000; // 10 minutes
    if (lastSubmission && Date.now() - parseInt(lastSubmission) < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - (Date.now() - parseInt(lastSubmission))) / 60000);
      toast.error(`Please wait ${minutesLeft} minute(s) before submitting again.`);
      return;
    }

    setInquirySubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-agent-inquiry', {
        body: {
          name: inquiryName.trim(),
          email: inquiryEmail.trim(),
          phone: inquiryPhone.trim(),
          message: inquiryMessage.trim(),
        },
      });

      if (error) {
        throw error;
      }

      // Store submission time for client-side rate limiting
      localStorage.setItem('inquiry_last_submit', Date.now().toString());

      setInquirySubmitted(true);
      toast.success('Inquiry sent! We\'ll be in touch soon.');
    } catch (err: any) {
      console.error('Inquiry error:', err);
      if (err?.message?.includes('429') || err?.message?.includes('Too many')) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to send inquiry. Please try again or contact us directly.');
      }
    } finally {
      setInquirySubmitting(false);
    }
  };

  const resetInquiryForm = () => {
    setInquiryName('');
    setInquiryEmail('');
    setInquiryPhone('');
    setInquiryMessage('');
    setInquirySubmitted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: GH.pageBg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: GH.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
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

      <div
        className="w-full max-w-[495px] relative"
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          borderRadius: 22,
          boxShadow: GH.glassShadow,
          opacity: 0,
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}
      >
        <div className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Welcome</h1>
            <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>Sign in to access your account</p>
          </div>
        </div>
        <div className="space-y-12 px-11 pb-16">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="login-email" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Password</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs hover:underline font-medium"
                  style={{ color: GH.gold }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-[54px] mt-2 text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Contact section */}
          <div className="pt-2">
            <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
            <p className="text-center mb-7 leading-relaxed" style={{ fontSize: 13, color: GH.textSecondary }}>
              Don't have an account? Contact us to get started.
            </p>
            <Dialog open={contactOpen} onOpenChange={(open) => {
              setContactOpen(open);
              if (!open) resetInquiryForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-[50px] font-medium rounded-2xl transition-all duration-200" style={{ borderColor: GH.border, color: GH.textPrimary }}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Become an Agent</DialogTitle>
                  <DialogDescription>
                    Fill out the form below and our team will reach out to you.
                  </DialogDescription>
                </DialogHeader>

                {inquirySubmitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Thank you!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've received your inquiry and will be in touch shortly.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setContactOpen(false)}>
                      Close
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-name">Name *</Label>
                        <Input
                          id="inquiry-name"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-phone">Phone</Label>
                        <Input
                          id="inquiry-phone"
                          type="tel"
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(formatPhoneNumber(e.target.value))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-email">Email *</Label>
                      <Input
                        id="inquiry-email"
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-message">Message</Label>
                      <Textarea
                        id="inquiry-message"
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Tell us about your experience and what you're looking for..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={inquirySubmitting}>
                      {inquirySubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Inquiry
                        </>
                      )}
                    </Button>

                    {/* Help text */}
                    <div className="pt-4 border-t text-center">
                      <p className="text-xs text-muted-foreground">Need help? Contact your administrator.</p>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3b. `src/pages/auth/SetPasswordPage.tsx` (473 lines)

**Route:** `/auth/set-password` — standalone, NO shell
**Uses golden-hour.ts:** YES — `import { GH } from '@/config/golden-hour'`
**Uses GlassPanel:** NO (glass styles applied inline)

#### Imports

| Import | Source | Custom? |
|--------|--------|---------|
| `useState, useEffect, useMemo` | react | No |
| `useNavigate, Link` | react-router-dom | No |
| `supabase` | `@/integrations/supabase/client` | Infra |
| `Button` | `@/components/ui/button` | UI primitive |
| `Input` | `@/components/ui/input` | UI primitive |
| `Label` | `@/components/ui/label` | UI primitive |
| `toast` | sonner | No |
| `Loader2, Eye, EyeOff, CheckCircle, KeyRound, Check, X` | lucide-react | No |
| `tylerLogo` | `@/assets/tyler-logo.webp` | YES (brand asset) |
| `GH` | `@/config/golden-hour` | YES |

#### Full File Contents

```tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, KeyRound, Check, X } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.webp';
import { GH } from '@/config/golden-hour';

// Password validation helper
const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const checks = {
    length: password.length >= minLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber,
    special: hasSpecial,
  };

  const meetsRequirements =
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special;

  if (!meetsRequirements) {
    return {
      isValid: false,
      message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.',
      strength: 'weak',
      checks,
    };
  }

  const strength = password.length >= 16 ? 'strong' : 'medium';

  return { isValid: true, message: '', strength, checks };
};

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes - this will fire when Supabase processes the recovery token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          setHasValidSession(true);
          setIsLoading(false);
          setError(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setHasValidSession(false);
      }
    });

    // Also check for existing session (in case the auth event already fired)
    const checkExistingSession = async () => {
      // Give Supabase a moment to process the hash params
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasValidSession(true);
      } else {
        // Check if there are recovery params in the URL hash
        const hash = window.location.hash;
        if (!hash.includes('access_token')) {
          setError('Invalid or expired link. Please contact your administrator for a new setup link.');
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  // Memoized password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  // Role-based redirect logic - used by both auto-redirect and Continue button
  const handleRedirect = async () => {
    try {
      // Re-fetch user to ensure we have fresh data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');

      if (isAdmin) {
        // Admins go to admin dashboard
        window.location.href = '/admin';
        return;
      }

      // For non-admins, check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_status')
        .eq('user_id', user.id)
        .single();

      if (profile?.onboarding_status === 'CONTRACTING_REQUIRED') {
        window.location.href = '/contracting';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error during redirect:', err);
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Update profile to track password creation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ password_created_at: new Date().toISOString(), first_login_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      setIsSuccess(true);
      toast.success('Password set successfully!');

      // Auto-redirect after delay
      setTimeout(() => {
        handleRedirect();
      }, 1500);
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div
          className="w-full max-w-[495px] relative"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            borderRadius: 22,
            boxShadow: GH.glassShadow,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <div className="pt-16 pb-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6" style={{ color: GH.gold }} />
            <p style={{ fontSize: 15, color: GH.textSecondary }}>Verifying your link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div
          className="w-full max-w-[495px] relative"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            borderRadius: 22,
            boxShadow: GH.glassShadow,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <div className="text-center space-y-8 pt-14 pb-2">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Password Set!</h1>
              <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
                Redirecting you to get started...
              </p>
            </div>
          </div>
          <div className="pb-16 px-11">
            <Button
              onClick={handleRedirect}
              className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      </div>

      <div
        className="w-full max-w-[495px] relative"
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          borderRadius: 22,
          boxShadow: GH.glassShadow,
          opacity: 0,
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}
      >
        <div className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full p-4" style={{ background: 'rgba(60,48,28,0.04)' }}>
              <KeyRound className="h-10 w-10" style={{ color: GH.textMuted }} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Set Your Password</h1>
            <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
              Create a secure password to access your account
            </p>
          </div>
        </div>
        <div className="px-11 pb-16">
          {!hasValidSession && error ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-[50px] px-8 font-medium rounded-2xl transition-all duration-200"
                  style={{ borderColor: GH.border, color: GH.textPrimary }}
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={12}
                    className="h-[56px] px-5 pr-12 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: GH.textMuted }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(60,48,28,0.04)' }}>
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordValidation.strength === 'strong'
                              ? 'w-full bg-green-500'
                              : passwordValidation.strength === 'medium'
                              ? 'w-2/3 bg-amber-500'
                              : 'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordValidation.strength === 'strong'
                            ? 'text-green-600'
                            : passwordValidation.strength === 'medium'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {passwordValidation.strength === 'strong'
                          ? 'Strong'
                          : passwordValidation.strength === 'medium'
                          ? 'Medium'
                          : 'Weak'}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.length ? 'text-green-600' : ''}`} style={passwordValidation.checks.length ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.length ? <Check size={14} /> : <X size={14} />}
                        <span>12+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.uppercase ? 'text-green-600' : ''}`} style={passwordValidation.checks.uppercase ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.uppercase ? <Check size={14} /> : <X size={14} />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.lowercase ? 'text-green-600' : ''}`} style={passwordValidation.checks.lowercase ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.lowercase ? <Check size={14} /> : <X size={14} />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.number ? 'text-green-600' : ''}`} style={passwordValidation.checks.number ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.number ? <Check size={14} /> : <X size={14} />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordValidation.checks.special ? 'text-green-600' : ''}`} style={passwordValidation.checks.special ? {} : { color: GH.textMuted }}>
                        {passwordValidation.checks.special ? <Check size={14} /> : <X size={14} />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                  boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                  e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
                }}
                disabled={isSubmitting || !hasValidSession}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Set Password & Continue
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3c. `src/pages/auth/ForgotPasswordPage.tsx` (203 lines)

**Route:** `/auth/forgot-password` — standalone, NO shell
**Uses golden-hour.ts:** YES — `import { GH } from '@/config/golden-hour'`
**Uses GlassPanel:** NO (glass styles applied inline)

#### Imports

| Import | Source | Custom? |
|--------|--------|---------|
| `useState` | react | No |
| `Link` | react-router-dom | No |
| `supabase` | `@/integrations/supabase/client` | Infra |
| `Button` | `@/components/ui/button` | UI primitive |
| `Input` | `@/components/ui/input` | UI primitive |
| `Label` | `@/components/ui/label` | UI primitive |
| `toast` | sonner | No |
| `Loader2, ArrowLeft, Mail, CheckCircle` | lucide-react | No |
| `tylerLogo` | `@/assets/tyler-logo.webp` | YES (brand asset) |
| `GH` | `@/config/golden-hour` | YES |

#### Full File Contents

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.webp';
import { GH } from '@/config/golden-hour';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
        {/* Atmospheric blurs */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div
          className="w-full max-w-[495px] relative"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            borderRadius: 22,
            boxShadow: GH.glassShadow,
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <div className="text-center space-y-8 pt-14 pb-2">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Check Your Email</h1>
              <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
                We sent a password reset link to <strong style={{ color: GH.textPrimary }}>{email}</strong>
              </p>
            </div>
          </div>
          <div className="space-y-8 px-11 pb-16">
            <p className="text-center leading-relaxed" style={{ fontSize: 13, color: GH.textSecondary }}>
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </p>
            <div className="text-center">
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="h-[50px] px-8 font-medium rounded-2xl transition-all duration-200"
                  style={{ borderColor: GH.border, color: GH.textPrimary }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
            <p className="text-xs text-center" style={{ color: GH.textMuted }}>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="hover:underline font-medium"
                style={{ color: GH.gold }}
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      </div>

      <div
        className="w-full max-w-[495px] relative"
        style={{
          background: GH.glass,
          backdropFilter: `blur(${GH.glassBlur})`,
          WebkitBackdropFilter: `blur(${GH.glassBlur})`,
          border: `1px solid ${GH.glassBorder}`,
          borderRadius: 22,
          boxShadow: GH.glassShadow,
          opacity: 0,
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}
      >
        <div className="text-center space-y-8 pt-14 pb-2">
          <div className="relative pb-6">
            <img src={tylerLogo} alt="Logo" className="h-[60px] mx-auto" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: `linear-gradient(to right, transparent, ${GH.border}, transparent)` }} />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full p-4" style={{ background: 'rgba(60,48,28,0.04)' }}>
              <Mail className="h-10 w-10" style={{ color: GH.textMuted }} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-serif" style={{ color: GH.textPrimary, letterSpacing: '-0.01em' }}>Forgot Password?</h1>
            <p style={{ fontSize: 13, color: GH.textSecondary, lineHeight: 1.7 }}>
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>
        </div>
        <div className="px-11 pb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.07em', color: GH.textMuted }}>Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 focus:border-primary/50 focus:ring-0 focus:shadow-[0_0_0_4px_rgba(163,133,41,0.1),0_1px_3px_rgba(0,0,0,0.04)] placeholder:text-muted-foreground/35"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-[54px] text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            <div className="text-center pt-2">
              <Link
                to="/auth"
                className="text-[13px] hover:underline transition-colors inline-flex items-center"
                style={{ color: GH.textSecondary }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Auth Page Dependencies

### `src/lib/formatters.ts` (167 lines)

Only `formatPhoneNumber` is used by AuthPage. Full contents:

```ts
// Phone number formatting - auto-formats as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = digits.slice(0, 10);

  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

// SSN formatting - formats as XXX-XX-XXXX
export function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);

  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export const formatRoutingNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

export const formatAccountNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 17);
};

export const formatNPN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

export const isValidRoutingNumber = (routing: string): boolean => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  const checksum =
    3 * (parseInt(digits[0]) + parseInt(digits[3]) + parseInt(digits[6])) +
    7 * (parseInt(digits[1]) + parseInt(digits[4]) + parseInt(digits[7])) +
    1 * (parseInt(digits[2]) + parseInt(digits[5]) + parseInt(digits[8]));
  return checksum % 10 === 0;
};

export const getBankName = (routing: string): string | null => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return null;
  const bankMap: Record<string, string> = {
    '0210': 'JPMorgan Chase',
    '0220': 'JPMorgan Chase',
    '0260': 'Bank of America',
    '0420': 'PNC Bank',
    '0440': 'PNC Bank',
    '0530': 'US Bank',
    '0610': 'Wells Fargo',
    '0710': 'Wells Fargo',
    '0720': 'Wells Fargo',
    '0830': 'Fifth Third Bank',
    '0840': 'Fifth Third Bank',
    '1010': 'TD Bank',
    '1110': 'Capital One',
    '1210': 'Regions Bank',
    '1240': 'Republic Bank',
    '2420': 'Community Trust Bank',
    '2830': 'Truist',
    '3140': 'Ally Bank',
  };
  const prefix = digits.slice(0, 4);
  return bankMap[prefix] || null;
};

export function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  return `${limited.slice(0, 2)}-${limited.slice(2)}`;
}

export function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `•••-••-${digits.slice(-4)}`;
}

export function maskEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `••-•••${digits.slice(-4)}`;
}

export function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  if (limited.length === 0) return '';
  if (limited.length <= 5) return limited;
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
}

export function isValidZipCode(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 5 || digits.length === 9;
}
```

### `src/utils/activityLogger.ts` (201 lines)

Only `logActivity` and `ActivityAction` are used by AuthPage. Full contents:

```ts
import { supabase } from '@/integrations/supabase/client';

export const ActivityAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  CONTRACTING_STARTED: 'contracting_started',
  CONTRACTING_STEP_COMPLETED: 'contracting_step_completed',
  CONTRACTING_SUBMITTED: 'contracting_submitted',
  CONTRACTING_DELETED: 'contracting_deleted',
  AGENT_APPROVED: 'agent_approved',
  AGENT_REJECTED: 'agent_rejected',
  SENT_TO_PINNACLE: 'sent_to_pinnacle',
  QUEUE_STATUS_CHANGED: 'queue_status_changed',
  CARRIER_STATUS_UPDATED: 'carrier_status_updated',
  SETUP_LINK_SENT: 'setup_link_sent',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  PDF_GENERATED: 'pdf_generated',
} as const;

export type ActivityActionType = typeof ActivityAction[keyof typeof ActivityAction] | string;

export const EntityType = {
  CONTRACTING_APPLICATION: 'contracting_application',
  CARRIER_STATUS: 'carrier_status',
  PROFILE: 'profile',
  CERTIFICATION: 'certification',
  DOCUMENT: 'document',
} as const;

export type EntityTypeValue = typeof EntityType[keyof typeof EntityType] | string;

export async function logActivity(
  action_type: ActivityActionType,
  entity_type?: EntityTypeValue | null,
  entity_id?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[ActivityLogger] No authenticated user:', authError?.message || 'User not found');
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[ActivityLogger] Could not find profile:', profileError?.message || 'Profile not found');
      return false;
    }

    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: profile.id,
        action_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || null,
      });

    if (insertError) {
      console.error('[ActivityLogger] Failed to insert log:', insertError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ActivityLogger] Unexpected error:', error);
    return false;
  }
}

export async function logActivityForUser(
  actor_profile_id: string,
  action_type: ActivityActionType,
  entity_type?: EntityTypeValue | null,
  entity_id?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<boolean> {
  try {
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: actor_profile_id,
        action_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || null,
      });

    if (insertError) {
      console.error('[ActivityLogger] Failed to insert log for user:', insertError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ActivityLogger] Unexpected error in logActivityForUser:', error);
    return false;
  }
}
```

---

## 5. Shared Design System: golden-hour.ts

**File:** `src/config/golden-hour.ts` (66 lines)

```ts
export const GH = {
  // Page
  pageBg: '#F3EDE4',

  // Hero (dark card)
  heroBg: 'linear-gradient(145deg, #1a1611, #0f0d09)',
  heroGlow: 'rgba(184,134,11,0.14)',
  heroBorder: 'rgba(184,134,11,0.08)',

  // Glass panels
  glass: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassShadow: '0 2px 12px rgba(60,48,28,0.04)',
  glassBlur: '20px',

  // Text (warm brown scale)
  textPrimary: 'rgba(60,48,28,0.85)',
  textSecondary: 'rgba(60,48,28,0.55)',
  textMuted: 'rgba(60,48,28,0.35)',
  textFaint: 'rgba(60,48,28,0.20)',

  // Text on dark hero
  heroText: 'rgba(255,245,230,0.95)',
  heroTextMuted: 'rgba(255,245,230,0.55)',

  // Gold brand
  gold: '#8B6914',
  goldGrad: 'linear-gradient(135deg, #b8860b, #d4a017)',

  // Borders
  border: 'rgba(60,48,28,0.06)',
  borderLight: 'rgba(60,48,28,0.04)',

  // Tiles
  tileBg: 'rgba(60,48,28,0.015)',
  tileHover: 'rgba(60,48,28,0.03)',

  // Typography
  serif: 'Georgia, "Times New Roman", serif',

  // Atmospheric background gradients (very faint overlays)
  atmosphereGold: 'radial-gradient(ellipse at 20% 0%, rgba(184,134,11,0.04) 0%, transparent 60%)',
  atmospherePurple: 'radial-gradient(ellipse at 80% 100%, rgba(88,44,131,0.02) 0%, transparent 60%)',
} as const;

export type GHTokens = typeof GH;

// Section header style helper
export const sectionHeaderStyle = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  color: GH.textMuted,
};

// Common glass panel inline style (for use without the component)
export const glassPanelStyle = {
  background: GH.glass,
  backdropFilter: `blur(${GH.glassBlur})`,
  WebkitBackdropFilter: `blur(${GH.glassBlur})`,
  border: `1px solid ${GH.glassBorder}`,
  boxShadow: GH.glassShadow,
  borderRadius: '18px',
};
```

---

## 6. Routing Summary

| Page | Route | Shell | Protected? | Lazy? |
|------|-------|-------|-----------|-------|
| `FormsLibraryPage` | `/forms-library` | `<AgentShell />` | YES (`<ProtectedRoute>`) | YES (`lazy()`) |
| `AuthPage` | `/auth` | NONE (standalone) | NO | NO (eager) |
| `SetPasswordPage` | `/auth/set-password` | NONE (standalone) | NO | NO (eager) |
| `ForgotPasswordPage` | `/auth/forgot-password` | NONE (standalone) | NO | NO (eager) |

All three auth pages are rendered at the top of `<Routes>` under the `/* Public -- no shell */` comment block. They are NOT inside `<ProtectedRoute>` or any shell component.

---

## 7. Design Pattern Summary

### golden-hour.ts Usage

| File | Uses GH? | GH tokens used |
|------|----------|----------------|
| `FormsLibraryPage.tsx` | YES | `serif`, `textPrimary`, `textMuted`, `textSecondary`, `textFaint`, `border`, `tileHover`, `tileBg` |
| `GlassPanel.tsx` | YES | `glass`, `glassBlur`, `glassBorder`, `glassShadow` |
| `AuthPage.tsx` | YES | `pageBg`, `gold`, `glass`, `glassBlur`, `glassBorder`, `glassShadow`, `textPrimary`, `textSecondary`, `textMuted`, `border` |
| `SetPasswordPage.tsx` | YES | `pageBg`, `gold`, `glass`, `glassBlur`, `glassBorder`, `glassShadow`, `textPrimary`, `textSecondary`, `textMuted`, `border` |
| `ForgotPasswordPage.tsx` | YES | `pageBg`, `gold`, `glass`, `glassBlur`, `glassBorder`, `glassShadow`, `textPrimary`, `textSecondary`, `textMuted`, `border` |

### Shared Auth Visual Pattern

All 3 auth pages share these identical elements (copy-pasted, NOT extracted to a shared component):

1. **Background:** `grain-overlay` class + `GH.pageBg` (`#F3EDE4`)
2. **Atmospheric blurs:** Two fixed `radial-gradient` divs (gold top-left, purple bottom-right) with 60-80px blur
3. **Glass card:** `max-w-[495px]`, `borderRadius: 22`, using `GH.glass`/`GH.glassBorder`/`GH.glassShadow`/`GH.glassBlur`
4. **Entry animation:** `opacity: 0` + `animation: 'fadeInUp 0.5s ease-out forwards'`
5. **Logo block:** `tyler-logo.webp` at `h-[60px]` with gradient divider line below
6. **Title:** `text-4xl font-serif` using `GH.textPrimary`
7. **Subtitle:** `fontSize: 13`, `GH.textSecondary`, `lineHeight: 1.7`
8. **Labels:** `text-[10px] font-semibold uppercase` with `letterSpacing: '0.07em'`, `color: GH.textMuted`
9. **Inputs:** `h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl` with gold-tinted focus ring
10. **Primary button:** Gold gradient `hsl(43, 55%, 42%) -> hsl(43, 58%, 36%)` with inset shadow, `rounded-2xl`, JS hover handlers for darker gradient
11. **Outline button:** `borderColor: GH.border`, `color: GH.textPrimary`, `rounded-2xl`

**Note for design lead:** These 3 auth pages would benefit from a shared `AuthLayout` wrapper component during the Homestead migration. The atmospheric blurs, glass card, logo block, and animation are identical across all three.

### Forms Library Visual Pattern

- Uses `GlassPanel` component (not inline glass styles)
- Two-column layout: 3-col sidebar + 9-col content (12-col grid)
- No hero section, no atmospheric blurs
- Search bar is inline with title (not in a separate header)
- Form rows have file-type badges (PDF red / DOC blue / Link stone)
- Document preview via modal (`DocumentPreview` component)
