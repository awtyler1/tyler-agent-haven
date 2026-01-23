# Component Context Reference

Generated: 2026-01-21

## 1. Document Viewer / Preview Components

### Current State: No Dedicated Viewer Component

There is **no reusable document viewer component**. Two approaches exist:

### Approach A: Inline Modal Preview (Best UX)

**Location:** `src/pages/admin/ContractingQueuePage.tsx` (lines 94-147)

```tsx
function DocumentPreview({
  url,
  label,
  onClose,
}: {
  url: string;
  label: string;
  onClose: () => void;
}) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh]">
        {/* Header with label and close button */}
        <div className="flex-1 overflow-auto bg-muted min-h-[400px]">
          {isImage ? (
            <div className="flex items-center justify-center p-4 h-full">
              <img
                src={url}
                alt={label}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          ) : (
            <iframe
              src={url}
              title={label}
              className="w-full h-[70vh] border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Features:**
- Modal overlay with click-outside-to-close
- Auto-detects image vs PDF by file extension
- Images: `<img>` tag with object-contain
- PDFs: `<iframe>` for browser's native PDF viewer
- "Open in Tab" button for new window
- Uses signed URLs with 5-minute expiry

### Approach B: Open in New Tab (Simpler)

**Location:** `src/components/admin/AgentDocumentsSection.tsx` (lines 300-317)

```tsx
const handleDownload = async (doc: AgentDocument) => {
  const { data, error } = await supabase.storage
    .from('agent-documents')
    .createSignedUrl(doc.file_path, 300); // 5 min expiry

  if (data?.signedUrl) {
    window.open(data.signedUrl, '_blank');
  }
};
```

### Related Files

| File | Purpose |
|------|---------|
| `src/components/contracting/sections/DocumentsSection.tsx` | Contracting wizard upload UI |
| `src/components/admin/AgentDocumentsSection.tsx` | Admin document management (CRUD) |
| `src/components/admin/AgentDocumentsCard.tsx` | Read-only document list display |
| `src/pages/admin/ContractingQueuePage.tsx` | Has the best preview modal |

### Dependencies

- `pdfjs-dist: ^5.4.449` - Only used for text extraction, not viewing
- `jspdf: ^3.0.4` - PDF generation
- No react-pdf or viewer libraries installed

### Recommendation

Extract `DocumentPreview` from ContractingQueuePage into a reusable component at `src/components/ui/DocumentPreview.tsx`.

---

## 2. Carrier Status Section (Agent Profile)

### Location

**File:** `src/pages/admin/AgentProfilePage.tsx` (lines 1451-1521)

This is embedded in the agent profile page, not a separate component.

### States Handled

#### Empty State (lines 1465-1480)

```tsx
{carrierStatuses.length === 0 ? (
  <div className="text-sm text-muted-foreground text-center py-8 flex-1 flex flex-col items-center justify-center">
    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
    <p>No carrier statuses yet</p>
    {canEdit && (
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenCarrierRequest}
        className="mt-3 gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Request Carrier
      </Button>
    )}
  </div>
)}
```

**Shows:**
- CreditCard icon (40% opacity)
- "No carrier statuses yet" text
- "Request Carrier" button (only if `canEdit` is true)

#### Data State (lines 1481-1520)

```tsx
<div className="space-y-2 max-h-48 overflow-y-auto flex-1">
  {carrierStatuses.map((status) => {
    const config = CARRIER_STATUS_CONFIG[status.contracting_status] || CARRIER_STATUS_CONFIG.not_started;
    return (
      <div
        key={status.id}
        className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{status.carrier_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
            {config.label}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {status.contracted_at ? (
            <span>{format(new Date(status.contracted_at), 'MMM d, yyyy')}</span>
          ) : status.contracting_submitted_at ? (
            <span>{format(new Date(status.contracting_submitted_at), 'MMM d')}</span>
          ) : null}
        </div>
      </div>
    );
  })}
</div>
```

### Status Configuration (lines 103-108)

```tsx
const CARRIER_STATUS_CONFIG = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  contracted: { label: 'Contracted', className: 'bg-emerald-100 text-emerald-700' },
  issue: { label: 'Issue', className: 'bg-rose-100 text-rose-700' },
};
```

### Header Summary (lines 1453-1462)

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="font-semibold text-foreground flex items-center gap-2">
    <CreditCard className="h-5 w-5 text-muted-foreground" />
    Carrier Statuses
  </h2>
  {carrierStatuses.length > 0 && (
    <span className="text-xs text-muted-foreground">
      {carrierStatuses.filter(s => s.contracting_status === 'contracted').length}/{carrierStatuses.length} contracted
    </span>
  )}
</div>
```

### Data Type

```tsx
interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_name: string;
  contracting_status: 'not_started' | 'in_progress' | 'contracted' | 'issue';
  contracting_submitted_at: string | null;
  contracted_at: string | null;
}
```

---

## 3. My Contracting Status Page (Agent-Facing)

### Route

**Path:** `/contracting-hub`
**File:** `src/pages/ContractingHubPage.tsx` (647 lines)

### Route Configuration (App.tsx lines 217-219)

```tsx
<Route path="/contracting-hub" element={
  <ProtectedRoute>
    <ContractingHubPage />
  </ProtectedRoute>
} />
```

### What It Currently Shows

#### Header Bar (Horizontal Dashboard)
- **Progress:** "X of Y Ready to Sell" with progress bar
- **Metrics:** Carriers needing cert, pending count, or "All ready!"

#### AHIP Section
- Current year certification status
- Upload button if incomplete
- Alert banner linking to AHIP training

#### License Bar
- Resident state display
- Non-resident states list
- "Request License" email link

#### Carrier Status Table

| Column | Content |
|--------|---------|
| Carrier | Name |
| Products | MA, MAPD, PDP, Medigap, etc. |
| Contracting | Contracted / Pending / empty |
| 2026 Cert | Checkmark or empty circle |
| 2027 Cert | Checkmark or "Coming" |
| Status | Action link or ready indicator |

#### Sorting Order
1. RTS but needs cert (highest priority)
2. In progress
3. Not started
4. RTS with current cert (lowest - already ready)

### Agent vs Admin Views Comparison

| Aspect | Agent (`/contracting-hub`) | Admin (`/admin/contracting`) |
|--------|---------------------------|------------------------------|
| **Purpose** | Status dashboard (read-only) | Workflow management |
| **Data Source** | `carrier_statuses` + `agent_certifications` | `contracting_applications` + `carrier_statuses` |
| **Editable** | Upload AHIP cert only | Carriers, status, links, queue |
| **Scope** | Own data only | All agents |
| **Actions** | Upload cert, request contracting | Send to Pinnacle, mark complete |
| **Queue Phases** | N/A | Ready to Send vs Completed |

### Related Files

| File | Purpose |
|------|---------|
| `src/pages/ContractingHubPage.tsx` | Agent-facing status dashboard |
| `src/pages/ContractingPage.tsx` | Wrapper for contracting form |
| `src/components/contracting/ContractingForm.tsx` | The actual contracting wizard |
| `src/pages/admin/ContractingQueuePage.tsx` | Admin queue management |
| `src/components/admin/CarrierStatusPanel.tsx` | Admin carrier management panel |

### Data Tables Used

- `carrier_statuses` - Per-agent carrier contracting status
- `agent_certifications` - Carrier-specific certifications by year
- `profiles` - AHIP cert fields (`ahip_cert_year`, `ahip_cert_uploaded_at`, `ahip_cert_file_path`)
- `contracting_applications` - Form submission and queue status
