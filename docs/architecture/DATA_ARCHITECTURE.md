# Data Architecture

**Version:** 1.0
**Last Updated:** February 9, 2026
**Parent:** [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Table of Contents

1. [Data Model Overview](#1-data-model-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Specifications](#3-table-specifications)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Storage Architecture](#5-storage-architecture)
6. [Data Lifecycle](#6-data-lifecycle)
7. [Indexing Strategy](#7-indexing-strategy)

---

## 1. Data Model Overview

The database is organized into five logical domains:

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE DOMAINS                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  IDENTITY    │  │ CONTRACTING  │  │ PRODUCTION TRACKING  │  │
│  │              │  │              │  │                      │  │
│  │ • profiles   │  │ • contract-  │  │ • monthly_syncs      │  │
│  │ • user_roles │  │   ing_apps   │  │ • sync_carrier_ups   │  │
│  │ • auth.users │  │ • carrier_   │  │ • production_uploads │  │
│  │              │  │   statuses   │  │ • policies (clients) │  │
│  │              │  │ • agent_     │  │ • milestones         │  │
│  │              │  │   certs      │  │ • agent_carriers     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │  CARRIERS    │  │  SUPPORTING                              │ │
│  │              │  │                                          │ │
│  │ • carriers   │  │ • activity_logs    • feature_flags       │ │
│  │ • carrier_   │  │ • agent_documents  • forms               │ │
│  │   contacts   │  │ • document_chunks  • rts_import_logs     │ │
│  │ • carrier_   │  │ • training_*       • email_templates     │ │
│  │   documents  │  │                                          │ │
│  │ • carrier_   │  │                                          │ │
│  │   links      │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Database Statistics

| Metric | Count |
|--------|-------|
| Tables | 21+ |
| Migrations | 67+ |
| Custom enums | 2 (app_role, onboarding_status) |
| Security definer functions | 3 |
| RLS policies | ~30+ |
| pgvector columns | 1 (document_chunks.embedding) |

---

## 2. Entity Relationship Diagram

### 2.1 Complete ERD

```
                              ┌─────────────────┐
                              │   auth.users     │
                              │ (Supabase-managed)│
                              │                   │
                              │ id (UUID) PK      │
                              │ email             │
                              │ encrypted_password│
                              └────────┬──────────┘
                                       │ 1:1
                                       ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ contracting_        │      │     profiles         │      │    user_roles       │
│ applications        │      │                      │      │                     │
│                     │      │ id (UUID) PK         │      │ id (UUID) PK        │
│ id (UUID) PK        │      │ user_id (FK→auth) UQ │◀────│ user_id (FK→auth)   │
│ user_id (FK→auth)   │◀────│ full_name            │      │ role (app_role)     │
│ status              │      │ email                │      │ created_at          │
│ current_step        │ 1:1  │ phone                │ 1:N  │                     │
│ completed_steps[]   │      │ npn                  │      │ UQ(user_id, role)   │
│                     │      │ onboarding_status    │      └─────────────────────┘
│ -- JSONB fields --  │      │ is_active            │
│ selected_carriers   │      │ manager_id (FK→self) │───┐ (self-referential)
│ legal_questions     │      │ last_sync_at         │   │
│ disciplinary_entries│      │ ahip_cert_year       │◀──┘
│ agreements          │      │ created_at           │
│ uploaded_documents  │      │ updated_at           │
│                     │      │ appointed_at         │
│ -- Personal --      │      │ first_login_at       │
│ full_legal_name     │      └──────────┬───────────┘
│ birth_date          │                 │
│ drivers_license_num │    ┌────────────┼────────────────────────┐
│ gender              │    │            │                        │
│                     │    ▼            ▼                        ▼
│ -- Banking --       │ ┌────────────┐ ┌───────────────────┐ ┌──────────────────┐
│ bank_routing_number │ │carrier_    │ │agent_             │ │monthly_syncs     │
│ bank_account_number │ │statuses    │ │certifications     │ │                  │
│                     │ │            │ │                   │ │ id (UUID) PK     │
│ -- Insurance --     │ │ id PK      │ │ id PK             │ │ profile_id (FK)  │
│ eo_policy_number    │ │ profile_id │ │ profile_id (FK)   │ │ month (date)     │
│ eo_expiration_date  │ │ carrier_id │ │ carrier_name      │ │ status           │
│                     │ │ contracting│ │ product_type      │ │ total_clients    │
│ -- Tracking --      │ │ _status    │ │ certification_year│ │ new_clients      │
│ sent_to_upline_at   │ │ contracted │ │                   │ │ termed_clients   │
│ sent_to_pinnacle_at │ │ _at        │ │ UQ(profile_id,    │ │ net_change       │
└─────────────────────┘ │            │ │   carrier_name,   │ │ started_at       │
                        └──────┬─────┘ │   product_type)   │ │ completed_at     │
                               │       └───────────────────┘ └────────┬─────────┘
                               │                                      │
                               ▼                                      │ 1:N
                        ┌────────────────┐                           ▼
                        │   carriers     │             ┌──────────────────────┐
                        │                │             │ sync_carrier_uploads │
                        │ id (UUID) PK   │             │                      │
                        │ code (UQ)      │◀───────────│ id PK                │
                        │ name           │             │ sync_id (FK)         │
                        │ display_name   │             │ carrier_id (FK)      │
                        │ is_active      │             │ client_count         │
                        │ rts_aliases[]  │             │ previous_count       │
                        │ cms_aliases[]  │             │ new_clients          │
                        │ product_tags[] │             │ termed_clients       │
                        │ state_avail[]  │             │ production_upload_id │
                        └────────────────┘             │ uploaded_at          │
                               │                       └──────────────────────┘
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
             ┌──────────┐┌──────────┐┌──────────┐
             │carrier_  ││carrier_  ││carrier_  │
             │contacts  ││documents ││links     │
             │          ││          ││          │
             │ id PK    ││ id PK    ││ id PK    │
             │carrier_id││carrier_id││carrier_id│
             │ name     ││ title    ││ label    │
             │ role     ││ file_path││ url      │
             │ phone    ││ category ││ type     │
             │ email    ││          ││          │
             └──────────┘└──────────┘└──────────┘


  SUPPORTING TABLES

  ┌─────────────────────┐  ┌───────────────────┐  ┌──────────────────┐
  │   activity_logs     │  │  feature_flags    │  │ document_chunks  │
  │                     │  │                   │  │                  │
  │ id PK               │  │ id PK             │  │ id PK            │
  │ user_id (profile_id)│  │ name (UQ)         │  │ content (text)   │
  │ action_type         │  │ enabled (boolean) │  │ embedding        │
  │ entity_type         │  │ description       │  │  (vector 1536)   │
  │ entity_id           │  │ created_at        │  │ metadata (JSONB) │
  │ metadata (JSONB)    │  │                   │  │ source_document  │
  │ created_at          │  │                   │  │                  │
  │                     │  │                   │  │                  │
  │ ⚠ NO UPDATE/DELETE  │  │                   │  │                  │
  └─────────────────────┘  └───────────────────┘  └──────────────────┘

  ┌─────────────────────┐  ┌───────────────────┐  ┌──────────────────┐
  │    milestones       │  │  agent_carriers   │  │    policies      │
  │                     │  │                   │  │   (clients)      │
  │ id PK               │  │ id PK             │  │                  │
  │ profile_id (FK)     │  │ profile_id (FK)   │  │ id PK            │
  │ milestone_type      │  │ carrier_id (FK)   │  │ profile_id (FK)  │
  │ milestone_value     │  │ created_at        │  │ carrier_id (FK)  │
  │ achieved_at         │  │                   │  │ status           │
  │ sync_id (FK)        │  │                   │  │ effective_date   │
  │                     │  │                   │  │ termed_date      │
  └─────────────────────┘  └───────────────────┘  └──────────────────┘
```

---

## 3. Table Specifications

### 3.1 Identity Domain

#### profiles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default gen | Profile identifier |
| `user_id` | UUID | FK→auth.users, UNIQUE | Supabase auth user |
| `full_name` | TEXT | | Display name |
| `email` | TEXT | | Contact email |
| `phone` | TEXT | | Phone number |
| `npn` | TEXT | | National Producer Number |
| `onboarding_status` | ENUM | NOT NULL | CONTRACTING_REQUIRED / CONTRACTING_SUBMITTED / APPOINTED |
| `is_active` | BOOLEAN | DEFAULT true | Deactivation flag |
| `manager_id` | UUID | FK→profiles(id) | Manager (self-referential) |
| `last_sync_at` | TIMESTAMPTZ | | Last Book of Business sync |
| `sync_reminder_sent_at` | TIMESTAMPTZ | | Last sync reminder email |
| `ahip_cert_year` | INTEGER | | AHIP certification year |
| `ahip_cert_uploaded_at` | TIMESTAMPTZ | | AHIP cert upload timestamp |
| `ahip_cert_file_path` | TEXT | | Storage path for AHIP cert |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | | |
| `appointed_at` | TIMESTAMPTZ | | When fully appointed |
| `first_login_at` | TIMESTAMPTZ | | First platform login |

#### user_roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK→auth.users | |
| `role` | app_role | NOT NULL | Role enum value |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| | | UNIQUE(user_id, role) | Users can have multiple distinct roles |

### 3.2 Contracting Domain

#### contracting_applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK→auth.users, UNIQUE | One app per user |
| `status` | TEXT | | draft / submitted / approved / rejected |
| `current_step` | INTEGER | | Wizard step (0-7) |
| `completed_steps` | INTEGER[] | | Array of completed step indices |
| `selected_carriers` | JSONB | | Carriers chosen for contracting |
| `full_legal_name` | TEXT | | Legal name |
| `birth_date` | DATE | | Date of birth |
| `drivers_license_number` | TEXT | | License number |
| `gender` | TEXT | | Gender |
| `agency_name` | TEXT | | Business name |
| `agency_tax_id` | TEXT | | EIN |
| `is_corporation` | BOOLEAN | | Business structure |
| `bank_routing_number` | TEXT | | Banking info |
| `bank_account_number` | TEXT | | Banking info |
| `eo_policy_number` | TEXT | | E&O insurance |
| `eo_expiration_date` | DATE | | E&O expiry |
| `legal_questions` | JSONB | | Background check answers |
| `disciplinary_entries` | JSONB | | Disciplinary history |
| `agreements` | JSONB | | Signed agreements |
| `uploaded_documents` | JSONB | | Document metadata |
| `sent_to_upline_at` | TIMESTAMPTZ | | Forwarded to upline |
| `sent_to_upline_by` | UUID | | Who forwarded |
| `sent_to_pinnacle_at` | TIMESTAMPTZ | | Forwarded to FMO |

#### carrier_statuses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `profile_id` | UUID | FK→profiles | |
| `carrier_id` | UUID | FK→carriers | |
| `contracting_status` | TEXT | | pending / in_progress / contracted / declined |
| `contracting_link_sent_at` | TIMESTAMPTZ | | |
| `contracting_link_url` | TEXT | | |
| `contracting_submitted_at` | TIMESTAMPTZ | | |
| `contracted_at` | TIMESTAMPTZ | | |
| `issue_description` | TEXT | | Reason for decline |

### 3.3 Production Tracking Domain

#### monthly_syncs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `profile_id` | UUID | FK→profiles | |
| `month` | DATE | | YYYY-MM-01 format |
| `status` | TEXT | | in_progress / complete |
| `total_clients` | INTEGER | | Active policies count |
| `new_clients` | INTEGER | | New this month |
| `termed_clients` | INTEGER | | Terminated this month |
| `net_change` | INTEGER | | new - termed |
| `started_at` | TIMESTAMPTZ | | |
| `completed_at` | TIMESTAMPTZ | | |

#### sync_carrier_uploads

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `sync_id` | UUID | FK→monthly_syncs | |
| `carrier_id` | UUID | FK→carriers | |
| `client_count` | INTEGER | | Active policies for carrier |
| `previous_count` | INTEGER | | Prior month's count |
| `new_clients` | INTEGER | | New policies |
| `termed_clients` | INTEGER | | Terminated policies |
| `production_upload_id` | UUID | FK→production_uploads | |
| `uploaded_at` | TIMESTAMPTZ | | |

#### policies (clients)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `profile_id` | UUID | FK→profiles | Agent who owns policy |
| `carrier_id` | UUID | FK→carriers | Which carrier |
| `status` | TEXT | | active / termed |
| `effective_date` | DATE | | Policy start |
| `termed_date` | DATE | | Policy termination |

#### milestones

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `profile_id` | UUID | FK→profiles | |
| `milestone_type` | TEXT | | e.g., 'client_count' |
| `milestone_value` | INTEGER | | Threshold crossed (25, 50, 100...) |
| `achieved_at` | TIMESTAMPTZ | | When achieved |
| `sync_id` | UUID | FK→monthly_syncs | Which sync triggered it |

### 3.4 Carrier Domain

#### carriers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `code` | TEXT | UNIQUE | Machine identifier (e.g., 'aetna') |
| `name` | TEXT | | Internal name |
| `display_name` | TEXT | | User-facing name |
| `is_active` | BOOLEAN | | Whether carrier is available |
| `rts_aliases` | TEXT[] | | Names used in RTS exports |
| `cms_aliases` | TEXT[] | | Names used in CMS data |
| `requires_corporate_resolution` | BOOLEAN | | Contracting requirement |
| `requires_non_resident_states` | BOOLEAN | | Contracting requirement |
| `state_availability` | TEXT[] | | States where active |
| `product_tags` | TEXT[] | | Product categories |

---

## 4. Data Flow Diagrams

### 4.1 Agent Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENT DATA LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CREATION (3 paths)                                                     │
│  ├── Admin creates via UI → create-agent edge function                 │
│  │   └── auth.users + profiles + user_roles                           │
│  │                                                                      │
│  ├── RTS Import → rtsImport.ts Phase 4                                 │
│  │   └── profiles only (stub: NPN + name, no user_id)                 │
│  │                                                                      │
│  └── Admin invites existing stub → send-setup-link                     │
│      └── auth.users created, profile.user_id updated                   │
│                                                                         │
│  CONTRACTING                                                            │
│  └── Agent completes wizard → contracting_applications (JSONB)         │
│      └── Submit → PDF generated + emailed                              │
│      └── Admin approves → onboarding_status = APPOINTED                │
│                                                                         │
│  CERTIFICATION                                                          │
│  └── RTS Import → agent_certifications (yearly)                        │
│      └── Certified carriers → carrier_statuses = 'contracted'          │
│                                                                         │
│  PRODUCTION TRACKING (Monthly)                                          │
│  └── Sync flow → monthly_syncs → sync_carrier_uploads → policies      │
│      └── Milestones awarded at thresholds                              │
│                                                                         │
│  DEACTIVATION                                                           │
│  └── Admin sets is_active = false → immediate signout on next load     │
│                                                                         │
│  DELETION                                                               │
│  └── Super admin → delete-user edge function                           │
│      └── Removes auth.users + cascading profile deletion               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Production Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  UPLOAD PATH (SyncFlow.tsx)                                             │
│                                                                         │
│  Agent uploads CSV/XLSX                                                 │
│       │                                                                 │
│       ▼                                                                 │
│  parse-production-report (edge function)                                │
│       │                                                                 │
│       ├── Parse file (carrier-specific format)                         │
│       ├── Extract client records                                       │
│       ├── Upsert → production_uploads (file metadata)                  │
│       └── Upsert → policies (individual client records)                │
│                │                                                        │
│                ▼                                                        │
│  SyncFlow.tsx queries policies table                                    │
│       │                                                                 │
│       ├── COUNT(*) WHERE status='active' → client_count                │
│       ├── COUNT(*) WHERE effective_date this month → new_clients       │
│       └── COUNT(*) WHERE termed_date this month → termed_clients       │
│                │                                                        │
│                ▼                                                        │
│  Update sync_carrier_uploads                                            │
│       │                                                                 │
│       ▼ (all carriers done)                                            │
│  Complete monthly_syncs                                                 │
│       │                                                                 │
│       ├── total_clients = SUM(carrier client_counts)                   │
│       ├── net_change = new_clients - termed_clients                    │
│       └── profiles.last_sync_at = now()                                │
│                │                                                        │
│                ▼                                                        │
│  Dashboard reads monthly_syncs for display                              │
│       │                                                                 │
│       └── TanStack Query: ['dashboard', profileId]                     │
│                                                                         │
│  UPLOAD PATH (Book of Business Page — UploadModal/UploadContext)        │
│       └── Same edge function, different UI wrapper                     │
│       └── Does NOT go through SyncFlow completion path                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Carrier Configuration Data Flow

```
Carrier config IDs flow:

src/config/carriers.ts          carriers table              agent_certifications
    │                              │                              │
    │  carrier ID = 'aetna'       │  code = 'aetna'             │  carrier_name = 'Aetna'
    │  (config key)               │  id = UUID                   │  (RTS display name)
    │                              │  rts_aliases = ['Aetna',    │
    │                              │    'AETNA', ...]            │
    │                              │                              │
    └──── matches ────────────────▶│◀──── rts_aliases maps ─────┘
                                   │
                     carrier_statuses.carrier_id = carriers.id (UUID)
                     sync_carrier_uploads.carrier_id = carriers.id (UUID)
```

**Key insight:** Config IDs (e.g., 'aetna') match `carriers.code` in the database, NOT the UUID `carriers.id`.

---

## 5. Storage Architecture

### 5.1 Supabase Storage Buckets

| Bucket | Purpose | Auth | Contents |
|--------|---------|------|----------|
| `contracting-packets` | Generated contracting PDFs | Authenticated | PDF files per agent |
| `agent-documents` | Uploaded agent documents | Authenticated | AHIP certs, E&O docs, licenses |
| `production-reports` | Uploaded production files | Authenticated | CSV/XLSX carrier reports |
| `carrier-documents` | Carrier resource files | Authenticated | Plan documents, guides |

### 5.2 File Upload Flow

```
Browser                     Supabase Storage                  Database
   │                              │                              │
   │ 1. Get signed upload URL    │                              │
   │─────────────────────────────▶│                              │
   │                              │                              │
   │ 2. Upload file directly     │                              │
   │─────────────────────────────▶│                              │
   │                              │ 3. Store in bucket           │
   │                              │──────────────────────────────│
   │                              │                              │
   │ 4. Store file reference     │                              │
   │─────────────────────────────────────────────────────────────▶│
   │                              │                              │
```

### 5.3 Vector Storage (RAG)

```
document_chunks table:
┌────────────────────────────────────────────┐
│ id: UUID                                    │
│ content: TEXT (chunk of document text)       │
│ embedding: VECTOR(1536) (OpenAI dimensions) │
│ metadata: JSONB {                           │
│   source_document: "carrier_guide.pdf",     │
│   page_number: 5,                           │
│   chunk_index: 12                           │
│ }                                           │
└────────────────────────────────────────────┘

Query pattern:
SELECT content, 1 - (embedding <=> query_vector) AS similarity
FROM document_chunks
ORDER BY embedding <=> query_vector
LIMIT 5;
```

---

## 6. Data Lifecycle

### 6.1 Retention Policy

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Profiles | Indefinite | Business records |
| Contracting applications | Indefinite | Legal compliance |
| Activity logs | Indefinite | Audit trail |
| Monthly syncs | Indefinite | Historical tracking |
| Policies | Indefinite | Business records |
| Production uploads | Indefinite | Source documents |
| Document chunks | Until re-processed | RAG content, replaceable |
| Feature flags | Until deleted | Operational |

### 6.2 Data Deletion

**User deletion** (via `delete-user` edge function):
1. Supabase auth user deleted (cascade removes session data)
2. Profile soft-deleted or hard-deleted (depends on implementation)
3. Related records: contracting_applications, carrier_statuses, etc.
4. Storage files: contracting PDFs, uploaded documents

**No cascade rules defined** — deletion is handled by edge function logic, not DB constraints. This is a known area for improvement.

---

## 7. Indexing Strategy

### 7.1 Primary Keys and Foreign Keys

All tables use UUID primary keys (auto-generated). Foreign keys are indexed automatically by PostgreSQL.

### 7.2 Key Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `profiles` | `user_id` (UNIQUE) | Auth lookup |
| `profiles` | `npn` | RTS import matching |
| `profiles` | `manager_id` | Manager → team lookup |
| `user_roles` | `(user_id, role)` (UNIQUE) | Role checking |
| `carriers` | `code` (UNIQUE) | Config ID lookup |
| `carrier_statuses` | `(profile_id, carrier_id)` | Agent-carrier lookup |
| `agent_certifications` | `(profile_id, carrier_name, product_type)` (UNIQUE) | Deduplication |
| `monthly_syncs` | `(profile_id, month)` | Monthly sync lookup |
| `document_chunks` | `embedding` (IVFFlat or HNSW) | Vector similarity search |
| `activity_logs` | `created_at` | Chronological queries |

### 7.3 Query Patterns

| Pattern | Query | Optimization |
|---------|-------|-------------|
| Dashboard load | `monthly_syncs WHERE profile_id AND month ORDER BY month DESC LIMIT 12` | Index on (profile_id, month) |
| Admin agent list | `profiles ORDER BY created_at DESC` | Sequential scan (small table) |
| RTS import matching | `profiles WHERE npn IN (...)` | Index on npn |
| Carrier filtering | `agent_certifications WHERE profile_id AND certification_year` | Composite index |
| RAG search | `document_chunks ORDER BY embedding <=> vector LIMIT 5` | Vector index |
