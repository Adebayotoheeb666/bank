console.log('Testing /api/health endpoint...\n');

try {
  const response = await fetch('http://localhost:3000/api/health', { timeout: 10000 });
  const data = await response.json();
  
  console.log('✅ Health Check Response:\n');
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nStatus Code: ${response.status}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
