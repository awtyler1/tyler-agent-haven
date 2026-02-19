# Aetna BOB Import Pipeline — Complete Source Code

Generated: 2026-02-18

This document contains the full source code for every file involved in the Aetna Book of Business
import pipeline. Six files total.

---

## Data Flow Summary

```
File Upload (UploadModal.tsx)
  |
  v
Carrier Detection (src/lib/carrier-detection.ts)
  Aetna signature: "Medicare Number" + "Member Status" + "Coverage Effective Date"
  |
  v
Edge Function: import-book-of-business/index.ts  (BOB Import — stage/commit pattern)
  - parseCSV() → headers + rows
  - detectFormat() → 'aetna'
  - parseCarrierReportRow() → ParsedClientRow + ParsedPolicyRow
  |
  v
Edge Function: parse-production-report/index.ts  (Smart Sync — direct import)
  - parseAetnaReport() → dedicated Aetna parser
  |
  v
Shared Dedup: _shared/clientDedup.ts
  - loadClientCache() → in-memory Maps (byMBI, byNameDOB, byNameOnly)
  - findExistingClient() → match result
  - upsertClient() + upsertPolicy() → persist to DB
```

---

## File 1: supabase/functions/import-book-of-business/index.ts

This is the BOB Import edge function. Handles parse → stage → commit → cancel workflow.
Aetna is detected via `detectFormat()` (line 128) and parsed via `parseCarrierReportRow()` (line 366).

```typescript
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

/** Find the first header that matches any of the given patterns (case-insensitive) */
function findHeader(headers: string[], patterns: string[]): string | null {
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const pattern of patterns) {
      if (lower === pattern || lower.includes(pattern)) {
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

/** Derive plan_type from plan name keywords or short code */
function derivePlanType(planName?: string): string {
  if (!planName) return 'OTHER';
  const lower = planName.toLowerCase().trim();

  // Exact short-code matches (e.g., Humana "Plan Type" column values)
  if (lower === 'ma' || lower === 'mapd') return 'MA';
  if (lower === 'pdp') return 'PDP';
  if (lower === 'dsnp' || lower === 'd-snp') return 'DSNP';

  // Substring matches for full plan names
  if (lower.includes('pdp') || lower.includes('part d') || lower.includes('prescription')) return 'PDP';
  if (lower.includes('d-snp') || lower.includes('dsnp')) return 'DSNP';
  if (lower.includes('plan g') || lower.includes('plan f') || lower.includes('plan n') ||
      lower.includes('medigap') || lower.includes('supplement') || lower.includes('med supp')) return 'MEDIGAP';
  if (lower.includes('hmo') || lower.includes('ppo') || lower.includes('pffs') ||
      lower.includes('snp') || lower.includes('medicare advantage') || lower.includes(' ma ')) return 'MA';
  return 'OTHER';
}

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
      middle_initial: get(['middleinitial', 'middle initial', 'mi']),
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
      middle_initial: get(['middle', 'mi', 'middle initial', 'mbrmiddleinit']),
      date_of_birth: parseDate(get(['dob', 'date of birth', 'birth date', 'birthdate', 'member dob']) ?? ''),
      medicare_number: get(['mbi', 'medicare', 'medicare number', 'beneficiary id', 'hicn']),
      phone: cleanPhone(get(['phone', 'telephone', 'phone number'])),
      email: get(['email', 'email address']),
      address_line1: get(['address', 'address1', 'street', 'address line 1']),
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
      effective_date: parseDate(get(['effective date', 'effectivedate', 'effective_date', 'eff date', 'start date', 'coverage effective date']) ?? ''),
      term_date: parseDate(get(['term date', 'termdate', 'term_date', 'disenrollment', 'end date', 'termination date', 'inactive date', 'cancellation date']) ?? ''),
    },
  };

  // Normalize name casing (carrier reports often use ALL CAPS)
  result.client.first_name = toTitleCase(result.client.first_name) || result.client.first_name;
  result.client.last_name = toTitleCase(result.client.last_name) || result.client.last_name;
  if (result.client.middle_initial) {
    result.client.middle_initial = result.client.middle_initial.trim().toUpperCase();
  }

  // Normalize email casing and filter placeholder values
  if (result.client.email) {
    result.client.email = result.client.email.toLowerCase().trim();
    if (result.client.email === 'unavailable' || result.client.email === 'n/a' || result.client.email === 'none') {
      result.client.email = undefined;
    }
  }

  // Status-based term date validation (works across all carriers)
  const statusVal = get(['member status', 'status']);
  if (statusVal) {
    const s = statusVal.toLowerCase().trim();
    if (s === 't' || s.includes('inactive') || s.includes('cancel') || s.includes('terminated')) {
      // Terminated — keep term_date as-is
    } else if (s === 'a' || s.includes('active') || s.includes('future')) {
      // Active (including "Future Disenrollment") — clear any sentinel/future term dates
      result.policy.term_date = undefined;
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
```

---

## File 2: supabase/functions/parse-production-report/index.ts

This is the Smart Sync edge function. Has a dedicated `parseAetnaReport()` function.
Expected Aetna columns are listed in the docblock at line 286.

```typescript
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

    // Handle cancellation date:
    // - 9999-12-31 = sentinel for "no termination" → null
    // - Future dates (e.g., 2026-12-31 end of benefit year) = still active → null
    // - Past dates = actual termination → keep as term_date
    const cancelDate = row['Cancellation Date']?.trim();
    let termDate: string | null = null;
    if (cancelDate && cancelDate !== '9999-12-31') {
      const normalized = normalizeDate(cancelDate);
      if (normalized) {
        const cancelTime = new Date(normalized).getTime();
        const today = new Date().setHours(0, 0, 0, 0);
        if (cancelTime < today) {
          termDate = normalized; // Only set term_date for PAST dates
        }
      }
    }

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
```

---

## File 3: supabase/functions/_shared/clientDedup.ts

Shared dedup service used by both edge functions. Batch pre-loads all agent clients
into memory Maps for O(1) matching.

```typescript
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
  'address_line1', 'address_city', 'address_state', 'address_zip',
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
    .select('id')
    .eq('client_id', clientId)
    .eq('carrier_id', carrierId)
    .eq('plan_type', planType)
    .maybeSingle();

  if (findError) {
    console.error('Failed to find existing policy:', findError);
    throw new Error(`Failed to find existing policy: ${findError.message}`);
  }

  if (existing) {
    // UPDATE existing policy with non-null fields
    const updateData: Record<string, any> = {
      last_seen_at: new Date().toISOString(),
    };

    if (row.plan_name) updateData.plan_name = row.plan_name;
    if (row.effective_date) updateData.effective_date = row.effective_date;
    if (row.term_date) updateData.term_date = row.term_date;
    if (row.carrier_member_id) updateData.carrier_member_id = row.carrier_member_id;
    if (sourceUploadId) updateData.last_seen_upload_id = sourceUploadId;

    // If term_date is set AND in the past, mark as termed
    // Future term_dates (e.g., Anthem end-of-year) mean still active
    if (row.term_date && new Date(row.term_date) < new Date()) {
      updateData.status = 'termed';
    } else if (row.term_date && new Date(row.term_date) >= new Date()) {
      // Future term date = active (benefit year end, not a real termination)
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
```

---

## File 4: src/config/carriers.ts

Central carrier config — defines all supported carriers, brand colors, and portal URLs.

```typescript
/**
 * Carrier Configuration
 *
 * Central configuration for all carriers supported in the sync flow.
 * - `enabled: true` = MVP carriers that are fully supported
 * - `enabled: false` = Coming soon (visible to RTS agents but not selectable)
 */

/**
 * Official brand colors for carrier pills and UI accents
 */
export const CARRIER_BRAND_COLORS: Record<string, string> = {
  aetna: '#7B2D8E',      // Purple
  humana: '#4B9B4B',     // Green
  uhc: '#002677',        // Navy
  anthem: '#0072CE',     // Blue
  wellcare: '#00A79D',   // Teal
  devoted: '#F97316',    // Orange
};

export interface CarrierConfig {
  id: string;        // matches carriers.code in DB
  name: string;
  color: string;
  portalUrl: string;
  enabled: boolean;  // MVP = true, coming soon = false
}

export const CARRIERS: CarrierConfig[] = [
  // ============================================================
  // MVP ENABLED CARRIERS
  // ============================================================
  {
    id: 'humana',
    name: 'Humana',
    color: '#10b981',
    portalUrl: 'https://www.humana.com/agent',
    enabled: true,
  },
  {
    id: 'wellcare',
    name: 'WellCare',
    color: '#f59e0b',
    portalUrl: 'https://www.wellcare.com/agents',
    enabled: true,
  },
  {
    id: 'anthem',
    name: 'Anthem',
    color: '#3b82f6',
    portalUrl: 'https://www.anthem.com/broker',
    enabled: true,
  },
  {
    id: 'aetna',
    name: 'Aetna',
    color: '#a855f7',
    portalUrl: 'https://www.aetna.com/producers',
    enabled: true,
  },

  // ============================================================
  // COMING SOON CARRIERS (truncated — 30+ carriers omitted for brevity)
  // Full list in src/config/carriers.ts
  // ============================================================
  {
    id: 'uhc',
    name: 'UnitedHealthcare',
    color: '#0ea5e9',
    portalUrl: 'https://www.uhc.com/broker',
    enabled: false,
  },
  // ... (see full file for remaining carriers)
];

// Pre-filtered lists for convenience
export const ENABLED_CARRIERS = CARRIERS.filter(c => c.enabled);
export const COMING_SOON_CARRIERS = CARRIERS.filter(c => !c.enabled);

// Lookup helpers
export const getCarrierById = (id: string): CarrierConfig | undefined =>
  CARRIERS.find(c => c.id === id);

export const getCarriersByIds = (ids: string[]): CarrierConfig[] =>
  CARRIERS.filter(c => ids.includes(c.id));

export const getEnabledCarriersByIds = (ids: string[]): CarrierConfig[] =>
  CARRIERS.filter(c => ids.includes(c.id) && c.enabled);
```

---

## File 5: src/config/carrierImportGuides.ts

Per-carrier portal URLs and download instructions shown in the upload UI.

```typescript
// Per-carrier portal URLs and download instructions for the carrier tile help links.

export const carrierImportGuides: Record<string, {
  portalName: string;
  portalUrl: string;
  steps: string;
}> = {
  humana: {
    portalName: 'Humana Agent Portal',
    portalUrl: 'https://www.humana.com/agent',
    steps: 'Agent Portal → Reports → Monthly Production Report → Export',
  },
  aetna: {
    portalName: 'Aetna Producer World',
    portalUrl: 'https://www.aetna.com/producer',
    steps: 'Producer World → Reports → Book of Business → Download CSV',
  },
  anthem: {
    portalName: 'Anthem Producer Toolkit',
    portalUrl: 'https://www.anthem.com/producer',
    steps: 'Producer Toolkit → My Book → Production Report → Export',
  },
  wellcare: {
    portalName: 'WellCare Provider Portal',
    portalUrl: 'https://www.wellcare.com/agent',
    steps: 'Agent Portal → Reports → Active Enrollment → Download',
  },
  uhc: {
    portalName: 'UHC Jarvis',
    portalUrl: 'https://jarvis.uhc.com',
    steps: 'Jarvis → My Production → Export Report',
  },
  devoted: {
    portalName: 'Devoted Health Broker Portal',
    portalUrl: 'https://broker.devoted.com',
    steps: 'Broker Portal → My Members → Export',
  },
};
```

---

## File 6: src/lib/carrier-detection.ts

Client-side carrier detection — runs in the browser before uploading to the edge function.
Uses file header patterns to auto-detect which carrier a CSV/XLSX belongs to.

```typescript
/**
 * Carrier Detection
 *
 * Detects which carrier a file belongs to based on column headers and structure.
 * Each carrier has unique column patterns we can match against.
 */

export type SupportedCarrier = 'aetna' | 'humana' | 'wellcare' | 'anthem';

export interface DetectionResult {
  detected: boolean;
  carrier: SupportedCarrier | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Carrier signature patterns - based on ACTUAL file headers
const CARRIER_SIGNATURES: Record<SupportedCarrier, {
  requiredColumns: string[];
  uniqueIdentifiers: string[]; // Columns unique to this carrier
  fileType: 'csv' | 'xlsx' | 'both';
}> = {
  aetna: {
    // Headers: Member ID, Medicare Number, Member Status, Coverage Effective Date, etc.
    requiredColumns: ['medicare number', 'member status'],
    uniqueIdentifiers: ['medicare number', 'coverage effective date', 'legacy member id'],
    fileType: 'csv',
  },
  humana: {
    // Headers: MbrLastName, MbrFirstName, Humana ID, SalesProduct, etc.
    requiredColumns: ['mbrlastname', 'mbrfirstname'],
    uniqueIdentifiers: ['humana id', 'mbrlastname', 'mbrfirstname', 'salesproduct'],
    fileType: 'xlsx',
  },
  wellcare: {
    // Headers: MBI, Centene ID, Member First Name, Broker NPN, etc.
    requiredColumns: ['mbi', 'member first name'],
    uniqueIdentifiers: ['centene id', 'broker npn', 'mbi'],
    fileType: 'csv',
  },
  anthem: {
    // Headers: Client Name, Client ID, Market, Writing Agent, etc.
    // Note: File has a title row first ("List of clients as of...")
    requiredColumns: ['client name', 'client id', 'market'],
    uniqueIdentifiers: ['client name', 'client id', 'writing agent', 'writing tin'],
    fileType: 'csv',
  },
};

/**
 * Detect carrier from file headers
 */
export async function detectCarrierFromFile(file: File): Promise<DetectionResult> {
  try {
    const headers = await extractHeaders(file);
    if (!headers || headers.length === 0) {
      return {
        detected: false,
        carrier: null,
        confidence: 'low',
        reason: 'Could not read file headers',
      };
    }

    // Normalize headers for comparison
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    console.log('Detected headers:', normalizedHeaders.slice(0, 10)); // Debug log

    // Check each carrier's signature - prioritize unique identifiers
    let bestMatch: { carrier: SupportedCarrier; score: number; matches: string[] } | null = null;

    for (const [carrier, signature] of Object.entries(CARRIER_SIGNATURES)) {
      // Count unique identifier matches (most important) - EXACT matching only
      const uniqueMatches = signature.uniqueIdentifiers.filter(col =>
        normalizedHeaders.some(h => h === col)
      );

      // Count required column matches - EXACT matching only
      const requiredMatches = signature.requiredColumns.filter(col =>
        normalizedHeaders.some(h => h === col)
      );

      // Score: unique matches worth more
      const score = (uniqueMatches.length * 2) + requiredMatches.length;

      // Debug log each carrier's score
      console.log(`${carrier}: score=${score}, unique=${uniqueMatches.join(',') || 'none'}, required=${requiredMatches.join(',') || 'none'}`);

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          carrier: carrier as SupportedCarrier,
          score,
          matches: [...uniqueMatches, ...requiredMatches],
        };
      }
    }

    if (bestMatch && bestMatch.score >= 2) {
      const confidence = bestMatch.score >= 4 ? 'high' : bestMatch.score >= 2 ? 'medium' : 'low';
      console.log('Detection result:', bestMatch.carrier, 'score:', bestMatch.score, 'matches:', bestMatch.matches);
      return {
        detected: true,
        carrier: bestMatch.carrier,
        confidence,
        reason: `Matched columns: ${bestMatch.matches.join(', ')}`,
      };
    }

    // No match found
    return {
      detected: false,
      carrier: null,
      confidence: 'low',
      reason: 'File structure does not match any supported carrier',
    };
  } catch (error) {
    console.error('Carrier detection error:', error);
    return {
      detected: false,
      carrier: null,
      confidence: 'low',
      reason: 'Error reading file',
    };
  }
}

/**
 * Extract headers from CSV or XLSX file
 */
async function extractHeaders(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return extractCsvHeaders(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return extractXlsxHeaders(file);
  }

  return [];
}

/**
 * Extract headers from CSV - handles title rows
 */
async function extractCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }

      const lines = text.split('\n').filter(line => line.trim());

      // Try first few lines to find the header row
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        const columns = line.split(',').map(h => h.replace(/"/g, '').trim());

        // Skip if this looks like a title/date row
        if (columns.length < 5) continue;
        if (line.toLowerCase().includes('list of clients as of')) continue;
        if (line.toLowerCase().includes('as of')) continue;
        if (line.toLowerCase().includes('report date')) continue;

        // Check if this row has header-like content (not data)
        // Data rows often start with names or IDs, header rows have descriptive text
        const firstCol = columns[0].toLowerCase();
        if (firstCol.match(/^\d+$/) || firstCol.match(/^[a-z]+,\s*[a-z]+$/i)) {
          // Looks like data (number or "LastName, FirstName"), skip
          continue;
        }

        // This row looks like headers
        resolve(columns);
        return;
      }

      // Fallback: try the second line (common for files with title rows)
      if (lines.length > 1) {
        const secondLine = lines[1];
        const headers = secondLine.split(',').map(h => h.replace(/"/g, '').trim());
        if (headers.length >= 5) {
          resolve(headers);
          return;
        }
      }

      // Last resort: first line
      const firstLine = lines[0] || '';
      const headers = firstLine.split(',').map(h => h.replace(/"/g, '').trim());
      resolve(headers);
    };
    reader.onerror = () => resolve([]);
    reader.readAsText(file.slice(0, 30000)); // Read more to get past title rows
  });
}

/**
 * Extract headers from XLSX using SheetJS
 */
async function extractXlsxHeaders(file: File): Promise<string[]> {
  try {
    // Dynamically import xlsx to avoid bundling if not needed
    const XLSX = await import('xlsx');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', sheetRows: 5 });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

    // First row is typically headers
    if (data.length > 0) {
      return (data[0] || []).map(h => String(h || '').trim());
    }

    return [];
  } catch (error) {
    console.error('XLSX parsing error:', error);
    return [];
  }
}

/**
 * Check if file type matches expected carrier format
 */
export function checkFileTypeMatch(file: File, carrier: SupportedCarrier): boolean {
  const fileName = file.name.toLowerCase();
  const signature = CARRIER_SIGNATURES[carrier];

  if (signature.fileType === 'both') {
    return true;
  }

  if (signature.fileType === 'csv') {
    return fileName.endsWith('.csv');
  }

  if (signature.fileType === 'xlsx') {
    return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  }

  return true;
}

/**
 * Get expected file type for a carrier
 */
export function getExpectedFileType(carrier: SupportedCarrier): string {
  const signature = CARRIER_SIGNATURES[carrier];
  if (signature.fileType === 'csv') return 'CSV';
  if (signature.fileType === 'xlsx') return 'Excel (XLSX)';
  return 'CSV or Excel';
}
```

---

## Aetna-Specific Column Mapping Quick Reference

### Expected Aetna CSV Headers (exact column names)

| CSV Column | DB Field | Parser Location |
|---|---|---|
| `Medicare Number` | `clients.medicare_number` | parseAetnaReport L312, parseCarrierReportRow L382 |
| `First Name` | `clients.first_name` | parseAetnaReport L320, parseCarrierReportRow L378 |
| `Last Name` | `clients.last_name` | parseAetnaReport L321, parseCarrierReportRow L379 |
| `Middle Initial` | `clients.middle_initial` | parseAetnaReport L322, parseCarrierReportRow L380 |
| `Date of Birth` | `clients.date_of_birth` | parseAetnaReport L323, parseCarrierReportRow L381 |
| `Phone Number` | `clients.phone` | parseAetnaReport L324, parseCarrierReportRow L383 |
| `Address Line 1` | `clients.address_line1` | parseAetnaReport L326, parseCarrierReportRow L385 |
| `City` | `clients.address_city` | parseAetnaReport L327, parseCarrierReportRow L386 |
| `State` | `clients.address_state` | parseAetnaReport L328, parseCarrierReportRow L387 |
| `Zip Code` | `clients.address_zip` | parseAetnaReport L329, parseCarrierReportRow L388 |
| `Coverage Effective Date` | `policies.effective_date` | parseAetnaReport L330, parseCarrierReportRow L396 |
| `Term Date` | `policies.term_date` | parseAetnaReport L331, parseCarrierReportRow L397 |
| `Member Status` | (status logic) | parseAetnaReport L305, parseCarrierReportRow L417-426 |
| `Plan Name` | `policies.plan_name` + `plan_type` derived | parseAetnaReport L333, parseCarrierReportRow L394 |
| `Member ID` | `policies.carrier_member_id` | parseAetnaReport L334, parseCarrierReportRow L393 |

### Aetna Detection Signatures

**Edge function (import-book-of-business):** 3 columns required — `medicare number` + `coverage effective date` + `member status`

**Client-side (carrier-detection.ts):** Required: `medicare number` + `member status`. Unique identifiers: `medicare number` + `coverage effective date` + `legacy member id`

### Status Mapping

| Raw Value | Mapped Status | Term Date Behavior |
|---|---|---|
| `A` (Active) | `active` | Cleared (sentinel dates removed) |
| `T` (Termed) | `termed` | Kept as-is |

### Dedup Priority (clientDedup.ts)

1. **MBI exact match** — Medicare Number (confidence: exact)
2. **Name + DOB** — Last+First+DOB composite key (confidence: high)
3. **Name only (single)** — Last+First only (confidence: medium)
4. **Name only (multiple)** — Ambiguous, takes first (confidence: low)
5. **No match** — Creates new client
