# Health Check System - Usage Examples

Complete code examples for every use case.

---

## Table of Contents

1. [CLI Examples](#cli-examples)
2. [HTTP API Examples](#http-api-examples)
3. [Programmatic Examples](#programmatic-examples)
4. [Integration Examples](#integration-examples)
5. [Monitoring Examples](#monitoring-examples)
6. [Error Handling Examples](#error-handling-examples)

---

## CLI Examples

### Example 1: Basic Health Check
```bash
npm run health-check
```

Output:
```
🏥 Starting health check...

╔════════════════════════════════════════════════════════════╗
║          HEALTH CHECK REPORT                               ║
╚════════════════════════════════════════════════════════════╝

Timestamp: 2024-01-15T10:30:45.123Z

📊 OVERALL STATUS: ✅ HEALTHY
   Message: All services healthy ✅

┌─ DATABASE (Supabase) ─────────────────────────────────────┐
│ Status: ✅ CONNECTED
│ Details: CONNECTED
│ Response Time: 245ms
└───────────────────────────────────────────────────────────┘
...
```

### Example 2: Health Check with Exit Code Handling
```bash
#!/bin/bash
# deploy.sh

echo "Checking service health before deployment..."

if npm run health-check; then
  echo "✅ Services healthy - proceeding with deployment"
  npm run build
  npm run deploy
else
  echo "❌ Services unhealthy - aborting deployment"
  exit 1
fi
```

**Run:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Example 3: Health Check with Logging
```bash
# Check health and log to file
npm run health-check > health-check-$(date +%Y%m%d-%H%M%S).log 2>&1

# Check and append to running log
npm run health-check >> health-check.log 2>&1

# Check with timestamp
echo "=== $(date) ===" >> health-check.log
npm run health-check >> health-check.log 2>&1
```

### Example 4: Health Check in Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install

# Health check every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run health-check || exit 1

CMD ["npm", "run", "dev"]
```

**Build and run:**
```bash
docker build -t jsm-banking .
docker run -p 3000:3000 jsm-banking

# Check container health
docker ps  # STATUS column shows (healthy) or (unhealthy)
```

### Example 5: Conditional Startup
```bash
#!/bin/bash
# start.sh

MAX_ATTEMPTS=5
ATTEMPT=1

echo "Waiting for services to be ready..."

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if npm run health-check > /dev/null 2>&1; then
    echo "✅ Services ready on attempt $ATTEMPT"
    npm run dev
    exit 0
  fi
  
  echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting..."
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Services did not become ready after $MAX_ATTEMPTS attempts"
exit 1
```

---

## HTTP API Examples

### Example 1: curl - Basic Health Check
```bash
curl http://localhost:3000/api/health
```

### Example 2: curl - Pretty Print JSON
```bash
curl http://localhost:3000/api/health | jq .
```

### Example 3: curl - Check HTTP Status Code
```bash
# Returns 200 if healthy, 503 if unhealthy
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
```

### Example 4: curl - Head Request (Fast Check)
```bash
# No response body, just headers
curl -I -X HEAD http://localhost:3000/api/health
```

### Example 5: Node.js Fetch
```typescript
// api/server-check.ts
async function checkHealth() {
  const response = await fetch('http://localhost:3000/api/health');
  const data = await response.json();
  
  console.log('Overall Healthy:', data.overall.healthy);
  console.log('Database:', data.database.connected ? 'OK' : 'DOWN');
  console.log('Plaid:', data.plaid.connected ? 'OK' : 'DOWN');
  console.log('Dwolla:', data.dwolla.connected ? 'OK' : 'DOWN');
}

checkHealth();
```

### Example 6: Python
```python
import requests
import json

response = requests.get('http://localhost:3000/api/health')
data = response.json()

print(f"Overall: {'Healthy' if data['overall']['healthy'] else 'Unhealthy'}")
print(f"Database: {data['database']['responseTime']}ms")
print(f"Plaid: {data['plaid']['responseTime']}ms")
print(f"Dwolla: {data['dwolla']['responseTime']}ms")
```

### Example 7: Axios
```typescript
import axios from 'axios';

const checkHealth = async () => {
  try {
    const { data, status } = await axios.get('http://localhost:3000/api/health');
    
    console.log('Status Code:', status);
    console.log('Healthy:', data.overall.healthy);
    
    if (!data.overall.healthy) {
      console.error('Unhealthy services:', data.overall.message);
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
};

checkHealth();
```

### Example 8: Prometheus Metrics
```bash
# Get Prometheus-compatible metrics
curl http://localhost:3000/api/health/metrics

# Output:
# HELP health_check_database Database connectivity
# TYPE health_check_database gauge
health_check_database 1
health_check_database_response_time_ms 245
...
```

---

## Programmatic Examples

### Example 1: Basic Health Check
```typescript
import { runHealthCheck } from '@/lib/health-check';

async function main() {
  const result = await runHealthCheck();
  
  console.log('Healthy:', result.overall.healthy);
  console.log('Message:', result.overall.message);
}

main();
```

### Example 2: Check Individual Services
```typescript
import { runHealthCheck } from '@/lib/health-check';

async function checkServices() {
  const result = await runHealthCheck();
  
  if (!result.database.connected) {
    console.error('❌ Database is down');
    // Handle database down
  }
  
  if (!result.plaid.connected) {
    console.warn('⚠️ Plaid is unavailable - bank linking disabled');
    // Disable bank linking feature
  }
  
  if (!result.dwolla.connected) {
    console.warn('⚠️ Dwolla is unavailable - transfers disabled');
    // Disable transfer feature
  }
}

checkServices();
```

### Example 3: Format and Display Output
```typescript
import { runHealthCheck, formatHealthCheckOutput } from '@/lib/health-check';

async function displayHealth() {
  const result = await runHealthCheck();
  const formatted = formatHealthCheckOutput(result);
  console.log(formatted);
}

displayHealth();
```

### Example 4: Check Specific Service
```typescript
import { isServiceHealthy } from '@/lib/health-check-utils';

async function checkDatabase() {
  const isHealthy = await isServiceHealthy('database');
  
  if (isHealthy) {
    console.log('✅ Database is healthy');
  } else {
    console.log('❌ Database is down');
  }
}

checkDatabase();
```

### Example 5: Get Compact Summary
```typescript
import { getHealthCheckSummary } from '@/lib/health-check-utils';

async function showSummary() {
  const summary = await getHealthCheckSummary();
  console.log(summary);
  // Output: [✅ DB | ✅ Plaid | ✅ Dwolla] ✅ HEALTHY
}

showSummary();
```

### Example 6: Retry Health Check
```typescript
import { retryHealthCheck } from '@/lib/health-check-utils';

async function startWithRetry() {
  const result = await retryHealthCheck(3, 1000);
  
  if (result?.overall.healthy) {
    console.log('✅ Services ready');
    startServer();
  } else {
    console.log('❌ Services failed health check');
    process.exit(1);
  }
}

startWithRetry();
```

### Example 7: Wait for Healthy
```typescript
import { waitForHealthy } from '@/lib/health-check-utils';

async function startup() {
  const timeout = 30000; // 30 seconds
  const interval = 1000; // Check every 1 second
  
  const ready = await waitForHealthy(timeout, interval);
  
  if (ready) {
    console.log('✅ Ready to start server');
    server.listen(3000);
  } else {
    console.log('❌ Services not ready');
    process.exit(1);
  }
}

startup();
```

### Example 8: Compare Health Over Time
```typescript
import { runHealthCheck, compareHealthChecks } from '@/lib/health-check-utils';

async function monitorDegradation() {
  const previous = await runHealthCheck();
  
  // Wait 1 minute
  await new Promise(r => setTimeout(r, 60000));
  
  const current = await runHealthCheck();
  const comparison = compareHealthChecks(previous, current);
  
  if (comparison.degraded) {
    console.log('⚠️ Service degradation detected:');
    console.log(comparison.details.database);
    console.log(comparison.details.plaid);
    console.log(comparison.details.dwolla);
  } else {
    console.log('✅ No degradation detected');
  }
}

monitorDegradation();
```

---

## Integration Examples

### Example 1: Server Startup
```typescript
// server.ts
import { waitForHealthy } from '@/lib/health-check-utils';
import express from 'express';

async function startServer() {
  const app = express();
  
  // Wait for services before starting
  console.log('Checking service health...');
  const ready = await waitForHealthy(30000);
  
  if (!ready) {
    console.error('Services not healthy - refusing to start');
    process.exit(1);
  }
  
  console.log('✅ Services ready - starting server');
  app.listen(3000);
}

startServer();
```

### Example 2: Middleware Protection
```typescript
// middleware.ts
import { runHealthCheck } from '@/lib/health-check';

export async function healthCheckMiddleware(req, res, next) {
  // Skip health endpoint itself
  if (req.path === '/api/health') {
    return next();
  }
  
  // Check health for all other routes
  const health = await runHealthCheck();
  
  if (!health.overall.healthy) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: health.overall.message
    });
  }
  
  next();
}
```

### Example 3: Graceful Degradation
```typescript
// api/transfer.ts
import { isServiceHealthy } from '@/lib/health-check-utils';

export async function initiateTransfer(req, res) {
  // Check if Dwolla is available
  const dwollaHealthy = await isServiceHealthy('dwolla');
  
  if (!dwollaHealthy) {
    return res.status(503).json({
      error: 'Transfer service unavailable',
      message: 'Dwolla API is currently down. Please try again later.'
    });
  }
  
  // Proceed with transfer
  // ...
}
```

### Example 4: Feature Flagging
```typescript
// lib/features.ts
import { isServiceHealthy } from '@/lib/health-check-utils';

export async function isFeatureEnabled(feature: string): Promise<boolean> {
  switch (feature) {
    case 'bank-linking':
      return await isServiceHealthy('plaid');
    case 'transfers':
      return await isServiceHealthy('dwolla');
    case 'user-accounts':
      return await isServiceHealthy('database');
    default:
      return true;
  }
}

// Usage in components
const canLinkBank = await isFeatureEnabled('bank-linking');
```

---

## Monitoring Examples

### Example 1: GitHub Actions (Every Hour)
```yaml
# .github/workflows/health-check.yml
name: Hourly Health Check

on:
  schedule:
    - cron: '0 * * * *'

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run health-check
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          PLAID_CLIENT_ID: ${{ secrets.PLAID_CLIENT_ID }}
          PLAID_SECRET: ${{ secrets.PLAID_SECRET }}
          DWOLLA_KEY: ${{ secrets.DWOLLA_KEY }}
          DWOLLA_SECRET: ${{ secrets.DWOLLA_SECRET }}
```

### Example 2: Slack Notifications
```typescript
// lib/slack-health-check.ts
import { runHealthCheck } from '@/lib/health-check';

export async function notifySlackIfUnhealthy() {
  const result = await runHealthCheck();
  
  if (!result.overall.healthy) {
    const text = `
🚨 *Health Alert*
${result.overall.message}

Database: ${result.database.connected ? '✅' : '❌'}
Plaid: ${result.plaid.connected ? '✅' : '❌'}
Dwolla: ${result.dwolla.connected ? '✅' : '❌'}
    `;
    
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  }
}

// Run every 5 minutes
setInterval(notifySlackIfUnhealthy, 300000);
```

### Example 3: Email Alerts
```typescript
// lib/email-alerts.ts
import { runHealthCheck, compareHealthChecks } from '@/lib/health-check-utils';
import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
  // Your email config
});

let previousHealth = await runHealthCheck();

async function checkAndAlert() {
  const currentHealth = await runHealthCheck();
  const comparison = compareHealthChecks(previousHealth, currentHealth);
  
  if (comparison.degraded) {
    await mailer.sendMail({
      to: 'admin@example.com',
      subject: '⚠️ Service Health Alert',
      html: `
        <h1>Service Degradation Detected</h1>
        <p>${comparison.message}</p>
        <ul>
          <li>${comparison.details.database}</li>
          <li>${comparison.details.plaid}</li>
          <li>${comparison.details.dwolla}</li>
        </ul>
      `
    });
  }
  
  previousHealth = currentHealth;
}

setInterval(checkAndAlert, 300000); // Every 5 minutes
```

### Example 4: Datadog Integration
```typescript
// lib/datadog-metrics.ts
import { runHealthCheck } from '@/lib/health-check';

export async function sendToDatadog() {
  const result = await runHealthCheck();
  
  const metrics = [
    {
      metric: 'health.database',
      points: [[Date.now() / 1000, result.database.connected ? 1 : 0]],
      tags: ['service:jsm-banking']
    },
    {
      metric: 'health.plaid',
      points: [[Date.now() / 1000, result.plaid.connected ? 1 : 0]],
      tags: ['service:jsm-banking']
    },
    {
      metric: 'health.dwolla',
      points: [[Date.now() / 1000, result.dwolla.connected ? 1 : 0]],
      tags: ['service:jsm-banking']
    },
    {
      metric: 'health.response_time.database',
      points: [[Date.now() / 1000, result.database.responseTime || 0]],
      tags: ['service:jsm-banking']
    }
  ];
  
  await fetch('https://api.datadoghq.com/api/v1/series', {
    method: 'POST',
    headers: {
      'DD-API-KEY': process.env.DATADOG_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ series: metrics })
  });
}

// Send metrics every minute
setInterval(sendToDatadog, 60000);
```

### Example 5: Prometheus Scrape
```yaml
# prometheus.yml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'jsm-banking'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/health/metrics'
    scrape_interval: 30s
```

---

## Error Handling Examples

### Example 1: Try-Catch
```typescript
import { runHealthCheck } from '@/lib/health-check';

async function safeHealthCheck() {
  try {
    const result = await runHealthCheck();
    console.log('Health:', result.overall.healthy);
  } catch (error) {
    console.error('Health check failed:', error);
    // Fall back to assuming unhealthy
    return false;
  }
}

safeHealthCheck();
```

### Example 2: Error Recovery
```typescript
import { retryHealthCheck } from '@/lib/health-check-utils';

async function robustHealthCheck() {
  try {
    // Try up to 3 times
    const result = await retryHealthCheck(3, 1000);
    
    if (!result) {
      console.error('Health check failed after retries');
      // Use cached health status
      return getCachedHealth();
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected error in health check:', error);
    return getCachedHealth();
  }
}
```

### Example 3: Timeout Handling
```typescript
async function healthCheckWithTimeout(timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await fetch('/api/health', {
      signal: controller.signal
    });
    const data = await result.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Health check timed out');
    } else {
      console.error('Health check failed:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Example 4: Exponential Backoff
```typescript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Example 5: Circuit Breaker Pattern
```typescript
// lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute(fn: () => Promise<any>) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= 3) {
      this.state = 'open';
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

async function checkHealth() {
  return await breaker.execute(() => runHealthCheck());
}
```

---

## Testing Examples

### Example 1: Jest Tests
```typescript
// __tests__/health-integration.test.ts
import { runHealthCheck } from '@/lib/health-check';

describe('Health Check Integration', () => {
  it('should check all services', async () => {
    const result = await runHealthCheck();
    
    expect(result).toHaveProperty('database');
    expect(result).toHaveProperty('plaid');
    expect(result).toHaveProperty('dwolla');
    expect(result).toHaveProperty('overall');
  });
  
  it('should return boolean for connected status', async () => {
    const result = await runHealthCheck();
    
    expect(typeof result.database.connected).toBe('boolean');
    expect(typeof result.plaid.connected).toBe('boolean');
    expect(typeof result.dwolla.connected).toBe('boolean');
  });
});
```

### Example 2: API Endpoint Tests
```typescript
// __tests__/health-api.test.ts
import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('should return 200 when healthy', async () => {
    const response = await GET(new Request('http://localhost:3000/api/health'));
    expect(response.status).toBe(200);
  });
  
  it('should return valid JSON', async () => {
    const response = await GET(new Request('http://localhost:3000/api/health'));
    const data = await response.json();
    
    expect(data).toHaveProperty('overall');
    expect(data.overall).toHaveProperty('healthy');
  });
});
```

---

**More examples available in:**
- HEALTH_CHECK_GUIDE.md - Detailed documentation
- __tests__/health-check.test.ts - Test suite
- lib/health-check.ts - Source code comments

