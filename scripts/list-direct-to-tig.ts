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

async function list() {
  // Get admin user_ids
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['super_admin', 'admin']);

  const adminUserIds = new Set((adminRoles || []).map(r => r.user_id));

  // Get all profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, email, state, manager_id')
    .order('full_name');

  const profiles = allProfiles || [];

  // Get IDs of profiles that have downline (are managers)
  const managerIds = new Set(
    profiles.filter(p => p.manager_id).map(p => p.manager_id)
  );

  // Filter: Direct to TIG, not admin, no downline
  const directToTigNoDownline = profiles.filter(p =>
    p.manager_id === null &&
    (!p.user_id || !adminUserIds.has(p.user_id)) &&
    !managerIds.has(p.id)
  );

  console.log('DIRECT TO TIG AGENTS (no manager, no downline)');
  console.log('='.repeat(80));
  console.log(`Found: ${directToTigNoDownline.length} agents\n`);

  console.log('#   ' + 'Name'.padEnd(30) + 'Email'.padEnd(40) + 'State');
  console.log('-'.repeat(80));

  directToTigNoDownline.forEach((p, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${(p.full_name || 'Unnamed').padEnd(30)}${(p.email || 'N/A').padEnd(40)}${p.state || 'N/A'}`
    );
  });

  console.log('-'.repeat(80));
  console.log(`Total: ${directToTigNoDownline.length}`);
}

list().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
