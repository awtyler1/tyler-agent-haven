# HOMESTEAD

### The TIG Platform Design System

> *The parchment is the land. The charcoal sidebar is the structure. The gold is what you've earned. The number is the harvest.*

Homestead is the design language for the TIG Platform — an agent management system built for Medicare brokers aged 45–65. Every decision in this document exists because it solves a real problem for a real person selling Medicare plans from a kitchen table in Kentucky.

**Read this file before building any page, component, or feature.**

---

## 1. IDENTITY

**Who we're building for:** Independent Medicare brokers. Solo operators. They manage 50–500+ clients, juggle 6+ carrier portals daily, and their book of business IS their retirement plan. They're not scared of technology — they just don't have patience for technology that wastes their time.

**What we feel like:** A well-built desk in a warm office. Not a Silicon Valley SaaS dashboard. Not a sterile medical portal. We feel like something you'd be proud to show a client — premium, warm, and grounded.

**What we don't feel like:** Blue/white generic insurance portals (that's every competitor). Dark mode developer tools. Flashy startup energy. Anything that feels temporary.

**Design principles:**
1. **The number comes first.** Everything exists to grow the agent's book. If a feature doesn't connect back to that, question it.
2. **Warm over cool.** Parchment over white. Gold over blue. Serif warmth over sans-serif sterility.
3. **Built, not assembled.** Every page should feel like it came from the same hand. No component should look borrowed from a template.
4. **Quiet confidence.** Premium is felt, not announced. No gradients-for-gradients-sake, no excessive animation, no "look how modern we are."
5. **Respect the agent's time.** High-frequency tools at the top. Short labels. One-click access. Every extra click is a broken promise.

---

## 2. COLOR TOKENS

Use CSS custom properties. Never hardcode hex values in components.

### Core Palette

```css
:root {
  /* Surfaces */
  --bg:            #F3EDE3;   /* Parchment — primary background */
  --bg-subtle:     #EDE7DB;   /* Slightly darker parchment — shelves, strips, secondary zones */
  --bg-muted:      #E4DDD0;   /* Muted parchment — borders, tracks, dividers */
  --bg-card:       #FFFFFF;   /* White — cards, pills, elevated surfaces */
  --bg-warm-glow:  #F8F2EA;   /* Warm center — radial gradient focal point */

  /* Sidebar */
  --sidebar:       #28262A;   /* Charcoal — sidebar background */
  --sidebar-border:#3A373E;   /* Sidebar dividers and borders */
  --sidebar-hover: rgba(255,255,255,0.05);  /* Nav hover state */
  --sidebar-text:  #8A858F;   /* Default nav text */
  --sidebar-text-active: #E8E2D6;  /* Active nav text */
  --sidebar-section-label: #5A5660; /* Section labels (Sell, Manage) */

  /* Brand — Gold */
  --gold:          #C9A84C;   /* Primary gold — accents, active indicators, milestone fills */
  --gold-dark:     #8A6D20;   /* Deep gold — text emphasis, gradient endpoints, greeting name */
  --gold-active-bg: rgba(201,168,76,0.13);  /* Active nav background tint */

  /* Text */
  --text-primary:  #2B2B22;   /* Primary body text — near-black with warmth */
  --text-muted:    #A89A84;   /* Secondary text — labels, captions, dates */
  --text-faint:    #BEB3A2;   /* Tertiary — disabled, placeholder */

  /* Semantic */
  --green:         #6B8A42;   /* Positive — growth, fresh sync, delta up */
  --green-bg:      rgba(107,138,66,0.1);  /* Green pill background */
  --amber:         #B8944A;   /* Warning — stale sync, approaching deadline */
  --red:           #C44A3F;   /* Critical — overdue, error, urgent action */
  --blue:          #4A7FB5;   /* Informational — reminders, neutral notices */

  /* Motion */
  --ease:          cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard easing */
  --fast:          0.15s;     /* Micro interactions: hover color, opacity */
  --med:           0.3s;      /* Macro interactions: transforms, layout shifts */
}
```

### Color Rules
- **Blue is for interactive elements only** (links, buttons). Never decorative.
- **Gold is for brand moments only** (active states, avatars, milestone progress, logo). Never for buttons — it's earned, not clicked.
- **White (#FFFFFF) cards** on parchment — this is the primary content surface pattern.
- **Never use pure black (#000).** Darkest value is `--text-primary` (#2B2B22).
- **Never use pure white (#FFF) as a background.** Lightest full-surface value is `--bg` (#F3EDE3).

### Carrier Brand Colors
These are text colors for carrier-specific elements (pills, labels). Never used as backgrounds.

```css
--carrier-humana:   #3A9A34;
--carrier-aetna:    #6B2580;
--carrier-anthem:   #0033A0;
--carrier-uhc:      #002677;
--carrier-wellcare:  #007A72;
--carrier-devoted:  #B8292F;
```

Carrier pill hover states use the brand color at 4–5% opacity as background:
```css
.humana:hover { background: rgba(58,154,52,0.05); }
```

---

## 3. TYPOGRAPHY

### Font Stack
```css
--font-sans:  'Outfit', system-ui, -apple-system, sans-serif;
--font-serif: 'Lora', Georgia, 'Times New Roman', serif;
```

**Load weights:**
- Outfit: 300, 400, 500, 600, 700, 800
- Lora: 400, 500, 600, 700 (regular + italic)

### Type Scale

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Hero number | Lora | min(134px, 14.5vh) | 700 | Book count centerpiece |
| Page greeting | Lora | 25px | 400 | "Good morning, *Austin*" |
| Section heading | Outfit | 16–18px | 600 | Card headers, page titles |
| Body | Outfit | 13px | 400–500 | Default body text |
| Small label | Outfit | 11–12px | 500–600 | Dates, badges, metadata |
| Micro label | Outfit | 9–10px | 600 | Section labels, uppercase labels |
| Nav item | Outfit | 12.5px | 500 (700 active) | Sidebar navigation |

### Type Rules
- **Lora (serif) is for moments of warmth:** greetings, hero numbers, milestones. It says "this is personal."
- **Outfit (sans) is for everything functional:** navigation, labels, body text, buttons. It says "this gets work done."
- **Never use Lora for buttons, form labels, or navigation.** It's too personal for action contexts.
- **Italic Lora** is reserved for the user's name in greetings. No other italic usage.
- **Letter-spacing:** Tight on large type (-0.04em on hero), slightly tracked on uppercase microlabels (0.08–0.1em). Never track body text.
- **All labels under 12 characters.** If it doesn't fit, rewrite it. "Carrier Resources" → "Carriers". "Learning Library" → "Training".

---

## 4. SPACING SYSTEM

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, icon margins |
| `--space-2` | 8px | Inner padding, compact gaps |
| `--space-3` | 12px | Standard gaps between related elements |
| `--space-4` | 16px | Card internal padding, section gaps |
| `--space-5` | 20px | Page header top padding |
| `--space-6` | 24px | Generous section margins |
| `--space-8` | 32px | Page-level horizontal padding |
| `--space-10` | 40px | Major section separations |

### Layout Constants
```
Sidebar width:     194px
Sidebar inset:     10px (from all viewport edges)
Sidebar radius:    14px
Page padding:      20px top, 32px horizontal
Card radius:       12px (large), 8px (medium), 20px (pill)
Card shadow:       0 1px 3px rgba(0,0,0,0.04)
Card padding:      px-5 py-4 for headers (20px / 16px)
```

### Spacing Rules
- **Optical, not mathematical.** Large numbers have built-in whitespace below — tighten the gap. Small text needs more breathing room.
- **Related elements are closer together** than unrelated ones. A label and its value = 4px. Two different data groups = 16px.
- **Consistent page margins.** Every page uses 32px horizontal padding on the main content area.

---

## 5. LAYOUT

### Page Structure
Every page follows this skeleton:

```
┌─ viewport (10px padding all sides) ─────────────────────┐
│ ┌─ sidebar ─┐  ┌─ main ──────────────────────────────┐  │
│ │  (194px)   │  │  header (greeting + actions)        │  │
│ │  floating  │  │  ─────────────────────────────────  │  │
│ │  charcoal  │  │  content area                       │  │
│ │  rounded   │  │  (varies per page)                  │  │
│ │            │  │                                     │  │
│ │            │  │  ─────────────────────────────────  │  │
│ │  user card │  │  footer strip (if applicable)       │  │
│ └────────────┘  └─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Sidebar is **always present**, always floating, always charcoal.
- Main content background is **always `--bg`** (#F3EDE3 parchment).
- The sidebar and main content are separated by the 10px viewport gap — no additional divider needed.

### Sidebar Specification

```
Width: 194px
Background: var(--sidebar) #28262A
Border-radius: 14px
Shadow: 0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)
```

**Brand area:** Logo (28px gold gradient square, 8px radius) + "TIG" small caps. Border-bottom separates from nav.

**Navigation:** 11 items, 2 groups (Sell: 5, Manage: 6). Section labels at 9px, uppercase, #5A5660. Items have 15px icons (stroke-width 1.7), 12.5px labels.

**Active state:** Gold left bar (3px × 16px, #C9A84C), tinted background (rgba gold 13%), weight 700, light text.

**External links:** Dimmer default color (#635F68), ↗ indicator right-aligned. Three externals: SunFire, Connecture, BOSS CRM.

**User card:** Bottom of sidebar. Gold gradient avatar circle (26px) with initials. Name + role. Subtle background on hover.

### Navigation Order (workflow-based)

**Sell** — Research → Quote → Enroll → Support:
1. Home (house)
2. Plan Finder (magnifying glass)
3. SunFire ↗ (flame)
4. Connecture ↗ (grid)
5. Carriers (shield + cross)

**Manage** — Daily clients → Track → Money → Admin → Learn:
6. My Book (open book)
7. BOSS CRM ↗ (contact card)
8. Commissions (dollar sign)
9. Contracting (pen on paper)
10. Forms (clipboard)
11. Training (graduation cap)

### Page Full-Height Pattern

AgentShell's `<main>` is a flex column container (`display: flex; flex-direction: column`). Any page that needs to fill the full content area height should use this pattern on its outermost wrapper:

```css
/* Page wrapper */
flex: 1 1 auto;
display: flex;
flex-direction: column;
min-height: 0;        /* prevents flex item overflow */
```

This enables:
- **Bottom-pinned elements** (footers, strips) via `flex-shrink: 0` on the bottom element
- **Vertically centered content** via `flex: 1 1 auto; justify-content: center` on the middle section
- **Full-height backgrounds** (gradients, radial warmth) that span the visible area

Pages that don't need full-height control can ignore this — block content renders normally as a flex child.

**Reference implementation:** Dashboard (`src/pages/Index.tsx`) — hero number centered with carrier strip pinned to bottom.

---

## 6. COMPONENTS

### Cards
The primary content container on all pages.

```css
.card {
  background: var(--bg-card);       /* white */
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;                    /* standard internal */
}
.card-header {
  padding: 16px 20px;              /* px-5 py-4 */
  border-bottom: 1px solid var(--bg-muted);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
```

- **No colored borders.** Cards are white on parchment — the shadow and radius provide sufficient distinction.
- **Card headers** are Outfit 14px 600 weight with a subtle bottom border.
- **Never stack more than 3 levels of elevation.** Page → card → element inside card. That's it.

### Pills / Badges
Small status indicators.

```css
.pill {
  padding: 5px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
/* Carrier pill variant */
.carrier-pill {
  padding: 7px 14px;
  background: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  /* color: carrier brand color */
}
```

### Progress Bars
```css
.track {
  height: 6px;
  background: var(--bg-muted);
  border-radius: 3px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--gold-dark), var(--gold));
  transition: width 1.2s var(--ease);
}
```

### Buttons

```css
/* Primary — blue, for main actions */
.btn-primary {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: #4A7FB5;
  color: white;
  cursor: pointer;
  transition: background var(--fast) var(--ease);
}
.btn-primary:hover { background: #3A6FA5; }

/* Secondary — outlined, for supporting actions */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--bg-muted);
  color: var(--text-muted);
  /* same padding/radius as primary */
}
.btn-secondary:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}
```

- **Gold is never a button color.** Gold = brand/achievement. Blue = action.
- **Buttons are 8px radius** (not fully rounded like pills).

### Tables / Lists
```css
.table-row {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--bg-muted);
  transition: background var(--fast) var(--ease);
}
.table-row:hover { background: var(--bg-subtle); }
.table-row:last-child { border-bottom: none; }
```

### Empty States
When a section has no data yet:
```
- Centered in the content area
- Outfit 14px, --text-muted color
- Brief helpful message (1 line, not a paragraph)
- Optional: single action button below
- No illustrations, no icons, no cute graphics
```

### Upload Drop Zone
Drag-and-drop file upload target.

```css
.drop-zone {
  border: 2px dashed var(--bg-muted);       /* Default border */
  border-radius: 10px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  background: var(--bg);
  transition: all var(--med) var(--ease);
}
.drop-zone.drag-over {
  border-color: var(--gold);
  background: rgba(201,168,76,0.03);
}
```

- **Icon:** Upload arrow (22px) in a 48px gold-gradient circle above the text.
- **Label:** "Drop your file here or **browse**" — browse in blue.
- **Subtext:** File format hints (11.5px, `--text-faint`).
- **Validation errors** shown as amber inline text below the zone.

### Carrier Sync Tiles
Grid of per-carrier import cards.

```css
.carrier-tile {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all var(--med) var(--ease);
  position: relative;
  overflow: hidden;
}
.carrier-tile.synced {
  border: 2px solid rgba(107,138,66,0.2);
}
.carrier-tile.drag-over {
  border: 2px solid var(--gold);
  transform: scale(1.02);
}
```

- **Layout:** `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`.
- **Stagger entrance:** `importFadeUp 0.35s` with `0.05s × index` delay.
- **Synced state:** Green top bar (3px), green check badge, "Re-sync" link in blue.
- **Unsynced state:** Dashed drop zone inside tile, clock icon badge.
- **Carrier dot:** 10px circle in carrier brand color.

### Processing Stepper
Animated step list during file upload.

```css
.step-icon { width: 24px; height: 24px; border-radius: 50%; }
.step-icon.done    { background: var(--green-bg); }
.step-icon.active  { background: rgba(201,168,76,0.15); }
.step-icon.pending { background: var(--bg-subtle); }
```

- **Steps appear** with `importStepFadeIn 0.3s` as they become visible.
- **Spinner** above steps: 48px circle, `--bg-muted` border, `--gold` top, `importSpin 0.8s linear infinite`.
- **Error state:** Spinner replaced with 56px red circle + X icon (`importPopIn 0.4s`). Steps hidden. Error message + "Try again" / "Back" buttons shown.
- **Timeout:** After 30s, show "Large files can take a moment… **Cancel**".

### Success / Celebration Screen
Post-import success with hero number and milestone progress.

- **First-time variant:** Radial warm glow, popIn check (72px green circle), "Your book is here, *Name*" (Lora italic), hero count-up number, "Your book is home" green pill, "View My Book" blue button.
- **Monthly sync variant:** PopIn check (64px), count-up hero number, delta pill ("↑ N new from Carrier"), breakdown row (New | Updated), milestone progress bar, "Back to Import" + "View My Book" buttons.
- **Count-up:** `easeOutQuart` over 1s, 400ms initial delay.
- **Stagger:** Check → number → label → pill → bar → buttons at ~0.1–0.15s intervals.

### Inline Mismatch Banner
Warning card when file format doesn't match expected carrier.

```css
.mismatch-card {
  max-width: 480px;
  padding: 28px;
  border-radius: 12px;
  background: rgba(184,148,74,0.04);
  border: 1px solid rgba(184,148,74,0.2);
  animation: importFadeUp 0.4s var(--ease) forwards 0.1s;
}
```

- **Layout:** AlertTriangle icon (amber) + title + description, then action buttons.
- **Actions:** Primary "Use as [Carrier]" (blue), secondary "Continue anyway" (outlined), tertiary "Cancel import" (text-only).

### Form Inputs
```css
.input {
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 10px 14px;
  border: 1px solid var(--bg-muted);
  border-radius: 8px;
  background: white;
  color: var(--text-primary);
  transition: border-color var(--fast) var(--ease);
  outline: none;
  width: 100%;
}
.input:focus { border-color: var(--gold); }
.input::placeholder { color: var(--text-faint); }
```

- **Focus state is gold border** — consistent with the active indicator language.
- **No box shadows on focus.** Just the border color change. Clean.

---

## 7. ICONS

**Source:** Inline SVGs, Lucide-style (24×24 viewBox, stroke-based).

**Standard size:** 15px with stroke-width 1.7 (sidebar nav). Scale to 18–20px for content area icons.

### Icon Rules
- Every nav item has a unique icon that passes the **"cover the text" test** — you should be able to identify the tool by icon shape alone.
- External links get a ↗ text indicator (8px, right-aligned), NOT an icon replacement.
- Icons are **stroke-only**, never filled. Fill implies selection/active — we handle that with color and weight.
- Prefer concrete metaphors over abstract shapes: dollar sign for money, shield for insurance, flame for SunFire.

### Assigned Icons (locked)

| Item | Icon | Rationale |
|------|------|-----------|
| Home | House | Universal |
| Plan Finder | Magnifying glass | Searching plans |
| SunFire | Flame | It's in the name |
| Connecture | Grid (4 squares) | App/platform launcher |
| Carriers | Shield + cross | Health insurance |
| My Book | Open book | Literal "book" of business |
| BOSS CRM | Person in card | Contact management |
| Commissions | Dollar sign | Money, earnings |
| Contracting | Pen on document | Signing contracts |
| Forms | Clipboard | Paperwork |
| Training | Graduation cap | Learning/certification |

---

## 8. MOTION & ANIMATION

### Timing
Two speeds. One curve. No exceptions.

```css
--fast: 0.15s;  /* Micro: color change, opacity, hover feedback */
--med:  0.3s;   /* Macro: transforms, slides, layout transitions */
--ease: cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard */
```

### Patterns

**Fade-up entrance** — used for staggered content loading:
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Stagger: 0.1s, 0.3s, 0.45s, 0.55s, 0.7s */
```

**Pop-in entrance** — used for celebration elements (check marks, icons):
```css
@keyframes popIn {
  from { opacity: 0; transform: scale(0.3); }
  60%  { transform: scale(1.05); }
  to   { opacity: 1; transform: scale(1); }
}
```

**Step fade-in** — used for sequential step reveals:
```css
@keyframes stepFadeIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

**Landing bounce** — used when a count-up animation reaches its target:
```css
@keyframes landBounce {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.012); }
  100% { transform: scale(1); }
}
```

**Count-up** — easeOutQuart over 1s for hero numbers:
```javascript
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
```

**Hover lifts** — carrier pills and cards lift 3px with enhanced shadow:
```css
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
```

### Animation Rules
- **Never animate more than 2 properties simultaneously** on a single element.
- **Entrance animations are one-time.** No looping, no pulsing, no attention-seeking.
- **No animation on navigation clicks.** Page transitions should feel instant. Content can fade-up, but the shell (sidebar + header) is always stable.
- **Progress bars animate on first load only.** Subsequent visits show the bar at its current state without re-animating.

---

## 9. ACCESSIBILITY

### Keyboard
- All interactive elements must have **focus-visible** states:
  ```css
  :focus-visible { box-shadow: 0 0 0 2px var(--gold); outline: none; }
  ```
- Tab order follows visual order. Sidebar first, then main content top-to-bottom.
- External links include `aria-label` explaining they open external sites.

### Color Contrast
- `--text-primary` on `--bg` = 9.2:1 ✓ (AAA)
- `--text-muted` on `--bg` = 3.8:1 ✓ (AA large text — this is the minimum. Use for labels only, never body text.)
- `--gold-dark` on `--bg` = 4.6:1 ✓ (AA)
- `--green` on `--bg` = 4.1:1 ✓ (AA large text)

### Semantic HTML
- Sidebar is `<nav>` with `role="navigation"` and `aria-label="Main navigation"`.
- Main content is `<main>`.
- Use `<a>` for navigation, `<button>` for actions. Never interchange them.

### Screen Readers
- Icon-only elements need `aria-label`.
- Decorative SVGs get `aria-hidden="true"`.
- Status badges (sync, delta) should have descriptive text, not just color.

---

## 10. PAGE PATTERNS

### Dashboard (Home) — The Cockpit
The hub home (`src/pages/Index.tsx`) is **The Cockpit**: two permanent job-zones
(**This Week** = what needs you, **Worth reading** = what's worth knowing) with a
permanent frame and **no page scroll** on desktop. It never changes shape as
content changes. This is a locked pattern — see **§14. THE COCKPIT** for the full
spec and the four rules that keep it stable. Do not add blocks to the dashboard
flow; content goes *into* a zone, never *between* zones.

### List Pages (My Book, Forms, Contracting)
- **Page header:** Page title (Outfit 18px 600) + action button on right.
- **Filter/search bar:** Full width, white card with input + filter pills.
- **Table:** White card with header row (Outfit 11px, uppercase, --text-muted) and data rows.
- **Pagination:** Simple "Showing 1–25 of 347" with previous/next.

### Detail Pages (Client Profile, Carrier Detail)
- **Breadcrumb:** Small, muted, top of content area. "My Book > Martha Johnson"
- **Hero card:** White card spanning full width with key info.
- **Tabbed sections:** If needed, use a simple underline tab pattern (not pills, not cards).
- **Sidebar metadata:** If the page needs secondary info (carrier details, dates), use a right column at 280–320px.

### Form Pages (Contracting, Settings)
- **Section-based layout:** Group related fields in white cards with section headings.
- **Labels above inputs** (never inline/floating labels — our users are 45–65, clarity over cleverness).
- **Actions sticky at bottom** or clearly visible without scrolling.

### Import Page (Book Import)
Multi-mode page with 6 visual states managed by a state machine hook (`useBookImport`).

**Modes:** `carrier-grid` → `processing` → `mismatch?` → `summary` → `success`; plus `bulk-upload` as an alternate entry point.

- **Carrier Grid:** Sync progress strip + carrier tile grid + bulk import card. Tiles stagger-animate on mount.
- **Bulk Upload:** Centered white card with Upload Drop Zone + auto-detect format strip.
- **Processing:** Centered spinner + step list. Error variant replaces spinner with red X.
- **Mismatch:** Centered amber warning card with two action options + cancel.
- **Summary:** Centered white card with stats grid (new/updated/skipped). Edge cases: empty file (muted icon, "No records"), all-skipped (amber icon, auto-expanded skip details, no commit button).
- **Success:** Full-height radial warm glow with popIn check + count-up hero number + milestone bar.

**Reference implementation:** `src/pages/book/BookImportPage.tsx`

---

## 11. DO'S AND DON'TS

### Do
- ✅ Reference this file before building any new page
- ✅ Use CSS custom properties for all colors
- ✅ Keep labels short — one word when possible
- ✅ Test at 1280×800 minimum (common laptop)
- ✅ Use Outfit for UI, Lora for personality moments
- ✅ Place high-frequency actions at top of navigation
- ✅ Make every interactive element keyboard-accessible
- ✅ Use the carrier brand colors as text, never backgrounds

### Don't
- ❌ Introduce new colors without adding them here first
- ❌ Use gold for buttons (gold = earned, blue = action)
- ❌ Use Lora for functional text (buttons, labels, nav)
- ❌ Add looping animations or pulsing indicators
- ❌ Use rounded-full (999px) radius on cards (only pills and avatars)
- ❌ Put more than 11 items in the sidebar
- ❌ Use shadows heavier than `0 6px 16px rgba(0,0,0,0.08)`
- ❌ Use pure black or pure white anywhere
- ❌ Float the sidebar flush to viewport edges (maintain 10px inset)
- ❌ Add section labels or headers inside the nav beyond "Sell" and "Manage"

---

## 12. FILE REFERENCE

**Dashboard (reference implementation):** `dashboard-final.html`

This file is the canonical expression of Homestead. When in doubt about how something should look, reference the dashboard first.

---

## 13. ADDING TO HOMESTEAD

When you make a design decision on a new page that introduces a new pattern, component, or rule:

1. Build it in the page
2. Extract the pattern into this document
3. Give it a clear name and usage rule
4. Note what it replaces or extends

This document grows with the platform. It's not a snapshot — it's a living foundation.

---

## 14. THE COCKPIT (Dashboard build philosophy)

> **Why this exists:** the dashboard used to be a vertical stack of optional
> blocks. Each block appeared only when it had content, and two were date-filtered
> at runtime, so the page changed shape on its own as the calendar rolled. Brokers
> logging in under pressure never built muscle memory, and adding content reshaped
> the page. The Cockpit ends that. **The frame is permanent; only the readings
> inside it change.**

**Reference implementation:** `src/pages/Index.tsx` + `src/components/hub/BoardZone.tsx`.

### The promise

- **Above the fold, always.** On desktop the dashboard fills the viewport with
  **zero page scroll**. A broker never scrolls or hunts, and never wonders if
  they're missing something. Verified down to 1366×768 (the most common broker
  laptop).
- **The shape never moves.** A quiet week and a busy week are the same layout.
  Empty zones show a resting line; they never collapse and pull the page up.

### The four rules (non-negotiable)

Every zone on the dashboard — and any future zoned page — obeys these. They are
enforced in code by the `<BoardZone>` primitive, so an edit *cannot* reintroduce
the shift.

1. **Reserved slots.** Every zone always renders its frame. Nothing is
   conditionally mounted into the layout flow. A zone never returns `null`.
2. **Resting states.** An empty zone shows a calm one-line message
   (`empty="…"`), not a collapse. Reserved space is held.
3. **Fixed order.** Priority is designed once, by grid placement, never emergent
   from which blocks happen to have content.
4. **Hard caps.** A zone shows at most `cap` items, then an explicit
   "View all N →" link. Overflow is **signposted, never a silent scrollbar** and
   never spilled down the page.

### Zone map — two jobs, two zones (the locked template)

A broker home answers exactly two questions: **what needs me** (act), and
**what's worth knowing** (read). We map one zone to each. We do *not* split by
data source (bulletins vs calendar vs articles) — that's what produced three
near-identical "look at this" cards and duplicate items. Two job-zones, no
overlap.

```
┌─ header: greeting + AEP countdown pill (the only fixed strip) ──────────────┐
├───────────────────────────────────────┬────────────────────────────────────┤
│ ① THIS WEEK — what needs you (emerald) │ ② WORTH READING (white card)        │
│   season strip (always) +              │   ONE rotating lead:                │
│   pinned bulletins + next-7-day        │   AEP-training drive when live,     │
│   calendar, MERGED + de-duplicated,    │   else the featured item;           │
│   compact rows, cap 4 events           │   then recent updates, cap 4        │
│   → View full calendar                 │   → All updates                     │
└───────────────────────────────────────┴────────────────────────────────────┘
```

| Zone | Variant | Holds | Cap | Overflow → |
|------|---------|-------|-----|------------|
| ① This Week | `dark` | Season strip + pinned `boardItems` + `calendarEvents` (next 7 days), merged & de-duped | 4 events | `/calendar` |
| ② Worth reading | `card` | One rotating lead (training ▸ featured) + recent `articles` / `newThisWeek` | 4 updates | `/industry-updates` |

- **Merge + de-dupe (kills the duplication).** A dated event entered as *both* a
  board bulletin and a calendar event used to show twice. Zone ① merges the two
  sources and drops a calendar event when a bulletin already describes it
  (matched on a normalised title), keeping the richer bulletin. Rows are
  **compact** (title + when + one truncated line + a small CTA); full detail
  lives one click away, so no single row can grow tall enough to clip.
- **Reading lead:** the featured item (the Market Report) is the showcase lead.
  When `AEP_TRAINING_OPEN` is `true`, the training drive rides under it as a slim
  secondary CTA (`.lead__mini`) so it isn't lost.
- **Cards hug their content**, equal height, top-aligned. A light week reads as
  calm space, not a stretched void. Caps keep the busiest week above the fold.
- **Tools are NOT a zone** (the sidebar already has them). Don't add a tools
  zone; it just re-duplicates the sidebar.
- **The 1:1 is a slim standing strip, not a zone.** A full-width "Book your
  monthly 1:1" invitation sits *below* the two zones (`.oneone`). It's a fixed,
  low-height CTA (so it can't clip and stays above the fold), kept out of the two
  content zones so it never competes with "act" or "read". It intentionally
  echoes the sidebar-footer 1:1 link: the footer is quiet navigation, the strip
  is the warm invitation.

### The `<BoardZone>` primitive

Every zone is a `<BoardZone>`. It owns the *behaviour* (the four rules); the page
owns the *look* (the `.zone*` classes in `Index.tsx`'s scoped CSS). Key props:

```tsx
<BoardZone
  variant="card"                 // 'card' (white) | 'dark' (emerald)
  icon="🗓" title="This Week" hint="next 7 days"
  more={{ label: 'Calendar →', to: '/calendar' }}
  fixed={<SeasonBanner />}        // always-shown block above the list (optional)
  items={events} cap={3}
  renderItem={(ev) => <EventRow ev={ev} />}
  itemKey={(ev) => ev.id}
  empty="Nothing on the calendar in the next 7 days."   // resting state
  viewAll={{ label: (n) => `View all ${n} →`, to: '/calendar' }}
/>
```

Pass `children` instead of `items` for a fully custom body (Spotlight uses this).
The frame is still enforced.

### What's New (notifications)

The hub header carries a **bell** (`WhatsNewBell`) with a gold count badge: the
notification center. It opens a **running, dated, newest-first log** of
everything added or updated: manual entries from `src/data/whatsNew.ts` merged
automatically with published articles. Nothing is ever deleted; the log is the
permanent "did I miss anything?" answer.

- **"New" is per-broker, not per-day.** An item is flagged (and counted in the
  badge) until that browser closes the panel, then it clears. Seen state lives
  in localStorage (shared-login MVP, the same approach as the AEP training
  board). Backstop: anything older than **30 days** never counts as new, so a
  first visit or long absence doesn't open to a wall of flags.
- **Badge is gold, never red.** Gold is the platform's "new content" signal
  (sidebar dot, "New" chips). Red stays reserved for critical/overdue.
- **A "you're caught up" divider** separates fresh items from the rest.

**The three-home rule** (this is what keeps the board clean):

| Content | Home |
|---------|------|
| Needs action by a date | The Board / calendar (`calendarContent.ts`) |
| Reading material | Worth reading (articles, auto) |
| "FYI, something new exists" | What's New (`whatsNew.ts`), never the board |

Posting a notification = adding one dated entry to `whatsNew.ts`. Articles
join the feed automatically, so never add an article there twice.

### Changing dashboard content

**Edit data, never layout.** Weekly updates happen in `src/data/hubContent.ts`
(pinned bulletins, season, featured) and `src/data/calendarContent.ts` (dated
events) only. The number of items can be anything — caps and resting states
absorb it. If it's a dated event, it goes in the calendar; the board bulletin is
for the rare thing that isn't a calendar event. If you're tempted to add a
*third* zone, stop: the two jobs (act / read) are the guarantee. A genuinely new
job (e.g. live cert-progress) earns a zone only if it's neither "act" nor "read".

### Responsive

- **Desktop (> 900px):** two zones side by side, cards hug content, no page scroll.
- **≤ 900px:** they stack into a **single column in the same fixed order**
  (This Week → Worth reading) and the page scrolls. Order is preserved, so mobile
  is the desktop layout stacked. Nothing is hidden or reordered.

*Added v1.2, revised v1.3 (four source-zones collapsed to two job-zones).
Supersedes the old hero-number "Dashboard (Home)" pattern.*

---

*Homestead v1.3 — July 2026*
*Built for agents who build their futures one client at a time.*
