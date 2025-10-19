import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Returns health check results for database, Plaid, and Dwolla
 */
export async function GET(request: NextRequest) {
  try {
    const result = await runHealthCheck();

    // Return 200 if all services are healthy, 503 if any are down
    const statusCode = result.overall.healthy ? 200 : 503;

    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/health
 * Quick liveness probe (no body)
 */
export async function HEAD(request: NextRequest) {
  try {
    const result = await runHealthCheck();
    const statusCode = result.overall.healthy ? 200 : 503;
    return new NextResponse(null, { status: statusCode });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
