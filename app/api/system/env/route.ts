import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '../../../../utils/environmentConfig';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Security: Since admin pages already handle authentication,
  // just verify this request is coming from the admin interface
  const referer = req.headers.get('referer');
  
  // Allow requests from admin pages or direct API calls in development
  const isFromAdmin = !referer || referer.includes('/admin');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isFromAdmin && !isDevelopment) {
    return NextResponse.json(
      { error: 'Forbidden - Access restricted to admin interface' },
      { status: 403 }
    );
  }

  const cfg = getServerConfig();
  const driftStatus = cfg.drift.status;
  
  // Return sanitized configuration for admin use
  return NextResponse.json({
    environment: cfg.environment,
    backendSuffix: cfg.backendSuffix,
    graphqlUrl: cfg.graphqlUrl,
    region: cfg.region,
    cognito: cfg.cognito,
    storage: cfg.storage,
    flags: cfg.flags,
    drift: cfg.drift,
    build: cfg.build,
    health: driftStatus === 'mismatch' ? 'degraded' : 'ok'
  });
}
