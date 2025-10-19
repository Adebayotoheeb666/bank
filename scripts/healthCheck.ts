import { createClient } from '@supabase/supabase-js';
import { Client as DwollaClient } from 'dwolla-v2';
import { Configuration, PlaidApi } from 'plaid';

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Plaid
const plaidConfig = new Configuration({
  basePath: 'https://sandbox.plaid.com',
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

// Dwolla
const dwollaClient = new DwollaClient({
  key: process.env.DWOLLA_KEY!,
  secret: process.env.DWOLLA_SECRET!,
  environment: process.env.DWOLLA_ENV === 'production' ? 'production' : 'sandbox',
});

async function healthCheck() {
  // Supabase
  try {
    const { error } = await supabase.from('users').select('*').limit(1);
    if (!error) {
      console.log('Supabase: Connected');
    } else {
      console.error('Supabase: Connection failed', error);
    }
  } catch (err) {
    console.error('Supabase: Error', err);
  }

  // Plaid
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: 'invalid_token_for_test',
    });
    if (response.status === 200 || response.status === 400) {
      console.log('Plaid: Connected');
    }
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof (err as any).response?.status === 'number' &&
      ((err as any).response.status === 400 || (err as any).response.status === 401)
    ) {
      console.log('Plaid: Connected');
    } else {
      console.error('Plaid: Connection failed', err);
    }
  }

  // Dwolla
  try {
    const res = await dwollaClient.get('customers');
    if (res.status === 200) {
      console.log('Dwolla: Connected');
    }
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as any).status === 'number' &&
      ((err as any).status === 401 || (err as any).status === 403)
    ) {
      console.log('Dwolla: Connected (auth error, but API reachable)');
    } else {
      console.error('Dwolla: Connection failed', err);
    }
  }
}

healthCheck();
