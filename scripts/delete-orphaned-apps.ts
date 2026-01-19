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

const orphanedUserIds = [
  'c07fd362-f15a-4500-8eb8-5cb792c4845b',
  '74900582-7831-4ac3-8358-4ccd8b205873',
  'e7745d24-083a-4ae6-af7c-26566b907715',
  '7f89ade5-48c3-466d-9595-55926e50e86d'
];

async function deleteOrphans() {
  console.log('DELETE ORPHANED CONTRACTING APPLICATIONS');
  console.log('='.repeat(60));
  console.log('');

  // 1. Delete orphaned applications
  console.log('1. Deleting orphaned applications...');

  const { data: deleted, error: deleteError } = await supabase
    .from('contracting_applications')
    .delete()
    .in('user_id', orphanedUserIds)
    .select('full_legal_name, status');

  if (deleteError) {
    console.error(`   ERROR: ${deleteError.message}`);
    return;
  }

  console.log(`   Deleted ${deleted?.length || 0} applications:`);
  for (const app of deleted || []) {
    console.log(`   - ${app.full_legal_name || 'Unnamed'} (${app.status})`);
  }

  console.log('');

  // 2. Verify remaining count
  console.log('2. Verifying remaining applications...');

  const { data: remaining, error: countError } = await supabase
    .from('contracting_applications')
    .select('*');

  if (countError) {
    console.error(`   ERROR: ${countError.message}`);
    return;
  }

  console.log(`   Remaining count: ${remaining?.length || 0}`);
  console.log('');

  // 3. Show remaining applications
  if (remaining && remaining.length > 0) {
    console.log('3. Remaining applications:');
    console.log('');
    console.log('   ' + 'Agent Name'.padEnd(30) + 'Status');
    console.log('   ' + '-'.repeat(45));

    for (const app of remaining) {
      console.log(`   ${(app.full_legal_name || 'Unnamed').padEnd(30)}${app.status}`);
    }
  } else {
    console.log('3. No applications remaining.');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Done.');
}

deleteOrphans().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
