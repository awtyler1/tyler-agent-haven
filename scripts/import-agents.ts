/**
 * Agent Import Script
 *
 * Imports agents from a CSV file into the profiles table.
 *
 * Usage:
 *   npm run import:agents ./path/to/agents.csv
 *   npm run import:agents ./path/to/agents.csv --dry-run
 *
 * Or directly:
 *   node --loader ts-node/esm scripts/import-agents.ts ./path/to/agents.csv
 *
 * CSV columns expected: name, npn, email, phone, state
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

// Load environment variables from .env and .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
config({ path: path.resolve(__dirname, '../.env.local') });

// Admin NPNs to exclude from import
const EXCLUDED_NPNS = new Set([
  '17965006', // Andrew Horn
  '9094694',  // Jeremy Boz
]);

interface CsvRow {
  name: string;
  npn: string;
  email: string;
  phone: string;
  state: string;
}

interface ImportResult {
  success: boolean;
  row: CsvRow;
  error?: string;
  skippedReason?: 'excluded' | 'duplicate' | 'error';
}

function parseCSV(content: string): CsvRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Find column indices
  const nameIdx = header.findIndex(h => h === 'name' || h === 'full_name');
  const npnIdx = header.findIndex(h => h === 'npn');
  const emailIdx = header.findIndex(h => h === 'email');
  const phoneIdx = header.findIndex(h => h === 'phone');
  const stateIdx = header.findIndex(h => h === 'state');

  if (nameIdx === -1) throw new Error('CSV must have a "name" column');
  if (emailIdx === -1) throw new Error('CSV must have an "email" column');

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: CsvRow = {
      name: values[nameIdx]?.replace(/"/g, '') || '',
      npn: npnIdx >= 0 ? values[npnIdx]?.replace(/"/g, '') || '' : '',
      email: values[emailIdx]?.replace(/"/g, '') || '',
      phone: phoneIdx >= 0 ? values[phoneIdx]?.replace(/"/g, '') || '' : '',
      state: stateIdx >= 0 ? values[stateIdx]?.replace(/"/g, '') || '' : '',
    };

    // Skip empty rows
    if (!row.name && !row.email) continue;

    rows.push(row);
  }

  return rows;
}

async function importAgents(csvPath: string, dryRun: boolean): Promise<void> {
  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }

  // Read and parse CSV
  const absolutePath = path.resolve(csvPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\nReading CSV: ${absolutePath}`);
  const csvContent = fs.readFileSync(absolutePath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} rows in CSV\n`);

  if (dryRun) {
    console.log('=== DRY RUN MODE - No data will be inserted ===\n');
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Track results
  const results: ImportResult[] = [];
  let imported = 0;
  let skippedExcluded = 0;
  let skippedDuplicate = 0;
  let skippedError = 0;

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed and header row

    // Check if NPN is in exclude list
    if (row.npn && EXCLUDED_NPNS.has(row.npn)) {
      console.log(`[${rowNum}] SKIP (excluded admin): ${row.name} (NPN: ${row.npn})`);
      results.push({ success: false, row, skippedReason: 'excluded' });
      skippedExcluded++;
      continue;
    }

    // Prepare profile data
    const profileData = {
      full_name: row.name || null,
      npn: row.npn || null,
      email: row.email ? row.email.toLowerCase().trim() : null,
      phone: row.phone || null,
      state: row.state || null,
      user_id: null,
      invited_at: null,
      is_active: true,
      is_test: false,
      onboarding_status: 'CONTRACTING_REQUIRED' as const,
      manager_id: null,
    };

    if (dryRun) {
      console.log(`[${rowNum}] WOULD IMPORT: ${row.name} | ${row.email} | NPN: ${row.npn || 'N/A'} | ${row.state || 'N/A'}`);
      results.push({ success: true, row });
      imported++;
      continue;
    }

    // Insert into database
    const { error } = await supabase
      .from('profiles')
      .insert(profileData);

    if (error) {
      // Check if it's a duplicate error
      const isDuplicate = error.message.includes('duplicate') ||
                          error.message.includes('unique') ||
                          error.code === '23505';

      if (isDuplicate) {
        console.log(`[${rowNum}] SKIP (duplicate): ${row.name} | ${row.email} | NPN: ${row.npn || 'N/A'}`);
        results.push({ success: false, row, error: error.message, skippedReason: 'duplicate' });
        skippedDuplicate++;
      } else {
        console.error(`[${rowNum}] ERROR: ${row.name} | ${row.email} - ${error.message}`);
        results.push({ success: false, row, error: error.message, skippedReason: 'error' });
        skippedError++;
      }
      continue;
    }

    console.log(`[${rowNum}] IMPORTED: ${row.name} | ${row.email} | NPN: ${row.npn || 'N/A'} | ${row.state || 'N/A'}`);
    results.push({ success: true, row });
    imported++;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total rows in CSV:     ${rows.length}`);
  console.log(`Successfully imported: ${imported}`);
  console.log(`Skipped (excluded):    ${skippedExcluded}`);
  console.log(`Skipped (duplicates):  ${skippedDuplicate}`);
  console.log(`Skipped (errors):      ${skippedError}`);
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\nThis was a DRY RUN. Run without --dry-run to actually import.');
  } else {
    console.log(`\nImported ${imported} of ${rows.length} agents. ${skippedExcluded + skippedDuplicate + skippedError} skipped.`);
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const csvPath = args.find(arg => !arg.startsWith('--'));

if (!csvPath) {
  console.log('Usage: npx ts-node scripts/import-agents.ts <csv-file> [--dry-run]');
  console.log('');
  console.log('Arguments:');
  console.log('  <csv-file>   Path to CSV file with columns: name, npn, email, phone, state');
  console.log('  --dry-run    Show what would be imported without actually inserting');
  console.log('');
  console.log('Environment variables required:');
  console.log('  SUPABASE_URL              Your Supabase project URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY Service role key (from Supabase dashboard)');
  console.log('');
  console.log('Example:');
  console.log('  npx ts-node scripts/import-agents.ts ./agents.csv --dry-run');
  console.log('  npx ts-node scripts/import-agents.ts ./agents.csv');
  process.exit(1);
}

importAgents(csvPath, dryRun).catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
