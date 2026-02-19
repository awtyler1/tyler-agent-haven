// supabase/functions/import-book-of-business/index.ts
//
// Book Import edge function — parse, stage, commit, cancel, and resume detection.
// Shares dedup logic with Smart Sync via _shared/clientDedup.ts.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import {
  getCorsHeaders,
  handleCorsOptions,
  corsJsonResponse,
  corsErrorResponse,
} from '../_shared/cors.ts';
import { createSupabaseAdmin, getErrorMessage } from '../_shared/auth.ts';
import {
  loadClientCache,
  findExistingClient,
  upsertClient,
  upsertPolicy,
  derivePlanType,
  splitAddressLine2,
  repairWellCarePlanName,
  type ParsedClientRow,
  type ParsedPolicyRow,
  type BatchClientCache,
} from '../_shared/clientDedup.ts';

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// CSV PARSING (same hand-rolled approach as parse-production-report)
// ============================================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Skip leading comment lines (lines without commas, e.g., Anthem date stamp)
  let headerIdx = 0;
  while (headerIdx < lines.length && !lines[headerIdx].includes(',')) {
    headerIdx++;
  }
  if (headerIdx >= lines.length) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[headerIdx]);
  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Handle overflow from unquoted commas in data (e.g., WellCare plan names)
    if (values.length > headers.length) {
      const planIdx = headers.findIndex(h => /plan.?name/i.test(h));
      if (planIdx >= 0 && planIdx < values.length) {
        const overflow = values.length - headers.length;
        const merged = values.slice(planIdx, planIdx + 1 + overflow).join(',');
        values.splice(planIdx, 1 + overflow, merged);
      }
    }

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

// ============================================================================
// XLSX PARSING (static import — same pattern as parse-production-report)
// ============================================================================

function parseXLSXFile(buffer: Uint8Array): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(jsonData[0]);
  const rows = jsonData.map((row: Record<string, unknown>) => {
    const stringRow: Record<string, string> = {};
    for (const key of headers) {
      stringRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
    }
    return stringRow;
  });

  return { headers, rows };
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

interface FormatDetectionResult {
  format: 'sunfire' | 'connecture' | 'aetna' | 'humana' | 'wellcare' | 'anthem' | 'freeform';
  detectedCarrierCode?: string;   // e.g., 'humana', 'aetna'
  detectedCarrierName?: string;   // e.g., 'Humana', 'Aetna'
  confidence: 'high' | 'medium' | 'low';
}

function detectFormat(headers: string[]): FormatDetectionResult {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const headerSet = new Set(lowerHeaders);

  // SunFire signatures
  const sunfireSignals = ['firstname', 'lastname', 'mbi', 'effectivedate', 'enrollmentcode'];
  const sunfireAlt = ['first name', 'last name', 'mbi', 'effective date'];
  const sunfirePartA = lowerHeaders.some(h => h.includes('part_a') || h.includes('part a'));

  if (sunfireSignals.filter(s => headerSet.has(s)).length >= 3 || sunfirePartA) {
    return { format: 'sunfire', confidence: 'high' };
  }
  if (sunfireAlt.filter(s => headerSet.has(s)).length >= 3) {
    return { format: 'sunfire', confidence: 'high' };
  }

  // Connecture — SearchResults export (Connect4Insurance)
  const connectureSearchSignals = ['carrier status', 'primary email address', 'agent username'];
  const connectureSearchCount = connectureSearchSignals.filter(s =>
    lowerHeaders.some(h => h === s || h.includes(s))
  ).length;
  // Connecture — legacy enrollment export
  const connectureLegacySignals = ['beneficiary id', 'plan id', 'enrollment date', 'disenrollment date'];
  const connectureLegacyCount = connectureLegacySignals.filter(s => headerSet.has(s)).length;

  if (connectureSearchCount >= 2 || connectureLegacyCount >= 2) {
    return { format: 'connecture', confidence: connectureSearchCount >= 3 ? 'high' : 'medium' };
  }

  // Aetna signatures: "Medicare Number" + "Coverage Effective Date" + "Member Status"
  const aetnaSignals = ['medicare number', 'coverage effective date', 'member status'];
  if (aetnaSignals.filter(s => headerSet.has(s)).length >= 3) {
    return { format: 'aetna', detectedCarrierCode: 'aetna', detectedCarrierName: 'Aetna', confidence: 'high' };
  }
  if (lowerHeaders.some(h => h.includes('member id')) && lowerHeaders.some(h => h.includes('plan name') || h.includes('group'))) {
    if (lowerHeaders.some(h => h.includes('aetna') || h.includes('cvs'))) {
      return { format: 'aetna', detectedCarrierCode: 'aetna', detectedCarrierName: 'Aetna', confidence: 'high' };
    }
  }

  // Humana signatures: MbrFirstName + MbrLastName + Humana ID (exact column names)
  const humanaSignals = ['mbrfirstname', 'mbrlastname', 'humana id'];
  if (humanaSignals.filter(s => headerSet.has(s)).length >= 2) {
    return { format: 'humana', detectedCarrierCode: 'humana', detectedCarrierName: 'Humana', confidence: 'high' };
  }
  const hasName = lowerHeaders.some(h => h.includes('first') && h.includes('name')) ||
                  (headerSet.has('first name') || headerSet.has('firstname'));
  const hasMBI = lowerHeaders.some(h => h.includes('mbi') || h.includes('medicare') || h.includes('beneficiary'));

  if (hasName && !hasMBI && lowerHeaders.some(h => h.includes('humana') || h.includes('member id'))) {
    return { format: 'humana', detectedCarrierCode: 'humana', detectedCarrierName: 'Humana', confidence: 'high' };
  }

  // WellCare/Centene signatures: Centene ID + Member First Name + Member DoB
  const wellcareSignals = ['centene id', 'member first name', 'member dob'];
  if (wellcareSignals.filter(s => headerSet.has(s)).length >= 2 ||
      lowerHeaders.some(h => h.includes('wellcare') || h.includes('centene'))) {
    return { format: 'wellcare', detectedCarrierCode: 'wellcare', detectedCarrierName: 'WellCare', confidence: 'high' };
  }

  // Anthem signatures: Client Name + Client ID + Market
  const anthemSignals = ['client name', 'client id', 'market'];
  if (anthemSignals.filter(s => headerSet.has(s)).length >= 3 ||
      lowerHeaders.some(h => h.includes('anthem') || h.includes('elevance'))) {
    return { format: 'anthem', detectedCarrierCode: 'anthem', detectedCarrierName: 'Anthem', confidence: 'high' };
  }

  // UHC signatures
  if (lowerHeaders.some(h => h.includes('uhc') || h.includes('united health') || h.includes('optum'))) {
    return { format: 'freeform', detectedCarrierCode: 'uhc', detectedCarrierName: 'UnitedHealthcare', confidence: 'medium' };
  }

  // Freeform fallback
  return { format: 'freeform', confidence: 'low' };
}

// ============================================================================
// COLUMN MAPPING HELPERS
// ============================================================================

/** Find the first header that matches any of the given patterns (case-insensitive).
 *  Prefers exact matches over substring matches to avoid greedy collisions
 *  (e.g., "Coverage Effective Date" matching before "Plan Effective Date"
 *  when the pattern is just "effective date"). */
function findHeader(headers: string[], patterns: string[]): string | null {
  // Pass 1: exact matches (pattern === header)
  for (const pattern of patterns) {
    for (const header of headers) {
      if (header.toLowerCase().trim() === pattern) {
        return header;
      }
    }
  }
  // Pass 2: substring matches (header includes pattern)
  for (const pattern of patterns) {
    for (const header of headers) {
      if (header.toLowerCase().trim().includes(pattern)) {
        return header;
      }
    }
  }
  return null;
}

/** Parse a date string in various formats to ISO YYYY-MM-DD */
function parseDate(val: string): string | undefined {
  if (!val || val.trim() === '') return undefined;
  const v = val.trim();

  // Handle sentinel values for "no termination" (year >= 2900)
  const yearMatch = v.match(/^(\d{4})/);
  if (yearMatch && parseInt(yearMatch[1]) >= 2900) return undefined;

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.substring(0, 10);

  // MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // M/D/YY
  const mdyShort = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (mdyShort) {
    const [, m, d, y] = mdyShort;
    const fullYear = parseInt(y) > 50 ? `19${y}` : `20${y}`;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return undefined;
}

/** Parse a combined address string: "123 Main St, City, ST 12345" */
function parseAddress(address: string): { line1?: string; city?: string; state?: string; zip?: string } {
  if (!address || address.trim() === '') return {};

  const match = address.match(/^(.+),\s*(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      line1: match[1].trim(),
      city: match[2].trim(),
      state: match[3],
      zip: match[4],
    };
  }

  // Fallback: put everything in line1
  return { line1: address.trim() };
}

// derivePlanType() is imported from _shared/clientDedup.ts (canonical, shared version)

/** Derive carrier from plan name or enrollment code */
function deriveCarrier(planName?: string, enrollmentCode?: string): { code?: string; name?: string } {
  const text = `${planName ?? ''} ${enrollmentCode ?? ''}`.toLowerCase();
  if (text.includes('humana')) return { code: 'humana', name: 'Humana' };
  if (text.includes('aetna') || text.includes('cvs')) return { code: 'aetna', name: 'Aetna' };
  if (text.includes('anthem') || text.includes('elevance')) return { code: 'anthem', name: 'Anthem' };
  if (text.includes('wellcare') || text.includes('centene')) return { code: 'wellcare', name: 'WellCare' };
  if (text.includes('uhc') || text.includes('united') || text.includes('optum')) return { code: 'uhc', name: 'UnitedHealthcare' };
  if (text.includes('devoted')) return { code: 'devoted', name: 'Devoted Health' };
  return {};
}

/** Clean phone number to digits only, with basic validation */
function cleanPhone(val?: string): string | undefined {
  if (!val || val === 'Unavailable') return undefined;
  const digits = val.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1);
  if (digits.length >= 7) return digits;
  return undefined;
}

/** Convert ALL CAPS or mixed-case string to Title Case (handles hyphens, apostrophes) */
function toTitleCase(val?: string): string | undefined {
  if (!val || val.trim() === '') return undefined;
  return val.trim().toLowerCase()
    .replace(/(?:^|\s|-|')\S/g, c => c.toUpperCase());
}

// ============================================================================
// ROW PARSERS
// ============================================================================

// --- SUNFIRE PARSER ---
function parseSunFireRow(
  row: Record<string, string>,
  headers: string[]
): { client: ParsedClientRow; policy: ParsedPolicyRow } {
  const get = (patterns: string[]) => {
    const key = findHeader(headers, patterns);
    return key ? row[key] : undefined;
  };

  const addressParsed = parseAddress(get(['address']) ?? '');
  const planName = get(['plan name', 'planname', 'plan_name']);
  const enrollmentCode = get(['enrollmentcode', 'enrollment code', 'enrollment_code']);
  const carrier = deriveCarrier(planName, enrollmentCode);

  return {
    client: {
      first_name: get(['firstname', 'first name', 'first_name']),
      last_name: get(['lastname', 'last name', 'last_name']),
      middle_initial: get(['middleinitial', 'middle initial', 'middle_initial', 'middle init', 'mbrmiddleinit']),
      date_of_birth: parseDate(get(['dob', 'date of birth', 'dateofbirth', 'birth date']) ?? ''),
      medicare_number: get(['mbi', 'medicare', 'medicarenumber', 'medicare_number', 'medicare number']),
      phone: cleanPhone(get(['phone', 'phonenumber', 'phone number', 'telephone'])),
      email: get(['email', 'emailaddress', 'email address']),
      address_line1: addressParsed.line1 ?? get(['address_line1', 'address1', 'street']),
      address_city: addressParsed.city ?? get(['city']),
      address_state: addressParsed.state ?? get(['state']),
      address_zip: addressParsed.zip ?? get(['zip', 'zipcode', 'zip code', 'postal']),
      county_fips: get(['county', 'countyfips', 'county_fips', 'fips']),
      part_a_date: parseDate(get(['part_a_effective_date', 'part a', 'parta']) ?? ''),
      part_b_date: parseDate(get(['part_b_effective_date', 'part b', 'partb']) ?? ''),
    },
    policy: {
      carrier_name: carrier.name,
      plan_name: planName,
      plan_type: derivePlanType(planName),
      effective_date: parseDate(get(['effectivedate', 'effective date', 'effective_date', 'eff date']) ?? ''),
      term_date: parseDate(get(['termdate', 'term date', 'term_date', 'disenrollment']) ?? ''),
      carrier_member_id: get(['memberid', 'member id', 'member_id']),
    },
  };
}

// --- CARRIER REPORT PARSER (generic — works for Aetna, Humana, WellCare, Anthem) ---
function parseCarrierReportRow(
  row: Record<string, string>,
  headers: string[],
  carrierCode?: string
): { client: ParsedClientRow; policy: ParsedPolicyRow } {
  const get = (patterns: string[]) => {
    const key = findHeader(headers, patterns);
    return key ? row[key] : undefined;
  };

  const result = {
    client: {
      first_name: get(['first name', 'firstname', 'first_name', 'fname', 'mbrfirstname', 'member first name']),
      last_name: get(['last name', 'lastname', 'last_name', 'lname', 'mbrlastname', 'member last name']),
      middle_initial: get(['middle initial', 'mbrmiddleinit', 'middle_initial', 'middle init']),
      date_of_birth: parseDate(get(['dob', 'date of birth', 'birth date', 'birthdate', 'member dob']) ?? ''),
      medicare_number: get(['mbi', 'medicare', 'medicare number', 'beneficiary id', 'hicn']),
      phone: cleanPhone(get(['phone', 'telephone', 'phone number'])),
      email: get(['email', 'email address']),
      address_line1: get(['address line 1', 'address', 'address1', 'street']),
      address_line2: get(['address line 2', 'address2', 'apt', 'unit']),
      address_city: get(['city']),
      address_state: get(['state']),
      address_zip: get(['zip', 'zipcode', 'zip code', 'postal code']),
      county_fips: get(['county', 'fips', 'county fips']),
    },
    policy: {
      carrier_name: carrierCode,
      carrier_member_id: get(['humana id', 'member id', 'memberid', 'member_id', 'subscriber id', 'centene id', 'client id']),
      plan_name: get(['plan name', 'plan_name', 'planname', 'salesproduct']),
      plan_type: derivePlanType(get(['plan type', 'plan_type', 'plan name', 'plan_name', 'planname', 'salesproduct'])),
      effective_date: parseDate(get(['plan effective date', 'effective date', 'effectivedate', 'effective_date', 'eff date', 'start date', 'coverage effective date']) ?? ''),
      term_date: parseDate(get(['term date', 'termdate', 'term_date', 'disenrollment', 'end date', 'termination date', 'inactive date', 'cancellation date']) ?? ''),
    },
  };

  // Normalize name casing (carrier reports often use ALL CAPS)
  result.client.first_name = toTitleCase(result.client.first_name) || result.client.first_name;
  result.client.last_name = toTitleCase(result.client.last_name) || result.client.last_name;
  if (result.client.middle_initial) {
    result.client.middle_initial = result.client.middle_initial.trim().toUpperCase();
  }

  // Normalize address casing (carrier reports often use ALL CAPS)
  result.client.address_line1 = toTitleCase(result.client.address_line1) || result.client.address_line1;
  result.client.address_line2 = toTitleCase(result.client.address_line2) || result.client.address_line2;
  result.client.address_city = toTitleCase(result.client.address_city) || result.client.address_city;

  // Split address_line1 into line1/line2 if it contains an apt/unit indicator
  if (!result.client.address_line2 && result.client.address_line1) {
    const { line1, line2 } = splitAddressLine2(result.client.address_line1);
    result.client.address_line1 = toTitleCase(line1) || result.client.address_line1;
    if (line2) {
      result.client.address_line2 = toTitleCase(line2);
    }
  }

  // Normalize email casing and filter placeholder values
  if (result.client.email) {
    result.client.email = result.client.email.toLowerCase().trim();
    if (result.client.email === 'unavailable' || result.client.email === 'n/a' || result.client.email === 'none') {
      result.client.email = undefined;
    }
  }

  // Derive explicit policy status from carrier's status column
  // Note: sentinel dates (year >= 2900) are already cleared by parseDate()
  const statusVal = get(['member status', 'status']);
  if (statusVal) {
    const s = statusVal.toLowerCase().trim();
    if (s === 't' || s.includes('inactive') || s.includes('cancel') || s.includes('terminated')) {
      result.policy.status = 'termed';
    } else if (s === 'a' || s.includes('active') || s.includes('future')) {
      result.policy.status = 'active';
    }
  }

  // WellCare plan name repair — their export truncates plan names at ~30 chars
  if (carrierCode?.toLowerCase() === 'wellcare') {
    const cmsContract = get(['cms contract']);
    const planNumber = get(['plan number']);
    if (result.policy.plan_name) {
      result.policy.plan_name = repairWellCarePlanName(
        result.policy.plan_name, cmsContract, planNumber
      ) ?? result.policy.plan_name;
    }
  }

  return result;
}

// --- FREEFORM PARSER (fuzzy header matching) ---
function parseFreeformRow(
  row: Record<string, string>,
  headers: string[]
): { client: ParsedClientRow; policy: ParsedPolicyRow } {
  return parseCarrierReportRow(row, headers, undefined);
}

// ============================================================================
// ROW VALIDATION
// ============================================================================

function validateRow(client: ParsedClientRow): string | null {
  if (!client.last_name?.trim() && !client.medicare_number?.trim()) {
    return 'Missing last name and Medicare number — cannot identify this person';
  }
  if (!client.last_name?.trim()) {
    return 'Missing last name';
  }
  return null;
}

// ============================================================================
// CARRIER LOOKUP
// ============================================================================

async function lookupCarrierId(
  supabase: SupabaseClient,
  carrierNameOrCode?: string
): Promise<string | null> {
  if (!carrierNameOrCode) return null;

  const lower = carrierNameOrCode.toLowerCase().trim();

  const { data } = await supabase
    .from('carriers')
    .select('id, name, code')
    .or(`code.ilike.%${lower}%,name.ilike.%${lower}%`)
    .limit(1)
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

// ============================================================================
// ACTION: PARSE
// ============================================================================

async function handleParse(req: Request, supabase: SupabaseClient, body: any): Promise<Response> {
  const { fileContent, fileName, profileId, expectedCarrierId, expectedCarrierCode } = body;

  if (!fileContent || !fileName || !profileId) {
    return corsErrorResponse(req, 'Missing required fields: fileContent, fileName, profileId', 400);
  }

  // 1. Create batch record
  const { data: batch, error: batchError } = await supabase
    .from('book_import_batches')
    .insert({
      profile_id: profileId,
      carrier_id: expectedCarrierId || null,
      source_format: 'unknown',
      file_name: fileName,
      file_size_bytes: fileContent.length,
      status: 'parsing',
    })
    .select('id')
    .single();

  if (batchError) {
    console.error('Failed to create batch:', batchError);
    return corsErrorResponse(req, `Failed to create batch: ${batchError.message}`, 500);
  }

  const batchId = String(batch.id);

  try {
    // 2. Decode and parse file
    const decoded = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));
    const isXLSX = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') ||
                   // Magic bytes check for ZIP (XLSX is a ZIP)
                   (decoded.length > 4 && decoded[0] === 0x50 && decoded[1] === 0x4B);

    let headers: string[];
    let rows: Record<string, string>[];

    if (isXLSX) {
      const result = parseXLSXFile(decoded);
      headers = result.headers;
      rows = result.rows;
    } else {
      const text = new TextDecoder('utf-8').decode(decoded);
      const result = parseCSV(text);
      headers = result.headers;
      rows = result.rows;
    }

    if (rows.length === 0) {
      await supabase.from('book_import_batches').update({
        status: 'staged',
        total_records: 0,
        detected_format: 'empty',
        staged_at: new Date().toISOString(),
      }).eq('id', batchId);

      return corsJsonResponse(req, {
        batchId,
        status: 'staged',
        totalRecords: 0, newRecords: 0, updatedRecords: 0, skippedRecords: 0, termedRecords: 0,
        sourceFormat: 'unknown', detectedFormat: 'empty',
        formatMismatch: false, skipDetails: [],
      });
    }

    // 3. Detect format
    const formatResult = detectFormat(headers);
    console.log(`Format detected: ${formatResult.format} (confidence: ${formatResult.confidence})`);

    // 4. Carrier mismatch check
    let formatMismatch = false;
    let mismatchDetectedCarrier: string | undefined;

    if (expectedCarrierCode && formatResult.detectedCarrierCode) {
      if (formatResult.detectedCarrierCode.toLowerCase() !== expectedCarrierCode.toLowerCase()) {
        formatMismatch = true;
        mismatchDetectedCarrier = formatResult.detectedCarrierName;
        console.log(`Carrier mismatch: expected ${expectedCarrierCode}, detected ${formatResult.detectedCarrierCode}`);
      }
    }

    // 5. Load client cache for dedup
    const cache = await loadClientCache(supabase, profileId);

    // 6. Parse and stage each row
    let newCount = 0;
    let updateCount = 0;
    let skipCount = 0;
    let termedCount = 0;
    const skipDetails: { row: number; reason: string }[] = [];
    const stagedRecords: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      let client: ParsedClientRow;
      let policy: ParsedPolicyRow;

      // Route to appropriate parser
      switch (formatResult.format) {
        case 'sunfire':
          ({ client, policy } = parseSunFireRow(rawRow, headers));
          break;
        case 'aetna':
        case 'humana':
        case 'wellcare':
          ({ client, policy } = parseCarrierReportRow(rawRow, headers, formatResult.detectedCarrierName));
          break;
        case 'anthem': {
          ({ client, policy } = parseCarrierReportRow(rawRow, headers, formatResult.detectedCarrierName));
          // Only process Senior market rows
          const marketKey = findHeader(headers, ['market']);
          const market = marketKey ? rawRow[marketKey] : undefined;
          if (market && market.toLowerCase() !== 'senior') {
            skipCount++;
            skipDetails.push({ row: i + 2, reason: `Non-Senior market: ${market}` });
            stagedRecords.push({
              batch_id: batchId,
              row_number: i + 1,
              raw_data: rawRow,
              mapped_data: client,
              match_type: 'skip',
              skip_reason: `Non-Senior market: ${market}`,
              policy_data: policy,
            });
            continue;
          }
          // Parse "Last, First Middle" from Client Name
          if (!client.first_name && !client.last_name) {
            const nameKey = findHeader(headers, ['client name']);
            const clientName = nameKey ? rawRow[nameKey] : undefined;
            if (clientName) {
              const nameParts = clientName.split(',').map((s: string) => s.trim());
              if (nameParts.length >= 2) {
                client.last_name = toTitleCase(nameParts[0]) || nameParts[0];
                const firstParts = nameParts[1].split(/\s+/);
                client.first_name = toTitleCase(firstParts[0]) || firstParts[0];
                if (firstParts.length > 1) {
                  client.middle_initial = firstParts[firstParts.length - 1];
                }
              } else {
                client.last_name = toTitleCase(clientName.trim()) || clientName.trim();
              }
            }
          }
          break;
        }
        case 'connecture':
          ({ client, policy } = parseCarrierReportRow(rawRow, headers, undefined));
          break;
        case 'freeform':
        default:
          ({ client, policy } = parseFreeformRow(rawRow, headers));
          break;
      }

      // Validate
      const validationError = validateRow(client);
      if (validationError) {
        skipCount++;
        skipDetails.push({ row: i + 2, reason: validationError }); // +2 for 1-indexed + header row
        stagedRecords.push({
          batch_id: batchId,
          row_number: i + 1,
          raw_data: rawRow,
          mapped_data: client,
          match_type: 'skip',
          skip_reason: validationError,
          policy_data: policy,
        });
        continue;
      }

      // Check for term date (counted separately)
      if (policy.term_date) {
        termedCount++;
      }

      // Dedup match
      const matchResult = findExistingClient(cache, client);

      let matchType: string;
      if (matchResult.matchType === 'none') {
        matchType = 'new';
        newCount++;
      } else {
        matchType = `update_${matchResult.matchType}`;
        updateCount++;
      }

      // Only store real UUID client IDs — temp "staged-N" IDs are for in-memory dedup only
      const isRealClientId = matchResult.clientId && !matchResult.clientId.startsWith('staged-');

      stagedRecords.push({
        batch_id: batchId,
        row_number: i + 1,
        raw_data: rawRow,
        mapped_data: client,
        match_type: matchType,
        matched_client_id: isRealClientId ? matchResult.clientId : null,
        policy_data: policy,
      });

      // Update cache with new clients so within-file dedup works
      if (matchResult.matchType === 'none') {
        const tempId = `staged-${i}`;
        const tempCached = { id: tempId, manually_edited_fields: [] as string[] };
        if (client.medicare_number) {
          const mbiKey = client.medicare_number.trim().toLowerCase();
          if (mbiKey && !cache.byMBI.has(mbiKey)) {
            cache.byMBI.set(mbiKey, tempCached);
          }
        }
        if (client.last_name && client.first_name && client.date_of_birth) {
          const key = `${(client.last_name).trim().toLowerCase()}|${(client.first_name).trim().toLowerCase()}|${client.date_of_birth}`;
          if (!cache.byNameDOB.has(key)) {
            cache.byNameDOB.set(key, tempCached);
          }
        }
        if (client.last_name && client.first_name) {
          const key = `${(client.last_name).trim().toLowerCase()}|${(client.first_name).trim().toLowerCase()}`;
          const existing = cache.byNameOnly.get(key) ?? [];
          existing.push(tempCached);
          cache.byNameOnly.set(key, existing);
        }
      }
    }

    // 7. Batch insert staged records (chunks of 500 to avoid payload limits)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < stagedRecords.length; i += CHUNK_SIZE) {
      const chunk = stagedRecords.slice(i, i + CHUNK_SIZE);
      const { error: stageError } = await supabase
        .from('book_import_staged_records')
        .insert(chunk);

      if (stageError) {
        console.error(`Failed to insert staged records chunk ${i}:`, stageError);
        throw new Error(`Failed to stage records: ${stageError.message}`);
      }
    }

    // 8. Update batch
    const sourceFormat = formatResult.format === 'freeform' ? 'freeform' :
                         ['sunfire', 'connecture'].includes(formatResult.format) ? formatResult.format :
                         'carrier_report';

    await supabase.from('book_import_batches').update({
      status: 'staged',
      source_format: sourceFormat,
      detected_format: formatResult.format,
      total_records: rows.length,
      new_records: newCount,
      updated_records: updateCount,
      skipped_records: skipCount,
      termed_records: termedCount,
      skip_details: skipDetails,
      format_mismatch: formatMismatch,
      mismatch_detected_carrier: mismatchDetectedCarrier || null,
      staged_at: new Date().toISOString(),
    }).eq('id', batchId);

    // 9. Return summary
    return corsJsonResponse(req, {
      batchId,
      status: 'staged',
      sourceFormat,
      detectedFormat: formatResult.format,
      formatMismatch,
      mismatchDetectedCarrier,
      totalRecords: rows.length,
      newRecords: newCount,
      updatedRecords: updateCount,
      skippedRecords: skipCount,
      termedRecords: termedCount,
      skipDetails,
    });

  } catch (err: unknown) {
    console.error('Parse error:', err);
    await supabase.from('book_import_batches').update({
      status: 'failed',
      error_message: getErrorMessage(err),
    }).eq('id', batchId);

    return corsErrorResponse(req, getErrorMessage(err), 500);
  }
}

// ============================================================================
// ACTION: COMMIT
// ============================================================================

async function handleCommit(req: Request, supabase: SupabaseClient, body: any): Promise<Response> {
  const { batchId } = body;

  if (!batchId) {
    return corsErrorResponse(req, 'Missing batchId', 400);
  }

  // 1. Load and verify batch
  const { data: batch, error: batchError } = await supabase
    .from('book_import_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (batchError || !batch) {
    return corsErrorResponse(req, 'Batch not found', 404);
  }

  if (batch.status !== 'staged') {
    return corsErrorResponse(req, `Batch is ${batch.status}, expected staged`, 400);
  }

  // 2. Set status to committing
  await supabase.from('book_import_batches').update({ status: 'committing' }).eq('id', batchId);

  try {
    // 3. Load client cache
    const cache = await loadClientCache(supabase, batch.profile_id);

    // 4. Load staged records (non-skipped)
    const { data: stagedRecords, error: loadError } = await supabase
      .from('book_import_staged_records')
      .select('*')
      .eq('batch_id', batchId)
      .neq('match_type', 'skip')
      .order('row_number', { ascending: true });

    if (loadError) throw new Error(`Failed to load staged records: ${loadError.message}`);

    // Build carrier lookup cache
    const carrierCache = new Map<string, string>(); // carrier name/code → carrier ID

    let newCount = 0;
    let updateCount = 0;

    // 5. Process each staged record
    for (const record of (stagedRecords ?? [])) {
      const mappedData = record.mapped_data as ParsedClientRow;
      const policyData = record.policy_data as ParsedPolicyRow | null;

      // Rebuild match result from staged data
      const matchResult = {
        clientId: record.matched_client_id ? String(record.matched_client_id) : null,
        matchType: record.match_type.replace('update_', '') as any,
        confidence: 'high' as const,
      };

      // Re-run findExistingClient against fresh cache for accuracy
      // (staged match might be stale if another import happened between stage and commit)
      const freshMatch = findExistingClient(cache, mappedData);
      if (freshMatch.clientId) {
        matchResult.clientId = freshMatch.clientId;
        matchResult.matchType = freshMatch.matchType;
      }

      // Upsert client
      const { clientId, isNew } = await upsertClient(
        supabase, batch.profile_id, mappedData, matchResult,
        'BOOK_IMPORT', cache, batchId
      );

      if (isNew) newCount++;
      else updateCount++;

      // Upsert policy if we have policy data with carrier info
      if (policyData && (policyData.carrier_name || batch.carrier_id)) {
        let carrierId = batch.carrier_id ? String(batch.carrier_id) : null;

        // Look up carrier ID from name if not on the batch
        if (!carrierId && policyData.carrier_name) {
          if (!carrierCache.has(policyData.carrier_name)) {
            const found = await lookupCarrierId(supabase, policyData.carrier_name);
            if (found) carrierCache.set(policyData.carrier_name, found);
          }
          carrierId = carrierCache.get(policyData.carrier_name) ?? null;
        }

        if (carrierId) {
          await upsertPolicy(supabase, clientId, carrierId, batch.profile_id, policyData);
        }
      }
    }

    // 6. Update batch with final stats
    await supabase.from('book_import_batches').update({
      status: 'committed',
      new_records: newCount,
      updated_records: updateCount,
      committed_at: new Date().toISOString(),
    }).eq('id', batchId);

    return corsJsonResponse(req, {
      batchId,
      status: 'committed',
      newRecords: newCount,
      updatedRecords: updateCount,
      skippedRecords: batch.skipped_records ?? 0,
      termedRecords: batch.termed_records ?? 0,
      totalRecords: batch.total_records ?? 0,
    });

  } catch (err: unknown) {
    console.error('Commit error:', err);
    await supabase.from('book_import_batches').update({
      status: 'failed',
      error_message: getErrorMessage(err),
    }).eq('id', batchId);

    return corsErrorResponse(req, getErrorMessage(err), 500);
  }
}

// ============================================================================
// ACTION: CANCEL
// ============================================================================

async function handleCancel(req: Request, supabase: SupabaseClient, body: any): Promise<Response> {
  const { batchId } = body;

  if (!batchId) {
    return corsErrorResponse(req, 'Missing batchId', 400);
  }

  // Clean up staged records before marking batch as cancelled
  await supabase
    .from('book_import_staged_records')
    .delete()
    .eq('batch_id', batchId);

  const { error } = await supabase
    .from('book_import_batches')
    .update({ status: 'cancelled' })
    .eq('id', batchId);

  if (error) {
    return corsErrorResponse(req, `Failed to cancel: ${error.message}`, 500);
  }

  return corsJsonResponse(req, { success: true, batchId });
}

// ============================================================================
// ACTION: CHECK_PENDING
// ============================================================================

async function handleCheckPending(req: Request, supabase: SupabaseClient, body: any): Promise<Response> {
  const { profileId } = body;

  if (!profileId) {
    return corsErrorResponse(req, 'Missing profileId', 400);
  }

  // Auto-cancel stale batches (older than 7 days)
  await supabase
    .from('book_import_batches')
    .update({ status: 'cancelled' })
    .in('status', ['staged', 'parsing', 'uploading'])
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Find most recent pending batch (within 24 hours)
  const { data: pending } = await supabase
    .from('book_import_batches')
    .select('id, file_name, status, source_format, detected_format, total_records, new_records, updated_records, skipped_records, termed_records, skip_details, format_mismatch, mismatch_detected_carrier, carrier_id, created_at')
    .eq('profile_id', profileId)
    .in('status', ['staged', 'parsing'])
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return corsJsonResponse(req, { pending: pending || null });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  const supabase = createSupabaseAdmin();

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return corsErrorResponse(req, 'Method not allowed', 405);
    }

    // Check authorization — allow service role or authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsErrorResponse(req, 'No authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    let isServiceRole = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Fallback: decode JWT and check role claim (handles env var encoding quirks)
    if (!isServiceRole) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'service_role') {
          isServiceRole = true;
        }
      } catch { /* not a valid JWT — will fall through to user auth */ }
    }

    if (!isServiceRole) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return corsErrorResponse(req, 'Unauthorized', 401);
      }
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'parse':
        return await handleParse(req, supabase, body);
      case 'commit':
        return await handleCommit(req, supabase, body);
      case 'cancel':
        return await handleCancel(req, supabase, body);
      case 'check_pending':
        return await handleCheckPending(req, supabase, body);
      default:
        return corsErrorResponse(req, `Unknown action: ${action}`, 400);
    }
  } catch (err: unknown) {
    console.error('Unhandled error:', err);
    return corsErrorResponse(req, getErrorMessage(err), 500);
  }
});
