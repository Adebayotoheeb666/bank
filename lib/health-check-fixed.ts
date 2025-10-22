'use server';

import { createAdminClient } from './supabase';
import { Client } from 'dwolla-v2';

export interface HealthCheckResult {
  timestamp: string;
  database: {
    connected: boolean;
    status: string;
    error?: string;
    responseTime?: number;
  };
  plaid: {
    connected: boolean;
    status: string;
    error?: string;
    responseTime?: number;
  };
  dwolla: {
    connected: boolean;
    status: string;
    error?: string;
    responseTime?: number;
  };
  overall: {
    healthy: boolean;
    message: string;
  };
}

/**
 * Check Supabase database connection
 */
async function checkDatabase(): Promise<HealthCheckResult['database']> {
  const startTime = Date.now();
  try {
    const client = await createAdminClient();

    // Simple ping query to verify connection - just select one row
    const { data, error } = await client
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        status: 'DISCONNECTED',
        error: error.message,
        responseTime,
      };
    }

    return {
      connected: true,
      status: 'CONNECTED',
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      connected: false,
      status: 'ERROR',
      error: error?.message || 'Unknown database error',
      responseTime,
    };
  }
}

/**
 * Check Plaid API connection using fetch with timeout
 */
async function checkPlaid(): Promise<HealthCheckResult['plaid']> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://sandbox.plaid.com/institutions/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
        'PLAID-SECRET': process.env.PLAID_SECRET || '',
      },
      body: JSON.stringify({
        query: 'Chase',
        products: ['auth'],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    } else if (response.status === 401 || response.status === 400) {
      return {
        connected: true,
        status: 'CONNECTED (Invalid Credentials)',
        error: `HTTP ${response.status}`,
        responseTime,
      };
    } else {
      return {
        connected: false,
        status: 'ERROR',
        error: `HTTP ${response.status}`,
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return {
        connected: false,
        status: 'TIMEOUT',
        error: 'Request timed out after 5 seconds',
        responseTime,
      };
    }

    return {
      connected: false,
      status: 'ERROR',
      error: error?.message || 'Unknown Plaid error',
      responseTime,
    };
  }
}

/**
 * Check Dwolla API connection
 */
async function checkDwolla(): Promise<HealthCheckResult['dwolla']> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(process.env.DWOLLA_BASE_URL + '/', {
      headers: {
        'Accept': 'application/vnd.dwolla.v1.hal+json',
        'Authorization': `Bearer ${process.env.DWOLLA_KEY}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        connected: true,
        status: 'CONNECTED (Invalid Credentials)',
        error: `HTTP ${response.status}`,
        responseTime,
      };
    } else {
      return {
        connected: false,
        status: 'ERROR',
        error: `HTTP ${response.status}`,
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return {
        connected: false,
        status: 'TIMEOUT',
        error: 'Request timed out after 5 seconds',
        responseTime,
      };
    }

    return {
      connected: false,
      status: 'ERROR',
      error: error?.message || 'Unknown Dwolla error',
      responseTime,
    };
  }
}

/**
 * Run all health checks
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();

  // Run all checks in parallel
  const [database, plaid, dwolla] = await Promise.all([
    checkDatabase(),
    checkPlaid(),
    checkDwolla(),
  ]);

  // Determine overall health
  const allConnected = database.connected && plaid.connected && dwolla.connected;
  const healthy = allConnected;

  let message = 'All services healthy ✅';
  if (!database.connected) message = 'Database connection failed ❌';
  if (!plaid.connected) message = 'Plaid connection failed ❌';
  if (!dwolla.connected) message = 'Dwolla connection failed ❌';
  if (!allConnected && !healthy) message = 'Multiple services unavailable ❌';

  return {
    timestamp,
    database,
    plaid,
    dwolla,
    overall: {
      healthy,
      message,
    },
  };
}

/**
 * Format health check result for console output
 */
export async function formatHealthCheckOutput(result: HealthCheckResult): Promise<string> {
  const lines = [
    '\n╔════════════════════════════════════════════════════════════╗',
    '║          HEALTH CHECK REPORT                               ║',
    '╚════════════════════════════════════════════════════════════╝',
    `\nTimestamp: ${result.timestamp}`,
    `\n📊 OVERALL STATUS: ${result.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`,
    `   Message: ${result.overall.message}`,
    '\n┌─ DATABASE (Supabase) ─────────────────────────────────────┐',
    `│ Status: ${result.database.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`,
    `│ Details: ${result.database.status}`,
    `│ Response Time: ${result.database.responseTime}ms`,
    result.database.error ? `│ Error: ${result.database.error}` : '',
    '└────────────────────────────────────────────────────��──────┘',
    '\n┌─ PLAID ───────────────────────────────────────────────────┐',
    `│ Status: ${result.plaid.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`,
    `│ Details: ${result.plaid.status}`,
    `│ Response Time: ${result.plaid.responseTime}ms`,
    result.plaid.error ? `│ Error: ${result.plaid.error}` : '',
    '└───────────────────────────────────────────────────────────┘',
    '\n┌─ DWOLLA ──────────────────────────────────────────────────┐',
    `│ Status: ${result.dwolla.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`,
    `│ Details: ${result.dwolla.status}`,
    `│ Response Time: ${result.dwolla.responseTime}ms`,
    result.dwolla.error ? `│ Error: ${result.dwolla.error}` : '',
    '└───────────────────────────────────────────────────────────┘',
    '\n',
  ];

  return lines.filter(line => line).join('\n');
}

/**
 * Log health check to console
 */
export async function logHealthCheck(): Promise<void> {
  const result = await runHealthCheck();
  const formatted = await formatHealthCheckOutput(result);
  console.log(formatted);
  return;
}
