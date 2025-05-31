import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs/promises';
import { createRouter } from 'next-connect';
import { ProjectComment } from '../../../types/projectItems';
import { appendToCSV } from '../../../utils/csvUtils';
import formidable from 'formidable';
import { Fields, Files } from 'formidable';

const COMMENTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'ProjectComments.csv');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploadedMedia');

export const config = {
    api: {
        bodyParser: false, // Disabling built-in bodyParser
    },
};

const DEFAULT_USER_IMAGE = "https://lh3.googleusercontent.com/a/AGNmyxY4BWzlbh6p56oCLWcX-Z4YmsnFOje_x6b_BpYG=s96-c";
const DEFAULT_NICKNAME = "Realtechee";

// Ensure uploads directory exists
async function ensureUploadsDir() {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
}

// Parse form data
const parseForm = async (req: NextApiRequest): Promise<{ fields: Fields; files: Files }> => {
    const form = formidable({
        uploadDir: UPLOADS_DIR,
        keepExtensions: true,
        multiples: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
        });
    });
};

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
    try {
        // Parse form data
        const { fields, files } = await parseForm(req);
        const projectId = fields.projectId?.toString();
        const comment = fields.comment?.toString();
        const nickname = fields.nickname?.toString();
        const userImageUrl = fields.userImageUrl?.toString();

        // Validate required fields
        if (!projectId?.trim()) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        if (!comment?.trim()) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        // Sanitize inputs
        const sanitizedComment = comment.replace(/[\n\r]/g, ' ').trim();
        const sanitizedNickname = (nickname?.trim() || DEFAULT_NICKNAME).replace(/[,\"]/g, '');
        const sanitizedUserImage = (userImageUrl?.trim() || DEFAULT_USER_IMAGE).replace(/[,\"]/g, '');

        // Create new comment object
        const newComment: ProjectComment = {
            ID: nanoid(),
            'Project ID': projectId,
            'Posted By': 'info@realtechee.com',
            Nickname: sanitizedNickname,
            Comment: sanitizedComment,
            'Is Private': false,
            'Posted By Profile Image': sanitizedUserImage,
            'Created Date': new Date().toISOString(),
            'Updated Date': new Date().toISOString(),
            Owner: 'system',
            Files: '[]'
        };

        // Handle image uploads if present
        if (files.images) {
            await ensureUploadsDir();
            const projectDir = path.join(UPLOADS_DIR, projectId);
            await fs.mkdir(projectDir, { recursive: true });

            // Convert to array if it's a single file
            const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
            const processedImages = await Promise.all(imageFiles.map(async file => {
                const newPath = path.join(projectDir, file.originalFilename || file.newFilename);
                await fs.rename(file.filepath, newPath);
                return {
                    description: comment,
                    slug: file.originalFilename || file.newFilename,
                    alt: file.originalFilename || 'Comment image',
                    src: `/uploadedMedia/${projectId}/${file.originalFilename || file.newFilename}`,
                    title: file.originalFilename || 'Comment image',
                    type: 'image',
                    settings: {},
                };
            }));

            // Store image info in Files field
            try {
                newComment.Files = JSON.stringify(processedImages);
            } catch (error) {
                console.error('Error serializing image data:', error);
                return res.status(500).json({ 
                    error: 'Failed to process image data',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        // Append to CSV
        const appendSuccess = await appendToCSV(COMMENTS_CSV_PATH, {
            ...newComment,
            media: newComment.Files,
            text: newComment.Comment,
            email: newComment['Posted By'],
            name: newComment.Nickname,
            commentId: newComment.ID,
            parentCommentId: null,
            isPrivate: newComment['Is Private'],
            avatar: newComment['Posted By Profile Image'],
            createdAt: newComment['Created Date'],
            updatedAt: newComment['Updated Date']
        });
        
        if (!appendSuccess) {
            throw new Error('Failed to append comment to CSV file');
        }

        return res.status(200).json({
            success: true,
            comment: newComment
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API Error] Failed to add comment:', errorMessage);
        return res.status(500).json({
            error: 'Failed to add comment',
            message: errorMessage
        });
    }
});

export default router.handler({
    onError: (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[API Error] Internal server error:', errorMessage);
        res.status(500).json({
            error: 'Internal server error',
            message: errorMessage
        });
    }
});
