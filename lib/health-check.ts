'use server';

import { createAdminClient } from './supabase';
import { plaidClient } from './plaid';
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
 * Check Plaid API connection
 */
async function checkPlaid(): Promise<HealthCheckResult['plaid']> {
  const startTime = Date.now();
  try {
    // Plaid doesn't have a dedicated health endpoint, so we'll test with a metadata request
    // Using institutions endpoint which is lightweight and doesn't require authentication
    const response = await plaidClient.institutionsGetById({
      institution_id: 'ins_1',
      country_codes: ['US'],
    });

    const responseTime = Date.now() - startTime;

    // If we get here without an error, Plaid is responsive
    if (response?.data?.institution) {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    } else {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Handle Plaid-specific errors
    const errorMessage = error?.response?.data?.error_message || 
                        error?.message || 
                        'Unknown Plaid error';

    // Distinguish between connection errors and invalid request errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return {
        connected: false,
        status: 'DISCONNECTED',
        error: `Connection refused: ${errorMessage}`,
        responseTime,
      };
    }

    // A 401 or 400 from Plaid usually means credentials are wrong but API is reachable
    if (error?.response?.status === 401 || error?.response?.status === 400) {
      return {
        connected: true,
        status: 'CONNECTED (Invalid Credentials)',
        error: errorMessage,
        responseTime,
      };
    }

    return {
      connected: false,
      status: 'ERROR',
      error: errorMessage,
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
    const environment = process.env.DWOLLA_ENV as 'production' | 'sandbox' || 'sandbox';
    
    const dwollaClient = new Client({
      environment: environment,
      key: process.env.DWOLLA_KEY as string,
      secret: process.env.DWOLLA_SECRET as string,
    });

    // Test with a simple API call to get root resource
    // This doesn't require authentication but verifies connectivity
    const response = await dwollaClient.get('/');

    const responseTime = Date.now() - startTime;

    if (response?.status === 200) {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    } else {
      return {
        connected: true,
        status: 'CONNECTED',
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || 'Unknown Dwolla error';

    // Check for connection errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return {
        connected: false,
        status: 'DISCONNECTED',
        error: `Connection refused: ${errorMessage}`,
        responseTime,
      };
    }

    // Dwolla authentication errors mean API is reachable
    if (error?.status === 401 || error?.status === 403) {
      return {
        connected: true,
        status: 'CONNECTED (Invalid Credentials)',
        error: errorMessage,
        responseTime,
      };
    }

    return {
      connected: false,
      status: 'ERROR',
      error: errorMessage,
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
    '└───────────────────────────────────────────────────────────┘',
    '\n┌─ PLAID ───────────────────────────────────────────────────┐',
    `│ Status: ${result.plaid.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`,
    `│ Details: ${result.plaid.status}`,
    `│ Response Time: ${result.plaid.responseTime}ms`,
    result.plaid.error ? `│ Error: ${result.plaid.error}` : '',
    '└───────────────────────────────────────────────────────────┘',
    '\n���─ DWOLLA ──────────────────────────────────────────────────┐',
    `│ Status: ${result.dwolla.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`,
    `│ Details: ${result.dwolla.status}`,
    `│ Response Time: ${result.dwolla.responseTime}ms`,
    result.dwolla.error ? `│ Error: ${result.dwolla.error}` : '',
    '└───────────────────────────────────���───────────────────────┘',
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
