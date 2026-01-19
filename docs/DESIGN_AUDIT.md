# Design System Audit - Tyler Insurance Group Platform

**Generated:** January 19, 2026
**Purpose:** Document existing visual language before dashboard redesign

---

## 1. UI Library Stack

| Library | Version | Purpose |
|---------|---------|---------|
| **shadcn/ui** | - | Component library (Radix + Tailwind) |
| **Radix UI** | Various | Accessible primitives (dialog, dropdown, etc.) |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |
| **class-variance-authority** | 0.7.1 | Component variant management |
| **Lucide React** | 0.462.0 | Icons |
| **tailwindcss-animate** | 1.0.7 | Animation utilities |

---

## 2. Typography

### Fonts Configured
```css
--font-serif: "Playfair Display", Georgia, serif;  /* Headings */
--font-sans: "Inter", system-ui, sans-serif;       /* Body text */
```

### Font Classes
- `font-serif` - For headings (h1-h6 automatically apply this)
- `font-sans` - For body text (default)

### Heading Styles (from index.css)
```css
.heading-display: text-4xl md:text-5xl lg:text-6xl font-serif font-medium
.heading-section: text-3xl md:text-4xl font-serif font-medium
.heading-subsection: text-xl md:text-2xl font-serif font-medium
```

---

## 3. Color System

### Brand Colors (CSS Variables)
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--gold` | `43 56% 41%` | Primary brand accent |
| `--gold-light` | `43 40% 85%` | Light gold backgrounds |
| `--gold-dark` | `43 60% 32%` | Darker gold accents |
| `--cream` | `40 30% 98%` | Soft backgrounds |
| `--charcoal` | `30 10% 15%` | Dark text |

### Semantic Colors
| Token | Light Mode | Usage |
|-------|------------|-------|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `30 10% 15%` | Primary text |
| `--card` | `0 0% 100%` | Card backgrounds |
| `--muted` | `40 15% 95%` | Muted backgrounds |
| `--muted-foreground` | `30 8% 35%` | Secondary text |
| `--border` | `40 20% 90%` | Borders |
| `--primary` | `43 56% 41%` | Primary (= gold) |
| `--destructive` | `0 84.2% 60.2%` | Error states |

### Status Colors (Tailwind utilities used)
| Status | Background | Text |
|--------|------------|------|
| Success | `bg-green-100` | `text-green-600/700` |
| Warning | `bg-amber-100` / `bg-amber-50` | `text-amber-600/700` |
| Error | `bg-red-100` / `bg-red-50` | `text-red-600/700` |
| Info | `bg-blue-100` | `text-blue-700` |
| Neutral | `bg-slate-50` / `bg-gray-100` | `text-slate-700` / `text-gray-600` |

### Most Used Background Classes (from codebase scan)
1. `bg-amber-100` - Warning/pending states
2. `bg-green-100` - Success states
3. `bg-red-100` - Error states
4. `bg-slate-50` - Neutral backgrounds
5. `bg-purple-100` - Admin/special badges
6. `bg-blue-100` - Info states
7. `bg-gold/10` - Accent icon backgrounds

---

## 4. Border Radius Pattern

### Base Radius (from CSS variable)
```css
--radius: 0.5rem;  /* 8px */
```

### Tailwind Mapping
| Class | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `calc(0.5rem - 4px)` = 4px | Small inputs |
| `rounded-md` | `calc(0.5rem - 2px)` = 6px | Buttons (default) |
| `rounded-lg` | `0.5rem` = 8px | Medium containers |
| **`rounded-xl`** | - | **Cards, modals, panels (PRIMARY)** |
| `rounded-full` | 9999px | Avatars, badges, pills |

### Primary Pattern: **`rounded-xl`**
Cards, stat boxes, and major containers consistently use `rounded-xl`.

---

## 5. Button Styles

### Default Button (Gold Gradient)
```tsx
// From button.tsx - default variant
"bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)]"
"text-primary-foreground"
"shadow-[0_2px_8px_-2px_rgba(163,133,41,0.4)]"
"hover:shadow-[0_4px_12px_-2px_rgba(163,133,41,0.5)]"
"hover:from-[hsl(43,56%,42%)] hover:to-[hsl(43,56%,35%)]"
```

### Button Variants
| Variant | Style |
|---------|-------|
| `default` | Gold gradient with shadow |
| `destructive` | Red background |
| `outline` | Border only, transparent bg |
| `secondary` | Secondary color bg |
| `ghost` | No background until hover |
| `link` | Underline on hover |

### Button Sizes
| Size | Height | Padding |
|------|--------|---------|
| `default` | h-10 (40px) | px-4 py-2 |
| `sm` | h-9 (36px) | px-3 |
| `lg` | h-11 (44px) | px-8 |
| `icon` | h-10 w-10 | - |

### Custom Button Classes (index.css)
```css
.btn-primary-gold: Gold bg, white text, rounded-md, px-8 py-4
.btn-outline-gold: Transparent bg, gold border, gold text
```

---

## 6. Card Styles

### Standard Card (card.tsx)
```tsx
"rounded-xl"
"border"
"bg-gradient-to-b from-card to-[#FEFDFB]"
"text-card-foreground"
"shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)]"
```

### Premium Card Class (index.css)
```css
.card-premium {
  bg-gradient-to-b from-white to-[#FEFDFB]
  border border-border
  rounded-xl
  p-8
  shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)]
  hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_-6px_rgba(0,0,0,0.15)]
  hover:border-primary/30
}
```

### Dashboard Stat Cards (AdminDashboard.tsx)
```tsx
"bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm"
```

### Common Card Border
```
border-[#E5E2DB]  // Warm gray, matches brand
```

---

## 7. Shadow System

### CSS Variables
```css
--shadow-soft: 0 4px 20px -4px hsl(43 30% 20% / 0.08);
--shadow-card: 0 2px 12px -2px hsl(43 30% 20% / 0.06);
--shadow-elevated: 0 8px 30px -6px hsl(43 30% 20% / 0.12);
```

### Utility Classes
- `.shadow-soft` - Subtle shadow
- `.shadow-card` - Standard card shadow
- `.shadow-elevated` - Hover/elevated state

### Inline Shadows (most common)
```css
shadow-sm                                           /* Tailwind default */
shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]          /* Card base */
shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)]          /* Card hover */
```

---

## 8. Page Layout Pattern

### Standard Page Structure
```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
  <Navigation />
  <main className="flex-1 pt-28 pb-12">
    <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
      {/* Page content */}
    </div>
  </main>
  <Footer />
</div>
```

### Key Layout Classes
- `container-narrow` - Custom utility for max-w-6xl mx-auto
- `section-padding` - py-20 md:py-28 px-6 md:px-12 lg:px-20

### Background Gradient
```css
bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
```
Subtle warm cream gradient, signature of the platform.

---

## 9. Transition/Animation

### CSS Variable
```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Utility Class
```css
.transition-smooth { transition: var(--transition-smooth); }
```

### Keyframe Animations
- `fade-in` - translateY(10px) to 0, opacity 0 to 1
- `fade-in-up` - translateY(20px) to 0, opacity 0 to 1
- `scale-in` - scale(0.95) to 1, opacity 0 to 1
- `accordion-down/up` - For accordion animations

---

## 10. Form Input Styling

### Focus State (index.css)
```css
input:focus, textarea:focus, select:focus {
  box-shadow: 0 0 0 3px hsl(43 56% 41% / 0.15), 0 0 0 1px hsl(43 56% 41% / 0.3);
}
```
Gold ring on focus - consistent with brand.

### Common Input Pattern
```tsx
"px-3 py-2 text-sm border border-[#E5E2DB] rounded-md
 focus:outline-none focus:ring-2 focus:ring-gold/20"
```

---

## 11. Status Badge Patterns

### From AgentProfilePage.tsx
```tsx
// Contracting Status
not_started: 'bg-gray-100 text-gray-600'
in_progress: 'bg-amber-100 text-amber-700'
contracted:  'bg-green-100 text-green-700'
issue:       'bg-red-100 text-red-700'

// Role Badges
super_admin:       'bg-purple-100 text-purple-700'
admin:             'bg-blue-100 text-blue-700'
manager:           'bg-indigo-100 text-indigo-700'
independent_agent: 'bg-green-100 text-green-700'
internal_tig_agent:'bg-teal-100 text-teal-700'
```

### Badge Shape
```tsx
"text-xs px-2.5 py-1 rounded-full font-medium"
```

---

## 12. Icon Usage

### Library: Lucide React
Standard icons from lucide-react, sized with Tailwind:
- Small: `w-4 h-4`
- Medium: `w-5 h-5`
- Large: `w-6 h-6`

### Icon + Background Pattern
```tsx
<div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
  <Users className="w-5 h-5 text-gold" />
</div>
```

---

## 13. Dark Mode Support

Full dark mode support via CSS class `.dark` on html element.

### Key Dark Mode Colors
```css
.dark {
  --background: #121214;
  --card: #1c1c1f;
  --muted: #252529;
  --border: #2e2e33;
  --foreground: #f4f4f5;
  --muted-foreground: #a1a1aa;
  --gold: #d4a012;  /* Brighter for dark mode */
}
```

---

## Summary: Design Tokens to Use

| Element | Token/Class |
|---------|-------------|
| Primary accent | `gold`, `text-gold`, `bg-gold` |
| Page background | Cream gradient or `bg-background` |
| Card border | `border-[#E5E2DB]` or `border-border` |
| Card radius | `rounded-xl` |
| Button radius | `rounded-md` |
| Heading font | `font-serif` (Playfair Display) |
| Body font | `font-sans` (Inter) |
| Transition | `transition-smooth` or `transition-colors` |
| Shadow | `shadow-sm` base, custom box-shadow for hover |

---

## Recommendations for Dashboard Redesign

1. **Maintain rounded-xl** for cards and major containers
2. **Use gold accent sparingly** - icons, highlights, primary actions
3. **Keep the warm cream gradient** background for consistency
4. **Status colors are established** - green/amber/red/blue patterns
5. **Stick with shadcn/ui components** - they're already styled
6. **Use CSS variables** for any new colors to support dark mode
7. **Font hierarchy** - Playfair for headings, Inter for everything else
