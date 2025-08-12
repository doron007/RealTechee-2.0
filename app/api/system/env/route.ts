import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '../../../../utils/environmentConfig';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const cfg = getServerConfig();
  const driftStatus = cfg.drift.status;
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
