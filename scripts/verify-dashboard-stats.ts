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

async function verify() {
  console.log('ADMIN DASHBOARD DATA VERIFICATION');
  console.log('='.repeat(70));
  console.log('');

  // 1. Get all profiles (exclude test)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, onboarding_status, is_test')
    .or('is_test.is.null,is_test.eq.false');

  // 2. Get all roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role');

  const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

  // 3. Filter to agents only
  const agentRoles = ['independent_agent', 'internal_tig_agent'];
  const agents = (profiles || []).filter(p => agentRoles.includes(roleMap.get(p.user_id) || ''));

  console.log('1. STATS VERIFICATION');
  console.log('-'.repeat(70));
  console.log(`   Total profiles (non-test): ${profiles?.length || 0}`);
  console.log(`   Profiles with agent roles: ${agents.length}`);
  console.log('');

  // Onboarding status breakdown
  const statusCounts: Record<string, number> = {};
  for (const agent of agents) {
    const status = agent.onboarding_status || 'NULL';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  console.log('   Onboarding status breakdown (agents only):');
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    console.log(`   - ${status}: ${count}`);
  }

  // Dashboard stats calculation
  const inContracting = agents.filter(a =>
    a.onboarding_status === 'CONTRACTING_REQUIRED' ||
    a.onboarding_status === 'CONTRACTING_SUBMITTED'
  ).length;
  const appointed = agents.filter(a => a.onboarding_status === 'APPOINTED').length;

  console.log('');
  console.log('   Dashboard would show:');
  console.log(`   - Total Agents: ${agents.length}`);
  console.log(`   - In Contracting: ${inContracting}`);
  console.log(`   - Appointed: ${appointed}`);
  console.log('');

  // 4. Check contracting applications
  console.log('2. CONTRACTING QUEUE DATA');
  console.log('-'.repeat(70));

  const { data: apps } = await supabase
    .from('contracting_applications')
    .select('id, full_legal_name, status, submitted_at')
    .or('is_test.is.null,is_test.eq.false')
    .in('status', ['submitted', 'in_progress']);

  const newSubmissions = (apps || []).filter(a => a.status === 'submitted').length;

  console.log(`   Total in queue: ${apps?.length || 0}`);
  console.log(`   New submissions (badge count): ${newSubmissions}`);
  console.log('');

  // Stale applications check
  const now = new Date();
  const staleApps = (apps || []).filter(app => {
    if (app.submitted_at && app.status === 'submitted') {
      const daysAgo = Math.floor((now.getTime() - new Date(app.submitted_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo >= 3;
    }
    return false;
  });

  console.log(`   Stale applications (3+ days): ${staleApps.length}`);
  console.log('');

  // 5. Carrier issues
  console.log('3. CARRIER ISSUES');
  console.log('-'.repeat(70));

  const { data: carrierIssues } = await supabase
    .from('carrier_statuses')
    .select('id, user_id, issue_description')
    .eq('contracting_status', 'issue');

  console.log(`   Carrier issues: ${carrierIssues?.length || 0}`);
  console.log('');

  // 6. Role distribution
  console.log('4. ROLE DISTRIBUTION (all users)');
  console.log('-'.repeat(70));

  const roleCounts: Record<string, number> = {};
  for (const role of roles || []) {
    roleCounts[role.role] = (roleCounts[role.role] || 0) + 1;
  }

  for (const [role, count] of Object.entries(roleCounts).sort()) {
    console.log(`   - ${role}: ${count}`);
  }

  console.log('');
  console.log('='.repeat(70));

  // 7. Potential issues
  console.log('');
  console.log('POTENTIAL ISSUES DETECTED:');
  console.log('-'.repeat(70));

  let issueCount = 0;

  // Check for profiles without roles
  const profilesWithoutRoles = (profiles || []).filter(p => !roleMap.has(p.user_id));
  if (profilesWithoutRoles.length > 0) {
    issueCount++;
    console.log(`   ${issueCount}. ${profilesWithoutRoles.length} profiles have no role assigned`);
    console.log(`      These won't appear in "Total Agents" count`);
  }

  // Check for mismatch between agent count methods
  const allNonAdminProfiles = (profiles || []).filter(p => {
    const role = roleMap.get(p.user_id);
    return role && !['super_admin', 'admin'].includes(role);
  });

  if (allNonAdminProfiles.length !== agents.length) {
    issueCount++;
    console.log(`   ${issueCount}. Agent count mismatch:`);
    console.log(`      - By agent roles: ${agents.length}`);
    console.log(`      - Non-admin profiles: ${allNonAdminProfiles.length}`);
  }

  if (issueCount === 0) {
    console.log('   No issues detected.');
  }

  console.log('');
  console.log('Done.');
}

verify().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
