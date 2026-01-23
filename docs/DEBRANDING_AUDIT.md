# De-Branding Audit Report

**Date:** 2026-01-22
**Purpose:** Identify all Tyler Insurance Group branding and agency-specific references for platform de-branding

---

## 1. CRITICAL (User-Facing Text)

### 1.1 Page Titles & Headers

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/AboutPage.tsx` | 54 | "About Tyler Insurance Group" | NEEDS DECISION (new brand name) |
| `src/pages/AboutPage.tsx` | 55 | "Kentucky's Medicare-focused FMO" | NEEDS DECISION (remove geographic tie) |
| `src/pages/AboutPage.tsx` | 89 | "...most trusted Medicare-focused FMO in Kentucky and beyond" | NEEDS DECISION |

### 1.2 Footer & Copyright

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/Footer.tsx` | 6 | "© 2025 Tyler Insurance Group • Licensed Agent Platform • All Rights Reserved" | NEEDS DECISION (new brand name) |
| `src/pages/Index.tsx` | 188 | "© 2025 Tyler Insurance Group" | NEEDS DECISION (new brand name) |

### 1.3 Auth Pages (Login/Signup/Password)

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/AuthPage.tsx` | 164 | `<img ... alt="Tyler Insurance Group">` | Update alt text to new brand |
| `src/pages/auth/SetPasswordPage.tsx` | 235, 278 | `<img ... alt="Tyler Insurance Group">` | Update alt text to new brand |
| `src/pages/auth/ForgotPasswordPage.tsx` | 51, 107 | `<img ... alt="Tyler Insurance Group">` | Update alt text to new brand |

### 1.4 Navigation & Password Gate

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/Navigation.tsx` | 55 | `alt="Tyler Insurance Group"` | Update alt text |
| `src/components/PasswordGate.tsx` | 83 | `alt="Tyler Insurance Group"` | Update alt text |
| `src/components/PasswordGate.tsx` | 111 | "Secure access for licensed Tyler Insurance Group agents." | NEEDS DECISION |

### 1.5 Training & Contracting

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/training/TrainingHeader.tsx` | 15 | `alt="Tyler Insurance Group"` | Update alt text |
| `src/components/contracting/ContractingForm.tsx` | 364, 730 | `alt="Tyler Insurance Group"`, `alt="Tyler Insurance"` | Update alt text |

### 1.6 PDF Generation (Certifications)

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/CertificationsPage.tsx` | 365 | "Tyler Insurance Group • Licensed Agent Platform" | NEEDS DECISION |

### 1.7 Admin Dashboard

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/admin/AdminDashboard.tsx` | 202 | `alt="Tyler Insurance Group"` | Update alt text |

---

## 2. CRITICAL - Contact Information & People Names

### 2.1 Contact Page (Entire file needs replacement)

| File | Line(s) | Current Content | Action |
|------|---------|-----------------|--------|
| `src/pages/ContactPage.tsx` | 10-32 | Austin Tyler, Andrew Horn, Caroline Horn contact cards | NEEDS DECISION - Replace or make configurable |
| `src/pages/ContactPage.tsx` | 13, 21, 29 | @tylerinsurancegroup.com emails | Replace with new domain |

### 2.2 About Page Leadership Section

| File | Line(s) | Current Content | Action |
|------|---------|-----------------|--------|
| `src/pages/AboutPage.tsx` | 9-28 | Austin Tyler, Andrew Horn, Caroline Horn leadership cards | NEEDS DECISION - Replace or remove |

### 2.3 Auth Page Contact Info

| File | Line(s) | Current Content | Action |
|------|---------|-----------------|--------|
| `src/pages/AuthPage.tsx` | 336-342 | Austin (859) 619-6672 and Andrew (210) 722-5597 | NEEDS DECISION |

### 2.4 Headshot Assets

| File | Action |
|------|--------|
| `src/assets/austin-headshot.jpg` | REMOVE or replace |
| `src/assets/andrew-headshot.png` | REMOVE or replace |
| `src/assets/caroline-headshot.jpg` | REMOVE or replace |

---

## 3. CRITICAL - Email Functions (Supabase Edge Functions)

### 3.1 `send-contracting-packet/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 129 | `from: "Tyler Insurance Group <austin@send.tylerinsurancegroup.com>"` | NEEDS DECISION |
| 130-131 | `reply_to: "austin@tylerinsurancegroup.com"`, `to: ["caroline@tylerinsurancegroup.com"]` | Replace emails |
| 177-178 | Same from/reply_to pattern | Replace |
| 201 | `contact Caroline at caroline@tylerinsurancegroup.com` | Replace |
| 205-206 | "Austin Tyler" signature, "Tyler Insurance Group" | Replace |

### 3.2 `send-agent-inquiry/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 81 | `from: "Tyler Insurance Group <onboarding@resend.dev>"` | Replace |
| 82 | `to: ["austin@tylerinsurancegroup.com", "andrew@tylerinsurancegroup.com"]` | Replace |
| 103 | "submitted through the Tyler Insurance Group Agent Portal" | Replace |
| 126-128 | `from: "Tyler Insurance Group"`, "We received your inquiry - Tyler Insurance Group" | Replace |
| 133 | "becoming an agent with Tyler Insurance Group" | Replace |
| 139-140 | "Austin Tyler: (859) 619-6672", "Andrew Horn: (210) 722-5597" | Replace |
| 147 | "Tyler Insurance Group" signature | Replace |

### 3.3 `create-agent/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 183 | `from: "Caroline Horn <caroline@tylerinsurancegroup.com>"` | Replace |
| 185 | `subject: "Welcome to Tyler Insurance Group"` | Replace |
| 215-218 | Caroline signature, email | Replace |

### 3.4 `create-admin/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 122 | `from: "Austin Tyler <austin@tylerinsurancegroup.com>"` | Replace |
| 137 | `alt="Tyler Insurance Group"` in email HTML | Replace |
| 144 | "Your Tyler Insurance Group admin account is ready" | Replace |
| 160 | "Austin", "Tyler Insurance Group" signature | Replace |

### 3.5 `send-setup-link/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 158 | `from: "Caroline Horn <caroline@tylerinsurancegroup.com>"` | Replace |

### 3.6 `generate-growth-plan-pdf/index.ts`

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 718 | "Tyler Insurance Group | Confidential" | Replace |
| 897 | "Tyler Insurance Group | Confidential" | Replace |
| 1685 | "Tyler Insurance Group" centered text | Replace |

### 3.7 AI Chat Functions

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `agent-chat/index.ts` | 18, 32 | "Tyler Insurance Group Agent Assistant", "Tyler Insurance Group platform" | Replace |
| `agent-chat-rag/index.ts` | 85, 99 | Same pattern | Replace |

---

## 4. CRITICAL - Contracting Form Legal Text

### 4.1 Agreements Section

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/contracting/sections/AgreementsSection.tsx` | 14 | "I authorize Tyler Insurance Group to enter this information on my behalf." | NEEDS DECISION |
| `src/components/contracting/sections/AgreementsSection.tsx` | 15 | "I authorize Tyler Insurance Group to affix my signature to carrier documents." | NEEDS DECISION |

### 4.2 Legal Disclaimers

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/contracting/sections/BackgroundSignatureSection.tsx` | 150 | "I will notify Tyler Insurance Group within five (5) days..." | NEEDS DECISION |
| `src/components/contracting/sections/LegalQuestionsSection.tsx` | 407 | "I will notify Tyler Insurance Group within five (5) days..." | NEEDS DECISION |
| `src/components/contracting/sections/SignatureSection.tsx` | 172 | "hereby authorize Tyler Insurance Group to affix or append a facsimile..." | NEEDS DECISION |
| `src/components/contracting/sections/MarketingConsentSection.tsx` | 56 | "agree to let Tyler Insurance Group send me information about" | NEEDS DECISION |

### 4.3 Admin Modals

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/admin/AgentProfilePage.tsx` | 773-774 | "Caroline Horn\nTyler Insurance Group" | Replace |
| `src/components/contracting/SendToPinnacleModal.tsx` | 68-69 | "Caroline Horn\nTyler Insurance Group" | Replace |

---

## 5. CRITICAL - "TIG" and "Direct to TIG" References

### 5.1 Admin UI - "Direct to TIG" Labels

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/admin/AllAgentsTab.tsx` | 529, 676, 787 | "Direct to TIG" | "Direct (No Manager)" or similar |
| `src/components/admin/AssignManagerModal.tsx` | 277, 289 | "Direct to TIG" | Replace |
| `src/components/admin/HierarchyAssignmentPanel.tsx` | 138, 161 | "None (Direct to TIG)", "Direct to TIG (no manager)" | Replace |
| `src/components/admin/UserManagementTable.tsx` | 400, 531 | "Direct to TIG" | Replace |
| `src/pages/admin/NewAgentPage.tsx` | 93, 246 | "Direct to TIG" | Replace |

### 5.2 Role Labels - "TIG Agent"

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/admin/AgentProfilePage.tsx` | 116 | `internal_tig_agent: { label: 'TIG Agent'...}` | NEEDS DECISION |
| `src/pages/admin/UserDetailPage.tsx` | 70 | `internal_tig_agent: 'Internal TIG Agent'` | NEEDS DECISION |
| `src/components/admin/UserManagementTable.tsx` | 141, 466, 713 | "TIG Agent" label and select options | NEEDS DECISION |
| `src/components/UserAvatarDropdown.tsx` | 24 | `internal_tig_agent: { label: 'TIG Agent'...}` | NEEDS DECISION |
| `src/components/admin/CreateUserDialog.tsx` | 52 | `internal_tig_agent: 'Internal TIG Agent'` | NEEDS DECISION |

### 5.3 Role Hook

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/hooks/useRole.ts` | 108 | `isInternalTigAgent` function name | Rename function |

### 5.4 Database Type - `internal_tig_agent`

| File | Line(s) | Notes |
|------|---------|-------|
| `src/integrations/supabase/types.ts` | 1180, 1317 | Auto-generated - will update with migration |
| `supabase/migrations/20251208182754_*.sql` | 25, 73 | Contains enum definition |
| `supabase/functions/_shared/auth.ts` | 8 | Type definition |

---

## 6. SECONDARY (Metadata & Config)

### 6.1 index.html

| Line(s) | Current Text | Suggested Replacement |
|---------|--------------|----------------------|
| 6-7 | `/tyler-logo.png` favicon | Replace with new logo |
| 8 | `<title>Tyler Insurance Group \| Agent Platform</title>` | NEEDS DECISION |
| 10 | `<meta name="author" content="Tyler Insurance Group" />` | Replace |
| 12 | `<meta property="og:title" content="Tyler Insurance Group \| Agent Platform" />` | Replace |
| 15 | `<meta property="og:image" content="/tyler-logo.png" />` | Replace |
| 18 | `<meta name="twitter:site" content="@TylerInsurance" />` | REMOVE or replace |
| 19 | `<meta name="twitter:image" content="/tyler-logo.png" />` | Replace |

### 6.2 package.json

| Line | Current | Notes |
|------|---------|-------|
| 2 | `"name": "vite_react_shadcn_ts"` | Generic - OK as is |

### 6.3 ContractingHubPage Email Links

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/pages/ContractingHubPage.tsx` | 534 | `mailto:caroline@tylerinsurancegroup.com` | Replace with configurable email |

### 6.4 CreateAdminDialog Placeholder

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/admin/CreateAdminDialog.tsx` | 110 | `placeholder="Caroline Horn"` | Replace with generic |
| `src/components/admin/CreateAdminDialog.tsx` | 124 | `placeholder="caroline@tylerinsurancegroup.com"` | Replace |

### 6.5 AssignManagerModal & NewAgentPage Manager Lists

| File | Line(s) | Current Text | Suggested Replacement |
|------|---------|--------------|----------------------|
| `src/components/admin/AssignManagerModal.tsx` | 26 | `'Andrew Horn'` in featured managers | Remove hardcoded names |
| `src/pages/admin/NewAgentPage.tsx` | 22 | `'Andrew Horn'` in featured managers | Remove hardcoded names |

---

## 7. ASSETS (Images/Logos)

### 7.1 Logo Files (MUST REPLACE)

| File | Location | Action |
|------|----------|--------|
| `src/assets/tyler-logo.png` | Source | Replace with new logo |
| `public/tyler-logo.png` | Public | Replace with new logo |
| `public/favicon.ico` | Public | Replace with new favicon |
| `public/favicon.png` | Public | Replace with new favicon |

### 7.2 Headshot Files (REMOVE)

| File | Action |
|------|--------|
| `src/assets/austin-headshot.jpg` | Remove |
| `src/assets/andrew-headshot.png` | Remove |
| `src/assets/caroline-headshot.jpg` | Remove |

---

## 8. DOCUMENTATION (Non-User-Facing but Should Update)

These files reference TIG but are documentation/config - update for consistency:

| File | Notes |
|------|-------|
| `.cursorrules` | Lines 1, 44, 45 - "TIG Platform" references |
| `TIG_PLATFORM_CONTEXT.md` | Entire file is TIG-specific |
| `DESIGN_SYSTEM.md` | Lines 1, 320 - "TIG Platform Design System" |
| `docs/ADMIN_STYLE_GUIDE.md` | Lines 39, 50, 58 - TIG references |
| `docs/MVP_ANALYSIS.md` | Lines 5, 128, 166, etc. - Person name references |
| `docs/ux-audit-admin-dashboard-2026-01-19.md` | Multiple Caroline references |
| `docs/CARRIER_CONTRACTING_SCHEMA_SUMMARY.md` | Line 5 - TIG reference |
| `docs/SEND_SETUP_LINK_FEATURE.md` | Email templates |
| `docs/TIG_PLATFORM_FOUNDATION_AUDIT.md` | TIG-specific |
| `ROADMAP_GENERATOR_COMPLETE_DOCUMENTATION.md` | Line 1212 |
| `MVP_READINESS_ANALYSIS.md` | Line 2 |
| `LEARNING_LOG.md` | Line 29 - "Andrew's team" |
| `setup-email-routing-outlook-code.md` | Multiple references (deprecated?) |
| `all-agents-page-code.md` | Multiple TIG references (deprecated?) |

### 8.1 Scripts (May need updating)

| File | Notes |
|------|-------|
| `scripts/assign-hierarchy.ts` | Lines 32, 38, 40, 43+ - Andrew Horn, Austin Tyler, MGA logic |
| `scripts/import-agents.ts` | Line 33 - Andrew Horn NPN |
| `scripts/check-jay-eldridge.ts` | "Direct to TIG" strings |
| `scripts/data-integrity-check.ts` | "Direct to TIG" strings |
| `scripts/list-direct-to-tig.ts` | Entire file |

---

## 9. DATABASE CONSIDERATIONS

### 9.1 Role Enum Migration Required

The `internal_tig_agent` role is stored in the database enum. A migration would be needed to rename this:

```sql
-- This would require a careful migration
ALTER TYPE app_role RENAME VALUE 'internal_tig_agent' TO 'internal_agent';
```

### 9.2 Migration Comments

| File | Line(s) | Notes |
|------|---------|-------|
| `supabase/migrations/20251220004659_*.sql` | 24, 26 | Comments reference "Caroline" |
| `supabase/migrations/20260119000000_*.sql` | 2-3, 19 | Comments reference "Austin + Andrew" |

---

## 10. NEEDS DISCUSSION

### 10.1 Geographic Ties
- Kentucky-first defaults in carrier data
- "Kentucky's Medicare-focused FMO" tagline
- State-specific data structure

### 10.2 Ownership Group
- `a_and_a` ownership group (Austin & Andrew)
- Migration comment references

### 10.3 Role Naming
- What should `internal_tig_agent` become?
- Options: `internal_agent`, `staff_agent`, `company_agent`

### 10.4 "Direct to TIG" Replacement
- Options: "Direct (No Manager)", "Unassigned", "Agency Direct"

### 10.5 PDF Templates
- Database exports contain TIG references in PDF field mappings
- `database-export/system-config-pdf-template-fields.json`
- `database-export/system-config-pdf-field-mappings.json`

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Source files with "Tyler Insurance Group" | ~25 |
| Source files with "TIG" references | ~20 |
| Email functions to update | 6 |
| Contracting legal text sections | 6 |
| Asset files to replace | 7 |
| People name references | ~50+ |
| @tylerinsurancegroup.com email refs | ~20 |
| Phone number refs (Austin/Andrew) | 6 |
| Documentation files | 15+ |
| Scripts | 5 |

---

## Recommended Priority Order

1. **Phase 1 - Core Branding**
   - Replace logo files (3 locations)
   - Update index.html metadata
   - Update Footer, Navigation, auth pages

2. **Phase 2 - Email Functions**
   - Update all 6 Supabase edge functions
   - Replace sender addresses, signatures

3. **Phase 3 - Legal Text**
   - Update contracting form agreements
   - Update legal disclaimers

4. **Phase 4 - Admin UI**
   - Replace "Direct to TIG" labels
   - Update role labels

5. **Phase 5 - Database**
   - Plan migration for `internal_tig_agent` enum
   - Update related code after migration

6. **Phase 6 - Contact/About Pages**
   - Decide: Remove, replace, or make configurable

7. **Phase 7 - Cleanup**
   - Documentation updates
   - Script updates
   - Remove unused assets
