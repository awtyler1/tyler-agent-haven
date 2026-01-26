import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export interface RTSImportResult {
  matched: number;
  skipped: number;
  profiles_created: number;
  certifications_imported: number;
  carrier_statuses_updated: number;
  errors: string[];
}

export interface RTSImportOptions {
  file: File;
  uploadedByProfileId: string;
}

interface NPNProfileMap {
  [npn: string]: { profileId: string; userId: string | null };
}

interface CarrierNameMap {
  [normalizedName: string]: string; // carrier name/alias -> carrier_id
}

// Business name indicators - used to prefer human names over business names
const BUSINESS_NAME_PATTERNS = [
  /\bllc\b/i,
  /\binc\b/i,
  /\bagency\b/i,
  /\binsurance\b/i,
  /\bservices\b/i,
  /\bgroup\b/i,
  /\bcorp\b/i,
  /\bcompany\b/i,
];

/**
 * Check if a name looks like a business name rather than a person's name
 */
function isBusinessName(name: string): boolean {
  if (!name) return true;
  return BUSINESS_NAME_PATTERNS.some(pattern => pattern.test(name));
}

/**
 * Select the best name from a list of names for the same NPN
 * Prefers human names over business names
 */
function selectBestName(names: string[]): string {
  if (names.length === 0) return 'Unknown Agent';
  if (names.length === 1) return names[0];

  // Filter to human names (non-business)
  const humanNames = names.filter(name => !isBusinessName(name));

  // If we found human names, return the first one
  if (humanNames.length > 0) {
    return humanNames[0];
  }

  // Fall back to first name in list
  return names[0];
}

/**
 * Parse column header to extract carrier name and product type
 * Format: "Carrier: Product" (e.g., "Aetna: MA", "Humana: PDP")
 */
function parseColumnHeader(header: string): { carrier: string; product: string } | null {
  if (!header || typeof header !== 'string') return null;

  const parts = header.split(':').map(s => s.trim());
  if (parts.length !== 2) return null;

  const [carrier, product] = parts;
  if (!carrier || !product) return null;

  // Validate product type matches our enum
  const validProducts = ['MA', 'PDP', 'MEDIGAP', 'ALL_ANCILLARY', 'MAPD'];
  if (!validProducts.includes(product.toUpperCase())) return null;

  return { carrier, product: product.toUpperCase() };
}

/**
 * Build a lookup map of NPN -> { profileId, userId }
 * Queries profiles table directly by npn column
 */
async function buildNPNProfileMap(): Promise<NPNProfileMap> {
  // Get all profiles with NPNs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, npn')
    .not('npn', 'is', null);

  if (profileError) {
    throw new Error(`Failed to fetch profiles: ${profileError.message}`);
  }

  // Build NPN -> { profileId, userId } map
  const map: NPNProfileMap = {};
  for (const profile of profiles || []) {
    if (profile.npn) {
      // Normalize NPN - remove any non-numeric characters
      const normalizedNPN = profile.npn.replace(/\D/g, '');
      if (normalizedNPN) {
        map[normalizedNPN] = {
          profileId: profile.id,
          userId: profile.user_id, // May be null for imported agents
        };
      }
    }
  }

  return map;
}

/**
 * Build a lookup map of carrier name/alias -> carrier_id
 * Matches RTS column names to carriers table using name and rts_aliases
 */
async function buildCarrierNameMap(): Promise<CarrierNameMap> {
  const { data: carriers, error } = await supabase
    .from('carriers')
    .select('id, name, rts_aliases');

  if (error) {
    throw new Error(`Failed to fetch carriers: ${error.message}`);
  }

  const map: CarrierNameMap = {};
  for (const carrier of carriers || []) {
    // Add the carrier's own name (lowercased for matching)
    map[carrier.name.toLowerCase()] = carrier.id;

    // Add all aliases
    const aliases = (carrier.rts_aliases as string[]) || [];
    for (const alias of aliases) {
      if (alias) {
        map[alias.toLowerCase()] = carrier.id;
      }
    }
  }

  return map;
}

/**
 * Pre-process RTS rows to build NPN -> best name mapping
 * Handles duplicate NPN rows by selecting human names over business names
 */
function buildNPNNameMap(dataRows: unknown[][]): Map<string, string> {
  const npnNames = new Map<string, string[]>();

  for (const row of dataRows) {
    const npnRaw = row[3];
    const nameRaw = row[0];

    if (!npnRaw) continue;

    const npn = String(npnRaw).replace(/\D/g, '');
    if (!npn) continue;

    const name = nameRaw ? String(nameRaw).trim() : '';
    if (!name) continue;

    // Collect all names for this NPN
    const existing = npnNames.get(npn) || [];
    if (!existing.includes(name)) {
      existing.push(name);
    }
    npnNames.set(npn, existing);
  }

  // Select best name for each NPN
  const bestNames = new Map<string, string>();
  for (const [npn, names] of npnNames) {
    bestNames.set(npn, selectBestName(names));
  }

  return bestNames;
}

/**
 * Create stub profiles for NPNs not found in the system
 * Returns count of profiles created and updates the npnMap in place
 */
async function createMissingProfiles(
  unmatchedNPNs: Set<string>,
  npnNameMap: Map<string, string>,
  npnMap: NPNProfileMap,
  result: RTSImportResult
): Promise<number> {
  if (unmatchedNPNs.size === 0) return 0;

  let profilesCreated = 0;
  const profilesToCreate: TablesInsert<'profiles'>[] = [];

  for (const npn of unmatchedNPNs) {
    const fullName = npnNameMap.get(npn) || 'Unknown Agent';
    profilesToCreate.push({
      npn,
      full_name: fullName,
      email: null,
      manager_id: null,
      onboarding_status: 'CONTRACTING_REQUIRED',
      is_active: true,
    });
  }

  // Process in batches of 500
  const batchSize = 500;
  for (let i = 0; i < profilesToCreate.length; i += batchSize) {
    const batch = profilesToCreate.slice(i, i + batchSize);

    const { data: createdProfiles, error } = await supabase
      .from('profiles')
      .insert(batch)
      .select('id, npn');

    if (error) {
      console.error('Profile creation failed:', JSON.stringify(error, null, 2));
      result.errors.push(`Profile creation error: ${error.message}`);
      continue;
    }

    // Update npnMap with newly created profiles
    for (const profile of createdProfiles || []) {
      if (profile.npn) {
        const normalizedNPN = profile.npn.replace(/\D/g, '');
        npnMap[normalizedNPN] = {
          profileId: profile.id,
          userId: null, // New profiles don't have auth users
        };
        profilesCreated++;
      }
    }
  }

  return profilesCreated;
}

/**
 * Import RTS certifications from Pinnacle Excel spreadsheet
 * Creates profiles for unmatched NPNs, then updates certifications and carrier statuses
 */
export async function importRTSCertifications(options: RTSImportOptions): Promise<RTSImportResult> {
  const { file, uploadedByProfileId } = options;

  const result: RTSImportResult = {
    matched: 0,
    skipped: 0,
    profiles_created: 0,
    certifications_imported: 0,
    carrier_statuses_updated: 0,
    errors: [],
  };

  // Determine current cert year based on date
  // Oct-Dec: next year (AEP selling period)
  // Jan-Sept: current year
  const now = new Date();
  const currentCertYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

  // Dynamic import - XLSX is only loaded when import is triggered
  const XLSX = await import('xlsx');

  // Read Excel file
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Get "Certs" sheet
  const sheet = workbook.Sheets['Certs'];
  if (!sheet) {
    throw new Error('Sheet "Certs" not found in Excel file');
  }

  // Convert to JSON with headers
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });
  if (rawData.length < 2) {
    throw new Error('Sheet "Certs" has no data rows');
  }

  // First row is headers
  const headers = rawData[0] as string[];
  const dataRows = rawData.slice(1) as unknown[][];

  // Build lookup maps
  const npnMap = await buildNPNProfileMap();
  const carrierNameMap = await buildCarrierNameMap();

  // Parse certification columns (E through end, index 4+)
  const certColumns: { index: number; carrier: string; product: string }[] = [];
  for (let i = 4; i < headers.length && i <= 54; i++) {
    const parsed = parseColumnHeader(headers[i]);
    if (parsed) {
      certColumns.push({ index: i, carrier: parsed.carrier, product: parsed.product });
    }
  }

  if (certColumns.length === 0) {
    throw new Error('No valid certification columns found in headers');
  }

  // ========================================
  // PHASE 1: Identify unmatched NPNs and build name map
  // ========================================
  const npnNameMap = buildNPNNameMap(dataRows);
  const unmatchedNPNs = new Set<string>();

  for (const row of dataRows) {
    const npnRaw = row[3];
    if (!npnRaw) continue;

    const npn = String(npnRaw).replace(/\D/g, '');
    if (!npn) continue;

    // Check if this NPN exists in our system
    if (!npnMap[npn]) {
      unmatchedNPNs.add(npn);
    }
  }

  // ========================================
  // PHASE 2: Create profiles for unmatched NPNs
  // ========================================
  if (unmatchedNPNs.size > 0) {
    result.profiles_created = await createMissingProfiles(
      unmatchedNPNs,
      npnNameMap,
      npnMap,
      result
    );
  }

  // ========================================
  // PHASE 3: Process certifications (now all NPNs should have profiles)
  // ========================================
  const certificationsToUpsert: TablesInsert<'agent_certifications'>[] = [];
  const carrierStatusesToUpdate = new Map<string, { profileId: string; userId: string | null; carrierId: string }>();
  const processedNPNs = new Set<string>();

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];

    try {
      // Column D (index 3) is NPN
      const npnRaw = row[3];
      if (!npnRaw) {
        continue; // Skip rows without NPN (don't count as skipped since no NPN to match)
      }

      // Normalize NPN
      const npn = String(npnRaw).replace(/\D/g, '');
      if (!npn) {
        continue;
      }

      // Look up profile
      const profileData = npnMap[npn];
      if (!profileData) {
        // This shouldn't happen after profile creation, but handle gracefully
        result.skipped++;
        continue;
      }

      const { profileId, userId } = profileData;

      // Count unique NPNs as matched (avoid double-counting duplicate rows)
      if (!processedNPNs.has(npn)) {
        processedNPNs.add(npn);
        result.matched++;
      }

      // Process each certification column
      for (const col of certColumns) {
        const yearValue = row[col.index];
        const year = typeof yearValue === 'number' ? yearValue : parseInt(String(yearValue || '0'), 10);

        // Only import if we have a valid year value (current year ± 1, or 0)
        if ((year >= currentCertYear - 1 && year <= currentCertYear + 1) || year === 0) {
          certificationsToUpsert.push({
            profile_id: profileId,
            carrier_name: col.carrier,
            product_type: col.product,
            certification_year: year,
          });

          // For current year certifications (RTS), also track carrier_status to update
          if (year === currentCertYear) {
            const carrierId = carrierNameMap[col.carrier.toLowerCase()];
            if (carrierId) {
              const key = `${profileId}:${carrierId}`;
              if (!carrierStatusesToUpdate.has(key)) {
                carrierStatusesToUpdate.set(key, { profileId, userId, carrierId });
              }
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Row ${rowIndex + 2}: ${message}`);
    }
  }

  // ========================================
  // PHASE 4: Batch upsert certifications
  // ========================================
  if (certificationsToUpsert.length > 0) {
    // Dedupe certifications by composite key (RTS report may have duplicate rows)
    const certMap = new Map<string, (typeof certificationsToUpsert)[0]>();
    for (const cert of certificationsToUpsert) {
      const key = `${cert.profile_id}:${cert.carrier_name}:${cert.product_type}`;
      // Keep first occurrence (or could use last - doesn't matter for same data)
      if (!certMap.has(key)) {
        certMap.set(key, cert);
      }
    }
    const dedupedCerts = Array.from(certMap.values());

    // Process in batches of 500 to avoid hitting limits
    const batchSize = 500;
    for (let i = 0; i < dedupedCerts.length; i += batchSize) {
      const batch = dedupedCerts.slice(i, i + batchSize);

      const { error } = await supabase
        .from('agent_certifications')
        .upsert(batch, {
          onConflict: 'profile_id,carrier_name,product_type',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Certification upsert error: ${error.message}`);
      } else {
        result.certifications_imported += batch.length;
      }
    }
  }

  // ========================================
  // PHASE 5: Batch upsert carrier_statuses for RTS agents
  // ========================================
  if (carrierStatusesToUpdate.size > 0) {
    const statusUpdates = Array.from(carrierStatusesToUpdate.values()).map(({ profileId, userId, carrierId }) => ({
      profile_id: profileId,
      user_id: userId,  // May be null for imported agents
      carrier_id: carrierId,
      contracting_status: 'contracted' as const,
      contracted_at: new Date().toISOString(),
    }));

    // Dedupe carrier statuses by composite key (safety check)
    const statusMap = new Map<string, (typeof statusUpdates)[0]>();
    for (const status of statusUpdates) {
      const key = `${status.profile_id}:${status.carrier_id}`;
      if (!statusMap.has(key)) {
        statusMap.set(key, status);
      }
    }
    const dedupedStatuses = Array.from(statusMap.values());

    // Process in batches
    const batchSize = 500;
    for (let i = 0; i < dedupedStatuses.length; i += batchSize) {
      const batch = dedupedStatuses.slice(i, i + batchSize);

      const { error } = await supabase
        .from('carrier_statuses')
        .upsert(batch, {
          onConflict: 'profile_id,carrier_id',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Carrier status upsert error: ${error.message}`);
      } else {
        result.carrier_statuses_updated += batch.length;
      }
    }
  }

  // ========================================
  // PHASE 6: Log the import
  // ========================================
  await supabase.from('rts_import_logs').insert({
    uploaded_by: uploadedByProfileId,
    file_name: file.name,
    agents_matched: result.matched,
    agents_skipped: result.skipped,
    profiles_created: result.profiles_created,
    certifications_imported: result.certifications_imported,
  });

  return result;
}
