# TIG Platform UX Audit

**Generated:** February 3, 2026

---

## 1. DASHBOARD ANALYSIS

### File: `src/pages/Index.tsx`

### ActionButtons (Quick Actions Panel)

The dashboard uses an `ActionButton` component for navigation. Located in lines 235-290:

| Order | Label | Route | Icon | Color | Condition |
|-------|-------|-------|------|-------|-----------|
| 1 | Sync Book / Sync Now | `/sync` | `RefreshCw` | `from-amber-500 to-orange-500` | Only when `isStale \|\| isEmpty` (highlighted) |
| 2 | Carrier Resources | `/carrier-resources` | `Building2` | `from-blue-500 to-blue-600` | Always |
| 3 | Plan Finder | `/plan-finder` | `Search` | `from-emerald-500 to-teal-600` | Always |
| 4 | Forms Library | `/forms-library` | `FileText` | `from-slate-500 to-slate-600` | Always |
| 5 | Quick Quote | `/agent-tools` | `Zap` | `from-orange-500 to-orange-600` | Only when `!isStale && !isEmpty` |
| 6 | Certifications | `/contracting-hub` | `Award` | `from-emerald-500 to-emerald-600` | Always |

### ActionButton Component (lines 354-374)

```tsx
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;       // Tailwind gradient classes
  to: string;          // Route path
  highlighted?: boolean;
}
```

### Grid Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: TIG PLATFORM | Agent Portal    [SyncPill] [Avatar] │
├─────────────────────────────────────────────────────────────┤
│ [Stale Banner - conditional]                                │
├─────────────────────────────────────────────────────────────┤
│ Greeting                                                    │
├────────────────────────────────┬────────────────────────────┤
│ Main Card (flex-[2])           │ Actions Panel (flex-[1])   │
│ - Badges row                   │ - "Quick Actions" header   │
│ - THE NUMBER (10rem)           │ - ActionButton list        │
│ - Carriers row                 │                            │
│ - Goal progress                │                            │
│ OR EmptyStateCTA               │                            │
└────────────────────────────────┴────────────────────────────┘
```

### Conditional Rendering Logic

- **Empty State (`isEmpty`)**: Shows `EmptyStateCTA` component instead of stats
- **Stale State (`isStale`)**: Shows amber banner + "Sync Now" promoted button
- **Normal State**: Full dashboard with carriers, milestones, all buttons

### Training Library Route

```tsx
// App.tsx lines 265-266
<Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
<Route path="/training/:videoId" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
```

**Note:** Training is NOT in dashboard Quick Actions. Only accessible via avatar dropdown or direct URL.

---

## 2. NAVIGATION PATTERNS

### Comparison Table

| Page | Background | Max-Width | Header Style | Back Link |
|------|------------|-----------|--------------|-----------|
| **Index.tsx** (Dashboard) | `bg-[#f9fafb]` | `max-w-5xl` | Custom (TIG PLATFORM badge) | N/A |
| **CarrierResourcesPage** | `bg-[#FBFBFD]` | `max-w-4xl` | Minimal, `ChevronLeft Dashboard` link only | `<Link to={homePath}>` |
| **PlanFinderPage** | `bg-[#FBFBFD]` | `max-w-6xl` | Minimal, `ChevronLeft Dashboard` link only | `<Link to="/">` |
| **AgentToolsPage** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `max-w-5xl` | Full TIG header + sticky + blur | `<Link to="/">` |
| **FormsLibraryPage** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `max-w-6xl` | Full TIG header + sticky + blur | `<Link to={homePath}>` |
| **ContractingHubPage** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `max-w-5xl` | Full TIG header + sticky + blur | `<Link to={homePath}>` |
| **AdminDashboard** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `max-w-6xl` | Full TIG header + mode toggle | N/A (is home) |
| **TrainingPage** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `max-w-7xl` | Uses `TrainingLayout` | Via sidebar |
| **MyProfilePage** | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | (wraps AgentProfilePage) | Inherits | Inherits |

### Header Patterns (3 distinct styles)

**Style A: Dashboard Only**
```tsx
// Custom badge-style header
<div className="w-10 h-10 bg-white rounded-xl shadow-sm border">
  <span className="font-bold text-blue-600 text-lg">T</span>
</div>
<p className="text-[11px] text-slate-400">TIG PLATFORM</p>
<p className="font-semibold text-slate-800">Agent Portal</p>
```

**Style B: Minimal (Carrier Resources, Plan Finder)**
```tsx
// Just a back link, no header bar
<header className="pt-4 pb-2 px-8">
  <Link to={homePath} className="text-sm text-primary">
    <ChevronLeft /> Dashboard
  </Link>
</header>
```

**Style C: Full TIG Header (Most pages)**
```tsx
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
  <div className="max-w-Xll mx-auto flex items-center justify-between py-3">
    <Link to={homePath}>
      <span className="font-serif text-xl font-semibold">TIG</span>
      <span>|</span>
      <span className="text-sm">Agent Portal</span>
    </Link>
    <UserAvatarDropdown />
  </div>
</header>
```

### Back to Dashboard Patterns

| Pattern | Pages Using |
|---------|-------------|
| `<Link to={homePath}>` (uses hook) | CarrierResources, Forms, Contracting, AgentTools |
| `<Link to="/">` (hardcoded) | PlanFinder |
| No back link | Dashboard, Admin Dashboard |

**Recommendation:** Inconsistent. Should standardize on `homePath` from `useNavigationContext()`.

---

## 3. LOADING STATES

### Pattern 1: Full-page spinner (Most common)

```tsx
if (isLoading) {
  return (
    <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

### Pattern 2: Loader2 with text

```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB]...">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c5552]" />
        <p className="text-sm text-[#5c5552]">Loading your contracting data...</p>
      </div>
    </div>
  );
}
```

### Pattern 3: Button loading state

```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Signing in...
    </>
  ) : (
    'Sign In'
  )}
</Button>
```

### Pattern 4: Inline loading

```tsx
{loading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-gold" />
    <span className="ml-2 text-sm text-muted-foreground">Loading portals...</span>
  </div>
) : (/* content */)}
```

### Skeleton Component

**File:** `src/components/ui/skeleton.tsx`

```tsx
function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
```

**Used in:**
- `PlanFinderPage.tsx` (PlanCardSkeleton)
- `PlanDetailModal.tsx`
- `PlanCard.tsx`
- `CarrierPlansTab.tsx`

**Inconsistency:** Some pages use `border-b-2 border-primary` spinner, others use `Loader2`, others use `Skeleton`.

---

## 4. TAB IMPLEMENTATIONS

### Shadcn Tabs Component

**File:** `src/components/ui/tabs.tsx` - Uses `@radix-ui/react-tabs`

### Pages with Tab-like Patterns

**Note:** No pages directly import Tabs from shadcn. Most use custom tab implementations:

1. **FormsLibraryPage** - Uses category sidebar buttons (not tabs)
2. **CarrierResourcesPage** - Uses carrier selection pills
3. **PlanFinderPage** - Uses view toggle ('finder' | 'compare')

### Custom Tab State Examples

```tsx
// FormsLibraryPage - category selection
const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('client_intake');

// PlanFinderPage - view toggle
const [view, setView] = useState<'finder' | 'compare'>('finder');

// CarrierResourcesPage - carrier selection
const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>('');
```

**Tab Content Remounting:** Content doesn't remount on tab switch - uses conditional rendering with same data.

---

## 5. PAGE WIDTH PATTERNS

### Max-Width Distribution

| Class | Count | Pages Using |
|-------|-------|-------------|
| `max-w-4xl` | 11 | CarrierResources, DocumentManagement, Compliance, UserDetail, contracting components |
| `max-w-5xl` | 12 | Dashboard, AgentTools, ContractingHub, Index.old, AgentProfile, AdminLayout |
| `max-w-6xl` | 14 | PlanFinder(5), FormsLibrary(2), CarrierPlans(2), AdminDashboard, AdminLayout(2), CarrierPlansTab |
| `max-w-7xl` | 3 | AdminLayout(1), TrainingLayout(2) |

### Recommendations

- **Agent pages:** Standardize on `max-w-5xl` (current most common)
- **Admin pages:** Standardize on `max-w-6xl` (more data density needed)
- **Training:** `max-w-7xl` appropriate for video content

---

## 6. QUICK ACTION DESTINATIONS

### Click Analysis

| Dashboard Button | Route | Landing Experience | Clicks to Goal |
|------------------|-------|-------------------|----------------|
| **Carrier Resources** | `/carrier-resources` | Carrier picker → instant contacts | 1 click to contact |
| **Plan Finder** | `/plan-finder` | County search → plan results | 2 clicks (search + view) |
| **Forms Library** | `/forms-library` | Category sidebar + form list | 1 click to form |
| **Quick Quote** | `/agent-tools` | SunFire + C4M external links | 1 click (external) |
| **Certifications** | `/contracting-hub` | Full status + progress view | 0 (info page) |
| **Sync Book** | `/sync` | Upload flow | Multi-step |

### Issues Found

1. **Quick Quote** - Was pointing to `/carrier-resources` (FIXED)
2. **Training Library** - Not accessible from dashboard at all

---

## 7. ALL MAIN PAGES

### Top-Level Pages (`src/pages/*.tsx`)

```
AgentToolsPage.tsx        - Quick Quote tools
AuthPage.tsx              - Login/signup
CarrierPlansPage.tsx      - Carrier plan documents
CarrierPortalsPage.tsx    - Portal links (old?)
CarrierResourcesPage.tsx  - Carrier contacts & resources
CompliancePage.tsx        - Compliance info
ContractingHubPage.tsx    - Certification status
ContractingPage.tsx       - Multi-step contracting form
DocumentManagementPage.tsx - Document uploads
FormsLibraryPage.tsx      - SOA & forms
Index.tsx                 - Agent dashboard
Index.old.tsx             - Old dashboard (backup)
IndustryUpdatesPage.tsx   - Placeholder
MyProfilePage.tsx         - Agent's own profile
NotFound.tsx              - 404 page
PlanFinderPage.tsx        - Medicare plan search
StartHerePage.tsx         - Onboarding start
SyncFlow.tsx              - Book of business sync
T65ReviewPage.tsx         - T65 review tool
TrainingPage.tsx          - Video training library
```

### Admin Pages (`src/pages/admin/*.tsx`)

```
ActivityLogPage.tsx       - Audit trail
AdminDashboard.tsx        - Admin home (search-first)
AgentBookDetailPage.tsx   - Agent's book details
AgentProfilePage.tsx      - Agent profile view
AgentsBookPage.tsx        - All agents' books
AgentsPage.tsx            - Agent list/management
ContractingQueuePage.tsx  - Contracting submissions
LabsPage.tsx              - Experimental features
NewAgentPage.tsx          - Create new agent
PdfBuilderPage.tsx        - AI PDF builder
RoadmapGeneratorPage.tsx  - Planning tool
RTSImportPage.tsx         - RTS Excel import
UserDetailPage.tsx        - User details
```

---

## 8. KEY INCONSISTENCIES FOUND

### Critical Issues

1. **Background colors vary:**
   - Dashboard: `bg-[#f9fafb]`
   - Most pages: gradient `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]`
   - Some pages: `bg-[#FBFBFD]`

2. **Header styles inconsistent:**
   - Dashboard has unique badge-style header
   - Some pages have minimal headers
   - Most pages have full TIG | Agent Portal header

3. **Back navigation inconsistent:**
   - Some use `homePath` from hook
   - Some hardcode `"/"`
   - Some use `ChevronLeft`, others use `ArrowLeft`

4. **Max-width varies:** 4xl, 5xl, 6xl, 7xl depending on page

5. **Loading states inconsistent:**
   - Different spinner styles
   - Different colors (primary, gold, #5c5552)
   - Some have loading text, some don't

### Recommendations

1. **Standardize background:** Use gradient for all authenticated pages
2. **Standardize header:** Use Style C (full TIG header) for all pages except dashboard
3. **Standardize back nav:** Always use `useNavigationContext().homePath` + `ArrowLeft`
4. **Standardize max-width:**
   - Agent pages: `max-w-5xl`
   - Admin pages: `max-w-6xl`
5. **Create shared loading component:** Consistent spinner with optional text
6. **Add Training to dashboard:** Currently missing from Quick Actions

---

## 9. DESIGN SYSTEM TOKENS (from DESIGN_SYSTEM.md)

For reference, the official tokens are:

```
Page background: bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
Cards: rounded-xl border border-[#e8e4dd] bg-white
Headers: "TIG | Agent Portal" with sticky blur
Primary action: bg-blue-600 hover:bg-blue-700
```

**Dashboard diverges from these standards** - intentional or bug?
