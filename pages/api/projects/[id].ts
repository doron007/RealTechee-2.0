import { NextApiRequest, NextApiResponse } from 'next';
import { getProjectById, updateProject, deleteProject } from '../../../utils/projectsService';
import { withCors } from '../../../utils/corsMiddleware';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  // Validate ID parameter
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  switch (method) {
    case 'GET':
      try {
        const project = await getProjectById(id);
        
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.status(200).json({ project });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to fetch project' });
      }
    
    case 'PUT':
      try {
        const updatedProject = await updateProject(id, req.body);
        
        if (!updatedProject) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.status(200).json({ project: updatedProject });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to update project' });
      }
    
    case 'DELETE':
      try {
        const result = await deleteProject(id);
        
        if (!result) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Failed to delete project' });
      }
    
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
});
