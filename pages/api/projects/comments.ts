import { NextApiRequest, NextApiResponse } from 'next';
import { getProjectComments } from '../../../utils/projectItemsService';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { projectId } = req.query;

  // Validate projectId parameter
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  switch (method) {
    case 'GET':
      try {
        const comments = await getProjectComments(projectId);
        return res.status(200).json({ comments });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }
    
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
