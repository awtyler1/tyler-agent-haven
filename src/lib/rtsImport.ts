import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export interface RTSImportResult {
  matched: number;
  skipped: number;
  certifications_imported: number;
  carrier_statuses_updated: number;
  errors: string[];
}

export interface RTSImportOptions {
  file: File;
  uploadedByProfileId: string;
}

interface NPNProfileMap {
  [npn: string]: { profileId: string; userId: string };
}

interface CarrierNameMap {
  [normalizedName: string]: string; // carrier name/alias -> carrier_id
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
 */
async function buildNPNProfileMap(): Promise<NPNProfileMap> {
  // Get all contracting applications with NPNs
  const { data: applications, error: appError } = await supabase
    .from('contracting_applications')
    .select('npn_number, user_id')
    .not('npn_number', 'is', null);

  if (appError) {
    throw new Error(`Failed to fetch contracting applications: ${appError.message}`);
  }

  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id');

  if (profileError) {
    throw new Error(`Failed to fetch profiles: ${profileError.message}`);
  }

  // Build user_id -> { profileId, userId } map
  const userToProfile: Record<string, { profileId: string; userId: string }> = {};
  for (const profile of profiles || []) {
    userToProfile[profile.user_id] = {
      profileId: profile.id,
      userId: profile.user_id,
    };
  }

  // Build NPN -> { profileId, userId } map
  const map: NPNProfileMap = {};
  for (const app of applications || []) {
    if (app.npn_number && app.user_id) {
      const profileData = userToProfile[app.user_id];
      if (profileData) {
        // Normalize NPN - remove any non-numeric characters
        const normalizedNPN = app.npn_number.replace(/\D/g, '');
        map[normalizedNPN] = profileData;
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
 * Import RTS certifications from Pinnacle Excel spreadsheet
 * Updates both agent_certifications and carrier_statuses tables
 */
export async function importRTSCertifications(options: RTSImportOptions): Promise<RTSImportResult> {
  const { file, uploadedByProfileId } = options;

  const result: RTSImportResult = {
    matched: 0,
    skipped: 0,
    certifications_imported: 0,
    carrier_statuses_updated: 0,
    errors: [],
  };

  // Determine current cert year based on date
  // Oct-Dec: next year (AEP selling period)
  // Jan-Sept: current year
  const now = new Date();
  const currentCertYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

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
  const dataRows = rawData.slice(1);

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

  // Process each data row
  const certificationsToUpsert: TablesInsert<'agent_certifications'>[] = [];

  // Track carrier statuses to update: Map<"userId:carrierId", { userId, carrierId }>
  const carrierStatusesToUpdate = new Map<string, { userId: string; carrierId: string }>();

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex] as unknown[];

    try {
      // Column D (index 3) is NPN
      const npnRaw = row[3];
      if (!npnRaw) {
        result.skipped++;
        continue;
      }

      // Normalize NPN
      const npn = String(npnRaw).replace(/\D/g, '');
      if (!npn) {
        result.skipped++;
        continue;
      }

      // Look up profile
      const profileData = npnMap[npn];
      if (!profileData) {
        result.skipped++;
        continue;
      }

      const { profileId, userId } = profileData;
      result.matched++;

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
              const key = `${userId}:${carrierId}`;
              if (!carrierStatusesToUpdate.has(key)) {
                carrierStatusesToUpdate.set(key, { userId, carrierId });
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

  // Batch upsert certifications
  if (certificationsToUpsert.length > 0) {
    // Process in batches of 500 to avoid hitting limits
    const batchSize = 500;
    for (let i = 0; i < certificationsToUpsert.length; i += batchSize) {
      const batch = certificationsToUpsert.slice(i, i + batchSize);

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

  // Batch upsert carrier_statuses for RTS agents
  if (carrierStatusesToUpdate.size > 0) {
    const statusUpdates = Array.from(carrierStatusesToUpdate.values()).map(({ userId, carrierId }) => ({
      user_id: userId,
      carrier_id: carrierId,
      contracting_status: 'contracted' as const,
      contracted_at: new Date().toISOString(),
    }));

    // Process in batches
    const batchSize = 500;
    for (let i = 0; i < statusUpdates.length; i += batchSize) {
      const batch = statusUpdates.slice(i, i + batchSize);

      const { error } = await supabase
        .from('carrier_statuses')
        .upsert(batch, {
          onConflict: 'user_id,carrier_id',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Carrier status upsert error: ${error.message}`);
      } else {
        result.carrier_statuses_updated += batch.length;
      }
    }
  }

  // Log the import
  await supabase.from('rts_import_logs').insert({
    uploaded_by: uploadedByProfileId,
    file_name: file.name,
    agents_matched: result.matched,
    agents_skipped: result.skipped,
    certifications_imported: result.certifications_imported,
  });

  return result;
}
