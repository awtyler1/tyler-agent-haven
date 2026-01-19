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

async function check() {
  console.log('='.repeat(60));
  console.log('JAY ELDRIDGE SITUATION CHECK');
  console.log('='.repeat(60));
  console.log('');

  // 1. Find Jay's profile
  console.log('1. FIND JAY ELDRIDGE PROFILE');
  console.log('-'.repeat(60));

  const { data: jayProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, manager_id')
    .or('full_name.ilike.%eldridge%,full_name.ilike.%jaudaun%');

  if (!jayProfiles || jayProfiles.length === 0) {
    console.log('   NOT FOUND - Jay Eldridge does not exist in profiles!');
  } else {
    jayProfiles.forEach(p => {
      console.log(`   ID: ${p.id}`);
      console.log(`   Name: ${p.full_name}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Manager ID: ${p.manager_id || 'NULL (Direct to TIG)'}`);
    });
  }
  console.log('');

  // Get Jay's ID if found
  const jayProfile = jayProfiles?.find(p =>
    p.full_name?.toLowerCase().includes('eldridge') ||
    p.full_name?.toLowerCase().includes('jaudaun')
  );
  const jayId = jayProfile?.id;

  // Get manager name if Jay has one
  if (jayProfile?.manager_id) {
    const { data: jayManager } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', jayProfile.manager_id)
      .single();

    if (jayManager) {
      console.log(`   Manager Name: ${jayManager.full_name}`);
    }
  }
  console.log('');

  // 2. Check who should report to Jay
  console.log('2. AGENTS WHO SHOULD REPORT TO JAY (from CSV mapping)');
  console.log('-'.repeat(60));

  const expectedReports = [
    'Aaron Ware', 'Bill McDowell', 'Billy Hurt', 'Brandi Clark',
    'David Autler', 'Donald Hills', 'Dori Stone', 'George Velarde',
    'Hortencia McKinnon', 'Jennifer Huang', 'Jennifer Pyle', 'Jerome Pinckney',
    'Jill Titus', 'John Gracey', 'Jonathan Hiatt', 'Keri Lowrey',
    'Kristi Smith', 'Lizette Ordones', 'Park Fleshman', 'Patricia Harding',
    'Peter Breen', 'Shane McCartin'
  ];

  const { data: reportProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, manager_id')
    .in('full_name', expectedReports);

  console.log(`   Expected: ${expectedReports.length} agents`);
  console.log(`   Found: ${reportProfiles?.length || 0} agents`);
  console.log('');

  // Build manager ID -> name map
  const managerIds = [...new Set((reportProfiles || []).map(p => p.manager_id).filter(Boolean))];
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', managerIds);

  const managerMap: Record<string, string> = {};
  (managers || []).forEach(m => {
    managerMap[m.id] = m.full_name || 'Unknown';
  });

  // 3. Show current managers
  console.log('3. CURRENT MANAGER ASSIGNMENTS');
  console.log('-'.repeat(60));
  console.log('');
  console.log('   ' + 'Agent'.padEnd(25) + 'Current Manager');
  console.log('   ' + '-'.repeat(50));

  let reportsToJay = 0;
  let reportsToDifferent = 0;
  let noManager = 0;

  (reportProfiles || []).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')).forEach(p => {
    let managerName = 'NULL (Direct to TIG)';
    if (p.manager_id) {
      managerName = managerMap[p.manager_id] || `Unknown (${p.manager_id.slice(0, 8)}...)`;

      if (jayId && p.manager_id === jayId) {
        reportsToJay++;
        managerName += ' ✓';
      } else {
        reportsToDifferent++;
        managerName += ' ✗';
      }
    } else {
      noManager++;
    }

    console.log(`   ${(p.full_name || 'Unnamed').padEnd(25)}${managerName}`);
  });

  console.log('');
  console.log('   ' + '-'.repeat(50));
  console.log(`   Reports to Jay: ${reportsToJay}`);
  console.log(`   Reports to someone else: ${reportsToDifferent}`);
  console.log(`   No manager (Direct to TIG): ${noManager}`);
  console.log('');

  // 4. Check who actually reports to Jay
  if (jayId) {
    console.log('4. WHO ACTUALLY REPORTS TO JAY');
    console.log('-'.repeat(60));

    const { data: actualReports } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('manager_id', jayId)
      .order('full_name');

    if (!actualReports || actualReports.length === 0) {
      console.log('   Nobody currently reports to Jay!');
    } else {
      console.log(`   ${actualReports.length} agents report to Jay:`);
      actualReports.forEach(p => {
        console.log(`   - ${p.full_name} | ${p.email}`);
      });
    }
  }

  // Missing agents check
  const foundNames = new Set((reportProfiles || []).map(p => p.full_name));
  const missingAgents = expectedReports.filter(name => !foundNames.has(name));

  if (missingAgents.length > 0) {
    console.log('');
    console.log('MISSING AGENTS (not found in profiles):');
    missingAgents.forEach(name => console.log(`   - ${name}`));
  }
}

check().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
