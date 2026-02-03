# TIG Platform Navigation Analysis

**Analysis Date:** January 28, 2026
**Analyst:** Apple Design Principles Audit
**Target Demographic:** Medicare insurance agents, aged 45-65

---

## Table of Contents

1. [Current State: Navigation Inventory](#section-1-current-state-navigation-inventory)
2. [Role Matrix](#section-2-role-matrix)
3. [Visual Audit Findings](#section-3-visual-audit-findings)
4. [Responsive Behavior Documentation](#section-4-responsive-behavior-documentation)
5. [Design System Compliance Report](#section-5-design-system-compliance-report)
6. [Information Architecture Assessment](#section-6-information-architecture-assessment)
7. [Apple Principles Scorecard](#section-7-apple-principles-scorecard)
8. [Prioritized Issue List](#section-8-prioritized-issue-list)
9. [Three Restructuring Proposals](#section-9-three-restructuring-proposals)
10. [Recommended Path Forward](#section-10-recommended-path-forward)
11. [Technical Implementation Notes](#section-11-technical-implementation-notes)

---

## Section 1: Current State (Navigation Inventory)

### 1.1 Navigation Components Overview

| Component | Location | Type | Used | Role-Based |
|-----------|----------|------|------|------------|
| `Navigation.tsx` | `/components/Navigation.tsx` | Top bar | Yes | Yes |
| `UserAvatarDropdown.tsx` | `/components/UserAvatarDropdown.tsx` | Dropdown menu | Yes | Yes |
| `AdminLayout.tsx` | `/components/layout/AdminLayout.tsx` | Layout wrapper | Yes | Yes |
| `TrainingLayout.tsx` | `/components/training/TrainingLayout.tsx` | Layout wrapper | Yes | No |
| `VideoSidebar.tsx` | `/components/training/VideoSidebar.tsx` | Sidebar nav | Yes | No |
| `DarkModeToggle.tsx` | `/components/DarkModeToggle.tsx` | Toggle button | Yes | No |
| `ProtectedRoute.tsx` | `/components/ProtectedRoute.tsx` | Route guard | Yes | Yes |
| `sidebar.tsx` | `/components/ui/sidebar.tsx` | UI primitives | **No** | N/A |
| `breadcrumb.tsx` | `/components/ui/breadcrumb.tsx` | UI primitives | **No** | N/A |

### 1.2 Complete Navigation Tree

```
TIG Platform Navigation
├── TOP BAR (Navigation.tsx)
│   ├── Logo → homePath (/ or /admin based on mode)
│   ├── Mode Indicator [dual-role only] → toggles view mode
│   ├── "Dashboard" link [desktop only] → /
│   └── User Avatar → UserAvatarDropdown
│
├── USER AVATAR DROPDOWN (UserAvatarDropdown.tsx)
│   ├── User Info Header
│   │   ├── Full Name
│   │   ├── Email
│   │   └── Role Badge
│   │
│   ├── View Mode Switcher [dual-role only]
│   │   ├── "Agent" button → switches to agent mode
│   │   └── "Admin" button → switches to admin mode
│   │
│   ├── AGENT SECTION
│   │   ├── My Profile (User icon) → /my-profile
│   │   ├── Certifications (FileText icon) → /contracting-hub
│   │   └── BOSS CRM (ExternalLink icon) → https://fmo.kizen.com/login
│   │
│   ├── ADMIN SECTION [admin mode or single-role admin]
│   │   ├── Admin Dashboard (Shield icon) → /admin
│   │   ├── Outlook (Mail icon) → OAuth flow [admin only]
│   │   ├── Create Admin (UserPlus icon) → Opens dialog [super_admin only]
│   │   ├── Activity Log (Activity icon) → /admin/activity-log [super_admin only]
│   │   └── Labs (Sparkles icon) → /admin/labs [super_admin only]
│   │
│   ├── SETTINGS SECTION
│   │   └── Dark Mode (Moon icon) → Toggle switch
│   │
│   └── Sign Out (LogOut icon) → Logout action
│
├── MOBILE MENU (Navigation.tsx - hamburger)
│   ├── Dashboard → /
│   ├── Separator
│   ├── My Profile (User icon) → /my-profile
│   ├── Carrier Status (FileText icon) → /contracting-hub
│   ├── Admin Dashboard (Shield icon) → /admin [if canAccessAdmin]
│   ├── Separator
│   ├── Dark Mode Toggle
│   └── Log Out (LogOut icon)
│
├── AGENT DASHBOARD (Index.tsx) - Card-based navigation
│   ├── Carrier Resources (Building2 icon) → /carrier-resources
│   ├── Forms Library (FileText icon) → /forms-library
│   ├── Quick Quote Section
│   │   ├── SunFire → https://www.sunfirematrix.com/app/agent/pfs
│   │   └── Connect4Insurance → https://pinnacle7.destinationrx.com/...
│   └── Your Business Section
│       ├── Certifications (ClipboardList icon) → /contracting-hub
│       ├── Training (GraduationCap icon) → /training
│       └── My Profile (User icon) → /my-profile
│
├── ADMIN DASHBOARD (AdminDashboard.tsx) - Card-based navigation
│   ├── Search bar (agent lookup)
│   ├── All Agents (ClipboardList icon) → /admin/agents
│   ├── Contracting (FileText icon) → /admin/contracting
│   ├── New Agent (Plus icon) → /admin/agents/new
│   └── RTS Import (Upload icon) → /admin/rts-import
│
└── TRAINING SIDEBAR (VideoSidebar.tsx)
    ├── Module groups with section headers
    ├── Video list with completion indicators
    └── Progress bar footer
```

### 1.3 All Routes with Access Requirements

| Route | Page | Access | Nav Location |
|-------|------|--------|--------------|
| `/` | Index (Agent Dashboard) | Authenticated | Top bar logo |
| `/auth` | AuthPage | Public | Top bar (if not logged in) |
| `/auth/set-password` | SetPasswordPage | Public | Email link |
| `/auth/forgot-password` | ForgotPasswordPage | Public | Auth page |
| `/contracting` | ContractingPage | Agent + CONTRACTING_REQUIRED | Redirect only |
| `/my-profile` | MyProfilePage | Authenticated | Avatar dropdown, Dashboard |
| `/contracting-hub` | ContractingHubPage | Authenticated | Avatar dropdown, Dashboard |
| `/carrier-resources` | CarrierResourcesPage | Authenticated | Dashboard card |
| `/carrier-resources/plans` | CarrierPlansPage | Authenticated | Carrier Resources page |
| `/forms-library` | FormsLibraryPage | Authenticated | Dashboard card |
| `/training` | TrainingPage | Authenticated | Dashboard card |
| `/training/:videoId` | TrainingPage | Authenticated | Training sidebar |
| `/book-of-business` | BookOfBusinessPage | Authenticated | **Not in nav** |
| `/book-of-business/t65-review` | T65ReviewPage | Authenticated | Book of Business page |
| `/start-here` | StartHerePage | Authenticated | **Not in nav** |
| `/industry-updates` | IndustryUpdatesPage | Authenticated | **Not in nav** |
| `/compliance` | CompliancePage | Authenticated | **Not in nav** |
| `/agent-tools` | AgentToolsPage | Authenticated | **Not in nav** |
| `/carrier-portals` | CarrierPortalsPage | Authenticated | **Not in nav** |
| `/admin` | AdminDashboard | Admin | Avatar dropdown |
| `/admin/agents` | AgentsPage | Admin | Admin Dashboard |
| `/admin/agents/new` | NewAgentPage | Admin | Admin Dashboard |
| `/admin/agents/:profileId` | AgentProfilePage | Admin | Search/list click |
| `/admin/agents/book` | AgentsBookPage | Admin | **Not in nav** |
| `/admin/agents/:agentId/book` | AgentBookDetailPage | Admin | AgentsBookPage |
| `/admin/users/:userId` | UserDetailPage | Admin | **Not in nav** |
| `/admin/contracting` | ContractingQueuePage | Admin | Admin Dashboard |
| `/admin/rts-import` | RTSImportPage | Admin | Admin Dashboard |
| `/admin/roadmaps` | RoadmapGeneratorPage | Admin | **Not in nav** |
| `/admin/documents` | DocumentManagementPage | Admin | **Not in nav** |
| `/admin/activity-log` | ActivityLogPage | Super Admin | Avatar dropdown |
| `/admin/labs` | LabsPage | Super Admin | Avatar dropdown |
| `/admin/pdf-builder` | PdfBuilderPage | Super Admin | **Not in nav** |

### 1.4 Hidden/Orphaned Routes

The following routes exist but are not accessible via navigation:

1. **`/book-of-business`** - Premium feature, no entry point
2. **`/start-here`** - Onboarding page, no current link
3. **`/industry-updates`** - Placeholder page (documented as known issue)
4. **`/compliance`** - No navigation link
5. **`/agent-tools`** - No navigation link
6. **`/carrier-portals`** - No navigation link
7. **`/admin/roadmaps`** - No navigation link
8. **`/admin/documents`** - No navigation link
9. **`/admin/pdf-builder`** - Super admin only, no navigation link
10. **`/admin/agents/book`** - Book of Business admin view, no entry point

---

## Section 2: Role Matrix

### 2.1 Role Definitions

| Role | Code | Hierarchy | Description |
|------|------|-----------|-------------|
| Super Admin | `super_admin` | 1 (Highest) | Full platform access |
| Admin | `admin` | 2 | Agent management, contracting |
| Manager | `manager` | 3 | Team visibility, agent features |
| TIG Agent | `internal_tig_agent` | 4 | Internal agent with agent features |
| Independent Agent | `independent_agent` | 5 (Lowest) | External agent, basic features |

### 2.2 Role-Based Navigation Visibility

| Navigation Item | Super Admin | Admin | Manager | TIG Agent | Ind. Agent |
|-----------------|:-----------:|:-----:|:-------:|:---------:|:----------:|
| **TOP BAR** |
| Dashboard link | Yes | Yes | Yes | Yes | Yes |
| Mode indicator (dual-role) | Yes | If agent | No | No | No |
| **AVATAR DROPDOWN - AGENT** |
| My Profile | Yes | Yes | Yes | Yes | Yes |
| Certifications | Yes | Yes | Yes | Yes | Yes |
| BOSS CRM (external) | Yes | Yes | Yes | Yes | Yes |
| **AVATAR DROPDOWN - ADMIN** |
| Admin Dashboard | Yes | Yes | No | No | No |
| Outlook Integration | Yes | Yes | No | No | No |
| Create Admin | Yes | No | No | No | No |
| Activity Log | Yes | No | No | No | No |
| Labs | Yes | No | No | No | No |
| **SETTINGS** |
| Dark Mode | Yes | Yes | Yes | Yes | Yes |
| Sign Out | Yes | Yes | Yes | Yes | Yes |
| **MOBILE MENU** |
| Admin Dashboard | Yes | Yes | No | No | No |
| **DASHBOARDS** |
| Agent Dashboard | Yes | Yes | Yes | Yes | Yes |
| Admin Dashboard | Yes | Yes | No | No | No |

### 2.3 Role-Based Route Access

| Route Pattern | Super Admin | Admin | Manager | TIG Agent | Ind. Agent |
|---------------|:-----------:|:-----:|:-------:|:---------:|:----------:|
| `/` | Yes | Yes | Yes | Yes | Yes |
| `/admin/*` | Yes | Yes | No | No | No |
| `/admin/activity-log` | Yes | No | No | No | No |
| `/admin/labs` | Yes | No | No | No | No |
| `/admin/pdf-builder` | Yes | No | No | No | No |
| `/contracting` | If agent | If agent | No | If needed | If needed |
| `/my-profile` | Yes | Yes | Yes | Yes | Yes |
| `/training` | Yes | Yes | Yes | Yes | Yes |
| `/carrier-resources` | Yes | Yes | Yes | Yes | Yes |

### 2.4 Dual-Role Behavior

```
Dual-role users (super_admin OR admin+agent):
├── View Mode stored in localStorage
├── Mode switcher visible in header + dropdown
├── Admin routes blocked when in "Agent" view
├── homePath changes based on mode:
│   ├── Admin mode → /admin
│   └── Agent mode → /
└── Toast notification when switching modes
```

---

## Section 3: Visual Audit Findings

### 3.1 Header Measurements

| Property | Navigation.tsx | AdminLayout | TrainingLayout | Index.tsx |
|----------|---------------|-------------|----------------|-----------|
| Height | `h-20` (80px) | `py-3` (~56px) | `h-14` (56px) | `py-4` (~56px) |
| Position | `fixed top-0` | `sticky top-0` | `sticky top-0` | `sticky top-0` |
| Z-index | `z-50` | `z-40` | `z-20` | `z-50` |
| Background | `bg-background/95` | `bg-white/80` | `bg-white/80` | `bg-white/80` |
| Blur | `backdrop-blur-sm` | `backdrop-blur-sm` | `backdrop-blur-sm` | `backdrop-blur-sm` |
| Border | `border-b border-border` | `border-b border-[#e8e4dd]` | `border-b border-[#e8e4dd]` | `border-b border-[#e8e4dd]` |
| Padding | `px-6 md:px-12` | `px-6` | `px-6` | `px-6` |
| Max width | `container-narrow` | `max-w-6xl` | `max-w-7xl` | `max-w-5xl` |

**Issue: Inconsistent header heights (80px vs 56px) and z-index values**

### 3.2 Color Tokens Used in Navigation

| Element | Light Mode | Dark Mode | Design System |
|---------|-----------|-----------|---------------|
| Header BG | `bg-background/95` → rgba(255,255,255,0.95) | `bg-black/90` | Correct |
| Header border | `border-border` → #e8e4dd | `#38383A` | Correct |
| Logo text | `text-[#292524]` | `text-white` | Correct (foreground) |
| Secondary text | `text-[#5c5552]` | `#8E8E93` | Correct (muted-foreground) |
| Nav links | `text-muted-foreground` | `#8E8E93` | Correct |
| Nav link hover | `hover:text-gold` | Not specified | **VIOLATION** |
| Primary action | `text-primary` → blue | `#0A84FF` | Correct |
| Avatar BG | `bg-[#b8860b]` → gold | Same | Correct (brand for avatars) |
| Mode pill (admin) | `bg-purple-100 text-purple-700` | Purple tints | Correct |
| Mode pill (agent) | `bg-green-100 text-green-700` | Green tints | Correct |

### 3.3 Icon Audit

| Icon | Source | Size | Weight | Location |
|------|--------|------|--------|----------|
| Menu | lucide-react | 24px | Default (1.5px stroke) | Mobile hamburger |
| X | lucide-react | 24px | Default | Mobile close |
| LogIn | lucide-react | 14px | Default | Login link |
| LogOut | lucide-react | 16px | Default | Mobile logout, dropdown |
| User | lucide-react | 16px (mobile), 4px (dropdown) | Default | Profile links |
| FileText | lucide-react | 16px (mobile), 4px (dropdown) | Default | Certifications |
| Shield | lucide-react | 16px (mobile), 4px (dropdown) | Default | Admin link |
| Moon | lucide-react | 4px | Default | Dark mode toggle |
| ArrowLeftRight | lucide-react | 4px | Default | Mode switcher |
| ExternalLink | lucide-react | 3px | Default | External links |
| ChevronRight | lucide-react | 4px | Default | Sub-menu indicators |
| ArrowLeft | lucide-react | 4px | Default | Back buttons |
| Building2 | lucide-react | 5px | Default | Carrier Resources |
| GraduationCap | lucide-react | 4px | Default | Training |
| ClipboardList | lucide-react | 4px-5px | Default | Certifications, Agents |
| Upload | lucide-react | 5px | Default | RTS Import |
| Plus | lucide-react | 5px | Default | New Agent |
| Search | lucide-react | 5px | Default | Admin search |

**Observation:** Icons are all outline style, consistent weight, but sizing varies (3px to 5px)

### 3.4 Typography in Navigation

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Logo "TIG" | Serif (Playfair Display) | `text-lg` (18px) / `text-xl` (20px) | `font-semibold` (600) | Tight |
| Logo divider | Sans | - | - | - |
| Logo "Agent Portal" | Sans (Inter) | `text-sm` (14px) | Normal (400) | Normal |
| Desktop nav links | Sans | `text-[13px]` | `font-medium` (500) | `tracking-wide` |
| Mobile nav links | Sans | `text-base` (16px) | `font-medium` (500) | `tracking-wide` |
| Dropdown section label | Sans | `text-xs` (12px) | `font-medium` (500) | `uppercase tracking-wider` |
| Dropdown menu items | Sans | `text-sm` (14px) | Normal (400) | Normal |
| Mode pill | Sans | `text-xs` (12px) | `font-medium` (500) | Normal |
| Back links | Sans | `text-sm` (14px) | Normal (400) | Normal |

### 3.5 Spacing Analysis

| Element | Padding | Gap | Margin |
|---------|---------|-----|--------|
| Header container | `px-6 md:px-12` | - | - |
| Header inner | - | `gap-6` | - |
| Logo + mode indicator | - | `gap-3` | - |
| Mode pill | `px-2 py-1` | `gap-1.5` | - |
| Mode pill dot | - | - | - |
| Avatar button | - | - | - |
| Dropdown content | `p-1` | - | - |
| Dropdown user header | `px-3 py-3` | - | - |
| Dropdown section label | `px-2 py-1.5` | - | - |
| Dropdown menu item | `px-2 py-1.5` | `gap-2` (icon) | - |
| Mobile menu | `py-6` | `gap-1` | - |
| Mobile menu separator | - | - | `my-2` |
| Back button | - | `gap-1` | - |

### 3.6 Touch Target Analysis

| Element | Size | Minimum (WCAG) | Assessment |
|---------|------|----------------|------------|
| Avatar button | 36x36px (`w-9 h-9`) | 44x44px | **Too small for 45-65 demo** |
| Mode pill | ~80x28px | 44x44px | Width OK, height too small |
| Mobile hamburger | ~40x40px (`p-2` + 24px icon) | 44x44px | Borderline |
| Mobile nav links | Full width x 40px (`py-2`) | 44x44px | Height borderline |
| Dropdown items | Full width x 36px (`py-1.5`) | 44x44px | **Too small** |

### 3.7 Transition & Animation

| Element | Transition | Duration | Easing |
|---------|-----------|----------|--------|
| Nav link hover | `transition-smooth` | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Avatar opacity | `transition-opacity` | Default (150ms) | Default (ease-in-out) |
| Mode pill | `transition-colors` | Default | Default |
| Dropdown enter | `animate-in` | Default | Default |
| Dropdown exit | `animate-out` | Default | Default |
| Dropdown slide | `slide-in-from-top-2` | Default | Default |
| Dropdown zoom | `zoom-in-95` | Default | Default |
| Mobile menu | `animate-fade-in` | 600ms | ease-out |

---

## Section 4: Responsive Behavior Documentation

### 4.1 Breakpoints Used

| Breakpoint | Tailwind | Pixels | Usage |
|------------|----------|--------|-------|
| Default | - | 0-639px | Mobile |
| sm | `sm:` | 640px+ | Limited use |
| md | `md:` | 768px+ | Tablet adjustments |
| lg | `lg:` | 1024px+ | Desktop navigation |
| xl | `xl:` | 1280px+ | Not used in nav |
| 2xl | `2xl:` | 1536px+ | Not used in nav |

### 4.2 Navigation Transformation

```
MOBILE (< 1024px):
┌─────────────────────────────────────────────┐
│ [Logo + Mode]                    [☰] [🔴]   │
└─────────────────────────────────────────────┘
                     ↓ Hamburger opens
┌─────────────────────────────────────────────┐
│ [Logo + Mode]                    [X] [🔴]   │
├─────────────────────────────────────────────┤
│ Dashboard                                    │
│ ─────────────────────────────────────────── │
│ 👤 My Profile                               │
│ 📄 Carrier Status                           │
│ 🛡️ Admin Dashboard (if admin)              │
│ ─────────────────────────────────────────── │
│ 🌙 Dark Mode                                │
│ ─────────────────────────────────────────── │
│ 🚪 Log Out                                  │
└─────────────────────────────────────────────┘

DESKTOP (≥ 1024px):
┌─────────────────────────────────────────────────────────────┐
│ [Logo + Mode]              [Dashboard]           [🔴 Avatar] │
└─────────────────────────────────────────────────────────────┘
                                                       ↓ Click
                                  ┌────────────────────────────┐
                                  │ Name                       │
                                  │ email@example.com          │
                                  │ [Role Badge]               │
                                  ├────────────────────────────┤
                                  │ [Agent/Admin Toggle]       │
                                  ├────────────────────────────┤
                                  │ AGENT                      │
                                  │ 👤 My Profile              │
                                  │ 📄 Certifications          │
                                  │ 🔗 BOSS CRM ↗              │
                                  ├────────────────────────────┤
                                  │ ADMIN                      │
                                  │ 🛡️ Admin Dashboard        │
                                  │ 📧 Outlook                 │
                                  │ ... more items             │
                                  ├────────────────────────────┤
                                  │ 🌙 Dark Mode [Switch]      │
                                  ├────────────────────────────┤
                                  │ 🚪 Sign Out                │
                                  └────────────────────────────┘
```

### 4.3 Mobile-Specific Components

1. **Hamburger Menu** (`Navigation.tsx`)
   - Trigger: `button.lg:hidden` with Menu/X icons
   - Content: Slide-down panel with `animate-fade-in`
   - Closes: On link click or X button

2. **Training Sidebar** (`VideoSidebar.tsx`)
   - Desktop: Sticky sidebar (`hidden lg:block`)
   - Mobile: Fixed overlay with backdrop
   - Trigger: Floating `MobileMenuButton` at `top-20 left-4`

### 4.4 Issues with Responsive Behavior

1. **No bottom navigation** - Mobile relies on hamburger menu (extra tap)
2. **Avatar dropdown same on mobile** - Small touch targets remain
3. **Mode switcher not visible on mobile** - Only in hamburger menu
4. **Dashboard cards stack vertically** - Good, but long scroll
5. **Training sidebar overlay** - Good pattern, could apply to main nav

---

## Section 5: Design System Compliance Report

### 5.1 Color Usage Audit

| Rule | Compliant | Details |
|------|:---------:|---------|
| Blue for interactive elements | Partial | Links use blue, but nav hover uses gold |
| Gold for avatars only | **No** | `hover:text-gold` on nav links |
| Green for success | Yes | Completion indicators, agent mode |
| Amber for warning | Yes | AHIP alert, pending status |
| Red for destructive | Yes | Sign out styling |
| Gray for neutral | Yes | Secondary text uses muted-foreground |

### 5.2 Spacing Consistency

| Pattern | Expected | Actual | Compliant |
|---------|----------|--------|:---------:|
| Card headers | `px-5 py-4` | Varies | Partial |
| List rows | `px-5 py-3` | Varies | Partial |
| Icon + label gap | `gap-3` (12px) | `gap-2` (8px) in dropdown | **No** |
| Meta items gap | `gap-5` (20px) | N/A | N/A |
| Nav items gap | - | `gap-6` (24px) | Custom |

### 5.3 Typography Consistency

| Element | Expected | Actual | Compliant |
|---------|----------|--------|:---------:|
| Page title | `text-xl font-semibold` | `text-lg font-semibold` (TIG) | Close |
| Section labels | `text-xs uppercase tracking-wide` | `text-xs uppercase tracking-wider` | Yes |
| Body text | `text-sm text-foreground` | `text-sm` | Yes |
| Secondary text | `text-sm text-muted-foreground` | `text-[#5c5552]` (hardcoded) | Partial |

### 5.4 Card Pattern Compliance

The navigation doesn't use cards, but dashboard navigation cards:

| Pattern | Expected | Actual | Compliant |
|---------|----------|--------|:---------:|
| Card border-radius | `rounded-xl` | `rounded-xl` | Yes |
| Card shadow | `shadow-sm` | `shadow-md` on hover | Yes |
| Card border | `border-border/50` | `border-[#e8e4dd]` | Close |
| Card hover | `hover:border-primary/30` | `hover:border-blue-200` | Close |

### 5.5 Animation Compliance

| Guideline | Expected | Actual | Compliant |
|-----------|----------|--------|:---------:|
| Standard transition | `transition-colors` | `transition-smooth` (300ms) | Yes |
| Hover reveals | `opacity-0 → 100` | Not used in nav | N/A |
| Loading states | `animate-spin` | `animate-spin` on Loader2 | Yes |
| No bouncing | No bounce | No bounce | Yes |
| No delay | No user delay | Fade-in animations | **Borderline** |

---

## Section 6: Information Architecture Assessment

### 6.1 Current Grouping Logic

```
Agent Experience:
├── PRIMARY (Dashboard Cards)
│   ├── Carrier Resources (most important workflow)
│   ├── Forms Library
│   ├── Quick Quote (external tools)
│   └── Your Business
│       ├── Certifications
│       ├── Training
│       └── My Profile
│
└── SECONDARY (Avatar Dropdown)
    ├── Profile links (duplicated from dashboard)
    ├── Admin access (if applicable)
    └── Settings

Admin Experience:
├── PRIMARY (Dashboard Cards)
│   ├── Search (agent lookup)
│   ├── All Agents
│   ├── Contracting
│   ├── New Agent
│   └── RTS Import
│
└── SECONDARY (Avatar Dropdown)
    ├── Admin-specific tools
    ├── Super admin features
    └── Settings
```

### 6.2 Cognitive Load Assessment

| Metric | Value | Assessment |
|--------|-------|------------|
| Top-level items (agent) | 1 (Dashboard) | **Too few** - everything hidden |
| Top-level items (admin) | 1 (Dashboard) | **Too few** - everything hidden |
| Avatar dropdown items | 6-12 items | **Too many** - cognitive overload |
| Dashboard cards (agent) | 6 cards | Acceptable |
| Dashboard cards (admin) | 4 cards + search | Good |
| Nested levels | 2 max | Good |
| Hidden routes | 10+ pages | **Poor discoverability** |

### 6.3 Naming Clarity Analysis

| Label | Clear? | Issue | Recommendation |
|-------|:------:|-------|----------------|
| "Dashboard" | Yes | Generic | Could be "Home" |
| "My Profile" | Yes | - | - |
| "Certifications" | Partial | Users may not know what this means | "Ready to Sell Status" |
| "BOSS CRM" | No | External tool jargon | "Client CRM" or remove |
| "Carrier Resources" | Yes | - | - |
| "Forms Library" | Yes | - | - |
| "RTS Import" | No | Internal jargon | "Import Certifications" |
| "Labs" | Ambiguous | Experimental features | "Beta Features" |
| "Activity Log" | Yes | - | - |

### 6.4 Discoverability Analysis

**Time to find key features:**

| Task | Current Path | Taps | Assessment |
|------|--------------|:----:|------------|
| View certifications | Dashboard → Certifications card | 1 | Good |
| Access training | Dashboard → Training card | 1 | Good |
| Update profile | Avatar → My Profile | 2 | OK |
| View carrier contacts | Dashboard → Carrier Resources → carrier | 2-3 | OK |
| Access admin (dual-role) | Avatar → Admin Dashboard | 2 | OK |
| Access admin (dual-role, agent mode) | Avatar → Switch mode → Admin | 3+ | **Poor** |
| Find book of business | **Not in nav** | ??? | **Broken** |
| Find compliance forms | **Not in nav** | ??? | **Broken** |
| Toggle dark mode | Avatar → scroll → toggle | 3+ | **Poor** |

### 6.5 Usage Frequency vs. Position

| Feature | Expected Frequency | Current Position | Match? |
|---------|-------------------|------------------|:------:|
| Carrier Resources | Daily | Dashboard hero card | Yes |
| Forms Library | Daily | Dashboard secondary | Yes |
| Quick Quote | Daily | Dashboard | Yes |
| Certifications | Weekly | Dashboard + dropdown | Yes |
| Training | Weekly | Dashboard small card | OK |
| Profile | Monthly | Dropdown | Yes |
| Admin Dashboard | Daily (admins) | Dropdown | **No** |
| Dark Mode | Rarely | Bottom of dropdown | Yes |
| Logout | Rarely | Bottom of dropdown | Yes |

---

## Section 7: Apple Principles Scorecard

### 7.1 Clarity

> "Text is legible at every size, icons are precise and lucid, adornments are subtle and appropriate, and a sharpened focus on functionality motivates the design."

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Text legibility | 4/5 | Good size hierarchy, some hardcoded colors |
| Icon clarity | 3/5 | Consistent style, but don't communicate without labels |
| Minimal adornment | 4/5 | Clean, but mode pill adds visual noise |
| Functional focus | 3/5 | Dashboard cards are clear, but dropdown is overloaded |

**Overall Clarity: 3.5/5**

### 7.2 Deference

> "Fluid motion and a crisp, beautiful interface help people understand and interact with content while never competing with it."

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Content priority | 2/5 | Top bar takes 80px, lots of chrome |
| Visual quietness | 3/5 | Mode indicator always visible, can be noisy |
| Depth appropriateness | 4/5 | Good use of blur, shadows are subtle |
| Motion restraint | 4/5 | No bouncing, subtle fade-ins |

**Overall Deference: 3.25/5**

### 7.3 Depth

> "Visual layers and realistic motion convey hierarchy, impart vitality, and facilitate understanding."

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Clear hierarchy | 3/5 | Flat structure, relies on color not depth |
| Meaningful transitions | 3/5 | Basic fade/slide, nothing special |
| Tangible navigation | 2/5 | No breadcrumbs, easy to get lost |
| Location awareness | 2/5 | Active state only in sidebar, not main nav |

**Overall Depth: 2.5/5**

### 7.4 Overall Apple Design Principles Score

| Principle | Score |
|-----------|:-----:|
| Clarity | 3.5/5 |
| Deference | 3.25/5 |
| Depth | 2.5/5 |
| **Overall** | **3.1/5** |

**Verdict:** The navigation is functional but not exceptional. It lacks the polish and intentionality that Apple design is known for. Key gaps are in location awareness, content hierarchy, and touch target sizing for the target demographic.

---

## Section 8: Prioritized Issue List

### 8.1 Critical Issues

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| C1 | **Touch targets too small for 45-65 demo** | Users may mis-tap, frustration | Avatar (36x36), dropdown items (36px) |
| C2 | **10+ orphaned routes with no navigation** | Features undiscoverable | `/book-of-business`, `/compliance`, etc. |
| C3 | **Inconsistent header heights** | Visual jank when navigating | 80px vs 56px across pages |
| C4 | **No location indicator in top bar** | Users don't know where they are | All pages except training |

### 8.2 Major Issues

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| M1 | Gold used for interactive hover, not just avatars | Design system violation | `hover:text-gold` in nav links |
| M2 | Avatar dropdown has 12+ items | Cognitive overload | `UserAvatarDropdown.tsx` |
| M3 | Admin dashboard requires 2+ taps for dual-role | Friction for key users | Avatar → Admin Dashboard |
| M4 | No breadcrumbs despite component existing | Lost context on deep pages | All admin detail pages |
| M5 | Mobile hamburger hides all navigation | Extra tap for everything | Mobile breakpoint |
| M6 | Mode switcher adds complexity | Confusing for some users | Header + dropdown |
| M7 | Hardcoded colors instead of design tokens | Maintenance burden | `#292524`, `#5c5552`, `#e8e4dd` |
| M8 | Multiple layouts with slightly different headers | Inconsistent experience | Navigation, AdminLayout, TrainingLayout, Index |

### 8.3 Minor Issues

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| m1 | Icon sizes vary (3px to 5px) | Subtle inconsistency | Throughout nav |
| m2 | Section labels duplicated in dropdown | Redundant | "AGENT", "ADMIN" headers |
| m3 | "BOSS CRM" is jargon | Unclear for new users | Avatar dropdown |
| m4 | "RTS Import" is internal jargon | Unclear purpose | Admin dashboard |
| m5 | Dropdown animations slightly slow | Perceptible delay | `animate-in` |
| m6 | Logo not centered on mobile | Minor alignment issue | Mobile header |
| m7 | Dark mode toggle buried in menu | Hard to find | Avatar dropdown |
| m8 | Back button text hardcoded to "Dashboard" | Incorrect on some pages | AdminLayout |

### 8.4 Enhancement Opportunities

| # | Enhancement | Benefit | Complexity |
|---|-------------|---------|:----------:|
| E1 | Add persistent sidebar on desktop | Faster navigation, visible options | Medium |
| E2 | Add command palette (Cmd+K) | Power user efficiency | Medium |
| E3 | Add bottom navigation on mobile | Thumb-friendly, always visible | Low |
| E4 | Add contextual breadcrumbs | Location awareness | Low |
| E5 | Add search to main nav | Quick access to any page | Medium |
| E6 | Add recent pages section | Quick navigation patterns | Low |
| E7 | Add keyboard shortcuts | Power user efficiency | Low |
| E8 | Add onboarding tooltips | Discoverability | Medium |

---

## Section 9: Three Restructuring Proposals

### 9.1 Option A: Refinement

**Philosophy:** Keep current structure, fix inconsistencies, polish interactions.

**Minimal engineering lift. Ship in 1-2 sprints.**

#### Changes

1. **Standardize header height to 64px across all layouts**
   - Reduces 80px Navigation.tsx to match others
   - Update AdminLayout, TrainingLayout, Index.tsx

2. **Increase all touch targets to 44px minimum**
   ```tsx
   // Avatar: w-11 h-11 (44px)
   // Dropdown items: py-2.5 (40px + padding = 44px+)
   // Mobile menu items: py-3 (48px)
   ```

3. **Fix color system violations**
   - Replace `hover:text-gold` with `hover:text-primary`
   - Replace hardcoded colors with design tokens

4. **Add active state to top bar navigation**
   ```tsx
   // Add blue underline or background for current page
   className={cn(
     "text-sm font-medium transition-colors",
     isActive
       ? "text-primary border-b-2 border-primary"
       : "text-muted-foreground hover:text-primary"
   )}
   ```

5. **Add breadcrumbs to admin detail pages**
   ```
   Admin / Agents / John Smith
   Admin / Contracting / Application #123
   ```

6. **Reduce dropdown complexity**
   - Remove duplicate links (My Profile, Certifications)
   - Group admin items under a sub-menu

7. **Add missing routes to navigation**
   - Add "Book of Business" to agent dashboard
   - Add "Compliance" to Forms section
   - Add hidden admin tools to Labs dropdown

#### Proposed Navigation Tree (Option A)

```
Desktop:
┌──────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Resources  Training  [Search] [Avatar]│
└──────────────────────────────────────────────────────────┘
         ↑ Active underline

Mobile:
┌───────────────────────────┐
│ [Logo]        [Search] [☰]│
└───────────────────────────┘
         +
┌───────────────────────────┐
│ [Home] [Resources] [Train] [Profile] │  ← Bottom nav
└───────────────────────────┘
```

#### Avatar Dropdown (Simplified)

```
┌─────────────────────────┐
│ Name                    │
│ email@example.com       │
├─────────────────────────┤
│ [Mode Toggle]           │  ← Only for dual-role
├─────────────────────────┤
│ 👤 My Profile           │
│ 🔔 Notifications        │
│ ⚙️ Settings      →      │  ← Sub-menu for admin stuff
├─────────────────────────┤
│ 🚪 Sign Out             │
└─────────────────────────┘
```

---

### 9.2 Option B: Reorganization

**Philosophy:** Restructure information architecture by user mental model.

**Medium engineering lift. Ship in 2-3 sprints.**

#### New Information Architecture

```
AGENT MENTAL MODEL:
├── SELL (what I need to close deals)
│   ├── Quick Quote (SunFire, Connect4)
│   ├── Carrier Info (contacts, portals, plans)
│   └── Forms (SOA, enrollment)
│
├── TRACK (my business status)
│   ├── Book of Business
│   ├── Certifications
│   └── Milestones
│
├── LEARN (improve skills)
│   ├── Training Videos
│   ├── Industry Updates
│   └── Compliance Guides
│
└── ACCOUNT (manage myself)
    ├── My Profile
    └── Settings

ADMIN MENTAL MODEL:
├── MANAGE (agent operations)
│   ├── Agent Roster
│   ├── Contracting Queue
│   └── Book of Business (all agents)
│
├── TOOLS (administrative tasks)
│   ├── RTS Import
│   ├── Document Management
│   └── Roadmap Generator
│
└── SYSTEM (platform settings)
    ├── Activity Log
    ├── Labs
    └── Admin Settings
```

#### Proposed Navigation Tree (Option B)

```
Desktop (Agent):
┌─────────────────────────────────────────────────────────────┐
│ [Logo]                                                      │
│                                                             │
│ ┌─────────────┐                                    [Avatar] │
│ │ SELL        │                                             │
│ │ • Quick Quote                                             │
│ │ • Carriers                                                │
│ │ • Forms                                                   │
│ │             │                                             │
│ │ TRACK       │                                             │
│ │ • My Book                                                 │
│ │ • Certifications                                          │
│ │             │                                             │
│ │ LEARN       │                                             │
│ │ • Training                                                │
│ │ • Updates                                                 │
│ └─────────────┘                                             │
│                                                             │
│ [Main Content Area]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Desktop (Admin):
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Admin/Agent Mode]                          [Avatar] │
│                                                             │
│ ┌─────────────┐                                             │
│ │ [Search]    │                                             │
│ │             │                                             │
│ │ MANAGE      │                                             │
│ │ • Agents                                                  │
│ │ • Contracting                                             │
│ │ • Book of Business                                        │
│ │             │                                             │
│ │ TOOLS       │                                             │
│ │ • RTS Import                                              │
│ │ • Documents                                               │
│ │ • Roadmaps                                                │
│ │             │                                             │
│ │ SYSTEM      │  ← Super admin only                         │
│ │ • Activity Log                                            │
│ │ • Labs                                                    │
│ └─────────────┘                                             │
│                                                             │
│ [Main Content Area]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile (Both Roles)

```
┌───────────────────────────┐
│ [☰] [Logo]       [Avatar] │
└───────────────────────────┘

Bottom Tab Bar:
┌────────────────────────────────┐
│ [Home] [Sell] [Track] [Learn]  │
└────────────────────────────────┘
```

#### Technical Changes

1. Create new `Sidebar.tsx` component using existing UI primitives
2. Create bottom tab bar component for mobile
3. Consolidate layouts into single `AppLayout.tsx`
4. Update route structure to match new IA
5. Add keyboard navigation (arrow keys in sidebar)

---

### 9.3 Option C: Reimagination

**Philosophy:** If Apple designed this for Medicare agents. Radically simplified, progressive disclosure, contextual.

**Significant engineering lift. Ship in 3-5 sprints.**

#### Core Principles

1. **One tap to anywhere** - Flat hierarchy, no nesting
2. **Context over chrome** - Nav disappears when working, appears when needed
3. **Spotlight-first** - Cmd+K opens everything
4. **Progressive disclosure** - Simple by default, power when needed
5. **Accessibility-first** - Large targets, high contrast, keyboard navigable

#### Navigation Model

```
THE WHOLE INTERFACE:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Welcome, John]                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🔍  What do you need?  (Cmd+K)                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │         │  │         │  │         │  │         │       │
│   │  Quote  │  │ Carriers│  │ My Book │  │Training │       │
│   │         │  │         │  │         │  │         │       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│   ────────────────────────────────────────────────────────  │
│                                                             │
│   📋 Recent                                                 │
│   • Aetna Medicare - opened 2 min ago                       │
│   • SOA Form - opened yesterday                             │
│   • Training: Enrollment Tips - 50% complete                │
│                                                             │
│   🔔 Alerts                                                 │
│   • AHIP 2026 certification required                        │
│   • 3 clients turning 65 next month                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SPOTLIGHT (Cmd+K):

┌─────────────────────────────────────────────────────────────┐
│   🔍  [___________________________]                         │
│                                                             │
│   PAGES                                                     │
│   📊 Book of Business                                       │
│   📄 Certifications                                         │
│   📚 Training Library                                       │
│   🏢 Carrier Resources                                      │
│                                                             │
│   ACTIONS                                                   │
│   ➕ Create new quote                                       │
│   📎 Upload document                                        │
│   🌙 Toggle dark mode                                       │
│                                                             │
│   CARRIERS                                                  │
│   🔵 Aetna                                                  │
│   🟢 Humana                                                 │
│   🟡 UnitedHealthcare                                       │
│                                                             │
│   FORMS                                                     │
│   📝 Scope of Appointment                                   │
│   📝 Enrollment Form                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

DETAIL PAGE (e.g., Carrier Resources > Aetna):

┌─────────────────────────────────────────────────────────────┐
│   ← Back                              [🔍] [Settings]       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │   🔵  Aetna Medicare                               │   │
│   │       Ready to Sell ✓                              │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌───────────────────┬───────────────────┐                 │
│   │                   │                   │                 │
│   │  📞 Contacts      │  🌐 Portal        │                 │
│   │                   │                   │                 │
│   ├───────────────────┼───────────────────┤                 │
│   │                   │                   │                 │
│   │  📋 Plans         │  📄 Documents     │                 │
│   │                   │                   │                 │
│   └───────────────────┴───────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Key Components

1. **Spotlight (`/components/Spotlight.tsx`)**
   - Command palette for searching pages, actions, carriers, forms
   - Opens with Cmd+K or clicking search
   - Fuzzy search with keyboard navigation
   - Recent items, contextual suggestions

2. **Dock (`/components/Dock.tsx`)**
   - 4-5 primary actions as large touch targets
   - Persists on mobile as bottom bar
   - Hidden on desktop when in focused mode

3. **Context Header (`/components/ContextHeader.tsx`)**
   - Minimal: back button + page actions
   - No persistent nav - relies on Spotlight

4. **Home Dashboard (`/pages/HomeDashboard.tsx`)**
   - Personalized greeting
   - Large search input (hero position)
   - Quick action tiles
   - Recent items
   - Contextual alerts

5. **Recents System**
   - Track recently visited pages
   - Show in Spotlight and dashboard
   - Quick resume of workflows

#### Mobile Experience

```
MOBILE HOME:

┌──────────────────────────┐
│                          │
│   Welcome, John          │
│                          │
│   🔍 What do you need?   │
│                          │
│   ┌──────┐ ┌──────┐      │
│   │Quote │ │Carrier│     │
│   └──────┘ └──────┘      │
│                          │
│   ┌──────┐ ┌──────┐      │
│   │ Book │ │Train │      │
│   └──────┘ └──────┘      │
│                          │
│   ───────────────────    │
│   📋 Recent              │
│   • ...                  │
│                          │
└──────────────────────────┘

┌──────────────────────────┐
│ [🏠] [🔍] [📊] [👤]      │
└──────────────────────────┘

MOBILE DETAIL:

┌──────────────────────────┐
│   ← Back       [Actions] │
│                          │
│   Page content...        │
│                          │
│                          │
│                          │
│                          │
└──────────────────────────┘

┌──────────────────────────┐
│ [🏠] [🔍] [📊] [👤]      │
└──────────────────────────┘
```

#### Animation & Transition Recommendations

1. **Spotlight open**: Scale from center (0.95 → 1.0), fade in (0 → 1), 200ms ease-out
2. **Spotlight close**: Scale down (1.0 → 0.95), fade out (1 → 0), 150ms ease-in
3. **Page transitions**: Subtle horizontal slide (16px), 200ms ease-out
4. **Back navigation**: Reverse horizontal slide
5. **Tile interactions**: Subtle scale (1.0 → 0.98) on press, immediate release

---

## Section 10: Recommended Path Forward

### Recommended: Hybrid Approach (A + B)

Given the target demographic (45-65 year old Medicare agents) and current codebase, I recommend a **phased approach** that combines Option A's quick wins with Option B's improved information architecture.

### Phase 1: Critical Fixes (Week 1-2)

**Goal:** Fix usability blockers without restructuring.

1. **Increase touch targets** (C1)
   - Avatar: 36px → 44px
   - Dropdown items: 36px → 44px
   - Mobile menu items: 40px → 48px

2. **Standardize header heights** (C3)
   - All layouts: 64px fixed height
   - Consistent z-index: 50

3. **Add location indicator** (C4)
   - Blue underline on active top nav item
   - Breadcrumbs on admin detail pages

4. **Fix color violations** (M1)
   - Replace `hover:text-gold` with `hover:text-primary`

### Phase 2: Navigation Cleanup (Week 3-4)

**Goal:** Simplify what exists, add missing links.

1. **Simplify avatar dropdown** (M2)
   - Remove duplicates (profile, certifications in dashboard + dropdown)
   - Group admin items under submenu
   - Maximum 6 visible items

2. **Add orphaned routes** (C2)
   - Add Book of Business to agent dashboard
   - Add Compliance to Forms section
   - Add admin tools to Labs submenu

3. **Replace jargon labels** (m3, m4)
   - "RTS Import" → "Import Certifications"
   - "BOSS CRM" → "Client CRM" or external link indicator

### Phase 3: Structure Improvements (Week 5-8)

**Goal:** Implement Option B's mental model with sidebar.

1. **Create persistent sidebar for desktop**
   - Use existing `sidebar.tsx` primitives
   - Collapsible (icon-only mode)
   - Grouped by Sell/Track/Learn (agent) or Manage/Tools/System (admin)

2. **Create bottom tab bar for mobile**
   - 4 primary destinations
   - Always visible (no hamburger hunting)
   - 60px height, large touch targets

3. **Consolidate layouts**
   - Single `AppLayout.tsx` with slot system
   - Consistent header, sidebar, content areas

4. **Add keyboard navigation**
   - Arrow keys in sidebar
   - Tab focus management
   - Escape to close modals

### Phase 4: Delight (Week 9-10)

**Goal:** Add Option C's Spotlight for power users.

1. **Implement Spotlight (Cmd+K)**
   - Search pages, carriers, forms
   - Quick actions (toggle dark mode, new quote)
   - Recent items

2. **Add recents system**
   - Track recently visited pages
   - Show in dashboard and Spotlight

3. **Polish animations**
   - Consistent 200ms transitions
   - Subtle scale on press
   - Smooth page transitions

---

## Section 11: Technical Implementation Notes

### 11.1 Components to Modify

| Component | Changes | Complexity |
|-----------|---------|:----------:|
| `Navigation.tsx` | Touch targets, active state, height | Low |
| `UserAvatarDropdown.tsx` | Simplify, add submenu | Medium |
| `AdminLayout.tsx` | Standardize header | Low |
| `TrainingLayout.tsx` | Standardize header | Low |
| `Index.tsx` | Add missing links, standardize header | Low |
| `AdminDashboard.tsx` | Standardize header | Low |
| `ProtectedRoute.tsx` | No changes needed | - |

### 11.2 Components to Create

| Component | Purpose | Complexity |
|-----------|---------|:----------:|
| `AppLayout.tsx` | Unified layout wrapper | Medium |
| `AppSidebar.tsx` | Persistent navigation sidebar | Medium |
| `BottomTabBar.tsx` | Mobile bottom navigation | Low |
| `Breadcrumbs.tsx` | Implement existing primitives | Low |
| `Spotlight.tsx` | Command palette | High |
| `RecentPages.tsx` | Track/display recents | Medium |

### 11.3 Files to Update

```
src/
├── components/
│   ├── Navigation.tsx         ← Modify
│   ├── UserAvatarDropdown.tsx ← Modify
│   ├── layout/
│   │   ├── AppLayout.tsx      ← Create
│   │   ├── AppSidebar.tsx     ← Create
│   │   ├── BottomTabBar.tsx   ← Create
│   │   └── AdminLayout.tsx    ← Modify (then deprecate)
│   ├── training/
│   │   └── TrainingLayout.tsx ← Modify (then migrate to AppLayout)
│   └── ui/
│       ├── sidebar.tsx        ← Already exists (use primitives)
│       └── breadcrumb.tsx     ← Already exists (implement)
├── pages/
│   ├── Index.tsx              ← Modify
│   └── admin/
│       └── AdminDashboard.tsx ← Modify
├── hooks/
│   └── useRecentPages.ts      ← Create
└── index.css                  ← Minor color fixes
```

### 11.4 Estimated Complexity by Phase

| Phase | Effort | Files Changed | New Components |
|-------|:------:|:-------------:|:--------------:|
| Phase 1 | Low | 5 | 0 |
| Phase 2 | Low-Medium | 4 | 0 |
| Phase 3 | Medium-High | 8 | 4 |
| Phase 4 | Medium | 3 | 2 |

### 11.5 Testing Considerations

1. **Accessibility testing** - Verify 44px touch targets with device testing
2. **Keyboard navigation** - Tab order, focus management
3. **Role-based testing** - All 5 roles with navigation changes
4. **Responsive testing** - Mobile, tablet, desktop breakpoints
5. **Performance** - Sidebar animations shouldn't block interaction
6. **Dark mode** - All new components need dark mode styles

---

## Appendix A: Reference Screenshots

*[To be added: Current state screenshots of navigation on desktop and mobile]*

## Appendix B: Competitive Analysis

### Apple (iCloud.com / Settings)
- Sidebar with icons + labels
- Current location highlighted with blue background
- No breadcrumbs, but clear section headers
- 44px+ touch targets throughout

### Robinhood
- Bottom tab bar (5 items max)
- Spotlight search (magnifying glass)
- Minimal top chrome
- Large, tappable areas

### Linear
- Collapsible sidebar with keyboard shortcuts
- Command palette (Cmd+K) central to navigation
- Breadcrumbs for nested items
- Subtle animations, fast transitions

### Notion
- Sidebar with hierarchical pages
- Quick find (Cmd+P)
- Favorites/Recent pinned at top
- Collapsible sections

---

*Document generated for TIG Platform navigation audit. Last updated: January 28, 2026*
