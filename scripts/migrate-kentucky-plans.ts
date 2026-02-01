/**
 * Kentucky Plans Migration Script
 *
 * Migrates plan data from src/data/kentucky-plans-2026.ts to Supabase:
 * - 153 plans → cms_plans table
 * - 11,165 service area records → cms_service_areas table
 *
 * Usage:
 *   npx tsx scripts/migrate-kentucky-plans.ts
 *   npx tsx scripts/migrate-kentucky-plans.ts --dry-run
 *
 * Environment variables required (in .env or .env.local):
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import plan data
import { KENTUCKY_PLANS, SERVICE_AREAS, type MAPlan } from '../src/data/kentucky-plans-2026.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// Kentucky County FIPS Lookup Table
// Official codes from US Census Bureau (State FIPS 21 = Kentucky)
// https://www.census.gov/library/reference/code-lists/ansi.html
// ============================================================================
const COUNTY_FIPS: Record<string, string> = {
  'Adair': '21001',
  'Allen': '21003',
  'Anderson': '21005',
  'Ballard': '21007',
  'Barren': '21009',
  'Bath': '21011',
  'Bell': '21013',
  'Boone': '21015',
  'Bourbon': '21017',
  'Boyd': '21019',
  'Boyle': '21021',
  'Bracken': '21023',
  'Breathitt': '21025',
  'Breckinridge': '21027',
  'Bullitt': '21029',
  'Butler': '21031',
  'Caldwell': '21033',
  'Calloway': '21035',
  'Campbell': '21037',
  'Carlisle': '21039',
  'Carroll': '21041',
  'Carter': '21043',
  'Casey': '21045',
  'Christian': '21047',
  'Clark': '21049',
  'Clay': '21051',
  'Clinton': '21053',
  'Crittenden': '21055',
  'Cumberland': '21057',
  'Daviess': '21059',
  'Edmonson': '21061',
  'Elliott': '21063',
  'Estill': '21065',
  'Fayette': '21067',
  'Fleming': '21069',
  'Floyd': '21071',
  'Franklin': '21073',
  'Fulton': '21075',
  'Gallatin': '21077',
  'Garrard': '21079',
  'Grant': '21081',
  'Graves': '21083',
  'Grayson': '21085',
  'Green': '21087',
  'Greenup': '21089',
  'Hancock': '21091',
  'Hardin': '21093',
  'Harlan': '21095',
  'Harrison': '21097',
  'Hart': '21099',
  'Henderson': '21101',
  'Henry': '21103',
  'Hickman': '21105',
  'Hopkins': '21107',
  'Jackson': '21109',
  'Jefferson': '21111',
  'Jessamine': '21113',
  'Johnson': '21115',
  'Kenton': '21117',
  'Knott': '21119',
  'Knox': '21121',
  'Larue': '21123',
  'Laurel': '21125',
  'Lawrence': '21127',
  'Lee': '21129',
  'Leslie': '21131',
  'Letcher': '21133',
  'Lewis': '21135',
  'Lincoln': '21137',
  'Livingston': '21139',
  'Logan': '21141',
  'Lyon': '21143',
  'McCracken': '21145',
  'McCreary': '21147',
  'McLean': '21149',
  'Madison': '21151',
  'Magoffin': '21153',
  'Marion': '21155',
  'Marshall': '21157',
  'Martin': '21159',
  'Mason': '21161',
  'Meade': '21163',
  'Menifee': '21165',
  'Mercer': '21167',
  'Metcalfe': '21169',
  'Monroe': '21171',
  'Montgomery': '21173',
  'Morgan': '21175',
  'Muhlenberg': '21177',
  'Nelson': '21179',
  'Nicholas': '21181',
  'Ohio': '21183',
  'Oldham': '21185',
  'Owen': '21187',
  'Owsley': '21189',
  'Pendleton': '21191',
  'Perry': '21193',
  'Pike': '21195',
  'Powell': '21197',
  'Pulaski': '21199',
  'Robertson': '21201',
  'Rockcastle': '21203',
  'Rowan': '21205',
  'Russell': '21207',
  'Scott': '21209',
  'Shelby': '21211',
  'Simpson': '21213',
  'Spencer': '21215',
  'Taylor': '21217',
  'Todd': '21219',
  'Trigg': '21221',
  'Trimble': '21223',
  'Union': '21225',
  'Warren': '21227',
  'Washington': '21229',
  'Wayne': '21231',
  'Webster': '21233',
  'Whitley': '21235',
  'Wolfe': '21237',
  'Woodford': '21239',
};

// ============================================================================
// Configuration
// ============================================================================
const BATCH_SIZE = 100;
const YEAR = 2026;
const STATE_CODE = 'KY';

const isDryRun = process.argv.includes('--dry-run');

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
interface CarrierLookup {
  id: string;
  code: string;
  cms_aliases: string[] | null;
}

interface CmsPlanInsert {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  organization_name: string;
  marketing_name: string | null;
  carrier_id: string | null;
  plan_type: string;
  snp_type: string | null;
  monthly_premium: number;
  annual_deductible: number;
  drug_deductible: number | null;
  moop_in_network: number;
  pcp_copay: string | null;
  specialist_copay: string | null;
  er_copay: string | null;
  urgent_care_copay: string | null;
  inpatient_copay: string | null;
  outpatient_copay: string | null;
  telehealth_copay: string | null;
  drug_tier1: string | null;
  drug_tier2: string | null;
  drug_tier3: string | null;
  drug_tier4: string | null;
  drug_tier5: string | null;
  dental_preventive: string | null;
  dental_comprehensive: string | null;
  dental_max_coverage: number | null;
  vision_exam_copay: string | null;
  vision_allowance: number | null;
  hearing_exam_copay: string | null;
  hearing_aid_allowance: number | null;
  otc_allowance: number | null;
  fitness_benefit: string | null;
  transportation_notes: string | null;
  meal_benefit: string | null;
  raw_benefits: object;
  star_rating: number | null;
  year: number;
  is_active: boolean;
  cms_data_version: string;
}

interface ServiceAreaInsert {
  cms_plan_id: string;
  contract_id: string;
  plan_id: string;
  state_code: string;
  county_fips: string;
  county_name: string;
  year: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load carriers with their CMS aliases for matching
 */
async function loadCarriers(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('carriers')
    .select('id, code, cms_aliases')
    .not('cms_aliases', 'is', null);

  if (error) {
    console.error('Failed to load carriers:', error.message);
    process.exit(1);
  }

  // Build a map from alias → carrier_id
  const aliasToCarrierId = new Map<string, string>();
  for (const carrier of data as CarrierLookup[]) {
    if (carrier.cms_aliases) {
      for (const alias of carrier.cms_aliases) {
        aliasToCarrierId.set(alias.toLowerCase(), carrier.id);
      }
    }
  }

  console.log(`Loaded ${data.length} carriers with ${aliasToCarrierId.size} aliases`);
  return aliasToCarrierId;
}

/**
 * Transform MAPlan to cms_plans insert format
 */
function transformPlan(plan: MAPlan, carrierLookup: Map<string, string>): CmsPlanInsert {
  const carrierId = carrierLookup.get(plan.organizationName.toLowerCase()) || null;

  if (!carrierId) {
    console.warn(`  ⚠ No carrier match for: "${plan.organizationName}" (${plan.id})`);
  }

  return {
    contract_id: plan.contractId,
    plan_id: plan.planId,
    segment_id: '0',
    organization_name: plan.organizationName,
    marketing_name: plan.planName,
    carrier_id: carrierId,
    plan_type: plan.planType,
    snp_type: plan.snpType,
    monthly_premium: plan.premium,
    annual_deductible: plan.deductible,
    drug_deductible: plan.drugDeductible,
    moop_in_network: plan.moop,
    pcp_copay: plan.benefits.pcpCopay,
    specialist_copay: plan.benefits.specialistCopay,
    er_copay: plan.benefits.emergencyCopay,
    urgent_care_copay: plan.benefits.urgentCareCopay,
    inpatient_copay: plan.benefits.inpatientCopay,
    outpatient_copay: plan.benefits.outpatientCopay,
    telehealth_copay: plan.benefits.telehealth,
    drug_tier1: plan.benefits.drugTier1,
    drug_tier2: plan.benefits.drugTier2,
    drug_tier3: plan.benefits.drugTier3,
    drug_tier4: plan.benefits.drugTier4,
    drug_tier5: plan.benefits.drugTier5,
    dental_preventive: plan.benefits.dental?.preventive || null,
    dental_comprehensive: plan.benefits.dental?.comprehensive || null,
    dental_max_coverage: plan.benefits.dental?.maxCoverage || null,
    vision_exam_copay: plan.benefits.vision?.examCopay || null,
    vision_allowance: plan.benefits.vision?.eyewearAllowance || null,
    hearing_exam_copay: plan.benefits.hearing?.examCopay || null,
    hearing_aid_allowance: plan.benefits.hearing?.aidAllowance || null,
    otc_allowance: plan.benefits.otcAllowance,
    fitness_benefit: plan.benefits.fitness,
    transportation_notes: plan.benefits.transportation,
    meal_benefit: plan.benefits.meals,
    raw_benefits: plan.benefits,
    star_rating: plan.starRating,
    year: YEAR,
    is_active: true,
    cms_data_version: 'KY_static_2026_v1',
  };
}

/**
 * Insert plans in batches
 */
async function insertPlans(carrierLookup: Map<string, string>): Promise<Map<string, string>> {
  console.log(`\nInserting ${KENTUCKY_PLANS.length} plans...`);

  const planIdMap = new Map<string, string>(); // contractId-planId → cms_plan_id
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < KENTUCKY_PLANS.length; i += BATCH_SIZE) {
    const batch = KENTUCKY_PLANS.slice(i, i + BATCH_SIZE);
    const transformed = batch.map((plan) => transformPlan(plan, carrierLookup));

    if (isDryRun) {
      console.log(`  [DRY RUN] Would insert plans ${i + 1}-${i + batch.length}`);
      // Simulate IDs for dry run
      batch.forEach((plan, idx) => {
        planIdMap.set(`${plan.contractId}-${plan.planId}`, `dry-run-${i + idx}`);
      });
      inserted += batch.length;
      continue;
    }

    const { data, error } = await supabase
      .from('cms_plans')
      .upsert(transformed, {
        onConflict: 'contract_id,plan_id,segment_id,year',
        ignoreDuplicates: false,
      })
      .select('id, contract_id, plan_id');

    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errors += batch.length;
      continue;
    }

    // Build lookup map
    for (const row of data || []) {
      planIdMap.set(`${row.contract_id}-${row.plan_id}`, row.id);
    }

    inserted += data?.length || 0;
    process.stdout.write(`\r  Inserting plans: ${inserted}/${KENTUCKY_PLANS.length}`);
  }

  console.log(`\n  ✓ Inserted ${inserted} plans (${errors} errors)`);
  return planIdMap;
}

/**
 * Insert service areas in batches
 */
async function insertServiceAreas(planIdMap: Map<string, string>): Promise<void> {
  console.log(`\nInserting ${SERVICE_AREAS.length} service area records...`);

  let inserted = 0;
  let errors = 0;
  let skippedNoFips = 0;
  let skippedNoPlan = 0;

  // Transform all service areas first
  const serviceAreaInserts: ServiceAreaInsert[] = [];
  for (const sa of SERVICE_AREAS) {
    const planKey = `${sa.contractId}-${sa.planId}`;
    const cmsPlanId = planIdMap.get(planKey);

    if (!cmsPlanId) {
      skippedNoPlan++;
      continue;
    }

    const fipsCode = COUNTY_FIPS[sa.countyName];
    if (!fipsCode) {
      if (skippedNoFips === 0) {
        console.warn(`  ⚠ No FIPS code for county: "${sa.countyName}"`);
      }
      skippedNoFips++;
      continue;
    }

    serviceAreaInserts.push({
      cms_plan_id: cmsPlanId,
      contract_id: sa.contractId,
      plan_id: sa.planId,
      state_code: STATE_CODE,
      county_fips: fipsCode,
      county_name: sa.countyName,
      year: YEAR,
    });
  }

  console.log(`  Transformed ${serviceAreaInserts.length} records (skipped: ${skippedNoFips} no FIPS, ${skippedNoPlan} no plan)`);

  // Insert in batches
  for (let i = 0; i < serviceAreaInserts.length; i += BATCH_SIZE) {
    const batch = serviceAreaInserts.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      inserted += batch.length;
      process.stdout.write(`\r  [DRY RUN] Would insert service areas: ${inserted}/${serviceAreaInserts.length}`);
      continue;
    }

    const { data, error } = await supabase
      .from('cms_service_areas')
      .upsert(batch, {
        onConflict: 'contract_id,plan_id,county_fips,year',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`\n  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errors += batch.length;
      continue;
    }

    inserted += data?.length || 0;
    process.stdout.write(`\r  Inserting service areas: ${inserted}/${serviceAreaInserts.length}`);
  }

  console.log(`\n  ✓ Inserted ${inserted} service areas (${errors} errors)`);
}

/**
 * Verify final counts
 */
async function verifyCounts(): Promise<void> {
  if (isDryRun) {
    console.log('\n[DRY RUN] Skipping verification');
    return;
  }

  console.log('\nVerifying database counts...');

  const { count: planCount } = await supabase
    .from('cms_plans')
    .select('*', { count: 'exact', head: true })
    .eq('year', YEAR)
    .eq('is_active', true);

  const { count: saCount } = await supabase
    .from('cms_service_areas')
    .select('*', { count: 'exact', head: true })
    .eq('year', YEAR)
    .eq('state_code', STATE_CODE);

  console.log(`  cms_plans (year=${YEAR}): ${planCount} rows`);
  console.log(`  cms_service_areas (year=${YEAR}, state=KY): ${saCount} rows`);

  // Check carrier matches
  const { count: matchedCount } = await supabase
    .from('cms_plans')
    .select('*', { count: 'exact', head: true })
    .eq('year', YEAR)
    .not('carrier_id', 'is', null);

  console.log(`  Plans with carrier_id: ${matchedCount}/${planCount}`);
}

// ============================================================================
// Main
// ============================================================================
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Kentucky Plans Migration');
  console.log('='.repeat(60));
  console.log(`Source: src/data/kentucky-plans-2026.ts`);
  console.log(`Plans: ${KENTUCKY_PLANS.length}`);
  console.log(`Service Areas: ${SERVICE_AREAS.length}`);
  console.log(`FIPS Codes: ${Object.keys(COUNTY_FIPS).length} counties`);
  console.log(`Year: ${YEAR}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Step 1: Load carrier mappings
  const carrierLookup = await loadCarriers();

  // Step 2: Insert plans
  const planIdMap = await insertPlans(carrierLookup);

  // Step 3: Insert service areas
  await insertServiceAreas(planIdMap);

  // Step 4: Verify
  await verifyCounts();

  console.log('\n' + '='.repeat(60));
  console.log('Migration complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
