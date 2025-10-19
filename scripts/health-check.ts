#!/usr/bin/env node

/**
 * Health Check CLI Script
 * 
 * Usage:
 *   npm run health-check
 *   npx ts-node scripts/health-check.ts
 *   node scripts/health-check.js (after building)
 */

import { logHealthCheck, runHealthCheck, formatHealthCheckOutput } from '../lib/health-check';

async function main() {
  console.log('🏥 Starting health check...\n');

  try {
    const result = await runHealthCheck();
    const formatted = formatHealthCheckOutput(result);
    console.log(formatted);

    // Exit with appropriate code
    const exitCode = result.overall.healthy ? 0 : 1;
    
    if (exitCode === 0) {
      console.log('✅ All services are healthy!\n');
    } else {
      console.log('⚠️  Some services are not responding. Please check the errors above.\n');
    }

    process.exit(exitCode);
  } catch (error: any) {
    console.error('❌ Health check script failed:', error?.message || error);
    process.exit(1);
  }
}

main();
