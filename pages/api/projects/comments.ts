import { NextApiRequest, NextApiResponse } from 'next';
import { projectItemsService } from '../../../utils/projectItemsService';
import { withCors } from '../../../utils/corsMiddleware';
import { ProjectComment } from '../../../types/projectItems';

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { projectId } = req.query;

  // Basic validation
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;
  if (!projectIdString.trim()) {
    return res.status(400).json({ error: 'Project ID cannot be empty' });
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  try {
    const startTime = Date.now();
    console.log(`[Comments API] Starting request for ProjectID: ${projectIdString}`);

    const comments = await projectItemsService.getProjectComments(projectIdString);
    const duration = Date.now() - startTime;
    
    if (!comments.length) {
      return res.status(404).json({
        error: 'No comments found',
        projectId: projectIdString,
        duration,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      comments,
      count: comments.length,
      projectId: projectIdString,
      duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Comments API] Error for ProjectID ${projectIdString}:`, error);
    
    return res.status(500).json({
      error: 'Failed to fetch comments',
      message: error instanceof Error ? error.message : 'Unknown error',
      projectId: projectIdString,
      timestamp: new Date().toISOString()
    });
  }
});
