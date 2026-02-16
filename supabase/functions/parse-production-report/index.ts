/**
 * Parse Production Report Edge Function
 *
 * Processes carrier production reports (CSV/XLSX) and imports client/policy data.
 * Currently supports: Aetna, WellCare, Humana
 *
 * Input:
 *   - file: Base64 encoded file content (CSV or XLSX)
 *   - carrier_code: 'aetna', 'wellcare', 'humana'
 *   - profile_id: Agent's profile ID
 *   - file_type: 'csv' or 'xlsx' (optional, auto-detected if not provided)
 *
 * Output:
 *   - success: boolean
 *   - upload_id: UUID of the production_uploads record
 *   - stats: { total, imported, updated, skipped }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { getCorsHeaders, handleCorsOptions, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";
import { createSupabaseAdmin, getErrorMessage } from "../_shared/auth.ts";
import {
  loadClientCache,
  findExistingClient,
  upsertClient,
  upsertPolicy as sharedUpsertPolicy,
  type ParsedClientRow,
  type ParsedPolicyRow,
  type BatchClientCache,
} from '../_shared/clientDedup.ts';

// ============================================================================
// TYPES
// ============================================================================

interface ParseRequest {
  file: string; // Base64 encoded file (CSV or XLSX)
  carrier_code: string;
  profile_id: string;
  file_type?: 'csv' | 'xlsx'; // Optional, auto-detected if not provided
}

interface ParsedRow {
  medicare_number: string | null; // null for Humana (uses name+DOB matching)
  first_name: string | null;
  last_name: string | null;
  middle_initial: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  effective_date: string | null;
  term_date: string | null;
  status: 'active' | 'termed';
  plan_name: string | null;
  carrier_member_id: string | null;
}

interface Stats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

// ============================================================================
// PLAN TYPE DERIVATION
// ============================================================================

/**
 * Derive plan_type from plan_name string.
 * Used to categorize policies for commission calculations.
 */
function derivePlanType(planName: string | null): 'MA' | 'PDP' | 'MEDIGAP' | 'OTHER' {
  if (!planName) return 'OTHER';
  const name = planName.toLowerCase();

  if (name.includes('pdp') || name.includes('part d') || name.includes('prescription')) {
    return 'PDP';
  }
  if (name.includes('plan g') || name.includes('plan f') || name.includes('plan n') ||
      name.includes('medigap') || name.includes('supplement') ||
      name.includes('modernized') || name.includes('innovative')) {
    return 'MEDIGAP';
  }
  if (name.includes('hmo') || name.includes('ppo') || name.includes('snp') ||
      name.includes('ma ') || name.startsWith('ma ') || name.includes('medicare advantage')) {
    return 'MA';
  }
  return 'OTHER';
}

// ============================================================================
// CSV PARSING UTILITIES
// ============================================================================

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content: string): Record<string, string>[] {
  // Handle all line ending styles: \r\n (Windows), \n (Unix), \r (old Mac/some exports)
  const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = (values[index] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Detect file type from magic bytes
 * XLSX files start with PK (ZIP format): 0x50 0x4B
 */
function detectFileType(bytes: Uint8Array): 'csv' | 'xlsx' {
  // Check for ZIP/XLSX magic bytes (PK)
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B) {
    return 'xlsx';
  }
  return 'csv';
}

/**
 * Parse XLSX file content into array of objects
 */
function parseXLSX(bytes: Uint8Array): Record<string, string>[] {
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw values (strings)
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

  // Convert all values to strings for consistency with CSV parsing
  return rawRows.map(row => {
    const stringRow: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      stringRow[key] = value !== null && value !== undefined ? String(value) : '';
    }
    return stringRow;
  });
}

/**
 * Clean and normalize a date string to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Handle the "3000-01-01" placeholder for no term date
  if (dateStr === '3000-01-01') return null;

  // Try to parse various date formats
  const cleaned = dateStr.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // MM/DD/YYYY format
  const mdyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // MM-DD-YYYY format
  const mdyDashMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyDashMatch) {
    const [, month, day, year] = mdyDashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  console.warn(`Could not parse date: ${dateStr}`);
  return null;
}

/**
 * Clean phone number to just digits
 */
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

/**
 * Convert ALL CAPS string to Title Case
 * "DARRYL" -> "Darryl", "MORGAN JR" -> "Morgan Jr"
 */
function toTitleCase(str: string | undefined): string | null {
  if (!str || str.trim() === '') return null;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse "Last, First Middle" name format into first and last name
 * Examples:
 * - "Anderson, Fred" → { first: "Fred", last: "Anderson" }
 * - "Barnes, Crystal D" → { first: "Crystal", last: "Barnes" }
 * - "Baber, Michelle D" → { first: "Michelle", last: "Baber" }
 */
function parseLastFirstName(name: string | undefined): { first: string | null; last: string | null } {
  if (!name || name.trim() === '') return { first: null, last: null };

  // Remove surrounding quotes if present
  const cleaned = name.replace(/^"|"$/g, '').trim();

  // Split on comma
  const parts = cleaned.split(',').map(p => p.trim());
  if (parts.length < 2) {
    // No comma - try to use as-is or return null
    return { first: null, last: toTitleCase(cleaned) };
  }

  const lastName = parts[0];
  // First name might include middle initial (e.g., "Crystal D")
  const firstParts = parts[1].split(' ');
  const firstName = firstParts[0]; // Take just the first name, ignore middle

  return {
    first: toTitleCase(firstName),
    last: toTitleCase(lastName),
  };
}

// ============================================================================
// AETNA PARSER
// ============================================================================

/**
 * Parse Aetna production report CSV
 *
 * Expected columns:
 * - Medicare Number (MBI)
 * - First Name, Last Name, Middle Initial
 * - Date of Birth
 * - Phone Number
 * - Address Line 1, City, State, Zip Code
 * - Coverage Effective Date
 * - Term Date
 * - Member Status ('A' = active, 'T' = termed)
 * - Plan Name
 * - Member ID (carrier's internal ID)
 */
function parseAetnaReport(rows: Record<string, string>[]): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  for (const row of rows) {
    const memberStatus = row['Member Status']?.toUpperCase();

    // Skip rows without valid status
    if (memberStatus !== 'A' && memberStatus !== 'T') {
      continue;
    }

    const medicareNumber = row['Medicare Number']?.trim();
    if (!medicareNumber) {
      console.warn('Skipping row without Medicare Number');
      continue;
    }

    parsed.push({
      medicare_number: medicareNumber,
      first_name: row['First Name'] || null,
      last_name: row['Last Name'] || null,
      middle_initial: row['Middle Initial'] || null,
      date_of_birth: normalizeDate(row['Date of Birth']),
      phone: normalizePhone(row['Phone Number']),
      email: null,
      address_line1: row['Address Line 1'] || null,
      address_city: row['City'] || null,
      address_state: row['State'] || null,
      address_zip: row['Zip Code'] || null,
      effective_date: normalizeDate(row['Coverage Effective Date']),
      term_date: normalizeDate(row['Term Date']),
      status: memberStatus === 'A' ? 'active' : 'termed',
      plan_name: row['Plan Name'] || null,
      carrier_member_id: row['Member ID'] || null,
    });
  }

  return parsed;
}

// ============================================================================
// WELLCARE (CENTENE) PARSER
// ============================================================================

/**
 * Parse WellCare/Centene production report CSV
 *
 * Expected columns:
 * - MBI (Medicare Beneficiary Identifier)
 * - Centene ID (carrier's internal ID)
 * - Member First Name, Member Last Name (ALL CAPS)
 * - Member DoB (MM/DD/YYYY)
 * - Phone
 * - Address, City, State, Zip (Address has quotes)
 * - Effective Date (MM/DD/YYYY)
 * - Termination Date (empty = active, has date = termed)
 * - Plan Name
 */
function parseWellCareReport(rows: Record<string, string>[]): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  for (const row of rows) {
    const medicareNumber = row['MBI']?.trim();
    if (!medicareNumber) {
      console.warn('Skipping row without MBI');
      continue;
    }

    // Status logic: If Termination Date is empty -> active, otherwise -> termed
    const termDateRaw = row['Termination Date']?.trim();
    const hasTermDate = termDateRaw && termDateRaw !== '';
    const status = hasTermDate ? 'termed' : 'active';

    // Clean address - remove surrounding quotes and trailing spaces
    const addressRaw = row['Address'] || '';
    const address = addressRaw.replace(/^"|"$/g, '').trim();

    // Clean city - remove surrounding quotes
    const cityRaw = row['City'] || '';
    const city = cityRaw.replace(/^"|"$/g, '').trim();

    parsed.push({
      medicare_number: medicareNumber,
      first_name: toTitleCase(row['Member First Name']),
      last_name: toTitleCase(row['Member Last Name']),
      middle_initial: null, // WellCare doesn't provide middle initial
      date_of_birth: normalizeDate(row['Member DoB']),
      phone: normalizePhone(row['Phone']),
      email: null,
      address_line1: address || null,
      address_city: city || null,
      address_state: row['State']?.trim() || null,
      address_zip: row['Zip']?.trim() || null,
      effective_date: normalizeDate(row['Effective Date']),
      term_date: hasTermDate ? normalizeDate(termDateRaw) : null,
      status,
      plan_name: row['Plan Name'] || null,
      carrier_member_id: row['Centene ID'] || null,
    });
  }

  return parsed;
}

// ============================================================================
// HUMANA PARSER
// ============================================================================

/**
 * Parse Humana production report XLSX
 *
 * Key difference: Humana has NO Medicare number - uses name+DOB for dedup
 *
 * Expected columns:
 * - MbrFirstName, MbrLastName, MbrMiddleInit (ALL CAPS)
 * - Birth Date (M/D/YYYY - no leading zeros)
 * - Phone, Email ("Unavailable" = null)
 * - Effective Date, Inactive Date (M/D/YYYY)
 * - Status ("Active Policy", "Future Active Policy" → active, "Inactive Policy" → termed)
 * - Plan Type + SalesProduct (combine for plan_name)
 * - Humana ID (carrier_member_id)
 */
function parseHumanaReport(rows: Record<string, string>[]): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  for (const row of rows) {
    const status = row['Status']?.trim();

    // Skip rows without valid status or cancelled/in-progress applications
    if (!status) continue;
    if (status === 'Cancelled Application' || status === 'In Progress Application') {
      continue;
    }

    // Only process Active Policy, Future Active Policy, or Inactive Policy
    if (status !== 'Active Policy' && status !== 'Future Active Policy' && status !== 'Inactive Policy') {
      continue;
    }

    const firstName = row['MbrFirstName']?.trim();
    const lastName = row['MbrLastName']?.trim();

    // Skip rows without name (required for dedup since no Medicare number)
    if (!firstName || !lastName) {
      console.warn('Skipping row without name');
      continue;
    }

    // Clean phone and email - "Unavailable" means null
    const phoneRaw = row['Phone']?.trim();
    const phone = phoneRaw && phoneRaw !== 'Unavailable' ? normalizePhone(phoneRaw) : null;

    const emailRaw = row['Email']?.trim();
    const email = emailRaw && emailRaw !== 'Unavailable' ? emailRaw : null;

    // Combine Plan Type and SalesProduct for plan name
    const planType = row['Plan Type']?.trim() || '';
    const salesProduct = row['SalesProduct']?.trim() || '';
    const planName = [planType, salesProduct].filter(Boolean).join(' ') || null;

    // Map status
    const mappedStatus = status === 'Inactive Policy' ? 'termed' : 'active';

    parsed.push({
      medicare_number: null, // Humana doesn't provide Medicare number
      first_name: toTitleCase(firstName),
      last_name: toTitleCase(lastName),
      middle_initial: row['MbrMiddleInit']?.trim() || null,
      date_of_birth: normalizeDate(row['Birth Date']),
      phone,
      email,
      address_line1: null, // Humana doesn't provide address in this report
      address_city: null,
      address_state: null,
      address_zip: null,
      effective_date: normalizeDate(row['Effective Date']),
      term_date: normalizeDate(row['Inactive Date']),
      status: mappedStatus,
      plan_name: planName,
      carrier_member_id: row['Humana ID']?.trim() || null,
    });
  }

  return parsed;
}

// ============================================================================
// ANTHEM PARSER
// ============================================================================

/**
 * Parse Anthem production report CSV
 *
 * Key differences:
 * - NO Medicare number, NO DOB - dedup by name only
 * - Filter for Market = "Senior" only
 * - First row is a comment line (handled in main flow)
 * - Name is "Last, First Middle" format
 *
 * Expected columns:
 * - Client Name: "Last, First M" format
 * - Client ID: carrier_member_id
 * - Market: filter for "Senior" only
 * - State: address_state
 * - Effective Date: YYYY-MM-DD
 * - Cancellation Date: YYYY-MM-DD (9999-12-31 = active)
 * - Status: "Active" or "Future Disenrollment" → active, "Inactive" → termed
 * - Plan Name
 */
function parseAnthemReport(rows: Record<string, string>[]): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  for (const row of rows) {
    // Filter for Senior market only
    const market = row['Market']?.trim();
    if (market !== 'Senior') {
      continue;
    }

    const clientId = row['Client ID']?.trim();
    const clientName = row['Client Name'];

    // Skip rows without required fields
    if (!clientId || !clientName) {
      continue;
    }

    // Parse name from "Last, First Middle" format
    const { first: firstName, last: lastName } = parseLastFirstName(clientName);
    if (!firstName || !lastName) {
      console.warn(`Skipping row with unparseable name: ${clientName}`);
      continue;
    }

    // Map status
    const status = row['Status']?.trim();
    let mappedStatus: 'active' | 'termed' = 'active';
    if (status === 'Inactive') {
      mappedStatus = 'termed';
    } else if (status === 'Active' || status === 'Future Disenrollment') {
      mappedStatus = 'active';
    } else {
      // Unknown status - skip
      continue;
    }

    // Handle cancellation date - 9999-12-31 means no term date
    const cancelDate = row['Cancellation Date']?.trim();
    const termDate = cancelDate && cancelDate !== '9999-12-31' ? normalizeDate(cancelDate) : null;

    parsed.push({
      medicare_number: null, // Anthem doesn't provide Medicare number
      first_name: firstName,
      last_name: lastName,
      middle_initial: null,
      date_of_birth: null, // Anthem doesn't provide DOB
      phone: null, // Not in this report
      email: null,
      address_line1: null,
      address_city: null,
      address_state: row['State']?.trim() || null,
      address_zip: null,
      effective_date: normalizeDate(row['Effective Date']),
      term_date: termDate,
      status: mappedStatus,
      plan_name: row['Plan Name']?.trim() || null,
      carrier_member_id: clientId,
    });
  }

  return parsed;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// REPLACED: Old findOrCreateClient with sequential DB queries
// Now uses shared dedup service with batch pre-loaded cache
async function findOrCreateClient(
  supabase: SupabaseClient,
  profileId: string,
  row: ParsedRow,
  carrierId: string,
  cache: BatchClientCache
): Promise<{ clientId: string; isNew: boolean }> {
  // Map the existing ParsedRow format to ParsedClientRow
  const parsedRow: ParsedClientRow = {
    first_name: row.first_name ?? undefined,
    last_name: row.last_name ?? undefined,
    middle_initial: row.middle_initial ?? undefined,
    date_of_birth: row.date_of_birth ?? undefined,
    medicare_number: row.medicare_number ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address_line1: row.address_line1 ?? undefined,
    address_city: row.address_city ?? undefined,
    address_state: row.address_state ?? undefined,
    address_zip: row.address_zip ?? undefined,
  };

  // Find match using in-memory cache
  const matchResult = findExistingClient(cache, parsedRow);

  // Upsert with manual edit protection
  return await upsertClient(
    supabase, profileId, parsedRow, matchResult,
    'SMART_SYNC', cache, undefined  // no importBatchId for Smart Sync
  );
}

// REPLACED: Old inline upsertPolicy
// Now uses shared dedup service with updated unique constraint (client_id, carrier_id, plan_type)
async function upsertPolicyLocal(
  supabase: SupabaseClient,
  clientId: string,
  carrierId: string,
  profileId: string,
  uploadId: string,
  row: ParsedRow
): Promise<{ isNew: boolean }> {
  const policyRow: ParsedPolicyRow = {
    carrier_member_id: row.carrier_member_id ?? undefined,
    plan_name: row.plan_name ?? undefined,
    plan_type: derivePlanType(row.plan_name),
    effective_date: row.effective_date ?? undefined,
    term_date: row.term_date ?? undefined,
  };

  return await sharedUpsertPolicy(
    supabase, clientId, carrierId, profileId, policyRow, uploadId
  );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const supabase = createSupabaseAdmin();

  try {
    // Validate request method
    if (req.method !== "POST") {
      return corsErrorResponse(req, "Method not allowed", 405);
    }

    // Check authorization - allow service role or authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return corsErrorResponse(req, "No authorization header", 401);
    }

    // Extract token and check if it's the service role key
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // If not service role, validate as user token via Supabase auth
    let authenticatedUser: { id: string } | null = null;
    if (!isServiceRole) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return corsErrorResponse(req, "Unauthorized", 401);
      }
      authenticatedUser = user;
    }

    // Parse request body
    const body: ParseRequest = await req.json();
    const { file, carrier_code, profile_id } = body;

    // Validate required fields
    if (!file) {
      return corsErrorResponse(req, "Missing required field: file", 400);
    }
    if (!carrier_code) {
      return corsErrorResponse(req, "Missing required field: carrier_code", 400);
    }
    if (!profile_id) {
      return corsErrorResponse(req, "Missing required field: profile_id", 400);
    }

    // Look up carrier
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('id, code, name')
      .eq('code', carrier_code)
      .single();

    if (carrierError || !carrier) {
      return corsErrorResponse(req, `Unknown carrier: ${carrier_code}`, 400);
    }

    // For service role, use the profile_id as the uploader
    // For user tokens, look up their profile
    let uploaderId: string | null = null;
    if (isServiceRole) {
      uploaderId = profile_id; // Use the target profile as uploader for service role
    } else if (authenticatedUser) {
      const { data: uploaderProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authenticatedUser.id)
        .single();
      uploaderId = uploaderProfile?.id || null;
    }

    // Decode base64 file content
    let fileBytes: Uint8Array;
    try {
      const binaryString = atob(file);
      fileBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBytes[i] = binaryString.charCodeAt(i);
      }
    } catch {
      return corsErrorResponse(req, "Invalid base64 file content", 400);
    }

    // Determine file type - check for XLSX magic bytes or use provided file_type
    const file_type = body.file_type || detectFileType(fileBytes);
    const fileExtension = file_type === 'xlsx' ? 'xlsx' : 'csv';

    // Create production_uploads record
    const { data: upload, error: uploadError } = await supabase
      .from('production_uploads')
      .insert({
        profile_id,
        carrier_id: carrier.id,
        file_name: `${carrier_code}_production_${new Date().toISOString().split('T')[0]}.${fileExtension}`,
        status: 'processing',
      })
      .select('id')
      .single();

    if (uploadError) {
      return corsErrorResponse(req, `Failed to create upload record: ${uploadError.message}`, 500);
    }

    const uploadId = upload.id;

    try {
      // Parse file based on type
      let rawRows: Record<string, string>[];
      if (file_type === 'xlsx') {
        rawRows = parseXLSX(fileBytes);
        console.log(`Parsed ${rawRows.length} raw rows from XLSX`);
      } else {
        let csvContent = new TextDecoder().decode(fileBytes);

        // Anthem CSVs have a comment line as the first row - strip it
        if (carrier_code === 'anthem') {
          const lines = csvContent.split(/\r\n|\r|\n/);
          if (lines.length > 0 && lines[0].startsWith('List of clients')) {
            csvContent = lines.slice(1).join('\n');
            console.log('Stripped Anthem comment line');
          }
        }

        rawRows = parseCSV(csvContent);
        console.log(`Parsed ${rawRows.length} raw rows from CSV`);
      }

      // Parse based on carrier
      let parsedRows: ParsedRow[];
      switch (carrier_code) {
        case 'aetna':
          parsedRows = parseAetnaReport(rawRows);
          break;
        case 'wellcare':
          parsedRows = parseWellCareReport(rawRows);
          break;
        case 'humana':
          parsedRows = parseHumanaReport(rawRows);
          break;
        case 'anthem':
          parsedRows = parseAnthemReport(rawRows);
          break;
        default:
          throw new Error(`Unsupported carrier: ${carrier_code}`);
      }

      console.log(`Parsed ${parsedRows.length} valid rows for ${carrier_code}`);

      // Load all agent's clients into memory for batch matching
      const cache = await loadClientCache(supabase, profile_id);

      // Process each row
      const stats: Stats = {
        total: parsedRows.length,
        imported: 0,
        updated: 0,
        skipped: 0,
      };

      for (const row of parsedRows) {
        try {
          // Find or create client
          const { clientId, isNew: clientIsNew } = await findOrCreateClient(
            supabase,
            profile_id,
            row,
            carrier.id,
            cache
          );

          // Upsert policy
          const { isNew: policyIsNew } = await upsertPolicyLocal(
            supabase,
            clientId,
            carrier.id,
            profile_id,
            uploadId,
            row
          );

          if (clientIsNew || policyIsNew) {
            stats.imported++;
          } else {
            stats.updated++;
          }
        } catch (rowError) {
          console.error(`Error processing row ${row.medicare_number}: ${getErrorMessage(rowError)}`);
          stats.skipped++;
        }
      }

      // Update upload record with success - wrap in try/catch to ensure we always capture stats
      try {
        const { error: updateError } = await supabase
          .from('production_uploads')
          .update({
            status: 'complete',
            records_total: stats.total,
            records_imported: stats.imported,
            records_updated: stats.updated,
            records_skipped: stats.skipped,
            completed_at: new Date().toISOString(),
          })
          .eq('id', uploadId);

        if (updateError) {
          console.error(`Failed to update upload record: ${updateError.message}`);
        }
      } catch (updateErr) {
        console.error(`Exception updating upload record: ${getErrorMessage(updateErr)}`);
      }

      console.log(`Upload ${uploadId} complete:`, stats);

      return corsJsonResponse(req, {
        success: true,
        upload_id: uploadId,
        stats,
      });

    } catch (processError) {
      // Update upload record with error - wrap in try/catch to ensure we capture error state
      try {
        await supabase
          .from('production_uploads')
          .update({
            status: 'error',
            error_message: getErrorMessage(processError),
            completed_at: new Date().toISOString(),
          })
          .eq('id', uploadId);
      } catch (updateErr) {
        console.error(`Exception updating upload record with error: ${getErrorMessage(updateErr)}`);
      }

      throw processError;
    }

  } catch (error) {
    console.error("Error in parse-production-report:", error);
    return corsErrorResponse(
      req,
      getErrorMessage(error),
      error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
    );
  }
});
