# Plan Finder UI Audit Report

**Date:** February 1, 2026
**Purpose:** Comprehensive analysis for UX redesign planning
**Analyst:** Claude Code

---

## Executive Summary

The Plan Finder is a 620-line React component that enables Medicare agents to search, filter, compare, and explore Medicare Advantage plans for Kentucky. The current implementation is functional but has opportunities for improved mobile responsiveness, accessibility, and feature expansion.

**Key Metrics:**
- 3 main components totaling ~1,400 lines of code
- 153 Kentucky plans in database, 118 with star ratings
- 7 filter/sort options
- Up to 4 plans can be compared simultaneously

---

## 1. Component Architecture

### File Overview

| Component | Location | Lines | Purpose |
|-----------|----------|-------|---------|
| **PlanFinderPage.tsx** | `src/pages/admin/` | 620 | Main page with search, filters, plan grid |
| **PlanDetailModal.tsx** | `src/components/medicare/` | 442 | Full plan detail view in modal |
| **PlanComparison.tsx** | `src/components/medicare/` | 348 | Side-by-side comparison table |
| **cms.ts** | `src/types/` | 182 | Type definitions |
| **useCmsPlans.ts** | `src/hooks/` | 363 | Data fetching hooks |

### PlanFinderPage.tsx

**Props Interface:** None (page component)

**State Variables:**
```typescript
const [searchInput, setSearchInput] = useState('');
const [selectedCounty, setSelectedCounty] = useState<{fips: string; name: string} | null>(null);
const [comparePlans, setComparePlans] = useState<CmsPlan[]>([]);
const [view, setView] = useState<'finder' | 'compare'>('finder');
const [detailPlan, setDetailPlan] = useState<CmsPlan | null>(null);
const [filters, setFilters] = useState({
  planType: 'all' as 'all' | 'HMO' | 'PPO' | 'HMO-POS',
  premium: 'all' as 'all' | 'zero' | 'low',
  snpOnly: false
});
const [sortBy, setSortBy] = useState<'premium' | 'moop' | 'rating'>('premium');
```

**Hooks Used:**
- `useCmsCounties('KY', 2026)` - Fetches county list
- `usePlansByCounty(stateCode, countyFips, 2026)` - Fetches plans
- `useFilteredPlans(plans, filterOptions)` - Client-side filtering

**Key UI Sections:**
1. Header (icon + title + subtitle)
2. Search Card (input + quick-select buttons)
3. Results Header (count + filter controls)
4. Plan Grid (`md:grid-cols-2`)
5. Compare Tray (fixed bottom bar)

**Layout Approach:**
- Main container: `max-w-6xl mx-auto`
- Plan grid: `grid gap-4 md:grid-cols-2`
- Filter controls: `flex flex-wrap items-center gap-3`

### PlanDetailModal.tsx

**Props Interface:**
```typescript
interface PlanDetailModalProps {
  plan: CmsPlan | null;
  open: boolean;
  onClose: () => void;
  onAddToCompare?: (plan: CmsPlan) => void;
  isInCompare?: boolean;
}
```

**State Variables:**
```typescript
const [documents, setDocuments] = useState<PlanDocument[]>([]);
const [documentsLoading, setDocumentsLoading] = useState(false);
```

**Key UI Sections (8 Collapsible):**
1. Costs Overview (defaultOpen)
2. Medical Services (defaultOpen)
3. Prescription Drugs
4. Dental Benefits
5. Vision Benefits
6. Hearing Benefits
7. Additional Benefits
8. Plan Documents

**Layout Approach:**
- Modal: `max-w-2xl max-h-[90vh] overflow-y-auto`
- Sections: Radix Collapsible with chevron rotation
- Benefit rows: `flex justify-between items-center`

### PlanComparison.tsx

**Props Interface:**
```typescript
interface PlanComparisonProps {
  plans: CmsPlan[];
  onRemovePlan?: (planId: string) => void;
}
```

**State Variables:**
```typescript
const [expandedCategories, setExpandedCategories] = useState<string[]>(['all']);
const printRef = useRef<HTMLDivElement>(null);
```

**Comparison Categories (7):**
1. Costs (4 items)
2. Medical Services (7 items)
3. Prescription Drugs (5 items)
4. Dental (3 items)
5. Vision (2 items)
6. Hearing (2 items)
7. Additional Benefits (4 items)

**Layout Approach:**
- Plan headers: Flex row with `w-48` label column
- Comparison rows: Grid with best-value highlighting
- Print support: `print:hidden` / `print:block` classes

---

## 2. Design System Tokens

### From DESIGN_SYSTEM.md

**Color System:**
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--brand` | hsl(43, 56%, 41%) | Gold - avatars, logo |
| `--primary` | hsl(217, 91%, 50%) | Blue - links, buttons, focus |
| Green | Tailwind `green-500` | Success, complete |
| Amber | Tailwind `amber-500` | Warning, pending |
| Red | Tailwind `red-500` | Error, destructive |

**Typography Scale:**
| Element | Classes |
|---------|---------|
| Page title | `text-xl font-semibold text-foreground` |
| Card title | `font-semibold text-foreground` |
| Section label | `text-xs font-medium text-muted-foreground uppercase` |
| Body text | `text-sm text-foreground` |
| Secondary text | `text-sm text-muted-foreground` |
| Tertiary text | `text-xs text-muted-foreground` |

**Spacing Patterns:**
| Token | Value | Usage |
|-------|-------|-------|
| `px-5 py-4` | 20px/16px | Card headers |
| `px-5 py-3` | 20px/12px | List rows, footers |
| `gap-3` | 12px | Icon + label |
| `gap-5` | 20px | Meta items |

**Card Pattern:**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
```

**Button Variants:**
- Primary: `bg-primary hover:bg-primary/90 text-white`
- Secondary: `variant="outline"`
- Destructive: `text-red-600 hover:bg-red-50`
- Text link: `text-primary font-medium hover:text-primary/80`

### From tailwind.config.ts

**Custom Fonts:**
```typescript
fontFamily: {
  serif: ["Playfair Display", "Georgia", "serif"],
  sans: ["Inter", "system-ui", "sans-serif"],
}
```

**Brand Colors:**
- `gold`, `gold-light`, `gold-dark`
- `cream`, `charcoal`
- `brand`, `brand-foreground`

**Apple HIG Colors (available but unused in Plan Finder):**
- `apple-blue`, `apple-green`, `apple-yellow`, etc.

**Custom Animations:**
- `fade-in`, `fade-in-up`, `scale-in`
- `accordion-down`, `accordion-up`

---

## 3. Current User Flow

### Step-by-Step Walkthrough

**1. Page Load**
- Agent sees search card with empty input
- Popular counties shown as quick-select buttons (Jefferson, Fayette, Kenton, Warren, Daviess, Boone)
- No results displayed until county selected

**2. Search/Selection**
- Enter ZIP code OR click county button OR type county name
- ZIP codes mapped via hardcoded `ZIP_TO_COUNTY` lookup (Kentucky only)
- County selection triggers `usePlansByCounty` hook

**3. Results Display**
- Loading: 4 skeleton cards in 2-column grid
- Results: Plan cards with key info visible
- Header shows: "{X} plans found" + filter controls

**4. Filtering**
- Plan Type: Dropdown (All, HMO, PPO, HMO-POS)
- Premium: Dropdown (Any, $0, $30 or less)
- SNP Only: Checkbox
- All filters applied client-side via `useFilteredPlans`

**5. Sorting**
- Options: Premium (ASC), Max OOP (ASC), Rating (DESC)
- Default: Premium (lowest first)

**6. Quick View vs Full Details**
- **Quick View**: Expands card inline to show drug tiers + detailed benefits
- **Full Details**: Opens `PlanDetailModal` with all 8 sections

**7. Plan Comparison**
- Click "Add to Compare" on card → Plan added to compare tray
- Max 4 plans (enforced via `comparePlans.length >= 4` check)
- Compare tray shows badges with X to remove
- "Compare Now" button switches to comparison view
- Back button returns to finder view

**8. Print/Export**
- Comparison view has Print button (`window.print()`)
- Print styles hide UI elements, show all expanded content
- No CSV/PDF export functionality

---

## 4. Plan Card Anatomy

### Visual Hierarchy (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Org Name] • [H1234-001]              [HMO] [D-SNP] │ │
│ │ Plan Marketing Name                                  │ │
│ │ ★★★★☆ 4.0                                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                 $0/mo   │
│                                          ──────────     │
├─────────────────────────────────────────────────────────┤
│ KEY STATS (3 columns)                                   │
│ ┌─────────┬─────────┬─────────┐                        │
│ │ $0      │ $3,400  │ $0      │                        │
│ │ Deduct. │ Max OOP │ Drug    │                        │
│ └─────────┴─────────┴─────────┘                        │
├─────────────────────────────────────────────────────────┤
│ QUICK BENEFITS (2x2 grid)                               │
│ ┌───────────────┬───────────────┐                      │
│ │ PCP: $0       │ Specialist:$40│                      │
│ │ Emergency:$120│ Inpatient:$295│                      │
│ └───────────────┴───────────────┘                      │
├─────────────────────────────────────────────────────────┤
│ EXTRA BENEFITS (flex wrap badges)                       │
│ [✓ Dental] [✓ Vision] [✓ Hearing] [✓ OTC] [✓ Fitness]  │
├─────────────────────────────────────────────────────────┤
│ ACTIONS                                                 │
│ Quick View    Full Details    [Add to Compare]         │
└─────────────────────────────────────────────────────────┘
```

### Expanded State (Quick View)

```
│ DRUG TIERS (5 columns)                                  │
│ ┌───────┬───────┬───────┬───────┬───────┐              │
│ │ $0    │ $10   │ $47   │ $100  │ 25%   │              │
│ │ Tier 1│ Tier 2│ Tier 3│ Tier 4│ Tier 5│              │
│ └───────┴───────┴───────┴───────┴───────┘              │
│                                                         │
│ DENTAL: Preventive $0, Comprehensive $0, Max $2,500    │
│ VISION: Exam $0, Allowance $350/year                   │
│ HEARING: Exam $0, Aid $699 copay/aid                   │
│ TRANSPORTATION: 24 one-way trips                       │
```

### Display Rules

| Condition | Display |
|-----------|---------|
| Premium = $0 | Bold green text, "highlight" |
| Star Rating null | "Not rated" in muted text |
| SNP Type exists | Amber badge next to plan type |
| Benefit null | "Not covered" or badge hidden |
| Copay = $0 | Green text, highlighted in comparison |

---

## 5. Data Available for Display

### CmsPlan Type (Full Field List)

| Field | Type | Card | Modal | Comparison | Notes |
|-------|------|------|-------|------------|-------|
| `id` | string | - | - | - | Internal UUID |
| `contractId` | string | ✓ | ✓ | ✓ | Display ID |
| `planId` | string | ✓ | ✓ | ✓ | Display ID |
| `segmentId` | string | - | - | - | Rarely used |
| `organizationName` | string | ✓ | ✓ | ✓ | Carrier name |
| `planName` | string | ✓ | ✓ | ✓ | Marketing name |
| `planType` | string | ✓ | ✓ | ✓ | HMO/PPO/HMO-POS |
| `snpType` | string | ✓ | ✓ | ✓ | D-SNP/C-SNP/I-SNP |
| `premium` | number | ✓ | ✓ | ✓ | Monthly cost |
| `deductible` | number | ✓ | ✓ | ✓ | Annual medical |
| `moop` | number | ✓ | ✓ | ✓ | Max out-of-pocket |
| `drugDeductible` | number | ✓ | ✓ | ✓ | Part D deductible |
| `starRating` | number | ✓ | ✓ | ✓ | CMS 5-star |
| `carrierId` | string | - | - | - | FK to carriers |
| `year` | number | - | ✓ | - | Plan year |
| `isActive` | boolean | - | ✓ | - | Active status |
| `isCommissionable` | boolean | - | - | - | **NOT DISPLAYED** |

### Benefits Object

| Field | Type | Card | Modal | Comparison |
|-------|------|------|-------|------------|
| `pcpCopay` | string | ✓ | ✓ | ✓ |
| `specialistCopay` | string | ✓ | ✓ | ✓ |
| `emergencyCopay` | string | ✓ | ✓ | ✓ |
| `urgentCareCopay` | string | - | ✓ | ✓ |
| `inpatientCopay` | string | ✓ | ✓ | ✓ |
| `outpatientCopay` | string | - | ✓ | ✓ |
| `telehealthCopay` | string | - | ✓ | ✓ |
| `drugTier1-5` | string | expanded | ✓ | ✓ |
| `dental.preventive` | string | expanded | ✓ | ✓ |
| `dental.comprehensive` | string | expanded | ✓ | ✓ |
| `dental.maxCoverage` | number | expanded | ✓ | ✓ |
| `vision.examCopay` | string | expanded | ✓ | ✓ |
| `vision.eyewearAllowance` | number | expanded | ✓ | ✓ |
| `hearing.examCopay` | string | expanded | ✓ | ✓ |
| `hearing.aidAllowance` | string | expanded | ✓ | ✓ |
| `otcAllowance` | number | badge | ✓ | ✓ |
| `fitness` | string | badge | ✓ | ✓ |
| `transportation` | string | expanded | ✓ | ✓ |
| `meals` | string | - | ✓ | ✓ |

### Fields NOT Currently Displayed

| Field | Available | Potential Use |
|-------|-----------|---------------|
| `isCommissionable` | ✓ | Agent-facing indicator |
| `carrierId` | ✓ | Link to carrier resources |
| `segmentId` | ✓ | Plan variations |
| `moop_combined` | In DB | Combined in/out network MOOP |
| `commission_notes` | In DB | Agent commission info |

### Potential Computed Values

| Value | Formula | Use Case |
|-------|---------|----------|
| **Value Score** | `(5 - starRating) + (premium / 100) + (moop / 1000)` | Quick ranking |
| **Total Annual Cost** | `(premium * 12) + deductible` | Budget planning |
| **Benefit Richness** | Count of non-null supplemental benefits | Feature comparison |
| **SNP Eligibility** | `snpType !== null` | Filter indicator |

---

## 6. Filter & Sort Capabilities

### Current Filters

| Filter | Type | Options | Implementation |
|--------|------|---------|----------------|
| **Plan Type** | Select dropdown | All, HMO, PPO, HMO-POS | Client-side string match |
| **Premium** | Select dropdown | Any, $0, $30 or less | Client-side: `=== 0` or `<= 30` |
| **SNP Only** | Checkbox | true/false | Client-side: `snpType !== null` |

### Current Sort Options

| Option | Direction | Implementation |
|--------|-----------|----------------|
| Premium | Ascending | `a.premium - b.premium` |
| Max OOP | Ascending | `a.moop - b.moop` |
| Star Rating | Descending | `(b.starRating ?? 0) - (a.starRating ?? 0)` |

**Default:** Premium (lowest first)

### Filter Flow

```
Database Query (usePlansByCounty)
    ↓
All plans for county loaded
    ↓
Client-side filtering (useFilteredPlans)
    ↓
Filtered + sorted plans rendered
```

### Missing Filter Capabilities

| Filter | Potential Implementation |
|--------|-------------------------|
| Carrier/Organization | Dropdown with carrier names |
| Star Rating minimum | Slider or dropdown (3+, 4+, 4.5+) |
| Deductible range | Slider ($0-$500) |
| Specific benefits | Checkboxes (has dental, has OTC, etc.) |
| Premium range | Slider with custom max |

---

## 7. Comparison Feature Analysis

### Configuration

- **Max Plans:** 4 (hardcoded)
- **Layout:** Side-by-side columns with fixed label column
- **Categories:** 7 collapsible sections
- **Best Value Highlighting:** Green background + "Best" label

### Comparison Items (27 total)

**Costs (4):**
- Monthly Premium (highlight: low)
- Medical Deductible (highlight: low)
- Max Out-of-Pocket (highlight: low)
- Drug Deductible (highlight: low)

**Medical Services (7):**
- PCP Visit, Specialist, Inpatient, Outpatient, ER, Urgent Care, Telehealth

**Prescription Drugs (5):**
- Tiers 1-5

**Dental (3):**
- Preventive, Comprehensive, Annual Maximum

**Vision (2):**
- Eye Exam, Eyewear Allowance

**Hearing (2):**
- Hearing Exam, Hearing Aid Allowance

**Additional (4):**
- OTC Allowance, Fitness, Transportation, Post-Hospital Meals

### Best Value Logic

```typescript
function getBestValueIndex(values: any[], highlightType: 'low' | 'high' | 'zero') {
  // Extract numeric values from strings
  // For 'low': return index of minimum
  // For 'high': return index of maximum
  // For 'zero': return index where value is $0
}
```

### Print Support

- Print button: `onClick={() => window.print()}`
- Print styles: Categories forced open, UI hidden
- Footer: Shows disclaimer in print only

---

## 8. Responsive/Mobile Analysis

### Breakpoints Used

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm:` | 640px | Results header flex direction |
| `md:` | 768px | Plan grid columns (1 → 2) |

### Mobile Behavior

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Plan Grid | 1 column | 2 columns |
| Filter Controls | Wrap to multiple rows | Single row |
| Compare Tray | Fixed bottom (may overlap) | Fixed bottom |
| Comparison Table | Horizontal scroll needed | Fits in viewport |
| Detail Modal | Full width with padding | max-w-2xl centered |

### Mobile Issues Identified

1. **Comparison Table:** `w-48` label column doesn't adapt
2. **Compare Tray:** `h-20` spacer insufficient on some devices
3. **Plan Card:** Long plan names may truncate awkwardly
4. **Filter Dropdowns:** Touch targets adequate but could be larger

---

## 9. Navigation & Integration

### Current Location

```
Admin Nav
├── Dashboard
├── Queue
├── Agent Search
├── Agent Profile
├── Medicare Plan Finder  ← HERE
└── Settings
```

### Adjacent Pages

| Page | Potential Integration |
|------|----------------------|
| **Dashboard** | Quick link to Plan Finder |
| **Agent Profile** | Link to find plans for agent's state |
| **Book of Business** | Match client plans to cms_plans |
| **Carrier Resources** | Link from carrier name in cards |

### URL Structure

- Current: `/admin/plan-finder`
- No deep linking to specific county or plan
- No shareable URLs with filters applied

### Potential Integrations

1. **Client Quoting:** Save plan selections for client presentation
2. **Enrollment Links:** Direct to carrier enrollment portal
3. **Carrier Hub:** Link plan to carrier-specific resources
4. **Commission Tracking:** Show commission rates per plan

---

## 10. Pain Points & Issues

### Code Quality Issues

1. **Hardcoded ZIP Lookup** (lines 24-52)
   - Only Kentucky ZIPs supported
   - Falls back silently to Jefferson County
   - Should be database-driven or API call

2. **Magic Numbers**
   ```typescript
   comparePlans.length >= 4  // Max comparison plans
   premium <= 30             // "Low" premium threshold
   ```

3. **Inline Components**
   - `StarRating`, `PlanCard`, `PlanCardSkeleton` defined inside PlanFinderPage
   - Should be extracted to separate files

### UX Issues

1. **No Empty State for Initial Load**
   - Just shows search card, no guidance

2. **Compare Tray Overlap**
   - Fixed bottom may hide plan cards on scroll

3. **Filter State Not Persisted**
   - Refreshing page loses filters and selection

4. **No Loading Indicator on Compare**
   - Switching views is instant but feels abrupt

### Accessibility Gaps

1. **Color-Only Communication**
   - Best values use green background only
   - Star ratings rely on visual fill

2. **Missing ARIA Labels**
   - Icon-only buttons (X to remove) need labels
   - Star rating needs accessible description

3. **Focus Management**
   - Opening modal doesn't trap focus properly
   - Compare tray buttons not in logical tab order

### Performance Concerns

1. **No Pagination**
   - All filtered plans render at once
   - Could be 100+ cards on some counties

2. **No Debouncing**
   - Filter changes apply immediately
   - Not an issue with client-side filtering, but would be with server

3. **Documents Fetch**
   - Each detail modal open fetches documents
   - Could cache per plan

### Missing Features

1. **No Save/Favorite Plans**
2. **No Export to PDF/CSV**
3. **No Deep Linking**
4. **No Recent Searches**
5. **No Plan Enrollment CTA**
6. **No Formulary Search**

---

## Appendix: Shadcn Components Used

### PlanFinderPage
- Card, CardContent, CardHeader
- Input
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Checkbox
- Button
- Badge
- Skeleton

### PlanDetailModal
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- Button
- Badge
- Card, CardContent
- Skeleton
- Collapsible, CollapsibleContent, CollapsibleTrigger

### PlanComparison
- Card, CardContent, CardHeader
- Button
- Badge
- Collapsible, CollapsibleContent, CollapsibleTrigger

### Lucide Icons Used
- Search, MapPin, Star, Heart, ArrowRight, X, Loader2
- ChevronDown, FileText, ExternalLink, DollarSign
- Stethoscope, Pill, Eye, Ear, Sparkles, Printer

---

## Recommendations Summary

### Quick Wins
1. Extract inline components to separate files
2. Add ARIA labels to icon buttons
3. Add empty state guidance on initial load
4. Fix compare tray overlap with proper spacing

### Medium Effort
1. Add carrier and star rating filters
2. Implement deep linking with URL params
3. Add plan save/favorite functionality
4. Cache document fetches

### Major Enhancements
1. Database-driven ZIP lookup for multi-state support
2. Pagination or virtualization for large result sets
3. PDF export for comparison
4. Client quoting workflow integration
5. Mobile-optimized comparison view

---

*End of Audit Report*
