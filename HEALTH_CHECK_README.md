# 🏥 Health Check System

Comprehensive health monitoring for Supabase, Plaid, and Dwolla integration.

---

## ⚡ Quick Start

### Run Health Check
```bash
npm run health-check
```

**Output Example:**
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

---

## 📚 Usage Methods

### 1. CLI (Terminal)
```bash
npm run health-check
```
- **Exit Code:** 0 = healthy, 1 = unhealthy
- **Use in:** CI/CD pipelines, deployment scripts, monitoring cron jobs

### 2. HTTP API
```bash
# Full health check
curl http://localhost:3000/api/health | jq .

# Quick liveness check (headers only)
curl -I -X HEAD http://localhost:3000/api/health

# Check response code
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
# Returns: 200 (healthy) or 503 (unhealthy)
```

**Response Codes:**
- `200` - All services healthy
- `503` - At least one service down
- `500` - Health check itself failed

### 3. Programmatic (In Code)
```typescript
import { runHealthCheck, formatHealthCheckOutput } from '@/lib/health-check';

const result = await runHealthCheck();
console.log(formatHealthCheckOutput(result));

// Or use the data directly
if (result.overall.healthy) {
  console.log('All systems go!');
} else {
  console.log('Issues detected:', result.overall.message);
}
```

---

## 📂 Files Overview

| File | Purpose |
|------|---------|
| `lib/health-check.ts` | Core health check utilities |
| `app/api/health/route.ts` | HTTP API endpoint |
| `scripts/health-check.ts` | CLI script |
| `scripts/dev-with-health-check.sh` | Dev startup (Linux/Mac) |
| `scripts/dev-with-health-check.bat` | Dev startup (Windows) |
| `__tests__/health-check.test.ts` | Test suite |
| `HEALTH_CHECK_GUIDE.md` | Detailed documentation |
| `HEALTH_CHECK_README.md` | This file |

---

## 🎯 What Gets Checked

### ✅ Database (Supabase)
- PostgreSQL connection
- Query execution
- Response time
- Error handling

**Test:** Lightweight `SELECT COUNT(*)` query on users table

### ✅ Plaid
- API connectivity
- Server availability
- Response time
- Error handling

**Test:** `institutionsGetById` API call (no auth required)

### ✅ Dwolla
- API connectivity
- Server availability
- Response time
- Error handling

**Test:** GET / (root resource, no auth required)

---

## 🚀 Advanced Usage

### Development with Auto Health Check
```bash
# Linux/Mac
./scripts/dev-with-health-check.sh

# Windows
.\scripts\dev-with-health-check.bat
```

Automatically runs health check before starting dev server.

### Monitor Every 5 Minutes
```bash
# Linux/Mac cron
*/5 * * * * cd /path/to/app && npm run health-check >> /var/log/health-check.log 2>&1

# Windows Task Scheduler
# Create task: "npm run health-check"
# Trigger: Every 5 minutes
```

### GitHub Actions Workflow
```yaml
# .github/workflows/health-check.yml
name: Health Check
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run health-check
        env:
          # Add secrets from GitHub
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

### Send to Monitoring Service
```typescript
import { runHealthCheck } from '@/lib/health-check';

// Send to Datadog, New Relic, CloudWatch, etc.
const result = await runHealthCheck();
await sendToMonitoringService(result);
```

---

## 🔍 Interpreting Results

### Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ CONNECTED | Service is responsive | ✓ No action needed |
| ❌ DISCONNECTED | Service not reachable | ⚠️ Check network/server |
| ⚠️ CONNECTED (Invalid Credentials) | Server reachable but auth failed | ⚠️ Check API keys |

### Response Times

| Time | Rating | Action |
|------|--------|--------|
| < 200ms | 🟢 Excellent | ✓ No action |
| 200-500ms | 🟡 Good | ✓ No action |
| 500-1000ms | 🟠 Acceptable | ⚠️ Monitor |
| > 1000ms | 🔴 Slow | ⚠️ Investigate |

---

## 🔧 Configuration

### Environment Variables
Ensure these are in `.env.local`:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_SUPABASE_SERVICE_ROLE_KEY=...

# Plaid (Required)
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox

# Dwolla (Required)
DWOLLA_KEY=...
DWOLLA_SECRET=...
DWOLLA_ENV=sandbox
```

---

## 🧪 Testing

### Run Test Suite
```bash
npm test -- health-check
```

### Manual Test
```bash
# Test API endpoint
curl -v http://localhost:3000/api/health

# Test with verbose output
npm run health-check 2>&1 | tee health-check.log

# Test specific service failures
# (by temporarily misconfiguring env vars)
```

---

## 🚨 Troubleshooting

### Database Shows DISCONNECTED
```bash
# Check Supabase status
# Check env variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_SUPABASE_SERVICE_ROLE_KEY

# Test connection manually
psql $SUPABASE_CONNECTION_STRING
```

### Plaid Shows DISCONNECTED
```bash
# Check Plaid status: https://status.plaid.com
# Check credentials
echo $PLAID_CLIENT_ID
echo $PLAID_SECRET

# Verify environment
echo $PLAID_ENV  # Should be 'sandbox' or 'production'
```

### Dwolla Shows DISCONNECTED
```bash
# Check Dwolla API status
# Check credentials
echo $DWOLLA_KEY
echo $DWOLLA_SECRET

# Verify environment
echo $DWOLLA_ENV  # Should be 'sandbox' or 'production'
```

### All Services Failing
1. Check internet connection: `ping 8.8.8.8`
2. Check firewall: May be blocking outbound connections
3. Check env vars: `cat .env.local | grep SUPABASE`
4. Check logs: `npm run dev` and watch console output

---

## 📊 API Response Format

### GET /api/health (Healthy - 200 OK)
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

### GET /api/health (Unhealthy - 503 Service Unavailable)
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

---

## 📈 Monitoring Integration

### Kubernetes
```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Docker
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run health-check || exit 1
```

### Uptime Robot
1. Create HTTP(s) check
2. URL: `https://yourdomain.com/api/health`
3. Method: GET
4. Response time: < 30 seconds
5. Expected HTTP response: 200 or 503

---

## 🔐 Security

✅ **Safe to expose publicly**
- Health check uses read-only queries
- Service role key is server-side only
- Credentials are environment variables
- No sensitive data in response

❌ **Don't expose**
- `.env` files
- Private API keys
- Database passwords
- Raw error stack traces (in production)

---

## 📞 Common Questions

**Q: Why is response time > 1 second?**
A: Network latency, service load, or geographic distance. Usually acceptable.

**Q: Can I use this in production?**
A: Yes! It's designed for production monitoring.

**Q: What if one service is slow?**
A: Still healthy (connected), but monitor response times.

**Q: How often should I run health checks?**
A: Every 5-60 minutes depending on criticality.

**Q: Can I disable certain checks?**
A: Yes, modify `lib/health-check.ts` to skip services.

**Q: Does health check modify any data?**
A: No, only read-only queries.

---

## 📚 Additional Resources

- [Detailed Guide](./HEALTH_CHECK_GUIDE.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Plaid Status](https://status.plaid.com)
- [Dwolla Status](https://status.dwolla.com)

---

## 🎯 Summary

| Need | Command |
|------|---------|
| Quick health check | `npm run health-check` |
| API check | `curl /api/health` |
| Dev startup with check | `./scripts/dev-with-health-check.sh` |
| Run tests | `npm test -- health-check` |
| View full docs | See `HEALTH_CHECK_GUIDE.md` |

---

**Last Updated:** January 2024  
**Status:** ✅ Production Ready

