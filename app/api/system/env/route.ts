import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '../../../../utils/environmentConfig';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Security: Restrict access to authenticated admin users only
  const authHeader = req.headers.get('authorization');
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('amplify-signin-with-hostedUI');
  
  // Simple check: ensure user is authenticated via Amplify
  // Admin pages already handle full authorization, this is just basic auth check
  if (!authHeader && !authCookie) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  // Additional security: Check for admin referrer (requests should come from admin pages)
  const referer = req.headers.get('referer');
  if (referer && !referer.includes('/admin')) {
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
