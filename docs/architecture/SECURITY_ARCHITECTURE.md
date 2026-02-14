# Security Architecture

**Version:** 1.0
**Last Updated:** February 9, 2026
**Parent:** [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication](#2-authentication)
3. [Authorization & RBAC](#3-authorization--rbac)
4. [Row Level Security (RLS)](#4-row-level-security-rls)
5. [Edge Function Security](#5-edge-function-security)
6. [Data Protection](#6-data-protection)
7. [Threat Model](#7-threat-model)
8. [Known Vulnerabilities](#8-known-vulnerabilities)
9. [Security Checklist](#9-security-checklist)

---

## 1. Security Overview

The Agent Portal handles sensitive Medicare agent data (PII, banking details, licensing) and implements defense-in-depth across 8 security layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEFENSE-IN-DEPTH MODEL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Layer 1: NETWORK (HTTPS/TLS)                               │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │ Layer 2: AUTHENTICATION (JWT)                         │   │     │
│  │  │  ┌───────────────────────────────────────────────┐   │   │     │
│  │  │  │ Layer 3: ROUTE PROTECTION (React)               │   │   │     │
│  │  │  │  ┌─────────────────────────────────────────┐   │   │   │     │
│  │  │  │  │ Layer 4: RBAC (user_roles)                │   │   │   │     │
│  │  │  │  │  ┌───────────────────────────────────┐   │   │   │   │     │
│  │  │  │  │  │ Layer 5: RLS (PostgreSQL policies)  │   │   │   │   │     │
│  │  │  │  │  │  ┌─────────────────────────────┐   │   │   │   │   │     │
│  │  │  │  │  │  │ Layer 6: EDGE FUNCTION AUTH  │   │   │   │   │   │     │
│  │  │  │  │  │  │  ┌───────────────────────┐   │   │   │   │   │   │     │
│  │  │  │  │  │  │  │ Layer 7: ACCOUNT GATE  │   │   │   │   │   │   │     │
│  │  │  │  │  │  │  │  ┌─────────────────┐   │   │   │   │   │   │   │     │
│  │  │  │  │  │  │  │  │ Layer 8: AUDIT   │   │   │   │   │   │   │   │     │
│  │  │  │  │  │  │  │  └─────────────────┘   │   │   │   │   │   │   │     │
│  │  │  │  │  │  │  └───────────────────────┘   │   │   │   │   │   │     │
│  │  │  │  │  │  └─────────────────────────────┘   │   │   │   │   │     │
│  │  │  │  │  └───────────────────────────────────┘   │   │   │   │     │
│  │  │  │  └─────────────────────────────────────────┘   │   │   │     │
│  │  │  └───────────────────────────────────────────────┘   │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 Authentication Provider

| Property | Value |
|----------|-------|
| Provider | Supabase Auth (GoTrue) |
| Method | Email/password |
| Token Format | JWT (RS256) |
| Token Storage | Browser localStorage |
| Session Persistence | `persistSession: true` |
| Token Refresh | `autoRefreshToken: true` |

### 2.2 Authentication Flow

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐       ┌────────────┐
│  Browser  │       │ Supabase Auth │       │  PostgreSQL   │       │ Application│
│           │       │   (GoTrue)    │       │              │       │            │
└─────┬─────┘       └──────┬────────┘       └──────┬───────┘       └─────┬──────┘
      │                    │                       │                     │
      │ 1. POST /auth/v1/  │                       │                     │
      │    token (email,   │                       │                     │
      │    password)       │                       │                     │
      │───────────────────▶│                       │                     │
      │                    │ 2. Verify bcrypt hash │                     │
      │                    │──────────────────────▶│                     │
      │                    │                       │                     │
      │ 3. JWT + refresh   │                       │                     │
      │    token           │                       │                     │
      │◀───────────────────│                       │                     │
      │                    │                       │                     │
      │ 4. Store in        │                       │                     │
      │    localStorage    │                       │                     │
      │───────────────────────────────────────────────────────────────▶│
      │                    │                       │                     │
      │ 5. Parallel fetch: │                       │                     │
      │    profile +       │                       │                     │
      │    roles +         │                       │                     │
      │    downline        │                       │                     │
      │───────────────────────────────────────────▶│                     │
      │                    │                       │                     │
      │ 6. Auth state      │                       │                     │
      │    populated       │                       │                     │
      │◀──────────────────────────────────────────────────────────────│
      │                    │                       │                     │
```

### 2.3 Password Reset Flow

```
1. User clicks "Forgot Password" → /auth/forgot-password
2. App calls supabase.auth.resetPasswordForEmail(email)
3. Supabase sends recovery email with token
4. User clicks link → redirected to /auth/set-password with recovery token in hash
5. App detects `type=recovery` in URL hash → shows password form
6. User sets new password (validated against policy)
7. App calls supabase.auth.updateUser({ password })
```

### 2.4 Invite Flow (Admin-Created Accounts)

```
1. Admin calls create-agent edge function
2. Function creates auth user with temp password
3. Function generates recovery link via supabase.auth.admin.generateLink()
4. Resend sends email with recovery link
5. Agent clicks link → same flow as password reset
```

### 2.5 Password Policy

| Requirement | Enforced By |
|-------------|-------------|
| Minimum 12 characters | Client (SetPasswordPage) + Edge Function (validate-password) |
| At least 1 uppercase | Client + Edge Function |
| At least 1 lowercase | Client + Edge Function |
| At least 1 number | Client + Edge Function |
| At least 1 special char | Client + Edge Function |
| Visual strength indicator | Client only |

### 2.6 Session Management

| Property | Implementation |
|----------|----------------|
| Token expiry | Supabase default (1 hour JWT, 7 day refresh) |
| Auto-refresh | SDK handles transparently |
| Logout | `supabase.auth.signOut()` clears localStorage |
| Tab sync | Not implemented (each tab manages own session) |

---

## 3. Authorization & RBAC

### 3.1 Role Hierarchy

```
super_admin  (Level 5 — Highest)
     │
     ▼
   admin      (Level 4)
     │
     ▼
  manager     (Level 3)
     │
     ▼
internal_tig_agent  (Level 2)
     │
     ▼
independent_agent   (Level 1 — Lowest)
```

### 3.2 Role Capabilities Matrix

| Capability | Super Admin | Admin | Manager | TIG Agent | Ind. Agent |
|------------|:-----------:|:-----:|:-------:|:---------:|:----------:|
| Create admins | X | | | | |
| Delete users | X | | | | |
| View activity logs | X | | | | |
| Manage feature flags | X | | | | |
| Create agents | X | X | | | |
| Process contracting queue | X | X | | | |
| RTS import | X | X | | | |
| Send emails | X | X | | | |
| View downline | X | X | X | | |
| Access admin dashboard | X | X | | | |
| Contracting wizard | | | | X | X |
| Book of Business sync | | | | X | X |
| Carrier resources | | | | X | X |
| Training | | | | X | X |

### 3.3 Route Protection

```typescript
// ProtectedRoute.tsx — Decision tree
function ProtectedRoute({
  requireAdmin,
  requireSuperAdmin,
  requireAgent,
  allowContractingOnly,
  children
}) {
  // 1. Not authenticated → redirect /auth
  // 2. Dual-role + agent view mode → block admin routes
  // 3. requireSuperAdmin → redirect if not super_admin
  // 4. requireAdmin → redirect if not (super_admin || admin)
  // 5. requireAgent → redirect if not agent
  // 6. CONTRACTING_REQUIRED status → force /contracting
  // 7. allowContractingOnly → only accessible to agents needing contracting
}
```

### 3.4 Dual-Role Users

Users can have multiple roles (e.g., admin + agent). The `ViewModeContext` handles this:

```
┌───────────────────────────────────────────────────┐
│ ViewModeContext                                     │
│                                                     │
│  viewMode: 'admin' | 'agent'                       │
│                                                     │
│  When viewMode = 'admin':                          │
│  └── Full admin dashboard access                   │
│                                                     │
│  When viewMode = 'agent':                          │
│  └── Admin routes blocked via ProtectedRoute       │
│  └── Agent dashboard shown                         │
│  └── Switch via UserAvatarDropdown                 │
│                                                     │
└───────────────────────────────────────────────────┘
```

---

## 4. Row Level Security (RLS)

### 4.1 Security Definer Functions

These functions use `SECURITY DEFINER` to bypass RLS and prevent recursive policy evaluation:

```sql
-- Check if a user has a specific role
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Get the calling user's profile ID
CREATE FUNCTION get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT id FROM profiles WHERE user_id = auth.uid());
END;
$$;

-- Check if the calling user has downline agents
CREATE FUNCTION current_user_has_downline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE manager_id = get_my_profile_id()
  );
END;
$$;
```

### 4.2 RLS Policy Patterns

#### Profiles Table

```sql
-- Users can view their own profile
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles" ON profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );

-- Managers can view their team's profiles
CREATE POLICY "Managers view team" ON profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND
    manager_id = get_my_profile_id()
  );

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

#### Sync Tables (monthly_syncs, sync_carrier_uploads)

```sql
-- Users view own syncs
CREATE POLICY "Users view own syncs" ON monthly_syncs
  FOR SELECT USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Admins view all syncs
CREATE POLICY "Admins view all syncs" ON monthly_syncs
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );

-- Users can insert/update own syncs
CREATE POLICY "Users manage own syncs" ON monthly_syncs
  FOR ALL USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
```

#### Activity Logs (Immutable Audit Trail)

```sql
-- Only super admins can read
CREATE POLICY "Super admins read logs" ON activity_logs
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- Users can insert their own logs (audit trail)
CREATE POLICY "Users insert own logs" ON activity_logs
  FOR INSERT WITH CHECK (user_id = get_my_profile_id());

-- NO UPDATE or DELETE policies = immutable
```

#### Agent Certifications

```sql
-- Users view their own certifications
CREATE POLICY "Users view own certs" ON agent_certifications
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Admins view all
CREATE POLICY "Admins view all certs" ON agent_certifications
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
  );
```

### 4.3 RLS Bypass in Edge Functions

Edge functions use the **service role key** which bypasses all RLS policies:

```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // ⚠ Bypasses RLS
);
```

This is necessary because edge functions need to:
- Create auth users (admin-only operation)
- Insert profiles for users who don't exist yet
- Query across user boundaries for reports
- Send emails on behalf of users

**Mitigation:** All edge functions perform their own auth and role checks before any operations.

---

## 5. Edge Function Security

### 5.1 Authentication Pattern

```typescript
// Standard auth check in every edge function
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  throw new Error("No authorization header");
}

const { data: { user }, error } = await supabase.auth.getUser(
  authHeader.replace("Bearer ", "")
);
if (error || !user) {
  throw new Error("Invalid token");
}
```

### 5.2 Role Checking Pattern

```typescript
// For admin-only functions
const { data: roles } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id);

const isAdmin = roles?.some(r =>
  r.role === "super_admin" || r.role === "admin"
);
if (!isAdmin) {
  throw new Error("Admin access required");
}
```

### 5.3 CORS Configuration

```typescript
// _shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // TODO: Restrict to production domain
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

### 5.4 Function Auth Requirements

| Auth Level | Functions |
|------------|-----------|
| **Public** | validate-password, microsoft-oauth-start, microsoft-oauth-callback, send-agent-inquiry |
| **Authenticated** | generate-contracting-pdf, send-contracting-packet, agent-chat, agent-chat-rag, microsoft-send-email, generate-growth-plan-pdf |
| **Admin** | create-agent, send-setup-link, reset-contracting, parse-production-report, process-document, extract-pdf-fields, pdf-field-audit |
| **Super Admin** | create-admin, delete-user, reset-user-password, promote-to-admin, fetch-edge-logs |

---

## 6. Data Protection

### 6.1 Sensitive Data Classification

| Data Type | Examples | Storage | Protection |
|-----------|----------|---------|------------|
| **Authentication** | Passwords, JWT tokens | Supabase Auth (bcrypt) | Managed by Supabase |
| **PII** | Name, email, phone, SSN-adjacent (NPN) | `profiles` table | RLS policies |
| **Financial** | Bank routing/account numbers | `contracting_applications` (JSONB) | RLS + edge function auth |
| **Licensing** | Driver's license, NPN, E&O policy | `contracting_applications` + `profiles` | RLS policies |
| **Medical Business** | Client counts, carrier data | `monthly_syncs`, `policies` | RLS policies |
| **OAuth Tokens** | Microsoft Graph tokens | Database (unencrypted) | **Known vulnerability** |

### 6.2 Transport Security

| Component | TLS Version | Certificate |
|-----------|-------------|-------------|
| Vercel (frontend) | TLS 1.2+ | Auto-managed (Let's Encrypt) |
| Supabase (API) | TLS 1.2+ | Auto-managed |
| Supabase (Edge Functions) | TLS 1.2+ | Auto-managed |
| Resend (email API) | TLS 1.2+ | Provider-managed |

### 6.3 Secret Management

| Secret | Storage Location | Access |
|--------|-----------------|--------|
| Supabase URL | Environment variable (Vercel) | Frontend (public) |
| Supabase Anon Key | Environment variable (Vercel) | Frontend (public, safe) |
| Supabase Service Role Key | Supabase Edge Function env | Edge functions only |
| Resend API Key | Supabase Edge Function env | Edge functions only |
| Anthropic API Key | Supabase Edge Function env | Edge functions only |
| Microsoft OAuth Client Secret | Supabase Edge Function env | Edge functions only |
| Sentry DSN | Environment variable (Vercel) | Frontend (public, safe) |

---

## 7. Threat Model

### 7.1 STRIDE Analysis

| Threat | Category | Mitigation | Residual Risk |
|--------|----------|------------|---------------|
| **Session hijacking** | Spoofing | JWT with auto-refresh, HTTPS only | Medium (localStorage XSS) |
| **Unauthorized data access** | Tampering | RLS policies, role checks | Low |
| **Action attribution** | Repudiation | Immutable activity_logs | Low (super admin only) |
| **PII exposure** | Info Disclosure | RLS, edge function auth | Low |
| **Account lockout** | Denial of Service | Supabase rate limiting | Low |
| **Role escalation** | Elevation | DB-level role checks, security definer | Low |

### 7.2 Attack Surface

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ATTACK SURFACE                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EXTERNAL (Internet-Facing)                                          │
│  ├── Vercel: React SPA (static files, no server logic)              │
│  ├── Supabase PostgREST: Direct DB queries (gated by RLS)          │
│  ├── Supabase Auth: Login/signup/password reset endpoints            │
│  ├── Edge Functions: 21 serverless endpoints (auth-gated)           │
│  └── Supabase Storage: File upload/download (auth-gated)            │
│                                                                      │
│  CLIENT-SIDE                                                         │
│  ├── localStorage: JWT tokens (XSS risk)                            │
│  ├── React Router: Client-side route protection (bypassable)        │
│  └── Form data: Sensitive fields in memory                          │
│                                                                      │
│  INTERNAL                                                            │
│  ├── Service Role Key: Full DB access (edge functions only)         │
│  ├── Supabase Dashboard: Full admin access                          │
│  └── Vercel Dashboard: Deployment + env variables                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.3 Key Security Boundaries

| Boundary | Trust Zone Change | Protection |
|----------|-------------------|------------|
| Browser → Supabase | Untrusted → Authenticated | JWT validation |
| PostgREST → PostgreSQL | Authenticated → Data access | RLS policies |
| Browser → Edge Functions | Untrusted → Authenticated | JWT + role check |
| Edge Functions → PostgreSQL | Privileged → Data access | Service role (bypasses RLS) |
| Edge Functions → External APIs | Internal → External | API keys in env vars |

---

## 8. Known Vulnerabilities

### 8.1 Microsoft OAuth Token Storage

**Severity:** Medium
**Description:** OAuth tokens from Microsoft Graph integration are stored in the database without encryption.
**Impact:** Database breach would expose email access tokens.
**Recommendation:** Use Supabase Vault extension for encrypted secret storage, or implement token encryption at the application layer.

### 8.2 CORS Wildcard

**Severity:** Low
**Description:** Edge functions use `Access-Control-Allow-Origin: *` instead of restricting to production domain.
**Impact:** Any origin can make credentialed requests (mitigated by JWT requirement).
**Recommendation:** Restrict CORS to `https://www.tigagenthub.com` and development URLs.

### 8.3 Client-Side Route Protection

**Severity:** Low
**Description:** Route protection is client-side only (React component). A determined user could bypass UI restrictions.
**Impact:** Minimal — all data access is gated by RLS at the database level.
**Mitigation:** RLS is the true security boundary; client-side protection is UX only.

### 8.4 localStorage Token Storage

**Severity:** Low-Medium
**Description:** JWT tokens stored in localStorage are accessible to any JavaScript running on the page.
**Impact:** XSS vulnerability could steal tokens.
**Mitigation:** Content Security Policy headers, no user-generated HTML rendering, Supabase SDK handles storage.

---

## 9. Security Checklist

### For New Edge Functions

- [ ] Validate Authorization header
- [ ] Call `supabase.auth.getUser()` with token
- [ ] Check user roles if admin-only
- [ ] Use service role client for DB operations
- [ ] Return proper error codes (401/403)
- [ ] Include CORS headers
- [ ] Log access in activity_logs if appropriate

### For New Database Tables

- [ ] Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Add SELECT policy (who can read?)
- [ ] Add INSERT policy with `WITH CHECK`
- [ ] Add UPDATE policy if needed
- [ ] Consider if DELETE should be allowed
- [ ] Use `has_role()` for admin bypass
- [ ] Use `get_my_profile_id()` for owner checks
- [ ] Test policies with different role levels

### For New Frontend Routes

- [ ] Wrap in `<ProtectedRoute>` with appropriate props
- [ ] Set `requireAdmin` or `requireSuperAdmin` if admin-only
- [ ] Handle `allowContractingOnly` if applicable
- [ ] Test with agent, admin, and super admin roles
- [ ] Verify deactivated accounts can't access
