# UX Audit: Agent Profile Page
**Date:** January 19, 2026
**File:** `src/pages/admin/AgentProfilePage.tsx`
**Lines:** ~2,200

---

## STRUCTURE

### Layout
- Uses `AdminLayout` wrapper with back navigation
- **Two-column grid** for main cards (`md:grid-cols-2`)
- Max width: `max-w-5xl`
- Self-view mode supported (for `/my-profile` route)

### Page Sections (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Agents]  [TIG] Admin                        [Avatar ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HEADER                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  John Smith [Inactive] [Test]         [Role Badge]  │    │
│  │  📧 john@email.com · #NPN: 12345678   [Status Badge]│    │
│  │  👤 Reports to: Jane Manager                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  2x2 CARD GRID                                              │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ Profile Info       │  │ Carrier Statuses   │            │
│  │ - Name (editable)  │  │ - List of carriers │            │
│  │ - Email (editable) │  │ - Status badges    │            │
│  │ - NPN (editable)   │  │ - [Request Carrier]│            │
│  │ - AHIP status      │  │                    │            │
│  │ - Notes (editable) │  │                    │            │
│  │ - Role dropdown    │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ Hierarchy          │  │ Activity Timeline  │            │
│  │ - Reports to       │  │ - Account Created  │            │
│  │ - Direct reports   │  │ - Setup Link Sent  │            │
│  │   list             │  │ - Password Created │            │
│  │                    │  │ - First Login      │            │
│  │                    │  │ - Appointed        │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  DOCUMENTS CARD (full width, collapsible)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Agent Documents                                     │    │
│  │ - List of uploaded docs with download buttons       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  QUICK ACTIONS (footer bar)                                 │
│  [Send Setup Link] [Deactivate]        [View User Details]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modals (3)
1. **Carrier Request Modal** - Send email to PFS for carrier contracting
2. **Assign Manager Modal** - Change who agent reports to (uses shared component)
3. **Deactivate/Reactivate Modal** - Handle agent and their direct reports

---

## DATA DISPLAYED

### Profile Fields
| Field | Editable | Validation |
|-------|----------|------------|
| Full Name | Yes (inline) | Required |
| Email | Yes (inline) | Email format, unique check |
| NPN | Yes (inline) | Exactly 8 digits |
| AHIP Certification | No | Shows year + source |
| Contracting Notes | Yes (inline) | Free text |
| Role | Yes (dropdown) | Limited by current user's permissions |

### Related Data Fetched
| Data | Source | Notes |
|------|--------|-------|
| Manager info | `profiles` by `manager_id` | Name, email, id |
| Direct reports | `profiles` where `manager_id = this.id` | Active only |
| Carrier statuses | `carrier_statuses` + `carriers` | Manual join (no FK in PostgREST) |
| Role | `user_roles` | Only if `user_id` exists |
| Documents | `contracting_applications.uploaded_documents` | Storage metadata fetched separately |
| AHIP inference | `agent_certifications` | Checks for current year cert |

### Status Badges Displayed
- **Role**: super_admin, admin, manager, internal_tig_agent, independent_agent
- **Onboarding Status**: CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED, SUSPENDED
- **Carrier Status**: not_started, in_progress, contracted, issue
- **Special**: Inactive, Test

---

## ACTIONS AVAILABLE

### Inline Editing (click-to-edit pattern)
- ✅ Full Name
- ✅ Email
- ✅ NPN
- ✅ Contracting Notes

### Button Actions
| Action | Visibility | Condition |
|--------|------------|-----------|
| Send Setup Link | Admin only, not self | Has user_id, no password yet |
| Resend Setup Link | Admin only, not self | Has user_id, link sent but no password |
| Deactivate Agent | Admin only, not self | Agent is active |
| Reactivate Agent | Admin only, not self | Agent is inactive |
| View Full User Details | Admin only | Has user_id |
| Request Carrier | Admin only, not self | Has user_id |
| Change Manager | Admin only, not self | Always |

### Modal Workflows
1. **Carrier Request**: Select carriers → Edit email → Confirm → Send
2. **Assign Manager**: Search/quick pick → Select → Save
3. **Deactivate**: If has reports → Reassign OR deactivate all → Confirm

---

## COMPONENTS USED

### External Components
```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AgentDocumentsCard } from '@/components/admin/AgentDocumentsCard';
import { AssignManagerModal } from '@/components/admin/AssignManagerModal';
```

### UI Library (shadcn)
- Card, CardContent, CardHeader, CardTitle
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- Button, Input, Label, Textarea, Checkbox
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue

### Hooks
- `useAuth` - Current user profile, isAdmin(), isSuperAdmin()
- `useSendEmail` - Email sending functionality
- `useParams`, `useNavigate`, `useLocation` - React Router

---

## ISSUES I NOTICE

### Code Quality Issues

1. **Massive file size** (~2,200 lines)
   - Should be split into smaller components
   - Inline editing logic repeated 4x (Name, Email, NPN, Notes)
   - Could extract: `InlineEditField`, `TimelineCard`, `CarrierStatusesCard`, etc.

2. **State explosion** - 40+ useState calls
   ```tsx
   // Example of repeated patterns:
   const [isEditingNpn, setIsEditingNpn] = useState(false);
   const [draftNpn, setDraftNpn] = useState('');
   const [npnSaveStatus, setNpnSaveStatus] = useState('idle');
   const [npnError, setNpnError] = useState(null);
   const [npnValidationError, setNpnValidationError] = useState(null);
   // ^ Repeated for Name, Email, Notes
   ```

3. **Missing interface for AgentOption** (line 205)
   - Used but not defined in this file
   - Likely imported elsewhere or missing

4. **Hardcoded AHIP year**
   ```tsx
   const CURRENT_AHIP_YEAR = 2026;
   ```
   - Should be dynamic or environment-based

5. **Undefined CSS class**
   ```tsx
   <h1 className="heading-section">
   ```
   - Not a standard Tailwind class, may be custom

### UX Issues

1. **No loading state for carrier statuses**
   - Main profile shows loader, but carrier card doesn't indicate loading

2. **Activity Timeline is static**
   - Only shows 5 hardcoded milestones
   - Doesn't show actual activity log entries

3. **Documents section placement**
   - Full-width after grid breaks visual rhythm
   - Collapsible but starts expanded

4. **Quick Actions footer disconnected**
   - Floating at bottom, not anchored
   - On long pages, requires scrolling

5. **Carrier Request modal is complex**
   - Two-column layout, editable email, confirmation checkbox
   - Lot of friction for common action

6. **No "Edit Profile" mode**
   - Each field edits individually
   - No way to edit multiple fields at once

### Styling Inconsistencies

1. **Card styling varies**
   - Uses default Card component (has gradient, shadow)
   - Doesn't match the `bg-white border border-border rounded-lg` pattern

2. **Badge colors inconsistent**
   - Some use `bg-{color}-100 text-{color}-700`
   - Others use `bg-{color}-100 text-{color}-600`

3. **Icon sizing varies**
   - Header icons: `h-4 w-4`
   - Card title icons: `h-5 w-5`
   - Status icons: `h-3.5 w-3.5`

---

## WHAT'S WORKING

1. **Inline editing pattern** - Click to edit, blur/enter to save, escape to cancel
2. **Optimistic updates** - UI updates immediately, reverts on error
3. **Permission checks** - `canEdit` properly restricts editing
4. **Self-view support** - Agents can view their own profile with reduced functionality
5. **Hierarchy visualization** - Shows both manager and direct reports
6. **Carrier status tracking** - Shows contracting progress per carrier
7. **Deactivation workflow** - Properly handles direct report reassignment

---

## WHAT'S BROKEN/INCOMPLETE

1. **Activity Timeline**
   - Static milestones only
   - No real activity log integration
   - "Appointed" milestone seems disconnected from carrier statuses

2. **No phone field displayed**
   - Profile has phone but page doesn't show it

3. **No state/address info**
   - Important for compliance, not visible

4. **Documents card**
   - Only shows if user_id exists
   - What about imported agents with documents?

5. **Missing bulk actions**
   - Can't quickly add multiple carriers
   - Can't export agent info

---

## OPPORTUNITIES

### Quick Wins
1. Add phone number to header (already in profile data)
2. Standardize Card styling to match style guide
3. Fix the `heading-section` class to use standard typography

### Medium Effort
1. Extract inline editing into reusable hook/component
2. Add real activity log to timeline
3. Make Documents card work for all agents
4. Add "Edit Mode" toggle for bulk field editing

### Larger Refactors
1. Split into smaller components (~5-6 files)
2. Create a proper state machine for complex modals
3. Add carrier status inline editing
4. Real-time updates via Supabase subscriptions

---

## SUMMARY

**Verdict:** Functional but bloated. The page does its job but has grown organically into a 2,200-line monolith. The inline editing pattern is well-implemented but duplicated 4 times. The visual design is reasonably consistent but uses older Card styling that doesn't match the newer admin pages.

**Priority fixes:**
1. 🔴 Add phone number display (missing data)
2. 🟡 Standardize Card styling (visual consistency)
3. 🟡 Extract inline editing into reusable component (code quality)
4. 🟢 Split file into smaller components (maintainability)

**Keep:**
- The inline editing UX is good
- The permission model is solid
- The hierarchy visualization works well
- The deactivation workflow is thoughtful
