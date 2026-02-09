# MVP Sprint Analysis Report

**Generated:** February 9, 2026
**Scope:** 4 items — Sync Reminder, Training Nav Bug, UI Consistency, Plan Finder Gating

---

## 1. Sync Reminder Dismissal

### Current Architecture

The "time to sync" reminder is **not a standalone component** — it's rendered inline in the Dashboard.

| Element | File | Lines | Description |
|---------|------|-------|-------------|
| **Stale Banner** | `src/pages/Index.tsx` | 218–254 | Gold banner: "Time to sync your [Month] reports" with Sync Now button |
| **"Data may be outdated" warning** | `src/pages/Index.tsx` | 358–363 | Text inside the dark hero card |
| **Carrier bar opacity** | `src/pages/Index.tsx` | 377 | Carrier bars dim to 75% opacity when stale |
| **SyncStatusPill** | `src/components/dashboard/SyncStatusPill.tsx` | 1–217 | Header pill showing sync status (green/amber/gold dot) |
| **Status logic** | `src/hooks/useDashboardData.ts` | 28–52 | `determineSyncStatus()` — the core function |

### Visibility Conditions

The stale banner shows when **both** conditions are true:
```
data.syncStatus === 'stale' && data.totalClients > 0
```

`determineSyncStatus()` in `useDashboardData.ts:28-52` computes status from `lastSyncAt`:

| Status | Condition |
|--------|-----------|
| `'never'` | `lastSyncAt` is null |
| `'stale'` | After the 7th and last sync before this month's 7th, OR before the 7th and last sync before last month's 7th |
| `'synced'` | Last sync after the relevant 7th threshold |

### Sync Completion State

| Where | File | Lines | What Happens |
|-------|------|-------|-------------|
| `monthly_syncs` table | — | — | Row upserted with `status: 'complete'`, `completed_at` timestamp |
| `profiles.last_sync_at` | `src/pages/SyncFlow.tsx` | 875 | Updated on sync completion |
| TanStack Query cache | `src/pages/SyncFlow.tsx` | 882–885 | `['dashboard']` invalidated, forcing refetch |
| `useDashboardData` | `src/hooks/useDashboardData.ts` | 161 | Derives `lastSyncAt` from `monthly_syncs.created_at` (NOT `profiles.last_sync_at`) |

### What Needs to Change

**The reminder already disappears after a successful sync.** The invalidation at SyncFlow:882 triggers a dashboard refetch → `determineSyncStatus()` sees the new sync timestamp → returns `'synced'` → banner condition `isStale && !isEmpty` is false → banner hidden.

**If the banner persists after sync, the issue is one of these:**
1. `useDashboardData.ts:161` derives `lastSyncAt` from the latest `monthly_syncs` row's `created_at`, not `completed_at`. If the sync row was *created* in a previous month but *completed* now, the date check fails. **Check:** Verify the query sorts by `completed_at` or that `created_at` is recent.
2. TanStack Query staleTime is 5 minutes. If the user navigates back before the invalidation propagates, they see stale data. **Check:** Ensure `invalidateQueries` runs before `navigate('/')`.
3. The `determineSyncStatus` function uses the 7th-of-the-month boundary. If an agent syncs on, say, the 6th, the logic checks against *last* month's 7th — which should still work. No edge case here.

### Files to Touch

| File | Change |
|------|--------|
| `src/hooks/useDashboardData.ts:161` | Verify `lastSyncAt` uses `completed_at` (not `created_at`) for accurate status |
| `src/pages/SyncFlow.tsx:882-889` | Ensure `invalidateQueries` + session storage clear happen before any navigation |

### Edge Cases

- **Partial sync:** Agent can complete with only some carriers uploaded. `handleCompleteSync` still runs, `monthly_syncs` marked complete → banner dismisses. No issue.
- **Failed sync:** If `handleCompleteSync` throws (SyncFlow:895), phase stays on upload. `profiles.last_sync_at` not updated, cache not invalidated → banner correctly stays visible.
- **Re-sync same month:** Upsert on `(profile_id, month)` updates existing row → works correctly.
- **Multiple carriers:** All carrier uploads are batched in `handleCompleteSync` before the sync is marked complete. Atomic from the banner's perspective.

---

## 2. Training Page Navigation/URL Bug

### Root Cause: Vimeo iframe with malformed hash fragment

### Route Definition

**File:** `src/App.tsx:274-276`
```tsx
<Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
<Route path="/training/:videoId" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
```

### Navigation Components

| Component | File | Lines | Pattern |
|-----------|------|-------|---------|
| Back to Dashboard | `src/components/training/TrainingLayout.tsx` | 20 | `<Link to={homePath}>` via `useNavigationContext()` |
| Video switching | `src/components/training/VideoSidebar.tsx` | 16 | `navigate(\`/training/${video.id}\`)` — pushes history entry |
| Next video button | `src/components/training/VideoContent.tsx` | 41 | `navigate(\`/training/${nextVideo.id}\`)` |
| Invalid videoId redirect | `src/pages/TrainingPage.tsx` | 19 | `navigate("/training/1", { replace: true })` |

### The Smoking Gun: VideoPlayer.tsx

**File:** `src/components/training/VideoPlayer.tsx:8`

```tsx
const embedUrl = `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}#t=${startTime}s&badge=0&autopause=0&player_id=0&app_id=58479`;
```

**Three problems:**

1. **Malformed URL:** The query parameters `badge=0&autopause=0&player_id=0&app_id=58479` are placed AFTER the `#` hash fragment instead of before it. Everything after `#` is treated as a fragment, not as query params. The correct format is:
   ```
   https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}&badge=0&autopause=0&player_id=0&app_id=58479#t=${startTime}s
   ```

2. **iframe hash + browser history interference:** When an iframe with a hash fragment loads, some browsers may update `window.location.hash` of the parent page, interfering with React Router's `pushState` calls.

3. **iframe focus capture:** After interacting with the video, the iframe captures focus. Clicking the `<Link>` may need two clicks — one to return focus to the parent document, one to navigate.

### Comparison With Other Pages

| Page | Back Link Pattern | Has iframes? | Bug Present? |
|------|-------------------|--------------|-------------|
| Training | `<Link to={homePath}>` | YES (Vimeo) | YES |
| Forms Library | `<Link to={homePath}>` | No | No |
| Compliance | `<Link to={homePath}>` | No | No |
| Carrier Resources | `<Link to={homePath}>` | No | No |

All pages use the identical `<Link to={homePath}>` pattern. The Training page is the **only one** with an iframe. The bug is caused by the Vimeo iframe, not by the navigation code.

### Additional Note on startTime

All 15 training videos in `src/data/trainingVideos.ts` have `startTime: 0`. The hash fragment `#t=0s` is a no-op seek. You could omit the hash entirely when `startTime === 0`.

### Files to Touch

| File | Change |
|------|--------|
| `src/components/training/VideoPlayer.tsx:8` | Fix URL: move query params before `#`, conditionally omit `#t=0s` when startTime is 0 |
| `src/components/training/VideoPlayer.tsx:13-18` | (Optional) Add `sandbox="allow-scripts allow-same-origin"` to iframe to prevent parent history manipulation |

---

## 3. UI Consistency — Forms, Certifications, Training

### Reference: Golden Hour Design System

The Dashboard uses `src/config/golden-hour.ts` tokens. Key values:

| Token | Value |
|-------|-------|
| Page background | `#F3EDE4` (solid warm parchment) |
| Cards | `GlassPanel` — `rgba(255,255,255,0.55)`, `backdrop-blur(20px)`, `border: 1px solid rgba(255,255,255,0.7)`, `border-radius: 18px`, `shadow: 0 2px 12px rgba(60,48,28,0.04)` |
| Text primary | `rgba(60,48,28,0.85)` (warm brown) |
| Text secondary | `rgba(60,48,28,0.55)` |
| Text muted | `rgba(60,48,28,0.35)` |
| Borders | `rgba(60,48,28,0.06)` |
| Hover | `rgba(60,48,28,0.03)` |
| Section headers | 10px, uppercase, 600 weight, 0.07em tracking, muted color |
| Container | `max-w-[1100px]`, `px-4 py-3 sm:px-6 sm:py-4` |
| No sticky header bar, no footer |
| GlassPanel component | `src/components/ui/GlassPanel.tsx` |

### Cross-Cutting Deviations (All 3 Pages Share These)

| # | Issue | Current (All 3) | Dashboard Standard |
|---|-------|-----------------|--------------------|
| 1 | Page background | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `background: #F3EDE4` solid |
| 2 | Sticky header bar | `bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50` | No sticky header |
| 3 | Container width | `max-w-5xl` (1024px) | `max-w-[1100px]` (1100px) |
| 4 | Card pattern | `bg-white border border-[#e8e4dd] rounded-xl` | `GlassPanel` (frosted, 18px radius) |
| 5 | Primary text | `text-[#292524]` (cool stone) | `GH.textPrimary` = `rgba(60,48,28,0.85)` (warm brown) |
| 6 | Secondary text | `text-[#5c5552]` (cool gray) | `GH.textSecondary` = `rgba(60,48,28,0.55)` |
| 7 | Border color | `border-[#e8e4dd]` | `GH.border` = `rgba(60,48,28,0.06)` |
| 8 | Hover state | `hover:bg-stone-50` | `GH.tileHover` = `rgba(60,48,28,0.03)` |
| 9 | Border radius | `rounded-xl` (12px) | `borderRadius: 18px` |
| 10 | Footer | Present (varying styles) | No footer on dashboard |
| 11 | Atmospheric blurs | None | Two fixed radial gradient overlays |
| 12 | Active nav state | `bg-blue-600 text-white` | Subtle warm hover, no heavy fills |
| 13 | Progress bar color | `bg-emerald-500` (green) | Purple gradient `#8b5cf6 → #a78bfa` |

---

### Page A: Forms Library (`src/pages/FormsLibraryPage.tsx`)

**Total deviations: 17**

| Priority | Line(s) | Current | Target |
|----------|---------|---------|--------|
| **High** | 201 | `bg-gradient-to-br from-[#FEFDFB]...` | `style={{ background: GH.pageBg }}` |
| **High** | 203–211 | Sticky blur header bar | Remove sticky bar; use inline flex header like dashboard |
| **High** | 239, 278 | `bg-white border border-[#e8e4dd] rounded-xl` | `<GlassPanel>` component |
| **High** | 218-220 | `text-[#292524]` | `style={{ color: GH.textPrimary }}` |
| **High** | 223, 256, 289, 298, 345, 388 | `text-[#5c5552]` | `style={{ color: GH.textSecondary }}` or `GH.textMuted` |
| **Med** | 204, 214 | `max-w-5xl` | `max-w-[1100px]` |
| **Med** | 247, 280, 305 | `border-[#e8e4dd]` | `style={{ borderColor: GH.border }}` |
| **Med** | 280-283 | Card header `px-5 py-4 border-b` | GlassPanel section header (10px uppercase) |
| **Med** | 248-249 | Active category `bg-blue-600 text-white` | Subtle active state: `GH.tileHover` background with `GH.textPrimary` |
| **Med** | 314 | Row `hover:bg-stone-50` | `GH.tileHover` hover |
| **Med** | 297 | Empty state icon `w-12 h-12` | `w-8 h-8` per design system |
| **Low** | 334-342 | File type colored badges | Simplify to dots or muted text |
| **Low** | 356-357 | Download button `text-[#5c5552]` | Blue-600 for interactive actions |
| **Low** | 406-410 | Footer section | Remove entirely |
| **Low** | 224-229 | Search input hard border | Glass-style input matching dashboard aesthetic |
| **Low** | — | No atmospheric background | Add `GH.atmosphereGold` + `GH.atmospherePurple` overlays |

---

### Page B: Certifications / Contracting Hub (`src/pages/ContractingHubPage.tsx`)

**Total deviations: 20**

| Priority | Line(s) | Current | Target |
|----------|---------|---------|--------|
| **High** | 397 | `bg-gradient-to-br from-[#FEFDFB]...` | `style={{ background: GH.pageBg }}` |
| **High** | 399–407 | Sticky blur header bar | Remove; inline flex header |
| **High** | 419, 535, 575 | `bg-white border border-[#e8e4dd] rounded-xl` | `<GlassPanel>` |
| **High** | 413-415 | `text-[#292524]` | `GH.textPrimary` |
| **High** | 425, 460, 510, 521, 525, 536-543, 578, 583, 591-596, 606, 630 | `text-[#5c5552]` | `GH.textSecondary` or `GH.textMuted` |
| **Med** | 400, 410 | `max-w-5xl` | `max-w-[1100px]` |
| **Med** | 429 | Progress bar `bg-emerald-500` | Purple gradient `linear-gradient(90deg, #8b5cf6, #a78bfa)` |
| **Med** | 466-499 | AHIP warning `bg-amber-50 border border-amber-200 rounded-lg` | `background: linear-gradient(135deg, rgba(184,134,11,0.06), rgba(212,160,23,0.03))`, `border-radius: 16px` |
| **Med** | 476-497 | Action buttons `rounded` (4px) with amber | Gold gradient CTAs, `rounded-xl` |
| **Med** | 590-597 | Table header `tracking-wider text-[#5c5552]` | `sectionHeaderStyle` tokens from golden-hour.ts |
| **Med** | 601 | Row `hover:bg-stone-50` | `GH.tileHover` |
| **Med** | 609-617 | Status icons `h-5 w-5`, `text-emerald-500` | `w-4 h-4`, `text-green-500`, dot pattern for status |
| **Med** | 577-584 | Empty state `p-6`, icon `h-5 w-5` | `py-12 px-5`, icon `w-8 h-8`, multi-line text |
| **Low** | 665-669 | Footer | Remove |
| **Low** | 518-528 | Dropdown `rounded-lg` | `borderRadius: 18px` |
| **Low** | 649 | "Request Contracting" `underline` | Remove underline, use `font-medium text-blue-600` |
| **Low** | — | No atmospheric background | Add overlays |

---

### Page C: Training

**Files:**
- `src/pages/TrainingPage.tsx`
- `src/components/training/TrainingLayout.tsx`
- `src/components/training/VideoContent.tsx`
- `src/components/training/VideoSidebar.tsx`
- `src/components/training/VideoPlayer.tsx`

**Total deviations: 21**

| Priority | File:Line(s) | Current | Target |
|----------|-------------|---------|--------|
| **High** | TrainingLayout:16 | `bg-gradient-to-br from-[#FEFDFB]...` | `style={{ background: GH.pageBg }}` |
| **High** | TrainingLayout:18-26 | Sticky blur header bar | Remove; inline flex header |
| **High** | VideoSidebar:28 | `bg-white border border-[#e8e4dd] rounded-xl` | `<GlassPanel>` |
| **High** | VideoContent:27 | `bg-white border border-[#e8e4dd] rounded-xl` | `<GlassPanel>` |
| **High** | VideoContent:22 | `text-[#292524]` | `GH.textPrimary` |
| **High** | VideoContent:36, VideoSidebar:45-48 | `text-[#5c5552]` | `GH.textSecondary` / `GH.textMuted` |
| **Med** | TrainingLayout:19, 28 | `max-w-5xl` | `max-w-[1100px]` |
| **Med** | TrainingLayout:29 | `gap-6` (24px) | `gap-3.5` (14px) per dashboard |
| **Med** | VideoSidebar:30-31 | Card header `font-serif text-lg font-semibold` | GlassPanel section header (10px uppercase) |
| **Med** | VideoSidebar:45-48 | Module label `bg-stone-50 tracking-wider` | Transparent bg, `sectionHeaderStyle` tokens |
| **Med** | VideoSidebar:65-66 | Active video `bg-blue-600 text-white` | Subtle active: `GH.tileHover` bg, `GH.textPrimary` text, left accent |
| **Med** | VideoSidebar:62 | Row `px-4 py-2.5` | `px-5 py-3` |
| **Med** | VideoSidebar:97-101 | Progress bar `h-2 bg-emerald-500` | `height: 4px`, purple gradient |
| **Med** | VideoContent:19 | Day label `text-blue-600` | `sectionHeaderStyle` muted uppercase |
| **Med** | VideoContent:42 | Next video card `hover:bg-stone-50` | `GH.tileHover` |
| **Med** | VideoContent:45 | "Up Next" label missing `font-semibold` | Add `fontWeight: 600` per `sectionHeaderStyle` |
| **Med** | VideoPlayer:11 | Shadow `rgba(0,0,0,0.08)` at 30px | `GH.glassShadow` = `rgba(60,48,28,0.04)` at 12px |
| **Low** | TrainingLayout:36-38 | Footer `py-8` | Remove |
| **Low** | VideoContent:55-59 | Completion banner with emoji, emerald colors | Remove emoji, use `text-green-500` and warm palette |
| **Low** | VideoSidebar:127-133 | Mobile button `rounded-lg shadow-lg` | Glass-style, `borderRadius: 18px` |
| **Low** | — | No atmospheric background | Add overlays |

---

## 4. Plan Finder — "Coming Soon" Overlay + Deactivate Tile

### Current State

| What | File | Lines |
|------|------|-------|
| Dashboard dock tile | `src/pages/Index.tsx` | 521 |
| `DockTile` component | `src/pages/Index.tsx` | 686–725 |
| `DockTileProps` interface | `src/pages/Index.tsx` | 687–694 |
| Route definition | `src/App.tsx` | 242–249 |
| Lazy import | `src/App.tsx` | 63 |
| Page component | `src/pages/PlanFinderPage.tsx` | 1–619 |
| Labs page reference | `src/pages/admin/LabsPage.tsx` | 16–22 |

### How Tile Navigation Works Now

The `DockTile` at Index.tsx:521:
```tsx
<DockTile icon={Search} label="Plan Finder" gradient="linear-gradient(135deg, #10b981, #059669)"
  shadow="0 2px 8px rgba(16,185,129,0.2)" to="/plan-finder" />
```

`DockTile` (Index.tsx:686-725) renders a `<Link to="/plan-finder">`. There is **no** disabled/coming-soon concept — no `disabled` prop, no conditional rendering, no badge support.

### Existing "Coming Soon" Pattern to Follow

`src/pages/SyncFlow.tsx:1346-1367` has `CarrierComingSoonTile`:
```
- opacity-60, cursor-not-allowed
- Lock icon in top-right corner
- "Coming soon" text label
- Renders a <div> instead of a <Link> (prevents navigation)
```

### What Needs to Change

**A. Modify `DockTile` component** (`src/pages/Index.tsx:686-725`):
- Add `comingSoon?: boolean` prop to `DockTileProps`
- When `comingSoon` is true:
  - Render a `<div>` instead of `<Link>` (prevents navigation)
  - Apply `opacity-50` and `cursor-not-allowed`
  - Add a small "Coming Soon" label below the tile label (or a badge overlay)
  - Optionally add a `Lock` icon

**B. Update Plan Finder tile** (`src/pages/Index.tsx:521`):
- Add `comingSoon` prop to the DockTile call

**C. Keep or remove the route** (`src/App.tsx:242-249`):
- **Recommended:** Keep the route for admin/testing access but the tile won't link to it
- Alternatively, wrap in `<ProtectedRoute requireAdmin>` so only admins can reach it via URL

**D. Fix Labs page broken link** (`src/pages/admin/LabsPage.tsx:18`):
- Change `path: '/admin/plan-finder'` to `path: '/plan-finder'` (currently a broken link)

### Other References to Gate

| Location | File | Action Needed |
|----------|------|---------------|
| Compliance page | `src/pages/CompliancePage.tsx:67` | No change — this links to external Medicare.gov, not the internal feature |
| UserAvatarDropdown | `src/components/UserAvatarDropdown.tsx` | No direct Plan Finder link — OK |
| AdminLayout sidebar | `src/components/layout/AdminLayout.tsx` | No Plan Finder link — OK |

---

## Recommended Order of Operations

### Phase 1: Quick Wins (30 min)

1. **Training Nav Bug** — Fix the Vimeo embed URL in `VideoPlayer.tsx:8` (1 file, 1 line). This is the smallest, most impactful fix.

2. **Plan Finder Gating** — Add `comingSoon` prop to `DockTile` + apply to Plan Finder tile (1 file). Fix Labs page broken link (1 file). Total: 2 files.

### Phase 2: Sync Reminder Verification (30 min)

3. **Sync Reminder** — Verify `useDashboardData.ts:161` uses `completed_at` for accurate status. Test the full sync → dashboard → banner-dismissed flow. Likely minimal or zero code changes needed — this may already work correctly.

### Phase 3: UI Consistency (2–3 hours)

4. **Shared foundation changes first** — These cascade to all three pages:
   - Import `GH` tokens and `GlassPanel` component into each page
   - Replace page backgrounds with `GH.pageBg`
   - Remove sticky headers, replace with inline flex headers
   - Remove footers
   - Update container widths to `max-w-[1100px]`

5. **Forms Library** — Replace cards with GlassPanel, update colors/borders/hover states, simplify badges.

6. **Contracting Hub** — Replace cards with GlassPanel, update table styles, fix progress bar, update AHIP banner, fix status indicators.

7. **Training** — Replace cards with GlassPanel across all 4 component files, update sidebar active states, fix progress bar, update spacing.

### Why This Order

- Phase 1 fixes user-facing bugs with minimal risk
- Phase 2 verifies an existing feature (may need no changes)
- Phase 3 groups all styling work together so you can batch-test visual consistency
- Within Phase 3, the shared changes (step 4) affect all pages, reducing per-page work in steps 5–7
- Training is last in Phase 3 because it has the most component files to touch

### Files Touched (Complete List)

| # | File | Items |
|---|------|-------|
| 1 | `src/components/training/VideoPlayer.tsx` | Training Nav Bug |
| 2 | `src/pages/Index.tsx` | Plan Finder (DockTile), Sync Reminder (if banner logic change needed) |
| 3 | `src/pages/admin/LabsPage.tsx` | Plan Finder (fix broken path) |
| 4 | `src/hooks/useDashboardData.ts` | Sync Reminder (verify `lastSyncAt` derivation) |
| 5 | `src/pages/FormsLibraryPage.tsx` | UI Consistency |
| 6 | `src/pages/ContractingHubPage.tsx` | UI Consistency |
| 7 | `src/pages/TrainingPage.tsx` | UI Consistency (minor) |
| 8 | `src/components/training/TrainingLayout.tsx` | UI Consistency |
| 9 | `src/components/training/VideoContent.tsx` | UI Consistency |
| 10 | `src/components/training/VideoSidebar.tsx` | UI Consistency |
| 11 | `src/components/training/VideoPlayer.tsx` | UI Consistency (shadow) |
| 12 | `src/App.tsx` | Plan Finder (optional route gating) |

**Total: 12 files**
