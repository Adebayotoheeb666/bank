console.log('Testing health check logic directly...\n');

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ovcadufnyjexzywrqccc.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Y2FkdWZueWpleHp5d3JxY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDgwMTUsImV4cCI6MjA3NjM4NDAxNX0.T9xAnIpj3TrV1b4dhEZTIbslio6cQQsl4PdNDFu57mc";
process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Y2FkdWZueWpleHp5d3JxY2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgwODAxNSwiZXhwIjoyMDc2Mzg0MDE1fQ.QKB2INMTO19VqQhJhM1wAuiVwxU7lrON-IOo_WSbGKY";
process.env.PLAID_CLIENT_ID = "662e1e5fdca064001c3e0086";
process.env.PLAID_SECRET = "be405988983be57fe34bef8e9038b3";
process.env.PLAID_ENV = "sandbox";
process.env.PLAID_PRODUCTS = "auth,transactions,identity";
process.env.PLAID_COUNTRY_CODES = "US,CA";
process.env.DWOLLA_KEY = "qAN5xkFYOSQeUNpN7GSPcGPHH8nSpVrPKSL8Ye5mSSP5AzddNt";
process.env.DWOLLA_SECRET = "FI50i6NbUQ90106Bt1n9bH6aCNWhcs8Rliy7VRqrXgNbKtLy00";
process.env.DWOLLA_BASE_URL = "https://api-sandbox.dwolla.com";
process.env.DWOLLA_ENV = "sandbox";

import { createClient } from '@supabase/supabase-js';

// Test 1: Plaid
console.log('Test 1: Plaid API\n');
try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://sandbox.plaid.com/institutions/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
    body: JSON.stringify({
      query: 'Chase',
      products: ['auth'],
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  console.log(`  Status: ${response.status}`);
  if (response.ok) {
    console.log('  ✅ Plaid is connected\n');
  } else if (response.status === 400) {
    console.log('  ⚠️  Plaid connected but invalid credentials\n');
  }
} catch (error) {
  console.log(`  ❌ Error: ${error.message}\n`);
}

// Test 2: Dwolla
console.log('Test 2: Dwolla API\n');
try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://api-sandbox.dwolla.com/', {
    headers: {
      'Accept': 'application/vnd.dwolla.v1.hal+json',
      'Authorization': `Bearer ${process.env.DWOLLA_KEY}`,
    },
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  console.log(`  Status: ${response.status}`);
  if (response.ok) {
    console.log('  ✅ Dwolla is connected\n');
  } else if (response.status === 401) {
    console.log('  ⚠️  Dwolla connected but invalid credentials\n');
  }
} catch (error) {
  console.log(`  ❌ Error: ${error.message}\n`);
}

// Test 3: Supabase
console.log('Test 3: Supabase Database\n');
try {
  const supabaseUrl = "https://ovcadufnyjexzywrqccc.supabase.co";
  const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Y2FkdWZueWpleHp5d3JxY2NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDgwODAxNSwiZXhwIjoyMDc2Mzg0MDE1fQ.QKB2INMTO19VqQhJhM1wAuiVwxU7lrON-IOo_WSbGKY";

  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await Promise.race([
    client.from('users').select('id').limit(1),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
  ]);

  if (error) {
    console.log(`  Error: ${error.message}\n`);
  } else {
    console.log('  ✅ Supabase is connected\n');
  }
} catch (error) {
  console.log(`  ❌ Error: ${error.message}\n`);
}

console.log('Health check test complete!');
process.exit(0);
