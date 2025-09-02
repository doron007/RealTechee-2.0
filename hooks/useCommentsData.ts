import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { getRelativePathForUpload, convertPathsToJson, getRelativePathForCommentUpload } from '../utils/s3Utils';
import amplifyConfig from '../amplify_outputs.json';

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

  // Create normalized address for folder structure (same pattern as FileUploadField)
  const getCleanAddress = (projectData: any) => {
    logger.debug('getCleanAddress called with projectData', {
      hasProjectData: !!projectData,
      hasAddress: !!projectData?.address,
      hasPropertyFullAddress: !!projectData?.address?.propertyFullAddress,
      title: projectData?.title,
      addressData: projectData?.address
    });
    
    // Check multiple possible address locations
    let fullAddress = null;
    
    if (projectData?.address?.propertyFullAddress) {
      fullAddress = projectData.address.propertyFullAddress;
    } else if (projectData?.title) {
      // Fallback to project title if it looks like an address
      fullAddress = projectData.title;
    }
    
    if (!fullAddress) {
      logger.warn('No address found in project data, using unknown-address');
      return 'unknown-address';
    }
    
    const cleanAddress = fullAddress
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 100); // Allow longer addresses to match expected format
    
    logger.debug('Generated clean address', { 
      originalAddress: fullAddress, 
      cleanAddress 
    });
    
    return cleanAddress;
  };

  /**
   * Upload files to S3 storage
   */
  const uploadFiles = async (
    files: File[], 
    projectId: string,
    onProgress?: UploadProgressCallback,
    projectData?: any
  ): Promise<string[]> => {
    if (!files.length) return [];
    
    // Ensure Storage is configured (same pattern as FileUploadField)
    // This handles cases where Storage module isn't initialized even though Amplify is configured
    try {
      const config = Amplify.getConfig();
      if (!config.Storage || !config.Storage.S3) {
        logger.info('Storage not configured, reconfiguring Amplify...');
        Amplify.configure(amplifyConfig);
      }
    } catch (err) {
      logger.info('Reconfiguring Amplify after error:', err);
      Amplify.configure(amplifyConfig);
    }
    
    const relativePaths: string[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;
    const cleanAddress = getCleanAddress(projectData);
    
    try {
      for (const file of files) {
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/\s+/g, '_');
        
        // Create proper folder structure: address/comments/timestamp-file
        const key = `${cleanAddress}/comments/${timestamp}-${sanitizedFileName}`;
        
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
        
        // Store relative path using utility function - this will be stored in DB
        const relativePath = getRelativePathForCommentUpload(timestamp, file.name, cleanAddress);
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
    onProgress?: UploadProgressCallback,
    projectData?: any
  ): Promise<Comment> => {
    setLoading(true);
    setError(null);
    
    try {
      // Upload files first if there are any
      let filePaths: string[] = [];
      if (files.length > 0) {
        filePaths = await uploadFiles(files, commentData.projectId, onProgress, projectData);
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
