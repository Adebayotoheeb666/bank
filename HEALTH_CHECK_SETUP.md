# Health Check System Setup

Complete setup and configuration guide for the health check system.

---

## 📋 What You Get

A production-ready health monitoring system for:
- ✅ Supabase Database
- ✅ Plaid API
- ✅ Dwolla API

**3 Ways to Use:**
1. CLI - `npm run health-check`
2. HTTP API - `GET /api/health`
3. Code - `import { runHealthCheck }`

---

## 🚀 Quick Start (5 minutes)

### Step 1: Verify Files Exist
```bash
# Check that all health check files are created
ls -la lib/health-check.ts
ls -la app/api/health/route.ts
ls -la scripts/health-check.ts
```

### Step 2: Verify npm Script
```bash
# Check that npm script exists
grep "health-check" package.json
```

Expected output:
```json
"scripts": {
  "health-check": "ts-node scripts/health-check.ts"
}
```

### Step 3: Run First Health Check
```bash
# Make sure dev server is running first (optional)
npm run dev

# In another terminal, run health check
npm run health-check
```

### Step 4: Check HTTP Endpoint (Optional)
```bash
# If dev server is running, you can also test the API
curl http://localhost:3000/api/health
```

---

## 📁 File Structure

```
project/
├── lib/
│   ├── health-check.ts              # Main utilities
│   └── health-check-utils.ts        # Advanced utilities
├── app/
│   └── api/
│       └── health/
│           ├── route.ts             # Main endpoint
│           └── metrics/
│               └── route.ts         # Prometheus metrics
├── scripts/
│   ├── health-check.ts              # CLI script
│   ├── dev-with-health-check.sh     # Dev startup (Linux/Mac)
│   └── dev-with-health-check.bat    # Dev startup (Windows)
├── __tests__/
│   └── health-check.test.ts         # Test suite
├── package.json                     # npm scripts
├── HEALTH_CHECK_README.md           # Quick reference
├── HEALTH_CHECK_GUIDE.md            # Detailed guide
└── HEALTH_CHECK_SETUP.md            # This file
```

---

## 🔧 Configuration

### 1. Environment Variables (Already Done)
Verify `.env.local` has:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_SUPABASE_SERVICE_ROLE_KEY=...

# Plaid
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox

# Dwolla
DWOLLA_KEY=...
DWOLLA_SECRET=...
DWOLLA_ENV=sandbox
```

### 2. Make Scripts Executable (Linux/Mac Only)
```bash
chmod +x scripts/health-check.ts
chmod +x scripts/dev-with-health-check.sh
```

### 3. npm Script (Already Done)
```json
"scripts": {
  "health-check": "ts-node scripts/health-check.ts"
}
```

---

## 💻 Usage

### Method 1: CLI (Best for Quick Checks)
```bash
npm run health-check
```

**Exit codes:**
- `0` = All services healthy
- `1` = At least one service down

**Use in scripts:**
```bash
#!/bin/bash
npm run health-check || exit 1
echo "All services ready!"
```

### Method 2: HTTP Endpoint (Best for Monitoring)
```bash
# Full health check
curl http://localhost:3000/api/health

# Quick check (headers only)
curl -I -X HEAD http://localhost:3000/api/health

# JSON pretty-print
curl http://localhost:3000/api/health | jq .
```

**Status codes:**
- `200` = Healthy
- `503` = Unhealthy (at least one service down)
- `500` = Health check itself failed

### Method 3: In Code (Best for Integration)
```typescript
import { runHealthCheck, formatHealthCheckOutput } from '@/lib/health-check';

// Get results
const result = await runHealthCheck();

// Check overall status
if (result.overall.healthy) {
  console.log('✅ All services ready');
} else {
  console.log('❌ Service issue:', result.overall.message);
}

// Pretty print
console.log(formatHealthCheckOutput(result));

// Access individual services
console.log(`Database: ${result.database.connected ? 'OK' : 'DOWN'}`);
console.log(`Response time: ${result.database.responseTime}ms`);
```

---

## 🔍 Advanced Usage

### Retry with Backoff
```typescript
import { retryHealthCheck } from '@/lib/health-check-utils';

// Retry up to 3 times with exponential backoff
const result = await retryHealthCheck(3, 1000);

if (result?.overall.healthy) {
  console.log('✅ Services healthy');
} else {
  console.log('❌ Services still down');
}
```

### Check Specific Service
```typescript
import { isServiceHealthy } from '@/lib/health-check-utils';

if (await isServiceHealthy('database')) {
  console.log('✅ Database OK');
} else {
  console.log('❌ Database down');
}
```

### Wait for Startup
```typescript
import { waitForHealthy } from '@/lib/health-check-utils';

// Wait up to 30 seconds for services to be ready
const ready = await waitForHealthy(30000, 1000);

if (ready) {
  console.log('✅ Ready to start');
  startServer();
} else {
  console.log('❌ Services not ready');
  process.exit(1);
}
```

### Get Prometheus Metrics
```typescript
import { getHealthCheckMetrics } from '@/lib/health-check-utils';

const metrics = await getHealthCheckMetrics();
console.log(metrics);
// Output:
// health_check_database 1
// health_check_database_response_time_ms 245
// ...
```

### Get Compact Summary
```typescript
import { getHealthCheckSummary } from '@/lib/health-check-utils';

const summary = await getHealthCheckSummary();
console.log(summary);
// Output: [✅ DB | ✅ Plaid | ✅ Dwolla] ✅ HEALTHY
```

### Dev Startup with Auto Health Check
```bash
# Linux/Mac
./scripts/dev-with-health-check.sh

# Windows
.\scripts\dev-with-health-check.bat
```

This automatically runs health check before starting dev server.

---

## 📊 Integration Examples

### GitHub Actions (Hourly)
```yaml
# .github/workflows/health-check.yml
name: Hourly Health Check

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
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

### Docker Health Check
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run health-check || exit 1

CMD ["npm", "run", "dev"]
```

### Linux Cron (Every 5 minutes)
```bash
# Run: crontab -e
*/5 * * * * cd /path/to/app && npm run health-check >> /var/log/health-check.log 2>&1
```

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Slack Alerts
```typescript
import { runHealthCheck } from '@/lib/health-check';

async function sendHealthToSlack() {
  const result = await runHealthCheck();
  
  if (!result.overall.healthy) {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({
        text: '�� Health Alert',
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: result.overall.message }
        }]
      })
    });
  }
}

// Run every minute
setInterval(sendHealthToSlack, 60000);
```

---

## 🧪 Testing

### Run Test Suite
```bash
npm test -- health-check

# Or with coverage
npm test -- health-check --coverage
```

### Manual Testing
```bash
# Test CLI
npm run health-check

# Test API
curl -v http://localhost:3000/api/health

# Test metrics endpoint
curl http://localhost:3000/api/health/metrics

# Test with invalid credentials (should still detect connection)
PLAID_SECRET=invalid npm run health-check
```

---

## 🔐 Security

### ✅ Safe
- Health check uses read-only queries
- Service role key is server-side only
- HTTP endpoint is read-only
- No sensitive data exposed

### ❌ Unsafe
- Don't expose `.env` files
- Don't log full health responses to public logs
- Don't expose stack traces in production
- Don't hardcode credentials

### Best Practices
```typescript
// ✅ GOOD - Use env variables
const result = await runHealthCheck();

// ❌ BAD - Don't log sensitive data
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ GOOD - Log summary only
console.log(result.overall.message);

// ❌ BAD - Don't expose full errors to users
res.json(error.stack);
```

---

## 🚨 Troubleshooting

### "ECONNREFUSED" for Supabase
1. Check Supabase project isn't paused
2. Verify `.env` variables are correct
3. Check network/firewall isn't blocking connections
4. Try: `psql $SUPABASE_CONNECTION_STRING`

### "ECONNREFUSED" for Plaid
1. Check https://status.plaid.com
2. Verify `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Check `PLAID_ENV` is correct (sandbox vs production)
4. Check firewall isn't blocking API.plaid.com

### "ECONNREFUSED" for Dwolla
1. Check Dwolla API status
2. Verify `DWOLLA_KEY` and `DWOLLA_SECRET`
3. Check `DWOLLA_ENV` is correct (sandbox vs production)
4. Check firewall isn't blocking API.dwolla.com

### All Services Show "DISCONNECTED"
1. Check internet: `ping 8.8.8.8`
2. Check firewall rules
3. Check proxy settings
4. Try from different network

### Health Check Script Not Found
```bash
# Make sure ts-node is available
npx ts-node --version

# Install if needed
npm install -D ts-node

# Or use compiled version
npm run build
node scripts/health-check.js
```

---

## 📈 Monitoring Tools

### Datadog Integration
```typescript
import { runHealthCheck } from '@/lib/health-check';

async function sendToDatadog() {
  const result = await runHealthCheck();
  
  await fetch('https://api.datadoghq.com/api/v1/series', {
    method: 'POST',
    headers: { 'DD-API-KEY': process.env.DATADOG_API_KEY! },
    body: JSON.stringify({
      series: [
        {
          metric: 'health.database.connected',
          points: [[Date.now(), result.database.connected ? 1 : 0]]
        },
        {
          metric: 'health.plaid.connected',
          points: [[Date.now(), result.plaid.connected ? 1 : 0]]
        }
      ]
    })
  });
}
```

### Prometheus Scrape Config
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'jsm-banking'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/health/metrics'
    scrape_interval: 30s
```

### UptimeRobot
1. Create HTTP(s) check
2. URL: `https://yourdomain.com/api/health`
3. Check every 5 minutes
4. Alert if status != 200 and != 503

---

## 📞 Support

### Files to Review
- `HEALTH_CHECK_README.md` - Quick reference
- `HEALTH_CHECK_GUIDE.md` - Detailed documentation
- `lib/health-check.ts` - Core implementation
- `__tests__/health-check.test.ts` - Test examples

### External Resources
- Supabase: https://supabase.com/docs
- Plaid: https://plaid.com/docs
- Dwolla: https://developers.dwolla.com

---

## ✅ Verification Checklist

- [ ] All files created successfully
- [ ] npm script `health-check` works
- [ ] `npm run health-check` executes without errors
- [ ] HTTP endpoint `/api/health` responds
- [ ] Test suite runs: `npm test -- health-check`
- [ ] `.env.local` has all required variables
- [ ] Scripts are executable (Linux/Mac)
- [ ] Can import `runHealthCheck` in code
- [ ] Monitoring integration tested
- [ ] Alert system configured

---

## 🎯 Summary

| Task | Command |
|------|---------|
| **First time setup** | See "Quick Start" section |
| **Daily use** | `npm run health-check` |
| **Monitoring** | `curl /api/health` or GitHub Actions |
| **Testing** | `npm test -- health-check` |
| **Troubleshooting** | See HEALTH_CHECK_GUIDE.md |

---

**Ready?** Start with `npm run health-check` and check the output!

