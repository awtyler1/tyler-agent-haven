// supabase/functions/_shared/clientDedup.ts
//
// Shared dedup service for client matching and upsert.
// Used by both parse-production-report (Smart Sync) and import-book-of-business (Book Import).
//
// Key design: batch pre-loading. Instead of querying the DB per row,
// we load ALL of an agent's clients into memory Maps and match in-memory.
// For 500 clients this is ~50KB — trivial for an edge function.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ParsedClientRow {
  first_name?: string;
  last_name?: string;
  middle_initial?: string;
  date_of_birth?: string;    // ISO date string (YYYY-MM-DD)
  medicare_number?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  county_fips?: string;
  part_a_date?: string;       // ISO date string
  part_b_date?: string;       // ISO date string
}

export interface ParsedPolicyRow {
  carrier_name?: string;
  carrier_member_id?: string;
  plan_name?: string;
  plan_type?: string;          // 'MA', 'PDP', 'MEDIGAP', 'OTHER'
  effective_date?: string;     // ISO date string
  term_date?: string;          // ISO date string
  status?: 'active' | 'termed'; // Explicit carrier status (takes priority over term_date derivation)
}

export interface ClientMatchResult {
  clientId: string | null;
  matchType: 'mbi' | 'name_dob' | 'name_only' | 'carrier_member_id' | 'none';
  confidence: 'exact' | 'high' | 'medium' | 'low';
}

interface CachedClient {
  id: string;
  manually_edited_fields: string[];
}

export interface BatchClientCache {
  byMBI: Map<string, CachedClient>;
  byNameDOB: Map<string, CachedClient>;
  byNameOnly: Map<string, CachedClient[]>;  // name-only can have multiple matches
}

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/** Trim + lowercase for comparison keys. Returns empty string for nullish values. */
function norm(val?: string | null): string {
  return (val ?? '').trim().toLowerCase();
}

/** Build the name+DOB composite key */
function nameDobKey(lastName: string, firstName: string, dob: string): string {
  return `${norm(lastName)}|${norm(firstName)}|${dob}`;
}

/** Build the name-only composite key */
function nameKey(lastName: string, firstName: string): string {
  return `${norm(lastName)}|${norm(firstName)}`;
}

// ============================================================================
// PLAN TYPE DERIVATION (canonical — used by both Smart Sync and Book Import)
// ============================================================================

/**
 * Derive plan_type from plan name keywords or short code.
 * Valid return values: 'MA', 'PDP', 'MEDIGAP', 'OTHER'.
 * D-SNP plans are Medicare Advantage → return 'MA'.
 */
export function derivePlanType(planName?: string | null): 'MA' | 'PDP' | 'MEDIGAP' | 'OTHER' {
  if (!planName) return 'OTHER';
  const lower = planName.toLowerCase().trim();

  // Exact short-code matches (e.g., Humana "Plan Type" column values)
  if (lower === 'ma' || lower === 'mapd') return 'MA';
  if (lower === 'pdp' || lower === 'choice') return 'PDP';
  if (lower === 'dsnp' || lower === 'd-snp') return 'MA';

  // Substring matches for full plan names
  if (lower.includes('pdp') || lower.includes('part d') || lower.includes('prescription')) return 'PDP';
  if (lower.includes('plan g') || lower.includes('plan f') || lower.includes('plan n') ||
      lower.includes('medigap') || lower.includes('supplement') || lower.includes('med supp') ||
      lower.includes('modernized') || lower.includes('innovative')) return 'MEDIGAP';
  if (lower.includes('hmo') || lower.includes('ppo') || lower.includes('pffs') ||
      lower.includes('snp') || lower.includes('medicare advantage') ||
      lower.includes(' ma ') || lower.startsWith('ma ')) return 'MA';
  return 'OTHER';
}

// ============================================================================
// STEP 1: BATCH PRE-LOADING
// ============================================================================

/**
 * Loads ALL clients for the given agent into in-memory Maps.
 * This replaces hundreds of sequential DB queries with a single bulk read.
 *
 * @param supabase - Supabase client (service_role for edge functions)
 * @param profileId - The agent's profile ID
 * @returns BatchClientCache with three lookup maps
 */
export async function loadClientCache(
  supabase: SupabaseClient,
  profileId: string
): Promise<BatchClientCache> {
  const cache: BatchClientCache = {
    byMBI: new Map(),
    byNameDOB: new Map(),
    byNameOnly: new Map(),
  };

  // Single query — fetch all clients for this agent
  // Only the fields needed for matching + edit protection
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, medicare_number, first_name, last_name, date_of_birth, manually_edited_fields')
    .eq('profile_id', profileId);

  if (error) {
    console.error('Failed to load client cache:', error);
    throw new Error(`Failed to load client cache: ${error.message}`);
  }

  for (const client of (clients ?? [])) {
    const cached: CachedClient = {
      id: String(client.id),  // String() guard for UUID type safety
      manually_edited_fields: (client.manually_edited_fields as string[]) ?? [],
    };

    // MBI index
    if (client.medicare_number) {
      cache.byMBI.set(norm(client.medicare_number), cached);
    }

    // Name + DOB index
    if (client.last_name && client.first_name && client.date_of_birth) {
      const key = nameDobKey(client.last_name, client.first_name, client.date_of_birth);
      cache.byNameDOB.set(key, cached);
    }

    // Name-only index (array because multiple clients can share a name)
    if (client.last_name && client.first_name) {
      const key = nameKey(client.last_name, client.first_name);
      const existing = cache.byNameOnly.get(key) ?? [];
      existing.push(cached);
      cache.byNameOnly.set(key, existing);
    }
  }

  console.log(`Client cache loaded: ${clients?.length ?? 0} clients, ${cache.byMBI.size} MBI keys, ${cache.byNameDOB.size} name+DOB keys, ${cache.byNameOnly.size} name keys`);

  return cache;
}

// ============================================================================
// STEP 2: IN-MEMORY MATCHING
// ============================================================================

/**
 * Finds an existing client in the pre-loaded cache.
 * Matching priority:
 *   1. MBI exact match (confidence: exact)
 *   2. Name + DOB match (confidence: high)
 *   3. Name only — single match (confidence: medium)
 *   4. Name only — multiple matches (confidence: low, returns first)
 *   5. No match (matchType: none)
 */
export function findExistingClient(
  cache: BatchClientCache,
  row: ParsedClientRow
): ClientMatchResult {
  // Priority 1: MBI exact match
  const mbi = norm(row.medicare_number);
  if (mbi) {
    const match = cache.byMBI.get(mbi);
    if (match) {
      return { clientId: match.id, matchType: 'mbi', confidence: 'exact' };
    }
  }

  // Priority 2: Name + DOB
  const lastName = norm(row.last_name);
  const firstName = norm(row.first_name);
  const dob = row.date_of_birth?.trim() ?? '';

  if (lastName && firstName && dob) {
    const key = nameDobKey(row.last_name!, row.first_name!, dob);
    const match = cache.byNameDOB.get(key);
    if (match) {
      return { clientId: match.id, matchType: 'name_dob', confidence: 'high' };
    }
  }

  // Priority 3: Name only
  if (lastName && firstName) {
    const key = nameKey(row.last_name!, row.first_name!);
    const matches = cache.byNameOnly.get(key);
    if (matches && matches.length === 1) {
      return { clientId: matches[0].id, matchType: 'name_only', confidence: 'medium' };
    }
    if (matches && matches.length > 1) {
      // Ambiguous — return first match but flag low confidence
      return { clientId: matches[0].id, matchType: 'name_only', confidence: 'low' };
    }
  }

  // No match
  return { clientId: null, matchType: 'none', confidence: 'exact' };
}

// ============================================================================
// STEP 3: PROTECTED UPSERT (respects manual edits)
// ============================================================================

/** Fields that can be set from import data */
const CLIENT_IMPORT_FIELDS: (keyof ParsedClientRow)[] = [
  'first_name', 'last_name', 'middle_initial',
  'date_of_birth', 'medicare_number',
  'phone', 'email',
  'address_line1', 'address_line2', 'address_city', 'address_state', 'address_zip',
  'county_fips', 'part_a_date', 'part_b_date',
];

/**
 * Creates a new client or updates an existing one, respecting manual edit protection.
 *
 * For NEW clients: inserts all available fields.
 * For EXISTING clients: checks manually_edited_fields and skips any field
 * the agent has hand-edited in the CRM.
 *
 * Also updates the cache so subsequent rows in the same batch can match
 * against newly created clients (prevents duplicates within a single file).
 */
export async function upsertClient(
  supabase: SupabaseClient,
  profileId: string,
  row: ParsedClientRow,
  matchResult: ClientMatchResult,
  source: 'SMART_SYNC' | 'BOOK_IMPORT',
  cache: BatchClientCache,
  importBatchId?: string
): Promise<{ clientId: string; isNew: boolean }> {

  if (matchResult.clientId === null) {
    // --- NEW CLIENT ---
    const insertData: Record<string, any> = {
      profile_id: profileId,
      source,
    };

    if (importBatchId) {
      insertData.import_batch_id = importBatchId;
    }

    // Set all available fields from the parsed row
    for (const field of CLIENT_IMPORT_FIELDS) {
      const value = row[field];
      if (value === undefined || value === null || value === '') continue;

      // address_state is VARCHAR(2) — reject values that aren't 2-letter state codes
      if (field === 'address_state' && value.length !== 2) continue;

      insertData[field] = value;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to insert client:', error, insertData);
      throw new Error(`Failed to insert client: ${error.message}`);
    }

    const clientId = String(data.id);

    // Update cache so subsequent rows in the same batch can match
    const cached: CachedClient = { id: clientId, manually_edited_fields: [] };

    if (row.medicare_number) {
      cache.byMBI.set(norm(row.medicare_number), cached);
    }
    if (row.last_name && row.first_name && row.date_of_birth) {
      cache.byNameDOB.set(nameDobKey(row.last_name, row.first_name, row.date_of_birth), cached);
    }
    if (row.last_name && row.first_name) {
      const key = nameKey(row.last_name, row.first_name);
      const existing = cache.byNameOnly.get(key) ?? [];
      existing.push(cached);
      cache.byNameOnly.set(key, existing);
    }

    return { clientId, isNew: true };

  } else {
    // --- UPDATE EXISTING CLIENT ---
    // CRITICAL: respect manually_edited_fields
    const existingClient = findCachedClientById(cache, matchResult.clientId);
    const protectedFields = new Set(existingClient?.manually_edited_fields ?? []);

    const updateData: Record<string, any> = {};

    for (const field of CLIENT_IMPORT_FIELDS) {
      const value = row[field];
      if (value === undefined || value === null || value === '') continue;

      // address_state is VARCHAR(2) — reject values that aren't 2-letter state codes
      if (field === 'address_state' && value.length !== 2) continue;

      // Skip fields the agent has hand-edited
      if (protectedFields.has(field)) {
        console.log(`Skipping protected field "${field}" on client ${matchResult.clientId}`);
        continue;
      }

      updateData[field] = value;
    }

    // Always update source and batch reference (these aren't user-editable)
    if (importBatchId) {
      updateData.import_batch_id = importBatchId;
    }

    // Only hit the DB if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', matchResult.clientId);

      if (error) {
        console.error('Failed to update client:', error, matchResult.clientId, updateData);
        throw new Error(`Failed to update client: ${error.message}`);
      }
    }

    return { clientId: matchResult.clientId, isNew: false };
  }
}

/**
 * Find a cached client by ID (needed for manual edit field lookup).
 * Searches all three maps.
 */
function findCachedClientById(cache: BatchClientCache, clientId: string): CachedClient | null {
  // Check MBI map first (most common)
  for (const cached of cache.byMBI.values()) {
    if (cached.id === clientId) return cached;
  }
  // Check name+DOB map
  for (const cached of cache.byNameDOB.values()) {
    if (cached.id === clientId) return cached;
  }
  // Check name-only map (arrays)
  for (const arr of cache.byNameOnly.values()) {
    for (const cached of arr) {
      if (cached.id === clientId) return cached;
    }
  }
  return null;
}

// ============================================================================
// STEP 4: POLICY UPSERT
// ============================================================================

/**
 * Creates or updates a policy record.
 * Uses the new unique constraint: (client_id, carrier_id, COALESCE(plan_type, 'OTHER'))
 */
export async function upsertPolicy(
  supabase: SupabaseClient,
  clientId: string,
  carrierId: string,
  profileId: string,
  row: ParsedPolicyRow,
  sourceUploadId?: string
): Promise<{ isNew: boolean }> {
  const planType = row.plan_type || 'OTHER';

  // Check if policy already exists for this client + carrier + plan type
  const { data: existing, error: findError } = await supabase
    .from('policies')
    .select('id, status, effective_date')
    .eq('client_id', clientId)
    .eq('carrier_id', carrierId)
    .eq('plan_type', planType)
    .maybeSingle();

  if (findError) {
    console.error('Failed to find existing policy:', findError);
    throw new Error(`Failed to find existing policy: ${findError.message}`);
  }

  if (existing) {
    // Determine incoming status — prefer explicit carrier status, fall back to term_date
    const now = new Date();
    let incomingStatus: 'active' | 'termed' = 'active';
    if (row.status) {
      incomingStatus = row.status;
    } else if (row.term_date && new Date(row.term_date) < now) {
      incomingStatus = 'termed';
    }

    const existingStatus = existing.status as string;

    // ACTIVE-WINS LOGIC: prevent termed rows from overwriting active policies
    if (existingStatus === 'active' && incomingStatus === 'termed') {
      // Existing is active, incoming is termed — skip update (active wins)
      console.log(`Skipping termed update on active policy ${existing.id} (active wins)`);
      // Still update last_seen_at and source tracking
      const minimalUpdate: Record<string, any> = { last_seen_at: now.toISOString() };
      if (sourceUploadId) minimalUpdate.last_seen_upload_id = sourceUploadId;
      await supabase.from('policies').update(minimalUpdate).eq('id', existing.id);
      return { isNew: false };
    }

    if (existingStatus === incomingStatus && row.effective_date && existing.effective_date) {
      // Same status — only update if incoming has a later effective_date
      if (new Date(row.effective_date) < new Date(existing.effective_date)) {
        console.log(`Skipping older ${incomingStatus} row on policy ${existing.id} (same status, older effective_date)`);
        const minimalUpdate: Record<string, any> = { last_seen_at: now.toISOString() };
        if (sourceUploadId) minimalUpdate.last_seen_upload_id = sourceUploadId;
        await supabase.from('policies').update(minimalUpdate).eq('id', existing.id);
        return { isNew: false };
      }
    }

    // Proceed with update (termed→active, or same-status with newer/equal effective_date)
    const updateData: Record<string, any> = {
      last_seen_at: now.toISOString(),
    };

    if (row.plan_name) updateData.plan_name = row.plan_name;
    if (row.effective_date) updateData.effective_date = row.effective_date;
    if (row.term_date) updateData.term_date = row.term_date;
    if (row.carrier_member_id) updateData.carrier_member_id = row.carrier_member_id;
    if (sourceUploadId) updateData.last_seen_upload_id = sourceUploadId;

    updateData.status = incomingStatus;
    // Future term dates mean still active
    if (row.term_date && new Date(row.term_date) >= now) {
      updateData.status = 'active';
    }

    const { error } = await supabase
      .from('policies')
      .update(updateData)
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update policy:', error);
      throw new Error(`Failed to update policy: ${error.message}`);
    }

    return { isNew: false };

  } else {
    // INSERT new policy
    const insertData: Record<string, any> = {
      client_id: clientId,
      carrier_id: carrierId,
      profile_id: profileId,
      plan_type: planType,
      status: (row.term_date && new Date(row.term_date) < new Date()) ? 'termed' : 'active',
      last_seen_at: new Date().toISOString(),
    };

    if (row.plan_name) insertData.plan_name = row.plan_name;
    if (row.effective_date) insertData.effective_date = row.effective_date;
    if (row.term_date) insertData.term_date = row.term_date;
    if (row.carrier_member_id) insertData.carrier_member_id = row.carrier_member_id;
    if (sourceUploadId) {
      insertData.source_upload_id = sourceUploadId;
      insertData.last_seen_upload_id = sourceUploadId;
    }

    // effective_date is NOT NULL in the schema — use a fallback if missing
    if (!insertData.effective_date) {
      insertData.effective_date = new Date().toISOString().split('T')[0]; // today
    }

    const { error } = await supabase
      .from('policies')
      .insert(insertData);

    if (error) {
      console.error('Failed to insert policy:', error);
      throw new Error(`Failed to insert policy: ${error.message}`);
    }

    return { isNew: true };
  }
}

// ============================================================================
// ADDRESS LINE2 SPLITTING
// ============================================================================

/** Split address into line1 and line2 if it contains an apartment/unit indicator.
 *  Uses word-boundary matching to avoid false positives like "ROCKMINSTER". */
export function splitAddressLine2(address: string): { line1: string; line2: string | null } {
  const match = address.match(/^(.+?)\s+\b(APT|UNIT|STE|SUITE|BLDG|LOT|#)\b\.?\s*(.*)$/i);
  if (match) {
    const line1 = match[1].trim();
    const line2 = `${match[2]} ${match[3]}`.trim();
    return { line1, line2: line2 || null };
  }
  return { line1: address, line2: null };
}

// ============================================================================
// WELLCARE PLAN NAME REPAIR
// ============================================================================

/** WellCare plan name repair — their export truncates at ~30 chars.
 *  Uses CMS Contract + Plan Number as lookup key. */
const WELLCARE_PLAN_NAMES: Record<string, string> = {
  'H3975-004': 'Wellcare Dual Access Open (PPO)',
  'H3975-001': 'Wellcare No Premium Open (PPO)',
  'H9730-011': 'Wellcare All Dual Assure (HMO D-SNP)',
  'H9730-003': 'Wellcare Dual Access (HMO D-SNP)',
  'S4802-150': 'WellCare Value Script (PDP)',
  'S4802-161': 'WellCare Value Script (PDP)',
};

export function repairWellCarePlanName(
  planName: string | null | undefined,
  cmsContract: string | null | undefined,
  planNumber: string | null | undefined
): string | null {
  if (!planName) return null;
  if (!cmsContract || !planNumber) return planName;
  const key = `${cmsContract.trim()}-${planNumber.trim().padStart(3, '0')}`;
  return WELLCARE_PLAN_NAMES[key] || planName;
}
