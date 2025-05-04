import { NextApiRequest, NextApiResponse } from 'next';
import pkg from '../../package.json';

type VersionResponse = {
  version: string;
  buildTime?: string;
  commitSha?: string;
  nodeEnv: string;
};

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<VersionResponse>
) {
  const versionInfo: VersionResponse = {
    version: pkg.version,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
    commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA,
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  // Cache response for 1 hour
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).json(versionInfo);
}