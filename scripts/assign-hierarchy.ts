/**
 * Hierarchy Assignment Script
 *
 * Assigns manager_id to profiles based on CSV manager column mappings.
 *
 * Usage:
 *   npx tsx scripts/assign-hierarchy.ts "./path/to/IMPORT FINAL.csv"
 *   npx tsx scripts/assign-hierarchy.ts "./path/to/IMPORT FINAL.csv" --dry-run
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
// CONFIGURATION
// ============================================================================

// Admin NPNs to skip
const SKIP_NPNS = new Set([
  '17965006', // Andrew Horn
  '9094694',  // Jeremy Boz
]);

// Admin names to skip
const SKIP_NAMES = new Set([
  'Andrew Horn',
  'Jeremy Boz',
  'Austin Tyler',
]);

// MGAs - these get manager_id = NULL (Direct to TIG)
const MGA_NAMES = new Set([
  'Traci O\'Brien',
  'Eric Price',
  'Dennis Pitman',
  'Maria Gutierrez',
  'Bruce Davis',
  'James Disabato',
]);

// Manager column values that mean "Direct to TIG" (NULL)
const DIRECT_TO_TIG_VALUES = [
  'direct to tig',
  'loa to tig',
  'ga direct to tig',
];

// GA → MGA mappings (GAs report to their MGA)
const GA_TO_MGA: Record<string, string> = {
  'Jay Eldridge': 'Eric Price',
  'Taylor Cole': 'Eric Price',
  'Mateo Gonzalez': 'Eric Price',
  'Rick Scroggs': 'Eric Price',
  'Joaquin Crame': 'Eric Price',
  'Mike Sorenson': 'Eric Price',
  'Aaron Ware': 'Jay Eldridge',
};

// CSV manager value → actual manager name mapping
const MANAGER_MAPPINGS: Record<string, string | null> = {
  // Direct mappings
  'Traci O\'Brien': 'Traci O\'Brien',
  'Traci': 'Traci O\'Brien',
  'Eric Price': 'Eric Price',
  'Chris Raon': 'Eric Price',
  'GA under Chris Raon': 'Eric Price',
  'Jay Eldridge': 'Jay Eldridge',
  'Mateo Gonzalez': 'Mateo Gonzalez',
  'Taylor Cole': 'Taylor Cole',
  'Mike Sorenson': 'Mike Sorenson',
  'Dennis Pitman': 'Dennis Pitman',
  'Rick Scroggs': 'Rick Scroggs',
  'Joaquin Crame': 'Joaquin Crame',
  'Maria Gutierrez': 'Maria Gutierrez',
  'Bruce Davis': 'Bruce Davis',
  'Aaron Ware': 'Aaron Ware',
  'LOA to Aaron Ware': 'Aaron Ware',
  'Jay Eldridge - LOA to Aaron Ware': 'Aaron Ware',

  // These map to NULL (Direct to TIG)
  'Jay Eldridge - AOC to Jonathan Hiatt': null,
  'AOC to Chad Goins': null,
  'Ona Jaramillo': null,
  'James Disabato': null,

  // Special case
  'NEEDS ASSIGNMENT': 'Traci O\'Brien',
};

// ============================================================================
// TYPES
// ============================================================================

interface CsvRow {
  name: string;
  npn: string;
  email: string;
  phone: string;
  state: string;
  manager: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  npn: string | null;
  email: string | null;
}

interface UpdateResult {
  profile: Profile;
  oldManagerId: string | null;
  newManagerId: string | null;
  newManagerName: string | null;
  category: 'mga' | 'ga' | 'agent';
  success: boolean;
  error?: string;
}

// ============================================================================
// CSV PARSING
// ============================================================================

function parseCSV(content: string): CsvRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header and at least one data row');
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Find column indices
  const nameIdx = header.findIndex(h => h === 'name' || h === 'full_name');
  const npnIdx = header.findIndex(h => h === 'npn');
  const emailIdx = header.findIndex(h => h === 'email');
  const phoneIdx = header.findIndex(h => h === 'phone');
  const stateIdx = header.findIndex(h => h === 'state');
  const managerIdx = header.findIndex(h => h === 'manager' || h === 'upline' || h === 'mga');

  if (nameIdx === -1) throw new Error('CSV must have a "name" column');
  if (npnIdx === -1) throw new Error('CSV must have an "npn" column');
  if (managerIdx === -1) throw new Error('CSV must have a "manager" column');

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
      npn: values[npnIdx]?.replace(/"/g, '') || '',
      email: emailIdx >= 0 ? values[emailIdx]?.replace(/"/g, '') || '' : '',
      phone: phoneIdx >= 0 ? values[phoneIdx]?.replace(/"/g, '') || '' : '',
      state: stateIdx >= 0 ? values[stateIdx]?.replace(/"/g, '') || '' : '',
      manager: values[managerIdx]?.replace(/"/g, '') || '',
    };

    if (!row.npn) continue;
    rows.push(row);
  }

  return rows;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isDirectToTig(managerValue: string): boolean {
  const lower = managerValue.toLowerCase().trim();
  return DIRECT_TO_TIG_VALUES.some(v => lower.includes(v));
}

function getManagerName(csvManagerValue: string): string | null | undefined {
  // First check if it's a "Direct to TIG" pattern
  if (isDirectToTig(csvManagerValue)) {
    return null;
  }

  // Then check explicit mappings
  const trimmed = csvManagerValue.trim();
  if (trimmed in MANAGER_MAPPINGS) {
    return MANAGER_MAPPINGS[trimmed];
  }

  // Return undefined to indicate unknown mapping
  return undefined;
}

function shouldSkip(profile: Profile): boolean {
  if (profile.npn && SKIP_NPNS.has(profile.npn)) return true;
  if (profile.full_name && SKIP_NAMES.has(profile.full_name)) return true;
  return false;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function assignHierarchy(csvPath: string, dryRun: boolean): Promise<void> {
  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }

  // Read CSV
  const absolutePath = path.resolve(csvPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\nReading CSV: ${absolutePath}`);
  const csvContent = fs.readFileSync(absolutePath, 'utf-8');
  const csvRows = parseCSV(csvContent);
  console.log(`Found ${csvRows.length} rows with NPNs in CSV\n`);

  if (dryRun) {
    console.log('=== DRY RUN MODE - No data will be updated ===\n');
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch all profiles
  console.log('Fetching profiles from database...');
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name, npn, email, manager_id');

  if (fetchError) {
    console.error('Error fetching profiles:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${profiles?.length || 0} profiles in database\n`);

  // Build lookup maps
  const profileByNpn = new Map<string, Profile & { manager_id: string | null }>();
  const profileByName = new Map<string, Profile & { manager_id: string | null }>();

  for (const p of profiles || []) {
    if (p.npn) profileByNpn.set(p.npn, p);
    if (p.full_name) {
      // Store by exact name and also normalized
      profileByName.set(p.full_name, p);
      profileByName.set(p.full_name.toLowerCase(), p);
    }
  }

  // Build NPN → CSV manager mapping
  const npnToManager = new Map<string, string>();
  for (const row of csvRows) {
    if (row.npn && row.manager) {
      npnToManager.set(row.npn, row.manager);
    }
  }

  // Track results
  const results: UpdateResult[] = [];
  let mgaCount = 0;
  let gaCount = 0;
  let agentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let unknownManagerCount = 0;

  // -------------------------------------------------------------------------
  // STEP 1: Set MGAs to manager_id = NULL
  // -------------------------------------------------------------------------
  console.log('STEP 1: Setting MGAs to Direct to TIG (manager_id = NULL)');
  console.log('-'.repeat(60));

  for (const mgaName of MGA_NAMES) {
    const profile = profileByName.get(mgaName);
    if (!profile) {
      console.log(`  [WARN] MGA not found in database: ${mgaName}`);
      continue;
    }

    if (shouldSkip(profile)) {
      console.log(`  [SKIP] Admin: ${mgaName}`);
      skippedCount++;
      continue;
    }

    const result: UpdateResult = {
      profile,
      oldManagerId: profile.manager_id,
      newManagerId: null,
      newManagerName: 'Direct to TIG',
      category: 'mga',
      success: true,
    };

    if (!dryRun) {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: null })
        .eq('id', profile.id);

      if (error) {
        result.success = false;
        result.error = error.message;
        errorCount++;
        console.log(`  [ERROR] ${mgaName}: ${error.message}`);
      } else {
        console.log(`  [SET] ${mgaName} → Direct to TIG (NULL)`);
        mgaCount++;
      }
    } else {
      console.log(`  [WOULD SET] ${mgaName} → Direct to TIG (NULL)`);
      mgaCount++;
    }

    results.push(result);
  }

  // -------------------------------------------------------------------------
  // STEP 2: Set GAs to their MGA
  // -------------------------------------------------------------------------
  console.log('\nSTEP 2: Setting GAs to their MGA');
  console.log('-'.repeat(60));

  for (const [gaName, mgaName] of Object.entries(GA_TO_MGA)) {
    const gaProfile = profileByName.get(gaName);
    const mgaProfile = profileByName.get(mgaName);

    if (!gaProfile) {
      console.log(`  [WARN] GA not found in database: ${gaName}`);
      continue;
    }

    if (!mgaProfile) {
      console.log(`  [WARN] MGA not found in database: ${mgaName}`);
      continue;
    }

    if (shouldSkip(gaProfile)) {
      console.log(`  [SKIP] Admin: ${gaName}`);
      skippedCount++;
      continue;
    }

    const result: UpdateResult = {
      profile: gaProfile,
      oldManagerId: gaProfile.manager_id,
      newManagerId: mgaProfile.id,
      newManagerName: mgaName,
      category: 'ga',
      success: true,
    };

    if (!dryRun) {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: mgaProfile.id })
        .eq('id', gaProfile.id);

      if (error) {
        result.success = false;
        result.error = error.message;
        errorCount++;
        console.log(`  [ERROR] ${gaName} → ${mgaName}: ${error.message}`);
      } else {
        console.log(`  [SET] ${gaName} → ${mgaName}`);
        gaCount++;
      }
    } else {
      console.log(`  [WOULD SET] ${gaName} → ${mgaName}`);
      gaCount++;
    }

    results.push(result);
  }

  // -------------------------------------------------------------------------
  // STEP 3: Assign agents to managers based on CSV
  // -------------------------------------------------------------------------
  console.log('\nSTEP 3: Assigning agents to managers from CSV');
  console.log('-'.repeat(60));

  const unknownManagers = new Set<string>();

  for (const [npn, csvManager] of npnToManager) {
    const profile = profileByNpn.get(npn);
    if (!profile) {
      // Profile not in database (might be admin or not imported)
      continue;
    }

    if (shouldSkip(profile)) {
      skippedCount++;
      continue;
    }

    // Skip MGAs and GAs (already handled)
    if (profile.full_name && MGA_NAMES.has(profile.full_name)) continue;
    if (profile.full_name && GA_TO_MGA[profile.full_name]) continue;

    // Determine manager
    const managerName = getManagerName(csvManager);

    if (managerName === undefined) {
      // Unknown manager value
      unknownManagers.add(csvManager);
      unknownManagerCount++;
      console.log(`  [UNKNOWN] ${profile.full_name} (NPN: ${npn}) has unknown manager: "${csvManager}"`);
      continue;
    }

    let newManagerId: string | null = null;
    let newManagerDisplayName = 'Direct to TIG';

    if (managerName !== null) {
      const managerProfile = profileByName.get(managerName);
      if (!managerProfile) {
        console.log(`  [WARN] Manager not found: ${managerName} (for ${profile.full_name})`);
        continue;
      }
      newManagerId = managerProfile.id;
      newManagerDisplayName = managerName;
    }

    const result: UpdateResult = {
      profile,
      oldManagerId: profile.manager_id,
      newManagerId,
      newManagerName: newManagerDisplayName,
      category: 'agent',
      success: true,
    };

    if (!dryRun) {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: newManagerId })
        .eq('id', profile.id);

      if (error) {
        result.success = false;
        result.error = error.message;
        errorCount++;
        console.log(`  [ERROR] ${profile.full_name} → ${newManagerDisplayName}: ${error.message}`);
      } else {
        console.log(`  [SET] ${profile.full_name} → ${newManagerDisplayName}`);
        agentCount++;
      }
    } else {
      console.log(`  [WOULD SET] ${profile.full_name} → ${newManagerDisplayName}`);
      agentCount++;
    }

    results.push(result);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('HIERARCHY ASSIGNMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`MGAs set to Direct to TIG:  ${mgaCount}`);
  console.log(`GAs assigned to MGAs:       ${gaCount}`);
  console.log(`Agents assigned to managers: ${agentCount}`);
  console.log(`Skipped (admins):           ${skippedCount}`);
  console.log(`Unknown manager values:     ${unknownManagerCount}`);
  console.log(`Errors:                     ${errorCount}`);
  console.log('='.repeat(60));

  if (unknownManagers.size > 0) {
    console.log('\nUnknown manager values found in CSV:');
    for (const m of unknownManagers) {
      console.log(`  - "${m}"`);
    }
    console.log('\nAdd these to MANAGER_MAPPINGS in the script if needed.');
  }

  if (dryRun) {
    console.log('\nThis was a DRY RUN. Run without --dry-run to apply changes.');
  } else {
    const total = mgaCount + gaCount + agentCount;
    console.log(`\nUpdated ${total} profiles. ${skippedCount} skipped, ${errorCount} errors.`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const csvPath = args.find(arg => !arg.startsWith('--'));

if (!csvPath) {
  console.log('Usage: npx tsx scripts/assign-hierarchy.ts <csv-file> [--dry-run]');
  console.log('');
  console.log('Arguments:');
  console.log('  <csv-file>   Path to CSV file with columns: name, npn, manager');
  console.log('  --dry-run    Show what would be updated without actually changing data');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/assign-hierarchy.ts "./IMPORT FINAL.csv" --dry-run');
  console.log('  npx tsx scripts/assign-hierarchy.ts "./IMPORT FINAL.csv"');
  process.exit(1);
}

assignHierarchy(csvPath, dryRun).catch((err) => {
  console.error('Assignment failed:', err);
  process.exit(1);
});
