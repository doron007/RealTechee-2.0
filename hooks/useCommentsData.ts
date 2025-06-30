import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { generateS3Key, getRelativePathForUpload, convertPathsToJson } from '../utils/s3Utils';

// Custom mutation that matches the actual DynamoDB schema
const CREATE_PROJECT_COMMENT = /* GraphQL */ `
  mutation CreateProjectComments($input: CreateProjectCommentsInput!) {
    createProjectComments(input: $input) {
      id
      comment
      createdAt
      files
      isPrivate
      nickname
      owner
      postedByContactId
      postedByProfileImage
      projectId
      updatedAt
    }
  }
`;

const client = generateClient({
  authMode: 'apiKey'
});

const logger = createLogger('useCommentsData');

interface Comment {
  id: string;
  projectId: string;
  postedByContactId: string;
  nickname: string;
  comment: string;
  files?: string;
  isPrivate: boolean;
  postedByProfileImage?: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
}

interface CommentInput {
  projectId: string;
  postedByContactId: string;
  nickname: string;
  comment: string;
  files?: string[];
  isPrivate?: boolean;
  postedByProfileImage?: string;
  owner?: string;
}

interface UploadProgressCallback {
  (progress: number): void;
}

export const useCommentsData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Look up contact details by email (disabled until queries.ts is regenerated)
   */
  const findContactByEmail = async (email: string) => {
    // TODO: Re-enable when queries.ts is regenerated
    logger.debug('Contact lookup disabled until GraphQL types are regenerated', { email });
    return null;
  };

  /**
   * Upload files to S3 storage
   */
  const uploadFiles = async (
    files: File[], 
    projectId: string,
    onProgress?: UploadProgressCallback
  ): Promise<string[]> => {
    if (!files.length) return [];
    
    const relativePaths: string[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;
    
    try {
      for (const file of files) {
        // Generate S3 key using utility function
        const key = generateS3Key(projectId, file.name);
        
        // Upload the file to S3
        await uploadData({
          key,
          data: file,
          options: {
            accessLevel: 'guest',
            contentType: file.type,
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (onProgress && totalBytes) {
                const percentCompleted = (transferredBytes / totalBytes) * 100;
                const overallProgress = ((completedFiles / totalFiles) * 100) + 
                  (percentCompleted / totalFiles);
                onProgress(overallProgress);
              }
            }
          }
        }).result;
        
        // Store relative path instead of full URL
        const relativePath = `/${key}`;
        relativePaths.push(relativePath);
        completedFiles++;
      }
      
      return relativePaths;
    } catch (err) {
      logger.error('Error uploading files', err);
      setError('Error uploading files');
      throw err;
    }
  };

  /**
   * Add a new comment with optional file uploads
   */
  const addComment = async (
    commentData: CommentInput,
    files: File[] = [],
    onProgress?: UploadProgressCallback
  ): Promise<Comment> => {
    setLoading(true);
    setError(null);
    
    try {
      // Upload files first if there are any
      let filePaths: string[] = [];
      if (files.length > 0) {
        filePaths = await uploadFiles(files, commentData.projectId, onProgress);
      }
      
      // Prepare the input data for the GraphQL mutation
      const input = {
        id: uuidv4(),
        projectId: commentData.projectId,
        postedByContactId: commentData.postedByContactId,
        nickname: commentData.nickname,
        comment: commentData.comment,
        files: filePaths.length > 0 ? convertPathsToJson(filePaths) : null,
        isPrivate: commentData.isPrivate || false,
        postedByProfileImage: commentData.postedByProfileImage || null,
        owner: commentData.owner || commentData.postedByContactId
        // createdAt/updatedAt are automatically managed by Amplify
      };
      
      // Call the mutation
      const result = await client.graphql({
        query: CREATE_PROJECT_COMMENT,
        variables: { input }
      });
      
      return (result as any).data.createProjectComments as Comment;
    } catch (err) {
      logger.error('Error adding comment', err);
      
      // Log detailed error information
      if (err && typeof err === 'object' && 'errors' in err) {
        logger.error('GraphQL errors details:', (err as any).errors);
        (err as any).errors?.forEach((error: any, index: number) => {
          logger.error(`GraphQL Error ${index + 1}: ${error.message}`, error);
        });
      }
      
      setError('Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    addComment
  };
};
