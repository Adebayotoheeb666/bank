# Health Check System Guide

Complete guide to the health check system for Supabase, Plaid, and Dwolla connectivity.

---

## 📋 Overview

The health check system provides three ways to verify connectivity:

1. **CLI Script** - Run from terminal
2. **API Endpoint** - HTTP requests (for monitoring services)
3. **Programmatic** - Import and use in code

---

## 🚀 Quick Start

### Method 1: CLI (Fastest)
```bash
npm run health-check
```

**Output:**
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

┌─ PLAID ───────────────────────────────────────────────────┐
│ Status: ✅ CONNECTED
│ Details: CONNECTED
│ Response Time: 312ms
└───────────────────────────────────────────────────────────┘

┌─ DWOLLA ──────────────────────────────────────────────────┐
│ Status: ✅ CONNECTED
│ Details: CONNECTED
│ Response Time: 189ms
└───────────────────────────────────────────────────────────┘

✅ All services are healthy!
```

### Method 2: HTTP Endpoint
```bash
# Full health check
curl http://localhost:3000/api/health

# Quick liveness check (no body)
curl -I -X HEAD http://localhost:3000/api/health
```

### Method 3: In Code
```typescript
import { runHealthCheck, formatHealthCheckOutput } from '@/lib/health-check';

const result = await runHealthCheck();
console.log(formatHealthCheckOutput(result));
```

---

## 📊 What Gets Checked

### Database (Supabase)
- ✅ Connection to Supabase PostgreSQL
- ✅ Query execution capability
- ✅ Response time measurement
- ❌ Graceful error handling for connection failures

**Test Query:** Lightweight COUNT(*) on users table (read-only, doesn't modify data)

### Plaid
- ✅ Connection to Plaid API servers
- ✅ API responsiveness
- ✅ Response time measurement
- ❌ Graceful handling of API errors

**Test Request:** institutionsGetById (lightweight, doesn't require auth)

### Dwolla
- ✅ Connection to Dwolla API servers
- ✅ API responsiveness
- ✅ Response time measurement
- ❌ Graceful handling of connection failures

**Test Request:** GET / (root resource, no auth required)

---

## 📁 File Structure

```
project/
├── lib/
│   └── health-check.ts           # Main health check utilities
├── app/
│   └── api/
│       └── health/
│           └── route.ts          # HTTP API endpoint
├── scripts/
│   └── health-check.ts           # CLI script
├── HEALTH_CHECK_GUIDE.md         # This file
└── package.json                  # npm scripts
```

---

## 🔍 Detailed Usage

### CLI Script with Exit Codes

```bash
npm run health-check
echo $?  # Exit code: 0 = healthy, 1 = unhealthy
```

**Use in CI/CD:**
```yaml
# GitHub Actions example
- name: Health Check
  run: npm run health-check
  # Fails if any service is down
```

### API Endpoint Details

#### GET /api/health
Returns complete health check data.

**Response (Healthy - 200):**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": {
    "connected": true,
    "status": "CONNECTED",
    "responseTime": 245
  },
  "plaid": {
    "connected": true,
    "status": "CONNECTED",
    "responseTime": 312
  },
  "dwolla": {
    "connected": true,
    "status": "CONNECTED",
    "responseTime": 189
  },
  "overall": {
    "healthy": true,
    "message": "All services healthy ✅"
  }
}
```

**Response (Unhealthy - 503):**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": {
    "connected": true,
    "status": "CONNECTED",
    "responseTime": 245
  },
  "plaid": {
    "connected": false,
    "status": "DISCONNECTED",
    "error": "Connection refused: ECONNREFUSED",
    "responseTime": 5000
  },
  "dwolla": {
    "connected": true,
    "status": "CONNECTED",
    "responseTime": 189
  },
  "overall": {
    "healthy": false,
    "message": "Plaid connection failed ❌"
  }
}
```

#### HEAD /api/health
Quick liveness check (headers only, no body).

**Responses:**
- `200 OK` - All services healthy
- `503 Service Unavailable` - At least one service down
- `500 Internal Server Error` - Health check itself failed

---

## 🛠️ Integration Examples

### Example 1: Monitoring Service Integration

```typescript
// monitoring/health-check.ts
import { runHealthCheck } from '@/lib/health-check';

export async function sendToMonitoringService() {
  const result = await runHealthCheck();

  // Send to Datadog, New Relic, etc.
  await fetch('https://api.monitoring-service.com/health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
}

// Call periodically
setInterval(sendToMonitoringService, 60000); // Every minute
```

### Example 2: Slack Alerts

```typescript
// alerts/slack-health-check.ts
import { runHealthCheck, formatHealthCheckOutput } from '@/lib/health-check';

export async function sendHealthCheckToSlack() {
  const result = await runHealthCheck();

  if (!result.overall.healthy) {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({
        text: '🚨 Health Check Alert',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: formatHealthCheckOutput(result),
            },
          },
        ],
      }),
    });
  }
}
```

### Example 3: Startup Verification

```typescript
// server/startup.ts
import { runHealthCheck } from '@/lib/health-check';

export async function verifyStartup() {
  console.log('Verifying service connectivity...');
  const result = await runHealthCheck();

  if (!result.overall.healthy) {
    console.error('❌ Startup failed - services not ready');
    process.exit(1);
  }

  console.log('✅ All services ready');
}

// In your server startup
verifyStartup();
```

### Example 4: Request Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runHealthCheck } from '@/lib/health-check';

export async function middleware(request: NextRequest) {
  // Skip health check for health endpoint itself
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // Check health before allowing requests
  const health = await runHealthCheck();
  
  if (!health.overall.healthy) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: health },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

---

## 🔧 Configuration

### Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_key

# Plaid
PLAID_CLIENT_ID=your_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox

# Dwolla
DWOLLA_KEY=your_key
DWOLLA_SECRET=your_secret
DWOLLA_ENV=sandbox
```

### Timeout Configuration (Optional)

To adjust timeouts, modify `lib/health-check.ts`:

```typescript
// Add to each check function
const timeoutMs = 10000; // 10 seconds

Promise.race([
  checkService(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  ),
]);
```

---

## 📊 Interpreting Results

### Status Values

| Status | Meaning |
|--------|---------|
| `CONNECTED` | Service is responding normally |
| `DISCONNECTED` | Service is not reachable |
| `ERROR` | Service returned an error |
| `CONNECTED (Invalid Credentials)` | Service is reachable but authentication failed |

### Response Times

- **< 200ms** - Excellent
- **200-500ms** - Good
- **500-1000ms** - Acceptable
- **> 1000ms** - Slow (investigate)

---

## 🚨 Troubleshooting

### Database Shows DISCONNECTED

**Possible Causes:**
- Supabase project is paused
- Network connectivity issue
- Invalid credentials in `.env`
- Database server is down

**Solution:**
1. Check Supabase dashboard for project status
2. Verify `.env` variables are correct
3. Test with: `psql $SUPABASE_CONNECTION_STRING`

### Plaid Shows DISCONNECTED

**Possible Causes:**
- Plaid API is down
- Invalid credentials
- Network firewall blocking requests
- Using wrong environment (sandbox vs. production)

**Solution:**
1. Check Plaid status: https://status.plaid.com
2. Verify `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Confirm `PLAID_ENV=sandbox` (or production)

### Dwolla Shows DISCONNECTED

**Possible Causes:**
- Dwolla API is down
- Invalid credentials
- Network firewall blocking requests
- Wrong environment URL

**Solution:**
1. Check Dwolla status
2. Verify `DWOLLA_KEY` and `DWOLLA_SECRET`
3. Confirm `DWOLLA_ENV=sandbox` (or production)

### All Services Show ERROR

**Possible Causes:**
- Network connectivity issue
- Firewall blocking outbound connections
- Health check script itself has a bug

**Solution:**
1. Check internet connection: `ping 8.8.8.8`
2. Test each service manually
3. Check server logs: `npm run dev` and look for errors

---

## 📈 Monitoring Setup

### GitHub Actions Workflow

```yaml
# .github/workflows/health-check.yml
name: Health Check

on:
  schedule:
    # Every hour
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
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

### Cron Job (Linux)

```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/app && npm run health-check >> /var/log/health-check.log 2>&1
```

### Docker Health Check

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run health-check || exit 1
```

---

## 🔐 Security Considerations

- Health check uses **read-only** database queries
- No sensitive data is logged by default
- Service role key is server-side only (never exposed)
- Credentials must be in environment variables
- API endpoint is public but safe (read-only operations)

---

## 📝 Logging Best Practices

### Enable Debug Logging

```typescript
// lib/health-check.ts - Add logging
if (process.env.DEBUG_HEALTH_CHECK === 'true') {
  console.log(`[DB] Query: ${query}`);
  console.log(`[Plaid] Request: ${endpoint}`);
  console.log(`[Dwolla] URL: ${url}`);
}
```

**Run with debugging:**
```bash
DEBUG_HEALTH_CHECK=true npm run health-check
```

### Log to File

```bash
npm run health-check > health-check.log 2>&1
```

### Log to External Service

```typescript
// In health-check.ts
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

logger.info(result, 'Health check completed');
```

---

## 🧪 Testing the Health Check

### Manual Testing

```bash
# Test CLI
npm run health-check

# Test API endpoint
curl http://localhost:3000/api/health | jq .

# Test HEAD endpoint
curl -I -X HEAD http://localhost:3000/api/health

# Test with different formats
curl -H "Accept: application/json" http://localhost:3000/api/health
```

### Automated Testing (Jest)

```typescript
// __tests__/health-check.test.ts
import { runHealthCheck } from '@/lib/health-check';

describe('Health Check', () => {
  it('should return health status', async () => {
    const result = await runHealthCheck();
    
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('database');
    expect(result).toHaveProperty('plaid');
    expect(result).toHaveProperty('dwolla');
    expect(result).toHaveProperty('overall');
  });

  it('should have valid response times', async () => {
    const result = await runHealthCheck();
    
    expect(result.database.responseTime).toBeGreaterThan(0);
    expect(result.plaid.responseTime).toBeGreaterThan(0);
    expect(result.dwolla.responseTime).toBeGreaterThan(0);
  });
});
```

---

## 📞 Support

**Issues?** Check:
1. `.env` variables are set correctly
2. Services are actually running (Supabase project isn't paused, etc.)
3. Network connectivity is working
4. Firewall isn't blocking outbound connections

---

## 🎯 Summary

| Method | Use Case | Command |
|--------|----------|---------|
| **CLI** | Manual checks, CI/CD | `npm run health-check` |
| **API** | Monitoring tools | `curl /api/health` |
| **Code** | Programmatic use | `import { runHealthCheck }` |

All three methods use the same underlying health check logic and provide identical information.

