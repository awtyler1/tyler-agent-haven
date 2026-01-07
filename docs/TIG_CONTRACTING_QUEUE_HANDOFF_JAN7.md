# TIG Contracting Queue - Project Handoff
**Date:** January 7, 2026
**Developer:** Claude Code (Opus 4.5)
**Commit:** 9c12ac7

---

## Overview

The Contracting Queue is an admin-facing feature that allows Caroline and the ops team to manage agent contracting submissions. When an agent completes their contracting application, it appears in the queue where ops can:

1. Review the submission and documents
2. Select which carriers to request
3. Send the contracting package to Pinnacle (FMO) via email with attachments
4. Track the status of each submission

---

## Feature Location

**URL:** `/admin/contracting`

**Main Page:** `src/pages/admin/ContractingQueuePage.tsx`

---

## Architecture

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ContractingQueuePage` | `src/pages/admin/ContractingQueuePage.tsx` | Main page with list/detail layout |
| `AgentList` | `src/components/admin/queue/AgentList.tsx` | Left panel - searchable list of submissions |
| `AgentPanel` | `src/components/admin/queue/AgentPanel.tsx` | Right panel - agent details, docs, carriers |
| `SendToPinnacleModal` | `src/components/contracting/SendToPinnacleModal.tsx` | Email composition modal |

### Hooks

| Hook | Path | Purpose |
|------|------|---------|
| `useSendEmail` | `src/hooks/useSendEmail.ts` | Sends emails via Microsoft Graph edge function |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `microsoft-send-email` | Sends email via Microsoft Graph API with attachments |

---

## Database Schema

### Required Columns on `contracting_applications`

The following columns were added to support queue functionality:

```sql
ALTER TABLE contracting_applications
ADD COLUMN IF NOT EXISTS queue_status TEXT DEFAULT 'needs_action',
ADD COLUMN IF NOT EXISTS sent_to_pinnacle_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requested_carriers TEXT[];
```

### Queue Status Values

| Status | Description |
|--------|-------------|
| `needs_action` | New submission, needs review |
| `in_progress` | Being worked on |
| `sent_to_pinnacle` | Email sent to Pinnacle |
| `completed` | Contracting complete |

---

## Data Flow

### 1. Queue Loading
```
ContractingQueuePage
  → fetchApplications()
  → SELECT from contracting_applications WHERE status = 'submitted'
  → Render AgentList with submissions
```

### 2. Send to Pinnacle Flow
```
User clicks "Send to Pinnacle"
  → Opens SendToPinnacleModal
  → User reviews/edits email
  → User clicks "Send Email"
  → Modal shows "Preparing attachments..."
  → For each selected document:
      → Get signed URL from Supabase Storage
      → Convert to base64 via fileUrlToBase64()
      → Rename to {NPN}_{DocType}.{ext}
  → Modal shows "Sending..."
  → Call microsoft-send-email edge function
  → Update contracting_applications:
      - queue_status = 'sent_to_pinnacle'
      - sent_to_pinnacle_at = NOW()
      - requested_carriers = [selected carriers]
  → Modal shows "Sent!" with checkmark
  → Modal auto-closes after 1.2s
```

---

## Carrier Configuration

### Available Carriers
- Aetna
- Humana
- Anthem
- Cigna
- UHC
- Wellcare
- Devoted
- Molina
- BCBS
- Essence

### KY Default Preset
One-click selection for Kentucky agents:
- Aetna, Anthem, Devoted, Humana, UHC, Wellcare, Essence

---

## Email Configuration

### Default Recipient
`pfslicensing@pfsinsurance.com` (Pinnacle licensing team)

### Subject Format
`Contracting Request - {Agent Name} (NPN: {NPN})`

### Attachment Naming
Files are renamed for clarity:
- `{NPN}_Packet.pdf`
- `{NPN}_License.pdf`
- `{NPN}_EO.pdf`
- `{NPN}_VoidedCheck.pdf`
- `{NPN}_ID.pdf`
- etc.

### Email Body Template
```
Hi Pinnacle Licensing Team,

Please process the following contracting request:

Agent: {Name}
NPN: {NPN}
Resident State: {State}

Requested Carriers:
  - Carrier 1
  - Carrier 2
  ...

All required documents are attached.

Thank you,
Tyler Insurance Group
```

---

## Document Types Supported

| Doc Type Key | Display Label | Attachment Name |
|--------------|---------------|-----------------|
| `contracting_packet` | Contracting Packet | Packet |
| `insurance_license` | Insurance License | License |
| `eo_certificate` | E&O Certificate | EO |
| `voided_check` | Voided Check | VoidedCheck |
| `government_id` | Government ID | ID |
| `aml_certificate` | AML Certificate | AML |
| `ce_certificate` | CE Certificate | CE |
| `ltc_certificate` | LTC Certificate | LTC |
| `corporate_resolution` | Corporate Resolution | CorpResolution |
| `background_explanation` | Background Documentation | Background |

---

## UI/UX Notes

### Layout
- Fixed two-panel layout (list on left, detail on right)
- List panel: 384px wide (`w-96`)
- Detail panel: Fills remaining space

### Status Indicators
| Status | Color |
|--------|-------|
| Needs Action | Red dot |
| In Progress | Yellow dot |
| Sent to Pinnacle | Blue dot |
| Completed | Green dot |

### Send Button States
1. **Idle:** "Send Email"
2. **Preparing:** Spinner + "Preparing attachments..."
3. **Sending:** Spinner + "Sending..."
4. **Success:** Checkmark + "Sent!" (green background)
5. **Error:** Resets to idle after 2s

---

## Files Changed/Created

### New Files
```
src/components/contracting/AgentPanel.tsx      # Standalone panel (not currently used)
src/components/contracting/SendToPinnacleModal.tsx
src/hooks/useSendEmail.ts
```

### Modified Files
```
src/components/admin/queue/AgentPanel.tsx      # Added Essence, KY Default, tighter checkboxes
src/pages/admin/ContractingQueuePage.tsx       # Full integration
```

---

## Dependencies

### External Services
- **Supabase:** Database and Storage
- **Microsoft Graph API:** Email sending (via edge function)

### Required Outlook Connection
The admin user must have their Outlook account connected via OAuth. Tokens are stored in `microsoft_oauth_tokens` table.

---

## Known Limitations / Future Work

### Current Limitations
1. **No document preview:** Documents open in new tab via signed URL, no inline preview
2. **No bulk actions:** Must process one agent at a time
3. **No email history:** Sent emails are logged to `contracting_communications` table but not displayed in UI
4. **No carrier-specific logic:** All carriers treated the same (some may require different docs)

### Suggested Improvements
1. Add document preview panel
2. Add "Mark as Complete" workflow
3. Show communication history for each agent
4. Add filters (by status, date range, carrier)
5. Add sorting options
6. Email templates per carrier
7. Batch operations for multiple agents

---

## Testing Notes

### To Test Locally
1. Ensure you have submitted contracting applications in the database
2. Ensure your Outlook is connected (check `microsoft_oauth_tokens`)
3. Navigate to `/admin/contracting`
4. Select an agent, choose carriers, click "Send to Pinnacle"
5. Verify email arrives at test address

### Test Checklist
- [ ] Queue loads submitted applications
- [ ] Search filters by name and NPN
- [ ] Status dropdown updates database
- [ ] Carrier checkboxes persist
- [ ] KY Default selects correct carriers
- [ ] Documents appear with View buttons
- [ ] Send to Pinnacle modal opens
- [ ] Email fields are pre-filled
- [ ] Attachments are checked by default
- [ ] Send shows loading states
- [ ] Email arrives with correct attachments
- [ ] Status updates to "sent_to_pinnacle"
- [ ] Success toast appears

---

## Contact

For questions about this implementation, refer to the git history or this document.

**Repository:** https://github.com/awtyler1/tyler-agent-haven
