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

async function checkOrphans() {
  console.log('CONTRACTING APPLICATIONS DATA INTEGRITY CHECK');
  console.log('='.repeat(80));
  console.log('');

  // 1. Count orphaned contracting applications (user_id not matching any profile.user_id)
  console.log('1. ORPHANED CONTRACTING APPLICATIONS (user_id with no matching profile)');
  console.log('-'.repeat(80));

  // Get all contracting applications
  const { data: allApps } = await supabase
    .from('contracting_applications')
    .select('user_id');

  // Get all profiles with user_id
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('user_id');

  const profileUserIds = new Set((allProfiles || []).map(p => p.user_id).filter(Boolean));
  const orphaned = (allApps || []).filter(a => a.user_id && !profileUserIds.has(a.user_id));

  console.log(`   Orphaned count: ${orphaned.length}`);

  if (orphaned.length > 0) {
    console.log('');
    console.log('   Orphaned user_ids:');
    for (const app of orphaned) {
      console.log(`   - ${app.user_id}`);
    }
  }

  console.log('');

  // 2. Show contracting queue
  console.log('2. CONTRACTING QUEUE (last 20 applications)');
  console.log('-'.repeat(80));

  const { data: apps, error: appsError } = await supabase
    .from('contracting_applications')
    .select(`
      id,
      full_legal_name,
      status,
      user_id,
      created_at,
      is_test
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (appsError) {
    console.log(`   ERROR: ${appsError.message}`);
  } else if (!apps || apps.length === 0) {
    console.log('   No contracting applications found.');
  } else {
    // Get profile names for matching via user_id
    const userIds = apps.map(a => a.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    console.log('');
    console.log('   ' + 'Agent Name'.padEnd(30) + 'Status'.padEnd(15) + 'Profile Match'.padEnd(20) + 'Test?');
    console.log('   ' + '-'.repeat(75));

    for (const app of apps) {
      const profileName = app.user_id ? profileMap.get(app.user_id) : null;
      const matchStatus = !app.user_id
        ? 'NO USER_ID'
        : profileName
          ? `✓ ${profileName.substring(0, 15)}`
          : '✗ ORPHANED';

      console.log(
        `   ${(app.full_legal_name || 'Unnamed').substring(0, 28).padEnd(30)}` +
        `${(app.status || 'N/A').padEnd(15)}` +
        `${matchStatus.padEnd(20)}` +
        `${app.is_test ? 'Yes' : 'No'}`
      );
    }
  }

  console.log('');

  // 3. Check foreign key constraints
  console.log('3. FOREIGN KEY CONSTRAINTS ON contracting_applications');
  console.log('-'.repeat(80));

  // List known foreign key relationships based on column naming conventions
  console.log('   Known FK relationships (by convention):');
  console.log('   - user_id → auth.users.id');
  console.log('   - sent_to_upline_by → profiles.id (nullable)');
  console.log('');
  console.log('   Note: Cannot query information_schema directly via Supabase client.');
  console.log('   Run the SQL query in Supabase SQL Editor for full constraint details.');

  console.log('');

  // 4. Additional checks
  console.log('4. ADDITIONAL INTEGRITY CHECKS');
  console.log('-'.repeat(80));

  // Check for apps with null user_id
  const { data: nullUserApps } = await supabase
    .from('contracting_applications')
    .select('id, full_legal_name, status')
    .is('user_id', null);

  console.log(`   Applications with NULL user_id: ${nullUserApps?.length || 0}`);

  // Check for test vs non-test
  const { data: testApps } = await supabase
    .from('contracting_applications')
    .select('id')
    .eq('is_test', true);

  const { data: prodApps } = await supabase
    .from('contracting_applications')
    .select('id')
    .or('is_test.is.null,is_test.eq.false');

  console.log(`   Test applications: ${testApps?.length || 0}`);
  console.log(`   Production applications: ${prodApps?.length || 0}`);

  // Check status distribution
  const { data: allApplications } = await supabase
    .from('contracting_applications')
    .select('status');

  const statusCounts: Record<string, number> = {};
  for (const app of allApplications || []) {
    const status = app.status || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  console.log('');
  console.log('   Status distribution:');
  for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${status}: ${count}`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('Done.');
}

checkOrphans().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
