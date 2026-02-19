# WellCare/Centene Parser Source Code Reference

> Generated: 2026-02-19 — for data validation sprint
> Contains ALL source code related to parsing and importing WellCare/Centene carrier files.

---

## Table of Contents

1. [BOB Import Edge Function](#1-bob-import-edge-function)
2. [Smart Sync Edge Function](#2-smart-sync-edge-function)
3. [Shared Client Dedup Logic](#3-shared-client-dedup-logic)
4. [Carrier Detection (Frontend)](#4-carrier-detection-frontend)
5. [Carrier Config](#5-carrier-config)
6. [Carrier Import Guides](#6-carrier-import-guides)
7. [Frontend Utilities (formatPhone, titleCase)](#7-frontend-utilities)
8. [Book Types](#8-book-types)
9. [Import Status Hook](#9-import-status-hook)
10. [Sync Library](#10-sync-library)
11. [Dashboard Data Hook](#11-dashboard-data-hook)
12. [Book Summary Hook](#12-book-summary-hook)
13. [Book Dashboard Page](#13-book-dashboard-page)
14. [Book Import Hook](#14-book-import-hook)
15. [Search Results Summary](#15-search-results-summary)

---

## 1. BOB Import Edge Function

**File:** `supabase/functions/import-book-of-business/index.ts`

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
  derivePlanType,
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

  // Normalize email casing and filter placeholder values
  if (result.client.email) {
    result.client.email = result.client.email.toLowerCase().trim();
    if (result.client.email === 'unavailable' || result.client.email === 'n/a' || result.client.email === 'none') {
      result.client.email = undefined;
    }
  }

  // Status-based term date validation (works across all carriers)
  // Note: sentinel dates (year >= 2900) are already cleared by parseDate()
  const statusVal = get(['member status', 'status']);
  if (statusVal) {
    const s = statusVal.toLowerCase().trim();
    if (s === 't' || s.includes('inactive') || s.includes('cancel') || s.includes('terminated')) {
      // Terminated — keep term_date as-is
    } else if (s === 'a' || s.includes('active') || s.includes('future')) {
      // Active — keep real future term dates (e.g., future disenrollments)
      // Sentinel dates already handled by parseDate() returning undefined
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

## 2. Smart Sync Edge Function

**File:** `supabase/functions/parse-production-report/index.ts`

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
  derivePlanType as sharedDerivePlanType,
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
  address_line2: string | null;
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

// derivePlanType delegates to the canonical shared version in _shared/clientDedup.ts
function derivePlanType(planName: string | null): 'MA' | 'PDP' | 'MEDIGAP' | 'OTHER' {
  return sharedDerivePlanType(planName);
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
      first_name: toTitleCase(row['First Name']) || null,
      last_name: toTitleCase(row['Last Name']) || null,
      middle_initial: row['Middle Initial'] || null,
      date_of_birth: normalizeDate(row['Date of Birth']),
      phone: normalizePhone(row['Phone Number']),
      email: null,
      address_line1: toTitleCase(row['Address Line 1']) || null,
      address_line2: toTitleCase(row['Address Line 2']) || null,
      address_city: toTitleCase(row['City']) || null,
      address_state: row['State'] || null,
      address_zip: row['Zip Code'] || null,
      effective_date: normalizeDate(row['Plan Effective Date']) || normalizeDate(row['Coverage Effective Date']),
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
      address_line2: null,
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
      address_line2: null,
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
      address_line2: null,
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
    address_line2: row.address_line2 ?? undefined,
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

## 3. Shared Client Dedup Logic

**File:** `supabase/functions/_shared/clientDedup.ts`

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
    // Determine incoming status from term_date
    const now = new Date();
    let incomingStatus: 'active' | 'termed' = 'active';
    if (row.term_date && new Date(row.term_date) < now) {
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
```

---

## 4. Carrier Detection (Frontend)

**File:** `src/lib/carrier-detection.ts`

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

## 5. Carrier Config

**File:** `src/config/carriers.ts`

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
  // COMING SOON CARRIERS
  // ============================================================
  {
    id: 'uhc',
    name: 'UnitedHealthcare',
    color: '#0ea5e9',
    portalUrl: 'https://www.uhc.com/broker',
    enabled: false,
  },
  {
    id: 'cigna',
    name: 'Cigna',
    color: '#ef4444',
    portalUrl: 'https://www.cigna.com/brokers',
    enabled: false,
  },
  {
    id: 'devoted',
    name: 'Devoted Health',
    color: '#ec4899',
    portalUrl: 'https://www.devoted.com',
    enabled: false,
  },
  {
    id: 'molina',
    name: 'Molina Healthcare',
    color: '#14b8a6',
    portalUrl: 'https://www.molinahealthcare.com',
    enabled: false,
  },
  {
    id: 'bcbs',
    name: 'Blue Cross Blue Shield',
    color: '#2563eb',
    portalUrl: 'https://www.bcbs.com',
    enabled: false,
  },
  {
    id: 'essence',
    name: 'Essence Healthcare',
    color: '#7c3aed',
    portalUrl: 'https://www.essencehealthcare.com',
    enabled: false,
  },
  {
    id: 'alignment',
    name: 'Alignment Health',
    color: '#06b6d4',
    portalUrl: 'https://www.alignmenthealthcare.com',
    enabled: false,
  },
  {
    id: 'amerihealth',
    name: 'AmeriHealth Caritas',
    color: '#0891b2',
    portalUrl: 'https://www.amerihealthcaritas.com',
    enabled: false,
  },
  {
    id: 'banner',
    name: 'Banner Health',
    color: '#059669',
    portalUrl: 'https://www.bannerhealth.com',
    enabled: false,
  },
  {
    id: 'bcbs_az',
    name: 'BCBS Arizona',
    color: '#2563eb',
    portalUrl: 'https://www.azblue.com',
    enabled: false,
  },
  {
    id: 'bcbs_il',
    name: 'BCBS Illinois',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsil.com',
    enabled: false,
  },
  {
    id: 'bcbs_mt',
    name: 'BCBS Montana',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsmt.com',
    enabled: false,
  },
  {
    id: 'bcbs_nm',
    name: 'BCBS New Mexico',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsnm.com',
    enabled: false,
  },
  {
    id: 'bcbs_ok',
    name: 'BCBS Oklahoma',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsok.com',
    enabled: false,
  },
  {
    id: 'bcbs_tx',
    name: 'BCBS Texas',
    color: '#2563eb',
    portalUrl: 'https://www.bcbstx.com',
    enabled: false,
  },
  {
    id: 'BCBS_MI',
    name: 'BCBS Michigan',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsm.com',
    enabled: false,
  },
  {
    id: 'care_partners',
    name: 'Care Partners',
    color: '#16a34a',
    portalUrl: 'https://www.carepartnershealthplan.com',
    enabled: false,
  },
  {
    id: 'CLOVER',
    name: 'Clover Health',
    color: '#22c55e',
    portalUrl: 'https://www.cloverhealth.com',
    enabled: false,
  },
  {
    id: 'connecticare',
    name: 'Connecticare',
    color: '#0d9488',
    portalUrl: 'https://www.connecticare.com',
    enabled: false,
  },
  {
    id: 'EMBLEM',
    name: 'EmblemHealth',
    color: '#4f46e5',
    portalUrl: 'https://www.emblemhealth.com',
    enabled: false,
  },
  {
    id: 'excellus',
    name: 'Excellus BCBS',
    color: '#2563eb',
    portalUrl: 'https://www.excellusbcbs.com',
    enabled: false,
  },
  {
    id: 'fl_blue',
    name: 'FL Blue',
    color: '#1d4ed8',
    portalUrl: 'https://www.floridablue.com',
    enabled: false,
  },
  {
    id: 'freedom',
    name: 'Freedom Health',
    color: '#dc2626',
    portalUrl: 'https://www.freedomhealth.com',
    enabled: false,
  },
  {
    id: 'geisinger',
    name: 'Geisinger',
    color: '#166534',
    portalUrl: 'https://www.geisinger.org',
    enabled: false,
  },
  {
    id: 'gold_kidney',
    name: 'Gold Kidney',
    color: '#ca8a04',
    portalUrl: 'https://www.goldkidneyhealth.com',
    enabled: false,
  },
  {
    id: 'GTL',
    name: 'GTL',
    color: '#475569',
    portalUrl: 'https://www.gtlic.com',
    enabled: false,
  },
  {
    id: 'health_first',
    name: 'Health First',
    color: '#0284c7',
    portalUrl: 'https://www.healthfirst.org',
    enabled: false,
  },
  {
    id: 'healthsun',
    name: 'HealthSun',
    color: '#f59e0b',
    portalUrl: 'https://www.healthsun.com',
    enabled: false,
  },
  {
    id: 'highmark',
    name: 'Highmark',
    color: '#1e40af',
    portalUrl: 'https://www.highmark.com',
    enabled: false,
  },
  {
    id: 'INDEPENDENCE',
    name: 'Independence Blue Cross',
    color: '#2563eb',
    portalUrl: 'https://www.ibx.com',
    enabled: false,
  },
  {
    id: 'jefferson',
    name: 'Jefferson Health Partners Plans',
    color: '#7c3aed',
    portalUrl: 'https://www.jeffersonhealth.org',
    enabled: false,
  },
  {
    id: 'medica',
    name: 'Medica',
    color: '#0891b2',
    portalUrl: 'https://www.medica.com',
    enabled: false,
  },
  {
    id: 'medigold',
    name: 'Medigold',
    color: '#eab308',
    portalUrl: 'https://www.medigold.com',
    enabled: false,
  },
  {
    id: 'NATIONWIDE',
    name: 'Nationwide',
    color: '#1e3a8a',
    portalUrl: 'https://www.nationwide.com',
    enabled: false,
  },
  {
    id: 'regence',
    name: 'Regence',
    color: '#1d4ed8',
    portalUrl: 'https://www.regence.com',
    enabled: false,
  },
  {
    id: 'scan',
    name: 'SCAN',
    color: '#0f766e',
    portalUrl: 'https://www.scanhealthplan.com',
    enabled: false,
  },
  {
    id: 'select_health',
    name: 'Select Health',
    color: '#15803d',
    portalUrl: 'https://www.selecthealth.org',
    enabled: false,
  },
  {
    id: 'silverscript',
    name: 'SilverScript',
    color: '#64748b',
    portalUrl: 'https://www.silverscript.com',
    enabled: false,
  },
  {
    id: 'UNITED_HOME',
    name: 'United Home Life',
    color: '#0369a1',
    portalUrl: 'https://www.unitedhomelife.com',
    enabled: false,
  },
  {
    id: 'upmc',
    name: 'UPMC Health Plan',
    color: '#4338ca',
    portalUrl: 'https://www.upmchealthplan.com',
    enabled: false,
  },
  {
    id: 'centene',
    name: 'Centene',
    color: '#f97316',
    portalUrl: 'https://www.centene.com',
    enabled: false,
  },
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

## 6. Carrier Import Guides

**File:** `src/config/carrierImportGuides.ts`

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
    steps: 'Agent Portal \u2192 Reports \u2192 Monthly Production Report \u2192 Export',
  },
  aetna: {
    portalName: 'Aetna Producer World',
    portalUrl: 'https://www.aetna.com/producer',
    steps: 'Producer World \u2192 Reports \u2192 Book of Business \u2192 Download CSV',
  },
  anthem: {
    portalName: 'Anthem Producer Toolkit',
    portalUrl: 'https://www.anthem.com/producer',
    steps: 'Producer Toolkit \u2192 My Book \u2192 Production Report \u2192 Export',
  },
  wellcare: {
    portalName: 'WellCare Provider Portal',
    portalUrl: 'https://www.wellcare.com/agent',
    steps: 'Agent Portal \u2192 Reports \u2192 Active Enrollment \u2192 Download',
  },
  uhc: {
    portalName: 'UHC Jarvis',
    portalUrl: 'https://jarvis.uhc.com',
    steps: 'Jarvis \u2192 My Production \u2192 Export Report',
  },
  devoted: {
    portalName: 'Devoted Health Broker Portal',
    portalUrl: 'https://broker.devoted.com',
    steps: 'Broker Portal \u2192 My Members \u2192 Export',
  },
};
```

---

## 7. Frontend Utilities (formatPhone, titleCase)

**File:** `src/lib/formatters.ts`

```typescript
// Phone number formatting - auto-formats as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

// SSN formatting - formats as XXX-XX-XXXX
export function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
}

/**
 * Format phone as (XXX) XXX-XXXX for display
 * Handles null/undefined gracefully
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';

  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Format 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if not 10 digits (might be international or malformed)
  return value;
}

/**
 * Strip phone to digits only (for storage/comparison)
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Format routing number - just limit to 9 digits
 */
export const formatRoutingNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

/**
 * Format account number - just limit to 17 digits (max for US accounts)
 */
export const formatAccountNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 17);
};

/**
 * Format NPN - just digits, max 10
 */
export const formatNPN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate routing number (basic checksum validation)
 */
export const isValidRoutingNumber = (routing: string): boolean => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return false;
  
  // ABA routing number checksum
  const checksum = 
    3 * (parseInt(digits[0]) + parseInt(digits[3]) + parseInt(digits[6])) +
    7 * (parseInt(digits[1]) + parseInt(digits[4]) + parseInt(digits[7])) +
    1 * (parseInt(digits[2]) + parseInt(digits[5]) + parseInt(digits[8]));
  
  return checksum % 10 === 0;
};

/**
 * Get bank name from routing number (common banks)
 */
export const getBankName = (routing: string): string | null => {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) return null;
  
  // Common bank routing numbers (first 4 digits identify region/bank)
  const bankMap: Record<string, string> = {
    '0210': 'JPMorgan Chase',
    '0220': 'JPMorgan Chase',
    '0260': 'Bank of America',
    '0420': 'PNC Bank',
    '0440': 'PNC Bank',
    '0530': 'US Bank',
    '0610': 'Wells Fargo',
    '0710': 'Wells Fargo',
    '0720': 'Wells Fargo',
    '0830': 'Fifth Third Bank',
    '0840': 'Fifth Third Bank',
    '1010': 'TD Bank',
    '1110': 'Capital One',
    '1210': 'Regions Bank',
    '1240': 'Republic Bank',
    '2420': 'Community Trust Bank',
    '2830': 'Truist',
    '3140': 'Ally Bank',
  };
  
  const prefix = digits.slice(0, 4);
  return bankMap[prefix] || null;
};

// EIN formatting - formats as XX-XXXXXXX
export function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  return `${limited.slice(0, 2)}-${limited.slice(2)}`;
}

// Mask SSN for display - shows only last 4 digits
export function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `•••-••-${digits.slice(-4)}`;
}

// Mask EIN for display - shows only last 4 digits  
export function maskEIN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `••-•••${digits.slice(-4)}`;
}

// Get raw digits from formatted value
export function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

// ZIP code formatting - 5 digits or ZIP+4 (XXXXX or XXXXX-XXXX)
export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 5) return limited;
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
}

// Validate ZIP code (5 digits or ZIP+4)
export function isValidZipCode(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 5 || digits.length === 9;
}
```

---

## 8. Book Types

**File:** `src/types/book.ts`

```typescript
// Book of Business types — adapted to existing schema
// Tables: clients, policies (carrier_id FK), client_interactions, client_risk_flags, monthly_syncs, commission_rates

export interface BookClient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  last_contacted_at: string | null;
  // Client lifecycle
  status?: string;
  lead_source?: string | null;
  created_at?: string | null;
  // Joined from latest active policy
  carrier_id?: string;
  carrier_name?: string;
  plan_name?: string;
  plan_type?: string | null;
  effective_date?: string;
  policy_status?: string;
  // Joined from risk flags
  flag_type?: string | null;
  flag_title?: string | null;
  flag_severity?: string | null;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  profile_id: string;
  interaction_type: string;
  outcome: string | null;
  notes: string | null;
  follow_up_date: string | null;
  follow_up_completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface ClientRiskFlag {
  id: string;
  client_id: string;
  flag_type: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  source: string;
  expires_at: string | null;
  created_at: string;
}

export interface BookSummary {
  total_contacts: number;
  active_clients: number;
  total_policies: number;
  active_policies: number;
  total_annual_renewal: number;
  clients_needing_attention: number;
  retention_rate: number;
  new_this_month: number;
  growth_rate: number;
  total_termed_12m: number;
  months_of_data: number;
}

export interface MonthlyGrowth {
  month: string;
  total_clients: number;
  new_clients: number;
  termed_clients: number;
  net_change: number;
}

export interface CarrierIncome {
  carrier_id: string;
  carrier_name: string;
  policies: number;
  income: number;
  percentage: number;
  color: string;
}

export interface CarrierBreakdownItem {
  carrier_id: string;
  carrier_name: string;
  count: number;
  percentage: number;
  color: string;
}

export type InteractionType = 'call' | 'email' | 'text' | 'meeting' | 'note' | 'follow_up_scheduled' | 'follow_up_completed';
export type InteractionOutcome = 'reached' | 'voicemail' | 'no_answer' | 'wrong_number' | 'completed' | 'cancelled';
export type NoteTag = 'service_call' | 'plan_question' | 'retention' | 'complaint' | 'general';

// Map note tags to interaction_type + outcome for the DB
export const NOTE_TAG_TO_INTERACTION: Record<NoteTag, { type: InteractionType; outcome?: InteractionOutcome }> = {
  service_call: { type: 'call', outcome: 'reached' },
  plan_question: { type: 'call', outcome: 'reached' },
  retention: { type: 'note' },
  complaint: { type: 'note' },
  general: { type: 'note' },
};

// Carrier brand colors — keyed by carrier name (lowercase for matching)
export const CARRIER_COLORS: Record<string, string> = {
  humana: '#2D8B4E',
  aetna: '#1E6B4E',
  anthem: '#3B6FB5',
  wellcare: '#B8963E',
  devoted: '#E25555',
  uhc: '#2B3990',
  'united healthcare': '#2B3990',
  cigna: '#0072CE',
  centene: '#6B4C9A',
};

export function getCarrierColor(carrierName: string): string {
  const key = carrierName.toLowerCase();
  for (const [pattern, color] of Object.entries(CARRIER_COLORS)) {
    if (key.includes(pattern)) return color;
  }
  return '#8B7E6A'; // fallback muted color
}

// Commission rate defaults per plan type (annual renewal per policy)
export const PLAN_TYPE_RENEWAL: Record<string, number> = {
  MA: 347,
  MAPD: 347,
  PDP: 47,
  MEDIGAP: 800,
  OTHER: 37,
};

// Flag display config
export const FLAG_CONFIG: Record<string, { color: string; bg: string; label: string; short: string }> = {
  no_contact_90: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Overdue follow-up (90+ days)', short: 'Overdue' },
  no_contact_180: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'No contact in 180+ days', short: 'Overdue' },
  birthday_upcoming: { color: '#C8A951', bg: 'rgba(200,169,81,0.1)', label: 'Birthday this week', short: 'Birthday' },
  anniversary_upcoming: { color: '#C8A951', bg: 'rgba(200,169,81,0.1)', label: 'Anniversary upcoming', short: 'Anniversary' },
  aep_review_needed: { color: '#3B6FB5', bg: 'rgba(59,111,181,0.1)', label: 'AEP review needed', short: 'AEP Review' },
  plan_benefit_cut: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Plan benefit cut', short: 'Benefit Cut' },
  carrier_exit: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Carrier exiting market', short: 'Carrier Exit' },
  plan_discontinued: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Plan discontinued', short: 'Discontinued' },
  // Generic fallbacks for callback/attention-style flags
  callback: { color: '#3B6FB5', bg: 'rgba(59,111,181,0.1)', label: 'Scheduled callback', short: 'Callback' },
  attention: { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: 'Needs attention', short: 'Attention' },
};

export function getFlagConfig(flagType: string) {
  return FLAG_CONFIG[flagType] || { color: '#C75A3A', bg: 'rgba(199,90,58,0.1)', label: flagType, short: 'Flag' };
}
```

---

## 9. Import Status Hook

**File:** `src/hooks/useImportStatus.ts`

```typescript
// Provides carrier sync status for the Import page grid
// and pending batch detection for resume.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CarrierSyncStatus {
  carrierId: string;
  carrierCode: string;
  carrierName: string;
  brandColor: string;
  clientCount: number;
  isSyncedThisMonth: boolean;
  lastSyncDate: string | null;
  lastSyncFileName: string | null;
  lastSyncStats: { newRecords: number; updatedRecords: number } | null;
}

export interface PendingBatch {
  id: string;
  fileName: string;
  status: string;
  sourceFormat: string;
  detectedFormat: string | null;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  termedRecords: number;
  skipDetails: { row: number; reason: string }[];
  formatMismatch: boolean;
  mismatchDetectedCarrier: string | null;
  carrierId: string | null;
  createdAt: string;
}

const BRAND_COLORS: Record<string, string> = {
  humana: '#3A9A34',
  aetna: '#6B2580',
  anthem: '#0033A0',
  uhc: '#002677',
  wellcare: '#007A72',
  devoted: '#B8292F',
};

export function useImportStatus() {
  const { profile } = useAuth();
  const profileId = profile?.id ? String(profile.id) : null;

  const carriersQuery = useQuery({
    queryKey: ['import-status', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get carriers from agent's policies (distinct carrier_id)
      const { data: policyCarriers } = await supabase
        .from('policies')
        .select('carrier_id, carriers(id, name, code)')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      // Deduplicate carriers
      const carrierMap = new Map<string, { id: string; name: string; code: string }>();
      if (policyCarriers) {
        for (const pc of policyCarriers) {
          const carrier = pc.carriers as any;
          if (carrier?.id && !carrierMap.has(String(carrier.id))) {
            carrierMap.set(String(carrier.id), {
              id: String(carrier.id),
              name: carrier.name || carrier.code,
              code: carrier.code || '',
            });
          }
        }
      }

      const carriers = Array.from(carrierMap.values());

      // Get committed batches for this month
      const { data: monthBatches } = await supabase
        .from('book_import_batches')
        .select('carrier_id, file_name, new_records, updated_records, committed_at')
        .eq('profile_id', profileId)
        .eq('status', 'committed')
        .not('carrier_id', 'is', null)
        .gte('created_at', monthStart)
        .order('committed_at', { ascending: false });

      // Get client counts per carrier
      const { data: clientCounts } = await supabase
        .from('policies')
        .select('carrier_id')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      const countMap = new Map<string, number>();
      if (clientCounts) {
        for (const p of clientCounts) {
          const cid = String(p.carrier_id);
          countMap.set(cid, (countMap.get(cid) || 0) + 1);
        }
      }

      // Build batch lookup (first = most recent)
      const batchMap = new Map<string, any>();
      if (monthBatches) {
        for (const b of monthBatches) {
          const cid = String(b.carrier_id);
          if (!batchMap.has(cid)) batchMap.set(cid, b);
        }
      }

      return carriers.map((c): CarrierSyncStatus => {
        const batch = batchMap.get(c.id);
        return {
          carrierId: c.id,
          carrierCode: c.code,
          carrierName: c.name,
          brandColor: BRAND_COLORS[c.code?.toLowerCase()] || '#A89A84',
          clientCount: countMap.get(c.id) || 0,
          isSyncedThisMonth: !!batch,
          lastSyncDate: batch?.committed_at || null,
          lastSyncFileName: batch?.file_name || null,
          lastSyncStats: batch ? {
            newRecords: batch.new_records || 0,
            updatedRecords: batch.updated_records || 0,
          } : null,
        };
      });
    },
    enabled: !!profileId,
    staleTime: 30_000,
  });

  // Check for pending batches (resume detection)
  const pendingQuery = useQuery({
    queryKey: ['import-pending', profileId],
    queryFn: async (): Promise<PendingBatch | null> => {
      if (!profileId) return null;

      const { data, error } = await supabase.functions.invoke('import-book-of-business', {
        body: { action: 'check_pending', profileId },
      });

      if (error || !data?.pending) return null;

      const p = data.pending;
      return {
        id: p.id,
        fileName: p.file_name,
        status: p.status,
        sourceFormat: p.source_format,
        detectedFormat: p.detected_format,
        totalRecords: p.total_records || 0,
        newRecords: p.new_records || 0,
        updatedRecords: p.updated_records || 0,
        skippedRecords: p.skipped_records || 0,
        termedRecords: p.termed_records || 0,
        skipDetails: p.skip_details || [],
        formatMismatch: p.format_mismatch || false,
        mismatchDetectedCarrier: p.mismatch_detected_carrier,
        carrierId: p.carrier_id ? String(p.carrier_id) : null,
        createdAt: p.created_at,
      };
    },
    enabled: !!profileId,
    staleTime: 60_000,
  });

  return {
    carriers: carriersQuery.data ?? [],
    pendingBatch: pendingQuery.data ?? null,
    isLoading: carriersQuery.isLoading,
    refetch: carriersQuery.refetch,
  };
}
```

---

## 10. Sync Library

**File:** `src/lib/sync.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

// Milestone thresholds
const MILESTONES = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

export interface SyncStatus {
  required: boolean;
  isNew: boolean;
  /** True if agent has no contracted carriers at all */
  notContracted?: boolean;
  currentSync?: {
    id: string;
    month: string;
    status: string;
    started_at: string | null;
  };
}

export interface CarrierUploadStatus {
  id: string;
  carrier_id: string;
  carrier_code: string;
  carrier_name: string;
  status: 'pending' | 'uploading' | 'complete';
  client_count: number | null;
  previous_count: number | null;
  uploaded_at: string | null;
}

export interface SyncResult {
  totalClients: number;
  delta: number;
  milestone: number | null;
  nextMilestone: number | null;
}

// Get current month as YYYY-MM-01 for DB queries
function getCurrentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Get previous month as YYYY-MM-01
function getPreviousMonthDate(): string {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Check if sync is required for the current month
 */
export async function checkSyncStatus(profileId: string): Promise<SyncStatus> {
  // First check if agent has any contracted carriers
  const { data: contractedCarriers, error: contractedError } = await supabase
    .from('carrier_statuses')
    .select('carrier_id')
    .eq('profile_id', profileId)
    .eq('contracting_status', 'contracted')
    .limit(1);

  if (contractedError) {
    console.error('Error checking contracted carriers:', contractedError);
    throw contractedError;
  }

  // No contracted carriers at all - show "not contracted" state
  // This is different from isNew (which means contracted but hasn't selected what to track)
  if (!contractedCarriers || contractedCarriers.length === 0) {
    return { required: false, isNew: true, notContracted: true };
  }

  // Skip the agent_carriers check - we'll use contracted carriers directly
  // and auto-populate agent_carriers on first sync

  const currentMonth = getCurrentMonthDate();
  const dayOfMonth = new Date().getDate();

  // Check for existing sync this month
  const { data: existingSync, error: syncError } = await supabase
    .from('monthly_syncs')
    .select('id, month, status, started_at')
    .eq('profile_id', profileId)
    .eq('month', currentMonth)
    .single();

  if (syncError && syncError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error checking sync status:', syncError);
    throw syncError;
  }

  // If sync exists and is complete, no sync required
  if (existingSync?.status === 'complete') {
    return { required: false, isNew: false };
  }

  // If we're before the 5th of the month, don't force sync
  // (but if they have an in-progress sync, show it)
  if (dayOfMonth < 5 && !existingSync) {
    return { required: false, isNew: false };
  }

  // Sync is required (either pending/in-progress or needs to be created)
  return {
    required: true,
    isNew: false,
    currentSync: existingSync
      ? {
          id: existingSync.id,
          month: existingSync.month,
          status: existingSync.status,
          started_at: existingSync.started_at,
        }
      : undefined,
  };
}

/**
 * Initialize or get existing sync for current month
 */
export async function initializeSync(profileId: string): Promise<{
  syncId: string;
  previousMonthClients: number;
}> {
  const currentMonth = getCurrentMonthDate();

  // Check for existing sync
  const { data: existingSync } = await supabase
    .from('monthly_syncs')
    .select('id, previous_month_clients')
    .eq('profile_id', profileId)
    .eq('month', currentMonth)
    .single();

  if (existingSync) {
    return {
      syncId: existingSync.id,
      previousMonthClients: existingSync.previous_month_clients || 0,
    };
  }

  // Get previous month's client count
  const previousStats = await getPreviousMonthStats(profileId);

  // Create new sync record
  const { data: newSync, error: createError } = await supabase
    .from('monthly_syncs')
    .insert({
      profile_id: profileId,
      month: currentMonth,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      previous_month_clients: previousStats.totalClients,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating sync:', createError);
    throw createError;
  }

  // Get agent's carriers (or fall back to contracted carriers for new agents)
  let { data: agentCarriers } = await supabase
    .from('agent_carriers')
    .select('carrier_id')
    .eq('profile_id', profileId);

  // If no agent_carriers yet, use contracted carriers
  if (!agentCarriers || agentCarriers.length === 0) {
    const { data: contracted } = await supabase
      .from('carrier_statuses')
      .select('carrier_id')
      .eq('profile_id', profileId)
      .eq('contracting_status', 'contracted');

    agentCarriers = contracted || [];

    // Auto-populate agent_carriers for future syncs
    if (agentCarriers.length > 0) {
      await supabase
        .from('agent_carriers')
        .upsert(
          agentCarriers.map((c) => ({
            profile_id: profileId,
            carrier_id: c.carrier_id,
          })),
          { onConflict: 'profile_id,carrier_id', ignoreDuplicates: true }
        );
    }
  }

  // Create carrier upload placeholders with previous counts
  if (agentCarriers && agentCarriers.length > 0) {
    const carrierUploads = await Promise.all(
      agentCarriers.map(async (ac) => {
        const prevCount = previousStats.carrierCounts[ac.carrier_id] || 0;
        return {
          sync_id: newSync.id,
          carrier_id: ac.carrier_id,
          previous_count: prevCount,
        };
      })
    );

    await supabase.from('sync_carrier_uploads').insert(carrierUploads);
  }

  return {
    syncId: newSync.id,
    previousMonthClients: previousStats.totalClients,
  };
}

/**
 * Get carrier upload status for a sync
 */
export async function getCarrierUploadStatus(
  syncId: string
): Promise<CarrierUploadStatus[]> {
  const { data, error } = await supabase
    .from('sync_carrier_uploads')
    .select(
      `
      id,
      carrier_id,
      client_count,
      previous_count,
      uploaded_at,
      carriers (code, name)
    `
    )
    .eq('sync_id', syncId);

  if (error) {
    console.error('Error getting carrier upload status:', error);
    throw error;
  }

  return (data || []).map((row) => {
    const carrier = row.carriers as { code: string; name: string } | null;
    return {
      id: row.id,
      carrier_id: row.carrier_id,
      carrier_code: carrier?.code || '',
      carrier_name: carrier?.name || '',
      status: row.uploaded_at ? 'complete' : 'pending',
      client_count: row.client_count,
      previous_count: row.previous_count,
      uploaded_at: row.uploaded_at,
    };
  });
}

/**
 * Complete a carrier upload within a sync
 */
export async function completeSyncUpload(
  syncId: string,
  carrierId: string,
  uploadId: string,
  clientCount: number
): Promise<{ allComplete: boolean; runningTotal: number }> {
  // Update the carrier upload record
  const { error: updateError } = await supabase
    .from('sync_carrier_uploads')
    .update({
      production_upload_id: uploadId,
      client_count: clientCount,
      uploaded_at: new Date().toISOString(),
    })
    .eq('sync_id', syncId)
    .eq('carrier_id', carrierId);

  if (updateError) {
    console.error('Error updating sync upload:', updateError);
    throw updateError;
  }

  // Get all carrier uploads with carrier codes to check completion status
  const supportedCodes = ['aetna', 'wellcare', 'humana', 'anthem'];

  const { data: uploads } = await supabase
    .from('sync_carrier_uploads')
    .select('carrier_id, client_count, uploaded_at, carriers!inner(code)')
    .eq('sync_id', syncId);

  // Filter to only supported carriers
  const supportedUploads = uploads?.filter(u =>
    supportedCodes.includes((u.carriers as { code: string })?.code?.toLowerCase())
  ) || [];

  const completedUploads = supportedUploads.filter((u) => u.uploaded_at);
  const allComplete = supportedUploads.length > 0 &&
    completedUploads.length === supportedUploads.length;
  const runningTotal = completedUploads.reduce(
    (sum, u) => sum + (u.client_count || 0),
    0
  );

  console.log('completeSyncUpload check:', {
    totalUploads: uploads?.length,
    supportedUploads: supportedUploads.length,
    completedUploads: completedUploads.length,
    allComplete,
  });

  return { allComplete, runningTotal };
}

/**
 * Clear a single carrier upload from a sync
 */
export async function clearCarrierUpload(syncId: string, carrierId: string): Promise<void> {
  const { error } = await supabase
    .from('sync_carrier_uploads')
    .update({
      client_count: null,
      uploaded_at: null,
      production_upload_id: null,
    })
    .eq('sync_id', syncId)
    .eq('carrier_id', carrierId);

  if (error) {
    console.error('Error clearing carrier upload:', error);
    throw error;
  }
}

/**
 * Check for newly crossed milestones and award them.
 * Extracted so SyncFlow.tsx can call this without duplicating the
 * monthly_syncs / profiles writes that completeSync also does.
 */
export async function checkAndAwardMilestones(
  profileId: string,
  totalClients: number,
  syncId: string
): Promise<{ achieved: number | null; next: number | null }> {
  let achievedMilestone: number | null = null;
  let nextMilestone: number | null = null;

  for (const milestone of MILESTONES) {
    if (totalClients >= milestone) {
      // Check if this milestone was already achieved
      const { data: existing } = await supabase
        .from('milestones')
        .select('id')
        .eq('profile_id', profileId)
        .eq('milestone_type', 'client_count')
        .eq('milestone_value', milestone)
        .single();

      if (!existing) {
        // New milestone achieved!
        await supabase.from('milestones').insert({
          profile_id: profileId,
          milestone_type: 'client_count',
          milestone_value: milestone,
          sync_id: syncId,
        });
        achievedMilestone = milestone;
      }
    } else {
      // This is the next milestone to reach
      nextMilestone = milestone;
      break;
    }
  }

  return { achieved: achievedMilestone, next: nextMilestone };
}

/**
 * Finalize a sync and check for milestones.
 * @deprecated Use SyncFlow's handleCompleteSync instead — this function
 * sums carrier counts without cross-carrier dedup, inflating the total.
 * Kept for backward compatibility but should not be used for new code.
 */
export async function completeSync(
  syncId: string,
  profileId: string
): Promise<SyncResult> {
  // Get total from carrier uploads
  const { data: uploads } = await supabase
    .from('sync_carrier_uploads')
    .select('client_count')
    .eq('sync_id', syncId);

  const totalClients = uploads?.reduce((sum, u) => sum + (u.client_count || 0), 0) || 0;

  // Get previous month total from sync record
  const { data: syncRecord } = await supabase
    .from('monthly_syncs')
    .select('previous_month_clients')
    .eq('id', syncId)
    .single();

  const previousTotal = syncRecord?.previous_month_clients || 0;
  const delta = totalClients - previousTotal;

  // Update sync as complete
  await supabase
    .from('monthly_syncs')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      total_clients: totalClients,
    })
    .eq('id', syncId);

  // Update profile's last_sync_at timestamp
  await supabase
    .from('profiles')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', profileId);

  // Check for milestone (reuses extracted helper)
  const { achieved: achievedMilestone, next: nextMilestone } =
    await checkAndAwardMilestones(profileId, totalClients, syncId);

  return {
    totalClients,
    delta,
    milestone: achievedMilestone,
    nextMilestone,
  };
}

/**
 * Get previous month's stats for comparison
 */
export async function getPreviousMonthStats(profileId: string): Promise<{
  totalClients: number;
  carrierCounts: Record<string, number>;
}> {
  const previousMonth = getPreviousMonthDate();

  // Try to get from previous sync first
  const { data: prevSync } = await supabase
    .from('monthly_syncs')
    .select(
      `
      total_clients,
      sync_carrier_uploads (carrier_id, client_count)
    `
    )
    .eq('profile_id', profileId)
    .eq('month', previousMonth)
    .eq('status', 'complete')
    .single();

  if (prevSync) {
    const carrierCounts: Record<string, number> = {};
    const uploads = prevSync.sync_carrier_uploads as Array<{
      carrier_id: string;
      client_count: number;
    }>;
    uploads?.forEach((u) => {
      carrierCounts[u.carrier_id] = u.client_count || 0;
    });
    return {
      totalClients: prevSync.total_clients || 0,
      carrierCounts,
    };
  }

  // Fallback: count from policies table
  const { data: policies } = await supabase
    .from('policies')
    .select('carrier_id')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  const carrierCounts: Record<string, number> = {};
  policies?.forEach((p) => {
    carrierCounts[p.carrier_id] = (carrierCounts[p.carrier_id] || 0) + 1;
  });

  const totalClients = Object.values(carrierCounts).reduce((sum, c) => sum + c, 0);

  return { totalClients, carrierCounts };
}

/**
 * Add carriers for an agent
 */
export async function addAgentCarriers(
  profileId: string,
  carrierIds: string[]
): Promise<void> {
  const records = carrierIds.map((carrierId) => ({
    profile_id: profileId,
    carrier_id: carrierId,
  }));

  const { error } = await supabase.from('agent_carriers').insert(records);

  if (error) {
    console.error('Error adding agent carriers:', error);
    throw error;
  }
}

/**
 * Get all active carriers
 * @deprecated NewAgentSetup now fetches contracted carriers directly from carrier_statuses
 */
export async function getSupportedCarriers(): Promise<
  Array<{ id: string; code: string; name: string }>
> {
  const { data, error } = await supabase
    .from('carriers')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error getting carriers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get contracted carriers for a specific agent
 */
export async function getContractedCarriers(
  profileId: string
): Promise<Array<{ id: string; code: string; name: string }>> {
  const { data, error } = await supabase
    .from('carrier_statuses')
    .select(`
      carrier_id,
      carriers (id, code, name)
    `)
    .eq('profile_id', profileId)
    .eq('contracting_status', 'contracted');

  if (error) {
    console.error('Error getting contracted carriers:', error);
    throw error;
  }

  return (data || [])
    .filter((cs) => cs.carriers)
    .map((cs) => {
      const carrier = cs.carriers as { id: string; code: string; name: string };
      return carrier;
    });
}

/**
 * Format month name from date
 */
export function getMonthName(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get previous month name
 */
export function getPreviousMonthName(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prev.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get next recommended sync date (7th of month when carrier reports are available)
 * - Before the 7th: sync this month
 * - On or after the 7th: sync next month
 */
export function getNextSyncDate(): string {
  const now = new Date();
  const day = now.getDate();
  const targetDay = 7;

  if (day < targetDay) {
    // Before 7th: sync this month
    return new Date(now.getFullYear(), now.getMonth(), targetDay)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } else {
    // On or after 7th: sync next month
    return new Date(now.getFullYear(), now.getMonth() + 1, targetDay)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
}
```

---

## 11. Dashboard Data Hook

**File:** `src/hooks/useDashboardData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { MILESTONES } from '@/components/dashboard/NextGoalCard';

// Carrier color mapping
const CARRIER_COLORS: Record<string, string> = {
  humana: 'bg-emerald-500',
  aetna: 'bg-purple-500',
  anthem: 'bg-blue-500',
  wellcare: 'bg-amber-500',
  cigna: 'bg-red-500',
  unitedhealthcare: 'bg-sky-500',
  uhc: 'bg-sky-500',
  centene: 'bg-orange-500',
  // Add more as needed
};

function getCarrierColor(carrierCode: string): string {
  const normalizedCode = carrierCode.toLowerCase().replace(/[^a-z]/g, '');
  return CARRIER_COLORS[normalizedCode] || 'bg-slate-500';
}

/**
 * Determine sync status based on last sync date
 * Uses the "7th of the month" rule - if we're past the 7th and haven't synced this month, it's stale
 */
function determineSyncStatus(lastSyncAt: string | null): 'synced' | 'stale' | 'never' {
  if (!lastSyncAt) return 'never';

  const lastSync = new Date(lastSyncAt);
  const now = new Date();

  // Get current month's 7th
  const currentMonth7th = new Date(now.getFullYear(), now.getMonth(), 7);

  // If we're past the 7th of this month
  if (now.getDate() > 7) {
    // Stale if last sync was before this month's 7th
    if (lastSync < currentMonth7th) {
      return 'stale';
    }
  } else {
    // Before the 7th - check if synced this month or last month after the 7th
    const lastMonth7th = new Date(now.getFullYear(), now.getMonth() - 1, 7);
    if (lastSync < lastMonth7th) {
      return 'stale';
    }
  }

  return 'synced';
}

export interface CarrierData {
  id: string;
  code: string;
  name: string;
  count: number;
  color: string;
}

export interface DashboardData {
  // Profile
  profileId: string;
  firstName: string;
  fullName: string | null;
  initials: string;

  // Book metrics
  totalClients: number;
  newThisMonth: number;
  termedThisMonth: number;
  netChange: number;
  growthStreak: number;
  monthlyHistory: number[];
  carriers: CarrierData[];

  // Milestones
  milestonesHit: number[];
  nextMilestone: number;
  lastMilestone: number;
  projectedDate?: string;
  avgNewPerMonth?: number;
  bestMonth?: { month: string; count: number };

  // Sync status
  syncStatus: 'synced' | 'stale' | 'never';
  lastSyncAt: string | null;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and compute all dashboard data
 * Parallelizes both Supabase queries for faster loading
 */
async function fetchDashboardData(
  profileId: string,
  profileFullName: string | null
): Promise<DashboardData> {
  // Run BOTH queries in parallel for faster loading
  const [syncHistoryResult, carrierDataResult] = await Promise.all([
    // Query 1: All completed syncs for history and calculations
    supabase
      .from('monthly_syncs')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'complete')
      .order('month', { ascending: true }),

    // Query 2: Live carrier breakdown + book count from active policies
    // Also used to derive liveActiveCount (unique client_ids)
    supabase
      .from('policies')
      .select('carrier_id, client_id, carriers(id, code, name)')
      .eq('profile_id', profileId)
      .eq('status', 'active'),
  ]);

  if (syncHistoryResult.error) throw syncHistoryResult.error;

  const syncHistory = syncHistoryResult.data || [];

  // Calculate metrics from sync history
  let totalClients = 0;
  let newThisMonth = 0;
  let termedThisMonth = 0;
  let netChange = 0;
  let lastSyncAt: string | null = null;
  const monthlyHistory: number[] = [];
  let growthStreak = 0;
  let avgNewPerMonth: number | undefined;
  let bestMonth: { month: string; count: number } | undefined;

  // Live active book count = unique clients with active policies (derived from Query 2)
  const liveActiveCount = carrierDataResult.data
    ? new Set((carrierDataResult.data as any[]).map((p: any) => p.client_id)).size
    : 0;

  if (syncHistory.length > 0) {
    // Get last 6 months for sparkline
    const recentSyncs = syncHistory.slice(-6);
    monthlyHistory.push(...recentSyncs.map((s) => s.total_clients || 0));

    // Latest sync data
    const latest = syncHistory[syncHistory.length - 1];
    // Use live policy count as the hero number (most accurate), fall back to sync snapshot
    totalClients = liveActiveCount > 0 ? liveActiveCount : (latest.total_clients || 0);
    // Use stored new_clients (based on effective_date) instead of delta calculation
    newThisMonth = latest.new_clients || 0;
    termedThisMonth = latest.termed_clients || 0;
    netChange = latest.net_change ?? (newThisMonth - termedThisMonth);
    lastSyncAt = latest.completed_at || latest.created_at;

    // Calculate growth streak (consecutive months of positive growth)
    for (let i = syncHistory.length - 1; i > 0; i--) {
      const current = syncHistory[i].total_clients || 0;
      const previous = syncHistory[i - 1].total_clients || 0;
      if (current > previous) {
        growthStreak++;
      } else {
        break;
      }
    }

    // Calculate average new per month
    let totalGrowth = 0;
    let growthMonths = 0;
    for (let i = 1; i < syncHistory.length; i++) {
      const diff = (syncHistory[i].total_clients || 0) - (syncHistory[i - 1].total_clients || 0);
      if (diff > 0) {
        totalGrowth += diff;
        growthMonths++;
      }
    }
    avgNewPerMonth = growthMonths > 0 ? Math.round(totalGrowth / growthMonths) : undefined;

    // Find best month
    let maxGrowth = 0;
    for (let i = 1; i < syncHistory.length; i++) {
      const diff = (syncHistory[i].total_clients || 0) - (syncHistory[i - 1].total_clients || 0);
      if (diff > maxGrowth) {
        maxGrowth = diff;
        const monthDate = new Date(syncHistory[i].month);
        bestMonth = {
          month: monthDate.toLocaleDateString('en-US', { month: 'long' }),
          count: diff,
        };
      }
    }
  }

  // If no sync history but we have active policies, still show the live count
  if (syncHistory.length === 0 && liveActiveCount > 0) {
    totalClients = liveActiveCount;
  }

  // Determine sync status using the 7th-of-month rule
  const syncStatus = determineSyncStatus(lastSyncAt);

  // Process carrier breakdown from live policy data
  // Count unique clients per carrier (a client with 2 plan types at same carrier = 1)
  const carriers: CarrierData[] = [];
  if (carrierDataResult.data) {
    const carrierClientSets = new Map<string, { id: string; code: string; name: string; clients: Set<string> }>();
    for (const p of carrierDataResult.data as any[]) {
      const c = p.carriers;
      if (!c?.id) continue;
      const key = String(c.id);
      const existing = carrierClientSets.get(key);
      if (existing) {
        existing.clients.add(p.client_id);
      } else {
        carrierClientSets.set(key, {
          id: key,
          code: c.code,
          name: c.name,
          clients: new Set([p.client_id]),
        });
      }
    }
    for (const c of carrierClientSets.values()) {
      carriers.push({
        id: c.id,
        code: c.code,
        name: c.name,
        count: c.clients.size,
        color: getCarrierColor(c.code),
      });
    }
    carriers.sort((a, b) => b.count - a.count);
  }

  // Calculate milestones
  const milestonesHit = MILESTONES.filter((m) => m <= totalClients);
  const nextMilestone = MILESTONES.find((m) => m > totalClients) || totalClients + 100;
  const lastMilestone = milestonesHit.length > 0 ? milestonesHit[milestonesHit.length - 1] : 0;

  // Project date to next milestone
  let projectedDate: string | undefined;
  if (avgNewPerMonth && avgNewPerMonth > 0) {
    const toGoal = nextMilestone - totalClients;
    const monthsToGoal = Math.ceil(toGoal / avgNewPerMonth);
    const projDate = new Date();
    projDate.setMonth(projDate.getMonth() + monthsToGoal);
    projectedDate = projDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Build profile data
  const firstName = profileFullName?.split(' ')[0] || 'Agent';
  const initials = profileFullName
    ? profileFullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AG';

  return {
    profileId,
    firstName,
    fullName: profileFullName,
    initials,
    totalClients,
    newThisMonth,
    termedThisMonth,
    netChange,
    growthStreak,
    monthlyHistory,
    carriers,
    milestonesHit,
    nextMilestone,
    lastMilestone,
    projectedDate,
    avgNewPerMonth,
    bestMonth,
    syncStatus,
    lastSyncAt,
  };
}

/**
 * useDashboardData - Fetches and computes all dashboard data with caching
 *
 * Uses React Query for:
 * - Automatic caching (5 minute stale time)
 * - No refetch on tab switch
 * - Instant data on navigation back to dashboard
 *
 * Sources:
 * - Profile from useProfile/useAuth
 * - Book data from monthly_syncs table
 * - Carrier breakdown from live policies table
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { profile, loading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['dashboard', profile?.id],
    queryFn: () => fetchDashboardData(profile!.id, profile!.full_name),
    enabled: !!profile?.id && !profileLoading,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading || profileLoading,
    error: query.error as Error | null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
```

---

## 12. Book Summary Hook

**File:** `src/hooks/useBookSummary.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookSummary } from '@/types/book';
import { PLAN_TYPE_RENEWAL } from '@/types/book';

export function useBookSummary() {
  const { profile } = useAuth();

  return useQuery<BookSummary>({
    queryKey: ['book-summary', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const profileId = profile!.id;

      // Parallel fetches for all summary data
      const [clientsRes, policiesRes, syncsRes] = await Promise.all([
        // All clients (for total count)
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),

        // All policies with plan type
        supabase
          .from('policies')
          .select('id, status, plan_type, client_id')
          .eq('profile_id', profileId),

        // Monthly syncs ordered descending (most recent first)
        supabase
          .from('monthly_syncs')
          .select('month, total_clients, new_clients, termed_clients, net_change')
          .eq('profile_id', profileId)
          .eq('status', 'complete')
          .order('month', { ascending: false })
          .limit(13),
      ]);

      const totalClients = clientsRes.count ?? 0;
      const policies = (policiesRes.data as any[]) || [];
      const activePolicies = policies.filter(p => p.status === 'active');
      const syncs = (syncsRes.data as any[]) || [];

      console.log('[useBookSummary] querying profile_id:', profileId);
      console.log('[useBookSummary] raw results:', {
        totalClients,
        policiesCount: policies.length,
        activePoliciesCount: activePolicies.length,
        syncsCount: syncs.length,
        clientsError: clientsRes.error,
        policiesError: policiesRes.error,
        syncsError: syncsRes.error,
      });

      // IMPORTANT: Two different counts exist:
      // - totalClients (returned as total_contacts): ALL client records in the clients table (553)
      //   Includes Connecture/SunFire contacts that may not have any carrier policy.
      // - activeClients: Unique clients with at least one active policy in the policies table (204)
      //   THIS is the real book size. Use this for hero numbers, milestones, and growth metrics.
      const clientsWithActivePolicy = new Set(activePolicies.map(p => p.client_id));
      const activeClients = clientsWithActivePolicy.size;

      // Annual renewal from active policies
      let totalAnnualRenewal = 0;
      activePolicies.forEach(p => {
        const planType = (p.plan_type || 'OTHER').toUpperCase();
        const rate = PLAN_TYPE_RENEWAL[planType] || PLAN_TYPE_RENEWAL.OTHER;
        totalAnnualRenewal += rate;
      });

      // --- Growth & retention from monthly syncs ---
      const currentMonth = syncs[0]; // most recent
      const newThisMonth = currentMonth?.new_clients ?? 0;

      // Total termed across all available sync months
      const totalTermed = syncs.reduce((sum: number, s: any) => sum + (s.termed_clients ?? 0), 0);

      // Growth rate: compare current to earliest available data point
      // syncs are descending, so last element is the oldest
      const earliestSync = syncs.length > 1 ? syncs[syncs.length - 1] : null;
      const currentTotal = currentMonth?.total_clients ?? activeClients;
      const earliestTotal = earliestSync?.total_clients ?? 0;
      const monthsSpan = syncs.length;

      let growthRate = 0;
      if (earliestTotal > 0 && earliestTotal !== currentTotal && monthsSpan >= 3) {
        const raw = ((currentTotal - earliestTotal) / earliestTotal) * 100;
        // Sanity check: if growth is negative but no clients were termed,
        // the sync data is inconsistent (e.g., inflated initial import).
        // Don't show a misleading number.
        if (raw < 0 && totalTermed === 0) {
          growthRate = 0; // Dashboard will show "not enough data" via months_of_data check
        } else {
          growthRate = raw;
        }
      }

      // Retention rate: of all clients we've ever had, what percentage are still active
      // Formula: (start + added - termed) / (start + added) * 100
      // Which simplifies to: 1 - (termed / (start + added))
      let retentionRate = 100;
      if (syncs.length > 0) {
        const totalAdded = syncs.reduce((sum: number, s: any) => sum + (s.new_clients ?? 0), 0);
        const denominator = earliestTotal + totalAdded;
        if (denominator > 0 && totalTermed > 0) {
          retentionRate = ((denominator - totalTermed) / denominator) * 100;
        }
      }

      // Compute attention count client-side (birthday, no contact, no phone)
      // This is done in useBookClients — here we just pass 0 and let the dashboard
      // use the count from useBookClients instead
      const clientsNeedingAttention = 0; // populated by useBookClients

      return {
        total_contacts: totalClients,
        active_clients: activeClients,
        total_policies: policies.length,
        active_policies: activePolicies.length,
        total_annual_renewal: totalAnnualRenewal,
        clients_needing_attention: clientsNeedingAttention,
        retention_rate: Math.round(retentionRate * 10) / 10,
        new_this_month: newThisMonth,
        growth_rate: Math.round(growthRate * 10) / 10,
        // Extra: raw termed count for dashboard display
        total_termed_12m: totalTermed,
        months_of_data: monthsSpan,
      } as BookSummary;
    },
  });
}
```

---

## 13. Book Dashboard Page

**File:** `src/pages/book/BookDashboard.tsx`

```tsx
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, TrendingUp } from 'lucide-react';
import { useBookSummary } from '@/hooks/useBookSummary';
import { useMonthlyGrowth } from '@/hooks/useMonthlyGrowth';
import { useCarrierIncome } from '@/hooks/useCarrierIncome';
import { useBookClients } from '@/hooks/useBookClients';
import { HeroCard } from '@/components/book/HeroCard';
import { AttentionQueue, buildAttentionItems } from '@/components/book/AttentionQueue';
import { CarrierBreakdown } from '@/components/book/CarrierBreakdown';
import { MilestoneProgress } from '@/components/book/MilestoneProgress';
import type { CarrierBreakdownItem } from '@/types/book';
import { getCarrierColor } from '@/types/book';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useNavigationContext } from '@/hooks/useNavigationContext';

export default function BookDashboard() {
  const navigate = useNavigate();
  const { homePath } = useNavigationContext();
  const { data: summary } = useBookSummary();
  const { data: monthlyData = [] } = useMonthlyGrowth(12);
  const { data: carrierIncomeData = [] } = useCarrierIncome();
  const { flaggedClients, allClients } = useBookClients();

  // Build plan breakdown for hero card from actual policy data
  const planBreakdown = useMemo(() => {
    if (!summary) return [];
    const total = summary.total_annual_renewal;
    if (total === 0) return [];
    // Use active policies count to estimate plan type split
    // This is approximate — a proper fix would group by plan_type in the query
    return [
      { type: 'MA', count: 0, revenue: Math.round(total * 0.93) },
      { type: 'PDP', count: 0, revenue: Math.round(total * 0.01) },
      { type: 'Other', count: 0, revenue: Math.round(total * 0.06) },
    ];
  }, [summary]);

  // Only clients with at least one active policy (matches hero card's active_clients)
  const activeOnlyClients = useMemo(() =>
    allClients.filter(c => c.policy_status === 'active'),
    [allClients],
  );

  // Build carrier breakdown from active clients only (one carrier per client)
  const carrierBreakdown: CarrierBreakdownItem[] = useMemo(() => {
    const carrierMap = new Map<string, { carrier_id: string; carrier_name: string; count: number; color: string }>();
    activeOnlyClients.forEach(c => {
      if (!c.carrier_id || !c.carrier_name) return;
      const existing = carrierMap.get(c.carrier_id);
      if (existing) {
        existing.count++;
      } else {
        carrierMap.set(c.carrier_id, {
          carrier_id: c.carrier_id,
          carrier_name: c.carrier_name,
          count: 1,
          color: c.carrier_color || getCarrierColor(c.carrier_name),
        });
      }
    });
    const total = Array.from(carrierMap.values()).reduce((s, c) => s + c.count, 0);
    return Array.from(carrierMap.values())
      .sort((a, b) => b.count - a.count)
      .map(c => ({
        carrier_id: c.carrier_id,
        carrier_name: c.carrier_name,
        count: c.count,
        percentage: total > 0 ? Math.round((c.count / total) * 1000) / 10 : 0,
        color: c.color,
      }));
  }, [activeOnlyClients]);

  const totalClientsForCarrier = carrierBreakdown.reduce((sum, c) => sum + c.count, 0);
  const attentionItems = buildAttentionItems(flaggedClients);

  // Use actual data from hooks — ?? instead of || so 0 isn't treated as falsy
  const activeClients = summary?.active_clients ?? allClients.length;
  const totalTermed = summary?.total_termed_12m ?? 0;
  const monthsOfData = summary?.months_of_data ?? 0;
  const retentionRate = summary?.retention_rate ?? 100;
  const growthRate = summary?.growth_rate ?? 0;
  const newThisMonth = summary?.new_this_month ?? 0;

  // Growth rate subtitle
  const growthSub = growthRate === 0 && monthsOfData < 3
    ? 'building history...'
    : growthRate === 0 && monthsOfData >= 3
      ? 'data under review'
      : monthsOfData >= 12
        ? 'vs. last year'
        : `over ${monthsOfData} months`;

  // Retention subtitle: use actual termed count
  const retentionSub = totalTermed > 0
    ? `${totalTermed} lost in ${monthsOfData >= 12 ? '12' : monthsOfData} months`
    : monthsOfData > 0
      ? `0 lost in ${monthsOfData} months`
      : 'no sync data yet';

  return (
    <div
      className="px-8 py-5"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(60,48,28,0.04)',
        }}
      >
        <Link
          to={homePath}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#8B6914' }}>
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#2C2418',
              letterSpacing: '-0.01em',
            }}
          >
            My Book
          </span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <div className="px-10 py-8">

      {/* Hero Card */}
      <HeroCard
        summary={{
          ...(summary || {
            total_contacts: allClients.length,
            active_clients: activeClients,
            total_policies: summary?.total_policies || 0,
            active_policies: summary?.active_policies || 0,
            total_annual_renewal: carrierIncomeData.reduce((s, c) => s + c.income, 0),
            clients_needing_attention: flaggedClients.length,
            retention_rate: retentionRate,
            new_this_month: newThisMonth,
            growth_rate: growthRate,
            total_termed_12m: 0,
            months_of_data: 0,
          }),
          // Always use computed attention count from useBookClients
          clients_needing_attention: flaggedClients.length,
        }}
        monthlyData={monthlyData}
        planBreakdown={planBreakdown}
      />

      {/* Three columns below hero */}
      <div className="grid grid-cols-3 gap-4">
        {/* Book Health */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(200,190,170,0.3)',
          }}
        >
          <div className="text-[12px] font-semibold uppercase tracking-wider mb-5" style={{ color: '#8B7E6A' }}>
            Book Health
          </div>

          {[
            {
              label: 'Retention Rate',
              value: `${retentionRate}%`,
              icon: Shield,
              color: '#2D8B4E',
              sub: retentionSub,
            },
            {
              label: 'New This Month',
              value: `+${newThisMonth}`,
              icon: Users,
              color: '#3B6FB5',
              sub: `in ${new Date().toLocaleDateString('en-US', { month: 'long' })}`,
            },
            {
              label: 'Growth Rate',
              value: `${growthRate > 0 ? '+' : ''}${growthRate}%`,
              icon: TrendingUp,
              color: '#2D8B4E',
              sub: growthSub,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 py-3"
              style={{ borderBottom: i < 2 ? '1px solid rgba(200,190,170,0.2)' : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: `${stat.color}12` }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: '#8B7E6A' }}>{stat.label}</div>
                <div className="text-[20px] font-bold" style={{ color: '#2C2418' }}>{stat.value}</div>
              </div>
              <div className="text-[11px] text-right" style={{ color: '#A09888' }}>{stat.sub}</div>
            </div>
          ))}

          {/* Growth & Income link */}
          <button
            onClick={() => navigate('/book/growth')}
            className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150 border-none"
            style={{ background: 'rgba(59,111,181,0.06)', color: '#3B6FB5' }}
          >
            View Growth & Income →
          </button>
        </div>

        {/* Carrier Breakdown */}
        <CarrierBreakdown carriers={carrierBreakdown} totalClients={totalClientsForCarrier} />

        {/* Attention + Milestone */}
        <div className="flex flex-col gap-4">
          <AttentionQueue totalCount={flaggedClients.length} items={attentionItems} />
          <MilestoneProgress currentClients={activeClients} />
        </div>
      </div>

      {/* Quick link to client list */}
      <div className="mt-5 text-center">
        <button
          onClick={() => navigate('/book/clients')}
          className="text-[14px] font-semibold cursor-pointer bg-transparent border-none p-2"
          style={{ color: '#3B6FB5' }}
        >
          View All Clients →
        </button>
      </div>
      </div>
    </div>
  );
}
```

---

## 14. Book Import Hook

**File:** `src/hooks/useBookImport.ts`

```typescript
// Multi-step import flow state machine.
// Manages: file upload -> parse -> mismatch check -> summary -> commit -> success

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ImportMode =
  | 'carrier-grid'
  | 'bulk-upload'
  | 'processing'
  | 'mismatch'
  | 'summary'
  | 'success';

export interface BatchSummary {
  batchId: string;
  status: string;
  sourceFormat: string;
  detectedFormat: string;
  formatMismatch: boolean;
  mismatchDetectedCarrier?: string;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  termedRecords: number;
  skipDetails: { row: number; reason: string }[];
  fileName?: string;
  expectedCarrierId?: string;
  expectedCarrierCode?: string;
  expectedCarrierName?: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function useBookImport() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const profileId = profile?.id ? String(profile.id) : null;

  const [mode, setMode] = useState<ImportMode>('carrier-grid');
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preImportClientCount, setPreImportClientCount] = useState<number>(0);
  const lastFileRef = useRef<{ file: File; carrierId?: string; carrierCode?: string; carrierName?: string } | null>(null);
  const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null);

  const startUpload = useCallback(async (
    file: File,
    carrierId?: string,
    carrierCode?: string,
    carrierName?: string
  ) => {
    if (!profileId) return;

    setError(null);
    setIsUploading(true);
    setMode('processing');
    lastFileRef.current = { file, carrierId, carrierCode, carrierName };
    setUploadStartedAt(Date.now());

    try {
      const fileContent = await readFileAsBase64(file);

      const { data, error: fnError } = await supabase.functions.invoke(
        'import-book-of-business',
        {
          body: {
            action: 'parse',
            fileContent,
            fileName: file.name,
            profileId,
            expectedCarrierId: carrierId || undefined,
            expectedCarrierCode: carrierCode || undefined,
          },
        }
      );

      if (fnError) throw new Error(fnError.message || 'Upload failed');
      if (data?.error) throw new Error(data.error);

      const batchData: BatchSummary = {
        batchId: data.batchId,
        status: data.status,
        sourceFormat: data.sourceFormat,
        detectedFormat: data.detectedFormat,
        formatMismatch: data.formatMismatch,
        mismatchDetectedCarrier: data.mismatchDetectedCarrier,
        totalRecords: data.totalRecords,
        newRecords: data.newRecords,
        updatedRecords: data.updatedRecords,
        skippedRecords: data.skippedRecords,
        termedRecords: data.termedRecords,
        skipDetails: data.skipDetails || [],
        fileName: file.name,
        expectedCarrierId: carrierId,
        expectedCarrierCode: carrierCode,
        expectedCarrierName: carrierName,
      };

      setBatch(batchData);

      if (data.formatMismatch) {
        setMode('mismatch');
      } else {
        setMode('summary');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      // Stay in processing mode — component renders error state
    } finally {
      setIsUploading(false);
      setUploadStartedAt(null);
    }
  }, [profileId]);

  const commitImport = useCallback(async () => {
    if (!batch?.batchId) return;

    setError(null);
    setIsCommitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'import-book-of-business',
        {
          body: { action: 'commit', batchId: batch.batchId },
        }
      );

      if (fnError) throw new Error(fnError.message || 'Commit failed');
      if (data?.error) throw new Error(data.error);

      setBatch(prev => prev ? {
        ...prev,
        status: 'committed',
        newRecords: data.newRecords ?? prev.newRecords,
        updatedRecords: data.updatedRecords ?? prev.updatedRecords,
      } : null);

      setMode('success');

      queryClient.invalidateQueries({ queryKey: ['book-clients'] });
      queryClient.invalidateQueries({ queryKey: ['import-status'] });
      queryClient.invalidateQueries({ queryKey: ['import-pending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['book-summary'] });
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsCommitting(false);
    }
  }, [batch?.batchId, queryClient]);

  const cancelImport = useCallback(async () => {
    if (!batch?.batchId) {
      setMode('carrier-grid');
      setBatch(null);
      return;
    }

    try {
      await supabase.functions.invoke('import-book-of-business', {
        body: { action: 'cancel', batchId: batch.batchId },
      });
    } catch {
      // Best-effort cancel
    }

    setBatch(null);
    setError(null);
    setMode('carrier-grid');
    queryClient.invalidateQueries({ queryKey: ['import-pending'] });
  }, [batch?.batchId, queryClient]);

  const resumeImport = useCallback((pendingBatch: any) => {
    setBatch({
      batchId: pendingBatch.id,
      status: pendingBatch.status,
      sourceFormat: pendingBatch.sourceFormat,
      detectedFormat: pendingBatch.detectedFormat || '',
      formatMismatch: pendingBatch.formatMismatch,
      mismatchDetectedCarrier: pendingBatch.mismatchDetectedCarrier,
      totalRecords: pendingBatch.totalRecords,
      newRecords: pendingBatch.newRecords,
      updatedRecords: pendingBatch.updatedRecords,
      skippedRecords: pendingBatch.skippedRecords,
      termedRecords: pendingBatch.termedRecords,
      skipDetails: pendingBatch.skipDetails || [],
      fileName: pendingBatch.fileName,
    });
    setMode('summary');
  }, []);

  const acceptMismatch = useCallback((_useDetectedCarrier: boolean) => {
    if (!batch) return;
    setMode('summary');
  }, [batch]);

  const retryUpload = useCallback(() => {
    if (!lastFileRef.current) return;
    const { file, carrierId, carrierCode, carrierName } = lastFileRef.current;
    startUpload(file, carrierId, carrierCode, carrierName);
  }, [startUpload]);

  const reset = useCallback(() => {
    setBatch(null);
    setError(null);
    setIsUploading(false);
    setIsCommitting(false);
    setUploadStartedAt(null);
    setMode('carrier-grid');
  }, []);

  return {
    mode,
    setMode,
    isUploading,
    isCommitting,
    batch,
    error,
    uploadStartedAt,
    preImportClientCount,
    setPreImportClientCount,
    startUpload,
    retryUpload,
    commitImport,
    cancelImport,
    resumeImport,
    acceptMismatch,
    reset,
  };
}
```

---

## 15. Search Results Summary

Files in this codebase that reference "WellCare" or "Centene":

| File | Relevance |
|------|-----------|
| `supabase/functions/import-book-of-business/index.ts` | BOB Import — WellCare parser (parseWellCareBOB) |
| `supabase/functions/parse-production-report/index.ts` | Smart Sync — WellCare parser (parseWellCareReport) |
| `supabase/functions/_shared/clientDedup.ts` | Shared dedup logic used by both pipelines |
| `src/lib/carrier-detection.ts` | Frontend carrier auto-detection from file headers |
| `src/config/carriers.ts` | Carrier config (wellcare entry + centene entry) |
| `src/config/carrierImportGuides.ts` | WellCare portal download instructions |
| `src/lib/formatters.ts` | formatPhone, normalizePhone used in client display |
| `src/types/book.ts` | BookClient, BookSummary, CARRIER_COLORS (wellcare entry) |
| `src/hooks/useImportStatus.ts` | Carrier sync status grid for import page |
| `src/hooks/useBookImport.ts` | Multi-step import flow state machine |
| `src/lib/sync.ts` | Monthly sync orchestration (carrier upload tracking) |
| `src/hooks/useDashboardData.ts` | Dashboard metrics (carrier breakdown, growth) |
| `src/hooks/useBookSummary.ts` | Book summary metrics (active clients, renewal) |
| `src/pages/book/BookDashboard.tsx` | Book dashboard page (carrier breakdown display) |
| `src/data/carriersData.ts` | Carrier directory (contacts, portals — not parsing) |
| `src/components/book/ClientDetail.tsx` | Client detail display (references carrier names) |
| `src/components/book/ClientListPanel.tsx` | Client list (carrier filter references) |
| `src/components/book-of-business/UploadModal.tsx` | Legacy upload modal (carrier references) |
| `src/hooks/useCarrierDirectory.ts` | Carrier directory hook (not parsing-related) |
| `src/index.css` | Carrier color CSS variables |

---

*End of source dump.*
