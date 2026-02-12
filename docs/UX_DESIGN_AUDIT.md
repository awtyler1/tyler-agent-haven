# TIG Platform UX & Design Audit

**Conducted by:** Apple CDO + Robinhood Head of Design
**Date:** January 28, 2026
**Platform:** TIG Agent Portal (Medicare Insurance Agent Management)
**Primary Users:** Medicare agents aged 45-65, varying technical proficiency

---

## Executive Summary

### Overall Design Maturity Score: **7.2 / 10**

The TIG Platform demonstrates solid foundational design work with a cohesive design system, well-documented patterns, and thoughtful dark mode implementation. However, significant opportunities exist to elevate from "good insurance software" to "world-class agent experience."

### Top 5 Highest-Impact Improvements

| # | Improvement | Impact | Effort |
|---|-------------|--------|--------|
| 1 | **Navigation simplification** - Current nav is fragmented across pages; needs unified persistent navigation | Critical | Medium |
| 2 | **Touch target expansion** - Many interactive elements below 44px minimum for 45-65 demographic | High | Low |
| 3 | **Empty state standardization** - Inconsistent empty states across features | High | Low |
| 4 | **Loading state harmony** - Multiple different loading patterns create cognitive friction | Medium | Low |
| 5 | **Form input consistency** - Variable input heights and styles across different forms | Medium | Medium |

---

## Phase 1: UI Surface Area Inventory

### Route Inventory (32 Routes)

| Category | Count | Examples |
|----------|-------|----------|
| **Authentication** | 3 | `/auth`, `/auth/set-password`, `/auth/forgot-password` |
| **Agent Dashboard** | 14 | `/`, `/start-here`, `/contracting-hub`, `/book-of-business`, `/carrier-resources`, `/training` |
| **Admin** | 12 | `/admin`, `/admin/agents`, `/admin/contracting`, `/admin/rts-import` |
| **Super Admin** | 3 | `/admin/activity-log`, `/admin/labs`, `/admin/pdf-builder` |

### Component Inventory (117 Components)

| Category | Count | Maturity |
|----------|-------|----------|
| **UI Primitives** | 45 | ★★★★☆ Well-structured Shadcn base |
| **Admin Features** | 10 | ★★★☆☆ Functional but inconsistent |
| **Book of Business** | 16 | ★★★★☆ Modern, delightful animations |
| **Contracting** | 25 | ★★★☆☆ Complex, needs refinement |
| **Training** | 4 | ★★★☆☆ Basic implementation |
| **Layout/Navigation** | 7 | ★★☆☆☆ Needs unification |

### Design Token Coverage

| Token Category | Status | Notes |
|----------------|--------|-------|
| Colors | ✅ Complete | HSL-based with excellent dark mode |
| Typography | ✅ Complete | Playfair Display + Inter pairing |
| Spacing | ⚠️ Partial | Documented but inconsistently applied |
| Shadows | ✅ Complete | Three-tier system (soft, card, elevated) |
| Animation | ⚠️ Partial | Basic keyframes, missing micro-interactions |
| Border Radius | ⚠️ Inconsistent | Multiple values in use (6px, 8px, 12px, 16px, 28px) |

---

## Phase 2: Apple Design Principles Evaluation

### 2.1 Clarity — Score: 7/10

**Strengths:**
- Typography hierarchy is clear with Playfair Display for headings, Inter for body
- Status indicators (dots, checkmarks) are universally understood
- Card-based layouts provide clear content grouping

**Issues:**
```
CRITICAL: Navigation clarity
- Index.tsx:44-76 has its own header distinct from Navigation.tsx
- AdminDashboard.tsx:200-232 has another distinct header
- ContractingHubPage.tsx:404-419 yet another header variant
- Users encounter 3+ different header patterns
```

```
MAJOR: Icon consistency
- External links: sometimes ExternalLink icon, sometimes no indicator
- Status: mix of CheckCircle2, Check, Circle, status dots
- Actions: inconsistent icon placement (left vs right of text)
```

```
MINOR: Label clarity
- "Contracting Hub" vs "Carrier Status" (same destination, different labels)
- "My Profile" vs "Profile" vs "Account & settings"
- "RTS Import" - jargon that may confuse new admins
```

### 2.2 Deference — Score: 8/10

**Strengths:**
- UI genuinely gets out of the way on content pages
- Generous whitespace usage (documented in HOMESTEAD.md)
- Subtle hover states that don't overwhelm

**Issues:**
```
MODERATE: Visual noise on data-heavy pages
- ContractingHubPage carrier table has 6 columns creating visual density
- AllAgentsTab.tsx:661-728 table feels cramped with 6 columns
- Multiple competing calls-to-action on dashboard cards
```

```
MINOR: Gratuitous decorative elements
- Gradient dividers (`h-px bg-gradient-to-r`) appear decorative, not functional
- Footer "Powered by Tyler Insurance Group" competes for attention
```

### 2.3 Depth — Score: 6/10

**Strengths:**
- Shadow system creates clear elevation hierarchy
- Modal overlays (`bg-black/80`) establish depth
- Card hover states provide responsive feedback

**Issues:**
```
CRITICAL: Missing meaningful motion
- No page transitions between routes
- Instant state changes (loading → loaded) feel jarring
- Success states appear without celebration
```

```
MAJOR: Z-index inconsistency
- Navigation z-50, search dropdown z-50, modals z-50
- Potential layering conflicts not addressed
- No documented z-index scale in design system
```

```
MODERATE: Flat feeling on critical flows
- Contracting wizard steps feel disconnected
- No visual indication of progress depth
- Form sections lack spatial relationship
```

### 2.4 Consistency — Score: 6/10

**Strengths:**
- Button component well-defined with 6 variants
- Card pattern documented and mostly followed
- Color system consistently applied

**Issues:**
```
CRITICAL: Header inconsistency
Location: Multiple files
- Index.tsx uses custom header with "TIG | Agent Portal"
- Navigation.tsx uses logo-based navigation
- AdminDashboard uses "TIG | Agent Portal" text
- AdminLayout (implied) uses different pattern
Result: Users experience 3+ navigation paradigms
```

```
CRITICAL: Input height inconsistency
- AuthPage.tsx:183 uses h-[56px] with rounded-2xl
- AllAgentsTab.tsx:544 uses h-10 with default rounded
- ContractingForm sections use h-11 from Input component
- Search inputs vary between h-10 and h-12
```

```
MAJOR: Button style mixing
- AuthPage.tsx:206-231 uses custom inline styles for button
- Other pages use standard Button component variants
- Gold gradient button defined in component but overridden inline
```

```
MAJOR: Card border radius
- AuthPage card: rounded-[28px]
- Dashboard cards: rounded-xl (12px)
- Table container: rounded-lg (8px)
- Inconsistent visual language
```

---

## Phase 3: Robinhood Simplicity Audit

### 3.1 Information Density — Score: 7/10

**Strengths:**
- Index page is admirably simple with clear card hierarchy
- Quick Quote section provides immediate utility
- "Your Business" section groups related actions well

**Issues:**
```
MAJOR: ContractingHubPage overload
Location: ContractingHubPage.tsx:437-549
- Progress card packs 3 sections (progress, AHIP, resources) into one row
- Dividers with flex layout create visual complexity
- Mobile experience likely problematic
```

```
MAJOR: AllAgentsTab information density
Location: AllAgentsTab.tsx:536-596
- 5 filters in one row
- Search + 4 dropdowns + Export button
- No progressive disclosure
```

```
MODERATE: Carrier table shows all columns always
- No responsive column hiding
- No ability to customize visible columns
- 6 columns on all screen sizes
```

### 3.2 Onboarding & Empty States — Score: 6/10

**Strengths:**
- EmptyState.tsx in book-of-business is well-crafted
- HOMESTEAD.md documents empty state pattern
- Positive framing ("Build your book" not "Nothing here")

**Issues:**
```
CRITICAL: Inconsistent empty state patterns
- EmptyState.tsx (book-of-business): Large icon, centered, CTA button
- ContractingHubPage:596-603: Small icon, minimal text, no CTA
- AllAgentsTab:683-688: Simple text only, no visual interest
```

```
MAJOR: No onboarding flow for new agents
- Start Here page exists but is passive
- No progressive disclosure of features
- No tooltips or feature discovery
```

```
MODERATE: First-time experience unclear
- What should agent do first after login?
- AHIP alert banner is dismissible but action not tracked
- No completion celebration for milestones
```

### 3.3 Action Clarity — Score: 7/10

**Strengths:**
- Primary actions generally clear (blue buttons stand out)
- Card links have consistent arrow indicators
- Form submit buttons appropriately prominent

**Issues:**
```
MAJOR: Competing CTAs on Index page
Location: Index.tsx:116-156
- "Carrier Resources" hero card fights with "Forms Library"
- Both have similar visual weight
- User must decide which is more important
```

```
MAJOR: Table row actions hidden
Location: AllAgentsTab.tsx:784-914
- Quick view panel only appears on selection
- Actions require clicking row first, then finding action
- No hover-reveal actions on rows
```

```
MODERATE: Ambiguous clickability
- Table rows are clickable but no visual affordance
- Some cards are links, some are not
- Status badges look clickable but aren't
```

### 3.4 Feedback & Confirmation — Score: 6/10

**Strengths:**
- Sonner toast implementation is clean
- Loading spinners present for async operations
- Form auto-save has "Saved" indicator

**Issues:**
```
CRITICAL: Inconsistent loading states
- Index.tsx:26-31: Loader2 centered, no message
- ContractingHubPage:389-398: Loader2 with message
- AllAgentsTab:526-532: Loader2 different color (text-gold)
- No skeleton loading anywhere
```

```
MAJOR: Missing success celebrations
- File upload success: only toast
- Form submission: modal appears but no animation
- Milestone achievement: no confetti or delight
```

```
MODERATE: Error states underutilized
- Forms show errors but no error boundary UI
- API failures show generic toast
- No retry mechanisms visible to user
```

---

## Phase 4: Component-Level Deep Dive

### 4.1 Navigation

**Current State:**
```tsx
// Navigation.tsx - Primary nav (logo-based)
<nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">

// Index.tsx - Dashboard header (text-based)
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-6">

// AdminDashboard.tsx - Admin header (text-based, different structure)
<header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Three different header implementations | Critical | Multiple files |
| Navigation.tsx only shows "Dashboard" link | Critical | Navigation.tsx:13-15 |
| No breadcrumbs on deep pages | Major | All admin pages |
| Mobile nav is hamburger menu only | Moderate | Navigation.tsx:115-193 |
| Mode toggle duplicated in 3 places | Major | Multiple files |

**Recommendation:**
Create unified `AppHeader` component that adapts based on context but maintains consistent structure.

### 4.2 Forms & Inputs

**Current State:**
```tsx
// Input component base - h-11 (44px)
"flex h-11 w-full rounded-md border..."

// AuthPage overrides - h-[56px]
className="h-[56px] px-5 text-[15px] bg-white border-border/30 rounded-2xl..."

// AllAgentsTab search - h-10 (40px)
className="pl-10 h-10 border-border"

// AdminDashboard search - h-12 (48px)
className="w-full h-12 pl-12 pr-4..."
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Input heights: 40px, 44px, 48px, 56px | Critical | Multiple files |
| Label placement inconsistent (above vs. inline) | Major | Various forms |
| Required field indicators missing | Major | All forms |
| Touch targets below 44px on some inputs | Critical | Select triggers at h-10 |
| Error styling not standardized | Moderate | Various |

**Recommendation:**
Standardize on 48px (h-12) minimum for all form inputs to ensure touch accessibility for 45-65 demographic.

### 4.3 Data Display

**Tables:**
```tsx
// AllAgentsTab.tsx - Well-structured but dense
<Table>
  <TableHeader className="sticky top-0 z-10">
    <TableRow className="bg-muted hover:bg-muted">
      // 6 columns packed tightly
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| No column resizing | Minor | AllAgentsTab |
| No column visibility toggle | Moderate | AllAgentsTab |
| Pagination controls small | Moderate | AllAgentsTab:731-780 |
| Sort indicators missing | Major | Table headers |
| Row hover action area unclear | Major | Table rows |

**Cards:**
```tsx
// Index.tsx cards - Good pattern
<Link className="group bg-blue-50 border border-blue-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200">

// AdminDashboard cards - Different pattern
<Card className="group cursor-pointer bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-lg transition-all">
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Card border radius varies (lg vs xl) | Moderate | Multiple |
| Card background varies (white, blue-50, etc.) | Minor | Index.tsx |
| Information hierarchy within cards inconsistent | Moderate | Multiple |

### 4.4 Modals & Dialogs

**Current State:**
```tsx
// dialog.tsx - Well-implemented base
<DialogPrimitive.Content
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]..."
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Modal overlay too dark (bg-black/80) | Minor | dialog.tsx:22 |
| Close button small (h-4 w-4) | Moderate | dialog.tsx:48-50 |
| No confirmation pattern for destructive actions | Major | Throughout |
| Mobile modal sizing not optimized | Moderate | max-w-lg always |

### 4.5 Buttons & CTAs

**Current State:**
```tsx
// button.tsx - 6 variants defined
variant: {
  default: [gold gradient],
  destructive: [red],
  outline: [border with hover],
  secondary: [gray],
  ghost: [transparent hover],
  link: [underline]
}

// Sizes
size: {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10"
}
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Default h-10 (40px) below touch minimum | Critical | button.tsx:52 |
| Icon buttons at 40px, should be 44px+ | Critical | button.tsx:55 |
| AuthPage overrides button styles inline | Major | AuthPage.tsx:206-220 |
| No loading state built into Button | Moderate | Throughout |
| Disabled state low contrast (opacity-50) | Minor | button.tsx:8 |

**Recommendation:**
```tsx
// Proposed size updates
size: {
  default: "h-11 px-5 py-2.5",  // 44px
  sm: "h-10 rounded-md px-4",    // 40px (use sparingly)
  lg: "h-12 rounded-md px-8",    // 48px
  icon: "h-11 w-11"              // 44px
}
```

### 4.6 Feedback Components

**Toasts (Sonner):**
- ✅ Clean implementation
- ✅ Good positioning
- ⚠️ Duration may be too short for older users

**Loading:**
```tsx
// Various loading patterns found:
<Loader2 className="h-8 w-8 animate-spin text-[#5c5552]" />  // Index
<Loader2 className="h-8 w-8 animate-spin text-primary" />     // AuthPage
<Loader2 className="h-8 w-8 animate-spin text-gold" />        // AllAgentsTab
<Loader2 className="h-4 w-4 animate-spin" />                  // Inline
```

**Issues:**
| Issue | Severity | Location |
|-------|----------|----------|
| Loading spinner color varies | Moderate | Multiple files |
| No skeleton loading patterns | Major | All data-fetching pages |
| No progress indicators for uploads | Moderate | File upload areas |
| Error boundaries not styled | Major | ProtectedRoute |

**Recommendation:**
Create standardized loading components:
```tsx
<PageLoader />        // Full page, centered
<InlineLoader />      // Button/small area
<SkeletonCard />      // Content placeholder
<SkeletonTable />     // Table placeholder
```

---

## Phase 5: User Flow Analysis

### Flow 1: Agent Onboarding

**Current Flow:**
1. Receive email invite
2. Click link → `/auth/set-password`
3. Set password → Auto-redirect to dashboard
4. See Index page with welcome
5. ??? (No guided next step)

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 3→4 | No onboarding tour or checklist | Major |
| 4 | AHIP banner dismissible, action unclear | Major |
| - | "Start Here" exists but not shown to new users | Critical |
| - | No progress tracking for onboarding completion | Major |

**Recommendation:**
- Auto-route new users to `/start-here`
- Add persistent onboarding checklist
- Track completion state, celebrate milestones

### Flow 2: Agent Profile Management

**Current Flow:**
1. Click avatar dropdown
2. Select "My Profile"
3. View profile (read-only?)
4. Click edit (if available)

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 1 | Avatar dropdown items small | Moderate |
| 3 | Unclear what's editable | Major |
| - | No inline editing patterns | Moderate |

### Flow 3: Contracting Workflow (Critical)

**Current Flow:**
1. Navigate to `/contracting`
2. 12-step wizard with sections
3. Fill forms, upload documents
4. Sign and submit
5. See success modal

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 1 | How does user find this? Only during CONTRACTING_REQUIRED status | Moderate |
| 2 | 12 steps is overwhelming | Major |
| 2 | No ability to save and continue later (visible) | Major |
| 2 | Step progress saved to localStorage (fragile) | Major |
| 3 | Form validation timing unclear | Moderate |
| 4 | Signature pad on mobile? | Critical |
| 5 | Success modal but no next steps | Moderate |

**Recommendation:**
- Group 12 steps into 4-5 logical phases
- Add prominent "Save & Continue Later" button
- Persist progress server-side (already happening but not communicated)
- Add progress celebration between phases

### Flow 4: RTS Import (Admin)

**Current Flow:**
1. Navigate to Admin → RTS Import
2. Upload Excel file
3. See results

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 1 | "RTS Import" label unclear | Moderate |
| 2 | File format requirements? | Major |
| 2 | No preview before commit | Major |
| 3 | Error handling for bad data? | Major |

### Flow 5: Dashboard Experience

**Current Flow:**
1. Login → See Index page
2. Cards for different areas
3. Click card → Navigate

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 1 | No personalization based on user state | Moderate |
| 2 | Cards don't show relevant status | Major |
| 2 | Quick Quote section may be premature for new agents | Minor |

### Flow 6: Search & Discovery (Admin)

**Current Flow:**
1. Go to Admin Dashboard
2. Type in search box
3. See typeahead results
4. Click result → Profile page

**Strengths:**
- Search-first design is excellent
- Typeahead with relevant info (NPN, manager)
- Status badges in results

**Friction Points:**
| Step | Issue | Severity |
|------|-------|----------|
| 2 | No recent searches | Minor |
| 2 | No advanced search | Moderate |
| 3 | Limited to 8 results | Minor |

---

## Phase 6: Accessibility Audit

### Color Contrast (WCAG AA)

| Element | Current | Required | Status |
|---------|---------|----------|--------|
| Body text on background | ~7:1 | 4.5:1 | ✅ Pass |
| Muted text (#5c5552) on white | ~4.8:1 | 4.5:1 | ✅ Pass |
| Tertiary text (hsl 30 8% 45%) | ~3.5:1 | 4.5:1 | ⚠️ Borderline |
| Placeholder text | ~2.5:1 | 4.5:1 | ❌ Fail |
| Gold on white | ~3.2:1 | 4.5:1 | ❌ Fail (text) |
| Blue on white | ~4.6:1 | 4.5:1 | ✅ Pass |

### Touch Targets (44x44px minimum)

| Element | Current Size | Status |
|---------|--------------|--------|
| Default Button | 40px (h-10) | ❌ Fail |
| Icon Button | 40px | ❌ Fail |
| Small Button | 36px (h-9) | ❌ Fail |
| Table Checkbox | 16px area | ❌ Fail |
| Pagination buttons | 32px | ❌ Fail |
| Close dialog X | 16px icon | ❌ Fail |
| Select trigger | 40px | ❌ Fail |
| Mobile nav hamburger | 48px | ✅ Pass |

**Critical for 45-65 demographic:** Multiple touch targets below minimum.

### Keyboard Navigation

| Pattern | Status | Notes |
|---------|--------|-------|
| Tab order | ⚠️ Partial | Generally logical but not tested |
| Focus indicators | ✅ Present | ring-2 ring-primary |
| Skip links | ❌ Missing | No skip to main content |
| Modal focus trap | ✅ Present | Radix Dialog handles |
| Dropdown navigation | ✅ Present | Radix primitives |
| Form error focus | ⚠️ Partial | Errors shown but focus unclear |

### Screen Reader

| Feature | Status | Notes |
|---------|--------|-------|
| Semantic HTML | ✅ Good | Proper headings, landmarks |
| Alt text | ⚠️ Partial | Logo has alt, other images unclear |
| ARIA labels | ⚠️ Partial | Some buttons lack labels |
| Live regions | ❌ Missing | Toast announcements not confirmed |
| Form labels | ✅ Present | Labels properly associated |

---

## Phase 7: Visual Design System Gaps

### Color Inconsistencies

```css
/* Found hex values not in design tokens */
#292524 - Used directly instead of var(--foreground)
#5c5552 - Used directly instead of var(--muted-foreground)
#e8e4dd - Used directly instead of var(--border)
#FEFDFB, #FDFBF7, #FAF8F3 - Gradient values not tokenized
```

**Files affected:** Index.tsx, ContractingHubPage.tsx, AdminDashboard.tsx, AuthPage.tsx

### Typography Scale Gaps

| Issue | Location | Current | Expected |
|-------|----------|---------|----------|
| Font size magic numbers | AuthPage.tsx | text-[13px], text-[15px], text-[2.125rem] | Use scale |
| Letter spacing inline | AuthPage.tsx | letterSpacing: '0.025em' | Token |
| Line height inline | Various | leading-[1.7] | Token |

### Spacing Inconsistencies

| Pattern | Occurrences | Values Found |
|---------|-------------|--------------|
| Card padding | 15+ | p-4, p-5, p-6, p-8, px-4 py-3, px-5 py-4, px-8 py-5, px-11 pb-16 |
| Section gaps | 10+ | gap-2, gap-3, gap-4, gap-5, gap-6, mb-3, mb-4, mb-6, mb-8, mb-10 |
| Container max-width | 5+ | max-w-5xl, max-w-6xl, max-w-xl, max-w-md, max-w-[495px] |

### Border Radius Values

| Value | Usage | Recommended |
|-------|-------|-------------|
| rounded-md (6px) | Buttons, inputs | Keep |
| rounded-lg (8px) | Cards (some) | Standardize |
| rounded-xl (12px) | Cards (most) | Primary card radius |
| rounded-2xl (16px) | Avatars, special inputs | Accent radius |
| rounded-[28px] | Auth card | Eliminate |
| rounded-full | Pills, avatars | Keep |

### Shadow Definitions

Current system is good but underutilized:
- `shadow-soft` defined but rarely used
- `shadow-card` defined but pages use inline shadows
- `shadow-elevated` defined but custom values appear

---

## Recommendations

### Critical Issues (Fix Immediately)

#### 1. Unify Navigation
**Current:** 3+ header implementations
**Fix:** Create single `AppHeader` component
```tsx
<AppHeader
  variant="agent" | "admin"
  showBackButton={boolean}
  breadcrumbs={[...]}
/>
```
**Impact:** Consistent experience, reduced confusion
**Files:** Navigation.tsx, Index.tsx, AdminDashboard.tsx, ContractingHubPage.tsx

#### 2. Touch Target Compliance
**Current:** Multiple elements below 44px
**Fix:** Update button sizes
```tsx
// button.tsx
size: {
  default: "h-11 px-5",     // 44px
  sm: "h-10 px-4",          // 40px - use sparingly
  lg: "h-12 px-8",          // 48px
  icon: "h-11 w-11"         // 44px
}
```
**Impact:** Accessibility for 45-65 demographic
**Files:** button.tsx, input.tsx, select.tsx, all consuming components

#### 3. Input Height Standardization
**Current:** 40px, 44px, 48px, 56px
**Fix:** Standardize on 44px (h-11) or 48px (h-12)
**Files:** input.tsx, AuthPage.tsx, AdminDashboard.tsx, AllAgentsTab.tsx

#### 4. Color Contrast Fixes
**Current:** Placeholder text fails WCAG, gold text fails
**Fix:**
```css
/* Placeholder: darken from ~2.5:1 to 4.5:1 */
placeholder:text-muted-foreground/70 → placeholder:text-muted-foreground

/* Gold text: only use on dark backgrounds or increase saturation */
--gold: 43 70% 35%; /* Darker gold for text */
```

### Major Improvements (High Impact)

#### 5. Loading State Standardization
Create unified loading components:
```tsx
// components/ui/loading.tsx
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export const SectionLoader = () => (
  <div className="py-12 flex justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-border p-5 animate-pulse">
    <div className="h-4 bg-muted rounded w-1/3 mb-3" />
    <div className="h-3 bg-muted rounded w-2/3" />
  </div>
);
```

#### 6. Empty State Consistency
Standardize all empty states:
```tsx
// components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="py-16 text-center">
    <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-2xl flex items-center justify-center">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
    {action && (
      <Button onClick={action.onClick}>{action.label}</Button>
    )}
  </div>
);
```

#### 7. Onboarding Flow
- Auto-route new users (no password_created_at) to `/start-here`
- Add persistent onboarding checklist component
- Track progress in user profile
- Celebrate completion milestones

#### 8. Contracting Wizard UX
- Group 12 steps into 4 phases:
  1. Personal Details (steps 1-4)
  2. Professional Info (steps 5-6)
  3. Background & Banking (steps 7-9)
  4. Documents & Submit (steps 10-12)
- Add phase progress indicator
- Celebrate phase completion
- Clearer save state indication

### Polish Items (Refinements)

#### 9. Micro-interactions
- Button press feedback (scale: 0.98)
- Card hover lift (translateY: -2px)
- Success state animations
- Toast entrance/exit animations

#### 10. Icon Consistency
- Standardize external link indicator
- Consistent icon sizes (w-4 h-4 or w-5 h-5)
- Icon placement rules (left of text for actions, right for navigation)

#### 11. Border Radius Standardization
```tsx
// Three tiers only
const radius = {
  sm: '6px',    // rounded-md - inputs, buttons
  md: '12px',   // rounded-xl - cards, containers
  lg: '16px',   // rounded-2xl - avatars, special elements
  full: '9999px' // rounded-full - pills, circular elements
};
```

#### 12. Shadow Audit
Replace all inline shadows with design system tokens:
- `shadow-soft` for subtle elevation
- `shadow-card` for card hover
- `shadow-elevated` for modals, dropdowns

---

## Proposed Design Token Updates

### Colors (Additions)
```css
:root {
  /* Status colors - semantic */
  --success: 142 76% 36%;      /* Green */
  --warning: 38 92% 50%;       /* Amber */
  --error: 0 84% 60%;          /* Red */
  --info: 217 91% 50%;         /* Blue */

  /* Gold text variant (darker for accessibility) */
  --gold-text: 43 70% 30%;
}
```

### Spacing Scale (Additions)
```css
:root {
  --space-section: 6rem;       /* 96px - between page sections */
  --space-card: 1.25rem;       /* 20px - card padding */
  --space-card-compact: 1rem;  /* 16px - compact card padding */
}
```

### Z-Index Scale (New)
```css
:root {
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-modal-backdrop: 200;
  --z-modal: 210;
  --z-toast: 300;
  --z-tooltip: 400;
}
```

### Animation Tokens (Additions)
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-expo: cubic-bezier(0.87, 0, 0.13, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

---

## Recommended Next Steps

### Phase 1: Foundation (Week 1-2)
1. ✅ Audit complete
2. Update touch targets (button.tsx, input.tsx)
3. Standardize input heights
4. Fix color contrast issues
5. Create unified AppHeader component

### Phase 2: Consistency (Week 3-4)
6. Implement loading state components
7. Standardize empty states
8. Eliminate hardcoded colors
9. Unify border radius usage
10. Create z-index scale

### Phase 3: Polish (Week 5-6)
11. Add micro-interactions
12. Implement onboarding flow
13. Improve contracting wizard phases
14. Add skeleton loading
15. Celebrate milestones with delight

### Phase 4: Refinement (Ongoing)
16. User testing with 45-65 demographic
17. Performance optimization
18. Accessibility audit (automated + manual)
19. Documentation updates

---

## Appendix: File Reference

### Files Requiring Updates (Priority Order)

| File | Issues | Priority |
|------|--------|----------|
| `components/ui/button.tsx` | Touch targets, loading state | Critical |
| `components/ui/input.tsx` | Height standardization | Critical |
| `components/Navigation.tsx` | Unify with other headers | Critical |
| `pages/Index.tsx` | Hardcoded colors, header | High |
| `pages/admin/AdminDashboard.tsx` | Header, colors | High |
| `pages/ContractingHubPage.tsx` | Header, density, colors | High |
| `pages/AuthPage.tsx` | Input heights, inline styles | High |
| `components/admin/AllAgentsTab.tsx` | Touch targets, loading | Medium |
| `index.css` | Add new tokens | Medium |
| `tailwind.config.ts` | Add new tokens | Medium |

### New Components to Create

1. `components/ui/loading.tsx` - Standardized loaders
2. `components/ui/empty-state.tsx` - Consistent empty states
3. `components/layout/AppHeader.tsx` - Unified header
4. `components/ui/skeleton.tsx` - Loading skeletons
5. `components/onboarding/OnboardingChecklist.tsx` - Progress tracking

---

*"The details are not the details. They make the design." — Charles Eames*

*This audit represents a commitment to elevating every pixel, interaction, and moment to meet the standards of world-class design. The path from 7.2 to 9.0 is clear—it requires discipline, consistency, and an unwavering focus on the humans we serve.*

---

## Phase 2 Design Principle Scores

### Clarity — Score: 7/10

**Passes:**
- Page titles clearly communicate purpose
- Primary actions are visually distinct (blue)
- Status indicators use appropriate colors

**Fails:**
- Some icon buttons lack labels (accessibility)
- "Coming Soon" cards could be hidden entirely
- Dense tables on mobile need column prioritization

**Evidence:**
```tsx
// Index.tsx:228 - "Coming Soon" card creates clutter
<div className="relative bg-white border border-[#e8e4dd] rounded-xl px-4 py-3 opacity-60 cursor-default">
  <span className="absolute top-2 right-2 text-xs bg-stone-200 text-[#5c5552] px-2 py-0.5 rounded-full">
    Coming Soon
  </span>
```

**Recommendation:** Hide coming soon features or use feature flags instead of showing disabled UI.

### Deference — Score: 8/10

**Passes:**
- Content takes center stage
- Minimal decorative elements
- Animations are subtle (`transition-colors`, `transition-all`)

**Fails:**
- Fixed footer on agent dashboard obscures content
- Some cards have excessive hover effects

**Evidence:**
```tsx
// Index.tsx:294 - Fixed footer covers content
<footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-gradient-to-t from-[#FEFDFB] to-transparent">
```

**Recommendation:** Change to static footer or add scroll padding.

### Depth — Score: 7/10

**Passes:**
- Cards have appropriate elevation via borders
- Modals use backdrop blur
- Active sidebar items are clearly distinguished

**Fails:**
- No shadow hierarchy (all cards appear at same level)
- Dropdown menus could use more elevation

**Recommendation:** Implement 3-level shadow hierarchy:
```css
/* Level 1: Cards (resting) */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);

/* Level 2: Cards (hover/active) */
box-shadow: 0 4px 12px rgba(0,0,0,0.08);

/* Level 3: Modals/Dropdowns */
box-shadow: 0 10px 40px rgba(0,0,0,0.15);
```

### Consistency — Score: 6/10

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

### Feedback — Score: 7/10

**Passes:**
- Toast notifications on actions (Sonner)
- Loading spinners during data fetch
- Form validation feedback

**Fails:**
- No button loading states during form submission
- Missing optimistic updates on list operations
- Save indicator disappears too quickly (2s)

**Evidence:**
```tsx
// ContractingForm.tsx:93-94 - showSaved state
const [showSaved, setShowSaved] = useState(false);
// Disappears after only 2 seconds
const timer = setTimeout(() => setShowSaved(false), 2000);
```

**Recommendation:** Extend saved indicator to 3-4 seconds; add persistent "last saved" timestamp.

### Efficiency — Score: 8/10

**Task Analysis:**

| Task | Current Clicks | Optimal | Gap |
|------|---------------|---------|-----|
| Agent opens carrier resources | 2 | 1 | Add to dashboard |
| Admin finds agent | 2-3 | 1 | Keyboard shortcut |
| Agent uploads AHIP cert | 3 | 2 | Drag-drop zone |
| Admin creates agent | 4 | 3 | Inline quick-add |

**Recommendation:** Implement command palette (Cmd+K) for power users.
