import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export interface RTSImportResult {
  matched: number;
  skipped: number;
  certifications_imported: number;
  errors: string[];
}

export interface RTSImportOptions {
  file: File;
  uploadedByProfileId: string;
}

interface NPNProfileMap {
  [npn: string]: string; // npn -> profile_id
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
 * Build a lookup map of NPN -> profile_id
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

  // Build user_id -> profile_id map
  const userToProfile: Record<string, string> = {};
  for (const profile of profiles || []) {
    userToProfile[profile.user_id] = profile.id;
  }

  // Build NPN -> profile_id map
  const map: NPNProfileMap = {};
  for (const app of applications || []) {
    if (app.npn_number && app.user_id) {
      const profileId = userToProfile[app.user_id];
      if (profileId) {
        // Normalize NPN - remove any non-numeric characters
        const normalizedNPN = app.npn_number.replace(/\D/g, '');
        map[normalizedNPN] = profileId;
      }
    }
  }

  return map;
}

/**
 * Import RTS certifications from Pinnacle Excel spreadsheet
 */
export async function importRTSCertifications(options: RTSImportOptions): Promise<RTSImportResult> {
  const { file, uploadedByProfileId } = options;

  const result: RTSImportResult = {
    matched: 0,
    skipped: 0,
    certifications_imported: 0,
    errors: [],
  };

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

  // Build NPN -> profile_id lookup
  const npnMap = await buildNPNProfileMap();

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
      const profileId = npnMap[npn];
      if (!profileId) {
        result.skipped++;
        continue;
      }

      result.matched++;

      // Process each certification column
      for (const col of certColumns) {
        const yearValue = row[col.index];
        const year = typeof yearValue === 'number' ? yearValue : parseInt(String(yearValue || '0'), 10);

        // Only import if we have a valid year value
        if (year === 2025 || year === 2026 || year === 0) {
          certificationsToUpsert.push({
            profile_id: profileId,
            carrier_name: col.carrier,
            product_type: col.product,
            certification_year: year,
          });
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
        result.errors.push(`Batch upsert error: ${error.message}`);
      } else {
        result.certifications_imported += batch.length;
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
