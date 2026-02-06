# AgentProfilePage Design Context

**Purpose:** Comprehensive design reference for creating Apple-quality UI mockups
**Last Updated:** February 4, 2026
**Sources:** DESIGN_SYSTEM.md, tailwind.config.ts, src/index.css, UI components

---

## 1. Core Design Philosophy

From DESIGN_SYSTEM.md:
1. **Hierarchy over density** - Not everything is equally important
2. **Whitespace is design** - Generous padding creates calm
3. **Quiet until needed** - Elements stay subtle until they need attention
4. **Consistency builds trust** - Same patterns everywhere
5. **The interface teaches itself** - Disabled buttons communicate without labels

---

## 2. Color System

### CSS Variables (Light Mode)

```css
/* Backgrounds */
--background: 0 0% 100%;           /* #FFFFFF */
--card: 0 0% 100%;                 /* #FFFFFF */
--muted: 40 15% 95%;               /* #F5F3EF */

/* Text */
--foreground: 30 10% 15%;          /* #292524 - Primary text */
--muted-foreground: 30 8% 35%;     /* #5c5552 - Secondary text */

/* Brand */
--brand: 43 56% 41%;               /* #A38529 - Gold */
--gold: 43 56% 41%;                /* #A38529 */
--gold-light: 43 40% 85%;          /* Tinted backgrounds */
--gold-dark: 43 60% 32%;           /* Hover states */

/* Primary (Interactive) */
--primary: 217 91% 50%;            /* #2563EB - Blue for links/actions */

/* Borders */
--border: 40 20% 90%;              /* #E5E2DB */

/* Radius */
--radius: 0.5rem;                  /* 8px */
```

### Hex Color Reference

| Usage | Light Mode | Dark Mode |
|-------|------------|-----------|
| Page Background | Gradient (see below) | `#000000` |
| Card Background | `#FFFFFF` | `#1C1C1E` |
| Elevated Surface | `#FEFDFB` | `#2C2C2E` |
| Border | `#E5E2DB` or `#e8e4dd` | `#38383A` |
| Primary Text | `#292524` | `#FFFFFF` |
| Secondary Text | `#5c5552` | `#8E8E93` |
| Gold/Brand | `#A38529` | `#FFD60A` |
| Blue/Interactive | `#2563EB` | `#0A84FF` |
| Success | `#22C55E` | `#30D158` |
| Warning | `#F59E0B` | `#FFD60A` |
| Error | `#EF4444` | `#FF453A` |

### Page Background Gradient

```css
/* Light Mode - Warm cream gradient */
background: linear-gradient(to bottom right, #FEFDFB, #FDFBF7, #FAF8F3);

/* Tailwind */
bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
```

---

## 3. Typography

### Font Families

```css
--font-serif: "Playfair Display", Georgia, serif;  /* Headings */
--font-sans: "Inter", system-ui, sans-serif;       /* Body text */
```

### Typography Scale

| Element | Classes | Example |
|---------|---------|---------|
| Page Title | `text-xl font-serif font-medium text-foreground` | "John Doe" |
| Card Title | `font-semibold text-foreground` | "Carriers" |
| Section Label | `text-xs font-medium text-muted-foreground uppercase tracking-wide` | "QUICK PICKS" |
| Body Text | `text-sm text-foreground` | List items |
| Secondary Text | `text-sm text-muted-foreground` | Descriptions |
| Tertiary Text | `text-xs text-muted-foreground` | Timestamps |
| Hint/Placeholder | `text-xs text-muted-foreground/60` | "Updated Jan 15" |

### Heading Examples from AgentProfilePage

```tsx
// Agent name in header
<h1 className="text-xl font-serif font-medium text-foreground">
  {profile.full_name}
</h1>

// Card header
<h2 className="font-semibold text-foreground">Carriers</h2>

// Section label (e.g., in modals)
<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
  Quick Picks
</p>
```

---

## 4. Card Patterns

### Standard Card Container

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  {/* Content */}
</div>
```

**Actual values:**
- `rounded-xl` = 12px border-radius
- `shadow-sm` = `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `border-border/50` = `#E5E2DB` at 50% opacity

### Card with Header + Content

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  {/* Header */}
  <div className="px-5 py-4 flex items-center justify-between">
    <h2 className="font-semibold text-foreground">{title}</h2>
    <span className="text-xs text-muted-foreground">{meta}</span>
  </div>

  {/* Content */}
  <div className="border-t border-border/50">
    {/* Rows go here */}
  </div>
</div>
```

### Card with Fixed Height + Scroll

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col h-[348px]">
  {/* Header */}
  <div className="px-5 py-4">
    <h2 className="font-semibold text-foreground">{title}</h2>
  </div>

  {/* Scrollable content */}
  <div className="border-t border-border/50 flex-1 min-h-0 overflow-y-auto">
    {/* Rows */}
  </div>
</div>
```

### Card with Footer Action

```tsx
<div className="px-5 py-3 border-t border-border/50 hover:bg-muted/20 transition-colors">
  <button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
    Request carrier
  </button>
</div>
```

---

## 5. List Row Patterns

### Standard Row

```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  {/* Left side */}
  <div className="flex items-center gap-3">
    {/* Status dot */}
    <div className={`w-2 h-2 rounded-full ${
      status === 'contracted' ? 'bg-green-500' :
      status === 'in_progress' ? 'bg-amber-500' :
      status === 'issue' ? 'bg-red-500' : 'bg-gray-300'
    }`} />
    <span className="text-sm text-foreground">{label}</span>
  </div>

  {/* Right side */}
  <span className="text-[11px] text-muted-foreground">
    Updated {date}
  </span>
</div>
```

### Document Row (with completion state)

```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  <div className="flex items-center gap-3">
    {/* Completion indicator */}
    {document ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
    )}
    <span className={`text-sm ${document ? 'text-foreground' : 'text-muted-foreground'}`}>
      {label}
    </span>
  </div>

  {/* Hover reveal icon */}
  <Eye className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
</div>
```

---

## 6. Avatar Pattern

### Large Avatar (Profile Headers)

```tsx
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand text-white shadow-sm flex items-center justify-center text-lg font-semibold flex-shrink-0">
  {getInitials(name)}  {/* "JD" */}
</div>
```

### Medium Avatar (Lists/Cards)

```tsx
<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
  {getInitials(name)}
</div>
```

### Small Avatar (Compact)

```tsx
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand/80 to-brand text-white flex items-center justify-center text-xs font-medium">
  {getInitials(name)}
</div>
```

---

## 7. Badge Patterns

### Status Badges (Inline)

```tsx
// Onboarding status badges
const STATUS_BADGES = {
  CONTRACTING_REQUIRED: 'bg-red-100 text-red-700',
  CONTRACTING_SUBMITTED: 'bg-amber-100 text-amber-700',
  APPOINTED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

<span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGES[status]}`}>
  {label}
</span>
```

### Role Badges

```tsx
const ROLE_BADGES = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-indigo-100 text-indigo-700',
  independent_agent: 'bg-green-100 text-green-700',
  internal_tig_agent: 'bg-teal-100 text-teal-700',
};
```

### Special State Badges

```tsx
// Inactive badge
<span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">
  Inactive
</span>

// Test badge
<span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
  Test
</span>
```

---

## 8. Button Variants

### Primary (Gold Gradient)

```tsx
<Button>  {/* Default variant */}
  Save Changes
</Button>

/* Actual styles */
bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)]
text-white
shadow-[0_2px_8px_-2px_rgba(163,133,41,0.4)]
hover:shadow-[0_4px_12px_-2px_rgba(163,133,41,0.5)]
```

### Outline (Secondary)

```tsx
<Button variant="outline">
  Cancel
</Button>

/* Actual styles */
border border-input bg-background
hover:bg-accent hover:text-accent-foreground
```

### Small Outline

```tsx
<Button variant="outline" size="sm" className="gap-1.5">
  <Plus className="h-3.5 w-3.5" />
  Request Carrier
</Button>
```

### Text/Link Action (In cards)

```tsx
<button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
  Request carrier
</button>
```

### Destructive (Red)

```tsx
<Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
  Deactivate
</Button>
```

---

## 9. Inline Edit Pattern

### Display State

```tsx
<span
  onClick={handleEdit}
  className="group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-flex items-center"
>
  {value}
  <Pencil className="h-3 w-3 ml-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
</span>
```

### Edit State

```tsx
<input
  type="text"
  value={draft}
  className="text-xl font-serif font-medium px-2 py-0.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
  placeholder="Full name"
/>
```

### Save Status Indicator

```tsx
{saveStatus === 'saved' && (
  <span className="text-xs text-green-600 animate-fade-in">Saved ✓</span>
)}
{saveStatus === 'saving' && (
  <span className="text-xs text-muted-foreground">Saving...</span>
)}
```

---

## 10. Empty States

### Card Empty State

```tsx
<div className="px-5 py-12 text-center">
  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
  <p className="text-sm font-medium">Ready when you are.</p>
  <p className="text-sm text-muted-foreground mt-1">
    Complete contracting to start selling.
  </p>
  <Button variant="outline" size="sm" className="mt-3">
    Get Started
  </Button>
</div>
```

### Success Empty State

```tsx
<div className="px-5 py-12 text-center">
  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
  <p className="text-sm font-medium">All set. We're getting you contracted.</p>
  <p className="text-sm text-muted-foreground mt-1">
    Usually takes 3–4 business days.
  </p>
</div>
```

---

## 11. Spacing System

### Standard Spacings

| Token | Value | Usage |
|-------|-------|-------|
| `px-5 py-4` | 20px / 16px | Card headers |
| `px-5 py-3` | 20px / 12px | List rows, card footers |
| `px-6 py-3` | 24px / 12px | Page header |
| `gap-3` | 12px | Icon + label in rows |
| `gap-4` | 16px | Grid gaps |
| `gap-5` | 20px | Meta row items |
| `gap-6` | 24px | Larger spacing between sections |
| `mt-1` | 4px | Secondary text below primary |
| `mt-0.5` | 2px | Tertiary text |
| `mb-4` | 16px | Between card grid rows |

### Page Layout

```tsx
// Main content area
<main className="mx-auto px-6 py-8 max-w-6xl">

// Back link area
<div className="max-w-5xl mx-auto px-6 pt-6">

// Card grid
<div className="grid gap-4 md:grid-cols-3">
```

---

## 12. Header Band Pattern (Agent Profile)

### Structure

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden mb-4">
  {/* Main Content */}
  <div className="p-6">
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand text-white shadow-sm flex items-center justify-center text-lg font-semibold flex-shrink-0">
        {initials}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        {/* Name + Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-serif font-medium text-foreground">
            {name}
          </h1>
          {/* Status badges */}
        </div>

        {/* Email */}
        <p className="text-sm text-muted-foreground mt-1">{email}</p>

        {/* Meta Row */}
        <div className="flex items-center gap-6 mt-5 text-sm">
          {/* NPN, Manager link, Team count */}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Buttons */}
      </div>
    </div>
  </div>

  {/* Compliance Footer Strip */}
  <div className="border-t border-border/50 px-6 py-3 flex items-center gap-5">
    {/* AHIP, E&O, Licensed indicators */}
  </div>
</div>
```

### Compliance Strip Items

```tsx
<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
  <CheckCircle2 className="w-4 h-4 text-green-500" />
  <span>AHIP 2026</span>
</div>

<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
  <AlertCircle className="w-4 h-4 text-amber-500" />
  <span>AHIP Required</span>
</div>
```

---

## 13. Tabs Pattern (for Redesign)

### Shadcn Tabs Component

```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="contracting">Contracting</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="admin">Admin</TabsTrigger>
  </TabsList>

  <TabsContent value="overview" className="mt-4">
    {/* Content */}
  </TabsContent>
</Tabs>
```

### Tab Trigger Styles

```tsx
/* Default state */
px-3 py-1.5 text-sm font-medium text-muted-foreground

/* Active state */
data-[state=active]:bg-background
data-[state=active]:text-foreground
data-[state=active]:shadow-sm
```

### Recommended Tab Styling for Profile

```tsx
// Underline variant (more Apple-like)
<div className="border-b border-border/50">
  <nav className="flex gap-6 px-0" aria-label="Tabs">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === tab.id
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

---

## 14. Modal/Dialog Patterns

### Dialog Sizes

```tsx
// Simple form
<DialogContent className="max-w-md">

// Standard form
<DialogContent className="max-w-lg">

// Complex layout (side-by-side)
<DialogContent className="max-w-4xl">
```

### Dialog Structure

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <p className="text-sm text-muted-foreground">
        Description text
      </p>
    </DialogHeader>

    <div className="space-y-4 py-2">
      {/* Form content */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={handleClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Submit
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 15. Icon Usage

### Common Icons (Lucide React)

| Icon | Usage |
|------|-------|
| `CheckCircle2` | Success/complete status |
| `AlertCircle` | Warning/required status |
| `Pencil` | Edit action (inline) |
| `Plus` | Add action |
| `Eye` | View/preview |
| `X` | Close/remove |
| `Loader2` | Loading (with animate-spin) |
| `MoreVertical` | More actions dropdown |
| `Search` | Search input |
| `ArrowLeft` | Back navigation |
| `Send` | Send action |
| `FileText` | Document/file |
| `Users` | Team/hierarchy |

### Icon Sizes

| Context | Size |
|---------|------|
| Inline with text | `h-3 w-3` or `h-3.5 w-3.5` |
| List row action | `h-4 w-4` |
| Card header/button | `h-4 w-4` or `h-5 w-5` |
| Empty state | `h-8 w-8` |
| Large decorative | `h-10 w-10` |

---

## 16. Animation & Transitions

### Standard Transitions

```tsx
// Color changes
className="transition-colors"

// All properties
className="transition-all"

// Hover reveal
className="opacity-0 group-hover:opacity-100 transition-opacity"
```

### Loading Spinner

```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

### Fade In Animation

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
```

---

## 17. Do / Don't Reference

| Do | Don't |
|----|-------|
| Use whitespace generously | Cram everything together |
| Let disabled states communicate | Add "required" labels |
| Use dots/checkmarks for status | Use badges for everything |
| Show icons on hover | Show all icons all the time |
| Use blue for interactive elements | Use brand gold for everything |
| Use sentence case | USE ALL CAPS (except section labels) |
| Keep text short and warm | Use jargon or robotic language |

---

## 18. Quick Reference Card

```
CARD PATTERN:
─────────────
Container: bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden
Header: px-5 py-4, font-semibold text-foreground
Row: px-5 py-3 hover:bg-muted/30 border-t border-border/30 first:border-t-0
Footer: px-5 py-3 border-t border-border/50

STATUS DOTS:
────────────
Complete: bg-green-500
In Progress: bg-amber-500
Issue/Error: bg-red-500
Not Started: bg-gray-300

AVATAR:
───────
Large: w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand
Medium: w-10 h-10 rounded-full bg-primary/10
Small: w-8 h-8 rounded-lg

TEXT:
─────
Primary: text-sm text-foreground
Secondary: text-sm text-muted-foreground
Tertiary: text-xs text-muted-foreground
Hint: text-xs text-muted-foreground/60
```

---

*This document provides all values needed to create pixel-perfect mockups that match the existing TIG Platform design language.*

---

## 19. Dark Mode Specifics (Apple HIG)

### CSS Variables (Dark Mode)

```css
--background: 0 0% 0%             /* #000000 - True black base */
--foreground: 0 0% 100%           /* #FFFFFF - Pure white text */
--card: 0 0% 11%                  /* #1C1C1E - Elevated surface */
--popover: 0 0% 17%               /* #2C2C2E - Grouped content */
--muted: 0 0% 17%                 /* #2C2C2E */
--muted-foreground: 0 0% 56%     /* #8E8E93 - Apple gray */
--border: 0 0% 22%                /* #38383A - Apple separator */

--primary: 211 100% 52%           /* #0A84FF - Apple system blue */
--brand: 48 100% 52%              /* #FFD60A - Vibrant gold */
```

### Apple System Colors (Dark Mode)

```tsx
// From tailwind.config.ts
apple: {
  blue: "#0A84FF",
  green: "#30D158",
  yellow: "#FFD60A",
  orange: "#FF9F0A",
  red: "#FF453A",
  pink: "#FF375F",
  purple: "#BF5AF2",
  cyan: "#64D2FF",
  gray: "#8E8E93",
  "gray-2": "#636366",
  "gray-3": "#48484A",
  "gray-4": "#3A3A3C",
  "gray-5": "#2C2C2E",
  "gray-6": "#1C1C1E",
}
```

### Dark Mode Gradient Backgrounds

```css
/* Page background */
.dark .bg-gradient-to-br {
  background: linear-gradient(to bottom right, #000000, #0A0A0A, #000000);
}

/* Card gradient */
.dark .bg-gradient-to-b.from-card {
  background: linear-gradient(to bottom, #1C1C1E, #161618);
}
```

### Dark Mode Shadows

```css
--shadow-soft: 0 4px 20px -4px rgba(0, 0, 0, 0.5);
--shadow-card: 0 2px 12px -2px rgba(0, 0, 0, 0.4);
--shadow-elevated: 0 8px 30px -6px rgba(0, 0, 0, 0.6);
```

---

## 20. Component Styling Details

### Button Component (ui/button.tsx)

```tsx
// Default variant - Gold gradient
"bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)] text-primary-foreground"
"shadow-[0_2px_8px_-2px_rgba(163,133,41,0.4)]"
"hover:shadow-[0_4px_12px_-2px_rgba(163,133,41,0.5)]"

// Dark mode
"dark:from-[#FFD60A] dark:to-[#E6C200] dark:text-black"
"dark:shadow-[0_2px_8px_-2px_rgba(255,214,10,0.3)]"

// Outline variant
"border border-input bg-background hover:bg-accent"
"dark:border-[#38383A] dark:bg-transparent dark:text-[#EBEBF5]"
"dark:hover:bg-[#2C2C2E] dark:hover:border-[#48484A]"

// Ghost variant
"hover:bg-accent hover:text-accent-foreground"
"dark:hover:bg-[#2C2C2E] dark:hover:text-white"

// Sizes
default: "h-10 px-4 py-2"
sm: "h-9 rounded-md px-3"
lg: "h-11 rounded-md px-8"
icon: "h-10 w-10"
```

### Card Component (ui/card.tsx)

```tsx
// Light mode
"rounded-xl border text-card-foreground"
"bg-gradient-to-b from-card to-[#FEFDFB]"
"shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)]"

// Dark mode
"dark:bg-gradient-to-b dark:from-[#1C1C1E] dark:to-[#161618]"
"dark:border-[#38383A]"
"dark:shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
```

### Badge Component (ui/badge.tsx)

```tsx
// Base styles
"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"

// Success variant
"border-transparent bg-green-100 text-green-700"
"dark:bg-[#30D158]/20 dark:text-[#30D158] dark:border-[#30D158]/30"

// Warning variant
"border-transparent bg-amber-100 text-amber-700"
"dark:bg-[#FFD60A]/20 dark:text-[#FFD60A] dark:border-[#FFD60A]/30"

// Destructive variant
"border-transparent bg-destructive text-destructive-foreground"
"dark:bg-[#FF453A]/20 dark:text-[#FF453A] dark:border-[#FF453A]/30"

// Secondary variant
"border-transparent bg-secondary text-secondary-foreground"
"dark:bg-[#2C2C2E] dark:text-[#EBEBF5] dark:border-[#38383A]"
```

### Tabs Component (ui/tabs.tsx)

```tsx
// TabsList
"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"

// TabsTrigger
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium"
"ring-offset-background transition-all"
"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"

// TabsContent
"mt-2 ring-offset-background"
```

### Dialog Component (ui/dialog.tsx)

```tsx
// Overlay
"fixed inset-0 z-50 bg-black/80"

// Content
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]"
"gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"

// Dark mode
"dark:bg-[#2C2C2E] dark:border-[#48484A] dark:text-white"
"dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"

// Close button
"absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
"dark:hover:bg-[#3A3A3C] dark:text-[#8E8E93] dark:hover:text-white"
```

---

## 21. Shadow Reference Table

| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| shadow-soft | `0 4px 20px -4px hsl(43 30% 20% / 0.08)` | `0 4px 20px -4px rgba(0,0,0,0.5)` | Subtle ambient |
| shadow-card | `0 2px 12px -2px hsl(43 30% 20% / 0.06)` | `0 2px 12px -2px rgba(0,0,0,0.4)` | Standard cards |
| shadow-elevated | `0 8px 30px -6px hsl(43 30% 20% / 0.12)` | `0 8px 30px -6px rgba(0,0,0,0.6)` | Hover, modals |
| Button shadow | `0 2px 8px -2px rgba(163,133,41,0.4)` | `0 2px 8px -2px rgba(255,214,10,0.3)` | Primary buttons |
| Modal shadow | - | `0 25px 50px -12px rgba(0,0,0,0.8)` | Dialog content |

---

## 22. Custom CSS Classes (from index.css)

```css
/* Premium gold button */
.btn-primary-gold {
  @apply bg-gold text-primary-foreground px-8 py-4 rounded-md font-medium
         transition-smooth hover:opacity-90 hover:shadow-elevated;
}

/* Premium card with hover */
.card-premium {
  @apply bg-gradient-to-b from-white to-[#FEFDFB] border border-border rounded-xl p-8
         shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)]
         transition-all duration-200
         hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] hover:border-primary/30;
}

/* Typography utility classes */
.heading-display { @apply text-4xl md:text-5xl lg:text-6xl font-serif font-medium; }
.heading-section { @apply text-3xl md:text-4xl font-serif font-medium; }
.heading-subsection { @apply text-xl md:text-2xl font-serif font-medium; }
.text-body { @apply text-base md:text-lg leading-relaxed; color: hsl(30 10% 25%); }
.text-tertiary { color: hsl(30 8% 45%); }

/* Gold marker for lists */
.gold-marker::before { content: "◆"; @apply text-gold mr-3 text-sm; }
```

---

## 23. Animation Keyframes (from tailwind.config.ts)

```js
keyframes: {
  "fade-in": {
    from: { opacity: "0", transform: "translateY(10px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "fade-in-up": {
    from: { opacity: "0", transform: "translateY(20px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "scale-in": {
    from: { opacity: "0", transform: "scale(0.95)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
}

animation: {
  "fade-in": "fade-in 0.6s ease-out forwards",
  "fade-in-up": "fade-in-up 0.8s ease-out forwards",
  "scale-in": "scale-in 0.5s ease-out forwards",
}
```

---

## 24. AdminLayout Reference

```tsx
// Full layout structure
<div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] dark:from-black dark:via-black dark:to-black">

  {/* Header - sticky with blur */}
  <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40 dark:border-[#38383A] dark:bg-black/90">
    <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <span className="text-lg font-semibold text-[#292524] dark:text-white">TIG</span>
      <span className="text-[#5c5552] dark:text-[#8E8E93]">|</span>
      <span className="text-sm text-[#5c5552] dark:text-[#8E8E93]">Agent Portal</span>
    </div>
  </header>

  {/* Back link */}
  <div className="max-w-5xl mx-auto px-6 pt-6">
    <Link className="text-sm text-blue-600 hover:text-blue-700 dark:text-[#0A84FF]">
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  </div>

  {/* Main content */}
  <main className="mx-auto px-6 py-8 max-w-6xl">
    {children}
  </main>

  {/* Footer */}
  <footer className="py-8 text-center dark:border-t dark:border-[#38383A]">
    <p className="text-xs text-[#5c5552]/50 dark:text-[#8E8E93]/50">
      Powered by Tyler Insurance Group
    </p>
  </footer>
</div>
```

### Max Width Options
```tsx
narrow: 'max-w-3xl'   // Simple content
default: 'max-w-6xl'  // Standard pages
wide: 'max-w-7xl'     // Wide layouts
```
