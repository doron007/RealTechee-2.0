import { NextApiRequest, NextApiResponse } from 'next';
import { getProjects, getProjectById } from '../../../utils/projectsService';
import { ProjectFilter } from '../../../types/projects';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Extract filter parameters from query
        const { category, location, featured, search } = req.query;
        
        const filter: ProjectFilter = {};
        
        if (category && typeof category === 'string') {
          filter.category = category;
        }
        
        if (location && typeof location === 'string') {
          filter.location = location;
        }
        
        if (featured && typeof featured === 'string') {
          filter.featured = featured === 'true';
        }
        
        if (search && typeof search === 'string') {
          filter.search = search;
        }
        
        // Get projects with optional filtering
        const projects = await getProjects(Object.keys(filter).length > 0 ? filter : undefined);
        
        return res.status(200).json({ projects });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
    
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
