import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ovcadufnyjexzywrqccc.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Y2FkdWZueWpleHp5d3JxY2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgwODAxNSwiZXhwIjoyMDc2Mzg0MDE1fQ.QKB2INMTO19VqQhJhM1wAuiVwxU7lrON-IOo_WSbGKY";

console.log('Testing Supabase connection...\n');

const controller = new AbortController();
const timeoutId = setTimeout(() => {
  console.error('❌ Supabase query timed out after 5 seconds');
  controller.abort();
  process.exit(1);
}, 5000);

try {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log('✅ Supabase client created');
  console.log('Querying users table...');

  const { data, error } = await client
    .from('users')
    .select('id')
    .limit(1);

  clearTimeout(timeoutId);

  if (error) {
    console.error('❌ Query error:', error.message);
    process.exit(1);
  }

  console.log('✅ Query successful');
  console.log('Data:', data);
  process.exit(0);
} catch (error) {
  clearTimeout(timeoutId);
  console.error('❌ Error:', error.message);
  process.exit(1);
}
