# Medicare Plan Finder Integration Reference

Generated: 2026-01-28

## 1. Project Structure Overview

```
src/
├── assets/              # Static images (carrier logos)
├── components/
│   ├── admin/           # Admin-specific components
│   │   └── queue/       # Queue-related components
│   ├── book-of-business/ # Book of business feature
│   ├── contracting/
│   │   ├── sections/    # Form sections
│   │   └── steps/       # Wizard steps
│   ├── dashboard/       # Dashboard components
│   ├── layout/          # Layout wrappers (AdminLayout, etc.)
│   ├── roadmap/         # Roadmap feature
│   ├── training/        # Training feature
│   └── ui/              # Shadcn/ui components (50+ components)
├── config/              # Configuration files
├── contexts/            # React contexts (FeatureFlags, ViewMode, Upload)
├── data/                # Static data (carriersData.ts)
├── hooks/               # Custom hooks (18+ hooks)
├── integrations/
│   └── supabase/        # Supabase client + generated types
├── lib/                 # Business logic (sync.ts, rtsImport.ts)
├── pages/
│   ├── admin/           # Admin pages (LabsPage, AgentsPage, etc.)
│   └── auth/            # Auth pages (SetPassword, ForgotPassword)
├── types/               # TypeScript interfaces
└── utils/               # Utility functions
```

---

## 2. Router Setup (src/App.tsx)

The app uses **React Router v6** with lazy-loaded routes.

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy loading pattern
const LabsPage = lazy(() => import("./pages/admin/LabsPage"));

// Route protection
<Route
  path="/admin/labs"
  element={
    <ProtectedRoute requireSuperAdmin>
      <LabsPage />
    </ProtectedRoute>
  }
/>
```

### Route Protection Options:
- `<ProtectedRoute>` - Any authenticated user
- `<ProtectedRoute requireAdmin>` - Admin or Super Admin
- `<ProtectedRoute requireSuperAdmin>` - Super Admin only
- `<ProtectedRoute requireAgent allowContractingOnly>` - Agents in contracting flow

### Adding a New Labs Route:
```tsx
// In App.tsx, add lazy import
const MedicarePlanFinderPage = lazy(() => import("./pages/admin/MedicarePlanFinderPage"));

// Add route inside Routes
<Route
  path="/admin/medicare-plan-finder"
  element={
    <ProtectedRoute requireSuperAdmin>
      <MedicarePlanFinderPage />
    </ProtectedRoute>
  }
/>
```

---

## 3. Labs Section Pattern

### Current Labs Page (src/pages/admin/LabsPage.tsx)

```tsx
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FileText, Sparkles, Users, MessageSquare } from 'lucide-react';

export default function LabsPage() {
  const navigate = useNavigate();

  const features = [
    {
      name: 'PDF Assistant',
      description: 'Chat with AI to create professional documents',
      icon: MessageSquare,
      path: '/admin/pdf-builder',
      status: 'Active',
    },
    {
      name: 'Book of Business',
      description: 'Upload carrier reports and track your client portfolio',
      icon: Users,
      path: '/book-of-business',
      status: 'In Development',
    },
    {
      name: 'Business Roadmap Generator',
      description: 'Create personalized business plans for agents',
      icon: FileText,
      path: '/admin/roadmaps',
      status: 'In Development',
    },
  ];

  return (
    <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-serif font-medium text-foreground">Labs</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Experimental features in development</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {features.map((feature) => (
          <button
            key={feature.path}
            onClick={() => navigate(feature.path)}
            className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{feature.name}</span>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  {feature.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-2xl">
        Features here are works in progress. They may change or be removed.
      </p>
    </AdminLayout>
  );
}
```

### To Add Medicare Plan Finder to Labs:
Add to the `features` array:
```tsx
{
  name: 'Medicare Plan Finder',
  description: 'Compare Medicare plans by zip code and coverage needs',
  icon: Search, // from lucide-react
  path: '/admin/medicare-plan-finder',
  status: 'In Development',
},
```

---

## 4. Design System Components

### Button (src/components/ui/button.tsx)

Uses `class-variance-authority` for variants.

```tsx
import { Button } from "@/components/ui/button";

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon

<Button variant="default">Primary Gold</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>
```

### Card (src/components/ui/card.tsx)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Plan Details</CardTitle>
    <CardDescription>Medicare Advantage Plan</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Input (src/components/ui/input.tsx)

```tsx
import { Input } from "@/components/ui/input";

<Input
  type="text"
  placeholder="Enter ZIP code"
  className="w-full"
/>
```

### Available UI Components (src/components/ui/):

| Component | Usage |
|-----------|-------|
| `accordion` | Expandable sections |
| `alert-dialog` | Confirmation modals |
| `badge` | Status indicators |
| `button` | All buttons |
| `card` | Content containers |
| `checkbox` | Boolean inputs |
| `command` | Command palette / autocomplete |
| `dialog` | Modal dialogs |
| `dropdown-menu` | Action menus |
| `form` | Form wrapper with react-hook-form |
| `input` | Text inputs |
| `label` | Form labels |
| `popover` | Floating content |
| `progress` | Progress bars |
| `select` | Dropdown selects |
| `sheet` | Slide-out panels |
| `skeleton` | Loading placeholders |
| `table` | Data tables |
| `tabs` | Tab navigation |
| `textarea` | Multi-line input |
| `toast` / `sonner` | Notifications |
| `tooltip` | Hover hints |

### Utility: cn() (src/lib/utils.ts)

```tsx
import { cn } from "@/lib/utils";

// Merges Tailwind classes safely
<div className={cn("base-class", isActive && "active-class", className)} />
```

---

## 5. Tailwind Configuration

**File:** `tailwind.config.ts`

### Custom Colors:
```ts
colors: {
  // CSS variables from globals.css
  border: "hsl(var(--border))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",

  // Brand colors
  gold: {
    DEFAULT: "hsl(var(--gold))",
    light: "hsl(var(--gold-light))",
    dark: "hsl(var(--gold-dark))",
  },
  cream: "hsl(var(--cream))",
  charcoal: "hsl(var(--charcoal))",

  // Apple HIG dark mode
  apple: {
    blue: "#0A84FF",
    green: "#30D158",
    yellow: "#FFD60A",
    orange: "#FF9F0A",
    red: "#FF453A",
    // ... grays
  },

  // Shadcn semantic colors
  primary, secondary, destructive, muted, accent, popover, card, sidebar
}
```

### Custom Fonts:
```ts
fontFamily: {
  serif: ["Playfair Display", "Georgia", "serif"],  // Headers
  sans: ["Inter", "system-ui", "sans-serif"],       // Body
}
```

### Design Tokens Reference:
```
Page background: bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
Cards: rounded-xl border border-[#e8e4dd] bg-white
Primary action: bg-blue-600 hover:bg-blue-700
Gold accent: text-gold, bg-gold/5, border-gold
Status dots: w-2 h-2 rounded-full (bg-green-500 / bg-amber-500 / bg-red-500)
```

---

## 6. Supabase Setup

### Client Initialization (src/integrations/supabase/client.ts)

```tsx
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Usage:
```tsx
import { supabase } from "@/integrations/supabase/client";
```

### Data Fetching Pattern (Hook Example)

```tsx
// src/hooks/useCarrierDirectory.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CarrierDirectoryData {
  carriers: CarrierWithResources[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCarrierDirectory(stateCode: string = 'KY'): CarrierDirectoryData {
  const [carriers, setCarriers] = useState<CarrierWithResources[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('carriers')
        .select('id, code, name, display_name, is_active')
        .eq('is_active', true)
        .order('name');

      if (queryError) throw queryError;
      setCarriers(data || []);
    } catch (err) {
      console.error('Error fetching:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stateCode]);

  return { carriers, loading, error, refetch: fetchData };
}
```

### TanStack Query Alternative:
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlans(zipCode: string) {
  return useQuery({
    queryKey: ['plans', zipCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('zip_code', zipCode);
      if (error) throw error;
      return data;
    },
    enabled: !!zipCode,
  });
}
```

---

## 7. Types Location

**Directory:** `src/types/`

### Existing Type Files:
- `contracting.ts` - Contracting application types
- `roadmap.ts` - Roadmap types
- `carrierDirectory.ts` - Carrier/contact/link types
- `forms.ts` - Forms library types

### Adding New Types:
Create `src/types/medicare.ts`:

```tsx
export interface MedicarePlan {
  id: string;
  carrier_id: string;
  plan_name: string;
  plan_type: 'MA' | 'MAPD' | 'PDP' | 'Medigap';
  monthly_premium: number;
  star_rating: number;
  zip_codes: string[];
  benefits: PlanBenefit[];
}

export interface PlanBenefit {
  category: string;
  name: string;
  covered: boolean;
  copay?: number;
  notes?: string;
}

export interface PlanSearchFilters {
  zipCode: string;
  planType?: string[];
  maxPremium?: number;
  minStarRating?: number;
  carrierIds?: string[];
}
```

---

## 8. Available Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Combined auth state (user, profile, roles) |
| `useProfile` | Current user profile |
| `useRole` | Role checking (isAdmin, isSuperAdmin) |
| `useCarrierDirectory` | Carrier data with contacts/links/docs |
| `useAgentCarriers` | Carriers agent is certified with |
| `useAgentCertifications` | Agent's RTS certifications |
| `useContractingApplication` | Contracting wizard state |
| `useForms` | Forms library data |
| `useDashboardData` | Dashboard metrics |
| `useSyncPreferences` | Sync flow preferences |
| `useCommissions` | Commission data |
| `useFormValidation` | Form validation helpers |
| `useSendEmail` | Email sending via Edge Function |
| `useDarkMode` | Dark mode toggle |
| `useNavigationContext` | Navigation state |
| `use-mobile` | Mobile detection |
| `use-toast` | Toast notifications |

---

## 9. Admin Layout Pattern

```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useNavigate } from 'react-router-dom';

export default function MedicarePlanFinderPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout
      showBackButton
      backLabel="Labs"
      onBack={() => navigate('/admin/labs')}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-medium text-foreground">
          Medicare Plan Finder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare Medicare plans by coverage and cost
        </p>
      </div>

      {/* Page content */}
    </AdminLayout>
  );
}
```

---

## 10. File Naming Conventions

- **Pages:** `PascalCase` - `MedicarePlanFinderPage.tsx`
- **Components:** `PascalCase` - `PlanCard.tsx`, `SearchFilters.tsx`
- **Hooks:** `camelCase` with `use` prefix - `useMedicarePlans.ts`
- **Types:** `camelCase` - `medicare.ts`
- **Utils:** `camelCase` - `planHelpers.ts`

---

## 11. Suggested File Structure for Plan Finder

```
src/
├── components/
│   └── medicare/
│       ├── PlanCard.tsx
│       ├── PlanCompareTable.tsx
│       ├── SearchFilters.tsx
│       ├── ZipCodeInput.tsx
│       └── BenefitsList.tsx
├── hooks/
│   └── useMedicarePlans.ts
├── pages/
│   └── admin/
│       └── MedicarePlanFinderPage.tsx
└── types/
    └── medicare.ts
```

---

## 12. Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://mgczpsrtkdkkjzmztpyd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
```

---

## Summary

| Aspect | Pattern |
|--------|---------|
| Routing | React Router v6 with lazy loading |
| UI Components | Shadcn/ui (Radix-based) |
| Styling | Tailwind CSS with custom design tokens |
| State | TanStack Query + custom hooks |
| Data | Supabase client with typed queries |
| Forms | React Hook Form + Zod |
| Layout | AdminLayout wrapper for admin pages |
| Types | Centralized in src/types/ |
