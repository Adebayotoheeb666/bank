console.log('Testing API connectivity...\n');

async function testFetch(name, url, options) {
  console.log(`Testing ${name}...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ ${name}: HTTP ${response.status}`);
    return { name, status: response.status };
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { name, error: error.message };
  }
}

const results = await Promise.all([
  testFetch('Plaid', 'https://sandbox.plaid.com/institutions/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': '662e1e5fdca064001c3e0086',
      'PLAID-SECRET': 'be405988983be57fe34bef8e9038b3',
    },
    body: JSON.stringify({
      query: 'Chase',
      products: ['auth'],
    }),
  }),
  testFetch('Dwolla', 'https://api-sandbox.dwolla.com/', {
    headers: {
      'Accept': 'application/vnd.dwolla.v1.hal+json',
      'Authorization': 'Bearer qAN5xkFYOSQeUNpN7GSPcGPHH8nSpVrPKSL8Ye5mSSP5AzddNt',
    },
  }),
]);

console.log('\nResults:');
console.log(JSON.stringify(results, null, 2));
