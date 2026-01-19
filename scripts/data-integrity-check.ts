/**
 * Data Integrity Check Script
 * Runs various checks on the profiles table to ensure data quality.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runChecks() {
  console.log('='.repeat(60));
  console.log('DATA INTEGRITY CHECK');
  console.log('='.repeat(60));
  console.log('');

  // Get admin user_ids first
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['super_admin', 'admin']);

  const adminUserIds = new Set((adminRoles || []).map(r => r.user_id));

  // Fetch all profiles
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, email, npn, manager_id, is_active')
    .order('full_name');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
    return;
  }

  const profiles = allProfiles || [];
  const profileIds = new Set(profiles.map(p => p.id));

  // Filter out admins
  const nonAdminProfiles = profiles.filter(p => !p.user_id || !adminUserIds.has(p.user_id));

  // -------------------------------------------------------------------------
  // CHECK 1: Total agent count (excluding admins)
  // -------------------------------------------------------------------------
  console.log('1. TOTAL AGENT COUNT (excluding admins)');
  console.log('-'.repeat(60));
  console.log(`   Total profiles: ${profiles.length}`);
  console.log(`   Admin profiles: ${profiles.length - nonAdminProfiles.length}`);
  console.log(`   Agent profiles: ${nonAdminProfiles.length}`);
  console.log('');

  // -------------------------------------------------------------------------
  // CHECK 2: Agents without manager (MGAs / Direct to TIG)
  // -------------------------------------------------------------------------
  console.log('2. AGENTS WITHOUT MANAGER (Direct to TIG)');
  console.log('-'.repeat(60));

  const noManagerProfiles = nonAdminProfiles.filter(p => p.manager_id === null);
  console.log(`   Count: ${noManagerProfiles.length}`);
  console.log('');
  noManagerProfiles.forEach(p => {
    console.log(`   - ${p.full_name || 'Unnamed'} | ${p.email || 'no email'} | NPN: ${p.npn || 'N/A'}`);
  });
  console.log('');

  // -------------------------------------------------------------------------
  // CHECK 3: Orphaned agents (manager_id points to non-existent profile)
  // -------------------------------------------------------------------------
  console.log('3. ORPHANED AGENTS (manager_id points to non-existent profile)');
  console.log('-'.repeat(60));

  const orphanedProfiles = nonAdminProfiles.filter(
    p => p.manager_id !== null && !profileIds.has(p.manager_id)
  );

  if (orphanedProfiles.length === 0) {
    console.log('   None found (GOOD)');
  } else {
    console.log(`   ISSUE: ${orphanedProfiles.length} orphaned profiles found!`);
    orphanedProfiles.forEach(p => {
      console.log(`   - ${p.full_name} | manager_id: ${p.manager_id}`);
    });
  }
  console.log('');

  // -------------------------------------------------------------------------
  // CHECK 4: Duplicate emails
  // -------------------------------------------------------------------------
  console.log('4. DUPLICATE EMAILS');
  console.log('-'.repeat(60));

  const emailCounts = new Map<string, typeof profiles>();
  profiles.forEach(p => {
    if (p.email) {
      const email = p.email.toLowerCase();
      if (!emailCounts.has(email)) {
        emailCounts.set(email, []);
      }
      emailCounts.get(email)!.push(p);
    }
  });

  const duplicateEmails = Array.from(emailCounts.entries()).filter(([_, arr]) => arr.length > 1);

  if (duplicateEmails.length === 0) {
    console.log('   None found (GOOD)');
  } else {
    console.log(`   ISSUE: ${duplicateEmails.length} duplicate emails found!`);
    duplicateEmails.forEach(([email, arr]) => {
      console.log(`   - ${email} (${arr.length} profiles):`);
      arr.forEach(p => console.log(`     * ${p.full_name} | id: ${p.id}`));
    });
  }
  console.log('');

  // -------------------------------------------------------------------------
  // CHECK 5: Duplicate NPNs
  // -------------------------------------------------------------------------
  console.log('5. DUPLICATE NPNs');
  console.log('-'.repeat(60));

  const npnCounts = new Map<string, typeof profiles>();
  profiles.forEach(p => {
    if (p.npn) {
      if (!npnCounts.has(p.npn)) {
        npnCounts.set(p.npn, []);
      }
      npnCounts.get(p.npn)!.push(p);
    }
  });

  const duplicateNpns = Array.from(npnCounts.entries()).filter(([_, arr]) => arr.length > 1);

  if (duplicateNpns.length === 0) {
    console.log('   None found (GOOD)');
  } else {
    console.log(`   ISSUE: ${duplicateNpns.length} duplicate NPNs found!`);
    duplicateNpns.forEach(([npn, arr]) => {
      console.log(`   - NPN ${npn} (${arr.length} profiles):`);
      arr.forEach(p => console.log(`     * ${p.full_name} | email: ${p.email}`));
    });
  }
  console.log('');

  // -------------------------------------------------------------------------
  // CHECK 6: MGA downline counts
  // -------------------------------------------------------------------------
  console.log('6. MGA DOWNLINE COUNTS (Direct to TIG with reports)');
  console.log('-'.repeat(60));

  // Build manager -> direct reports map
  const directReportsMap = new Map<string, typeof profiles>();
  nonAdminProfiles.forEach(p => {
    if (p.manager_id) {
      if (!directReportsMap.has(p.manager_id)) {
        directReportsMap.set(p.manager_id, []);
      }
      directReportsMap.get(p.manager_id)!.push(p);
    }
  });

  // Calculate total downline recursively
  function getTotalDownline(managerId: string, visited = new Set<string>()): number {
    if (visited.has(managerId)) return 0; // Prevent cycles
    visited.add(managerId);

    const directReports = directReportsMap.get(managerId) || [];
    let total = directReports.length;

    directReports.forEach(report => {
      total += getTotalDownline(report.id, visited);
    });

    return total;
  }

  // MGAs = no manager + have direct reports
  const mgas = noManagerProfiles.filter(p => directReportsMap.has(p.id));

  console.log(`   Found ${mgas.length} MGAs (Direct to TIG with downline):\n`);

  const mgaStats = mgas.map(mga => ({
    name: mga.full_name || 'Unnamed',
    email: mga.email,
    directReports: (directReportsMap.get(mga.id) || []).length,
    totalDownline: getTotalDownline(mga.id),
  })).sort((a, b) => b.totalDownline - a.totalDownline);

  console.log('   ' + 'Name'.padEnd(25) + 'Direct'.padEnd(10) + 'Total');
  console.log('   ' + '-'.repeat(45));

  mgaStats.forEach(mga => {
    console.log(`   ${mga.name.padEnd(25)}${String(mga.directReports).padEnd(10)}${mga.totalDownline}`);
  });

  const totalAssigned = mgaStats.reduce((sum, m) => sum + m.totalDownline, 0);
  console.log('   ' + '-'.repeat(45));
  console.log(`   ${'TOTAL'.padEnd(25)}${' '.padEnd(10)}${totalAssigned}`);
  console.log('');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total agents (non-admin): ${nonAdminProfiles.length}`);
  console.log(`Direct to TIG (no manager): ${noManagerProfiles.length}`);
  console.log(`MGAs (with downline): ${mgas.length}`);
  console.log(`Orphaned profiles: ${orphanedProfiles.length}`);
  console.log(`Duplicate emails: ${duplicateEmails.length}`);
  console.log(`Duplicate NPNs: ${duplicateNpns.length}`);

  const issues = orphanedProfiles.length + duplicateEmails.length + duplicateNpns.length;
  if (issues === 0) {
    console.log('\nNo data integrity issues found!');
  } else {
    console.log(`\nWARNING: ${issues} issue(s) found - see details above.`);
  }
}

runChecks().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
