/**
 * Update Star Ratings Script
 *
 * Parses CMS Landscape CSV and updates star_rating on existing cms_plans records.
 *
 * Usage:
 *   npx tsx scripts/update-star-ratings.ts --csv="C:/path/to/landscape.csv"
 *   npx tsx scripts/update-star-ratings.ts --csv="C:/path/to/landscape.csv" --dry-run
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
const csvPath = process.argv.find(arg => arg.startsWith('--csv='))?.split('=')[1] || '';

if (!csvPath) {
  console.error('Missing required argument: --csv="C:/path/to/landscape.csv"');
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
interface StarRatingData {
  contractId: string;
  planId: string;
  starRating: number | null;
  rawValue: string;
}

interface ExistingPlan {
  id: string;
  contract_id: string;
  plan_id: string;
  star_rating: number | null;
}

interface UpdateStats {
  matched: number;
  updated: number;
  skipped: number;
  notRated: number;
  notInCsv: number;
}

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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

/**
 * Parse star rating value - returns number or null for text values
 */
function parseStarRating(value: string): number | null {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  // Check for non-numeric text values
  const nonNumericPatterns = [
    'not applicable',
    'not enough data',
    'plan too new',
    'n/a',
    '-',
  ];

  if (nonNumericPatterns.some(pattern => trimmed.toLowerCase().includes(pattern))) {
    return null;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;

  // Valid star ratings are 1.0-5.0 in 0.5 increments
  if (num < 1 || num > 5) return null;

  return num;
}

/**
 * Parse Landscape CSV and extract star ratings for Kentucky plans
 */
function parseLandscapeCSV(filePath: string): Map<string, StarRatingData> {
  console.log(`\nParsing Landscape CSV: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  // Parse headers and find column indices
  const headers = parseCSVLine(lines[0]);
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => colMap[h] = i);

  const COL = {
    state: colMap['State Territory Abbreviation'] ?? 3,
    contractId: colMap['Contract ID'] ?? 6,
    planId: colMap['Plan ID'] ?? 7,
    starRating: colMap['Overall Star Rating'] ?? 47,
  };

  console.log(`  Column indices: state=${COL.state}, contract=${COL.contractId}, plan=${COL.planId}, star=${COL.starRating}`);

  // Parse rows and deduplicate by contract+plan
  const ratings = new Map<string, StarRatingData>();
  let totalKyRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const state = row[COL.state];

    if (state !== 'KY') continue;
    totalKyRows++;

    const contractId = row[COL.contractId];
    const planId = row[COL.planId];
    const rawValue = row[COL.starRating];

    if (!contractId || !planId) continue;

    const key = `${contractId}-${planId}`;
    if (ratings.has(key)) continue; // Already seen this plan

    const starRating = parseStarRating(rawValue);

    ratings.set(key, {
      contractId,
      planId,
      starRating,
      rawValue,
    });
  }

  console.log(`  Total KY rows: ${totalKyRows}`);
  console.log(`  Unique plans: ${ratings.size}`);

  // Count rating distribution
  const ratingCounts: Record<string, number> = {};
  for (const data of ratings.values()) {
    const key = data.starRating !== null ? data.starRating.toString() : 'null';
    ratingCounts[key] = (ratingCounts[key] || 0) + 1;
  }
  console.log(`  Rating distribution:`, ratingCounts);

  return ratings;
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Load existing plans from cms_plans table
 */
async function loadExistingPlans(): Promise<Map<string, ExistingPlan>> {
  console.log('\nLoading existing plans from database...');

  const { data, error } = await supabase
    .from('cms_plans')
    .select('id, contract_id, plan_id, star_rating')
    .eq('year', YEAR)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to load plans:', error.message);
    process.exit(1);
  }

  const planMap = new Map<string, ExistingPlan>();
  for (const plan of data || []) {
    const key = `${plan.contract_id}-${plan.plan_id}`;
    planMap.set(key, plan);
  }

  console.log(`  Found ${planMap.size} existing plans for year ${YEAR}`);
  return planMap;
}

/**
 * Update star ratings in batches
 */
async function updateStarRatings(
  ratingData: Map<string, StarRatingData>,
  existingPlans: Map<string, ExistingPlan>
): Promise<UpdateStats> {
  console.log('\nUpdating star ratings...');

  const stats: UpdateStats = {
    matched: 0,
    updated: 0,
    skipped: 0,
    notRated: 0,
    notInCsv: 0,
  };

  const updates: { id: string; starRating: number; key: string }[] = [];

  // Check each existing plan against CSV data
  for (const [key, plan] of existingPlans) {
    const csvData = ratingData.get(key);

    if (!csvData) {
      stats.notInCsv++;
      continue;
    }

    stats.matched++;

    if (csvData.starRating === null) {
      stats.notRated++;
      continue;
    }

    // Skip if already has same rating
    if (plan.star_rating === csvData.starRating) {
      stats.skipped++;
      continue;
    }

    updates.push({
      id: plan.id,
      starRating: csvData.starRating,
      key,
    });
  }

  console.log(`  Plans matched: ${stats.matched}`);
  console.log(`  Plans not in CSV: ${stats.notInCsv}`);
  console.log(`  Plans with no rating (text value): ${stats.notRated}`);
  console.log(`  Plans to update: ${updates.length}`);

  // Perform updates
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
        .update({ star_rating: update.starRating })
        .eq('id', update.id);

      if (error) {
        console.error(`\n  ✗ Failed to update ${update.key}:`, error.message);
      } else {
        stats.updated++;
      }
    }
    process.stdout.write(`\r  Updating ratings: ${stats.updated}/${updates.length}`);
  }

  if (updates.length > 0) console.log('');

  return stats;
}

/**
 * Print sample updates for dry run
 */
function printSampleUpdates(
  ratingData: Map<string, StarRatingData>,
  existingPlans: Map<string, ExistingPlan>
): void {
  console.log('\n' + '─'.repeat(60));
  console.log('SAMPLE UPDATES (first 10 plans with ratings):');
  console.log('─'.repeat(60));

  let count = 0;
  for (const [key, plan] of existingPlans) {
    if (count >= 10) break;

    const csvData = ratingData.get(key);
    if (!csvData || csvData.starRating === null) continue;
    if (plan.star_rating === csvData.starRating) continue;

    console.log(`${key}: ${plan.star_rating ?? 'null'} → ${csvData.starRating}`);
    count++;
  }

  if (count === 0) {
    console.log('No updates needed - all ratings already match.');
  }
}

// ============================================================================
// Main
// ============================================================================
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Update Star Ratings');
  console.log('='.repeat(60));
  console.log(`CSV Path: ${csvPath}`);
  console.log(`Year: ${YEAR}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Verify file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`\nFile not found: ${csvPath}`);
    process.exit(1);
  }

  // Step 1: Parse CSV
  const ratingData = parseLandscapeCSV(csvPath);

  // Step 2: Load existing plans
  const existingPlans = await loadExistingPlans();

  // Step 3: Show sample updates in dry run mode
  if (isDryRun) {
    printSampleUpdates(ratingData, existingPlans);
  }

  // Step 4: Update ratings
  const stats = await updateStarRatings(ratingData, existingPlans);

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Existing Plans: ${existingPlans.size}`);
  console.log(`Plans in CSV (KY): ${ratingData.size}`);
  console.log(`\nResults:`);
  console.log(`  Matched: ${stats.matched}`);
  console.log(`  Updated: ${stats.updated}`);
  console.log(`  Skipped (already set): ${stats.skipped}`);
  console.log(`  Not Rated (text value): ${stats.notRated}`);
  console.log(`  Not in CSV: ${stats.notInCsv}`);
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
