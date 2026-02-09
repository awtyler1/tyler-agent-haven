# Leads Feature — Architecture Context

**Purpose:** Reference doc for planning a Leads Management feature.
**Generated:** February 9, 2026

---

## 1. Agent Portal Structure

### Navigation
- **No sidebar** — flat top-nav with user avatar dropdown as primary navigation
- **Dashboard dock** — 6-tile grid on homepage links to main features
- **Router:** `src/App.tsx` — all agent routes wrapped in `<ProtectedRoute>`

### Agent-Facing Routes

| Route | Page File | Description |
|-------|-----------|-------------|
| `/` | `src/pages/Index.tsx` | Dashboard — book of business, carrier bars, milestones, sync status |
| `/sync` | `src/pages/SyncFlow.tsx` | Monthly production sync (multi-phase upload) |
| `/t65-review` | `src/pages/T65ReviewPage.tsx` | T65 plan change review with filtering |
| `/start-here` | `src/pages/StartHerePage.tsx` | Onboarding roadmap cards |
| `/contracting-hub` | `src/pages/ContractingHubPage.tsx` | Per-carrier appointment status + certifications |
| `/my-profile` | `src/pages/MyProfilePage.tsx` | Agent self-view (wraps admin AgentProfilePage) |
| `/industry-updates` | `src/pages/IndustryUpdatesPage.tsx` | News feed with category filtering |
| `/training` | `src/pages/TrainingPage.tsx` | Video library with progress tracking |
| `/training/:videoId` | (same) | Individual video view |
| `/compliance` | `src/pages/CompliancePage.tsx` | Rules, SOA requirements, marketing restrictions |
| `/carrier-resources` | `src/pages/CarrierResourcesPage.tsx` | Contacts, portals, documents (filtered by certs) |
| `/carrier-resources/plans` | `src/pages/CarrierPlansPage.tsx` | Plan listings per carrier/state |
| `/agent-tools` | `src/pages/AgentToolsPage.tsx` | External quote tools (SunFire, C4Medicare, BOSS CRM) |
| `/forms-library` | `src/pages/FormsLibraryPage.tsx` | Searchable CMS/SSA/SOA forms |
| `/carrier-portals` | `src/pages/CarrierPortalsPage.tsx` | Carrier portal links by state |
| `/plan-finder` | `src/pages/PlanFinderPage.tsx` | Medicare plan search with comparison |
| `/contracting` | `src/pages/ContractingPage.tsx` | 8-step contracting wizard (CONTRACTING_REQUIRED only) |

### Key Navigation Components
- `src/components/Navigation.tsx` — Top bar (logo, mode toggle, avatar dropdown, mobile burger)
- `src/components/UserAvatarDropdown.tsx` — My Profile, Certifications, BOSS CRM, sign out

---

## 2. Database Schema (Relevant Tables)

### No existing lead/prospect tables
There are **no** `leads`, `prospects`, or `opportunities` tables. The system tracks clients (enrolled beneficiaries) and policies — not pre-sale prospects.

### profiles (agent/user records)
- **File:** `src/integrations/supabase/types.ts:1872`
- **Key columns:** `id`, `user_id`, `email`, `full_name`, `phone`, `npn`, `manager_id`, `onboarding_status`, `is_active`, `last_sync_at`
- **RLS:** Agents see own row; admins see all

### clients (enrolled Medicare beneficiaries)
- **Migration:** `supabase/migrations/20260121000000_create_production_tables.sql:10`
- **Key columns:** `id`, `profile_id` (FK→profiles), `medicare_number`, `first_name`, `last_name`, `date_of_birth`, `phone`, `email`, `address_*`
- **Unique constraint:** `(profile_id, medicare_number)`
- **RLS:** Agents see own clients; admins see all; service_role manages all

### policies (enrollment records)
- **Migration:** `supabase/migrations/20260121000000_create_production_tables.sql:125`
- **Key columns:** `id`, `client_id` (FK→clients), `carrier_id` (FK→carriers), `profile_id` (FK→profiles), `plan_name`, `plan_type`, `effective_date`, `term_date`, `status` (default: 'active'), `is_t65`
- **RLS:** Same pattern as clients

### carrier_contacts (broker managers, support — NOT agent prospects)
- **Migration:** `supabase/migrations/20260123000000_create_carrier_directory_tables.sql:9`
- **Key columns:** `carrier_id`, `state_code`, `contact_type` (general|broker_support|sales_manager|territory_manager), `name`, `phone`, `email`
- **RLS:** All authenticated users can read; only admins can write

### broker_roadmaps (planning docs with lead targets)
- **Types:** `src/integrations/supabase/types.ts:292`
- **Key columns:** `broker_name`, `manager_id`, `book_size`, `monthly_goal`, `lead_star_leads`, `mira_access`, `activity_targets` (JSON), `assigned_channels` (JSON)
- **Note:** Has `lead_star_leads` field — suggests LeadStar is an existing lead vendor integration concept

### Standard RLS Pattern (agent-facing tables)
```sql
-- Agent sees own data
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))

-- Admins see all
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))

-- Service role bypasses RLS
USING (auth.role() = 'service_role')
```

### Role Enum: `app_role`
`super_admin` → `admin` → `manager` → `internal_tig_agent` → `independent_agent`

---

## 3. Existing Patterns

### 3a. Creating a Record (Agent Portal)
**Best example:** `src/pages/SyncFlow.tsx:787-900`

Pattern: Supabase `.upsert()` with composite unique key conflict resolution:
```typescript
const { data: sync } = await supabase
  .from('monthly_syncs')
  .upsert({ profile_id, month, status: 'complete', total_clients }, {
    onConflict: 'profile_id,month',
  })
  .select().single();
```
Then creates child records (`sync_carrier_uploads`) and invalidates TanStack Query cache:
```typescript
queryClient.invalidateQueries({ queryKey: ['dashboard'] });
```

### 3b. List/Table with Filtering
**Best example:** `src/pages/admin/AgentsBookPage.tsx:37-79`

Pattern: URL-persisted search state + client-side filtering + parallel data fetching:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const searchQuery = searchParams.get('q') || '';
const statusFilter = searchParams.get('status') || 'all';

// Client-side filter
const filteredAgents = agents.filter(agent => {
  const matchesSearch = !searchQuery ||
    agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus = statusFilter === 'all' || getSyncStatus(agent.last_sync_at) === statusFilter;
  return matchesSearch && matchesStatus;
});
```

Data fetching via custom hook with `Promise.all` for parallel queries:
- **Hook:** `src/hooks/useAdminAgentsBook.ts` — profiles + active policies + termed policies in parallel

### 3c. Status Workflow / Pipeline Stages
**Best example:** `src/components/admin/CarrierStatusPanel.tsx:29-58`

Pattern: Type-safe status enum + config map + transition handler:
```typescript
type ContractingStatus = 'not_started' | 'in_progress' | 'contracted' | 'issue';

const STATUS_CONFIG: Record<ContractingStatus, { label: string; color: string; icon: typeof Circle }> = {
  not_started: { label: 'Not Started', color: 'text-stone-400', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-amber-500', icon: Clock },
  contracted:  { label: 'Contracted',  color: 'text-green-500', icon: CheckCircle },
  issue:       { label: 'Issue',       color: 'text-red-500',   icon: AlertCircle },
};
```

Transition logic sets timestamps on specific transitions (e.g., `contracted_at` only when moving to `contracted`).

Also: onboarding status in `useAuth.ts` — `CONTRACTING_REQUIRED` → `CONTRACTING_SUBMITTED` → `APPOINTED`

### 3d. Admin vs Agent Role-Based Views
**Route level:** `src/components/ProtectedRoute.tsx` — `requireAdmin`, `requireSuperAdmin`, `allowContractingOnly` props

**Component level:** `src/components/admin/agent-profile/tabs/ContractingTab.tsx`
```typescript
interface ContractingTabProps { isAdmin: boolean; }
// Admin-only actions conditionally rendered:
{isAdmin && <Button>Request Carrier</Button>}
```

**Hook level:** Separate hooks for admin vs agent views:
- Agent: `src/hooks/useDashboardData.ts` (TanStack Query, key: `['dashboard', profileId]`)
- Admin: `src/hooks/useAdminDashboardData.ts` (useState/useEffect, separate queries)

**Dual-role users:** Mode toggle in Navigation.tsx switches between agent/admin views; ProtectedRoute blocks admin routes when in agent mode.

---

## 4. Edge Functions & Integrations

### All 25 Edge Functions (`supabase/functions/`)

| Category | Functions |
|----------|-----------|
| **Agent Lifecycle** | `create-agent`, `send-setup-link`, `validate-password` |
| **Admin** | `create-admin`, `delete-user`, `reset-user-password` |
| **Contracting** | `generate-contracting-pdf`, `send-contracting-packet`, `delete-contracting-application`, `reset-contracting-status` |
| **Production** | `parse-production-report` |
| **Email** | `microsoft-oauth-start`, `microsoft-oauth-callback`, `microsoft-send-email` |
| **AI/Chat** | `agent-chat`, `agent-chat-rag` |
| **PDF Utilities** | `extract-pdf-fields`, `pdf-field-audit`, `generate-pdf-structure` |
| **Growth Plans** | `generate-growth-plan-pdf`, `generate-growth-plan-pdf-v8` |
| **Documents** | `process-document` |
| **Admin Utils** | `get-invite-link`, `fetch-edge-logs` |
| **Inquiry** | `send-agent-inquiry` |

### Frontend Invocation Pattern
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* JSON payload */ },
});
if (error) throw error;
if (data?.error) throw new Error(data.error); // Some functions return errors in data
```

**Key examples:**
- `src/contexts/UploadContext.tsx` — invokes `parse-production-report` with base64 file
- `src/components/admin/CreateAdminDialog.tsx` — invokes `create-admin`
- `src/hooks/useContractingPdf.ts` — invokes `generate-contracting-pdf` with 401 retry logic
- `src/hooks/useSendEmail.ts` — invokes `microsoft-send-email`

### External Integration Patterns

| Service | Auth | Pattern |
|---------|------|---------|
| **Resend** (transactional email) | `RESEND_API_KEY` env | Direct API calls from edge functions |
| **Microsoft Graph** (Outlook) | OAuth 2.0 + refresh tokens in `microsoft_oauth_tokens` table | 3-function OAuth flow: start → callback → send-email |
| **OpenAI** (embeddings) | `OPENAI_API_KEY` env | `text-embedding-3-small` for document RAG |
| **Lovable AI** (chat) | `LOVABLE_API_KEY` env | Chat completions via gateway URL |

### Edge Function Auth Pattern
Shared utilities in `supabase/functions/_shared/auth.ts`:
```typescript
await requireAdmin(req, supabaseAdmin)      // admin OR super_admin
await requireSuperAdmin(req, supabaseAdmin)  // super_admin only
await getAuthenticatedUser(req, supabase)    // any authenticated user
```

CORS config in `supabase/functions/_shared/cors.ts` — allows tigagenthub.com + localhost origins.

---

## 5. Design System Reference

**Full spec:** `DESIGN_SYSTEM.md`

### Cards
```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  <div className="px-5 py-4 flex items-center justify-between">
    <h2 className="font-semibold text-foreground">{title}</h2>
  </div>
  <div className="border-t border-border/50">{/* content */}</div>
</div>
```

### List Rows
```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  <div className="flex items-center gap-3">
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-sm text-foreground">{label}</span>
  </div>
  <span className="text-xs text-muted-foreground">{meta}</span>
</div>
```

### Status Indicators
- **Dots:** `w-2 h-2 rounded-full` — green (complete), amber (pending), red (error), gray (neutral)
- **Checkmarks:** `CheckCircle2 w-4 h-4 text-green-500` vs empty circle border

### Status Badge Pattern (from CarrierStatusPanel)
```typescript
const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-stone-400', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-amber-500', icon: Clock },
  contracted:  { label: 'Contracted',  color: 'text-green-500', icon: CheckCircle },
  issue:       { label: 'Issue',       color: 'text-red-500',   icon: AlertCircle },
};
```

### Colors
| Role | Value | Usage |
|------|-------|-------|
| Brand | `hsl(43, 56%, 41%)` (gold) | Avatars, logo only |
| Primary | `hsl(217, 91%, 50%)` (blue) | Links, buttons, focus |
| Success | `text-green-500` | Complete, valid |
| Warning | `text-amber-500` | Pending, attention |
| Error | `text-red-500` | Destructive, urgent |
| Muted | `text-muted-foreground` | Secondary text |

### Typography
| Element | Classes |
|---------|---------|
| Page title | `text-xl font-semibold text-foreground` |
| Card title | `font-semibold text-foreground` |
| Section label | `text-xs font-medium text-muted-foreground uppercase tracking-wide` |
| Body | `text-sm text-foreground` |
| Secondary | `text-sm text-muted-foreground` |

### Page Background
```css
bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]
```

### Empty States
- Centered: icon (subtle) + primary text + secondary text + optional action button
- Tone: positive framing ("All set" not "Nothing here")

### Buttons
- **Primary:** `bg-primary hover:bg-primary/90 text-white`
- **Secondary:** `variant="outline"`
- **Destructive:** `variant="outline" className="text-red-600 hover:bg-red-50"`
- **Text link:** `text-sm text-primary font-medium hover:text-primary/80`

---

## 6. Key Takeaways for Leads Feature

1. **No existing lead infrastructure** — this is greenfield. New table(s), new page(s), new route(s).
2. **Follow the RLS pattern** — agent sees own leads, admins see all, service_role for edge functions.
3. **Follow the status config pattern** from CarrierStatusPanel for lead pipeline stages.
4. **Use URL-persisted filtering** pattern from AgentsBookPage for the leads list view.
5. **Use upsert with conflict keys** for record creation (prevents duplicates).
6. **Add a TanStack Query key** (e.g., `['leads', profileId]`) — invalidate on mutations.
7. **New route** would go in `src/App.tsx` as a `<ProtectedRoute>` child.
8. **Dashboard dock tile** would need a new entry on `Index.tsx` to link to leads.
9. **broker_roadmaps.lead_star_leads** suggests LeadStar as an existing lead vendor concept worth investigating.
10. **Match the design system** — cards, list rows, status dots, typography per `DESIGN_SYSTEM.md`.
