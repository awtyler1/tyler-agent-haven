# Golden Hour Migration Audit
## Carrier Resources · Learning Center · Sync Status

**Generated:** 2026-02-06
**Purpose:** Pre-design-sprint analysis for bringing three areas into visual alignment with the Golden Hour dashboard theme.

---

## Shared Golden Hour Design Tokens

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

**Key patterns:** Glassmorphism panels (55% white + 20px blur), dark hero card, gold accents for CTAs, Georgia serif for data numbers, all grays use `rgba(60,48,28,...)` warm browns, colored gradient squares for icons.

---

# AREA 1: CARRIER RESOURCES PAGE

## 1.1 File Inventory

| File | Lines | Role |
|------|-------|------|
| `src/pages/CarrierResourcesPage.tsx` | 214 | Main page component |
| `src/hooks/useCarrierDirectory.ts` | 203 | Supabase hooks: `useCarrierDirectory`, `useAgentCarriers` |
| `src/hooks/useNavigationContext.ts` | 76 | Admin/agent view mode + home path |
| `src/components/UserAvatarDropdown.tsx` | 299 | Header avatar with dropdown |
| `src/types/carrierDirectory.ts` | 72 | TS interfaces for carrier data |
| `src/config/carriers.ts` | 367 | `CARRIER_BRAND_COLORS` + carrier configs |

## 1.2 Gap Analysis

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: Tailwind gradient classes | `#F3EDE4` solid warm cream | **S** |
| Header: `bg-white/70` | Consistent w/ GH header | **S** |
| Cards: `bg-white rounded-2xl shadow-lg` | Frosted glass: `rgba(255,255,255,0.55)` + blur(20px) + warm border | **M** |
| Section labels: `text-gray-400` | `rgba(60,48,28,0.35)` warm muted | **S** |
| Text: `text-gray-900/500` | `rgba(60,48,28,0.85/0.55)` warm brown scale | **S** |
| Shadows: `shadow-gray-100/80` | `0 2px 12px rgba(60,48,28,0.04)` warm shadow | **S** |
| Phone/email: `green-600/blue-600` | Evaluate if bright Tailwind colors match GH palette | **S** |
| Quick Link icons: `bg-blue-50` | Gradient colored square pattern (like dock tiles) | **M** |
| Document icons: `bg-red-50` | Gradient colored square pattern | **M** |
| Back link: `text-blue-600` | Gold accent `#8B6914` or warm brown | **S** |
| No footer | Add "Powered by Tyler Insurance Group" footer | **S** |

## 1.3 Implementation Order

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

**Data:** 100% static. No Supabase queries. No progress tracking (hardcoded stubs only).

## 2.2 Training Content (15 Vimeo Videos, ~25.5 hours)

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

**Note:** ID 10 is missing/skipped. No categories/tags — only `module` (Day N) grouping.

## 2.3 Rename Impact: "Training Library" → "Learning Center"

### Minimum Required Changes (display text only, keep `/training` URL)

| File | Changes | Effort |
|------|---------|--------|
| `src/App.tsx` | 1 comment update | **S** |
| `src/pages/Index.tsx` | 1 label: `"Training"` → `"Learning"` (dock tile) | **S** |
| `src/components/training/VideoSidebar.tsx` | 1 heading text | **S** |
| `src/pages/TrainingPage.tsx` | 3 strings (2 doc titles + 1 loader) | **S** |
| `src/components/training/VideoPlayer.tsx` | 1 iframe title | **S** |
| `src/components/training/VideoContent.tsx` | 1 completion message | **S** |

**Total: 6 files, ~10 line changes.** Optional route rename (`/training` → `/learning-center`) not recommended unless SEO matters.

## 2.4 Gap Analysis

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: Tailwind gradient classes | `#F3EDE4` solid | **S** |
| Sidebar: `bg-white border-[#e8e4dd]` | Frosted glass panel | **M** |
| Video card: `bg-white border-[#e8e4dd]` | Frosted glass panel | **M** |
| Active video: `bg-blue-600` | Gold accent `#8B6914` or gold gradient | **S** |
| Day labels: `text-blue-600` | Gold or warm secondary | **S** |
| Progress bar: `bg-emerald-500` | Gold gradient? Or keep emerald for success | **S** |
| Text: `#292524` / `#5c5552` | GH warm browns — already close | **S** |
| "Training" labels | Rename to "Learning Center" everywhere | **S** |

## 2.5 Implementation Order

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
| `src/pages/SyncFlow.tsx` | 1583 | Main sync page — multi-phase wizard |
| `src/components/dashboard/SyncStatusPill.tsx` | 177 | Dashboard pill with dropdown |
| `src/pages/Index.tsx` | 726 | Dashboard — uses SyncStatusPill, stale banner, empty CTA |

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

## 3.2 Sync Flow State Machine

```
SyncPhase = 'loading' | 'select' | 'confirm' | 'addMore' | 'upload' | 'done'
```

- **First-time:** `loading → select → upload → done`
- **Returning:** `loading → confirm → (addMore) → upload → done`
- **Session restore:** Reads from `sessionStorage`, resumes where agent left off

### Dashboard Sync States

| State | Dashboard Shows |
|-------|----------------|
| `'never'` (0 clients) | Hero with ghosted "0", `GHEmptyStateCTA` ("Import your production reports" + gold "Start Sync") |
| `'stale'` (has data, outdated) | Gold stale banner ("Time to sync your [Month] reports" + gold "Sync Now") |
| `'synced'` (current) | Full hero with data, no warnings |

## 3.3 Key Findings: Inconsistencies

### Three Independent Sync Status Implementations

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

## 3.4 Gap Analysis

| Current | Golden Hour Target | Effort |
|---------|-------------------|--------|
| Page bg: `#f9fafb` (cool gray) | `#F3EDE4` (warm cream) | **S** |
| Icon boxes: `bg-blue-100` | Gold or warm tint | **S** |
| Icons: `text-blue-600` | Gold `#8B6914` or warm | **S** |
| Title: `text-slate-800` | `rgba(60,48,28,0.85)` warm brown | **S** |
| All buttons: `bg-blue-600` | Gold gradient for primary, glass for secondary | **M** |
| Tiles (selected): `border-blue-500 bg-blue-50` | Gold border + warm tint | **S** |
| Summary card: `bg-white border-slate-200` | GlassPanel frosted glass | **M** |
| Uploaded row: `border-emerald-200 bg-emerald-50` | Keep emerald for success | **S** |
| Dialogs: `bg-white rounded-2xl` | Warm tones | **S** |

**Dashboard stale banner and empty CTA already use GH styling — no changes needed.**

## 3.5 Implementation Order

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

# CROSS-AREA IMPLEMENTATION PLAN

## Priority Matrix

| Area | Files to Touch | Visual Impact | Effort |
|------|---------------|---------------|--------|
| Carrier Resources | 1 main + config | HIGH (daily use) | ~2.5h |
| Learning Center | 6 rename + 5 style | MEDIUM (less frequent) | ~2h |
| Sync Flow | 2 main + pill | HIGH (monthly, first impression) | ~3h |

## Recommended Sprint Order

1. **Day 1 AM:** Carrier Resources (2.5h) — most-used page after dashboard
2. **Day 1 PM:** Sync Flow (3h) — first impression for new agents
3. **Day 2 AM:** Learning Center (2h) — rename + restyle
4. **Day 2 PM:** Polish & QA (1.5h) — cross-page consistency, responsive testing

**Total: ~9 hours (2 focused days)**

## Shared Utilities to Create First (~30 min)

Before starting any area, extract:
- `src/config/golden-hour.ts` — GH theme tokens (currently duplicated in Index.tsx)
- `src/components/ui/GlassPanel.tsx` — shared frosted glass component

## All Files to Modify

### Area 1: Carrier Resources
- `src/pages/CarrierResourcesPage.tsx`

### Area 2: Learning Center
- `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/TrainingPage.tsx`
- `src/components/training/VideoSidebar.tsx`, `VideoContent.tsx`, `VideoPlayer.tsx`, `TrainingLayout.tsx`

### Area 3: Sync Flow
- `src/pages/SyncFlow.tsx`, `src/components/dashboard/SyncStatusPill.tsx`
