# Supabase Database Schema

This document lists all tables in the Supabase database with their columns and types, based on `src/integrations/supabase/types.ts`.

---

## Tables

### 1. `ahip_certifications`
**Purpose:** Stores AHIP (America's Health Insurance Plans) certification records for users.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `certification_year` | number | No | Year of certification |
| `status` | string | No | Certification status |
| `certificate_url` | string | Yes | URL to certificate document |
| `completed_at` | string (timestamp) | Yes | Completion timestamp |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:** None

---

### 2. `carrier_certifications`
**Purpose:** Stores carrier-specific certifications for users.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `carrier_id` | string (uuid) | No | Foreign key to carriers table |
| `certification_year` | number | No | Year of certification |
| `status` | string | No | Certification status |
| `certificate_url` | string | Yes | URL to certificate document |
| `completed_at` | string (timestamp) | Yes | Completion timestamp |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:**
- `carrier_id` → `carriers.id`

---

### 3. `carrier_statuses`
**Purpose:** Tracks contracting status and information for each user-carrier relationship.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `carrier_id` | string (uuid) | No | Foreign key to carriers table |
| `contracting_status` | string | No | Current contracting status |
| `contracting_link_url` | string | Yes | URL to contracting application |
| `contracting_link_sent_at` | string (timestamp) | Yes | When contracting link was sent |
| `contracting_submitted_at` | string (timestamp) | Yes | When application was submitted |
| `contracted_at` | string (timestamp) | Yes | When agent was contracted |
| `link_resend_requested_at` | string (timestamp) | Yes | When resend was requested |
| `issue_description` | string | Yes | Description of any issues |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:**
- `carrier_id` → `carriers.id`

---

### 4. `carriers`
**Purpose:** Stores insurance carrier information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `name` | string | No | Carrier name |
| `code` | string | No | Carrier code/identifier |
| `display_name` | string | Yes | Display name for UI |
| `is_active` | boolean | No | Whether carrier is active |
| `state_availability` | string[] | Yes | Array of available states |
| `product_tags` | string[] | Yes | Product categories/tags |
| `requires_corporate_resolution` | boolean | No | Requires corporate resolution |
| `requires_non_resident_states` | boolean | No | Requires non-resident states info |
| `notes` | string | Yes | Additional notes |
| `created_at` | string (timestamp) | No | Creation timestamp |
| `updated_at` | string (timestamp) | No | Last update timestamp |

**Relationships:** None

---

### 5. `certification_windows`
**Purpose:** Defines certification enrollment windows for carriers.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `carrier_id` | string (uuid) | Yes | Foreign key to carriers (null = all carriers) |
| `certification_year` | number | No | Year for certification window |
| `opens_at` | string (timestamp) | No | Window open date/time |
| `closes_at` | string (timestamp) | No | Window close date/time |
| `notes` | string | Yes | Additional notes |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:**
- `carrier_id` → `carriers.id`

---

### 6. `contracting_applications`
**Purpose:** Stores detailed contracting application data for agents.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `status` | string | No | Application status |
| `current_step` | number | No | Current step in wizard |
| `completed_steps` | number[] | No | Array of completed step numbers |
| `is_test` | boolean | Yes | Whether this is test data |
| `upline_id` | string (uuid) | Yes | Upline/manager user ID |
| `sent_to_upline_at` | string (timestamp) | Yes | When sent to upline |
| `sent_to_upline_by` | string (uuid) | Yes | Who sent to upline |
| `submitted_at` | string (timestamp) | Yes | Submission timestamp |

**Personal Information:**
| Column | Type | Nullable |
|--------|------|----------|
| `full_legal_name` | string | Yes |
| `email_address` | string | Yes |
| `birth_date` | string | Yes |
| `birth_city` | string | Yes |
| `birth_state` | string | Yes |
| `gender` | string | Yes |
| `resident_state` | string | Yes |
| `resident_license_number` | string | Yes |
| `npn_number` | string | Yes |

**Addresses:**
| Column | Type | Nullable |
|--------|------|----------|
| `home_address` | Json | Yes |
| `mailing_address` | Json | Yes |
| `mailing_address_same_as_home` | boolean | Yes |
| `ups_address` | Json | Yes |
| `ups_address_same_as_home` | boolean | Yes |
| `previous_addresses` | Json | Yes |

**Contact:**
| Column | Type | Nullable |
|--------|------|----------|
| `phone_home` | string | Yes |
| `phone_mobile` | string | Yes |
| `phone_business` | string | Yes |
| `fax` | string | Yes |
| `preferred_contact_methods` | string[] | Yes |

**Identification:**
| Column | Type | Nullable |
|--------|------|----------|
| `drivers_license_number` | string | Yes |
| `drivers_license_state` | string | Yes |
| `insurance_license_number` | string | Yes |
| `license_expiration_date` | string | Yes |

**Business:**
| Column | Type | Nullable |
|--------|------|----------|
| `agency_name` | string | Yes |
| `agency_tax_id` | string | Yes |
| `tax_id` | string | Yes |
| `is_corporation` | boolean | Yes |
| `contract_level` | string | Yes |

**Banking:**
| Column | Type | Nullable |
|--------|------|----------|
| `bank_routing_number` | string | Yes |
| `bank_account_number` | string | Yes |
| `bank_branch_name` | string | Yes |
| `requesting_commission_advancing` | boolean | Yes |

**Beneficiary:**
| Column | Type | Nullable |
|--------|------|----------|
| `beneficiary_name` | string | Yes |
| `beneficiary_relationship` | string | Yes |
| `beneficiary_birth_date` | string | Yes |
| `beneficiary_drivers_license_number` | string | Yes |
| `beneficiary_drivers_license_state` | string | Yes |

**Compliance:**
| Column | Type | Nullable |
|--------|------|----------|
| `has_aml_course` | boolean | Yes |
| `aml_course_name` | string | Yes |
| `aml_training_provider` | string | Yes |
| `aml_course_date` | string | Yes |
| `aml_completion_date` | string | Yes |
| `has_ltc_certification` | boolean | Yes |
| `state_requires_ce` | boolean | Yes |
| `non_resident_states` | string[] | Yes |

**E&O Insurance:**
| Column | Type | Nullable |
|--------|------|----------|
| `eo_provider` | string | Yes |
| `eo_policy_number` | string | Yes |
| `eo_expiration_date` | string | Yes |
| `eo_not_yet_covered` | boolean | Yes |

**FINRA:**
| Column | Type | Nullable |
|--------|------|----------|
| `is_finra_registered` | boolean | Yes |
| `finra_broker_dealer_name` | string | Yes |
| `finra_crd_number` | string | Yes |

**Other:**
| Column | Type | Nullable |
|--------|------|----------|
| `selected_carriers` | Json | Yes |
| `uploaded_documents` | Json | Yes |
| `legal_questions` | Json | Yes |
| `disciplinary_entries` | Json | No (default: []) |
| `agreements` | Json | Yes |
| `section_acknowledgments` | Json | Yes |
| `signature_name` | string | Yes |
| `signature_initials` | string | Yes |
| `signature_date` | string | Yes |
| `created_at` | string (timestamp) | No |
| `updated_at` | string (timestamp) | No |

**Relationships:** None

---

### 7. `document_chunks`
**Purpose:** Stores document chunks for RAG (Retrieval Augmented Generation) search functionality.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `document_name` | string | No | Name of source document |
| `document_type` | string | No | Type/category of document |
| `chunk_index` | number | No | Index of chunk in document |
| `chunk_text` | string | No | Text content of chunk |
| `page_number` | number | Yes | Page number in source document |
| `carrier` | string | Yes | Associated carrier |
| `plan_name` | string | Yes | Associated plan name |
| `embedding` | string (vector) | Yes | Vector embedding for semantic search |
| `metadata` | Json | Yes | Additional metadata |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:** None

---

### 8. `entity_owners`
**Purpose:** Links users to hierarchy entities they own/manage.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `entity_id` | string (uuid) | No | Foreign key to hierarchy_entities |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `is_primary` | boolean | Yes | Whether this is the primary owner |
| `created_at` | string (timestamp) | Yes | Creation timestamp |

**Relationships:**
- `entity_id` → `hierarchy_entities.id`

---

### 9. `feature_flags`
**Purpose:** Stores feature flag configuration for toggling features.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `flag_key` | string | No | Unique flag identifier |
| `flag_value` | boolean | Yes | Flag value (enabled/disabled) |
| `description` | string | Yes | Description of what the flag controls |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:** None

---

### 10. `hierarchy_entities`
**Purpose:** Defines organizational hierarchy entities (teams, MGAs, GAs).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `name` | string | No | Entity name |
| `entity_type` | string | No | Type: 'team', 'mga', or 'ga' |
| `parent_entity_id` | string (uuid) | Yes | Self-referencing foreign key for hierarchy |
| `is_active` | boolean | Yes | Whether entity is active |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:**
- `parent_entity_id` → `hierarchy_entities.id` (self-referencing)

---

### 11. `processing_jobs`
**Purpose:** Tracks document processing jobs for RAG system.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `status` | string | No | Job status |
| `total_documents` | number | No | Total documents to process |
| `processed_documents` | number | No | Documents processed so far |
| `failed_documents` | number | No | Documents that failed |
| `current_document` | string | Yes | Currently processing document name |
| `error_message` | string | Yes | Error message if failed |
| `started_at` | string (timestamp) | Yes | Job start time |
| `completed_at` | string (timestamp) | Yes | Job completion time |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:** None

---

### 12. `profiles`
**Purpose:** Main user profile table linked to auth.users.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `email` | string | Yes | User email |
| `full_name` | string | Yes | User's full name |
| `is_active` | boolean | No | Whether user is active |
| `is_test` | boolean | Yes | Whether this is a test account |
| `developer_access` | boolean | Yes | Whether user has developer access |

**Onboarding:**
| Column | Type | Nullable |
|--------|------|----------|
| `onboarding_status` | enum | Yes | CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED, SUSPENDED |
| `appointed_at` | string (timestamp) | Yes |
| `setup_link_sent_at` | string (timestamp) | Yes |
| `password_created_at` | string (timestamp) | Yes |
| `first_login_at` | string (timestamp) | Yes |

**Hierarchy:**
| Column | Type | Nullable |
|--------|------|----------|
| `hierarchy_type` | string | Yes | Type: 'direct', 'team', 'mga', 'ga', 'loa', 'downline' |
| `hierarchy_entity_id` | string (uuid) | Yes | Foreign key to hierarchy_entities |
| `upline_user_id` | string (uuid) | Yes | User ID of upline (for downline assignments) |
| `manager_id` | string (uuid) | Yes | Foreign key to profiles.id (manager) |

**Carriers:**
| Column | Type | Nullable |
|--------|------|----------|
| `assigned_carriers` | string[] | Yes | Array of carrier IDs |
| `excluded_carriers` | string[] | Yes | Array of excluded carrier IDs |

**Other:**
| Column | Type | Nullable |
|--------|------|----------|
| `contracting_notes` | string | Yes | Admin notes on contracting |
| `created_at` | string (timestamp) | No |
| `updated_at` | string (timestamp) | No |

**Relationships:**
- `hierarchy_entity_id` → `hierarchy_entities.id`
- `manager_id` → `profiles.id` (self-referencing)

---

### 13. `state_carriers`
**Purpose:** Maps carriers to states with availability and default flags.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `carrier_id` | string (uuid) | Yes | Foreign key to carriers |
| `state_code` | string | No | Two-letter state code |
| `is_available` | boolean | Yes | Whether carrier is available in this state |
| `is_default` | boolean | Yes | Whether this is a default carrier for the state |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:**
- `carrier_id` → `carriers.id`

---

### 14. `system_config`
**Purpose:** Stores system-wide configuration as key-value pairs with JSON values.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `config_key` | string | No | Unique configuration key |
| `config_value` | Json | No | Configuration value (JSON) |
| `created_at` | string (timestamp) | Yes | Creation timestamp |
| `updated_at` | string (timestamp) | Yes | Last update timestamp |

**Relationships:** None

---

### 15. `user_roles`
**Purpose:** Maps users to their roles (separate table for security/RLS).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | string (uuid) | No | Primary key |
| `user_id` | string (uuid) | No | Foreign key to auth.users |
| `role` | enum | No | Role type (see Enums below) |
| `created_at` | string (timestamp) | No | Creation timestamp |

**Relationships:** None

---

## Enums

### `app_role`
User role types:
- `super_admin` - Super administrator
- `admin` - Administrator
- `manager` - Manager
- `independent_agent` - Independent agent
- `internal_tig_agent` - Internal TIG agent

### `onboarding_status`
User onboarding status:
- `CONTRACTING_REQUIRED` - Needs to complete contracting
- `CONTRACTING_SUBMITTED` - Contracting application submitted
- `APPOINTED` - Appointed and active
- `SUSPENDED` - Suspended/inactive

---

## Functions

### `get_auth_user_details(_user_id: string)`
Returns authentication user details for a given user ID.

### `get_auth_user_ids()`
Returns all authentication user IDs.

### `get_my_profile_id()`
Returns the profile ID for the currently authenticated user.

### `get_user_role(_user_id: string)`
Returns the primary role for a given user ID.

### `has_role(_user_id: string, _role: app_role)`
Checks if a user has a specific role (returns boolean).

### `search_documents(query_embedding: string, match_count?: number, match_threshold?: number, filter_carrier?: string, filter_type?: string)`
Semantic search function for document chunks using vector embeddings.

---

## Summary Statistics

- **Total Tables:** 15
- **Total Functions:** 6
- **Total Enums:** 2
- **Views:** None
- **Composite Types:** None

### Table Categories

**User Management:**
- `profiles`
- `user_roles`
- `hierarchy_entities`
- `entity_owners`

**Carriers & Certifications:**
- `carriers`
- `carrier_statuses`
- `carrier_certifications`
- `ahip_certifications`
- `certification_windows`
- `state_carriers`

**Contracting:**
- `contracting_applications`

**Documents & Search:**
- `document_chunks`
- `processing_jobs`

**System:**
- `system_config`
- `feature_flags`

