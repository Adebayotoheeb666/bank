process.env.PLAID_CLIENT_ID = "662e1e5fdca064001c3e0086";
process.env.PLAID_SECRET = "be405988983be57fe34bef8e9038b3";
process.env.PLAID_ENV = "sandbox";

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

console.log('Testing Plaid API directly...\n');

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    }
  }
});

const plaidClient = new PlaidApi(configuration);

console.log('Calling plaidClient.institutionsGetById...');

const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
);

try {
  const responsePromise = plaidClient.institutionsGetById({
    institution_id: 'ins_1',
    country_codes: ['US'],
  });

  const response = await Promise.race([responsePromise, timeoutPromise]);
  console.log('✅ Response:', response?.data);
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error?.response?.data) {
    console.error('Response data:', error.response.data);
  }
}

process.exit(0);
