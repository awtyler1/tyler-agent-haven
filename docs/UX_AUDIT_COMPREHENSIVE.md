# Comprehensive UX Audit: TIG Agent Portal

**Audit Date:** January 26, 2026
**Auditor Role:** Senior UX Director
**Standards Applied:** Apple Human Interface Guidelines, Google Material Design 3

---

## Executive Summary

### Overall UX Maturity Rating: 7.2/10

The TIG Agent Portal demonstrates strong foundational design decisions with a cohesive visual language, thoughtful information architecture, and generally good usability. However, several opportunities exist to elevate the experience to Apple/Google caliber.

### Top 3 Strengths

1. **Cohesive Visual Identity** — Consistent use of warm cream backgrounds, gold accents, and serif typography creates a premium, trustworthy feel appropriate for financial services
2. **Smart Information Architecture** — Agent dashboard prioritizes high-frequency tasks (Carrier Resources, Forms) while keeping secondary actions accessible
3. **Progressive Disclosure** — Complex flows like contracting use step-by-step wizards with clear progress indication

### Top 5 Critical Issues

| Priority | Issue | Impact | Location |
|----------|-------|--------|----------|
| 1 | **Inconsistent touch targets** | Some interactive elements are too small for reliable mobile interaction | Throughout |
| 2 | **Missing loading skeletons** | Content jumps cause disorientation | Multiple pages |
| 3 | **Weak empty state guidance** | Users don't know what to do when no data exists | CarrierPlansPage, etc. |
| 4 | **Insufficient keyboard navigation** | Power users can't efficiently navigate | Forms, modals |
| 5 | **Header variations** | Three different header patterns create inconsistency | Various pages |

### Comparison to Apple/Google Standards

| Principle | Current | Apple/Google Standard | Gap |
|-----------|---------|----------------------|-----|
| Clarity | 7/10 | 9/10 | Visual hierarchy could be sharper |
| Consistency | 6/10 | 9/10 | Multiple header/card patterns |
| Feedback | 7/10 | 9/10 | Missing micro-interactions |
| Efficiency | 8/10 | 9/10 | Good task flows, some clicks could be saved |
| Accessibility | 6/10 | 9/10 | WCAG gaps exist |

---

## Phase 1: Platform Discovery

### 1.1 Route Map (29 Routes)

```
Authentication (3)
├── /auth                    — Login/signup
├── /auth/set-password       — Password setup (invite flow)
└── /auth/forgot-password    — Password reset

Agent Routes (14)
├── /                        — Agent dashboard
├── /book-of-business        — Production tracking
├── /start-here              — Onboarding guide
├── /contracting-hub         — Certification status
├── /contracting             — Contracting wizard (restricted)
├── /my-profile              — Self profile view
├── /industry-updates        — News/updates (placeholder)
├── /training                — Video library
├── /training/:videoId       — Video detail
├── /compliance              — Compliance resources
├── /carrier-resources       — Carrier contacts/links
├── /carrier-resources/plans — Plan documents
├── /agent-tools             — Tools page
├── /forms-library           — Forms/documents
└── /carrier-portals         — Portal links

Admin Routes (12)
├── /admin                   — Admin dashboard
├── /admin/agents            — Agent roster
├── /admin/agents/new        — Create agent
├── /admin/agents/:profileId — Agent profile (admin view)
├── /admin/users/:userId     — User detail
├── /admin/contracting       — Contracting queue
├── /admin/activity-log      — Audit trail (super admin)
├── /admin/rts-import        — Certification import
├── /admin/roadmaps          — Roadmap generator
├── /admin/labs              — Feature flags (super admin)
└── /admin/documents         — Document management
```

### 1.2 Primary User Journeys

**Journey 1: New Agent Onboarding**
```
Receive invite email → Set password → Contracting wizard (12 steps)
→ Submit → Await approval → Access full dashboard
```
- **Duration:** 15-45 minutes depending on document prep
- **Pain points:** Long form, document upload failures, unclear progress
- **Opportunity:** Add save progress indicators, reduce steps

**Journey 2: Daily Agent Workflow**
```
Login → Dashboard → [Quick Quote OR Carrier Resources OR Forms]
→ Complete task → Logout
```
- **Frequency:** Multiple times daily
- **Pain points:** Extra clicks to reach quoting tools
- **Opportunity:** Personalized quick actions based on usage

**Journey 3: Admin Agent Management**
```
Login → Admin Dashboard → Search agent → View profile
→ [Edit/Send link/Process contracting] → Return to search
```
- **Frequency:** Many times daily
- **Pain points:** No bulk operations, limited filtering
- **Opportunity:** Batch actions, saved filters

### 1.3 UI Component Inventory

**Buttons (4 variants observed)**
- Primary: `bg-blue-600 text-white` — Used for main CTAs
- Secondary: `border border-[#e8e4dd]` — Cancel/back actions
- Ghost: `text-blue-600 hover:text-blue-700` — Inline links
- Destructive: `text-red-600` — Delete/deactivate

**Cards (3 patterns)**
- Dashboard cards: `rounded-xl border border-[#e8e4dd] bg-white`
- Hero cards: `bg-blue-50 border border-blue-100 rounded-xl`
- Table cards: `bg-white border border-[#e8e4dd] rounded-xl overflow-hidden`

**Forms**
- Input: Shadcn/ui default with custom focus ring
- Select: Radix-based with custom styling
- Checkbox: Radix checkbox with gold accent

**Status Indicators**
- Dots: `w-2 h-2 rounded-full` (green/amber/red)
- Icons: `CheckCircle2` for complete, `Circle` for incomplete
- Badges: `rounded-full text-xs px-2 py-0.5`

### 1.4 Visual Design Inventory

**Colors (Extracted)**
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FEFDFB → #FAF8F3` gradient | Page backgrounds |
| Card | `#FFFFFF` | Card surfaces |
| Border | `#e8e4dd` | All borders |
| Primary text | `#292524` | Headings, important text |
| Secondary text | `#5c5552` | Descriptions, meta |
| Primary action | `#2563eb` (blue-600) | Buttons, links |
| Brand | `hsl(43, 56%, 41%)` | Gold accents, avatar |
| Success | `#22c55e` (green-500) | Checkmarks, complete |
| Warning | `#f59e0b` (amber-500) | Alerts, pending |
| Error | `#ef4444` (red-500) | Errors, destructive |

**Typography**
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page title | Playfair Display | 24-30px | 600 |
| Card title | Playfair Display | 18px | 600 |
| Section label | Inter | 12px uppercase | 500 |
| Body | Inter | 14px | 400 |
| Secondary | Inter | 14px | 400 |
| Tertiary | Inter | 12px | 400 |

**Spacing (observed patterns)**
- Page padding: `px-6 py-4` to `px-6 py-8`
- Card padding: `p-4` to `p-5`
- Gap between cards: `gap-3` to `gap-4`
- Icon-text gap: `gap-2` to `gap-3`

---

## Phase 2: Apple/Google Design Principles Evaluation

### 2.1 Clarity — Score: 7/10

**Passes:**
- ✅ Page titles clearly communicate purpose
- ✅ Primary actions are visually distinct (blue)
- ✅ Status indicators use appropriate colors

**Fails:**
- ❌ Some icon buttons lack labels (accessibility)
- ❌ "Coming Soon" cards could be hidden entirely
- ❌ Dense tables on mobile need column prioritization

**Evidence:**
```tsx
// Index.tsx:228 - "Coming Soon" card creates clutter
<div className="relative bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 opacity-60 cursor-default">
  <span className="absolute top-2 right-2 text-xs bg-stone-200 text-[#5c5552] px-2 py-0.5 rounded-full">
    Coming Soon
  </span>
```

**Recommendation:** Hide coming soon features or use feature flags instead of showing disabled UI.

### 2.2 Deference — Score: 8/10

**Passes:**
- ✅ Content takes center stage
- ✅ Minimal decorative elements
- ✅ Animations are subtle (`transition-colors`, `transition-all`)

**Fails:**
- ❌ Fixed footer on agent dashboard obscures content
- ❌ Some cards have excessive hover effects

**Evidence:**
```tsx
// Index.tsx:294 - Fixed footer covers content
<footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
```

**Recommendation:** Change to static footer or add scroll padding.

### 2.3 Depth — Score: 7/10

**Passes:**
- ✅ Cards have appropriate elevation via borders
- ✅ Modals use backdrop blur
- ✅ Active sidebar items are clearly distinguished

**Fails:**
- ❌ No shadow hierarchy (all cards appear at same level)
- ❌ Dropdown menus could use more elevation

**Recommendation:** Implement 3-level shadow hierarchy:
```css
/* Level 1: Cards (resting) */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Level 2: Cards (hover/active) */
box-shadow: 0 4px 12px rgba(0,0,0,0.08);

/* Level 3: Modals/Dropdowns */
box-shadow: 0 10px 40px rgba(0,0,0,0.15);
```

### 2.4 Consistency — Score: 6/10

**Critical Issue: Three Header Patterns**

1. **Agent pages** (Index.tsx):
```tsx
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
  <div className="max-w-5xl mx-auto flex items-center justify-between py-4">
```

2. **Admin pages** (AdminLayout.tsx):
```tsx
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
  <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
```

3. **Resource pages** (CarrierResourcesPage.tsx):
```tsx
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">
  <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
```

**Issues:**
- Different `z-index` values (40 vs 50)
- Different `max-w` values (5xl vs 6xl)
- Different `py` values (3 vs 4)

**Recommendation:** Create single `<AppHeader />` component with consistent values.

### 2.5 Feedback — Score: 7/10

**Passes:**
- ✅ Toast notifications on actions (Sonner)
- ✅ Loading spinners during data fetch
- ✅ Form validation feedback

**Fails:**
- ❌ No button loading states during form submission
- ❌ Missing optimistic updates on list operations
- ❌ Save indicator disappears too quickly (2s)

**Evidence:**
```tsx
// ContractingForm.tsx:93-94 - showSaved state
const [showSaved, setShowSaved] = useState(false);
// Disappears after only 2 seconds
const timer = setTimeout(() => setShowSaved(false), 2000);
```

**Recommendation:** Extend saved indicator to 3-4 seconds; add persistent "last saved" timestamp.

### 2.6 Efficiency — Score: 8/10

**Task Analysis:**

| Task | Current Clicks | Optimal | Gap |
|------|---------------|---------|-----|
| Agent opens carrier resources | 2 | 1 | Add to dashboard |
| Admin finds agent | 2-3 | 1 | Keyboard shortcut |
| Agent uploads AHIP cert | 3 | 2 | Drag-drop zone |
| Admin creates agent | 4 | 3 | Inline quick-add |

**Recommendation:** Implement command palette (Cmd+K) for power users.

---

## Phase 3: Page-by-Page Analysis

### 3.1 Agent Dashboard (Index.tsx)

**First Impression:** Clean, welcoming, but sparse

**Strengths:**
- Hero card draws attention to primary action
- Logical grouping (Quick Quote, Your Business)
- Personal greeting creates warmth

**Issues:**

| Issue | Severity | Line | Current | Recommendation |
|-------|----------|------|---------|----------------|
| Fixed footer covers content | Medium | 294 | `fixed bottom-0` | Use `sticky` or static |
| "Coming Soon" clutter | Low | 228 | Visible disabled card | Hide entirely |
| No quick production stats | Medium | — | Not present | Add mini BoB summary |
| Inconsistent card heights | Low | 97-136 | Variable | Use `flex flex-col` + `flex-1` |

**Recommended Changes:**
```tsx
// Remove fixed footer, add bottom padding
<main className="pt-6 pb-20 px-6">  {/* Added pb-20 */}
...
<footer className="py-3 text-center">  {/* Removed fixed */}
```

### 3.2 Contracting Wizard (ContractingForm.tsx)

**First Impression:** Professional, well-structured progress tracking

**Strengths:**
- 12-step progress is clearly shown
- Auto-save provides peace of mind
- Section acknowledgment creates accountability

**Issues:**

| Issue | Severity | Line | Current | Recommendation |
|-------|----------|------|---------|----------------|
| No estimated time | Medium | — | Not shown | Add "~5 min remaining" |
| Step descriptions hard to scan | Low | 60-76 | Inline text | Move to dedicated area |
| Exit flow unclear | High | — | Logout only | Add "Save & Exit" option |
| Mobile keyboard overlap | High | — | Forms covered | Add scroll padding |

**Recommended Changes:**
```tsx
// Add explicit save & exit
<Button variant="outline" onClick={handleSaveAndExit}>
  <LogOut className="w-4 h-4 mr-2" />
  Save & Exit
</Button>
```

### 3.3 Carrier Resources (CarrierResourcesPage.tsx)

**First Impression:** Clean master-detail layout

**Strengths:**
- Sidebar carrier selection is intuitive
- Contacts grid is scannable
- External links clearly marked

**Issues:**

| Issue | Severity | Line | Current | Recommendation |
|-------|----------|------|---------|----------------|
| No carrier logos visible when unselected | Low | 104 | White background | Add subtle logo always |
| Loading state blocks entire content | Medium | 128 | Single spinner | Use skeleton |
| Empty state not helpful | Medium | 143 | "No data available" | Suggest next steps |
| Contact cards lack click-to-call | Low | 172 | Links only | Add tap area |

**Recommended Skeleton Pattern:**
```tsx
{loading ? (
  <div className="space-y-3">
    <Skeleton className="h-40 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  </div>
) : ...
```

### 3.4 Contracting Hub (ContractingHubPage.tsx)

**First Impression:** Data-rich but well organized

**Strengths:**
- Progress bar provides immediate status
- AHIP integration is prominent
- Table is sortable by status

**Issues:**

| Issue | Severity | Line | Current | Recommendation |
|-------|----------|------|---------|----------------|
| Table header doesn't scroll | Low | 597 | sticky top-0 | Keep behavior but add shadow |
| "Request Contracting" does nothing | High | 657 | Just button | Add mailto or modal |
| 2027 column premature | Low | 603 | "Coming" text | Hide until relevant |
| Resources dropdown closes on outside click only | Medium | 119 | mousedown handler | Add escape key |

### 3.5 Admin Dashboard (AdminDashboard.tsx)

**First Impression:** Search-first design is excellent

**Strengths:**
- Large search input draws focus
- Quick stats are immediately visible
- Card grid provides clear navigation

**Issues:**

| Issue | Severity | Line | Current | Recommendation |
|-------|----------|------|---------|----------------|
| Search results cut off at 8 | Medium | 127 | `.limit(8)` | Add "see all" or pagination |
| No keyboard navigation in results | High | 247 | Click only | Add arrow key support |
| Stats don't link to filtered views | Medium | 303 | Static text | Make clickable |

**Recommended Keyboard Navigation:**
```tsx
const [selectedIndex, setSelectedIndex] = useState(-1);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    setSelectedIndex(i => Math.min(i + 1, results.length - 1));
  } else if (e.key === 'ArrowUp') {
    setSelectedIndex(i => Math.max(i - 1, 0));
  } else if (e.key === 'Enter' && selectedIndex >= 0) {
    navigate(`/admin/agents/${results[selectedIndex].id}`);
  }
};
```

### 3.6 Agent Profile (AgentProfilePage.tsx)

**First Impression:** Comprehensive but dense

**Strengths:**
- Tabbed organization manages complexity
- Inline editing reduces friction
- Status badges are clear

**Issues:**
- Long page with no anchor navigation
- Edit modals could be inline edits
- Activity section buried at bottom

---

## Phase 4: Specific Element Analysis

### 4.1 Navigation

**Global Navigation Issues:**

1. **No breadcrumbs** — Users lose context in deep pages
2. **Back button inconsistency** — Some use browser back, some use explicit link
3. **Mobile hamburger missing** — Sidebar doesn't exist; all nav is in header

**Recommendation:** Add lightweight breadcrumb trail:
```tsx
<nav className="text-sm text-muted-foreground mb-4">
  <Link to="/">Dashboard</Link>
  <ChevronRight className="w-3 h-3 mx-1 inline" />
  <span>Carrier Resources</span>
</nav>
```

### 4.2 Forms

**Form Pattern Audit:**

| Aspect | Current | Apple/Google Standard | Action |
|--------|---------|----------------------|--------|
| Label position | Above field | Above (good) | Keep |
| Required indication | None visible | Asterisk or inline | Add asterisk |
| Validation timing | On blur | Real-time for critical | Add debounced |
| Error position | Below field | Below (good) | Keep |
| Submit disabled until valid | Yes | Yes (good) | Keep |
| Input height | 40px | 44px minimum | Increase |

**Touch Target Fix:**
```tsx
// Current
<Input className="h-9" />

// Recommended
<Input className="h-11" />  // 44px
```

### 4.3 Tables

**Table Pattern Audit:**

| Aspect | Current | Recommendation |
|--------|---------|----------------|
| Responsive | None | Hide columns, card view on mobile |
| Sorting | Some tables | Add to all tables |
| Filtering | Search only | Add column filters |
| Row actions | Inline buttons | Hover reveal or menu |
| Empty state | Text only | Add illustration + CTA |

### 4.4 Cards

**Card Consistency Matrix:**

| Property | Index.tsx | CarrierResources | AdminDashboard |
|----------|-----------|------------------|----------------|
| Border | `border-[#e8e4dd]` | `border-[#e8e4dd]` | `border-border` |
| Radius | `rounded-xl` | `rounded-xl` | `rounded-lg` |
| Padding | `p-5` | `p-4` to `p-5` | `p-5` |
| Hover | `hover:shadow-md` | `hover:border-blue-200` | `hover:shadow-lg` |

**Standardization Needed:** Create `<Card variant="default|interactive|highlight">` component.

### 4.5 Modals

**Modal Audit:**

| Aspect | Current | Issue | Fix |
|--------|---------|-------|-----|
| Close methods | X button, backdrop | Missing ESC key | Add `onEscapeKeyDown` |
| Focus trap | Radix default | Good | Keep |
| Return focus | Radix default | Good | Keep |
| Animation | `animate-in` | Good | Keep |
| Mobile | Fixed width | Doesn't account for keyboard | Add `h-[calc(100vh-var(--keyboard-height))]` |

### 4.6 Buttons

**Button Hierarchy:**

```
Primary (Blue fill)   → Main page action, form submit
Secondary (Outline)   → Cancel, back, alternate action
Ghost (Text only)     → Inline links, tertiary actions
Destructive (Red)     → Delete, deactivate (use sparingly)
```

**Issues Found:**
- Some ghost buttons hard to see
- Destructive actions not confirmed
- No loading state built into Button component

**Button Loading Pattern:**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

### 4.7 Status & Feedback

**Toast Patterns:**

| Type | Current Duration | Recommendation |
|------|-----------------|----------------|
| Success | 3s (Sonner default) | 3s (good) |
| Error | 3s | 5s (needs reading time) |
| Info | 3s | 4s |

**Missing Feedback:**
- No skeleton loaders during data fetch
- No optimistic UI updates
- No undo for destructive actions

---

## Phase 5: Accessibility Audit

### 5.1 Color & Contrast

**WCAG AA Analysis (4.5:1 minimum for text):**

| Element | Foreground | Background | Ratio | Pass? |
|---------|------------|------------|-------|-------|
| Primary text | #292524 | #FFFFFF | 14.5:1 | ✅ |
| Secondary text | #5c5552 | #FFFFFF | 7.1:1 | ✅ |
| Tertiary text | #5c5552 @ 50% | #FFFFFF | 3.5:1 | ❌ |
| Blue link | #2563eb | #FFFFFF | 4.6:1 | ✅ |
| Gold on white | #8B7355 | #FFFFFF | 3.8:1 | ❌ |
| Green success | #22c55e | #FFFFFF | 2.8:1 | ❌ |

**Critical Fixes Needed:**
```css
/* Tertiary text - increase opacity */
.text-muted-foreground\/60 {
  color: hsl(30 8% 45%);  /* Darker, not transparent */
}

/* Green success - use darker shade */
.text-green-600 { color: #16a34a; }  /* 3.6:1 - still marginal */
.text-green-700 { color: #15803d; }  /* 4.6:1 - passes */
```

### 5.2 Keyboard Navigation

**Current State:**
- ✅ Tab order follows visual order
- ✅ Form inputs are keyboard accessible
- ❌ Custom dropdowns trap focus
- ❌ Data tables lack keyboard navigation
- ❌ Cards with `onClick` need keyboard equivalent

**Fix for clickable cards:**
```tsx
// Current
<Card onClick={() => navigate('/admin/agents')}>

// Accessible version
<Card
  onClick={() => navigate('/admin/agents')}
  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/agents')}
  tabIndex={0}
  role="button"
  aria-label="View all agents"
>
```

### 5.3 Screen Reader Support

**Issues Found:**

| Issue | Location | Fix |
|-------|----------|-----|
| Images missing alt text | Carrier logos | Add `alt={carrier.name}` |
| Icon buttons need labels | Close buttons | Add `aria-label="Close"` |
| Live regions missing | Toast notifications | Use `aria-live="polite"` |
| Heading hierarchy broken | Some pages skip h2 | Ensure h1 → h2 → h3 |

### 5.4 Responsive Design

**Breakpoint Behavior:**

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Header | OK | OK | OK |
| Dashboard grid | Stacks | 2 columns | 3-4 columns |
| Carrier sidebar | Hidden? | 3 cols | 3 cols |
| Tables | Horizontal scroll | Full | Full |
| Forms | Full width | Full width | Max-width constrained |

**Mobile Issues:**
- Carrier sidebar doesn't collapse on mobile
- Table horizontal scroll is only solution
- Touch targets too small in some areas

---

## Phase 6: Deliverables

### 6.1 Design System Recommendations

**Color Palette Refinements:**

```css
:root {
  /* Keep existing, add these */
  --text-tertiary: hsl(30 8% 45%);        /* Accessible tertiary */
  --success-text: hsl(142 76% 28%);       /* Darker green for text */
  --warning-text: hsl(32 95% 35%);        /* Darker amber for text */

  /* Shadow hierarchy */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.12);
}
```

**Typography Scale (8px grid):**

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| text-xs | 12px | 16px | 400 | Tertiary, labels |
| text-sm | 14px | 20px | 400 | Body, descriptions |
| text-base | 16px | 24px | 400 | Large body |
| text-lg | 18px | 28px | 500 | Card titles |
| text-xl | 20px | 28px | 600 | Section headers |
| text-2xl | 24px | 32px | 600 | Page titles |
| text-3xl | 30px | 36px | 600 | Hero titles |

**Spacing System (8px base):**

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight internal spacing |
| space-2 | 8px | Default internal spacing |
| space-3 | 12px | Between related elements |
| space-4 | 16px | Card padding, section gaps |
| space-5 | 20px | Current card padding |
| space-6 | 24px | Between sections |
| space-8 | 32px | Page sections |

### 6.2 Prioritized Roadmap

#### Quick Wins (< 1 hour each)

| # | Task | Impact | File |
|---|------|--------|------|
| 1 | Remove fixed footer on dashboard | High | Index.tsx:294 |
| 2 | Hide "Coming Soon" cards | Medium | Index.tsx:228 |
| 3 | Increase input height to 44px | Medium | components/ui/input.tsx |
| 4 | Add aria-labels to icon buttons | High | Throughout |
| 5 | Extend save indicator to 4s | Low | ContractingForm.tsx:154 |
| 6 | Add ESC key to close dropdowns | Medium | ContractingHubPage.tsx |
| 7 | Fix tertiary text contrast | High | index.css |
| 8 | Add alt text to carrier logos | High | CarrierResourcesPage.tsx |

#### Short Term (1-2 days)

| # | Task | Impact | Scope |
|---|------|--------|-------|
| 1 | Create unified `<AppHeader />` | High | New component |
| 2 | Add skeleton loaders | High | Multiple pages |
| 3 | Implement keyboard nav for search | High | AdminDashboard.tsx |
| 4 | Create empty state component | Medium | New component |
| 5 | Add breadcrumb navigation | Medium | New component |
| 6 | Standardize card hover effects | Medium | Tailwind config |

#### Medium Term (1 week)

| # | Task | Impact | Scope |
|---|------|--------|-------|
| 1 | Mobile-responsive carrier sidebar | High | CarrierResourcesPage |
| 2 | Command palette (Cmd+K) | High | New feature |
| 3 | Button loading state component | Medium | components/ui/button.tsx |
| 4 | Table responsive patterns | High | components/ui/table.tsx |
| 5 | Form validation real-time | Medium | Form components |

#### Long Term (Ongoing)

| # | Task | Impact | Notes |
|---|------|--------|-------|
| 1 | Design token migration | High | Move to CSS variables |
| 2 | Animation library | Medium | Framer Motion integration |
| 3 | Accessibility audit tooling | High | axe-core integration |
| 4 | Design system documentation | Medium | Storybook |
| 5 | Performance monitoring | Medium | Core Web Vitals tracking |

### 6.3 Top 10 Code Recommendations

#### 1. Fix Fixed Footer (Index.tsx)

**Location:** `src/pages/Index.tsx:294`

**Current:**
```tsx
<footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
```

**Recommended:**
```tsx
// Add bottom padding to main
<main className="pt-6 pb-16 px-6">
...
// Change footer to static
<footer className="py-4 text-center">
  <p className="text-xs text-[#5c5552]/60">
    Powered by <span className="text-[#5c5552]/80">Tyler Insurance Group</span>
  </p>
</footer>
```

#### 2. Accessible Icon Button (Throughout)

**Current:**
```tsx
<button onClick={() => setAlertDismissed(true)} className="...">
  <X className="w-4 h-4" />
</button>
```

**Recommended:**
```tsx
<button
  onClick={() => setAlertDismissed(true)}
  className="..."
  aria-label="Dismiss alert"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

#### 3. Skeleton Loader Component

**Create:** `src/components/ui/skeleton-card.tsx`

```tsx
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-[#e8e4dd] rounded-xl p-5 animate-pulse", className)}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}
```

#### 4. Unified Header Component

**Create:** `src/components/layout/AppHeader.tsx`

```tsx
import { Link } from 'react-router-dom';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

interface AppHeaderProps {
  userName?: string;
  showBranding?: boolean;
}

export function AppHeader({ userName, showBranding = true }: AppHeaderProps) {
  return (
    <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
        {showBranding && (
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-[#292524]">TIG</span>
            <span className="text-[#e8e4dd]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </Link>
        )}

        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-sm text-[#5c5552] hidden sm:block">{userName}</span>
          )}
          <UserAvatarDropdown />
        </div>
      </div>
    </header>
  );
}
```

#### 5. Accessible Clickable Card

**Current:**
```tsx
<Card className="group cursor-pointer" onClick={() => navigate('/admin/agents')}>
```

**Recommended:**
```tsx
<Card
  className="group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  onClick={() => navigate('/admin/agents')}
  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/agents')}
  tabIndex={0}
  role="button"
  aria-label="View all agents"
>
```

#### 6. Empty State Component

**Create:** `src/components/ui/empty-state.tsx`

```tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-[#292524] mb-1">{title}</h3>
      <p className="text-sm text-[#5c5552] max-w-sm mb-4">{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

#### 7. Fix Tertiary Text Contrast

**Location:** `src/index.css`

**Add:**
```css
/* Accessible tertiary text - don't use opacity */
.text-tertiary {
  color: hsl(30 8% 45%);  /* 4.5:1 contrast ratio */
}

/* Replace usages of text-muted-foreground/60 with text-tertiary */
```

#### 8. Input Height Increase

**Location:** `src/components/ui/input.tsx`

**Current:**
```tsx
className={cn(
  "flex h-9 w-full rounded-md border ...",
  className
)}
```

**Recommended:**
```tsx
className={cn(
  "flex h-11 w-full rounded-md border ...",  // 44px for touch
  className
)}
```

#### 9. Button Loading State

**Location:** `src/components/ui/button.tsx`

**Add variant:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
```

#### 10. Keyboard Navigation for Search Results

**Location:** `src/pages/admin/AdminDashboard.tsx`

**Add to search component:**
```tsx
const [selectedIndex, setSelectedIndex] = useState(-1);

useEffect(() => {
  setSelectedIndex(-1);  // Reset when results change
}, [searchResults]);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!showResults || searchResults.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
      break;
    case 'Enter':
      if (selectedIndex >= 0) {
        navigate(`/admin/agents/${searchResults[selectedIndex].id}`);
        setShowResults(false);
      }
      break;
    case 'Escape':
      setShowResults(false);
      break;
  }
};

// In input:
<input
  onKeyDown={handleKeyDown}
  ...
/>

// In results:
{searchResults.map((result, index) => (
  <button
    className={cn(
      "...",
      selectedIndex === index && "bg-blue-50 border-l-2 border-l-blue-500"
    )}
    ...
  >
))}
```

---

## Appendix: Full Component Audit Checklist

### Buttons
- [x] Primary/secondary/tertiary hierarchy clear
- [ ] All buttons have minimum 44px touch target
- [ ] Loading states implemented
- [x] Destructive actions use red
- [ ] Disabled states have sufficient contrast

### Cards
- [ ] Consistent border radius (standardize on rounded-xl)
- [ ] Consistent hover effects
- [x] Clear content hierarchy
- [ ] Keyboard accessible when interactive

### Forms
- [x] Labels above fields
- [ ] Required field indication
- [x] Validation messages below fields
- [ ] 44px minimum input height
- [x] Focus states visible

### Tables
- [ ] Responsive strategy defined
- [ ] Sortable columns indicated
- [x] Row hover states
- [ ] Empty states designed

### Navigation
- [ ] Breadcrumbs on deep pages
- [x] Current page indicated
- [ ] Mobile navigation pattern
- [ ] Keyboard shortcuts for power users

### Feedback
- [x] Toast notifications working
- [ ] Skeleton loaders implemented
- [x] Loading spinners present
- [ ] Error states designed
- [ ] Success confirmations

---

**End of Audit**

*For questions or clarification, contact the UX team.*
