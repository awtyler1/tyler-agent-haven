# Deployment Architecture

**Version:** 1.0
**Last Updated:** February 9, 2026
**Parent:** [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Frontend Deployment (Vercel)](#2-frontend-deployment-vercel)
3. [Backend Infrastructure (Supabase)](#3-backend-infrastructure-supabase)
4. [Edge Functions Deployment](#4-edge-functions-deployment)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Environment Configuration](#6-environment-configuration)
7. [DNS and Domains](#7-dns-and-domains)
8. [Monitoring and Observability](#8-monitoring-and-observability)

---

## 1. Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE TOPOLOGY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              INTERNET                                       │
│                                 │                                           │
│                    ┌────────────┼────────────┐                             │
│                    │            │            │                             │
│                    ▼            ▼            ▼                             │
│           ┌──────────────┐ ┌──────────┐ ┌──────────┐                     │
│           │ Vercel CDN   │ │ Supabase │ │ Sentry   │                     │
│           │ (Frontend)   │ │ Cloud    │ │ (Errors) │                     │
│           │              │ │          │ │          │                     │
│           │ • React SPA  │ │ • Auth   │ │ • Error  │                     │
│           │ • Static     │ │ • DB     │ │   tracking│                    │
│           │   assets     │ │ • Storage│ │ • Session │                    │
│           │ • Edge cache │ │ • Edge Fn│ │   replay  │                    │
│           └──────────────┘ └────┬─────┘ └──────────┘                     │
│                                 │                                         │
│                    ┌────────────┼────────────┐                           │
│                    │            │            │                           │
│                    ▼            ▼            ▼                           │
│           ┌──────────────┐ ┌──────────┐ ┌──────────┐                   │
│           │  Resend      │ │ Microsoft│ │ Anthropic│                   │
│           │  (Email)     │ │ Graph    │ │ (AI)     │                   │
│           │              │ │ (Outlook)│ │          │                   │
│           └──────────────┘ └──────────┘ └──────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Deployment (Vercel)

### 2.1 Deployment Configuration

| Property | Value |
|----------|-------|
| Provider | Vercel |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node Version | 18+ |
| Branch | `main` (auto-deploy) |
| Domain | tigagenthub.com / www.tigagenthub.com |

### 2.2 Build Pipeline

```
git push main
      │
      ▼
Vercel detects push
      │
      ▼
┌──────────────────────────────────────────────┐
│ Build Phase:                                  │
│ 1. npm install                                │
│ 2. npm run build (vite build)                 │
│    ├── TypeScript compilation                 │
│    ├── Tree shaking + dead code elimination   │
│    ├── Code splitting (lazy routes)           │
│    ├── Asset optimization (images, CSS)       │
│    └── Source map generation (for Sentry)     │
│ 3. Output to dist/                            │
└──────────────────────────────────────────────┘
      │
      ▼
Vercel Edge Network
      │
      ├── Static files → CDN (global edge cache)
      ├── index.html → Edge (SPA fallback routing)
      └── _headers → Security headers
```

### 2.3 Build Optimization

| Optimization | Implementation |
|-------------|----------------|
| Code splitting | React.lazy() for all non-critical routes |
| Dynamic imports | XLSX library (~425KB) loaded on-demand |
| Image optimization | PNG→WebP (tyler-logo: 769KB→17KB) |
| Tree shaking | Vite's Rollup-based dead code elimination |
| Chunk splitting | Vendor chunk for React, Radix, TanStack |
| Compression | Vercel auto gzip/brotli |

### 2.4 Vercel Edge Features

| Feature | Usage |
|---------|-------|
| Edge Functions | Not used (backend is Supabase) |
| Preview Deployments | Auto for PR branches |
| Analytics | Not configured |
| ISR/SSR | Not used (client-side SPA) |

---

## 3. Backend Infrastructure (Supabase)

### 3.1 Supabase Project

| Property | Value |
|----------|-------|
| Project ID | mgczpsrtkdkkjzmztpyd |
| Region | (Supabase default) |
| Plan | (Production tier) |

### 3.2 Services

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE SERVICES                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │   Auth      │  │  Storage    │             │
│  │   17.6      │  │  (GoTrue)   │  │ (S3-compat) │             │
│  │             │  │             │  │             │             │
│  │ • 21+ tables│  │ • Email/pass│  │ • Contract- │             │
│  │ • RLS       │  │ • JWT       │  │   ing PDFs  │             │
│  │ • pgvector  │  │ • Recovery  │  │ • Agent docs│             │
│  │ • Functions │  │ • Rate limit│  │ • Production│             │
│  │             │  │             │  │   reports   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │Edge Functions│  │  Realtime   │                               │
│  │  (21 Deno)  │  │ (not used)  │                               │
│  │             │  │             │                               │
│  │ • Globally  │  │             │                               │
│  │   distributed│ │             │                               │
│  │ • Auto-scale│  │             │                               │
│  └─────────────┘  └─────────────┘                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Database Configuration

| Property | Value |
|----------|-------|
| Engine | PostgreSQL 17.6 |
| Extensions | pgvector, uuid-ossp, pgtap |
| RLS | Enabled on all user-facing tables |
| Migrations | 67+ files in `supabase/migrations/` |
| Backup | Supabase managed (daily) |

---

## 4. Edge Functions Deployment

### 4.1 Deployment Process

```bash
# Deploy all edge functions
npm run deploy:functions

# This runs:
supabase functions deploy --project-ref mgczpsrtkdkkjzmztpyd
```

### 4.2 Function Structure

```
supabase/functions/
├── _shared/                    # Shared utilities
│   ├── auth.ts                # JWT validation helpers
│   └── cors.ts                # CORS headers
├── create-agent/
│   └── index.ts               # Each function = directory + index.ts
├── create-admin/
│   └── index.ts
├── ... (21 function directories)
└── promote-to-admin/
    └── index.ts
```

### 4.3 Runtime Environment

| Property | Value |
|----------|-------|
| Runtime | Deno (latest stable) |
| Execution | Edge locations (global) |
| Memory | 256MB (Supabase default) |
| Timeout | 60s (default), configurable |
| Scaling | Auto (0 to N instances) |
| Cold start | ~200-500ms typical |

### 4.4 Environment Variables (Edge Functions)

| Variable | Source | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Auto-injected | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Admin DB access (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Auto-injected | Public DB access |
| `RESEND_API_KEY` | Manual config | Email sending |
| `ANTHROPIC_API_KEY` | Manual config | Claude AI |
| `MICROSOFT_CLIENT_ID` | Manual config | Outlook OAuth |
| `MICROSOFT_CLIENT_SECRET` | Manual config | Outlook OAuth |
| `MICROSOFT_TENANT_ID` | Manual config | Outlook OAuth |

---

## 5. CI/CD Pipeline

### 5.1 Current Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Developer                                                               │
│     │                                                                    │
│     │ git push main                                                      │
│     │                                                                    │
│     ├─────────────────────────────────┐                                  │
│     │                                 │                                  │
│     ▼                                 ▼                                  │
│  ┌───────────────────┐     ┌────────────────────┐                       │
│  │ VERCEL (Frontend)  │     │ MANUAL (Functions)  │                       │
│  │                    │     │                     │                       │
│  │ 1. Detect push     │     │ npm run deploy:     │                       │
│  │ 2. npm install     │     │   functions         │                       │
│  │ 3. npm run build   │     │                     │                       │
│  │ 4. Deploy to CDN   │     │ (run manually when  │                       │
│  │                    │     │  edge functions      │                       │
│  │ ✅ Auto on push    │     │  change)             │                       │
│  └───────────────────┘     └────────────────────┘                       │
│                                                                          │
│  ⚠ No automated tests in pipeline                                       │
│  ⚠ No staging environment                                               │
│  ⚠ Edge functions deployed manually                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Deployment Checklist

**Frontend changes:**
- [x] Push to `main` → auto-deploys to Vercel

**Edge function changes:**
- [ ] Run `npm run deploy:functions` manually
- [ ] Verify function is accessible via Supabase dashboard
- [ ] Test function via curl or the app

**Database migrations:**
- [ ] Apply via Supabase dashboard or `supabase db push`
- [ ] Verify RLS policies work correctly
- [ ] Test with different user roles

---

## 6. Environment Configuration

### 6.1 Frontend Environment Variables

| Variable | Environment | Public |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Vercel env | Yes (embedded in bundle) |
| `VITE_SUPABASE_ANON_KEY` | Vercel env | Yes (safe — anon key) |
| `VITE_SENTRY_DSN` | Vercel env | Yes (Sentry allows public DSN) |

### 6.2 Supabase Environment

| Variable | Set By | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Supabase (auto) | Database URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (auto) | Admin access key |
| `SUPABASE_ANON_KEY` | Supabase (auto) | Public access key |
| `RESEND_API_KEY` | Supabase secrets | Email API |
| `ANTHROPIC_API_KEY` | Supabase secrets | AI API |
| `MICROSOFT_CLIENT_ID` | Supabase secrets | Outlook integration |
| `MICROSOFT_CLIENT_SECRET` | Supabase secrets | Outlook integration |
| `MICROSOFT_TENANT_ID` | Supabase secrets | Outlook integration |

---

## 7. DNS and Domains

### 7.1 Domain Configuration

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `tigagenthub.com` | Vercel | Root domain |
| `www.tigagenthub.com` | Vercel | Primary production URL |
| `mgczpsrtkdkkjzmztpyd.supabase.co` | Supabase | API + Auth endpoints |

### 7.2 URL Structure

```
Frontend:    https://www.tigagenthub.com
Supabase:    https://mgczpsrtkdkkjzmztpyd.supabase.co
Auth:        https://mgczpsrtkdkkjzmztpyd.supabase.co/auth/v1/
PostgREST:   https://mgczpsrtkdkkjzmztpyd.supabase.co/rest/v1/
Storage:     https://mgczpsrtkdkkjzmztpyd.supabase.co/storage/v1/
Functions:   https://mgczpsrtkdkkjzmztpyd.supabase.co/functions/v1/{name}
```

---

## 8. Monitoring and Observability

### 8.1 Monitoring Stack

```
┌──────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │    SENTRY         │  │ SUPABASE DASH    │  │ VERCEL DASH      │  │
│  │                   │  │                  │  │                  │  │
│  │ • JS errors       │  │ • DB metrics     │  │ • Deploy status  │  │
│  │ • Breadcrumbs     │  │ • Auth logs      │  │ • Build logs     │  │
│  │ • Session replay  │  │ • Edge fn logs   │  │ • Analytics      │  │
│  │ • Performance     │  │ • Storage usage  │  │ • Edge metrics   │  │
│  │ • Release tracking│  │ • API requests   │  │                  │  │
│  │                   │  │ • Query perf     │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────┐                                                │
│  │ INTERNAL          │                                                │
│  │                   │                                                │
│  │ • activity_logs   │  (Super admin: /admin/activity-log)           │
│  │ • fetch-edge-logs │  (Edge function for log retrieval)            │
│  │                   │                                                │
│  └──────────────────┘                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Sentry Configuration

```typescript
// main.tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,      // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 100% on error
});
```

### 8.3 Alerting

| Source | Alert Type | Destination |
|--------|------------|-------------|
| Sentry | JS errors, performance regressions | Email / Sentry dashboard |
| Supabase | Database health, function failures | Supabase dashboard |
| Vercel | Build failures | Email / Vercel dashboard |

### 8.4 Health Checks

No formal health check endpoints are implemented. System health is monitored via:
- Sentry error rates
- Supabase dashboard metrics
- Manual verification after deploys
