console.log('Testing /api/sentry-example-api endpoint...\n');

try {
  const response = await fetch('http://localhost:3000/api/sentry-example-api', { timeout: 10000 });
  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log('Response:', text);
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
