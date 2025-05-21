import { NextApiRequest, NextApiResponse } from 'next';
import { getProjectLocations } from '../../../utils/projectsService';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const locations = await getProjectLocations();
        return res.status(200).json({ locations });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to fetch locations' });
      }
    
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
