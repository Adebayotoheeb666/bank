console.log('Testing health check endpoint...\n');

const controller = new AbortController();
const timeout = setTimeout(() => {
  console.error('❌ Health check timed out after 15 seconds');
  controller.abort();
  process.exit(1);
}, 15000);

try {
  const response = await fetch('http://localhost:3000/api/health', {
    signal: controller.signal,
  });
  
  clearTimeout(timeout);
  
  const data = await response.json();
  console.log('✅ Health Check Response:\n');
  console.log(JSON.stringify(data, null, 2));
  
  process.exit(response.status === 200 ? 0 : 1);
} catch (error) {
  clearTimeout(timeout);
  console.error('❌ Error:', error.message);
  process.exit(1);
}
