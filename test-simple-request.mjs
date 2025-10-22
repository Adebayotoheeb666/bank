console.log('Testing simple HTTP requests...\n');

// Test root endpoint
try {
  console.log('1. Testing GET /');
  const res1 = await fetch('http://localhost:3000/', { timeout: 10000 });
  console.log(`   Status: ${res1.status}\n`);
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

// Test sign-in endpoint
try {
  console.log('2. Testing GET /sign-in');
  const res2 = await fetch('http://localhost:3000/sign-in', { timeout: 10000 });
  console.log(`   Status: ${res2.status}\n`);
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

// Test health endpoint
try {
  console.log('3. Testing GET /api/health');
  const res3 = await fetch('http://localhost:3000/api/health', { timeout: 10000 });
  console.log(`   Status: ${res3.status}`);
  const data = await res3.json();
  console.log(`   Data: ${JSON.stringify(data, null, 2)}\n`);
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

console.log('Done!');
process.exit(0);
