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

const agentsToUpdate = ['Craig Freeze', 'Jude Tomaselli', 'Luke Harrison', 'Vern Henry', 'Zach Flowers'];

async function update() {
  console.log('ASSIGN AGENTS TO JAY ELDRIDGE');
  console.log('='.repeat(60));
  console.log('');

  // 1. Get Jay Eldridge's profile ID
  console.log('1. Finding Jay Eldridge...');
  const { data: jayProfile, error: jayError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('full_name', 'Jay Eldridge')
    .single();

  if (jayError || !jayProfile) {
    console.error('   ERROR: Jay Eldridge not found!');
    return;
  }

  console.log(`   Found: ${jayProfile.full_name} (ID: ${jayProfile.id})`);
  console.log('');

  // 2. Update the agents
  console.log('2. Updating agents...');

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ manager_id: jayProfile.id })
    .in('full_name', agentsToUpdate)
    .select('full_name, email');

  if (updateError) {
    console.error('   ERROR:', updateError.message);
    return;
  }

  console.log(`   Updated ${updated?.length || 0} agents:`);
  (updated || []).forEach(p => {
    console.log(`   - ${p.full_name} | ${p.email}`);
  });
  console.log('');

  // 3. Verify the update
  console.log('3. Verifying assignments...');

  const { data: verified } = await supabase
    .from('profiles')
    .select('full_name, manager_id')
    .in('full_name', agentsToUpdate);

  console.log('');
  console.log('   ' + 'Agent'.padEnd(25) + 'Manager');
  console.log('   ' + '-'.repeat(50));

  for (const agent of verified || []) {
    let managerName = 'NULL';
    if (agent.manager_id) {
      const { data: manager } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', agent.manager_id)
        .single();
      managerName = manager?.full_name || 'Unknown';
    }
    console.log(`   ${agent.full_name.padEnd(25)}${managerName}`);
  }

  console.log('');
  console.log('Done! 5 agents now report to Jay Eldridge.');
}

update().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
