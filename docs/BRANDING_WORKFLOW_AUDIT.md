# Comprehensive Branding & Workflow Audit
**Date:** January 25, 2026
**Purpose:** Document all TIG branding and workflows for white-label pivot

---

## PART 1: WORKFLOW AUDIT

### 1. New Admin Workflow

#### Trigger Location
- **File:** `src/components/admin/CreateAdminDialog.tsx`
- **Entry Point:** UserAvatarDropdown.tsx → "Create Admin" menu item (Super Admin only)
- **Edge Function:** `supabase/functions/create-admin/index.ts`

#### Email Template
| Field | Value |
|-------|-------|
| **From** | `Austin Tyler <austin@tylerinsurancegroup.com>` |
| **Subject** | `"Your TIG Admin Account"` |
| **Redirect URL** | `https://www.tigagenthub.com/auth/set-password` |

#### Email Body Copy
```
Hi [FirstName],

Your Tyler Insurance Group admin account is ready.

Click below to set your password:

[Set Your Password Button]

Once you're in, you'll be able to manage agents, track contracting,
and keep everything running smoothly.

If you have any questions, just reply to this email.

---

Austin
Tyler Insurance Group
```

#### Onboarding Flow
1. Admin clicks link in email → `/auth/set-password`
2. Sets password (12+ chars, mixed case, number, special char)
3. Auto-redirects to `/admin` (admin dashboard)

#### TIG References Found
- Line 19: Site URL default `https://www.tigagenthub.com`
- Line 122: From email `austin@tylerinsurancegroup.com`
- Line 137: Image alt text `"Tyler Insurance Group"`
- Line 144: Body text `"Your Tyler Insurance Group admin account is ready"`
- Line 160: Signature `"Austin\nTyler Insurance Group"`

---

### 2. New Agent Workflow

#### Trigger Location
- **File:** `src/pages/admin/NewAgentPage.tsx` → `handleSubmit()`
- **Entry Point:** Admin Dashboard → "Start Agent Contracting" button
- **Edge Function:** `supabase/functions/create-agent/index.ts`

#### Email Template
| Field | Value |
|-------|-------|
| **From** | `Caroline Horn <caroline@tylerinsurancegroup.com>` |
| **Subject** | `"Welcome to Tyler Insurance Group"` |
| **Redirect URL** | `https://www.tigagenthub.com/auth/set-password` |

#### Email Body Copy
```
Hi [FirstName],

Your account is set up and ready for activation.

Start here:
[Activate Your Account Button]

When you sign in, you'll be guided through our contracting wizard.
It takes about 15–20 minutes and covers:
- Personal and licensing information
- Carrier selections
- Banking details for commission deposits
- Digital signatures

Once complete, your contracting packet is automatically generated
and sent to our team. We'll handle the carrier appointments from there.

If anything is unclear, reply to this email and our team will help.

Welcome aboard.

Caroline
Director of Operations
Tyler Insurance Group
caroline@tylerinsurancegroup.com
```

#### Onboarding Flow
1. Agent clicks link → `/auth/set-password`
2. Sets password
3. Auto-redirects to `/contracting` (contracting wizard)
4. Completes 15-20 minute contracting form
5. Packet auto-generated and emailed to admin team

#### TIG References Found
- Line 183: From email `caroline@tylerinsurancegroup.com`
- Line 185: Subject `"Welcome to Tyler Insurance Group"`
- Line 217: Signature `"Tyler Insurance Group"`

---

### 3. Setup Link Workflow (Resend)

#### Trigger Location
- **File:** `src/components/admin/AllAgentsTab.tsx` → `sendSetupLinks()`
- **Entry Points:**
  - Bulk action: Select agents → "Send Setup Links" button
  - Single action: Agent quick view → "Send Setup Link" button
- **Edge Function:** `supabase/functions/send-setup-link/index.ts`

#### Email Template
| Field | Value |
|-------|-------|
| **From** | `Caroline Horn <caroline@tylerinsurancegroup.com>` |
| **Subject** | `"Your Agent Account Is Ready"` |
| **Redirect URL** | `https://www.tigagenthub.com/auth/set-password` |

#### Email Body Copy
```
Hi [FirstName],

We've been working on something to make your life easier.
A single place to run your Medicare business.

Your account is ready. Just set your password to get in.

[Set Your Password Button]

Questions? Just reply to this email.

— The TIG Team
```

#### TIG References Found
- Line 90: Site URL default `https://www.tigagenthub.com`
- Line 139: Signature `"— The TIG Team"`
- Line 158: From email `caroline@tylerinsurancegroup.com`

---

### 4. Contracting Packet Submission Workflow

#### Trigger Location
- **File:** `src/components/contracting/ContractingForm.tsx`
- **Edge Function:** `supabase/functions/send-contracting-packet/index.ts`

#### Email 1: Internal Notification (to Caroline)
| Field | Value |
|-------|-------|
| **From** | `Tyler Insurance Group <austin@send.tylerinsurancegroup.com>` |
| **Reply-To** | `austin@tylerinsurancegroup.com` |
| **To** | `caroline@tylerinsurancegroup.com` |
| **Subject** | `"New Contracting Packet Submission — [AgentName] (NPN [NPN])"` |

#### Email 2: Agent Confirmation
| Field | Value |
|-------|-------|
| **From** | `Tyler Insurance Group <austin@send.tylerinsurancegroup.com>` |
| **Reply-To** | `austin@tylerinsurancegroup.com` |
| **Subject** | `"We Received Your Contracting Packet"` |

#### Email Body Copy (Agent Confirmation)
```
Hi [AgentName],

Your contracting packet and documents have been successfully received.

A copy of your submitted contracting packet is attached to this email
for your records.

Our contracting team reviews all submissions within 2–3 business days.
If anything is missing or we need clarification, we'll reach out to you
at this email address. You'll also be notified as carriers begin
approving you.

Once you're approved, you'll be able to:
- Submit and track applications
- Access all carrier portals
- Use our quoting and enrollment tools
- Receive commissions without delays

If you have questions at any point, you can contact Caroline at
caroline@tylerinsurancegroup.com.

Best,
Austin Tyler
Tyler Insurance Group
```

---

## PART 2: BRANDING AUDIT

### Frontend - User-Facing Footers

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/pages/Index.tsx` | 296 | `Powered by Tyler Insurance Group` | Dashboard footer |
| `src/pages/FormsLibraryPage.tsx` | 402 | `Powered by Tyler Insurance Group` | Forms page footer |
| `src/pages/CarrierPlansPage.tsx` | 309 | `Powered by Tyler Insurance Group` | Plans page footer |
| `src/pages/ContractingHubPage.tsx` | 675 | `Powered by Tyler Insurance Group` | Certifications footer |
| `src/pages/CompliancePage.tsx` | 270 | `Powered by Tyler Insurance Group` | Compliance footer |
| `src/pages/CarrierResourcesPage.tsx` | 250 | `Powered by Tyler Insurance Group` | Resources footer |
| `src/pages/AgentToolsPage.tsx` | 110 | `Powered by Tyler Insurance Group` | Tools footer |
| `src/components/layout/AdminLayout.tsx` | 60 | `Powered by Tyler Insurance Group` | Admin layout footer |
| `src/components/training/TrainingLayout.tsx` | 44 | `Powered by Tyler Insurance Group` | Training footer |

### Frontend - Headers & Navigation

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/pages/Index.tsx` | 46 | `TIG` | Header logo text |
| `src/pages/CarrierResourcesPage.tsx` | 61 | `TIG` | Header logo text |
| `src/pages/CarrierPlansPage.tsx` | 118 | `TIG` | Header logo text |
| `src/pages/FormsLibraryPage.tsx` | ~50 | `TIG` | Header logo text |
| Multiple pages | Various | `Agent Portal` | Header subtitle |

### Frontend - Legal/Agreement Text (REQUIRES LEGAL REVIEW)

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/components/contracting/sections/AgreementsSection.tsx` | 14 | `I authorize Tyler Insurance Group to enter this information on my behalf.` | Legal checkbox |
| `src/components/contracting/sections/AgreementsSection.tsx` | 15 | `I authorize Tyler Insurance Group to affix my signature to carrier documents.` | Legal checkbox |
| `src/components/contracting/sections/BackgroundSignatureSection.tsx` | 150 | `I will notify Tyler Insurance Group within five (5) days of such a change.` | Legal agreement |
| `src/components/contracting/sections/LegalQuestionsSection.tsx` | 407 | `...I will notify Tyler Insurance Group within five (5) days...` | Legal agreement |
| `src/components/contracting/sections/MarketingConsentSection.tsx` | 56 | `...I agree to let Tyler Insurance Group send me information about...` | Marketing consent |
| `src/components/contracting/sections/SignatureSection.tsx` | 172 | `...authorize Tyler Insurance Group to affix or append a facsimile...` | Signature authorization |

### Frontend - Contact Links

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/pages/ContractingHubPage.tsx` | 565 | `mailto:caroline@tylerinsurancegroup.com` | License request link |
| `src/components/admin/CreateAdminDialog.tsx` | 124 | `placeholder="caroline@tylerinsurancegroup.com"` | Form placeholder |

### Frontend - Image Alt Text

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/pages/admin/AdminDashboard.tsx` | 202 | `alt="Tyler Insurance Group"` | Logo alt text |
| `src/components/contracting/ContractingForm.tsx` | 730 | `alt="Tyler Insurance"` | Logo alt text |

### Edge Functions - Email Configuration

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `supabase/functions/create-admin/index.ts` | 122 | `from: "Austin Tyler <austin@tylerinsurancegroup.com>"` | Email sender |
| `supabase/functions/create-admin/index.ts` | 123 | `subject: "Your TIG Admin Account"` | Email subject |
| `supabase/functions/create-agent/index.ts` | 183 | `from: "Caroline Horn <caroline@tylerinsurancegroup.com>"` | Email sender |
| `supabase/functions/create-agent/index.ts` | 185 | `subject: "Welcome to Tyler Insurance Group"` | Email subject |
| `supabase/functions/send-setup-link/index.ts` | 158 | `from: "Caroline Horn <caroline@tylerinsurancegroup.com>"` | Email sender |
| `supabase/functions/send-contracting-packet/index.ts` | 129 | `from: "Tyler Insurance Group <austin@send.tylerinsurancegroup.com>"` | Email sender |
| `supabase/functions/send-contracting-packet/index.ts` | 131 | `to: ["caroline@tylerinsurancegroup.com"]` | Email recipient |
| `supabase/functions/send-agent-inquiry/index.ts` | 81 | `from: "Tyler Insurance Group <onboarding@resend.dev>"` | Email sender |
| `supabase/functions/send-agent-inquiry/index.ts` | 82 | `to: ["austin@tylerinsurancegroup.com", "andrew@tylerinsurancegroup.com"]` | Email recipients |

### Edge Functions - Site URL

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `supabase/functions/create-admin/index.ts` | 19 | `https://www.tigagenthub.com` | Default site URL |
| `supabase/functions/create-agent/index.ts` | ~20 | `https://www.tigagenthub.com` | Default site URL |
| `supabase/functions/send-setup-link/index.ts` | 90 | `https://www.tigagenthub.com` | Default site URL |
| `supabase/functions/_shared/cors.ts` | 7-8 | `https://www.tigagenthub.com`, `https://tigagenthub.com` | CORS allowed origins |

### Edge Functions - Email Body Content

| File | Line | Content Type | TIG Reference |
|------|------|--------------|---------------|
| `supabase/functions/create-admin/index.ts` | 144 | Email body | `Your Tyler Insurance Group admin account is ready` |
| `supabase/functions/create-admin/index.ts` | 160 | Signature | `Austin\nTyler Insurance Group` |
| `supabase/functions/create-agent/index.ts` | 217 | Signature | `Tyler Insurance Group` |
| `supabase/functions/send-setup-link/index.ts` | 139 | Signature | `— The TIG Team` |
| `supabase/functions/send-contracting-packet/index.ts` | 201 | Contact | `caroline@tylerinsurancegroup.com` |
| `supabase/functions/send-contracting-packet/index.ts` | 206 | Signature | `Austin Tyler\nTyler Insurance Group` |

### Edge Functions - AI System Prompts

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `supabase/functions/agent-chat/index.ts` | 18 | `You are the Tyler Insurance Group Agent Assistant` | AI system prompt |
| `supabase/functions/agent-chat/index.ts` | 32 | `How to use the Tyler Insurance Group platform` | AI context |
| `supabase/functions/agent-chat-rag/index.ts` | 85 | `Tyler Insurance Group Agent Assistant` | AI system prompt |
| `supabase/functions/agent-chat-rag/index.ts` | 99 | `Tyler Insurance Group platform` | AI context |

### Edge Functions - PDF Generation

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `supabase/functions/generate-growth-plan-pdf/index.ts` | 718 | `Tyler Insurance Group \| Confidential` | PDF watermark |
| `supabase/functions/generate-growth-plan-pdf/index.ts` | 897 | `Tyler Insurance Group \| Confidential` | PDF watermark |
| `supabase/functions/generate-growth-plan-pdf/index.ts` | 1685 | `Tyler Insurance Group` | PDF header |
| `supabase/functions/generate-contracting-pdf/index.ts` | 742 | `Tyler Insurance Group` | PDF field |

### Database/Config Files

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `database-export/system-config-pdf-template-fields.json` | 39 | `Tyler Insurance Group` | PDF field config |
| `database-export/system-config-pdf-field-mappings.json` | 180 | `Tyler Insurance Group` | PDF field mapping |

### Internal Signatures/References

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/pages/admin/AgentProfilePage.tsx` | 774 | `Caroline Horn\nTyler Insurance Group` | Modal signature |
| `src/components/contracting/SendToPinnacleModal.tsx` | 69 | `Caroline Horn\nTyler Insurance Group` | Modal signature |
| `src/components/admin/AllAgentsTab.tsx` | 87, 677 | `Direct to TIG` | Manager filter option |

### Role Classifications

| File | Line | Current Text | Context |
|------|------|--------------|---------|
| `src/components/UserAvatarDropdown.tsx` | 24 | `internal_tig_agent` | Role badge config |
| Multiple files | Various | `TIG Agent` | Role display label |

---

## PART 3: SUMMARY REPORT

### HIGH PRIORITY - User-Facing Emails & UI

| Location | Current Branding | User-Facing? | Recommended Change |
|----------|------------------|--------------|-------------------|
| 9 page footers | `Powered by Tyler Insurance Group` | YES | Remove or make configurable |
| Multiple headers | `TIG \| Agent Portal` | YES | Make configurable |
| Admin welcome email | `Your TIG Admin Account` | YES | Generic: "Your Admin Account" |
| Agent welcome email | `Welcome to Tyler Insurance Group` | YES | Generic: "Welcome to Your Agent Portal" |
| Setup link email | `— The TIG Team` | YES | Generic: "— The Team" |
| Contracting confirmation | `Tyler Insurance Group` in signature | YES | Make configurable |
| Email from addresses | `@tylerinsurancegroup.com` | YES | Requires domain change |

### MEDIUM PRIORITY - Page Titles, Meta Tags, Alt Text

| Location | Current Branding | User-Facing? | Recommended Change |
|----------|------------------|--------------|-------------------|
| Image alt texts | `Tyler Insurance Group` | Accessibility | Generic: "Company Logo" |
| PDF watermarks | `Tyler Insurance Group \| Confidential` | YES (PDF) | Make configurable or remove |
| AI assistant prompts | `Tyler Insurance Group Agent Assistant` | Indirect | Make configurable |

### LOW PRIORITY - Internal & Config

| Location | Current Branding | User-Facing? | Recommended Change |
|----------|------------------|--------------|-------------------|
| CORS config | `tigagenthub.com` | NO | Keep or add new domain |
| Database exports | Historical branding | NO | Reference only |
| Documentation files | `Tyler Insurance Group` | NO | Update if desired |
| Role classifications | `internal_tig_agent` | Partial | Consider renaming |
| Modal signatures | `Caroline Horn\nTyler Insurance Group` | Admin only | Make configurable |
| Form placeholders | `caroline@tylerinsurancegroup.com` | Admin only | Use generic placeholder |

### LEGAL REVIEW REQUIRED

| Location | Current Text | Impact |
|----------|--------------|--------|
| AgreementsSection.tsx | Authorization checkboxes | LEGAL - Cannot change without review |
| BackgroundSignatureSection.tsx | 5-day notification requirement | LEGAL - Cannot change without review |
| LegalQuestionsSection.tsx | Change notification clause | LEGAL - Cannot change without review |
| MarketingConsentSection.tsx | Marketing consent language | LEGAL - Cannot change without review |
| SignatureSection.tsx | Signature authorization | LEGAL - Cannot change without review |

---

## RECOMMENDED IMPLEMENTATION APPROACH

### Phase 1: Quick Wins (No Legal Review Needed)
1. Remove "Powered by Tyler Insurance Group" footers (9 files)
2. Update email subjects to generic versions
3. Update email signatures to remove company name
4. Update AI assistant prompts
5. Update image alt texts

### Phase 2: Configuration System
1. Create `COMPANY_NAME` environment variable
2. Create `COMPANY_EMAIL_DOMAIN` environment variable
3. Update edge functions to use env vars
4. Update CORS to support multiple domains

### Phase 3: Legal Review
1. Review contracting agreement language
2. Determine if "Tyler Insurance Group" can be replaced with configurable name
3. Update legal sections with approved language

### Phase 4: Domain Migration
1. Set up new email domain
2. Update Resend/email provider configuration
3. Update CORS allowed origins
4. Update default site URLs

---

## FILE COUNT SUMMARY

| Category | Count |
|----------|-------|
| User-Facing Footers | 9 |
| User-Facing Headers | 6+ |
| Email Templates | 5 |
| Legal Agreement Text | 5 |
| Edge Function Configs | 10+ |
| AI Prompts | 2 |
| PDF Generation | 4 |
| Internal/Modal Signatures | 3 |
| Role Classifications | 2 |
| CORS/URL Config | 4 |
| **TOTAL INSTANCES** | **~50+** |
