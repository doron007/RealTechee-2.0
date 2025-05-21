import { NextApiRequest, NextApiResponse } from 'next';
import { getProjectCategories } from '../../../utils/projectsService';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const categories = await getProjectCategories();
        return res.status(200).json({ categories });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }
    
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
