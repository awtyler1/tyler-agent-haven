# TIG Platform Design System

**Last Updated:** January 21, 2026
**Philosophy:** Apple/Google-inspired - clean, spacious, clear hierarchy

---

## Core Principles

1. **Hierarchy over density** - Not everything is equally important. Establish clear visual levels.
2. **Whitespace is design** - Generous padding creates calm. Don't cram.
3. **Quiet until needed** - Elements stay subtle until they need attention (hover states, errors, warnings).
4. **Consistency builds trust** - Same patterns everywhere reduce cognitive load.
5. **The interface teaches itself** - Disabled buttons, subtle icons, and clear states communicate without labels.

---

## Color System

### Brand (Identity)
```css
--brand: hsl(43, 56%, 41%)     /* Gold - avatars, logo only */
```
Usage: `bg-brand`, `text-brand`

### Primary (Interactive)
```css
--primary: hsl(217, 91%, 50%)  /* Blue - links, buttons, focus */
```
Usage: `bg-primary`, `text-primary`

### Semantic (Fixed meaning)
| Color | Usage | Tailwind |
|-------|-------|----------|
| Green | Success, complete, valid | `text-green-500`, `bg-green-500` |
| Amber | Warning, pending, attention | `text-amber-500`, `bg-amber-500` |
| Red | Error, destructive, urgent | `text-red-500`, `bg-red-500` |
| Gray | Neutral, disabled, secondary | `text-muted-foreground` |

### Hierarchy (Text)
| Level | Usage | Class |
|-------|-------|-------|
| Primary | Names, titles, important values | `text-foreground` |
| Secondary | Descriptions, metadata | `text-muted-foreground` |
| Tertiary | Timestamps, hints, placeholders | `text-muted-foreground/60` |

---

## Card Pattern

All content cards follow this structure:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  {/* Header */}
  <div className="px-5 py-4 flex items-center justify-between">
    <h2 className="font-semibold text-foreground">{title}</h2>
    {/* Optional: count, action, etc */}
  </div>

  {/* Content */}
  <div className="border-t border-border/50">
    {/* Rows, lists, or content */}
  </div>

  {/* Optional Footer */}
  <div className="px-5 py-3 border-t border-border/50">
    {/* Action link or secondary info */}
  </div>
</div>
```

### Card Variants

**Standard Card** (most common)
- Header with title
- Content area
- Optional footer

**Profile/Entity Card** (for people, companies)
- Avatar + name/email stacked
- Meta row below
- Optional compliance/status footer strip

**Empty State Card**
- Centered content
- Icon (subtle, not huge)
- Primary text (what's happening)
- Secondary text (what to do next)
- Optional action button

---

## List Row Pattern

For any list of items (carriers, documents, agents, etc.):

```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  {/* Left: Status + Label */}
  <div className="flex items-center gap-3">
    {/* Status indicator */}
    <div className="w-2 h-2 rounded-full bg-green-500" />
    {/* Or checkmark/circle for completion */}

    <div>
      <span className="text-sm text-foreground">{label}</span>
      {/* Optional secondary line */}
      <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
    </div>
  </div>

  {/* Right: Action or metadata */}
  <span className="text-xs text-muted-foreground">{date}</span>
  {/* Or icon that appears on hover */}
  <Eye className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
</div>
```

### Status Indicators

**Dot pattern** (for status that doesn't need a label):
```tsx
<div className={`w-2 h-2 rounded-full ${
  status === 'complete' ? 'bg-green-500' :
  status === 'pending' ? 'bg-amber-500' :
  status === 'error' ? 'bg-red-500' : 'bg-gray-300'
}`} />
```

**Checkmark pattern** (for completion):
```tsx
{isComplete ? (
  <CheckCircle2 className="w-4 h-4 text-green-500" />
) : (
  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
)}
```

---

## Avatar Pattern

```tsx
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand text-white flex items-center justify-center text-lg font-semibold shadow-sm">
  {initials}
</div>
```

Sizes:
- Small: `w-8 h-8 text-sm` (lists, compact views)
- Medium: `w-10 h-10 text-base` (cards, tables)
- Large: `w-14 h-14 text-lg` (profile headers)

---

## Button Patterns

**Primary Action:**
```tsx
<Button className="bg-primary hover:bg-primary/90 text-white">
  Save Changes
</Button>
```

**Secondary Action:**
```tsx
<Button variant="outline">
  Cancel
</Button>
```

**Destructive:**
```tsx
<Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
  Delete
</Button>
```

**Text/Link Action (in cards):**
```tsx
<button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
  Request carrier
</button>
```

---

## Empty States

Structure:
```tsx
<div className="px-5 py-12 text-center">
  {/* Icon - subtle, not huge */}
  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-3" />

  {/* Primary message - what's happening */}
  <p className="text-sm font-medium text-foreground">All set.</p>

  {/* Secondary message - context */}
  <p className="text-sm text-muted-foreground mt-1">
    We're getting you contracted with your carriers.
  </p>

  {/* Tertiary - timeline or hint */}
  <p className="text-xs text-muted-foreground/60 mt-2">
    Usually takes 3–4 business days.
  </p>

  {/* Optional action */}
  <Button variant="outline" size="sm" className="mt-4">
    Get Started
  </Button>
</div>
```

Messaging tone:
- Positive framing ("All set" not "Nothing here")
- Clear next step when applicable
- Warm, not robotic

---

## Form Patterns

**Inline Edit (click to edit):**
```tsx
<span
  onClick={handleEdit}
  className="group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-flex items-center"
>
  {value}
  <Pencil className="h-3 w-3 ml-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
</span>
```

**Dialog/Modal:**
- Use shadcn Dialog
- max-w-md for simple forms
- max-w-lg for forms with more fields
- max-w-4xl for complex layouts (side-by-side)

**Required fields:**
- Don't use asterisks or "required" labels
- Disable submit button until valid (Apple pattern)

---

## Spacing Scale

Consistent spacing creates rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| px-5 py-4 | 20px / 16px | Card headers |
| px-5 py-3 | 20px / 12px | List rows, card footers |
| gap-3 | 12px | Icon + label |
| gap-5 | 20px | Compliance items, meta items |
| gap-6 | 24px | Meta row items |
| mt-1 | 4px | Secondary text below primary |
| mt-0.5 | 2px | Tertiary text (expiration dates) |

---

## Typography

| Element | Classes |
|---------|---------|
| Page title | `text-xl font-semibold text-foreground` |
| Card title | `font-semibold text-foreground` |
| Section label | `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| Body text | `text-sm text-foreground` |
| Secondary text | `text-sm text-muted-foreground` |
| Tertiary text | `text-xs text-muted-foreground` |
| Hint/placeholder | `text-xs text-muted-foreground/60` |

---

## Animation & Transitions

Keep it subtle:

```tsx
// Standard transition for interactive elements
className="transition-colors"

// For hover reveals (icons appearing)
className="opacity-0 group-hover:opacity-100 transition-opacity"

// For loading states
<Loader2 className="h-4 w-4 animate-spin" />
```

Avoid:
- Bouncing
- Sliding panels (unless absolutely necessary)
- Anything that delays the user

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use whitespace generously | Cram everything together |
| Let disabled states communicate | Add "required" labels |
| Use dots/checkmarks for status | Use badges for everything |
| Keep text short and warm | Use jargon or robotic language |
| Show icons on hover | Show all icons all the time |
| Use blue for interactive, green for success | Use brand color for everything |
| Use sentence case | USE ALL CAPS (except rare section labels) |

---

## Claude Code Usage

When prompting Claude Code for new features, include:

```
Follow the TIG Platform design system:
- Cards: rounded-xl, shadow-sm, border-border/50, overflow-hidden
- Headers: px-5 py-4, font-semibold
- List rows: px-5 py-3, hover:bg-muted/30, border-t border-border/30 first:border-t-0
- Status dots: w-2 h-2 rounded-full (green/amber/red/gray)
- Empty states: centered, icon + primary text + secondary text
- Interactive text: text-primary, font-medium
- Refer to DESIGN_SYSTEM.md for full patterns
```

---

## File Reference

This system is implemented in:
- `src/pages/admin/AgentProfilePage.tsx` - Profile card, carriers card, notes
- `src/components/admin/AgentDocumentsSection.tsx` - Documents card
- `src/index.css` - Color variables
- `tailwind.config.ts` - Color definitions
