import { NextRequest, NextResponse } from 'next/server';
import { getHealthCheckMetrics } from '@/lib/health-check-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/metrics
 * Returns Prometheus-compatible metrics
 * 
 * Usage:
 *   curl http://localhost:3000/api/health/metrics
 *   
 * Example output:
 *   health_check_database 1
 *   health_check_database_response_time_ms 245
 *   health_check_plaid 1
 *   ...
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await getHealthCheckMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return new NextResponse(
      `# Error generating metrics\n# ${error?.message || 'Unknown error'}`,
      { status: 500 }
    );
  }
}
