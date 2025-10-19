'use server';

import { HealthCheckResult, runHealthCheck } from './health-check';

/**
 * Retry health check with exponential backoff
 */
export async function retryHealthCheck(
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<HealthCheckResult | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Health check attempt ${attempt}/${maxAttempts}...`);
      const result = await runHealthCheck();

      if (result.overall.healthy) {
        console.log(`✅ Health check passed on attempt ${attempt}`);
        return result;
      }

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error: any) {
      console.error(`❌ Health check failed on attempt ${attempt}:`, error?.message);

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`❌ Health check failed after ${maxAttempts} attempts`);
  return null;
}

/**
 * Check if a specific service is healthy
 */
export async function isServiceHealthy(
  service: 'database' | 'plaid' | 'dwolla'
): Promise<boolean> {
  try {
    const result = await runHealthCheck();
    return result[service].connected;
  } catch (error) {
    console.error(`Error checking ${service} health:`, error);
    return false;
  }
}

/**
 * Get health check summary string (compact format)
 */
export async function getHealthCheckSummary(): Promise<string> {
  const result = await runHealthCheck();

  const dbStatus = result.database.connected ? '✅' : '❌';
  const plaidStatus = result.plaid.connected ? '✅' : '❌';
  const dwollaStatus = result.dwolla.connected ? '✅' : '❌';
  const overallStatus = result.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY';

  return `[${dbStatus} DB | ${plaidStatus} Plaid | ${dwollaStatus} Dwolla] ${overallStatus}`;
}

/**
 * Wait for services to be healthy (useful for startup)
 */
export async function waitForHealthy(
  timeoutMs: number = 30000,
  pollIntervalMs: number = 1000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await runHealthCheck();

    if (result.overall.healthy) {
      console.log('✅ All services are healthy');
      return true;
    }

    console.log(
      `⏳ Waiting for services... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`
    );
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  console.error(
    `❌ Services did not become healthy within ${timeoutMs}ms timeout`
  );
  return false;
}

/**
 * Compare two health checks to detect regressions
 */
export function compareHealthChecks(
  previous: HealthCheckResult,
  current: HealthCheckResult
): {
  changed: boolean;
  degraded: boolean;
  message: string;
  details: {
    database: string;
    plaid: string;
    dwolla: string;
  };
} {
  const dbDegraded =
    previous.database.connected && !current.database.connected;
  const plaidDegraded =
    previous.plaid.connected && !current.plaid.connected;
  const dwollaDegraded =
    previous.dwolla.connected && !current.dwolla.connected;

  const degraded = dbDegraded || plaidDegraded || dwollaDegraded;

  const dbMsg = dbDegraded ? 'Database degraded ⚠️' : 'Database OK ✅';
  const plaidMsg = plaidDegraded ? 'Plaid degraded ⚠️' : 'Plaid OK ✅';
  const dwollaMsg = dwollaDegraded ? 'Dwolla degraded ⚠️' : 'Dwolla OK ✅';

  const changed =
    previous.overall.healthy !== current.overall.healthy || degraded;

  return {
    changed,
    degraded,
    message: degraded
      ? `Service degradation detected: ${[dbMsg, plaidMsg, dwollaMsg].filter(m => m.includes('⚠️')).join(', ')}`
      : 'No degradation detected',
    details: {
      database: dbMsg,
      plaid: plaidMsg,
      dwolla: dwollaMsg,
    },
  };
}

/**
 * Get health check as metrics (for Prometheus, etc.)
 */
export async function getHealthCheckMetrics(): Promise<string> {
  const result = await runHealthCheck();

  const metrics = [
    `# HELP health_check_database Database connectivity status (1 = connected, 0 = disconnected)`,
    `# TYPE health_check_database gauge`,
    `health_check_database ${result.database.connected ? 1 : 0}`,
    `health_check_database_response_time_ms ${result.database.responseTime}`,
    ``,
    `# HELP health_check_plaid Plaid API connectivity status`,
    `# TYPE health_check_plaid gauge`,
    `health_check_plaid ${result.plaid.connected ? 1 : 0}`,
    `health_check_plaid_response_time_ms ${result.plaid.responseTime}`,
    ``,
    `# HELP health_check_dwolla Dwolla API connectivity status`,
    `# TYPE health_check_dwolla gauge`,
    `health_check_dwolla ${result.dwolla.connected ? 1 : 0}`,
    `health_check_dwolla_response_time_ms ${result.dwolla.responseTime}`,
    ``,
    `# HELP health_check_overall Overall system health (1 = healthy, 0 = unhealthy)`,
    `# TYPE health_check_overall gauge`,
    `health_check_overall ${result.overall.healthy ? 1 : 0}`,
  ];

  return metrics.join('\n');
}

/**
 * Get health check as CSV (for logging/archiving)
 */
export async function getHealthCheckAsCSV(): Promise<string> {
  const result = await runHealthCheck();

  const headers = [
    'timestamp',
    'database_connected',
    'database_response_time',
    'plaid_connected',
    'plaid_response_time',
    'dwolla_connected',
    'dwolla_response_time',
    'overall_healthy',
  ];

  const values = [
    result.timestamp,
    result.database.connected,
    result.database.responseTime,
    result.plaid.connected,
    result.plaid.responseTime,
    result.dwolla.connected,
    result.dwolla.responseTime,
    result.overall.healthy,
  ];

  return `${headers.join(',')}\n${values.join(',')}`;
}

/**
 * Alert if health check reveals critical issues
 */
export async function checkAndAlert(
  alertCallback: (message: string, severity: 'warning' | 'critical') => Promise<void>
): Promise<void> {
  const result = await runHealthCheck();

  if (!result.database.connected) {
    await alertCallback(
      '🚨 Database connection failed',
      'critical'
    );
  }

  if (!result.plaid.connected) {
    await alertCallback(
      '⚠️ Plaid API is unavailable - bank linking will not work',
      'warning'
    );
  }

  if (!result.dwolla.connected) {
    await alertCallback(
      '⚠️ Dwolla API is unavailable - transfers will not work',
      'warning'
    );
  }

  // Check response times
  if (result.database.responseTime && result.database.responseTime > 1000) {
    await alertCallback(
      `🐢 Database is slow (${result.database.responseTime}ms)`,
      'warning'
    );
  }

  if (result.plaid.responseTime && result.plaid.responseTime > 2000) {
    await alertCallback(
      `🐢 Plaid is slow (${result.plaid.responseTime}ms)`,
      'warning'
    );
  }

  if (result.dwolla.responseTime && result.dwolla.responseTime > 2000) {
    await alertCallback(
      `🐢 Dwolla is slow (${result.dwolla.responseTime}ms)`,
      'warning'
    );
  }
}

/**
 * Generate health check report (detailed)
 */
export async function generateHealthReport(): Promise<string> {
  const result = await runHealthCheck();

  const lines = [
    '═══════════════════════════════════════════════════════════',
    'HEALTH CHECK DETAILED REPORT',
    '═══════════════════════════════════════════════════════════',
    `\nTimestamp: ${result.timestamp}`,
    `Overall Status: ${result.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`,
    `Summary: ${result.overall.message}`,
    `\nDATABASE (Supabase)`,
    `  Connected: ${result.database.connected ? 'Yes ✅' : 'No ❌'}`,
    `  Status: ${result.database.status}`,
    `  Response Time: ${result.database.responseTime}ms`,
    result.database.error ? `  Error: ${result.database.error}` : '',
    `\nPLAID`,
    `  Connected: ${result.plaid.connected ? 'Yes ✅' : 'No ❌'}`,
    `  Status: ${result.plaid.status}`,
    `  Response Time: ${result.plaid.responseTime}ms`,
    result.plaid.error ? `  Error: ${result.plaid.error}` : '',
    `\nDWOLLA`,
    `  Connected: ${result.dwolla.connected ? 'Yes ✅' : 'No ❌'}`,
    `  Status: ${result.dwolla.status}`,
    `  Response Time: ${result.dwolla.responseTime}ms`,
    result.dwolla.error ? `  Error: ${result.dwolla.error}` : '',
    '\n═══════════════════════════════════════════════════════════',
  ];

  return lines.filter(line => line !== '').join('\n');
}
