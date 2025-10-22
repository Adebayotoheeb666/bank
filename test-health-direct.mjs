import { promises as fs } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set environment variables before importing the health check
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

console.log('Testing health check with timeout...\n');

const controller = new AbortController();
const timeout = setTimeout(() => {
  console.error('❌ Health check timed out after 10 seconds');
  controller.abort();
  process.exit(1);
}, 10000);

try {
  // Try to fetch from the local endpoint
  const response = await fetch('http://localhost:3000/api/health', {
    signal: controller.signal,
  });
  
  clearTimeout(timeout);
  
  const data = await response.json();
  console.log('✅ Health Check Response:');
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nStatus: ${response.status}`);
  
  process.exit(response.status === 200 ? 0 : 1);
} catch (error) {
  clearTimeout(timeout);
  console.error('❌ Error:', error.message);
  process.exit(1);
}
