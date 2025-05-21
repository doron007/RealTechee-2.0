import { NextApiRequest, NextApiResponse } from 'next';
import { createProject } from '../../../utils/projectsService';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      try {
        const newProject = await createProject(req.body);
        return res.status(201).json({ project: newProject });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to create project' });
      }
    
    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
