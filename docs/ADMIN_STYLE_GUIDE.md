

This documents the existing patterns across admin pages to ensure consistency.

---

## 1. Layout Structure

### AdminLayout Wrapper
All admin pages (except Dashboard) use `AdminLayout` from `@/components/layout/AdminLayout`.

```tsx
<AdminLayout
  showBackButton
  backLabel="Dashboard"
  onBack={() => navigate('/admin')}
  maxWidth="default"  // or "narrow" or "wide"
>
  {/* Page content */}
</AdminLayout>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showBackButton` | boolean | false | Shows back arrow + label |
| `backLabel` | string | "Back" | Text next to back arrow |
| `onBack` | function | navigate(-1) | Custom back handler |
| `maxWidth` | "narrow" \| "default" \| "wide" | "default" | Content container width |
| `className` | string | — | Additional classes for main |

**Max Width Values:**
- `narrow` = `max-w-3xl` (768px) — Used for: NewAgentPage, RTSImportPage
- `default` = `max-w-6xl` (1152px) — Used for: AgentsPage, ContractingQueuePage
- `wide` = `max-w-7xl` (1280px) — Used for: AgentProfilePage

### Dashboard Exception
`AdminDashboard` does NOT use AdminLayout. It has its own header with:
- Full Tyler logo (not TIG badge)
- User name displayed
- Different max-width (`max-w-5xl` for header, `max-w-3xl` for content)

---

## 2. Header Pattern

### AdminLayout Header
```
┌────────────────────────────────────────────────────────┐
│  [← Dashboard]  [TIG] Admin              [Avatar ▼]   │
└────────────────────────────────────────────────────────┘
```

- **Height:** `py-3` (12px top/bottom)
- **Background:** `bg-background/80 backdrop-blur-sm`
- **Border:** `border-b border-border`
- **Position:** `sticky top-0 z-40`
- **Logo:** Small TIG badge (32x32) + "Admin" text
- **Back Button:** Ghost variant, `text-muted-foreground`

### Dashboard Header
```
┌────────────────────────────────────────────────────────┐
│  [Tyler Logo]                    Austin Tyler [Avatar] │
└────────────────────────────────────────────────────────┘
```

- **Height:** `py-4` (16px top/bottom)
- **Background:** `bg-background/95 backdrop-blur-sm`
- **Logo:** Full Tyler logo image (`h-12`)

---

## 3. Background & Colors

### Page Background
All admin pages use the same warm gradient:
```css
bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
```

This is defined in `AdminLayout` and applied via `min-h-screen`.

### Brand Colors
- **Primary/Gold:** `hsl(43, 56%, 41%)` — Used for buttons, links, badges
- **Foreground:** Standard dark text
- **Muted foreground:** Gray text for secondary content
- **Border:** Subtle gray borders

---

## 4. Content Width & Spacing

### Main Content
```tsx
<main className="mx-auto px-6 py-8 max-w-{size}">
```

- **Horizontal padding:** `px-6` (24px)
- **Vertical padding:** `py-8` (32px) — from AdminLayout
- **Content is centered** with max-width constraint

### Page Content Patterns
| Page | Max Width | Content Style |
|------|-----------|---------------|
| Dashboard | `max-w-3xl` | Centered, search-focused |
| Agents List | `max-w-6xl` | Full-width table |
| Contracting | `max-w-6xl` | List + side panel |
| New Agent | `max-w-3xl` | Centered form card |
| RTS Import | `max-w-3xl` | Centered card stack |
| Agent Profile | `max-w-7xl` | Wide multi-column |

---

## 5. Typography

### Page Titles (H1)
```tsx
<h1 className="text-2xl font-serif font-medium text-foreground">
  Page Title
</h1>
```
- **Size:** `text-2xl` (24px)
- **Font:** `font-serif` (Georgia/Times)
- **Weight:** `font-medium` (500)

**Exception:** Dashboard uses `text-3xl md:text-4xl` for "Find an Agent"

### Section Headers
```tsx
<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
  Section Label
</h2>
```
- **Size:** `text-sm` (14px)
- **Weight:** `font-semibold` (600)
- **Style:** Uppercase, letter-spacing wide
- **Color:** `text-muted-foreground`

### Card Titles
```tsx
<h2 className="font-semibold text-foreground text-sm">Card Title</h2>
<p className="text-xs text-muted-foreground">Subtitle</p>
```

---

## 6. Card Styles

### Standard Card
```tsx
<div className="bg-white border border-border rounded-lg p-4">
  {/* Content */}
</div>
```

**Properties:**
- Background: `bg-white`
- Border: `border border-border`
- Radius: `rounded-lg` (8px)
- Padding: `p-4` (16px) or `p-5` (20px)
- **No shadow** (previously had `shadow-sm`, removed for consistency)

### Card with Header
```tsx
<Card className="bg-white border border-border rounded-lg">
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Interactive Card (Tiles)
```tsx
<Card
  className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
  onClick={handleClick}
>
  <div className="p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-{color}-100 flex items-center justify-center">
      <Icon className="w-6 h-6 text-{color}-600" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground">Label</p>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
  </div>
</Card>
```

---

## 7. Form Elements

### Input Fields
```tsx
<Input
  className="h-9 text-sm border-border focus:border-gold"
  placeholder="Placeholder..."
/>
```
- **Height:** `h-9` (36px) for compact, `h-10` (40px) standard
- **Border:** `border-border`, focus state uses gold
- **Text:** `text-sm` (14px)

### Search Input
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search..."
    className="pl-9 h-9 text-sm border-border focus:border-gold"
  />
</div>
```

### Labels
```tsx
<Label className="text-sm font-medium">Field Label *</Label>
```

### Select Dropdowns# Admin Pages Style Guide
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px] h-10 border-border">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>
```

---

## 8. Buttons

### Primary Button
```tsx
<Button className="bg-gold hover:bg-gold/90 text-white">
  <Icon className="mr-2 h-4 w-4" />
  Label
</Button>
```

### Outline Button
```tsx
<Button variant="outline" className="border-border">
  Label
</Button>
```

### Ghost Button
```tsx
<Button variant="ghost" size="sm">
  Label
</Button>
```

### Button Sizes
- `size="sm"`: `h-8` — Used in tables, compact areas
- `size="default"`: `h-10` — Standard buttons
- `size="lg"`: `h-11` — CTAs

---

## 9. Tables

### Table Structure
```tsx
<div className="border border-border rounded-lg bg-white overflow-hidden">
  <Table>
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="bg-muted hover:bg-muted">
        <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">
          Column
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell className="px-3 py-3">Content</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### Table Row Interaction
- Hover: `hover:bg-muted/50`
- Selected: `bg-primary/5`
- Cursor: `cursor-pointer` if clickable

---

## 10. Status Indicators

### Status Dots
```tsx
// Active (green)
<span className="w-2.5 h-2.5 rounded-full bg-green-500" />

// Pending (yellow)
<span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />

// Inactive (gray)
<span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
```

### Status Badges
```tsx
// Success
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
  Appointed
</span>

// Warning
<span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
  Pending
</span>

// Neutral
<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
  Unknown
</span>

// Count badge (red)
<span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
  5
</span>
```

---

## 11. Icon Usage

### Icon Sizes
- **In buttons:** `h-4 w-4` with `mr-2`
- **In tiles:** `h-6 w-6` (inside colored container)
- **In inputs:** `h-4 w-4`
- **Standalone:** `h-5 w-5`

### Icon Colors
- Primary actions: `text-primary` or `text-gold`
- Secondary: `text-muted-foreground`
- In colored containers: Match the container color (e.g., `text-amber-600` in `bg-amber-100`)

---

## 12. Spacing Patterns

### Common Gaps
- **Between sections:** `mb-6` or `mb-8`
- **Between cards:** `gap-4`
- **Within cards:** `space-y-4` or `space-y-2`
- **Form fields:** `space-y-4`
- **Inline items:** `gap-2` or `gap-3`

### Margin Patterns
- Page title to content: `mb-4` to `mb-6`
- Section header to content: `mb-3`
- Card header to body: `pb-3` on header

---

## 13. Summary: Key Classes to Use

```tsx
// Page background (via AdminLayout)
"bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]"

// Card
"bg-white border border-border rounded-lg p-4"

// Page title
"text-2xl font-serif font-medium text-foreground"

// Section header
"text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3"

// Input
"h-9 text-sm border-border focus:border-gold"

// Primary button
"bg-gold hover:bg-gold/90 text-white"

// Table container
"border border-border rounded-lg bg-white overflow-hidden"

// Interactive tile
"group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
```

---

## 14. What Dashboard Should Match

The redesigned dashboard should:

1. **Keep its own header** (full logo, not AdminLayout)
2. **Use same background gradient** as other admin pages
3. **Use same card styles** (`bg-white border border-border rounded-lg`)
4. **Match typography** (`font-serif` for titles, `text-sm` section headers)
5. **Match button styles** (gold primary, outline secondary)
6. **Match status badge colors** (green/amber/gray/red patterns)
7. **Use consistent spacing** (`px-6`, `py-8`, `gap-4`, etc.)
