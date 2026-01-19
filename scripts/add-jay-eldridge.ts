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

async function main() {
  // Find Eric Price's profile_id
  console.log('Finding Eric Price...');
  const { data: ericPrice, error: ericError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('full_name', 'Eric Price')
    .single();

  if (ericError || !ericPrice) {
    console.error('Error finding Eric Price:', ericError?.message);
    process.exit(1);
  }
  console.log('Found Eric Price:', ericPrice.id);

  // Update Jay Eldridge's manager_id to Eric Price
  console.log('\nUpdating Jay Eldridge manager_id to Eric Price...');
  const { data, error } = await supabase
    .from('profiles')
    .update({ manager_id: ericPrice.id })
    .eq('full_name', 'Jay Eldridge')
    .select('id, full_name, manager_id');

  if (error) {
    console.error('Error updating:', error.message);
    process.exit(1);
  }

  console.log('Updated Jay Eldridge:', JSON.stringify(data, null, 2));
}

main();
