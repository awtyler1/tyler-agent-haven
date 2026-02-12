# Architecture Documentation
## TIG Agent Portal

**Version:** 1.0
**Last Updated:** January 25, 2026
**Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [C4 Model Diagrams](#2-c4-model-diagrams)
3. [Tech Stack](#3-tech-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Key Data Flows](#8-key-data-flows)
9. [Architecture Decision Records](#9-architecture-decision-records)
10. [Quality Attributes](#10-quality-attributes)

---

## 1. System Overview

### 1.1 Purpose

The Agent Portal is a full-stack web application for managing insurance agent onboarding, contracting, certifications, and production tracking. It serves as a central hub for agents to complete compliance requirements, access carrier resources, and track their business performance.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Agent Onboarding** | Multi-step contracting wizard with PDF generation |
| **Certification Management** | RTS import, AHIP tracking, carrier appointments |
| **Book of Business** | Production tracking with milestone achievements |
| **Carrier Resources** | Contacts, portals, plan documents per carrier |
| **Forms Library** | Compliance forms and templates |
| **Training** | Video library with progress tracking |
| **Admin Dashboard** | Agent management, queue processing, reporting |
| **AI Assistant** | RAG-powered chatbot for agent support |

### 1.3 User Personas

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Super Admin   │  │      Admin      │  │     Manager     │  │      Agent      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ • Full access   │  │ • Agent mgmt    │  │ • View downline │  │ • Contracting   │
│ • Create admins │  │ • Queue process │  │ • Roadmap tools │  │ • Resources     │
│ • Activity logs │  │ • RTS import    │  │ • Team reports  │  │ • Production    │
│ • Labs/Features │  │ • Email sending │  │                 │  │ • Training      │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 2. C4 Model Diagrams

### 2.1 System Context (Level 1)

```mermaid
C4Context
    title System Context Diagram - Agent Portal

    Person(agent, "Insurance Agent", "Completes contracting, tracks production, accesses resources")
    Person(admin, "Admin/Manager", "Manages agents, processes queue, imports data")

    System(portal, "Agent Portal", "Web application for agent onboarding and management")

    System_Ext(supabase, "Supabase", "Auth, Database, Storage, Edge Functions")
    System_Ext(resend, "Resend", "Transactional email delivery")
    System_Ext(outlook, "Microsoft Outlook", "Email/calendar integration via OAuth")
    System_Ext(claude, "Claude AI", "RAG chatbot assistance")
    System_Ext(sentry, "Sentry", "Error monitoring and session replay")

    Rel(agent, portal, "Uses", "HTTPS")
    Rel(admin, portal, "Manages", "HTTPS")
    Rel(portal, supabase, "Stores data, auth", "HTTPS")
    Rel(portal, resend, "Sends emails", "API")
    Rel(portal, outlook, "Integrates calendar/email", "OAuth + Graph API")
    Rel(portal, claude, "AI assistance", "API")
    Rel(portal, sentry, "Reports errors", "SDK")
```

### 2.2 Container Diagram (Level 2)

```mermaid
C4Container
    title Container Diagram - Agent Portal

    Person(user, "User", "Agent or Admin")

    Container_Boundary(frontend, "Frontend") {
        Container(spa, "React SPA", "React, TypeScript, Vite", "Single-page application with routing")
        Container(hooks, "Custom Hooks", "React Hooks", "State management and API calls")
    }

    Container_Boundary(backend, "Backend (Supabase)") {
        ContainerDb(postgres, "PostgreSQL", "Supabase Postgres", "Primary data store with pgvector")
        Container(auth, "Supabase Auth", "GoTrue", "JWT-based authentication")
        Container(storage, "Supabase Storage", "S3-compatible", "File uploads and documents")
        Container(functions, "Edge Functions", "Deno", "Serverless business logic")
    }

    Container_Boundary(external, "External Services") {
        Container(resend, "Resend", "Email API", "Transactional emails")
        Container(claude, "Claude API", "Anthropic", "AI chatbot")
    }

    Rel(user, spa, "Uses", "HTTPS")
    Rel(spa, hooks, "Uses")
    Rel(hooks, auth, "Authenticates", "HTTPS")
    Rel(hooks, postgres, "Queries", "PostgREST")
    Rel(hooks, storage, "Uploads files", "HTTPS")
    Rel(hooks, functions, "Invokes", "HTTPS")
    Rel(functions, postgres, "Reads/writes")
    Rel(functions, resend, "Sends emails")
    Rel(functions, claude, "AI requests")
```

### 2.3 Component Diagram - Frontend (Level 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REACT SPA (src/)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   App.tsx   │  │ProtectedRoute│  │  Contexts   │  │   Hooks     │        │
│  │ (Router)    │──│ (Auth Gate) │──│FeatureFlags │──│ useAuth     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  │ useProfile  │        │
│                                                      │ useRole     │        │
│  ┌──────────────────────────────────────────────────┴─────────────┘        │
│  │                                                                          │
│  │  PAGES (Route Handlers)                                                  │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│  │  │  Index   │Contracting│ Book of │ Carrier  │  Forms   │               │
│  │  │(Dashboard)│  Wizard  │ Business │Resources │ Library  │               │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│  │  │ Training │MyProfile │Compliance│ Admin/*  │  Auth/*  │               │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│  │                                                                          │
│  │  COMPONENTS (Feature-Organized)                                          │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│  │  │  admin/  │contracting│book-of- │ training/│  layout/ │               │
│  │  │          │ /sections │business/ │          │          │               │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│  │                                                                          │
│  │  UI LIBRARY (Shadcn/Radix)                                               │
│  │  ┌──────────────────────────────────────────────────────┐               │
│  │  │ Button, Dialog, Form, Table, Tabs, Accordion, ...   │               │
│  │  └──────────────────────────────────────────────────────┘               │
│  │                                                                          │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    lib/     │  │   utils/    │  │   types/    │  │integrations/│        │
│  │ sync.ts     │  │activityLog  │  │contracting  │  │  supabase/  │        │
│  │ rtsImport   │  │             │  │             │  │  client.ts  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Component Diagram - Backend (Level 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SHARED UTILITIES (_shared/)                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  auth.ts (JWT validation, role checking)                            │   │
│  │  cors.ts (CORS headers for allowed origins)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  AGENT LIFECYCLE                          ADMIN OPERATIONS                  │
│  ┌────────────────────┐                   ┌────────────────────┐           │
│  │ create-agent       │                   │ create-admin       │           │
│  │ send-setup-link    │                   │ delete-user        │           │
│  │ validate-password  │                   │ reset-user-password│           │
│  └────────────────────┘                   │ reset-contracting  │           │
│                                           └────────────────────┘           │
│  PDF GENERATION                           EMAIL                             │
│  ┌────────────────────┐                   ┌────────────────────┐           │
│  │ generate-contract  │                   │ send-contracting   │           │
│  │   -ing-pdf         │                   │   -packet          │           │
│  │ generate-growth    │                   │ send-agent-inquiry │           │
│  │   -plan-pdf        │                   │ microsoft-send     │           │
│  │ extract-pdf-fields │                   │   -email           │           │
│  └────────────────────┘                   └────────────────────┘           │
│                                                                             │
│  AI / RAG                                 INTEGRATIONS                      │
│  ┌────────────────────┐                   ┌────────────────────┐           │
│  │ agent-chat         │                   │ microsoft-oauth    │           │
│  │ agent-chat-rag     │                   │   -start           │           │
│  │ process-document   │                   │ microsoft-oauth    │           │
│  └────────────────────┘                   │   -callback        │           │
│                                           │ parse-production   │           │
│  UTILITY                                  │   -report          │           │
│  ┌────────────────────┐                   └────────────────────┘           │
│  │ fetch-edge-logs    │                                                    │
│  │ pdf-field-audit    │                                                    │
│  └────────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### 3.1 Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | React | 18.3 | UI library |
| **Language** | TypeScript | 5.8 | Type safety |
| **Build** | Vite | 5.4 | Development server & bundler |
| **Routing** | React Router | 6.30 | Client-side navigation |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Components** | Shadcn/ui + Radix | Latest | Accessible component library |
| **Forms** | React Hook Form + Zod | 7.61 / 3.25 | Form state + validation |
| **Server State** | TanStack Query | 5.83 | Data fetching & caching |
| **Charts** | Recharts | 2.15 | Data visualization |
| **Icons** | Lucide React | 0.462 | Icon library |
| **Notifications** | Sonner | 1.7 | Toast messages |
| **PDF** | jsPDF + pdfjs-dist | 3.0 / 5.4 | PDF generation & viewing |
| **Excel** | XLSX | 0.18 | Excel file parsing |
| **Monitoring** | Sentry | 10.34 | Error tracking & replay |

### 3.2 Backend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Platform** | Supabase | Latest | Backend-as-a-Service |
| **Database** | PostgreSQL | 17.6 | Primary data store |
| **Vector DB** | pgvector | - | AI embeddings (1536 dimensions) |
| **Auth** | Supabase Auth | - | JWT authentication |
| **Storage** | Supabase Storage | - | File uploads |
| **Functions** | Deno Edge Functions | - | Serverless compute |
| **Email** | Resend | - | Transactional email |
| **AI** | Claude (Anthropic) | - | Chatbot & RAG |

### 3.3 Infrastructure

| Component | Provider | Purpose |
|-----------|----------|---------|
| **Hosting** | Vercel | Frontend deployment |
| **Database** | Supabase Cloud | Managed PostgreSQL |
| **Functions** | Supabase Edge | Deno runtime |
| **CDN** | Vercel Edge | Static asset delivery |
| **DNS** | Custom domain | tigagenthub.com |

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Root router with error boundary
├── index.css                # Global styles + Tailwind
│
├── pages/                   # Route page components
│   ├── Index.tsx           # Dashboard
│   ├── ContractingPage.tsx # Multi-step wizard
│   ├── BookOfBusinessPage.tsx
│   ├── auth/               # Auth pages
│   │   ├── AuthPage.tsx
│   │   ├── SetPasswordPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   └── admin/              # Admin pages
│       ├── AdminDashboard.tsx
│       ├── AgentsPage.tsx
│       └── ...
│
├── components/              # Reusable components
│   ├── ui/                 # Shadcn component library
│   ├── admin/              # Admin-specific
│   ├── contracting/        # Contracting wizard
│   │   └── sections/       # Form sections
│   ├── book-of-business/   # Production tracking
│   ├── training/           # Video library
│   ├── layout/             # Page layouts
│   ├── Navigation.tsx
│   ├── ProtectedRoute.tsx
│   └── UserAvatarDropdown.tsx
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts          # Combined auth state
│   ├── useProfile.ts       # Profile + session
│   ├── useRole.ts          # Role-based permissions
│   ├── useContractingApplication.ts
│   ├── useContractingPdf.ts
│   └── ...
│
├── contexts/                # React Context providers
│   └── FeatureFlagsContext.tsx
│
├── lib/                     # Business logic
│   ├── sync.ts             # Book of Business sync
│   ├── rtsImport.ts        # RTS Excel import
│   └── formatters.ts
│
├── utils/                   # Utilities
│   └── activityLogger.ts   # Audit logging
│
├── types/                   # TypeScript definitions
│   └── contracting.ts
│
├── integrations/            # External service clients
│   └── supabase/
│       ├── client.ts       # SDK initialization
│       └── types.ts        # Auto-generated DB types
│
├── data/                    # Static data/constants
│   └── carriersData.ts
│
└── assets/                  # Images, logos
```

### 4.2 Routing Architecture

```typescript
// App.tsx - Route Configuration
<Routes>
  {/* Public */}
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/auth/set-password" element={<SetPasswordPage />} />
  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

  {/* Protected - Agents */}
  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
  <Route path="/contracting" element={<ProtectedRoute allowContractingOnly><ContractingPage /></ProtectedRoute>} />
  <Route path="/book-of-business" element={<ProtectedRoute><BookOfBusinessPage /></ProtectedRoute>} />
  {/* ... more agent routes */}

  {/* Protected - Admin */}
  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
  <Route path="/admin/agents" element={<ProtectedRoute requireAdmin><AgentsPage /></ProtectedRoute>} />
  <Route path="/admin/activity-log" element={<ProtectedRoute requireSuperAdmin><ActivityLogPage /></ProtectedRoute>} />
  {/* ... more admin routes */}
</Routes>
```

### 4.3 State Management Pattern

The application uses **hook composition** instead of Redux/Zustand:

```typescript
// useAuth.ts - Composite hook
export function useAuth() {
  const { user, profile, loading: profileLoading, onboardingStatus, isActive } = useProfile();
  const { roles, primaryRole, ...roleUtils } = useRole();

  return {
    // Auth state
    user,
    profile,
    isAuthenticated: !!user,
    loading: profileLoading,

    // Profile state
    onboardingStatus,
    isActive,

    // Role state
    roles,
    primaryRole,

    // Permission methods
    isAdmin: () => roleUtils.isAdmin(),
    isSuperAdmin: () => roleUtils.isSuperAdmin(),
    canAccessAdmin: () => roleUtils.canAccessAdmin(),
    hasDownline: () => roleUtils.hasDownline(),
  };
}
```

### 4.4 Form State Management

Multi-step forms use debounced auto-save:

```typescript
// useContractingApplication.ts
const DEBOUNCE_MS = 800;

function useContractingApplication() {
  const [application, setApplication] = useState<ContractingApplication | null>(null);
  const pendingUpdatesRef = useRef<Partial<ContractingApplication>>({});
  const debounceRef = useRef<NodeJS.Timeout>();

  const updateField = useCallback((field: string, value: any) => {
    // Optimistic update
    setApplication(prev => ({ ...prev!, [field]: value }));

    // Queue for DB write
    pendingUpdatesRef.current[field] = value;

    // Debounce
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => flushUpdates(), DEBOUNCE_MS);
  }, []);

  return { application, updateField, ... };
}
```

---

## 5. Backend Architecture

### 5.1 Edge Functions

| Function | Auth | Purpose |
|----------|------|---------|
| `create-agent` | Admin | Create agent account + send setup email |
| `create-admin` | Super Admin | Create admin account |
| `send-setup-link` | Admin | Resend password setup email |
| `delete-user` | Super Admin | Delete user account |
| `reset-user-password` | Super Admin | Reset user password |
| `generate-contracting-pdf` | Authenticated | Generate contracting packet PDF |
| `send-contracting-packet` | Authenticated | Email contracting packet |
| `agent-chat` | Authenticated | AI chatbot |
| `agent-chat-rag` | Authenticated | RAG-powered AI chatbot |
| `process-document` | Admin | Process document for RAG |
| `microsoft-oauth-start` | Public | Start OAuth flow |
| `microsoft-oauth-callback` | Public | OAuth callback handler |
| `microsoft-send-email` | Authenticated | Send email via Outlook |
| `parse-production-report` | Admin | Parse RTS Excel file |
| `send-agent-inquiry` | Public | Contact form submission |

### 5.2 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│ Browser │────▶│ Supabase    │────▶│ Edge Function│────▶│ Database │
│         │     │ Auth (JWT)  │     │ (validates)  │     │          │
└─────────┘     └─────────────┘     └──────────────┘     └──────────┘
     │                                     │
     │  1. Login with email/password       │
     │◀────────────────────────────────────│
     │  2. Receive JWT + refresh token     │
     │                                     │
     │  3. API call with Authorization     │
     │────────────────────────────────────▶│
     │  4. Function validates JWT          │
     │  5. Checks user_roles table         │
     │  6. Returns data if authorized      │
     │◀────────────────────────────────────│
```

### 5.3 Edge Function Pattern

```typescript
// Standard edge function structure
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Extract auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // 2. Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Validate user
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) throw new Error("Invalid token");

    // 4. Check roles if needed
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    // 5. Business logic...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

---

## 6. Data Architecture

### 6.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENTITIES                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │ auth.users  │────────▶│  profiles   │────────▶│ user_roles  │            │
│  │ (Supabase)  │  1:1    │             │  1:N    │             │            │
│  └─────────────┘         └──────┬──────┘         └─────────────┘            │
│                                 │                                            │
│         ┌───────────────────────┼───────────────────────┐                   │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │contracting_ │         │carrier_     │         │agent_       │            │
│  │applications │         │statuses     │         │certifications│           │
│  │ (JSON blob) │         │             │         │             │            │
│  └─────────────┘         └─────────────┘         └─────────────┘            │
│                                 │                                            │
│                                 ▼                                            │
│                          ┌─────────────┐                                    │
│                          │  carriers   │                                    │
│                          │             │                                    │
│                          └─────────────┘                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION TRACKING                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  profiles ◀────┐                                                            │
│                │                                                            │
│         ┌──────┴──────┐         ┌─────────────┐         ┌─────────────┐     │
│         │monthly_syncs│────────▶│sync_carrier_│         │ milestones  │     │
│         │             │  1:N    │uploads      │         │             │     │
│         └─────────────┘         └─────────────┘         └─────────────┘     │
│                │                       │                       ▲            │
│                │                       ▼                       │            │
│                │                ┌─────────────┐                │            │
│                │                │agent_carriers│               │            │
│                │                │ (selected)  │────────────────┘            │
│                │                └─────────────┘                             │
│                │                                                            │
│                ▼                                                            │
│         ┌─────────────┐                                                     │
│         │  policies   │                                                     │
│         │ (clients)   │                                                     │
│         └─────────────┘                                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           CARRIER RESOURCES                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│         ┌─────────────┐                                                     │
│         │  carriers   │                                                     │
│         └──────┬──────┘                                                     │
│                │                                                            │
│    ┌───────────┼───────────┬───────────────┐                               │
│    ▼           ▼           ▼               ▼                               │
│ ┌────────┐ ┌────────┐ ┌────────┐    ┌────────────┐                         │
│ │contacts│ │ links  │ │documents│   │carrier_    │                         │
│ │        │ │        │ │        │    │directory_* │                         │
│ └────────┘ └────────┘ └────────┘    └────────────┘                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | `user_id`, `full_name`, `email`, `npn`, `manager_id`, `onboarding_status` |
| `user_roles` | Role assignments | `user_id`, `role` (super_admin, admin, manager, agent) |
| `contracting_applications` | Contracting wizard data | `profile_id`, JSON fields for form sections |
| `carriers` | Carrier definitions | `code`, `name`, `display_name`, `rts_aliases` |
| `carrier_statuses` | Agent-carrier relationship | `profile_id`, `carrier_id`, `status`, `contract_year` |
| `agent_certifications` | RTS certifications | `profile_id`, `carrier_name`, `certification_year` |
| `monthly_syncs` | Production sync records | `profile_id`, `month`, `year`, `total_clients` |
| `sync_carrier_uploads` | Per-carrier uploads | `sync_id`, `carrier_code`, `client_count` |
| `milestones` | Achievement records | `profile_id`, `threshold`, `achieved_at` |
| `activity_logs` | Audit trail | `user_id`, `action_type`, `entity_type`, `metadata` |
| `document_chunks` | RAG vector embeddings | `content`, `embedding`, `metadata` |

### 6.3 Onboarding Status Flow

```
CONTRACTING_REQUIRED ──▶ CONTRACTING_SUBMITTED ──▶ APPOINTED
         │                        │                    │
         │                        │                    │
         ▼                        ▼                    ▼
    Forces /contracting      Admin reviews      Full platform
       route only             in queue            access
                                  │
                                  ▼
                              SUSPENDED
                                  │
                                  ▼
                           Auto logout on
                             next load
```

---

## 7. Security Architecture

### 7.1 Authentication

| Layer | Implementation |
|-------|----------------|
| **Identity Provider** | Supabase Auth (GoTrue) |
| **Credential Storage** | Supabase managed (bcrypt hashed) |
| **Session Management** | JWT tokens with refresh |
| **Token Storage** | Browser localStorage (Supabase SDK) |
| **Token Refresh** | Automatic via Supabase client |

### 7.2 Authorization Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: ROUTE PROTECTION (ProtectedRoute component)          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • requireAdmin: Admin or Super Admin only               │   │
│  │ • requireSuperAdmin: Super Admin only                   │   │
│  │ • requireAgent: Any authenticated agent                 │   │
│  │ • allowContractingOnly: Agents in CONTRACTING_REQUIRED  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 2: ROLE-BASED ACCESS CONTROL (user_roles table)         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Roles: super_admin > admin > manager > agent            │   │
│  │ Checked via useRole() hook                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 3: ONBOARDING STATUS GATES (profiles.onboarding_status) │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CONTRACTING_REQUIRED → Limited to /contracting          │   │
│  │ SUSPENDED → Auto logout, access denied                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 4: EDGE FUNCTION VALIDATION                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • JWT validation via supabase.auth.getUser()            │   │
│  │ • Role checking via user_roles query                    │   │
│  │ • Service role key for privileged operations            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 |
| Special character | At least 1 |
| Validation | Client + server side |

### 7.4 Data Protection

| Measure | Implementation |
|---------|----------------|
| **Transport** | HTTPS only |
| **API Keys** | Environment variables, never in code |
| **File Uploads** | Supabase Storage with auth |
| **PII** | Stored in Supabase (SOC2 compliant) |
| **Audit Trail** | activity_logs table |

---

## 8. Key Data Flows

### 8.1 Agent Onboarding Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AGENT ONBOARDING FLOW                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. ADMIN CREATES AGENT                                                      │
│     Admin Dashboard → "Start Agent Contracting"                              │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ create-agent edge function:                                          │    │
│  │ • Create Supabase auth user (temp password)                         │    │
│  │ • Insert profile (onboarding_status: CONTRACTING_REQUIRED)          │    │
│  │ • Assign 'independent_agent' role                                   │    │
│  │ • Generate password recovery link                                   │    │
│  │ • Send welcome email via Resend                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  2. AGENT RECEIVES EMAIL                                                     │
│     "Welcome to [Platform]" → Click "Activate Your Account"                  │
│     │                                                                        │
│     ▼                                                                        │
│  3. AGENT SETS PASSWORD                                                      │
│     /auth/set-password → Password form with strength indicator               │
│     │                                                                        │
│     ▼                                                                        │
│  4. AUTO-REDIRECT TO CONTRACTING                                             │
│     /contracting → Multi-step wizard (8 sections)                            │
│     │                                                                        │
│     │  ┌─────────────────────────────────────────────────────────────┐      │
│     │  │ Wizard Sections:                                            │      │
│     │  │ 1. Welcome / Carrier Intro                                  │      │
│     │  │ 2. Personal & Contact Info                                  │      │
│     │  │ 3. Licensing & ID                                           │      │
│     │  │ 4. Legal Questions                                          │      │
│     │  │ 5. Banking & Direct Deposit                                 │      │
│     │  │ 6. Training & Certificates                                  │      │
│     │  │ 7. Agreements & Signature                                   │      │
│     │  │ 8. Review & Submit                                          │      │
│     │  │                                                             │      │
│     │  │ Auto-save: Debounced 800ms to contracting_applications      │      │
│     │  └─────────────────────────────────────────────────────────────┘      │
│     │                                                                        │
│     ▼                                                                        │
│  5. SUBMIT CONTRACTING                                                       │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ generate-contracting-pdf + send-contracting-packet:                 │    │
│  │ • Generate multi-page PDF with form field mapping                   │    │
│  │ • Upload PDF to Supabase Storage                                    │    │
│  │ • Email packet to admin (caroline@...)                              │    │
│  │ • Email confirmation to agent                                       │    │
│  │ • Update status: CONTRACTING_SUBMITTED                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  6. ADMIN REVIEWS                                                            │
│     Admin Dashboard → Contracting Queue                                      │
│     │                                                                        │
│     ▼                                                                        │
│  7. ADMIN APPROVES                                                           │
│     Update status: APPOINTED → Agent has full access                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Book of Business Sync Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      BOOK OF BUSINESS SYNC FLOW                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CHECK SYNC STATUS                                                        │
│     checkSyncStatus()                                                        │
│     │                                                                        │
│     ├─ Has contracted carriers? ─────────── No ──▶ "Set up carriers"        │
│     │                                                                        │
│     ├─ Selected carriers to track? ──────── No ──▶ "Select carriers"        │
│     │                                                                        │
│     └─ Past 5th of month? ───────────────── No ──▶ "Sync not due yet"       │
│                │                                                             │
│                ▼ Yes to all                                                  │
│                                                                              │
│  2. INITIALIZE SYNC                                                          │
│     initializeSync()                                                         │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Create monthly_syncs record (month, year, status: 'in_progress')  │    │
│  │ • Calculate previous_month_total from prior sync                    │    │
│  │ • Create sync_carrier_uploads for each selected carrier             │    │
│  │ • Return sync ID + carrier upload records                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  3. AGENT UPLOADS PER CARRIER                                                │
│     For each carrier in agent_carriers:                                      │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ updateCarrierUpload(syncId, carrierCode, clientCount)               │    │
│  │ • Update sync_carrier_uploads.client_count                          │    │
│  │ • Set completed_at timestamp                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  4. COMPLETE SYNC                                                            │
│     completeSync()                                                           │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Sum all carrier uploads → total_clients                           │    │
│  │ • Calculate delta from previous month                               │    │
│  │ • Check milestone thresholds (100, 250, 500, 1000, 2500)           │    │
│  │ • Insert new milestone records if achieved                          │    │
│  │ • Update monthly_syncs status: 'completed'                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  5. MILESTONE REVEAL (if new milestone)                                      │
│     MilestoneReveal component → Confetti animation                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 RTS Import Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           RTS IMPORT FLOW                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Admin uploads Excel file → RTSImportPage.tsx                                │
│     │                                                                        │
│     ▼                                                                        │
│  importRTSCertifications(file)                                               │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 1: Parse Excel headers                                        │    │
│  │ • Identify certification columns (carrier names)                    │    │
│  │ • Extract year from column headers                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 2: Build NPN → Profile map                                    │    │
│  │ • Query profiles with NPNs                                          │    │
│  │ • Create lookup map for matching                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 3: Identify unmatched NPNs                                    │    │
│  │ • Find NPNs in RTS data not in profiles                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 4: Create stub profiles for unmatched                         │    │
│  │ • Insert profile with NPN, name from RTS                           │    │
│  │ • No user_id (not invited yet)                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 5: Upsert agent_certifications                                │    │
│  │ • For each agent row, for each carrier column                      │    │
│  │ • If certified (Y/Certified), upsert record                        │    │
│  │ • Batch in groups of 500                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 6: Upsert carrier_statuses                                    │    │
│  │ • For current year certifications                                  │    │
│  │ • Set status = 'contracted'                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 7: Log import results                                         │    │
│  │ • Insert rts_import_logs record                                    │    │
│  │ • Display results in UI                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  Results: { matched, created, imported, updated, errors }                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Architecture Decision Records

### ADR-001: React Hook Composition over Redux

**Status:** Accepted
**Date:** December 2025

**Context:**
Needed state management for auth, profile, roles, and form state.

**Decision:**
Use custom React hooks with composition (useAuth combines useProfile + useRole) instead of Redux/Zustand.

**Rationale:**
- Single user per session (no complex shared state)
- Hooks are more idiomatic to React
- Simpler mental model and debugging
- Less boilerplate than Redux

**Consequences:**
- Positive: Cleaner code, easier testing, smaller bundle
- Negative: May need refactor if multi-user collaboration added

---

### ADR-002: Debounced Auto-Save for Forms

**Status:** Accepted
**Date:** December 2025

**Context:**
Multi-step contracting wizard with many fields needs data persistence without excessive API calls.

**Decision:**
Implement 800ms debounced auto-save with optimistic updates.

**Rationale:**
- Prevents data loss on accidental navigation
- Reduces server load vs save-on-every-keystroke
- Provides responsive UI with optimistic updates

**Consequences:**
- Positive: Reliable data persistence, good UX
- Negative: Slight complexity in managing pending updates queue

---

### ADR-003: Edge Functions with Internal JWT Validation

**Status:** Accepted
**Date:** December 2025

**Context:**
Supabase JWT verification at gateway level had ECC key compatibility issues.

**Decision:**
Disable gateway JWT verification; validate tokens inside edge functions using `supabase.auth.getUser()`.

**Rationale:**
- Works around key format issues
- Still provides secure authentication
- Allows function-level auth customization

**Consequences:**
- Positive: Reliable auth, function-level control
- Negative: Slightly more code per function, small performance overhead

---

### ADR-004: JSONB for Nested Form Data

**Status:** Accepted
**Date:** December 2025

**Context:**
Contracting form has deeply nested data (addresses, agreements, legal questions).

**Decision:**
Store complex nested structures as JSONB columns in PostgreSQL.

**Rationale:**
- Flexible schema for evolving form structure
- Single-row updates for complex objects
- PostgreSQL JSONB is well-optimized

**Consequences:**
- Positive: Schema flexibility, simpler queries
- Negative: Harder to query individual nested fields, no FK constraints on nested data

---

### ADR-005: pgvector for RAG Embeddings

**Status:** Accepted
**Date:** January 2026

**Context:**
Need vector similarity search for AI chatbot (RAG).

**Decision:**
Use pgvector extension with 1536-dimension embeddings.

**Rationale:**
- Native PostgreSQL extension (no separate vector DB)
- Integrates with existing Supabase infrastructure
- Supports cosine similarity for semantic search

**Consequences:**
- Positive: Single database, simpler infrastructure
- Negative: May need scaling considerations for large embedding volumes

---

### ADR-006: Feature Flags via Database

**Status:** Accepted
**Date:** January 2026

**Context:**
Need ability to toggle features without redeployment.

**Decision:**
Implement feature_flags table with React Context provider.

**Rationale:**
- Runtime feature toggles
- Supports gradual rollout
- Admin-controllable via database

**Consequences:**
- Positive: Flexible feature management
- Negative: Additional database query on app load

---

## 10. Quality Attributes

### 10.1 Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Initial Load** | < 3s | Vite code splitting, lazy routes |
| **API Response** | < 500ms | Edge functions, indexed queries |
| **Form Save** | < 200ms perceived | Optimistic updates |
| **Build Size** | < 3MB | Tree shaking, dynamic imports |

### 10.2 Reliability

| Measure | Implementation |
|---------|----------------|
| **Error Monitoring** | Sentry with session replay |
| **Data Persistence** | Debounced auto-save |
| **Auth Resilience** | Auto token refresh |
| **Graceful Degradation** | Feature flags for unstable features |

### 10.3 Maintainability

| Practice | Implementation |
|----------|----------------|
| **Type Safety** | TypeScript end-to-end |
| **Code Organization** | Feature-based directory structure |
| **Documentation** | JSDoc comments, architecture docs |
| **Linting** | ESLint + TypeScript ESLint |

### 10.4 Scalability

| Concern | Approach |
|---------|----------|
| **Database** | Supabase managed PostgreSQL (auto-scaling) |
| **Functions** | Deno edge functions (distributed) |
| **Batch Processing** | Process in batches of 500 |
| **Caching** | TanStack Query with stale-while-revalidate |

---

## Appendix A: File Reference

### Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Build configuration |
| `tailwind.config.ts` | Styling configuration |
| `tsconfig.json` | TypeScript configuration |
| `supabase/config.toml` | Edge function configuration |

### Key Source Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root router and error boundary |
| `src/hooks/useAuth.ts` | Combined auth state |
| `src/hooks/useContractingApplication.ts` | Form state with auto-save |
| `src/lib/sync.ts` | Book of Business logic |
| `src/lib/rtsImport.ts` | RTS import pipeline |
| `supabase/functions/create-agent/index.ts` | Agent creation |
| `supabase/functions/generate-contracting-pdf/index.ts` | PDF generation |

### Database Migrations

Located in `supabase/migrations/` - 67 migration files covering:
- Core tables (profiles, user_roles, carriers)
- Contracting (contracting_applications, carrier_statuses)
- Production tracking (monthly_syncs, milestones)
- Carrier resources (carrier_directory_*, forms)
- AI/RAG (document_chunks, processing_jobs)
- Audit (activity_logs, rts_import_logs)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **NPN** | National Producer Number (unique agent identifier) |
| **RTS** | Ready to Sell (certification status) |
| **AHIP** | America's Health Insurance Plans (certification body) |
| **Contracting** | Process of setting up agent with carriers |
| **Book of Business** | Agent's portfolio of clients |
| **RAG** | Retrieval Augmented Generation (AI technique) |
| **Edge Function** | Serverless function running at edge locations |

---

## Appendix C: Code Health

*Sources: Architecture Review (Jan 25, 2026) and Code Quality Review (Jan 25, 2026)*

### Overall Health Scorecard

**Architecture Health: B+ | Code Quality: B**

| Category | Score | Notes |
|----------|-------|-------|
| Structure | A | Clear feature-based organization, logical groupings |
| Patterns | B+ | Good hook composition, some large files |
| Type Safety | B- | 109 `any` usages need attention |
| Error Handling | A- | Consistent try/catch with toast feedback |
| Security | B+ | OAuth token encryption pending |
| Performance | B- | Bundle optimized post-review; image assets remain large |
| Testing | F | 0% test coverage (no unit, integration, or E2E tests) |
| Documentation | A- | Well-documented, good inline comments |
| Maintainability | B | Some large files need refactoring |

### Codebase Statistics

| Metric | Count |
|--------|-------|
| Frontend files (.tsx) | 134 |
| Frontend files (.ts) | 38 |
| Custom hooks | 13 |
| UI components (Shadcn) | 58 |
| Feature components | ~60 |
| Edge functions | 21 |
| Database migrations | 67 |

### ESLint Analysis

**Total issues: 104 (85 errors, 19 warnings)**

| Issue Type | Count | Severity |
|------------|-------|----------|
| `@typescript-eslint/no-explicit-any` | 76 | Error |
| `react-refresh/only-export-components` | 12 | Warning |
| `react-hooks/exhaustive-deps` | 4 | Warning |
| `no-useless-escape` | 4 | Error |
| `@typescript-eslint/no-require-imports` | 1 | Error |

**Top files needing attention:**

| File | Issue Count | Primary Issue |
|------|-------------|---------------|
| `pdf-field-audit/index.ts` | 7 | `any` types |
| `generate-contracting-pdf/index.ts` | 4 | `any` types |
| `AgentProfilePage.tsx` | 4 | `any` types + size (2,002 lines) |
| `ContractingForm.tsx` | 3 | `any` types (878 lines) |
| `LicensingSection.tsx` | 3 | `any` types |

**Recommended ESLint additions:**

```javascript
// eslint.config.js
rules: {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  '@typescript-eslint/no-explicit-any': 'error',
}
```

### Bundle Size Analysis

**Post-optimization (Jan 25, 2026):**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main JS bundle (gzip) | 682 KB | 134 KB | 80% smaller |
| Initial load (gzip) | 682 KB | ~227 KB | 67% smaller |
| Chunk count | 1 | ~50 | Route-based splitting |
| Build warnings | 1 | 0 | Resolved |
| CSS (gzip) | 22 KB | 22 KB | Unchanged |
| Build time | 21s | 38s | Slightly longer |

**Optimizations applied:**

1. **Route-based code splitting** via `React.lazy()` -- 19 pages lazy-loaded (only auth flow eagerly loaded)
2. **Vendor chunk splitting** via Vite `manualChunks`:
   - vendor-react: 53 KB gzip
   - vendor-ui: 39 KB gzip
   - vendor-supabase: 43 KB gzip
   - vendor-pdf: 129 KB gzip (lazy)
   - xlsx: 142 KB gzip (lazy)
3. **Build configuration** -- ES2020 target, esbuild minification, dependency pre-bundling

**Remaining optimization opportunities:**

| Item | Current | Target | Action |
|------|---------|--------|--------|
| tyler-logo.png | 769 KB | <100 KB | Convert to WebP, compress |
| favicon.png | 1.1 MB | <50 KB | Create proper ICO/SVG |
| Font subsets | All loaded | Latin only | Remove unused font subsets |

### Security Findings

#### High Priority

| Issue | Location | Risk |
|-------|----------|------|
| OAuth tokens stored unencrypted | `microsoft-oauth-callback/index.ts:133-134` | Token theft if DB compromised |
| Token decryption TODO | `microsoft-send-email/index.ts:130` | Token exposure |

**Recommendation:** Implement AES encryption for OAuth tokens before production use of Outlook integration.

#### Security Best Practices Checklist

| Practice | Status |
|----------|--------|
| No hardcoded secrets | Pass |
| Environment variables | Pass (via Supabase) |
| Input validation | Partial (manual checks, Zod installed but underutilized) |
| XSS prevention | Pass (React escaping) |
| SQL injection | Pass (Supabase client parameterized) |
| CSRF protection | Pass (Supabase Auth) |
| Secure headers | Pass (Edge function CORS) |

### Code Smells

**Console statements:** 107 occurrences across 39 files. Should be removed or converted to structured logging for production.

**TODO/FIXME items:** 7 total (3 security-related OAuth encryption, 2 video tracking, 2 bulk operations).

**Large files (refactoring candidates):**

| File | Lines | Recommendation |
|------|-------|----------------|
| `AgentProfilePage.tsx` | 2,002 | Split into ProfileEditForm, AgentDocuments, CertificationPanel |
| `ContractingForm.tsx` | 878 | Extract section logic to hooks |
| `ContractingQueuePage.tsx` | 811 | Extract list/detail views |
| `UserDetailPage.tsx` | 675 | Legacy -- consider removal |

**Code duplication patterns:**

| Pattern | Occurrences | Action |
|---------|-------------|--------|
| Form field rendering | Multiple sections | Extract to shared component |
| Error toast patterns | ~40 instances | Create error toast utility |
| Loading state UI | ~30 instances | Create LoadingState component |

### Tech Debt Inventory

#### High Priority

| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| OAuth token encryption | Edge functions | Medium | Security |
| AgentProfilePage refactor | pages/admin | High | Maintainability |
| Type `any` cleanup (76 instances) | Throughout | Medium | Type safety |

#### Medium Priority

| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| Add basic test coverage | New files | High | Quality |
| UserDetailPage removal | pages/admin | Low | Cleanup |
| Console log cleanup | Throughout | Low | Production readiness |
| TanStack Query deeper integration | hooks | Medium | Performance |

#### Low Priority

| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| Video completion tracking | VideoSidebar | Low | Feature |
| Bulk operations | AllAgentsTab | Medium | Feature |
| Enable strict TypeScript | tsconfig | High | Type safety |
| Storybook for component library | New | Medium | Documentation |

### Testing Status

| Metric | Value |
|--------|-------|
| Unit tests | 0 |
| Integration tests | 0 |
| E2E tests | 0 |
| Test coverage | 0% |

**Recommended test stack:** Vitest + Testing Library (unit/component), Playwright (E2E), Istanbul/c8 (coverage).

**Priority test targets:**

```
Unit:        src/lib/formatters.ts, src/lib/errors.ts, src/hooks/useFormValidation.ts
Component:   ProtectedRoute.tsx, ContractingForm sections, Admin data tables
E2E:         Login flow, Agent contracting submission, Admin agent management
```

### Memoization Usage

| Pattern | Count | Assessment |
|---------|-------|------------|
| useState | ~150 | Standard usage |
| useEffect | ~120 | Standard usage |
| useCallback | ~90 | Good usage |
| useMemo | ~50 | Good usage |
| React.memo | ~6 | Could increase for list items |

---

## Appendix D: Schema Reference -- Carrier Contracting

*Source: Carrier Contracting Schema Summary (Jan 22, 2026)*

### Table: `carriers`

Master list of insurance carriers.

```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- 'aetna', 'humana', 'uhc', etc.
  name TEXT NOT NULL,                  -- 'Aetna', 'Humana', 'UnitedHealthcare'
  display_name TEXT,                   -- Short display name
  is_active BOOLEAN DEFAULT true,
  requires_non_resident_states BOOLEAN DEFAULT true,
  requires_corporate_resolution BOOLEAN DEFAULT false,
  rts_aliases TEXT[],                  -- ['UHC', 'United', 'UnitedHealthcare Medicare']
  product_tags TEXT[],
  state_availability TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Current carriers:** aetna, anthem, cigna, devoted, essence, humana, molina, uhc, wellcare, bcbs

### Table: `carrier_statuses`

Contracting status per agent per carrier. Primary table for knowing which carriers an agent is contracted with.

```sql
CREATE TABLE carrier_statuses (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  user_id UUID,                                -- Legacy: auth user ID (may be null for imported agents)
  carrier_id UUID REFERENCES carriers(id),
  contracting_status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'contracted' | 'issue'
  contracting_submitted_at TIMESTAMPTZ,
  contracted_at TIMESTAMPTZ,
  contracting_link_sent_at TIMESTAMPTZ,
  contracting_link_url TEXT,
  link_resend_requested_at TIMESTAMPTZ,
  issue_description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, carrier_id)
);
```

**Status values:**

| Status | Meaning | Set By |
|--------|---------|--------|
| `not_started` | No contracting action taken | Default |
| `in_progress` | Carrier request email sent to Pinnacle | Admin (Request Carrier modal) |
| `contracted` | Agent is RTS with carrier | RTS Import or manual update |
| `issue` | Problem with contracting | Admin manual update |

### Table: `agent_certifications`

RTS certification data imported from Pinnacle spreadsheets. Tracks certification year per carrier/product combination.

```sql
CREATE TABLE agent_certifications (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_name TEXT NOT NULL,          -- 'Aetna', 'Humana', 'UHC'
  product_type TEXT NOT NULL,          -- 'MA', 'PDP', 'MEDIGAP', 'ALL_ANCILLARY', 'MAPD'
  certification_year INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, carrier_name, product_type)
);
```

### Table: `agent_carriers`

Tracks which carriers an agent wants to track in their Book of Business. Separate from contracting status -- this is what the agent explicitly selects for production tracking.

```sql
CREATE TABLE agent_carriers (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_id UUID REFERENCES carriers(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, carrier_id)
);
```

### Production Tables: `clients` and `policies`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  medicare_number VARCHAR(15) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_initial VARCHAR(5),
  date_of_birth DATE,
  phone VARCHAR(20),
  address_line1 TEXT,
  address_city TEXT,
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, medicare_number)
);

CREATE TABLE policies (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  carrier_id UUID REFERENCES carriers(id),
  profile_id UUID REFERENCES profiles(id),
  carrier_member_id TEXT,
  plan_name TEXT,
  effective_date DATE,
  term_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  source_upload_id UUID,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(client_id, carrier_id)
);
```

### Production Uploads Table

```sql
CREATE TABLE production_uploads (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_id UUID REFERENCES carriers(id),
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'complete', 'error'
  error_message TEXT,
  total_rows INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES profiles(id)
);
```

### Entity Relationships (Carrier Domain)

```
profiles (agent)
    |
    +---> carrier_statuses ---> carriers
    |     (contracting status)
    |
    +---> agent_certifications
    |     (RTS certs, uses carrier_name string)
    |
    +---> agent_carriers ---> carriers
    |     (Book of Business tracking selection)
    |
    +---> clients
    |       +---> policies ---> carriers
    |             (production data)
    |
    +---> production_uploads ---> carriers
          (upload history)
```

### RTS Import Flow Detail

**Source:** `src/lib/rtsImport.ts`

1. Admin uploads Pinnacle RTS Excel file (sheet named "Certs")
2. System parses columns in format `Carrier: Product` (e.g., "Aetna: MA")
3. For each row:
   - Extract NPN from column D
   - Match NPN to profile via `profiles.npn`
   - If no profile exists, create stub profile (no `user_id`, not yet invited)
   - Import certifications to `agent_certifications`
   - For current-year certs, also update `carrier_statuses` to "contracted"
4. Uses `carriers.rts_aliases` for name normalization (e.g., "UHC" -> "uhc" carrier code)
5. Logs import results to `rts_import_logs`

### Carrier Selection UI Notes

**Admin view (AgentProfilePage.tsx):**
- Displays carrier statuses in a card showing contracted carriers
- Shows status indicators (contracted, in_progress, issue, not_started)
- "Request Carrier" modal allows admins to select carriers not yet in `carrier_statuses`, send email to Pinnacle for contracting, and create records with status "in_progress"

**Agent view (NewAgentSetup.tsx -- Book of Business):**
- Shown when agent first accesses Book of Business
- Agent selects carriers they are contracted with
- Saves to `agent_carriers` table
- Currently scoped to 4 carriers via `getSupportedCarriers()` in sync.ts (humana, aetna, anthem, wellcare)

### Architecture Note: Dual Carrier Tracking

There are two separate systems for tracking carrier relationships:

1. **Contracting** (`carrier_statuses`) -- Which carriers is the agent contracted with?
2. **Book of Business** (`agent_carriers`) -- Which carriers does the agent want to track production for?

These currently operate independently. A potential consolidation path is to add a `track_in_book_of_business BOOLEAN` column to `carrier_statuses` and deprecate the `agent_carriers` table.

---

## Appendix E: Known Issues

*Source: Codebase Summary (Jan 25, 2026)*

### Incomplete Features

- **Industry Updates Page:** Placeholder content only -- no real data source
- **Training Library:** Video player and sidebar exist but limited content
- **AI Chat:** Edge functions deployed (`agent-chat`, `agent-chat-rag`) but feature not fully integrated in agent-facing UI

### TIG-Specific Items Pending Removal

- About page (TIG leadership bios)
- Contact page (TIG staff directory)
- "Direct to TIG" labels throughout the UI
- `internal_tig_agent` role naming convention
- `ownership_group: a_and_a` references in data

### Technical Debt (Non-Code)

- Some carrier data is Kentucky-specific (state availability, plan details)
- Forms Library contains carrier-specific content that may not be portable to other markets
- `admin/UserDetailPage.tsx` is legacy and possibly unused (superseded by AgentProfilePage)

### Needs Decision

- **Book of Business:** Complete Smart Sync integration (parse-production-report edge function) or simplify to manual entry?
- **Training Library:** Source generic Medicare sales content or remove the feature?
- **Forms Library:** Make carrier/state configurable or remove carrier-specific forms?
