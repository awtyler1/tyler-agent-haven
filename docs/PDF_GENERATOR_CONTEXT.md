# PDF Generator Dev Tool - Context Summary

**Prepared:** January 27, 2026

---

## 1. PDF Library: pdf-lib

The codebase uses **pdf-lib v1.17.1** (imported from esm.sh for Deno Edge Functions).

### Import Pattern
```typescript
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";
```

### Key Capabilities Used
- Create blank PDFs from scratch (`PDFDocument.create()`)
- Load and fill existing PDF templates (`PDFDocument.load()`)
- Embed standard fonts (`StandardFonts.Helvetica`, `HelveticaBold`, `HelveticaOblique`)
- Draw text, rectangles, lines, images
- Work with form fields (text fields, checkboxes, radio groups)
- Flatten forms and save

### Color Helper
```typescript
const GOLD = rgb(0.62, 0.49, 0.18);      // Brand gold
const CHARCOAL = rgb(0.18, 0.18, 0.18);  // Text
const DARK_GRAY = rgb(0.29, 0.29, 0.29);
const MEDIUM_GRAY = rgb(0.42, 0.42, 0.42);
const LIGHT_GRAY = rgb(0.91, 0.91, 0.91);
const WHITE = rgb(1, 1, 1);
```

### Page Dimensions (Letter)
```typescript
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;  // or 36 for tighter
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
```

---

## 2. Existing PDF Generators

### generate-growth-plan-pdf
- **Location:** `supabase/functions/generate-growth-plan-pdf/index.ts`
- **Purpose:** 7-page Strategic Growth Plan for agents
- **Pattern:** Creates PDF from scratch, multiple pages with headers/footers
- **Size:** ~1,800 lines (comprehensive example)

### generate-contracting-pdf
- **Location:** `supabase/functions/generate-contracting-pdf/index.ts`
- **Purpose:** Fills a pre-existing PDF template with form data
- **Pattern:** Loads template, fills fields, embeds signatures, flattens
- **Size:** ~1,160 lines

---

## 3. Brand Colors & Design System

### CSS Variables (Light Mode)
```css
--primary: 217 91% 50%;        /* Blue - hsl(217, 91%, 50%) → #1570EF */
--brand: 43 56% 41%;           /* Gold - hsl(43, 56%, 41%) → #9E7C28 */
--gold: 43 56% 41%;            /* Same as brand */
--gold-light: 43 40% 85%;      /* Light gold tint */
--gold-dark: 43 60% 32%;       /* Dark gold */
--charcoal: 30 10% 15%;        /* Dark text */
```

### PDF-specific RGB Values (from growth plan)
```typescript
const GOLD = rgb(0.62, 0.49, 0.18);           // #9E7D2E
const GOLD_LIGHT = rgb(0.96, 0.94, 0.90);     // #F5F0E5
const CHARCOAL = rgb(0.18, 0.18, 0.18);       // #2E2E2E
const SCRIPT_BG = rgb(0.996, 0.976, 0.906);   // #FEF9E7 - Light gold/cream
```

### Typography
- **Serif:** Playfair Display (web), map to Helvetica-Bold for PDF titles
- **Sans:** Inter (web), map to Helvetica for PDF body
- **PDF Fonts available:** `StandardFonts.Helvetica`, `HelveticaBold`, `HelveticaOblique`

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| px-5 py-4 | 20px/16px | Card headers |
| px-5 py-3 | 20px/12px | List rows |
| gap-3 | 12px | Icon + label |

---

## 4. Route Protection for SuperAdmin

### ProtectedRoute Component
```tsx
// Location: src/components/ProtectedRoute.tsx

<ProtectedRoute requireSuperAdmin>
  <YourDevToolPage />
</ProtectedRoute>
```

### useAuth Hook
```tsx
// Location: src/hooks/useAuth.ts

const { isSuperAdmin } = useAuth();

// Returns true if user has 'super_admin' role
if (isSuperAdmin()) {
  // Show super admin features
}
```

### App.tsx Route Pattern
```tsx
// Location: src/App.tsx (around line 208)

<Route
  path="/admin/labs"
  element={
    <ProtectedRoute requireSuperAdmin>
      <LabsPage />
    </ProtectedRoute>
  }
/>
```

---

## 5. Existing Dev Tools Structure

### Labs Page (SuperAdmin only)
- **Location:** `src/pages/admin/LabsPage.tsx`
- **Route:** `/admin/labs`
- **Protection:** `requireSuperAdmin`
- **Pattern:** Grid of feature cards linking to other pages

### Admin Pages Directory
```
src/pages/admin/
├── AdminDashboard.tsx      # Main admin home
├── AgentsPage.tsx          # Agent list
├── AgentProfilePage.tsx    # Individual agent view
├── ContractingQueuePage.tsx
├── ActivityLogPage.tsx     # SuperAdmin only
├── LabsPage.tsx            # SuperAdmin only (dev tools hub)
├── RoadmapGeneratorPage.tsx
├── RTSImportPage.tsx
├── NewAgentPage.tsx
└── UserDetailPage.tsx
```

### AdminLayout Component
```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function MyDevToolPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout
      showBackButton
      backLabel="Dashboard"
      onBack={() => navigate('/admin')}
    >
      {/* Content */}
    </AdminLayout>
  );
}
```

---

## 6. Service/Library Pattern

### Location: `src/lib/`

### Pattern (from sync.ts)
```typescript
// src/lib/sync.ts

import { supabase } from '@/integrations/supabase/client';

// Types at top
export interface SyncStatus {
  required: boolean;
  isNew: boolean;
  currentSync?: {...};
}

// Pure helper functions (not exported)
function getCurrentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Exported async functions that interact with Supabase
export async function checkSyncStatus(profileId: string): Promise<SyncStatus> {
  const { data, error } = await supabase
    .from('table')
    .select('...')
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error:', error);
    throw error;
  }

  return { ... };
}
```

---

## 7. Key Types

### From useAuth.ts
```typescript
export type OnboardingStatus =
  | 'CONTRACTING_REQUIRED'
  | 'CONTRACTING_SUBMITTED'
  | 'APPOINTED'
  | 'SUSPENDED';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: OnboardingStatus;
  appointed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';
```

### PDF-related Types (from growth plan)
```typescript
interface BrokerProfile {
  id?: string;
  broker_name: string;
  manager_name: string;
  book_size: number;
  monthly_goal: number;
  lead_star_leads: number;
  seminar_eligible: boolean;
  seminars_planned?: number;
  mira_access: boolean;
}
```

---

## 8. Edge Function Pattern

### Location: `supabase/functions/`

### File Structure
```
supabase/functions/
├── _shared/
│   ├── cors.ts      # CORS headers
│   └── auth.ts      # Auth helpers (createSupabaseAdmin, requireAdmin)
├── generate-growth-plan-pdf/
│   └── index.ts
└── generate-contracting-pdf/
    └── index.ts
```

### CORS Pattern
```typescript
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  // ... handler logic

  return new Response(
    JSON.stringify({ success: true, pdf: base64 }),
    { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});
```

### Auth Pattern (for admin-only functions)
```typescript
import { createSupabaseAdmin, requireAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const user = await requireAdmin(req, supabaseAdmin);

    // ... admin-only logic
  } catch (error) {
    // Handle auth errors
  }
});
```

---

## Quick Reference Summary

| Aspect | Value |
|--------|-------|
| **PDF Library** | pdf-lib v1.17.1 |
| **Import** | `https://esm.sh/pdf-lib@1.17.1` |
| **Brand Gold (RGB)** | `rgb(0.62, 0.49, 0.18)` |
| **Primary Blue (HSL)** | `hsl(217, 91%, 50%)` |
| **Page Size** | 612 × 792 (Letter) |
| **Route Protection** | `<ProtectedRoute requireSuperAdmin>` |
| **Auth Check** | `const { isSuperAdmin } = useAuth()` |
| **Layout** | `<AdminLayout>` |
| **Service Pattern** | Export async functions, throw on error |
| **Edge Function Path** | `supabase/functions/{name}/index.ts` |
| **Dev Tools Hub** | `/admin/labs` (LabsPage.tsx) |

---

## Recommended Approach for PDF Generator Dev Tool

1. **Create new page:** `src/pages/admin/PDFGeneratorPage.tsx`
2. **Add route in App.tsx:** Protected with `requireSuperAdmin`
3. **Link from LabsPage:** Add entry to features array
4. **UI Pattern:** Use AdminLayout, form inputs to configure PDF options
5. **PDF Generation:** Either:
   - Client-side with pdf-lib (if no server data needed)
   - Edge function (if need database access or heavy processing)
6. **Output:** Base64 data URL for preview, download button
