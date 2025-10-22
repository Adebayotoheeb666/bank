const https = require('https');

async function testService(name, url, timeout = 5000) {
  console.log(`Testing ${name}...`);
  
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.log(`❌ ${name}: TIMEOUT after ${timeout}ms`);
      resolve({ service: name, status: 'TIMEOUT' });
    }, timeout);

    https.get(url, (res) => {
      clearTimeout(timeoutId);
      console.log(`✅ ${name}: ${res.statusCode}`);
      resolve({ service: name, status: 'OK', code: res.statusCode });
    }).on('error', (error) => {
      clearTimeout(timeoutId);
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      resolve({ service: name, status: 'ERROR', error: error.message });
    });
  });
}

async function main() {
  console.log('Testing service connectivity...\n');
  
  const results = await Promise.all([
    testService('Supabase', 'https://ovcadufnyjexzywrqccc.supabase.co/', 5000),
    testService('Plaid', 'https://sandbox.plaid.com/', 5000),
    testService('Dwolla', 'https://api-sandbox.dwolla.com/', 5000),
  ]);
  
  console.log('\nResults:');
  console.log(JSON.stringify(results, null, 2));
}

main();
