# AgentProfilePage Implementation Discovery

**Date:** February 4, 2026
**Purpose:** Comprehensive reference for redesign implementation

---

## 1. Current AgentProfilePage Structure

### File Location
`src/pages/Admin/AgentProfilePage.tsx` — **2,004 lines**

### Props Received
```typescript
interface AgentProfilePageProps {
  selfViewProfileId?: string;  // Optional - for /my-profile route self-view mode
}
```

The page fetches ALL data itself via Supabase queries. No data is passed as props except the optional self-view ID.

---

### All 36 useState Declarations

| # | State Variable | Type | Purpose |
|---|----------------|------|---------|
| 1 | `profile` | `AgentProfile \| null` | Main agent profile data |
| 2 | `role` | `string \| null` | User's role from user_roles |
| 3 | `updatingRole` | `boolean` | Loading state for role change |
| 4 | `manager` | `ManagerInfo \| null` | Manager profile info |
| 5 | `carrierStatuses` | `CarrierStatus[]` | Array of carrier contracting statuses |
| 6 | `directReports` | `DirectReport[]` | Agents managed by this profile |
| 7 | `hasInferredAhip` | `boolean` | AHIP cert detected from agent_certifications |
| 8 | `loading` | `boolean` | Initial page load state |
| 9 | `error` | `string \| null` | Error message |
| **Carrier Request Modal** |||
| 10 | `isCarrierRequestOpen` | `boolean` | Modal visibility |
| 11 | `allCarriers` | `Carrier[]` | All carriers for selection |
| 12 | `selectedCarriersForRequest` | `string[]` | Selected carrier IDs |
| 13 | `carrierRequestStatus` | `'idle' \| 'sending' \| 'success' \| 'error'` | Send state |
| 14 | `carrierRequestConfirmed` | `boolean` | Confirmation checkbox |
| 15 | `carrierRequestError` | `string \| null` | Error message |
| 16 | `requestCarrierTo` | `string` | Email recipient |
| 17 | `requestCarrierSubject` | `string` | Email subject |
| 18 | `requestCarrierBody` | `string` | Email body text |
| **Hierarchy Modal** |||
| 19 | `isHierarchyModalOpen` | `boolean` | Modal visibility |
| **Deactivate Modal** |||
| 20 | `isDeactivateModalOpen` | `boolean` | Modal visibility |
| 21 | `deactivateConfirmed` | `boolean` | Confirmation checkbox |
| 22 | `deactivateAllReports` | `boolean` | Checkbox to deactivate all reports |
| 23 | `reassignToManagerId` | `string \| null \| undefined` | Selected manager for reassignment |
| 24 | `deactivateStatus` | `'idle' \| 'processing' \| 'success' \| 'error'` | Operation state |
| 25 | `deactivateError` | `string \| null` | Error message |
| 26 | `deactivateSearch` | `string` | Manager search query |
| 27 | `availableManagers` | `AgentOption[]` | Managers for reassignment dropdown |
| **Setup Link** |||
| 28 | `sendingSetupLink` | `boolean` | Loading state |
| **Contracting Notes Inline Edit** |||
| 29 | `isEditingNotes` | `boolean` | Edit mode toggle |
| 30 | `draftNotes` | `string` | Draft value |
| 31 | `notesSaveStatus` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Save state |
| 32 | `notesError` | `string \| null` | Error message |
| **NPN Inline Edit** |||
| 33 | `isEditingNpn` | `boolean` | Edit mode toggle |
| 34 | `draftNpn` | `string` | Draft value |
| 35 | `npnSaveStatus` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Save state |
| 36 | `npnError` | `string \| null` | Error message |
| 37 | `npnValidationError` | `string \| null` | Validation error |
| **Name Inline Edit** |||
| 38 | `isEditingName` | `boolean` | Edit mode toggle |
| 39 | `draftName` | `string` | Draft value |
| 40 | `nameSaveStatus` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Save state |
| 41 | `nameError` | `string \| null` | Error message |
| **Email Inline Edit** |||
| 42 | `isEditingEmail` | `boolean` | Edit mode toggle |
| 43 | `draftEmail` | `string` | Draft value |
| 44 | `emailSaveStatus` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Save state |
| 45 | `emailError` | `string \| null` | Error message |
| 46 | `emailValidationError` | `string \| null` | Validation error |

**Note:** Actual count is 46, not 36 as originally estimated. The inline editing pattern adds significant state overhead.

---

### All useEffect Hooks

| # | Dependencies | Purpose |
|---|--------------|---------|
| 1 | `[profileId]` | **Main data fetch** - fetches profile, role, manager, carrier statuses, direct reports, AHIP status |
| 2 | `[isEditingNotes]` | Focus textarea when entering edit mode |
| 3 | `[isEditingNpn]` | Focus input when entering edit mode |
| 4 | `[isEditingName]` | Focus input when entering edit mode |
| 5 | `[isEditingEmail]` | Focus input when entering edit mode |
| 6 | `[selectedCarriersForRequest, isCarrierRequestOpen, profile?.full_name, profile?.npn]` | Regenerate email body when carriers change |

---

### All Supabase Queries (in main useEffect)

| # | Table | Operation | Purpose |
|---|-------|-----------|---------|
| 1 | `profiles` | SELECT single | Fetch agent profile by ID |
| 2 | `user_roles` | SELECT single | Fetch role if user_id exists |
| 3 | `profiles` | SELECT single | Fetch manager info if manager_id exists |
| 4 | `carrier_statuses` | SELECT many | Fetch contracting statuses by profile_id |
| 5 | `carriers` | SELECT many | Fetch carrier names for status display |
| 6 | `profiles` | SELECT many | Fetch direct reports (where manager_id = this profile) |
| 7 | `agent_certifications` | SELECT limit 1 | Check for inferred AHIP (2026) |

**Additional queries in handlers:**
- `profiles` UPDATE - for name, email, NPN, notes edits
- `carriers` SELECT - when opening carrier request modal
- `carrier_statuses` INSERT - when sending carrier request
- `profiles` SELECT - refresh after various operations

---

### UI Sections Rendered

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER BAND (lines 1161-1441)                               │
│  ├── Avatar (initials on gradient)                          │
│  ├── Name (inline editable) + Status Badges                 │
│  ├── Email (inline editable)                                │
│  ├── Meta Row: NPN (inline editable) | Manager | Team Count │
│  ├── Actions: Send Setup Link | More dropdown               │
│  └── Compliance Strip: AHIP | E&O | Licensed                │
├─────────────────────────────────────────────────────────────┤
│ CONTENT GRID (lines 1443-1586) - 3 columns                  │
│  ├── Carriers Card (fixed 348px height)                     │
│  │    └── List of carrier statuses with colored dots        │
│  ├── Documents Card (AgentDocumentsSection component)       │
│  │    └── 5 predefined slots + "Other" section              │
│  └── Notes Card (fixed 348px height)                        │
│       └── contracting_notes (inline editable)               │
├─────────────────────────────────────────────────────────────┤
│ MODALS                                                       │
│  ├── Carrier Request Modal (lines 1589-1737)                │
│  ├── Hierarchy Assignment Modal (external component)        │
│  └── Deactivate/Reactivate Modal (lines 1750-2001)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Carrier Request Flow

### How It Works

1. **Trigger:** Admin clicks "Request Carrier" from dropdown or card
2. **Modal opens:** `handleOpenCarrierRequest()` fetches all carriers
3. **User selects carriers:** Checkboxes filter out already-contracted carriers
4. **Email composed:** Body auto-generates from template with agent name, NPN, carrier list
5. **Confirmation:** User must check confirmation checkbox
6. **Send:** `handleSendCarrierRequest()` is called

### Email Sending Flow

```typescript
// Uses useSendEmail hook
const { sendEmail } = useSendEmail();

// In handleSendCarrierRequest:
const result = await sendEmail({
  to: requestCarrierTo,                    // Default: 'pfslicensing@pfsinsurance.com'
  subject: requestCarrierSubject,          // 'Carrier Request - {Agent Name} (NPN: {NPN})'
  body: bodyHtml,                          // HTML-escaped email body
  agentId: profile.user_id || undefined,   // For logging
  communicationType: 'other',              // Type for logging
  carriersIncluded: selectedCarrierNames,  // For logging
});
```

### Edge Function: `microsoft-send-email`

**Location:** `supabase/functions/microsoft-send-email/index.ts`

**What it does:**
1. Verifies user is authenticated
2. Gets user's Microsoft OAuth tokens from `microsoft_oauth_tokens` table
3. Refreshes token if expired
4. Sends email via Microsoft Graph API (`https://graph.microsoft.com/v1.0/me/sendMail`)
5. Saves to sender's Sent folder
6. **Logs to database** (see below)

### Data Logged to Database

**Table:** `contracting_communications`

```typescript
await supabaseAdmin
  .from("contracting_communications")
  .insert({
    agent_id: agentId,                    // user_id of the agent
    communication_type: 'other',          // or 'initial_contracting', 'resend_link'
    recipient_email: to,
    subject: subject,
    body_html: body,
    carriers_included: carriersIncluded,  // Array of carrier names
    attachments: attachments?.map(a => a.name) || [],
    sent_by: user.id,                     // Admin who sent
    sent_at: new Date().toISOString(),
  });
```

### After Email Sends

```typescript
// Create carrier_statuses records for each selected carrier
const newStatuses = selectedCarriersForRequest.map((carrierId) => ({
  profile_id: profile.id,
  user_id: profile.user_id || null,
  carrier_id: carrierId,
  contracting_status: 'in_progress',
  contracting_submitted_at: new Date().toISOString(),
}));

await supabase.from('carrier_statuses').insert(newStatuses);
```

### Who Receives the Email

**Default recipient:** `pfslicensing@pfsinsurance.com` (PFS = Pinnacle Financial Services, the upline)

The `requestCarrierTo` field is editable in the modal, so admin can change recipient.

---

## 3. Related Components

### Components Imported by AgentProfilePage

| Component | File | Purpose |
|-----------|------|---------|
| `AdminLayout` | `@/components/layout/AdminLayout` | Page wrapper with header/sidebar |
| `AgentDocumentsSection` | `@/components/admin/AgentDocumentsSection` | Document upload/view card |
| `AssignManagerModal` | `@/components/admin/AssignManagerModal` | Manager assignment modal |
| `Dialog`, `Button`, etc. | `@/components/ui/*` | Shadcn UI components |

### All Files in src/components/admin/

| File | Purpose |
|------|---------|
| `AgentDocumentsSection.tsx` | Document management (5 slots + other) |
| `AgentDocumentsCard.tsx` | Older/alternative document card (may be deprecated) |
| `AssignManagerModal.tsx` | Manager assignment with quick picks |
| `AllAgentsTab.tsx` | Agent list for admin dashboard |
| `CarrierStatusPanel.tsx` | Carrier status display (may be unused) |
| `ContractingSubmissionDetail.tsx` | Contracting submission view |
| `CreateAdminDialog.tsx` | Create new admin user |
| `HierarchyAssignmentPanel.tsx` | Bulk hierarchy assignment |
| `queue/AgentList.tsx` | Agent list in contracting queue |
| `queue/AgentPanel.tsx` | Agent panel in queue view |

### AgentDocumentsSection Details

**Location:** `src/components/admin/AgentDocumentsSection.tsx` — **743 lines**

**Predefined Document Slots:**
```typescript
const DOCUMENT_SLOTS = [
  { category: 'contracting', documentType: 'contracting_packet', label: 'Contracting Packet' },
  { category: 'compliance', documentType: 'eo_certificate', label: 'E&O Certificate', hasExpiration: true },
  { category: 'license', documentType: 'resident_license', label: 'Resident License', hasExpiration: true },
  { category: 'banking', documentType: 'voided_check', label: 'Voided Check' },
  { category: 'license', documentType: 'non_resident_license', label: 'Non-Resident License', allowMultiple: true, hasExpiration: true },
];
```

**Props:**
```typescript
interface AgentDocumentsSectionProps {
  profileId: string;
  canUpload?: boolean;  // Agents + admins can upload to required slots
  isAdmin?: boolean;    // Admins can see/upload "Other" section + delete
}
```

**Features:**
- Drag-and-drop upload
- Document preview modal
- Expiration tracking (warns at 60 days)
- Fixed 348px height with internal scroll

---

## 4. Data Model

### profiles Table Fields (displayed/edited on page)

| Field | Displayed | Editable | Location on Page |
|-------|-----------|----------|------------------|
| `id` | No (used internally) | No | — |
| `user_id` | No (used internally) | No | — |
| `full_name` | ✅ | ✅ Inline | Header band |
| `email` | ✅ | ✅ Inline | Header band |
| `npn` | ✅ | ✅ Inline | Meta row |
| `manager_id` | ✅ (as link) | ✅ Modal | Meta row |
| `ownership_group` | ✅ (A&A badge) | ✅ Modal | Via manager modal |
| `onboarding_status` | ✅ Badge | No | Header band |
| `is_active` | ✅ Badge | ✅ Modal | Header / Deactivate modal |
| `is_test` | ✅ Badge | No | Header band |
| `ahip_cert_year` | ✅ | No | Compliance strip |
| `contracting_notes` | ✅ | ✅ Inline | Notes card |
| `setup_link_sent_at` | ✅ (button text) | No | Header actions |
| `password_created_at` | ✅ (determines button) | No | Header actions |
| `appointed_at` | No | No | — |
| `assigned_carriers` | No | No | — |
| `excluded_carriers` | No | No | — |

### carrier_statuses Table Fields

| Field | Displayed | Purpose |
|-------|-----------|---------|
| `carrier_id` | ✅ (via join) | Links to carriers table |
| `contracting_status` | ✅ Colored dot | `not_started`, `in_progress`, `contracted`, `issue` |
| `contracting_submitted_at` | ✅ "Updated" date | Timestamp of submission |
| `contracted_at` | ✅ "Updated" date | Timestamp of contracting |
| `issue_description` | No | Not currently displayed |

### How RTS Data Maps to carrier_statuses

RTS imports (`lib/rtsImport.ts`) create records in `agent_certifications` table with carrier names. The `carrier_statuses` table is populated:

1. **During contracting wizard** - when agent submits contracting application
2. **Via carrier request modal** - creates `in_progress` status
3. **Manual admin updates** - not currently in UI (would need carrier status edit)

**The carrier_statuses are NOT directly imported from RTS.** RTS imports go to `agent_certifications` which tracks certifications by year/product. The `carrier_statuses` table tracks contracting workflow state.

### contracting_notes

- **Stored in:** `profiles.contracting_notes` (TEXT field)
- **Single text field**, not threaded/timestamped
- **Displayed as:** "Notes" card (label is misleading)
- **Editable by:** Admins and agents (self-view)

---

## 5. Existing Hooks

### Hooks in src/hooks/

| Hook | Used by AgentProfilePage? | Purpose |
|------|---------------------------|---------|
| `useAuth.ts` | ✅ Yes | Auth state, roles, permissions |
| `useNavigationContext.ts` | ✅ Yes | View mode, home path |
| `useSendEmail.ts` | ✅ Yes | Send email via Microsoft Graph |
| `useProfile.ts` | No | Profile fetching (not used here) |
| `useRole.ts` | No | Role fetching (useAuth covers this) |
| `useAgentCertifications.ts` | No | RTS certification data |
| `useAgentRTSCarriers.ts` | No | Agent's carriers from RTS |
| `useContractingApplication.ts` | No | Contracting wizard state |
| `useDashboardData.ts` | No | Agent dashboard data |
| `useCarrierDirectory.ts` | No | Carrier directory page |
| `useFormValidation.ts` | No | Form validation helpers |
| `useForms.ts` | No | Forms library data |
| `useDarkMode.ts` | No | Theme toggle |
| `useSyncPreferences.ts` | No | Sync settings |
| `useRoadmapGenerator.ts` | No | Growth plan generation |
| `useContractingPdf.ts` | No | PDF generation |
| `useCommissions.ts` | No | Commission data |
| `useCmsPlans.ts` | No | CMS plan comparison |

### React Query Usage

**Not used anywhere in the codebase.** All data fetching uses:
- Direct Supabase client calls with useState/useEffect
- No caching layer
- No automatic refetching
- Manual refetch on specific actions

---

## 6. Edge Functions for Agent Management

### Agent Lifecycle Functions

| Function | Purpose | Auth Required | Params |
|----------|---------|---------------|--------|
| `create-agent` | Create new agent with auth user | Admin | `{ email, fullName, managerId?, ownershipGroup?, sendSetupEmail?, isTest? }` |
| `send-setup-link` | Send/resend password setup email | Admin | `{ profileId }` |
| `delete-user` | Delete user and all related data | Admin | `{ userId }` |
| `reset-user-password` | Admin password reset | Super Admin | `{ userId, newPassword }` |
| `validate-password` | Validate password on set | None (public) | `{ password }` |

### Email Functions

| Function | Purpose | Auth Required | Params |
|----------|---------|---------------|--------|
| `microsoft-send-email` | Send email via Outlook | User (any) | `{ to, subject, body, attachments?, agentId?, communicationType?, carriersIncluded? }` |
| `microsoft-oauth-start` | Start OAuth flow | User | — |
| `microsoft-oauth-callback` | OAuth callback handler | None | — |

### Contracting Functions

| Function | Purpose | Auth Required | Params |
|----------|---------|---------------|--------|
| `generate-contracting-pdf` | Generate contracting packet PDF | User | `{ applicationId }` |
| `send-contracting-packet` | Send contracting packet email | Admin | `{ applicationId, recipientEmail }` |
| `delete-contracting-application` | Delete contracting app | Admin | `{ applicationId }` |
| `reset-contracting-status` | Reset to CONTRACTING_REQUIRED | Admin | `{ profileId }` |

---

## 7. Key Implementation Details

### Inline Editing Pattern

Each inline-editable field follows this pattern:

```typescript
// State
const [isEditing, setIsEditing] = useState(false);
const [draft, setDraft] = useState('');
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const [error, setError] = useState<string | null>(null);
const inputRef = useRef<HTMLInputElement>(null);
const isCancelingRef = useRef(false);

// Handlers
const handleClick = () => { /* enter edit mode */ };
const handleCancel = () => { /* exit without save */ };
const handleSave = async () => { /* optimistic update + API call */ };
const handleKeyDown = (e) => { /* Escape = cancel, Enter = save */ };
const handleBlur = () => { /* save unless canceling */ };
```

**This pattern repeats 4 times** (name, email, NPN, notes), contributing ~400 lines.

### Permission Checks

```typescript
const canEdit = isAdmin() && !isSelfView;      // Admins can edit others
const canEditNotes = isAdmin() || isSelfView;  // Agents can edit own notes
```

### Optimistic Updates

All inline edits use optimistic updates:
```typescript
// Optimistic update
setProfile({ ...profile, [field]: newValue });
setIsEditing(false);
setSaveStatus('saving');

try {
  await supabase.from('profiles').update({ [field]: newValue }).eq('id', profile.id);
  setSaveStatus('saved');
} catch {
  // Revert on error
  setProfile({ ...profile, [field]: originalValue });
  setSaveStatus('error');
}
```

---

## 8. Missing Features / Gaps

### Not Currently Implemented

1. **Admin notes with timestamps** - Only single `contracting_notes` text field
2. **Carrier request history** - Logged to `contracting_communications` but not displayed
3. **Carrier status editing** - Can't change status from UI after creation
4. **Document expiration alerts** - Exists in AgentDocumentsSection but not prominent
5. **Activity log for this agent** - Exists in `activity_logs` but not shown on profile
6. **Writing number tracking** - No field for carrier writing numbers

### Hardcoded Values

1. **E&O and Licensed checkmarks** - Always show green ✓, not data-driven
2. **Default email recipient** - `pfslicensing@pfsinsurance.com`
3. **AHIP year** - `const CURRENT_AHIP_YEAR = 2026`
4. **Quick pick managers** - Hardcoded list: Eric Price, Traci O'Brien, Jay Eldridge, Andrew Horn

---

## 9. Database Tables Summary

| Table | Relationship to Profile | Key Fields |
|-------|------------------------|------------|
| `profiles` | Primary | id, user_id, full_name, email, npn, manager_id, onboarding_status, is_active, contracting_notes |
| `user_roles` | Via user_id | user_id, role |
| `carrier_statuses` | Via profile_id | profile_id, carrier_id, contracting_status, contracted_at |
| `agent_documents` | Via profile_id | profile_id, category, document_type, file_path, expires_at |
| `agent_certifications` | Via profile_id | profile_id, carrier_name, certification_year, product_type |
| `contracting_communications` | Via agent_id (user_id) | agent_id, recipient_email, subject, carriers_included, sent_at |
| `activity_logs` | Via user_id | user_id, action_type, entity_id, metadata |

---

## 10. Refactoring Opportunities

### Extract Custom Hooks

1. **`useInlineEdit(field, profileId)`** - Generic inline editing hook
2. **`useAgentProfile(profileId)`** - Fetch all agent data
3. **`useCarrierRequest(profileId)`** - Carrier request modal state + logic
4. **`useAgentDeactivation(profileId)`** - Deactivate modal state + logic

### Extract Components

1. **`AgentProfileHeader`** - Header band with all inline editing
2. **`AgentCarriersCard`** - Carrier statuses display + request trigger
3. **`AgentNotesCard`** - Notes display + inline edit
4. **`CarrierRequestModal`** - Already large enough for extraction
5. **`DeactivateAgentModal`** - Already large enough for extraction

### Potential Line Count Reduction

| Current | After Refactor | Savings |
|---------|----------------|---------|
| 2,004 lines | ~500 lines | ~75% |

---

*This document serves as the single source of truth for the AgentProfilePage redesign effort.*
