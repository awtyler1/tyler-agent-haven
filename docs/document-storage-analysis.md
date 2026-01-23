# Document Storage System Analysis

**Date:** January 19, 2026
**Purpose:** Document current storage architecture to inform the new categorized document system

---

## Overview

The current system stores agent documents in Supabase Storage with metadata tracked in database columns (JSONB). There is **no dedicated `documents` table** — document references are embedded in other tables.

---

## 1. Storage Buckets

### Bucket: `contracting-documents`
| Property | Value |
|----------|-------|
| **Public** | No (private) |
| **File size limit** | Not specified |
| **MIME types** | Not restricted |
| **Created** | Migration `20251208233620_...` |

**RLS Policies:**
- Users can upload/view/delete their own documents (folder path starts with `auth.uid()`)
- Admins can view all documents

### Bucket: `agent-documents`
| Property | Value |
|----------|-------|
| **Public** | No (private) |
| **File size limit** | 10MB |
| **MIME types** | `application/pdf`, `image/png`, `image/jpeg`, `image/jpg` |
| **Created** | Migration `20260116000000_create_agent_documents_bucket.sql` |

**RLS Policies:**
- Users can upload/view/update their own AHIP certificates
- Admins can view all agent documents

---

## 2. File Path Structure

### contracting-documents/
```
contracting-documents/
└── {user_id}/
    ├── insurance_license/
    │   └── {timestamp}_{filename}
    ├── government_id/
    │   └── {timestamp}_{filename}
    ├── voided_check/
    │   └── {timestamp}_{filename}
    ├── eo_certificate/
    │   └── {timestamp}_{filename}
    ├── aml_certificate/
    │   └── {timestamp}_{filename}
    ├── ce_certificate/
    │   └── {timestamp}_{filename}
    ├── ltc_certificate/
    │   └── {timestamp}_{filename}
    ├── corporate_resolution/
    │   └── {timestamp}_{filename}
    ├── background_explanation/
    │   └── {timestamp}_{filename}
    ├── contracting_packet/
    │   └── {timestamp}_contracting_packet.pdf
    └── {signature_types}/
        └── {timestamp}_{signature}.png
```

### agent-documents/
```
agent-documents/
└── ahip-certificates/
    └── {user_id}/
        └── ahip_{year}.{ext}
```

---

## 3. Metadata Storage

### Primary: `contracting_applications.uploaded_documents` (JSONB)

**Structure:**
```typescript
{
  insurance_license: "user-id/insurance_license/1705123456789_license.pdf",
  government_id: "user-id/government_id/1705123456789_id.jpg",
  voided_check: "user-id/voided_check/1705123456789_check.pdf",
  eo_certificate: "user-id/eo_certificate/1705123456789_eo.pdf",
  aml_certificate: "user-id/aml_certificate/1705123456789_aml.pdf",
  ce_certificate: "user-id/ce_certificate/1705123456789_ce.pdf",
  ltc_certificate: "user-id/ltc_certificate/1705123456789_ltc.pdf",
  corporate_resolution: "user-id/corporate_resolution/1705123456789_corp.pdf",
  background_explanation: "user-id/background_explanation/1705123456789_bg.pdf",
  contracting_packet: "user-id/contracting_packet/1705123456789_contracting_packet.pdf",
  final_signature: "user-id/final_signature/1705123456789_sig.png",
  initials_image: "user-id/initials_image/1705123456789_init.png",
  signature_image: "user-id/signature_image/1705123456789_sig.png"
}
```

### Secondary: `profiles` table (for AHIP)
```sql
ahip_cert_year       INTEGER    -- Year of certification (e.g., 2026)
ahip_cert_uploaded_at TIMESTAMPTZ -- When uploaded
ahip_cert_file_path  TEXT       -- Storage path: "ahip-certificates/{userId}/ahip_{year}.{ext}"
```

---

## 4. PDF Generation Flow

### Library
- **pdf-lib** (v1.17.1) — Used in Edge Function

### Template
- **File:** `TIG_Contracting_Packet_SIGNATURES_FIXED.pdf`
- **Location:** `/public/templates/` or Supabase `templates-public` bucket

### Generation Process
```
1. User completes contracting wizard (Steps 1-11)
2. User signs on Step 12 (Sign & Submit)
3. Frontend calls Edge Function: generate-contracting-pdf
4. Edge Function:
   a. Loads PDF template from base64
   b. Fills form fields with application data
   c. Embeds signature images
   d. Flattens form
   e. Uploads to storage: {user_id}/contracting_packet/{timestamp}_contracting_packet.pdf
   f. Updates contracting_applications.uploaded_documents
5. Application status → 'submitted'
6. Profile status → 'CONTRACTING_SUBMITTED'
```

### Output File Naming
```
Storage path: {user_id}/contracting_packet/{timestamp}_contracting_packet.pdf
Download name: TIG_Contracting_{LastName}_{FirstName}_{YYYYMMDD}.pdf
```

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `src/components/admin/AgentDocumentsCard.tsx` | Admin view of agent documents |
| `src/hooks/useContractingApplication.ts` | Upload/delete document operations |
| `src/hooks/useContractingPdf.ts` | PDF generation trigger |
| `src/pages/ContractingHubPage.tsx` | AHIP certificate upload |
| `src/components/contracting/sections/DocumentsSection.tsx` | Document upload UI in wizard |
| `supabase/functions/generate-contracting-pdf/index.ts` | PDF generation logic |

---

## 6. Document Types & Labels

From `AgentDocumentsCard.tsx`:

```typescript
const DOCUMENT_LABELS: Record<string, string> = {
  insurance_license: 'Resident License',
  government_id: 'Government ID',
  voided_check: 'Voided Check',
  eo_certificate: 'E&O Certificate',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
  contracting_packet: 'Contracting Packet (PDF)',
};
```

---

## 7. Current Limitations

### No Dedicated Documents Table
- Document paths stored in JSONB column
- No way to query documents across agents
- No upload history (only latest per type)
- No document versioning
- No expiration tracking
- No categorization beyond document type

### Single-Category Structure
- All documents are "contracting documents"
- AHIP is separate but only in `profiles` table
- No carrier-specific document categories
- No distinction between certifications, licenses, compliance docs

### Upload Restrictions
- One file per document type
- New upload replaces old (no history)
- No batch upload capability
- No admin upload on behalf of agent

### Missing Features
- Document expiration dates
- Document verification status
- Upload source tracking (agent vs admin vs import)
- Document categories (certifications, licenses, compliance, etc.)

---

## 8. How AgentDocumentsCard Works

### Data Flow
```
1. Fetch contracting_applications.uploaded_documents WHERE user_id = X
2. Parse JSONB → Object.entries()
3. For each document:
   a. Extract folder path and filename
   b. Call storage.list(folderPath) to get metadata (created_at)
4. Sort by upload date (newest first)
5. Render list with View/Download buttons
```

### Document Actions
- **View:** Creates signed URL (5 min expiry), opens in new tab
- **Download:** Downloads blob, creates temporary link, triggers download

### Display
- Grouped under "Contracting Documents" collapsible folder
- Shows document label + upload timestamp
- Contracting Packet highlighted with primary color

---

## 9. Recommendations for New System

### Create `agent_documents` Table
```sql
CREATE TABLE agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Document identification
  category TEXT NOT NULL,  -- 'certification', 'license', 'compliance', 'contracting'
  document_type TEXT NOT NULL,  -- 'ahip', 'eo_certificate', 'resident_license', etc.
  carrier_id UUID REFERENCES carriers(id),  -- For carrier-specific docs

  -- File info
  file_path TEXT NOT NULL,  -- Storage path
  file_name TEXT NOT NULL,  -- Original filename
  file_size INTEGER,
  mime_type TEXT,

  -- Metadata
  year INTEGER,  -- For annual certs (AHIP, E&O)
  expires_at TIMESTAMPTZ,  -- When document expires
  verified_at TIMESTAMPTZ,  -- When admin verified
  verified_by UUID REFERENCES profiles(id),

  -- Tracking
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,  -- Who uploaded
  source TEXT DEFAULT 'manual',  -- 'manual', 'contracting_wizard', 'rts_import', 'bulk_upload'
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Suggested Categories
```typescript
enum DocumentCategory {
  CERTIFICATION = 'certification',  // AHIP, carrier certs
  LICENSE = 'license',              // Resident license, state licenses
  COMPLIANCE = 'compliance',        // E&O, AML, background docs
  CONTRACTING = 'contracting',      // Contracting packet, voided check, etc.
  OTHER = 'other'                   // Miscellaneous
}
```

### Migration Strategy
1. Create new `agent_documents` table
2. Backfill from `contracting_applications.uploaded_documents`
3. Backfill from `profiles.ahip_cert_*` fields
4. Update AgentDocumentsCard to read from new table
5. Keep `uploaded_documents` JSONB for backwards compatibility
6. Gradually deprecate old storage patterns

---

## Summary

**Current State:**
- Two buckets: `contracting-documents` (primary) and `agent-documents` (AHIP only)
- Metadata in JSONB column (`contracting_applications.uploaded_documents`)
- No dedicated documents table
- Single-file-per-type limitation
- No versioning, expiration, or categorization

**Key Insight:**
The current system was built for the contracting wizard flow only. It needs restructuring to support:
- Multiple document categories
- Admin document management
- Carrier-specific documents
- Expiration tracking
- Document verification workflow
- Historical document versions
