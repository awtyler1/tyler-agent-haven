# Golden Hour Migration Audit
## Carrier Resources · Learning Center · Sync Status

**Generated:** 2026-02-06
**Purpose:** Pre-design-sprint analysis for bringing three areas into visual alignment with the Golden Hour dashboard theme.

---

## Golden Hour Design Tokens (Reference)

```
GH = {
  pageBg:        '#F3EDE4'                               // warm cream
  heroBg:        'linear-gradient(145deg, #1a1611, #0f0d09)' // dark hero
  heroGlow:      'rgba(184,134,11,0.08)'                 // gold glow overlay
  heroBorder:    'rgba(184,134,11,0.08)'                 // hero border
  glass:         'rgba(255,255,255,0.55)'                // frosted panel bg
  glassBorder:   'rgba(255,255,255,0.7)'                 // frosted panel border
  glassShadow:   '0 2px 12px rgba(60,48,28,0.04)'       // subtle warm shadow
  glassBlur:     '20px'                                  // backdrop blur
  textPrimary:   'rgba(60,48,28,0.85)'                   // dark warm brown
  textSecondary: 'rgba(60,48,28,0.55)'                   // mid brown
  textMuted:     'rgba(60,48,28,0.35)'                   // light brown
  textFaint:     'rgba(60,48,28,0.20)'                   // barely visible
  heroText:      'rgba(255,245,230,0.95)'                // off-white on dark
  heroTextMuted: 'rgba(255,245,230,0.30)'                // muted on dark
  gold:          '#8B6914'                               // brand gold
  goldGrad:      'linear-gradient(135deg, #b8860b, #d4a017)' // CTA gold
  border:        'rgba(60,48,28,0.06)'                   // subtle warm border
  borderLight:   'rgba(60,48,28,0.04)'                   // ultra-subtle border
  tileHover:     'rgba(60,48,28,0.03)'                   // tile hover
  tileBg:        'rgba(60,48,28,0.015)'                  // tile resting
  serif:         'Georgia, "Times New Roman", serif'     // data/numbers
}
```

**Key patterns:** Glassmorphism panels (55% white + 20px blur), dark hero card, gold accents for CTAs, Georgia serif for data numbers, all grays use `rgba(60,48,28,...)` warm browns instead of pure gray, colored gradient squares for icons.

---

# AREA 1: CARRIER RESOURCES PAGE

## 1.1 File Inventory

| File | Lines | Role |
|------|-------|------|
| `src/pages/CarrierResourcesPage.tsx` | 214 | Main page component |
| `src/hooks/useCarrierDirectory.ts` | 203 | Supabase hooks: `useCarrierDirectory`, `useAgentCarriers` |
| `src/hooks/useNavigationContext.ts` | 76 | Admin/agent view mode + home path |
| `src/components/UserAvatarDropdown.tsx` | 299 | Header avatar with dropdown |
| `src/components/ui/PageLoader.tsx` | 40 | Full-screen loader |
| `src/types/carrierDirectory.ts` | 72 | TS interfaces for carrier data |
| `src/config/carriers.ts` | 367 | `CARRIER_BRAND_COLORS` + carrier configs |

### Data Sources
- **`useCarrierDirectory('KY')`** — Supabase JOIN across `carriers`, `carrier_contacts`, `carrier_links`, `carrier_documents`. Hardcoded to Kentucky.
- **`useAgentCarriers()`** — Supabase query to `agent_certifications`, filters carriers by agent's certs. Falls back to all 6 if none found.
- **`CARRIER_BRAND_COLORS`** — Static object: Aetna `#7B2D8E`, Humana `#4B9B4B`, UHC `#002677`, Anthem `#0072CE`, WellCare `#00A79D`, Devoted `#F97316`

## 1.2 Content Map (Order of Appearance)

```
┌──────────────────────────────────────────────────────────┐
│ STICKY HEADER                                            │
│ ← Dashboard                          [Avatar Dropdown]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              Carrier Resources                           │
│          Contacts, portals, and documents                │
│                                                          │
│    ┌────────────────────────────────────────┐            │
│    │ [Aetna] [Humana] [UHC] [Anthem] ...   │  ← pills  │
│    └────────────────────────────────────────┘            │
│                                                          │
│  CONTACTS                                                │
│  ┌──────────────────────────────────────────────┐       │
│  │ [█] John Smith · Regional Manager             │       │
│  │     ☎ (555) 123-4567  ✉ john@carrier.com      │       │
│  │─────────────────────────────────────────────── │       │
│  │ [█] Jane Doe · Broker Relations               │       │
│  │     ☎ (555) 987-6543  ✉ jane@carrier.com      │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  QUICK LINKS                    DOCUMENTS                │
│  ┌────────────────────┐        ┌────────────────────┐   │
│  │ ● Agent Portal   › │        │ ● Market Guide   ⬇ │   │
│  │ ● Commission     › │        │ ● Rate Sheet     ⬇ │   │
│  │ ● Certification  › │        │ ● Training Doc   ⬇ │   │
│  └────────────────────┘        └────────────────────┘   │
│                                                          │
│  (no footer)                                             │
└──────────────────────────────────────────────────────────┘
```

**Carrier pills:** One per certified carrier. Selected = brand color fill + white text + shadow. Unselected = gray text + hover gray bg.

**Contacts section:** White `rounded-2xl` card with `shadow-lg`. Each contact: colored avatar square (brand color + initials), name, title, phone (`tel:` green), email (`mailto:` blue). Rows separated by `divide-y divide-gray-100`.

**Quick Links:** Filtered to `portal`, `certification`, `commission` types. Blue circle icon + name + chevron. Opens in new tab.

**Documents:** Red circle icon + name + download icon. Opens in new tab.

**No carrier logos displayed.** No search/text filter. No tabs/accordions. No footer.

## 1.3 Layout Structure

| Element | Classes / Values |
|---------|-----------------|
| Page background | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` |
| Header | `bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50` |
| Content max-width | `max-w-5xl` (1024px) |
| Content padding | `px-6 pb-8 pt-6` |
| Cards | `bg-white rounded-2xl shadow-lg shadow-gray-100/80` |
| Card dividers | `divide-y divide-gray-100` |
| Section labels | `text-[10px] font-medium uppercase tracking-widest text-gray-400` |
| Links/Docs grid | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Pills container | `inline-flex flex-wrap justify-center bg-white rounded-full p-1.5 shadow-lg` |

### Current Color Scheme
| Element | Color |
|---------|-------|
| Page bg | Gradient `#FEFDFB` → `#FDFBF7` → `#FAF8F3` |
| Cards | Pure `bg-white` |
| Shadows | `gray-100/80` |
| Text primary | `text-gray-900` |
| Text secondary | `text-gray-500` |
| Section labels | `text-gray-400` |
| Phone links | `text-green-600` |
| Email links | `text-blue-600` |
| Quick Link icons | `bg-blue-50` circle |
| Document icons | `bg-red-50` circle |
| Back link | `text-blue-600` |

## 1.4 Viewport Analysis (1366×768)

| Section | Est. Height | Notes |
|---------|-------------|-------|
| Sticky header | ~52px | `py-3` + content |
| Title + subtitle | ~68px | h1 + subtitle + margins |
| Carrier pills | ~68px | Pills + bottom margin |
| "CONTACTS" label | ~28px | Label + margin |
| Per contact row | ~52px | Avatar + name + phone/email |
| Gap to Links/Docs | ~16px | `space-y-4` |
| Links/Docs labels | ~28px each | Uppercase labels |
| Per link/doc row | ~44px | Icon + text |

**Available below header:** 768 − 52 = **716px**

**Consumed by chrome (title + pills):** 68 + 68 = **136px**

**Remaining for content:** 716 − 136 = **580px** — fits 3-4 contacts + 3-4 links/docs comfortably.

**Verdict:** Content fits above the fold for most carriers (3-4 contacts, 2-3 links, 2-3 docs). Carriers with 6+ contacts will overflow.

**Wasted space:** ~48px of combined vertical margins between title and pills sections could be compressed.

## 1.5 Interaction Map

| Element | Action |
|---------|--------|
| ← Dashboard | `<Link to={homePath}>` (/ or /admin) |
| Avatar dropdown | Opens: Profile, Certs, BOSS CRM, Admin, Outlook, Sign Out |
| Carrier pills | `setSearchParams({ carrier: code })` — URL-persisted, instant switch |
| Phone numbers | `<a href="tel:...">` opens dialer |
| Email addresses | `<a href="mailto:...">` opens mail client |
| Quick Links | `<a target="_blank">` opens portal/certification/commission URL |
| Documents | `<a target="_blank">` opens file URL (PDF from Supabase Storage) |

**Hover states:** Back link slides arrow left; pills get gray bg; contact rows get `bg-gray-50`; link icons brighten; doc download icon turns blue.

**No text search.** Agents must click through pills sequentially.

## 1.6 Responsive Behavior

| Breakpoint | Effect |
|------------|--------|
| Default (< 768px) | Links + Docs stack vertically (`grid-cols-1`) |
| `md:` (≥ 768px) | Links + Docs side-by-side (`grid-cols-2`) |

**Only one breakpoint.** No `sm:`, `lg:`, or `xl:` classes. No responsive visibility toggles. Contact rows don't stack on mobile — may overlap on small screens. Carrier pills wrap naturally via `flex-wrap`.

## 1.7 Gap Analysis: What Needs to Change

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: Tailwind gradient classes | `#F3EDE4` solid warm cream | **S** |
| Header: `bg-white/70` | Consistent w/ GH header (or no header, just back arrow) | **S** |
| Cards: `bg-white rounded-2xl shadow-lg` | Frosted glass: `rgba(255,255,255,0.55)` + blur(20px) + warm border | **M** |
| Section labels: `text-gray-400` | `rgba(60,48,28,0.35)` warm muted | **S** |
| Text: `text-gray-900/500` | `rgba(60,48,28,0.85/0.55)` warm brown scale | **S** |
| Shadows: `shadow-gray-100/80` | `0 2px 12px rgba(60,48,28,0.04)` warm shadow | **S** |
| Phone/email: `green-600/blue-600` | Evaluate if bright Tailwind colors match GH palette | **S** |
| Quick Link icons: `bg-blue-50` | Gradient colored square pattern (like dock tiles) | **M** |
| Document icons: `bg-red-50` | Gradient colored square pattern | **M** |
| Back link: `text-blue-600` | Gold accent `#8B6914` or warm brown | **S** |
| No footer | Add "Powered by Tyler Insurance Group" footer | **S** |
| Contact avatars: flat carrier color | Could add subtle gradient like GH icon pattern | **S** |
| No search | Consider adding carrier search for GH alignment (optional) | **L** |

## 1.8 Recommended Implementation Order

1. **Page background + header** — swap to GH tokens (S, 15 min)
2. **Text color scale** — replace all gray-X with GH warm browns (S, 15 min)
3. **Cards → GlassPanel** — frosted glass + blur + warm shadow (M, 30 min)
4. **Section labels** — GH muted style (S, 10 min)
5. **Icons → gradient squares** — match dock tile pattern (M, 30 min)
6. **Contact avatars** — gradient treatment (S, 15 min)
7. **Footer** — add consistent GH footer (S, 10 min)
8. **Final polish** — hover states, transitions, border consistency (S, 20 min)

**Total estimate: ~2.5 hours**

---

# AREA 2: TRAINING LIBRARY → LEARNING CENTER

## 2.1 File Inventory

| File | Lines | Role |
|------|-------|------|
| `src/pages/TrainingPage.tsx` | ~50 | Main page (state + routing) |
| `src/components/training/TrainingLayout.tsx` | ~45 | Layout wrapper (header, grid, footer) |
| `src/components/training/VideoSidebar.tsx` | ~100 | Left sidebar with video list + progress |
| `src/components/training/VideoContent.tsx` | ~65 | Right content: player + description + "Up Next" |
| `src/components/training/VideoPlayer.tsx` | ~25 | Vimeo iframe embed |
| `src/data/trainingVideos.ts` | ~180 | Hardcoded video data (15 videos) |
| `src/components/ui/PageLoader.tsx` | 40 | Loading state |

### Routes (`src/App.tsx`)
```
/training          → TrainingPage (lazy loaded)
/training/:videoId → TrainingPage (lazy loaded)
```
Both behind `<ProtectedRoute>` (any authenticated role).

### Data Sources
- **100% static.** No Supabase queries. No TanStack Query. No custom hooks.
- All data from `src/data/trainingVideos.ts` — hardcoded array of 15 `TrainingVideo` objects.
- **No progress tracking** — hardcoded stubs only (`completedCount = 1`, `isCompleted = video.id === "1"`).

## 2.2 Current Content

### 15 Vimeo Videos (~25.5 hours total)

| ID | Module | Title | Duration |
|----|--------|-------|----------|
| 1 | Day 1 | The Basics: Understanding Medicare | 1h 25m |
| 2 | Day 2 | Medicare Advantage & Enrollment Periods | 1h 50m |
| 3 | Day 3 | Government Resources & Medicare Supplements Intro | 2h 09m |
| 4 | Day 4 | Medicare Supplements Deep Dive | 2h 20m |
| 5 | Day 5 | Part D & Special Needs Plans | 2h 12m |
| 6 | Day 6 | Marketing Strategies for AEP | 1h 55m |
| 7 | Day 7 | Industry News & Medigap Quoting | 1h 55m |
| 8 | Day 8 | Connecture & Quoting Systems | 2h 09m |
| 9 | Day 9 | Power of Attorney & Quoting Workflow | 1h 55m |
| 11 | Day 11 | Industry Landscape & Drug Plans | 1h 25m |
| 12 | Day 12 | Carrier Portals & Enrollment | 1h 03m |
| 13 | Day 13 | AHIP & Carrier Certifications | 1h 14m |
| 14 | Day 14 | Marketing Updates & Cross-Selling | 1h 12m |
| 15 | Day 15 | Sales Process & Client Intake | 1h 51m |
| 16 | Day 16 | AEP Launch Preparation | 1h 03m |

**Note:** ID 10 is missing/skipped.

**Schema:**
```ts
interface TrainingVideo {
  id: string;           // "1" through "16"
  title: string;
  description: string;
  duration: string;     // "1h 25min"
  vimeoId: string;
  vimeoHash: string;    // privacy hash for unlisted
  startTime: number;    // always 0
  module: string;       // "Day 1", "Day 2", etc.
  moduleOrder: number;
  videoOrder: number;   // all 1 (one video per day)
  thumbnailUrl?: string; // never populated
}
```

**No categories, tags, or type field.** Only `module` (Day N) grouping.

### Natural Category Breakdown

**Foundation Knowledge (On Demand):**
- Day 1-5, 11: Medicare basics, MA, Supplements, Part D, SNPs

**How-To's (Practical Guides):**
- Day 8-9, 12-13, 15: Quoting systems, portals, certifications, sales process

**Marketing & Sales Strategy:**
- Day 6, 14, 16: AEP marketing, cross-selling, launch prep

**Industry Context:**
- Day 7, 11: Industry news, landscape

## 2.3 Layout Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ STICKY HEADER (bg-white/70 backdrop-blur-xl)                        │
│ ← Dashboard                                      [Avatar Dropdown]  │
├────────────────┬─────────────────────────────────────────────────────┤
│  SIDEBAR       │  CONTENT AREA                                      │
│  (3/12 cols)   │  (9/12 cols)                                       │
│                │                                                     │
│  ┌──────────┐  │  Day 1                                             │
│  │ Training │  │  The Basics: Understanding Medicare                │
│  │ 1 of 15  │  │                                                     │
│  ├──────────┤  │  ┌─────────────────────────────────────────┐       │
│  │ DAY 1    │  │  │                                         │       │
│  │ ● Basics │  │  │         VIMEO EMBED (16:9)              │       │
│  │ DAY 2    │  │  │                                         │       │
│  │ ○ MA...  │  │  └─────────────────────────────────────────┘       │
│  │ DAY 3    │  │                                                     │
│  │ ○ Gov... │  │  Description text here...                          │
│  │ ...      │  │                                                     │
│  ├──────────┤  │  ┌─────────────────────────────────────────┐       │
│  │ ████░░   │  │  │ Up Next: Day 2 — Medicare Advantage  ›  │       │
│  │ 1/15     │  │  └─────────────────────────────────────────┘       │
│  └──────────┘  │                                                     │
├────────────────┴─────────────────────────────────────────────────────┤
│            Powered by Tyler Insurance Group                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Classes

| Element | Classes |
|---------|---------|
| Page bg | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` |
| Header | `bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50` |
| Content max-width | `max-w-5xl mx-auto px-6 py-6` |
| Grid | `grid grid-cols-12 gap-6` |
| Sidebar col | `col-span-12 lg:col-span-3` |
| Content col | `col-span-12 lg:col-span-9` |
| Sidebar card | `bg-white border border-[#e8e4dd] rounded-xl sticky top-20` |
| Video container | `bg-white border border-[#e8e4dd] rounded-xl` |
| Up Next card | `bg-white border border-[#e8e4dd] rounded-xl hover:bg-stone-50` |
| Active video | `bg-blue-600 text-white` |
| Progress bar | `bg-emerald-500` on `bg-stone-100` track |

### Color Scheme
| Element | Current Value |
|---------|--------------|
| Primary text | `#292524` (stone-900) |
| Secondary text | `#5c5552` (custom warm gray) |
| Module labels | `#5c5552` uppercase |
| Active video | `bg-blue-600` (Tailwind blue) |
| Progress bar fill | `bg-emerald-500` |
| Day label | `text-blue-600` |
| Card borders | `#e8e4dd` |
| Footer text | `#5c5552` at 50% opacity |

### Responsive
- `< lg`: Sidebar hidden, replaced with floating hamburger (`MobileMenuButton`) at `fixed top-20 left-4 z-40` → opens slide-in `w-72` panel
- `≥ lg`: 12-column grid (3 sidebar + 9 content)

## 2.4 Navigation References — Every Place "Training" Appears

| # | File | Line | Text / Context |
|---|------|------|---------------|
| 1 | `src/App.tsx` | 45 | `const TrainingPage = lazy(...)` — import |
| 2 | `src/App.tsx` | 274 | `{/* Training Library */}` — comment |
| 3 | `src/App.tsx` | 275 | `path="/training"` — route |
| 4 | `src/App.tsx` | 276 | `path="/training/:videoId"` — route |
| 5 | `src/pages/Index.tsx` | 526 | `label="Training"` — dock tile |
| 6 | `src/pages/Index.old.tsx` | 258 | `Training` — card title |
| 7 | `src/pages/Index.old.tsx` | 260 | `Videos & resources` — subtitle |
| 8 | `src/pages/Index.old.tsx` | 249 | `to="/training"` — link |
| 9 | `src/components/training/VideoSidebar.tsx` | 31 | `Training` — sidebar heading |
| 10 | `src/pages/TrainingPage.tsx` | 25 | `Agent Training` — document title |
| 11 | `src/pages/TrainingPage.tsx` | 26 | `Agent Training \| TIG Platform` — fallback title |
| 12 | `src/pages/TrainingPage.tsx` | 30 | `Loading training videos...` — loader |
| 13 | `src/components/training/VideoPlayer.tsx` | 19 | `title="Training Video"` — iframe |
| 14 | `src/components/training/VideoContent.tsx` | 57 | `completed all training videos!` — completion msg |

**NOT in Navigation.tsx** — training is not in the top nav. Only accessible via dashboard dock tile.

**NOT in UserAvatarDropdown** — no training link in avatar menu.

## 2.5 Rename Impact: "Training Library" → "Learning Center"

### Minimum Required Changes (display text only, keep `/training` URL)

| File | Changes | Effort |
|------|---------|--------|
| `src/App.tsx` | 1 comment update | **S** |
| `src/pages/Index.tsx` | 1 label: `"Training"` → `"Learning"` (dock tile) | **S** |
| `src/components/training/VideoSidebar.tsx` | 1 heading text | **S** |
| `src/pages/TrainingPage.tsx` | 3 strings (2 doc titles + 1 loader) | **S** |
| `src/components/training/VideoPlayer.tsx` | 1 iframe title | **S** |
| `src/components/training/VideoContent.tsx` | 1 completion message | **S** |

**Total: 6 files, ~10 line changes.**

### Optional: Full Route Rename (`/training` → `/learning-center`)
Would additionally require: 2 route defs + 3 `navigate()` calls + 2 `<Link to>` props + ideally a redirect from old URL. **Not recommended** unless SEO matters.

### Optional: File/Directory Rename
- `src/pages/TrainingPage.tsx` → `LearningCenterPage.tsx`
- `src/components/training/` → `src/components/learning-center/`
- `src/data/trainingVideos.ts` → `src/data/learningVideos.ts`

**Not required** but cleaner long-term.

## 2.6 Gap Analysis: What Needs to Change

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: Tailwind gradient classes | `#F3EDE4` solid | **S** |
| Header: `bg-white/70` — already close to GH | Keep, just verify consistency | **S** |
| Sidebar: `bg-white border-[#e8e4dd]` | Frosted glass panel | **M** |
| Video card: `bg-white border-[#e8e4dd]` | Frosted glass panel | **M** |
| Active video: `bg-blue-600` | Gold accent `#8B6914` or gold gradient | **S** |
| Day labels: `text-blue-600` | Gold or warm secondary | **S** |
| Progress bar: `bg-emerald-500` | Gold gradient? Or keep emerald for success | **S** |
| Text: `#292524` / `#5c5552` | GH warm browns `rgba(60,48,28,...)` — already close | **S** |
| Up Next card: `hover:bg-stone-50` | GH `tileHover` + warm border | **S** |
| Sidebar heading: plain text | Could use Georgia serif per GH pattern | **S** |
| No search/filter | Consider category tabs for "On Demand" / "How-To" / etc. | **L** |
| "Training" labels | Rename to "Learning Center" everywhere | **S** |
| Footer: `#5c5552/50` | Match GH footer style | **S** |

## 2.7 Recommended Implementation Order

1. **Rename "Training" → "Learning Center"** across 6 files (S, 15 min)
2. **Page background** → `#F3EDE4` (S, 5 min)
3. **Text color scale** → GH warm browns (S, 15 min)
4. **Sidebar → GlassPanel** — frosted glass + blur (M, 30 min)
5. **Video card → GlassPanel** (M, 20 min)
6. **Active video highlight** → gold accent instead of blue (S, 10 min)
7. **Day labels** → gold or warm secondary (S, 5 min)
8. **Up Next card** → GH tile pattern (S, 10 min)
9. **Footer** → consistent GH footer (S, 5 min)
10. **Typography** — sidebar heading in Georgia serif (S, 5 min)
11. *(Future)* **Category tabs** — "On Demand" / "How-To" / "Marketing" (L, 2-3 hours)

**Total estimate (excluding category tabs): ~2 hours**

---

# AREA 3: SYNC STATUS PAGES

## 3.1 File Inventory

### Core Sync Flow (Agent-Facing)

| File | Lines | Role |
|------|-------|------|
| `src/pages/SyncFlow.tsx` | 1583 | **Main sync page** — multi-phase wizard |
| `src/components/dashboard/SyncStatusPill.tsx` | 177 | Dashboard pill with dropdown |
| `src/pages/Index.tsx` | 726 | Dashboard — uses SyncStatusPill, stale banner, empty CTA |
| `src/components/dashboard/DashboardHeader.tsx` | ~50 | Legacy header (NOT currently imported) |

### Sync Business Logic

| File | Lines | Role |
|------|-------|------|
| `src/lib/sync.ts` | 590 | Core utilities: status check, init, complete, milestones |
| `src/lib/carrier-detection.ts` | 259 | File carrier auto-detection |
| `src/config/carriers.ts` | 367 | Carrier config (4 enabled, ~30 coming soon) |

### Sync Hooks

| File | Lines | Role |
|------|-------|------|
| `src/hooks/useSyncPreferences.ts` | 89 | Fetches last sync carrier prefs |
| `src/hooks/useAgentRTSCarriers.ts` | 96 | Fetches agent's RTS carriers |
| `src/hooks/useDashboardData.ts` | 304 | Dashboard data + `determineSyncStatus()` |

### Book of Business Upload (Separate Path)

| File | Lines | Role |
|------|-------|------|
| `src/components/book-of-business/UploadModal.tsx` | 591 | Individual carrier upload modal |
| `src/components/book-of-business/UploadProgressAnimated.tsx` | 195 | 3-step animated progress |
| `src/contexts/UploadContext.tsx` | 191 | Background upload state management |

### Admin Sync Views

| File | Lines | Role |
|------|-------|------|
| `src/pages/admin/AgentsBookPage.tsx` | 319 | Admin table of all agents' sync status |
| `src/pages/admin/AgentBookDetailPage.tsx` | 194 | Admin single-agent detail |
| `src/hooks/useAdminAgentsBook.ts` | 120 | Admin data hook |
| `src/hooks/useAdminAgentBook.ts` | 177 | Admin detail data hook |

### Route
```
/sync → SyncFlow (ProtectedRoute, any authenticated user)
```

## 3.2 Sync Flow — Complete User Journey

### Phase State Machine
```
SyncPhase = 'loading' | 'select' | 'confirm' | 'addMore' | 'upload' | 'done'
```

### Journey 1: First-Time Sync (Never Synced Before)

```
loading → select → upload → done
```

**1. Loading:** Centered blue spinner on `bg-[#f9fafb]`. Visible while `rtsLoading || prefsLoading`.

**2. Select:** "Which carriers do you want to sync?"
- Blue Upload icon in `bg-blue-100 rounded-2xl` box
- 2-column grid of carrier tiles (checkable)
- Enabled carriers: selectable with brand color icon
- Coming-soon carriers: grayed out with Lock icon
- Blue "Continue with N carriers" button

**3. Upload:** "Upload [Month] reports"
- One `CarrierUploadRow` per selected carrier
- Each row: carrier icon + name + portal link + Upload button
- Upload button expands to drop zone (dashed border)
- Processing: blue spinner replaces upload button
- Uploaded: green border + checkmark + client count
- Progress counter: "X of Y"
- Green "Complete Sync" button (emerald)

**4. Done:** "[Month] synced!"
- Large emerald sparkles in `bg-emerald-100 rounded-full`
- Total clients count
- Stats: +X new (green), -X termed (amber), net change
- Blue "Go to Dashboard" button
- "We'll remind you..." text

### Journey 2: Returning Agent (Has Previous Sync)

```
loading → confirm → (optional: addMore) → upload → done
```

**2b. Confirm:** "Sync your usual carriers?"
- Shows last sync date + carrier pills with brand color tint
- "Sync These N Carriers" (blue primary)
- "Add More Carriers" (border secondary)

**2c. AddMore (optional):** "Add more carriers"
- Existing carriers as green pills with checkmarks
- Additional carriers as selectable tiles
- Coming-soon with Lock

### Journey 3: Session Restore
- Reads from `sessionStorage`
- Resumes wherever agent left off
- Cleared on completion

### Error States
| Error | UI |
|-------|----|
| File carrier mismatch | `MismatchDialog` — amber AlertTriangle modal, "Upload Anyway" option |
| Detection failed | `DetectionFailedDialog` — slate AlertTriangle modal, "Yes, upload" option |
| Sync completion error | Console only — **no user-facing error UI** |
| Upload processing error | Silent — spinner clears, no message |

### Dashboard Sync States

| State | Dashboard Shows |
|-------|----------------|
| `'never'` (0 clients) | Hero with ghosted "0", `GHEmptyStateCTA` ("Import your production reports" + gold "Start Sync") |
| `'stale'` (has data, outdated) | Gold stale banner ("Time to sync your [Month] reports" + gold "Sync Now"), yellow warning in hero card, carrier bars at 75% opacity |
| `'synced'` (current) | Full hero with data, no warnings |

## 3.3 Styling for Each Sync State

### SyncFlow Common Container
```
ALL phases: min-h-screen bg-[#f9fafb] p-6
Inner:      max-w-lg mx-auto (~512px)
```

### Phase: Loading
```
Container: min-h-screen bg-[#f9fafb] flex items-center justify-center
Spinner:   w-8 h-8 text-blue-500 animate-spin
```

### Phase: Select
```
Icon box:    w-16 h-16 bg-blue-100 rounded-2xl
Title:       text-2xl font-bold text-slate-800
Subtitle:    text-slate-500
Tile (sel):  border-2 border-blue-500 bg-blue-50 rounded-2xl p-4
Tile (unsel): border-2 border-slate-200 bg-white rounded-2xl p-4
Check badge: w-6 h-6 bg-blue-500 rounded-full (top-right)
Button:      w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl
Disabled:    bg-slate-300 cursor-not-allowed
```

### Phase: Confirm
```
Icon box:   w-16 h-16 bg-blue-100 rounded-2xl (RotateCcw icon)
Summary:    bg-white rounded-2xl border border-slate-200 p-5
Pills:      px-3 py-2 rounded-xl, bg = carrier.color + "15" (15% opacity)
Dot:        w-3 h-3 rounded-full, carrier.color
Primary:    w-full py-4 bg-blue-600 text-white rounded-2xl
Secondary:  w-full py-4 border-2 border-slate-200 text-slate-700 rounded-2xl
```

### Phase: Upload
```
Upload row (pending): bg-white rounded-2xl border border-slate-200 p-4
  Carrier icon: w-10 h-10 rounded-xl, bg = carrier.color + "20"
  Upload btn:   px-4 py-2 bg-blue-600 text-white rounded-xl
  Drop zone:    border-2 border-dashed border-slate-300 rounded-xl p-6
    Drag over:  border-blue-500 bg-blue-50
  Processing:   Loader2 w-5 h-5 text-blue-500 animate-spin

Upload row (done): bg-white rounded-2xl border border-emerald-200 bg-emerald-50 p-4
  Check icon:   w-10 h-10 bg-emerald-500 rounded-xl, Check w-5 h-5 text-white
  Count text:   text-sm text-emerald-600
  New count:    text-emerald-500
  Termed count: text-amber-500

Complete btn: w-full py-4 bg-emerald-600 text-white font-semibold rounded-2xl
```

### Phase: Done
```
Success icon: w-20 h-20 bg-emerald-100 rounded-full
  Sparkles:   w-10 h-10 text-emerald-600
Title:        text-3xl font-bold text-slate-800
Total:        text-xl text-slate-500
Stats:        text-emerald-600 / text-amber-500 / text-slate-600
Go to Dash:   px-8 py-4 bg-blue-600 text-white rounded-2xl
Reminder:     text-sm text-slate-400
```

### Mismatch Dialog
```
Overlay:  fixed inset-0 bg-black/50 z-50
Dialog:   bg-white rounded-2xl p-6 max-w-md
Icon:     w-12 h-12 bg-amber-100 rounded-xl + AlertTriangle text-amber-600
Cancel:   flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl
Confirm:  flex-1 py-3 bg-blue-600 text-white rounded-xl
```

### SyncStatusPill (Dashboard)
```
Pill container: flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm
  synced: bg-white/80, border-slate-200/80, dot bg-emerald-400
  stale:  bg-amber-50, border-amber-200, dot bg-amber-400
  never:  bg-blue-50, border-blue-200, dot bg-blue-400 animate-pulse

Dropdown: absolute w-72 bg-white rounded-2xl shadow-2xl border-slate-200
  Stats:  3-column grid with serif numbers
  Action: <Link to="/sync"> blue text
  Footer: text-blue-600 bg-blue-50
```

## 3.4 Shared Elements & Inconsistencies

### Three Independent Sync Status Implementations (!)

| Implementation | File | States | Logic |
|---------------|------|--------|-------|
| Agent dashboard | `useDashboardData.ts` | synced/stale/never | 7th-of-month rule |
| Admin agents table | `AgentsBookPage.tsx` | current/stale/very-stale/never | Same-month + 45-day threshold |
| Admin agent detail | `AgentBookDetailPage.tsx` | current/stale/never | Same-month + days-ago |

**These are NOT consistent.** Different thresholds, different state names.

### Two Separate Upload Paths

| Path | Component | Writes To | Parser |
|------|-----------|-----------|--------|
| Monthly Sync | `SyncFlow.tsx` | `monthly_syncs` + `sync_carrier_uploads` | Client-side first, then edge function |
| Book of Business | `UploadModal.tsx` | `production_uploads` + `clients` + `policies` | Edge function directly |

### Shared Utilities
- `getNextSyncDate()` — shared between `SyncStatusPill` and `SyncFlow`
- `detectCarrierFromFile()` — shared between `SyncFlow` and `UploadModal`
- `checkAndAwardMilestones()` — in `lib/sync.ts`, called by SyncFlow directly

### DashboardHeader.tsx — Legacy
This component exists but is **NOT imported by the current dashboard**. The current `Index.tsx` builds its header inline and uses `SyncStatusPill` instead.

## 3.5 Gap Analysis: What Needs to Change

### SyncFlow.tsx — Major Redesign Needed

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: `#f9fafb` (cool gray) | `#F3EDE4` (warm cream) | **S** |
| Container: `max-w-lg` (512px) | May keep narrow or match GH `max-w-5xl` | **S** |
| Icon boxes: `bg-blue-100` | Could be gold or warm tint | **S** |
| Icons: `text-blue-600` | Could be gold `#8B6914` or warm | **S** |
| Title: `text-slate-800` | `rgba(60,48,28,0.85)` warm brown | **S** |
| Subtitle: `text-slate-500` | `rgba(60,48,28,0.55)` | **S** |
| All buttons: `bg-blue-600` | Gold gradient for primary, glass for secondary | **M** |
| Disabled: `bg-slate-300` | Warm muted disabled state | **S** |
| Tiles (selected): `border-blue-500 bg-blue-50` | Gold border + warm tint | **S** |
| Check badge: `bg-blue-500` | Gold gradient | **S** |
| Summary card: `bg-white border-slate-200` | GlassPanel frosted glass | **M** |
| Drop zone: `border-slate-300` | Warm dashed border | **S** |
| Uploaded row: `border-emerald-200 bg-emerald-50` | Evaluate — emerald may stay for "success" | **S** |
| Complete btn: `bg-emerald-600` | Gold gradient? Or keep emerald for success | **S** |
| Done icon: `bg-emerald-100` | Gold or keep emerald for celebration | **S** |
| Done "Go to Dashboard": `bg-blue-600` | Gold gradient | **S** |
| Dialogs: `bg-white rounded-2xl` | GlassPanel or keep white for modals | **S** |
| Coming soon: `bg-slate-50 opacity-60` | Warm muted with GH tones | **S** |

### SyncStatusPill — Minor Updates

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Pill: uses Tailwind slate/amber/blue | Warm brown scale for `synced`, keep amber for `stale` | **S** |
| Dropdown: `bg-white rounded-2xl shadow-2xl` | Could be GlassPanel | **S** |
| Footer: `bg-blue-50 text-blue-600` | Gold tint | **S** |
| Action text: `text-blue-600` | Gold `#8B6914` | **S** |

### Dashboard Stale Banner — Already GH-Aligned
The stale banner in `Index.tsx` already uses gold gradients and warm tones. **No changes needed.**

### Dashboard Empty CTA — Already GH-Aligned
`GHEmptyStateCTA` already uses gold gradients on the dark hero card. **No changes needed.**

## 3.6 Recommended Implementation Order

1. **SyncFlow background + text colors** — swap `#f9fafb` → `#F3EDE4`, slate → warm browns (S, 20 min)
2. **SyncFlow icon accents** — blue-100/blue-600 → gold tints (S, 15 min)
3. **SyncFlow buttons** — blue-600 → gold gradient for primary (M, 20 min)
4. **SyncFlow tiles** — blue selection → gold selection (S, 15 min)
5. **SyncFlow cards** — white + slate border → GlassPanel (M, 30 min)
6. **SyncFlow upload rows** — warm styling, keep emerald for success (S, 15 min)
7. **SyncFlow done screen** — gold accents, warm text (S, 15 min)
8. **SyncFlow dialogs** — warm tones (S, 10 min)
9. **SyncStatusPill** — warm browns + gold accents (S, 20 min)
10. **Typography** — add Georgia serif for numbers/counts per GH pattern (S, 15 min)

**Total estimate: ~3 hours**

---

# CROSS-AREA PRIORITIZED IMPLEMENTATION PLAN

## Priority Matrix

| Area | Files to Touch | Visual Impact | User-Facing | Effort |
|------|---------------|---------------|-------------|--------|
| Carrier Resources | 1 main + config | HIGH (daily use) | All agents | ~2.5h |
| Learning Center | 6 rename + 5 style | MEDIUM (less frequent) | All agents | ~2h |
| Sync Flow | 2 main + pill | HIGH (monthly use, first impression) | All agents | ~3h |

## Recommended Sprint Order

### Day 1 (Monday Morning): Carrier Resources — 2.5 hours
**Why first:** Most-used page after dashboard. Agents visit daily. High visual inconsistency with current cold gray/blue theme vs warm Golden Hour.

1. Page background → `#F3EDE4`
2. Text color scale → warm browns
3. Cards → GlassPanel frosted glass
4. Section labels → GH muted style
5. Icons → gradient squares
6. Contact avatars → gradient treatment
7. Add footer
8. Final polish

### Day 1 (Monday Afternoon): Sync Flow — 3 hours
**Why second:** First impression for new agents. Monthly touchpoint for all agents. Large file but mostly find-and-replace for colors.

1. Background → `#F3EDE4`
2. Text colors → warm browns
3. Icon boxes → gold tints
4. Primary buttons → gold gradient
5. Tiles → gold selection state
6. Cards → GlassPanel
7. Upload rows → warm styling
8. Done screen → gold celebration
9. Dialogs → warm tones
10. SyncStatusPill → warm + gold

### Day 2 (Tuesday Morning): Learning Center — 2 hours
**Why third:** Less frequently visited but easy win. Rename + restyle.

1. Rename "Training" → "Learning Center" (6 files, 10 lines)
2. Page background → `#F3EDE4`
3. Text colors → warm browns
4. Sidebar → GlassPanel
5. Video card → GlassPanel
6. Active video → gold accent
7. Day labels → gold
8. Up Next → GH tile pattern
9. Footer → GH style
10. Typography → Georgia serif for headings

### Day 2 (Tuesday Afternoon): Polish & QA — 1.5 hours
1. Cross-page consistency check
2. Responsive testing at 1366×768, 1920×1080, 768px mobile
3. Hover states and transitions
4. Loading states match GH
5. Error states match GH
6. Dark hero card integration points

## Total Estimated Effort: ~9 hours (2 focused days)

## Shared Utilities to Create First

Before starting any area, extract a shared GH theme module:

```ts
// src/config/golden-hour.ts
export const GH = { ... }  // Currently duplicated in Index.tsx
export const serif = 'Georgia, "Times New Roman", serif';
```

And a shared `GlassPanel` component:
```ts
// src/components/ui/GlassPanel.tsx
// Frosted glass panel used across all GH pages
```

**This shared setup takes ~30 min and prevents duplication across all three areas.**

---

## Files Summary (All Files That Will Be Modified)

### Area 1: Carrier Resources
- `src/pages/CarrierResourcesPage.tsx` — main restyle

### Area 2: Learning Center
- `src/App.tsx` — comment + lazy import name
- `src/pages/Index.tsx` — dock tile label
- `src/pages/TrainingPage.tsx` — doc titles + loader
- `src/components/training/VideoSidebar.tsx` — heading + styling
- `src/components/training/VideoContent.tsx` — completion msg + styling
- `src/components/training/VideoPlayer.tsx` — iframe title
- `src/components/training/TrainingLayout.tsx` — layout styling

### Area 3: Sync Flow
- `src/pages/SyncFlow.tsx` — full restyle (1583 lines, but mostly color swaps)
- `src/components/dashboard/SyncStatusPill.tsx` — warm + gold styling

### Shared (Create New)
- `src/config/golden-hour.ts` — extracted GH theme tokens
- `src/components/ui/GlassPanel.tsx` — shared frosted glass component
