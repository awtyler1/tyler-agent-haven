# Agent Dashboard Responsive UI Audit

**Date:** February 5, 2026
**Status:** Analysis Complete - No Changes Made

---

## Executive Summary

The agent dashboard (`src/pages/Index.tsx`) is designed for desktop viewports (1920px+) with **no responsive breakpoints**. On laptop screens (1366-1440px), the Carrier Resources flyout overflows off-screen, making items inaccessible. The two-column layout does not adapt to smaller screens.

---

## 1. Dashboard Layout Structure

### File: `src/pages/Index.tsx`

**Layout Hierarchy:**
```
div.min-h-screen.bg-[#f9fafb].p-6
└── div.max-w-5xl.mx-auto                    ← Fixed 1024px max-width
    ├── header.flex.justify-between.mb-5     ← Header row
    ├── div.mb-5 (Stale banner - conditional)
    ├── p + h1 (Greeting)
    └── div.flex.gap-5                       ← TWO-COLUMN LAYOUT (no breakpoints)
        ├── div.flex-[2]                     ← Main beacon card (66%)
        └── div.flex-[1]                     ← Actions panel (33%)
```

**Container Constraints:**
- `max-w-5xl` = 1024px maximum width
- `p-6` = 24px padding on all sides
- `mx-auto` = horizontally centered

**Critical Issue:** The `flex gap-5` two-column layout uses `flex-[2]` and `flex-[1]` ratios with **zero responsive breakpoints**. This layout breaks on screens narrower than ~900px.

### Breakpoints Currently Used

| Breakpoint | Files Using It | Dashboard Usage |
|------------|----------------|-----------------|
| `sm:` (640px) | CarrierPortalsPage | **NOT USED** |
| `md:` (768px) | Various pages | **NOT USED** |
| `lg:` (1024px) | CarrierPortalsPage | **NOT USED** |
| `xl:` (1280px) | None in dashboard | **NOT USED** |
| `2xl:` (1536px) | tailwind.config (container) | **NOT USED** |

**Dashboard Index.tsx has ZERO responsive breakpoints.**

### Hardcoded Dimensions

| Element | Value | Line | Risk |
|---------|-------|------|------|
| Main card | `rounded-[2rem]` | 131 | Fixed 32px radius |
| Actions panel | `rounded-[2rem]` | 235 | Fixed 32px radius |
| Client number | `text-[10rem]` | 166 | **160px font - no scaling** |
| Card padding | `p-8` | 131 | Fixed 32px |
| Panel padding | `p-6` | 235 | Fixed 24px |
| Icon containers | `w-11 h-11` | 209, 367, 411, 488 | Fixed 44px |

---

## 2. Carrier Resources Flyout - Priority Bug

### Files Affected
- `src/pages/Index.tsx` lines 463-548 (`CarrierResourcesHoverButton`)
- `src/pages/Index.tsx` lines 387-451 (`HoverActionButton` - same pattern)

### Current Positioning Logic

```tsx
// Line 500-504
<div
  className={`absolute left-full top-0 ml-0 pl-3 z-50 transition-all duration-150 ${
    isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : '...'
  }`}
>
```

**Positioning breakdown:**
- `absolute` - Positioned relative to parent button container
- `left-full` - Places left edge at 100% of parent width (opens to the RIGHT)
- `top-0` - Aligns top of flyout with top of button
- `ml-0 pl-3` - Adds 12px visual gap with transparent padding for hover continuity
- `min-w-[220px]` - Flyout is at least 220px wide

### Why It Fails on Smaller Viewports

```
┌─────────────────────────────────────────────────────────┐
│                    1920px Desktop                        │
│                                                          │
│   ┌──────────────────────┐  ┌────────────┐              │
│   │   Main Card (66%)    │  │ Actions    │ ┌──────────┐ │
│   │                      │  │ Panel      │ │ Flyout   │ │
│   │                      │  │ (33%)      │ │ (220px)  │ │
│   │                      │  │            │ │ VISIBLE  │ │
│   └──────────────────────┘  └────────────┘ └──────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           1366px Laptop                │
│                                        │
│ ┌─────────────────┐ ┌─────────┐        │
│ │  Main Card      │ │ Actions │ ┌──────┼──────┐
│ │  (66%)          │ │ Panel   │ │Flyout│      │
│ │                 │ │ (33%)   │ │OFF   │SCREEN│
│ │                 │ │         │ │      │      │
│ └─────────────────┘ └─────────┘ └──────┼──────┘
│                                        │
└────────────────────────────────────────┘
```

**Root cause:** The actions panel is positioned on the right side of the viewport. When the flyout opens to the right (`left-full`), there's no space remaining. The flyout extends past the viewport edge.

### Missing Features
1. **No collision detection** - Doesn't check if flyout will overflow viewport
2. **No side preference** - Always opens right, never left
3. **No viewport-aware positioning** - Unlike Radix Popover (available in codebase)

### Comparison: SyncStatusPill (Correct Pattern)

`src/components/dashboard/SyncStatusPill.tsx` uses:
```tsx
// Line 89
<div className="absolute top-full right-0 mt-2 w-72 ...">
```

This dropdown opens **below** and **aligns to the right edge** - staying within viewport bounds.

---

## 3. Viewport Responsiveness Issues

### Two-Column Layout

**Current (line 129):**
```tsx
<div className="flex gap-5">
  <div className="flex-[2] ...">  {/* Main card */}
  <div className="flex-[1] ...">  {/* Actions */}
</div>
```

**Issues:**
- No `flex-col` on smaller screens
- No breakpoint to stack columns vertically
- Cards will compress until content overflows

### Large Typography

**Client count (line 166):**
```tsx
<span className="text-[10rem] ...">
  {data.totalClients}
</span>
```

- 160px fixed font size
- No responsive scaling (`md:text-[8rem] sm:text-[6rem]`)
- On mobile, this single number could fill the entire viewport

### Carrier Pills Row (line 189)

```tsx
<div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 flex-wrap ...">
```

This uses `flex-wrap` which is good, but individual carrier badges are ~100px each. With 6+ carriers, wrapping could look awkward.

### Stale State Banner (lines 98-121)

Uses `flex items-center justify-between` with no responsive handling. On narrow screens, the button text and layout will compress poorly.

### CarrierResourcesPage.tsx Issues

**Line 147:**
```tsx
<div className="grid grid-cols-2 gap-6">
```

Fixed 2-column grid with no responsive breakpoints. Should be `grid-cols-1 md:grid-cols-2`.

**Line 67-88 (Carrier Pills):**
```tsx
<div className="inline-flex bg-white rounded-full p-1.5 ...">
```

Horizontal inline-flex with no overflow handling. If agent has 8+ carriers, pills will overflow container.

---

## 4. Design System Deviations

### From DESIGN_SYSTEM.md

| Pattern | Design System | Dashboard Implementation |
|---------|---------------|--------------------------|
| Card radius | `rounded-xl` | `rounded-[2rem]` (larger) |
| Card shadow | `shadow-sm` | `shadow-2xl` (heavier) |
| Card border | `border-border/50` | `border-slate-100` |
| Background | `bg-gradient-to-br from-[#FEFDFB]...` | `bg-[#f9fafb]` (different) |
| Page padding | Not specified | `p-6` fixed |

**Note:** These aren't necessarily wrong - the dashboard uses an intentionally "beacon" design with heavier shadows and larger radii. But there are no responsive utilities documented.

### Missing from Design System

The design system (`DESIGN_SYSTEM.md`) has **no documented responsive patterns**:
- No breakpoint standards
- No mobile-first guidelines
- No component responsive variants

---

## 5. Prioritized Issues & Recommended Fixes

### P0 - Critical (Blocking)

| Issue | Location | Recommended Fix |
|-------|----------|-----------------|
| **Carrier Resources flyout off-screen** | Index.tsx:500 | Replace custom positioning with Radix HoverCard (already in codebase) with `side="left"` when near right edge, or add viewport boundary detection |
| **Quick Quote flyout off-screen** | Index.tsx:423 | Same fix as above |

### P1 - High (Broken on 1366px laptops)

| Issue | Location | Recommended Fix |
|-------|----------|-----------------|
| Two-column layout doesn't stack | Index.tsx:129 | Add `flex-col lg:flex-row` |
| Giant number doesn't scale | Index.tsx:166 | Add `text-[6rem] md:text-[8rem] lg:text-[10rem]` |
| Actions panel too narrow | Index.tsx:235 | Ensure minimum touch targets when stacked |

### P2 - Medium (Usability)

| Issue | Location | Recommended Fix |
|-------|----------|-----------------|
| CarrierResourcesPage 2-col grid | CarrierResourcesPage.tsx:147 | Add `grid-cols-1 md:grid-cols-2` |
| Carrier pills horizontal overflow | CarrierResourcesPage.tsx:67 | Add `overflow-x-auto` or wrap with scroll |
| Stale banner doesn't wrap | Index.tsx:98 | Add responsive flex direction |

### P3 - Low (Polish)

| Issue | Location | Recommended Fix |
|-------|----------|-----------------|
| Goal progress card padding | Index.tsx:206 | Reduce on small screens |
| Header gap spacing | Index.tsx:74 | Reduce gap on mobile |
| Badge font sizes | Index.tsx:149 | Scale down on mobile |

---

## 6. Recommended Fix Approach

### For Flyout (P0)

**Option A: Use Radix HoverCard (Preferred)**
```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

// Replace custom div-based hover with:
<HoverCard openDelay={0} closeDelay={150}>
  <HoverCardTrigger asChild>
    <button className="...">Carrier Resources</button>
  </HoverCardTrigger>
  <HoverCardContent side="right" sideOffset={12} collisionPadding={16}>
    {/* Flyout content */}
  </HoverCardContent>
</HoverCard>
```

Radix automatically handles collision detection and flips to `side="left"` when needed.

**Option B: Manual Boundary Detection**
```tsx
// Add ref and calculate position
const buttonRef = useRef<HTMLDivElement>(null);
const [openLeft, setOpenLeft] = useState(false);

useEffect(() => {
  if (buttonRef.current) {
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    setOpenLeft(spaceRight < 240); // 220px flyout + 20px buffer
  }
}, [isOpen]);

// Then conditionally position
className={`absolute ${openLeft ? 'right-full mr-3' : 'left-full ml-0 pl-3'} top-0 ...`}
```

### For Two-Column Layout (P1)

```tsx
// Line 129: Change from
<div className="flex gap-5">

// To
<div className="flex flex-col lg:flex-row gap-5">

// And update children
<div className="w-full lg:flex-[2] ...">  {/* Main card */}
<div className="w-full lg:flex-[1] ...">  {/* Actions */}
```

### For Typography Scaling (P1)

```tsx
// Line 166: Change from
<span className="text-[10rem] ...">

// To
<span className="text-[5rem] sm:text-[7rem] md:text-[8rem] lg:text-[10rem] ...">
```

---

## 7. Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/pages/Index.tsx` | Flyout fix, responsive layout, typography scaling |
| `src/pages/CarrierResourcesPage.tsx` | Responsive grid, carrier pills overflow |
| `DESIGN_SYSTEM.md` | Add responsive patterns section |

---

## 8. Testing Checklist

After implementing fixes, verify at these viewports:

- [ ] 1920px - Desktop (current design)
- [ ] 1440px - Large laptop
- [ ] 1366px - Standard laptop (most common issue viewport)
- [ ] 1280px - Small laptop
- [ ] 1024px - Tablet landscape / small laptop
- [ ] 768px - Tablet portrait
- [ ] 375px - Mobile (if supporting)

---

## Appendix: Component Location Reference

| Component | File Path | Lines |
|-----------|-----------|-------|
| Agent Dashboard | `src/pages/Index.tsx` | 1-549 |
| CarrierResourcesHoverButton | `src/pages/Index.tsx` | 463-548 |
| HoverActionButton | `src/pages/Index.tsx` | 387-451 |
| ActionButton | `src/pages/Index.tsx` | 357-377 |
| EmptyStateCTA | `src/pages/Index.tsx` | 304-346 |
| SyncStatusPill | `src/components/dashboard/SyncStatusPill.tsx` | 1-168 |
| Carrier Resources Page | `src/pages/CarrierResourcesPage.tsx` | 1-215 |
| Carrier Portals Page | `src/pages/CarrierPortalsPage.tsx` | 1-146 |
| Radix HoverCard | `src/components/ui/hover-card.tsx` | 1-28 |
| Radix Popover | `src/components/ui/popover.tsx` | 1-30 |
| Design System | `DESIGN_SYSTEM.md` | - |
| Tailwind Config | `tailwind.config.ts` | 1-131 |
| Global Styles | `src/index.css` | 1-731 |
