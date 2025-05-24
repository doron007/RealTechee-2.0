import { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '../../../utils/corsMiddleware';
import { processImageUrl, processImageGallery } from '../../../utils/serverWixMediaUtils';

/**
 * API endpoint for converting Wix media URLs to standard URLs
 * Supports both single URLs and arrays of URLs/gallery data
 * 
 * POST /api/media/convert
 * Body: 
 *   { "url": "wix:image://..." } - Single URL
 *   OR
 *   { "gallery": [...] } - Array of image data
 */
export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  try {
    const { url, gallery } = req.body;
    
    // Handle single URL conversion
    if (url && typeof url === 'string') {
      const convertedUrl = await processImageUrl(url);
      return res.status(200).json({ url: convertedUrl });
    }
    
    // Handle gallery/array conversion
    if (gallery) {
      const convertedUrls = await processImageGallery(gallery);
      return res.status(200).json({ urls: convertedUrls });
    }
    
    // If neither url nor gallery is provided
    return res.status(400).json({ error: 'Missing required parameter: url or gallery' });
  } catch (error) {
    console.error('Error converting media URL:', error);
    return res.status(500).json({ error: 'Failed to convert media URL' });
  }
});
