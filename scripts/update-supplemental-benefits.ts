/**
 * Update Supplemental Benefits Script
 *
 * Parses CMS PBP benefit files and updates existing cms_plans records with:
 * - Dental benefits (pbp_b16_dental.txt)
 * - Vision benefits (pbp_b17_eye_exams_wear.txt)
 * - Hearing benefits (pbp_b18_hearing_exams_aids.txt)
 *
 * Usage:
 *   npx tsx scripts/update-supplemental-benefits.ts --data-dir="C:/path/to/pbp-benefits"
 *   npx tsx scripts/update-supplemental-benefits.ts --data-dir="C:/path/to/pbp-benefits" --dry-run
 *
 * Environment variables required (in .env or .env.local):
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// Configuration
// ============================================================================
const BATCH_SIZE = 50;
const YEAR = 2026;

const isDryRun = process.argv.includes('--dry-run');
const dataDir = process.argv.find(arg => arg.startsWith('--data-dir='))?.split('=')[1] || '';

if (!dataDir) {
  console.error('Missing required argument: --data-dir="C:/path/to/pbp-benefits"');
  process.exit(1);
}

// ============================================================================
// Supabase Client
// ============================================================================
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ============================================================================
// Types
// ============================================================================
interface ExistingPlan {
  id: string;
  contract_id: string;
  plan_id: string;
  segment_id: string | null;
}

interface DentalBenefit {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  dental_preventive: string | null;
  dental_comprehensive: string | null;
  dental_max_coverage: number | null;
}

interface VisionBenefit {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  vision_exam_copay: string | null;
  vision_allowance: number | null;
}

interface HearingBenefit {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  hearing_exam_copay: string | null;
  hearing_aid_allowance: string | null; // Now TEXT: "$2,000" or "$699 copay/aid"
}

interface UpdateStats {
  matched: number;
  updated: number;
  skipped: number;
  noData: number;
}

// ============================================================================
// Parsing Helpers
// ============================================================================

/**
 * Parse a tab-delimited file and return rows as arrays
 */
function parseTabFile(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => line.split('\t'));
}

/**
 * Safely prepend "$" only if not already present
 */
function safeDollarPrefix(value: string): string {
  return value.startsWith('$') ? value : `$${value}`;
}

/**
 * Format a numeric value as a dollar string
 */
function formatDollar(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  // Strip existing $ if present before parsing
  const cleanValue = value.replace(/^\$/, '').trim();
  const num = parseFloat(cleanValue);
  if (isNaN(num)) return null;
  if (num === 0) return '$0';
  return safeDollarPrefix(num.toFixed(0));
}

/**
 * Format dental comprehensive copay with special handling for $0
 * - $0 or $0.00 → "No additional cost"
 * - null/empty → null (UI shows "Not covered")
 * - Actual amount → "$X"
 */
function formatDentalComprehensive(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  // Strip existing $ if present before parsing
  const cleanValue = value.replace(/^\$/, '').trim();
  const num = parseFloat(cleanValue);
  if (isNaN(num)) return null;
  if (num === 0) return 'No additional cost';
  return safeDollarPrefix(num.toFixed(0));
}

/**
 * Format a dollar range (min-max)
 */
function formatDollarRange(min: string | undefined, max: string | undefined): string | null {
  // Strip existing $ if present before parsing
  const cleanMin = min?.replace(/^\$/, '').trim();
  const cleanMax = max?.replace(/^\$/, '').trim();
  const minVal = cleanMin ? parseFloat(cleanMin) : NaN;
  const maxVal = cleanMax ? parseFloat(cleanMax) : NaN;

  if (isNaN(minVal) && isNaN(maxVal)) return null;
  if (isNaN(minVal)) return safeDollarPrefix(maxVal.toFixed(0));
  if (isNaN(maxVal)) return safeDollarPrefix(minVal.toFixed(0));
  if (minVal === maxVal) return safeDollarPrefix(minVal.toFixed(0));
  return `${safeDollarPrefix(minVal.toFixed(0))}-${safeDollarPrefix(maxVal.toFixed(0))}`;
}

/**
 * Parse a numeric value, returning null if invalid
 * Strips "$" prefix and commas if present
 */
function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  // Strip $ prefix and commas before parsing
  const cleanValue = value.replace(/^\$/, '').replace(/,/g, '').trim();
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}

/**
 * Take the higher of two numbers
 */
function takeHigher(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

// ============================================================================
// Dental Parser (pbp_b16_dental.txt)
// ============================================================================
// Column mapping (0-indexed):
// 0: pbp_a_hnumber (contract_id)
// 1: pbp_a_plan_identifier (plan_id)
// 2: segment_id
// 17: pbp_b16a_copay_mc_amt (Medicare dental copay)
// 18: pbp_b16a_copay_mc_amt_min
// 19: pbp_b16a_copay_mc_amt_max
// 26: pbp_b16b_maxplan_pv_amt (Preventive max)
// 137: pbp_b16c_maxplan_cmp_amt (Comprehensive max)
// 161: pbp_b16c_copay_rs_amt (Restorative copay)
// 162: pbp_b16c_copay_rs_amt_min
// 163: pbp_b16c_copay_rs_amt_max

function parseDentalFile(filePath: string): Map<string, DentalBenefit> {
  console.log(`\nParsing dental file: ${filePath}`);
  const rows = parseTabFile(filePath);
  const headers = rows[0];
  const benefits = new Map<string, DentalBenefit>();

  // Find column indices by name
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => colMap[h] = i);

  const COL = {
    contract: colMap['pbp_a_hnumber'] ?? 0,
    plan: colMap['pbp_a_plan_identifier'] ?? 1,
    segment: colMap['segment_id'] ?? 2,
    copay_mc: colMap['pbp_b16a_copay_mc_amt'] ?? 17,
    copay_mc_min: colMap['pbp_b16a_copay_mc_amt_min'] ?? 18,
    copay_mc_max: colMap['pbp_b16a_copay_mc_amt_max'] ?? 19,
    max_preventive: colMap['pbp_b16b_maxplan_pv_amt'] ?? 26,
    max_comprehensive: colMap['pbp_b16c_maxplan_cmp_amt'] ?? 137,
    copay_rs: colMap['pbp_b16c_copay_rs_amt'] ?? 161,
    copay_rs_min: colMap['pbp_b16c_copay_rs_amt_min'] ?? 162,
    copay_rs_max: colMap['pbp_b16c_copay_rs_amt_max'] ?? 163,
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const contractId = row[COL.contract];
    const planId = row[COL.plan];
    const segmentId = row[COL.segment] || '0';

    if (!contractId || !planId) continue;

    // Preventive: Use copay or range
    let preventive = formatDollar(row[COL.copay_mc]);
    if (!preventive) {
      preventive = formatDollarRange(row[COL.copay_mc_min], row[COL.copay_mc_max]);
    }

    // Comprehensive: Use restorative copay or range (with special $0 formatting)
    let comprehensive = formatDentalComprehensive(row[COL.copay_rs]);
    if (!comprehensive) {
      // Try range - check if both min and max are 0
      const rsMin = parseNumber(row[COL.copay_rs_min]);
      const rsMax = parseNumber(row[COL.copay_rs_max]);
      if (rsMin === 0 && rsMax === 0) {
        comprehensive = 'No additional cost';
      } else if (rsMin !== null || rsMax !== null) {
        comprehensive = formatDollarRange(row[COL.copay_rs_min], row[COL.copay_rs_max]);
      }
    }

    // Max coverage: Take higher of preventive vs comprehensive max
    const maxPreventive = parseNumber(row[COL.max_preventive]);
    const maxComprehensive = parseNumber(row[COL.max_comprehensive]);
    const maxCoverage = takeHigher(maxPreventive, maxComprehensive);

    const key = `${contractId}-${planId}-${segmentId}`;
    benefits.set(key, {
      contract_id: contractId,
      plan_id: planId,
      segment_id: segmentId,
      dental_preventive: preventive,
      dental_comprehensive: comprehensive,
      dental_max_coverage: maxCoverage,
    });
  }

  console.log(`  Parsed ${benefits.size} dental benefit records`);
  return benefits;
}

// ============================================================================
// Vision Parser (pbp_b17_eye_exams_wear.txt)
// ============================================================================
// Column mapping (0-indexed):
// 0: pbp_a_hnumber (contract_id)
// 1: pbp_a_plan_identifier (plan_id)
// 2: segment_id
// 42: pbp_b17a_copay_amt_rex_min (Routine eye exam copay min)
// 43: pbp_b17a_copay_amt_rex_max (Routine eye exam copay max)
// 77: pbp_b17b_comb_maxplan_amt (Combined eyewear allowance)

function parseVisionFile(filePath: string): Map<string, VisionBenefit> {
  console.log(`\nParsing vision file: ${filePath}`);
  const rows = parseTabFile(filePath);
  const headers = rows[0];
  const benefits = new Map<string, VisionBenefit>();

  // Find column indices by name
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => colMap[h] = i);

  const COL = {
    contract: colMap['pbp_a_hnumber'] ?? 0,
    plan: colMap['pbp_a_plan_identifier'] ?? 1,
    segment: colMap['segment_id'] ?? 2,
    copay_rex_min: colMap['pbp_b17a_copay_amt_rex_min'] ?? 42,
    copay_rex_max: colMap['pbp_b17a_copay_amt_rex_max'] ?? 43,
    allowance: colMap['pbp_b17b_comb_maxplan_amt'] ?? 77,
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const contractId = row[COL.contract];
    const planId = row[COL.plan];
    const segmentId = row[COL.segment] || '0';

    if (!contractId || !planId) continue;

    // Exam copay: Use range
    const examCopay = formatDollarRange(row[COL.copay_rex_min], row[COL.copay_rex_max]);

    // Allowance
    const allowance = parseNumber(row[COL.allowance]);

    const key = `${contractId}-${planId}-${segmentId}`;
    benefits.set(key, {
      contract_id: contractId,
      plan_id: planId,
      segment_id: segmentId,
      vision_exam_copay: examCopay,
      vision_allowance: allowance,
    });
  }

  console.log(`  Parsed ${benefits.size} vision benefit records`);
  return benefits;
}

// ============================================================================
// Hearing Parser (pbp_b18_hearing_exams_aids.txt)
// ============================================================================
// Column mapping (0-indexed):
// 0: pbp_a_hnumber (contract_id)
// 1: pbp_a_plan_identifier (plan_id)
// 2: segment_id
// 43: pbp_b18a_copay_amt (Hearing exam copay - base)
// 44: pbp_b18a_med_copay_amt_max (Hearing exam copay - max)
// 77: pbp_b18b_maxplan_amt (Hearing aids max allowance)
// 97: pbp_b18b_copay_at_max_amt (Hearing aid copay - for plans without allowance)
// 120: pbp_b18c_maxplan_amt (Hearing aids allowance - alternate)
// 138: pbp_b18c_copay_amt_max (Hearing aid copay - alternate)

function parseHearingFile(filePath: string): Map<string, HearingBenefit> {
  console.log(`\nParsing hearing file: ${filePath}`);
  const rows = parseTabFile(filePath);
  const headers = rows[0];
  const benefits = new Map<string, HearingBenefit>();

  // Find column indices by name
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => colMap[h] = i);

  const COL = {
    contract: colMap['pbp_a_hnumber'] ?? 0,
    plan: colMap['pbp_a_plan_identifier'] ?? 1,
    segment: colMap['segment_id'] ?? 2,
    // Exam copay
    copay_base: colMap['pbp_b18a_copay_amt'] ?? 43,
    copay_max: colMap['pbp_b18a_med_copay_amt_max'] ?? 44,
    // Allowance model (max benefit amount)
    aid_max_b18b: colMap['pbp_b18b_maxplan_amt'] ?? 77,
    aid_max_b18c: colMap['pbp_b18c_maxplan_amt'] ?? 120,
    // Copay model (per-aid copay)
    aid_copay_b18b: colMap['pbp_b18b_copay_at_max_amt'] ?? 97,
    aid_copay_b18c: colMap['pbp_b18c_copay_amt_max'] ?? 138,
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const contractId = row[COL.contract];
    const planId = row[COL.plan];
    const segmentId = row[COL.segment] || '0';

    if (!contractId || !planId) continue;

    // Exam copay: Use base or range if max differs
    let examCopay = formatDollar(row[COL.copay_base]);
    const copayMax = parseNumber(row[COL.copay_max]);
    const copayBase = parseNumber(row[COL.copay_base]);
    if (copayBase !== null && copayMax !== null && copayBase !== copayMax) {
      examCopay = `$${copayBase.toFixed(0)}-$${copayMax.toFixed(0)}`;
    }

    // Hearing aid benefit: Check for allowance first, then copay
    let aidBenefit: string | null = null;

    // 1. Check for allowance model (max benefit amount)
    const aidAllowanceB18b = parseNumber(row[COL.aid_max_b18b]);
    const aidAllowanceB18c = parseNumber(row[COL.aid_max_b18c]);
    const maxAllowance = takeHigher(aidAllowanceB18b, aidAllowanceB18c);

    if (maxAllowance !== null && maxAllowance > 0) {
      // Format as allowance
      aidBenefit = `$${maxAllowance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else {
      // 2. Check for copay model (per-aid copay amount)
      const aidCopayB18b = parseNumber(row[COL.aid_copay_b18b]);
      const aidCopayB18c = parseNumber(row[COL.aid_copay_b18c]);

      // Use the non-null copay value (prefer b18b if both exist)
      const copayAmount = aidCopayB18b ?? aidCopayB18c;

      if (copayAmount !== null) {
        if (copayAmount === 0) {
          aidBenefit = '$0 copay/aid';
        } else {
          aidBenefit = `$${copayAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} copay/aid`;
        }
      }
    }

    const key = `${contractId}-${planId}-${segmentId}`;
    benefits.set(key, {
      contract_id: contractId,
      plan_id: planId,
      segment_id: segmentId,
      hearing_exam_copay: examCopay,
      hearing_aid_allowance: aidBenefit,
    });
  }

  console.log(`  Parsed ${benefits.size} hearing benefit records`);
  return benefits;
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Load existing KY plans from cms_plans table
 */
async function loadExistingPlans(): Promise<Map<string, ExistingPlan>> {
  console.log('\nLoading existing plans from database...');

  const { data, error } = await supabase
    .from('cms_plans')
    .select('id, contract_id, plan_id, segment_id')
    .eq('year', YEAR)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to load plans:', error.message);
    process.exit(1);
  }

  const planMap = new Map<string, ExistingPlan>();
  for (const plan of data || []) {
    const key = `${plan.contract_id}-${plan.plan_id}-${plan.segment_id || '0'}`;
    planMap.set(key, plan);
  }

  console.log(`  Found ${planMap.size} existing plans for year ${YEAR}`);
  return planMap;
}

/**
 * Update dental benefits in batches
 */
async function updateDentalBenefits(
  dentalData: Map<string, DentalBenefit>,
  existingPlans: Map<string, ExistingPlan>
): Promise<UpdateStats> {
  console.log('\nUpdating dental benefits...');
  const stats: UpdateStats = { matched: 0, updated: 0, skipped: 0, noData: 0 };
  const updates: { id: string; data: Partial<DentalBenefit> }[] = [];

  for (const [key, plan] of existingPlans) {
    const benefit = dentalData.get(key);

    if (!benefit) {
      stats.noData++;
      continue;
    }

    stats.matched++;

    // Skip if all values are null
    if (!benefit.dental_preventive && !benefit.dental_comprehensive && !benefit.dental_max_coverage) {
      stats.skipped++;
      continue;
    }

    updates.push({
      id: plan.id,
      data: {
        dental_preventive: benefit.dental_preventive,
        dental_comprehensive: benefit.dental_comprehensive,
        dental_max_coverage: benefit.dental_max_coverage,
      },
    });
  }

  // Batch update
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      stats.updated += batch.length;
      process.stdout.write(`\r  [DRY RUN] Would update: ${stats.updated}/${updates.length}`);
      continue;
    }

    for (const update of batch) {
      const { error } = await supabase
        .from('cms_plans')
        .update(update.data)
        .eq('id', update.id);

      if (error) {
        console.error(`\n  ✗ Failed to update ${update.id}:`, error.message);
      } else {
        stats.updated++;
      }
    }
    process.stdout.write(`\r  Updating dental: ${stats.updated}/${updates.length}`);
  }

  console.log(`\n  ✓ Dental: ${stats.matched} matched, ${stats.updated} updated, ${stats.skipped} skipped (no values), ${stats.noData} not in PBP file`);
  return stats;
}

/**
 * Update vision benefits in batches
 */
async function updateVisionBenefits(
  visionData: Map<string, VisionBenefit>,
  existingPlans: Map<string, ExistingPlan>
): Promise<UpdateStats> {
  console.log('\nUpdating vision benefits...');
  const stats: UpdateStats = { matched: 0, updated: 0, skipped: 0, noData: 0 };
  const updates: { id: string; data: Partial<VisionBenefit> }[] = [];

  for (const [key, plan] of existingPlans) {
    const benefit = visionData.get(key);

    if (!benefit) {
      stats.noData++;
      continue;
    }

    stats.matched++;

    // Skip if all values are null
    if (!benefit.vision_exam_copay && !benefit.vision_allowance) {
      stats.skipped++;
      continue;
    }

    updates.push({
      id: plan.id,
      data: {
        vision_exam_copay: benefit.vision_exam_copay,
        vision_allowance: benefit.vision_allowance,
      },
    });
  }

  // Batch update
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      stats.updated += batch.length;
      process.stdout.write(`\r  [DRY RUN] Would update: ${stats.updated}/${updates.length}`);
      continue;
    }

    for (const update of batch) {
      const { error } = await supabase
        .from('cms_plans')
        .update(update.data)
        .eq('id', update.id);

      if (error) {
        console.error(`\n  ✗ Failed to update ${update.id}:`, error.message);
      } else {
        stats.updated++;
      }
    }
    process.stdout.write(`\r  Updating vision: ${stats.updated}/${updates.length}`);
  }

  console.log(`\n  ✓ Vision: ${stats.matched} matched, ${stats.updated} updated, ${stats.skipped} skipped (no values), ${stats.noData} not in PBP file`);
  return stats;
}

/**
 * Update hearing benefits in batches
 */
async function updateHearingBenefits(
  hearingData: Map<string, HearingBenefit>,
  existingPlans: Map<string, ExistingPlan>
): Promise<UpdateStats> {
  console.log('\nUpdating hearing benefits...');
  const stats: UpdateStats = { matched: 0, updated: 0, skipped: 0, noData: 0 };
  const updates: { id: string; data: Partial<HearingBenefit> }[] = [];

  for (const [key, plan] of existingPlans) {
    const benefit = hearingData.get(key);

    if (!benefit) {
      stats.noData++;
      continue;
    }

    stats.matched++;

    // Skip if all values are null
    if (!benefit.hearing_exam_copay && !benefit.hearing_aid_allowance) {
      stats.skipped++;
      continue;
    }

    updates.push({
      id: plan.id,
      data: {
        hearing_exam_copay: benefit.hearing_exam_copay,
        hearing_aid_allowance: benefit.hearing_aid_allowance,
      },
    });
  }

  // Batch update
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      stats.updated += batch.length;
      process.stdout.write(`\r  [DRY RUN] Would update: ${stats.updated}/${updates.length}`);
      continue;
    }

    for (const update of batch) {
      const { error } = await supabase
        .from('cms_plans')
        .update(update.data)
        .eq('id', update.id);

      if (error) {
        console.error(`\n  ✗ Failed to update ${update.id}:`, error.message);
      } else {
        stats.updated++;
      }
    }
    process.stdout.write(`\r  Updating hearing: ${stats.updated}/${updates.length}`);
  }

  console.log(`\n  ✓ Hearing: ${stats.matched} matched, ${stats.updated} updated, ${stats.skipped} skipped (no values), ${stats.noData} not in PBP file`);
  return stats;
}

/**
 * Print sample updates for dry run
 */
function printSampleUpdates(
  dentalData: Map<string, DentalBenefit>,
  visionData: Map<string, VisionBenefit>,
  hearingData: Map<string, HearingBenefit>,
  existingPlans: Map<string, ExistingPlan>
): void {
  console.log('\n' + '─'.repeat(60));
  console.log('SAMPLE UPDATES (first 5 plans with data):');
  console.log('─'.repeat(60));

  let count = 0;
  for (const [key, plan] of existingPlans) {
    if (count >= 5) break;

    const dental = dentalData.get(key);
    const vision = visionData.get(key);
    const hearing = hearingData.get(key);

    // Only show plans with at least some data
    const hasDental = dental && (dental.dental_preventive || dental.dental_comprehensive || dental.dental_max_coverage);
    const hasVision = vision && (vision.vision_exam_copay || vision.vision_allowance);
    const hasHearing = hearing && (hearing.hearing_exam_copay || hearing.hearing_aid_allowance);

    if (!hasDental && !hasVision && !hasHearing) continue;

    console.log(`\n${plan.contract_id}-${plan.plan_id}:`);
    if (hasDental) {
      console.log(`  Dental: preventive=${dental!.dental_preventive || 'N/A'}, comprehensive=${dental!.dental_comprehensive || 'N/A'}, max=$${dental!.dental_max_coverage || 'N/A'}`);
    }
    if (hasVision) {
      console.log(`  Vision: exam=${vision!.vision_exam_copay || 'N/A'}, allowance=$${vision!.vision_allowance || 'N/A'}`);
    }
    if (hasHearing) {
      console.log(`  Hearing: exam=${hearing!.hearing_exam_copay || 'N/A'}, aid=${hearing!.hearing_aid_allowance || 'N/A'}`);
    }
    count++;
  }
}

// ============================================================================
// Main
// ============================================================================
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Update Supplemental Benefits');
  console.log('='.repeat(60));
  console.log(`Data Directory: ${dataDir}`);
  console.log(`Year: ${YEAR}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Verify files exist
  const dentalPath = path.join(dataDir, 'pbp_b16_dental.txt');
  const visionPath = path.join(dataDir, 'pbp_b17_eye_exams_wear.txt');
  const hearingPath = path.join(dataDir, 'pbp_b18_hearing_exams_aids.txt');

  const missingFiles: string[] = [];
  if (!fs.existsSync(dentalPath)) missingFiles.push('pbp_b16_dental.txt');
  if (!fs.existsSync(visionPath)) missingFiles.push('pbp_b17_eye_exams_wear.txt');
  if (!fs.existsSync(hearingPath)) missingFiles.push('pbp_b18_hearing_exams_aids.txt');

  if (missingFiles.length > 0) {
    console.error('\nMissing required files:');
    missingFiles.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  // Step 1: Parse all benefit files
  const dentalData = parseDentalFile(dentalPath);
  const visionData = parseVisionFile(visionPath);
  const hearingData = parseHearingFile(hearingPath);

  // Step 2: Load existing plans
  const existingPlans = await loadExistingPlans();

  // Step 3: Show sample updates in dry run mode
  if (isDryRun) {
    printSampleUpdates(dentalData, visionData, hearingData, existingPlans);
  }

  // Step 4: Update benefits
  const dentalStats = await updateDentalBenefits(dentalData, existingPlans);
  const visionStats = await updateVisionBenefits(visionData, existingPlans);
  const hearingStats = await updateHearingBenefits(hearingData, existingPlans);

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Existing Plans: ${existingPlans.size}`);
  console.log(`\nDental Benefits:`);
  console.log(`  Matched: ${dentalStats.matched} | Updated: ${dentalStats.updated} | Skipped: ${dentalStats.skipped} | No Data: ${dentalStats.noData}`);
  console.log(`\nVision Benefits:`);
  console.log(`  Matched: ${visionStats.matched} | Updated: ${visionStats.updated} | Skipped: ${visionStats.skipped} | No Data: ${visionStats.noData}`);
  console.log(`\nHearing Benefits:`);
  console.log(`  Matched: ${hearingStats.matched} | Updated: ${hearingStats.updated} | Skipped: ${hearingStats.skipped} | No Data: ${hearingStats.noData}`);
  console.log('='.repeat(60));

  if (isDryRun) {
    console.log('\n[DRY RUN] No changes were made. Remove --dry-run to apply updates.');
  } else {
    console.log('\nUpdates complete!');
  }
}

main().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
