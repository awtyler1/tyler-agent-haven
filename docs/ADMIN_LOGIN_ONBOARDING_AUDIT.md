# Admin, Login & Onboarding Audit

**Date:** February 4, 2026
**Purpose:** Comprehensive UX audit for sprint planning session
**Scope:** Admin Dashboard & Workflows, Login Page, Onboarding Flows

---

## Executive Summary

This audit covers three critical user journeys: admin workflows, authentication, and agent onboarding. Key findings include workflow redundancy in agent creation, inconsistent email sender identities, and opportunities to reduce friction in the password setup flow.

---

## 1. Admin Workflows

### Current State Analysis

| Workflow | Current Steps | Click Count | Pain Points | Suggested Improvements |
|----------|---------------|-------------|-------------|------------------------|
| **Create New Agent** | Dashboard → New Agent → Fill form → Submit → Wait for email | 4 clicks + form | No confirmation of email sent, no way to resend immediately | Add success toast with "Resend" action, show invite link option |
| **View Agent List** | Dashboard → All Agents card → AllAgentsTab loads | 2 clicks | Full page reload, loses search context from dashboard | Make dashboard search navigate to agents page with query preserved |
| **Search Agents** | Dashboard search OR Agents page search | 1-2 clicks | Two separate search implementations, dashboard search is ephemeral | Unify search - dashboard search should deep-link to agents page |
| **RTS Import** | Dashboard → RTS Import → Upload file → View results | 3 clicks | No drag-and-drop feedback during upload, results not exportable | Add upload progress indicator, export results button |
| **View Contracting Queue** | Dashboard → Contracting card → Queue page | 2 clicks | Badge count may be stale if agent submits while admin is on dashboard | Add real-time subscription or polling for pending count |
| **Send Setup Link** | Agent profile → Actions menu → Send Setup Link | 3 clicks | No feedback if email bounces, no link copy option in same flow | Combine with "Copy Link" option, add delivery status |

### Dashboard Card Analysis

| Card | Purpose | Current State | Recommendation |
|------|---------|---------------|----------------|
| All Agents | Navigate to agent list | Shows total count, no preview | Add mini-list of recently active agents |
| Contracting | Navigate to queue | Shows pending count | Good - keep as is |
| New Agent | Navigate to form | Just a link, no inline action | Consider inline quick-add for email-only creation |
| RTS Import | Navigate to import page | Shows last sync date + staleness | Good - staleness indicator is helpful |

### Admin Layout Consistency

| Element | Implementation | Status |
|---------|----------------|--------|
| Header | iOS-style blur, sticky, "← Admin Dashboard" back link | ✅ Consistent |
| Background | Warm gradient `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | ✅ Consistent |
| Footer | "Powered by Tyler Insurance Group" | ✅ Consistent |
| Page titles | `text-2xl font-serif font-medium` | ✅ Consistent |
| Cards | `rounded-xl border border-[#e8e4dd] bg-white` | ✅ Consistent |

---

## 2. Login Page

### Current State Analysis

| Element | Current State | Needs Update? | Notes |
|---------|---------------|---------------|-------|
| Logo | tyler-logo.webp (17KB optimized) | ✅ No | Recently optimized from 769KB PNG |
| Background | Linear gradient `#F3F0EA → #FAFAFA` | ⚠️ Review | Different from app warm gradient - intentional? |
| Form card | White with shadow, max-w-md | ✅ No | Clean, focused design |
| Submit button | Gold gradient styling | ✅ No | Matches brand |
| "Forgot Password" | Text link below form | ✅ No | Discoverable |
| "Contact Us" | Modal trigger for inquiries | ✅ No | Good for pre-signup support |
| Error states | Toast notifications | ⚠️ Review | Consider inline validation |
| Loading state | Button disabled + "Signing in..." | ✅ No | Clear feedback |

### Login Flow Analysis

```
User arrives at /auth
  ↓
Enter email + password
  ↓
Submit → Supabase Auth
  ↓
Success → Check role
  ↓
├── Admin/Super Admin → /admin
├── Contracting Required → /contracting
└── Agent → / (home)
```

**Issues Found:**
1. No "Remember me" option
2. No session timeout warning
3. Password field has no show/hide toggle

### Contact Us Modal

| Field | Current | Notes |
|-------|---------|-------|
| Name | Required text input | ✅ |
| Email | Required email input | ✅ |
| Message | Required textarea | ✅ |
| Submit | Calls `send-agent-inquiry` function | ✅ |

---

## 3. Onboarding Flows

### Flow 1: New Agent (Admin-Created)

```
Admin creates agent
  ↓
Edge function: create-agent
  ↓
1. Create auth user (temp password)
2. Insert profile (manager_id, ownership_group)
3. Assign 'independent_agent' role
4. Send welcome email via Resend
  ↓
Agent receives email
  ↓
Clicks link → /auth/set-password?token=xxx
  ↓
Sets password (12+ chars, strength indicator)
  ↓
Redirected based on role/status
```

| Step | Current State | Issues Found | Priority |
|------|---------------|--------------|----------|
| Email delivery | Resend API, from Caroline Horn | No delivery tracking | Medium |
| Link expiration | Uses Supabase recovery link | Default 24hr, not documented | Low |
| Password requirements | 12+ chars, upper/lower/number/special | Requirements shown after first attempt | High |
| Strength indicator | Weak/Medium/Strong visual | Good UX | ✅ Done |
| Post-setup redirect | Role-based routing | Works correctly | ✅ Done |

### Flow 2: Existing Profile Setup Link

```
Admin sends setup link for existing profile
  ↓
Edge function: send-setup-link
  ↓
1. Create auth user if needed
2. Generate recovery link
3. Send "Account Ready" email
  ↓
Same flow as above
```

| Step | Current State | Issues Found | Priority |
|------|---------------|--------------|----------|
| User existence check | Creates if missing | Silent failure if email exists | Medium |
| Link generation | Supabase generateLink API | Works | ✅ Done |
| Email content | Different from welcome email | Inconsistent tone | Low |

### Flow 3: Admin Account Creation

```
Super admin creates admin
  ↓
Edge function: create-admin
  ↓
1. Create auth user
2. Insert profile (onboarding_status: 'APPOINTED')
3. Assign admin role
4. Send admin welcome email
  ↓
Admin receives email from Austin Tyler
  ↓
Same password setup flow
```

| Step | Current State | Issues Found | Priority |
|------|---------------|--------------|----------|
| Onboarding bypass | Sets APPOINTED status | Correct - admins skip contracting | ✅ Done |
| Email sender | Austin Tyler (different from agent emails) | Intentional distinction | ✅ Done |

### Flow 4: Password Reset

```
User clicks "Forgot Password"
  ↓
Enter email → Submit
  ↓
Supabase sends reset email
  ↓
User clicks link → /auth/set-password
  ↓
Same password setup flow
```

| Step | Current State | Issues Found | Priority |
|------|---------------|--------------|----------|
| Email prompt | Simple text input | No email validation before submit | Low |
| Success feedback | Toast + return to login | Good | ✅ Done |
| Reset email | Supabase default template | Not branded | Medium |

---

## 4. Email Copy Audit

| Email | Trigger | From | Subject | Current Copy Issues | Suggested Changes |
|-------|---------|------|---------|---------------------|-------------------|
| **Welcome (Agent)** | create-agent | Caroline Horn <caroline@tylerinsurancegroup.com> | "Welcome to Tyler Insurance Group" | Generic, doesn't mention next steps clearly | Add numbered steps: 1. Click link, 2. Set password, 3. Complete contracting |
| **Account Ready** | send-setup-link | Caroline Horn <caroline@tylerinsurancegroup.com> | "Your Agent Account Is Ready" | Very similar to Welcome, confusing | Differentiate - "Complete Your Account Setup" |
| **Admin Welcome** | create-admin | Austin Tyler <austin@tylerinsurancegroup.com> | "Your TIG Admin Account" | Good distinction from agent emails | ✅ Keep as is |
| **Password Reset** | Supabase auth | Supabase default | "Reset your password" | Not branded, generic template | Customize in Supabase dashboard |
| **Contact Inquiry** | send-agent-inquiry | System | Internal notification | N/A - internal | ✅ Keep as is |

### Email Sender Consistency

| Sender | Used For | Notes |
|--------|----------|-------|
| Caroline Horn | Agent-facing emails | Consistent, good |
| Austin Tyler | Admin-facing emails | Consistent, good |
| Supabase | Password reset | Needs branding |

---

## 5. Design Inconsistencies

| Page/Component | Issue | Fix Required | Priority |
|----------------|-------|--------------|----------|
| Login page background | Uses `#F3F0EA → #FAFAFA` instead of warm gradient | Align with app gradient | Low |
| SetPasswordPage | Missing footer "Powered by TIG" | Add footer | Medium |
| ForgotPasswordPage | Missing footer "Powered by TIG" | Add footer | Medium |
| Contact Us modal | Uses default shadcn styling | Add brand colors to submit button | Low |
| Error toasts | Red default styling | Consider softer error colors | Low |
| PageLoader | Uses gold TIG shimmer | ✅ Consistent | Done |
| AdminLayout | iOS-style header with blur | ✅ Consistent | Done |

### Typography Audit

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Page titles | `font-serif text-2xl` | Consistent across admin | ✅ |
| Body text | `text-sm` or `text-base` | Consistent | ✅ |
| Labels | `text-sm font-medium` | Consistent | ✅ |
| Muted text | `text-muted-foreground` | Consistent | ✅ |

### Color Token Usage

| Token | Expected Use | Violations Found |
|-------|--------------|------------------|
| `text-foreground` | Primary text | None |
| `text-muted-foreground` | Secondary text | None |
| `border-border` | Standard borders | None |
| `bg-muted` | Subtle backgrounds | None |

---

## 6. Recommendations Summary

### High Priority

1. **Show password requirements upfront** - Display requirements before user types, not after failed validation
2. **Add "Copy Invite Link" option** - Let admins share links directly without email dependency
3. **Unify dashboard search** - Dashboard search should navigate to agents page with query param

### Medium Priority

4. **Brand password reset email** - Customize Supabase email template
5. **Add footers to auth pages** - SetPasswordPage and ForgotPasswordPage missing "Powered by TIG"
6. **Differentiate email subjects** - "Welcome" vs "Account Ready" too similar
7. **Add email delivery status** - Show if setup email was delivered/opened

### Low Priority

8. **Add "Remember me" to login** - Common expectation
9. **Show/hide password toggle** - Accessibility improvement
10. **Align login background** - Match warm gradient used elsewhere

---

## 7. Implementation Checklist

### Quick Wins (< 1 hour each)

- [ ] Add footer to SetPasswordPage
- [ ] Add footer to ForgotPasswordPage
- [ ] Show password requirements before input
- [ ] Add show/hide toggle to password fields

### Medium Effort (1-2 hours each)

- [ ] Add "Copy Link" button to agent creation success
- [ ] Customize Supabase password reset email template
- [ ] Add delivery status indicator for setup emails
- [ ] Unify dashboard → agents search flow

### Larger Effort (2-4 hours each)

- [ ] Add real-time pending count updates on dashboard
- [ ] Implement email open/click tracking
- [ ] Add inline quick-add for agents on dashboard

---

## 8. Metrics to Track

| Metric | Current Baseline | Target |
|--------|------------------|--------|
| Password setup completion rate | Unknown | 95%+ |
| Time from invite to first login | Unknown | < 24 hours |
| Admin clicks to create agent | 4 + form | 2 + form |
| Support tickets re: login issues | Unknown | Reduce by 50% |

---

## Appendix: File References

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminDashboard.tsx` | Main admin hub |
| `src/pages/admin/AgentsPage.tsx` | Agent list wrapper |
| `src/pages/admin/NewAgentPage.tsx` | Agent creation form |
| `src/pages/admin/RTSImportPage.tsx` | RTS certification import |
| `src/pages/AuthPage.tsx` | Login page |
| `src/pages/auth/SetPasswordPage.tsx` | Password setup |
| `src/pages/auth/ForgotPasswordPage.tsx` | Password reset request |
| `src/components/layout/AdminLayout.tsx` | Admin page wrapper |
| `supabase/functions/create-agent/index.ts` | Agent creation API |
| `supabase/functions/send-setup-link/index.ts` | Setup link API |
| `supabase/functions/create-admin/index.ts` | Admin creation API |

---

*Generated for sprint planning session - February 5, 2026*
