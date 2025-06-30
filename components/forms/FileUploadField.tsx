import React, { useState, useRef } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { Close, Photo, VideoFile, Description } from '@mui/icons-material';
import { P3 } from '../typography/P3' 
import amplifyConfig from '../../amplify_outputs.json';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  key: string;
  category: 'images' | 'videos' | 'docs';
}

interface FileUploadFieldProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  disabled?: boolean;
  addressInfo?: {
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  sessionId: string; // Consistent session ID for all uploads in same form submission
}

const ACCEPTED_FILE_TYPES = {
  images: {
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    icon: (
      <Photo 
        sx={{ 
          fontSize: 48, 
          color: '#2A2B2E' 
        }} 
      />
    )
  },
  videos: {
    accept: 'video/mp4,video/avi,video/mov,video/wmv',
    types: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    icon: (
      <VideoFile 
        sx={{ 
          fontSize: 48, 
          color: '#2A2B2E' 
        }} 
      />
    )
  },
  docs: {
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt',
    types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    icon: (
      <Description 
        sx={{ 
          fontSize: 48, 
          color: '#2A2B2E' 
        }} 
      />
    )
  }
};

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  onFilesChange,
  maxFileSize = 15,
  disabled = false,
  addressInfo,
  sessionId
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create clean address for folder structure
  const getCleanAddress = () => {
    if (!addressInfo?.streetAddress) return 'unknown-address';
    
    const fullAddress = `${addressInfo.streetAddress} ${addressInfo.city} ${addressInfo.state} ${addressInfo.zip}`;
    return fullAddress
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  };

  // Determine file category based on MIME type
  const getFileCategory = (file: File): 'images' | 'videos' | 'docs' => {
    if (ACCEPTED_FILE_TYPES.images.types.includes(file.type)) return 'images';
    if (ACCEPTED_FILE_TYPES.videos.types.includes(file.type)) return 'videos';
    return 'docs';
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    const allAcceptedTypes = [
      ...ACCEPTED_FILE_TYPES.images.types,
      ...ACCEPTED_FILE_TYPES.videos.types,
      ...ACCEPTED_FILE_TYPES.docs.types
    ];

    if (!allAcceptedTypes.includes(file.type)) {
      return 'File type not supported';
    }

    return null;
  };

  // Note: sessionId is now passed as prop for consistency across all uploads

  // Upload file to S3
  const uploadFileToS3 = async (file: File): Promise<UploadedFile> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const category = getFileCategory(file);
    const cleanAddress = getCleanAddress();
    
    // Create S3 key with consistent session ID: address/Requests/YYYYMMDD_HHMMSS/category/file
    const fileKey = `Requests/${cleanAddress}/${sessionId}/${category}/${timestamp}-${sanitizedFileName}`;

    try {
      // Upload to S3 with guest access (for public visibility)
      const uploadTask = uploadData({
        key: fileKey,
        data: file,
        options: {
          accessLevel: 'guest', // Use guest access for public visibility
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const progress = Math.round((transferredBytes / totalBytes) * 100);
              setUploading(prev => ({ ...prev, [fileId]: progress }));
            }
          }
        }
      });

      await uploadTask.result;

      // Generate direct S3 public URL (not presigned) for inline viewing
      // This matches the AddComment system approach for proper inline display
      const config = amplifyConfig as any;
      const bucketName = config.storage?.bucket_name || 'default-bucket';
      const region = config.storage?.aws_region || 'us-west-1';
      const directUrl = `https://${bucketName}.s3.${region}.amazonaws.com/public/${fileKey}`;

      // Remove from uploading state
      setUploading(prev => {
        const newUploading = { ...prev };
        delete newUploading[fileId];
        return newUploading;
      });

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: directUrl, // Direct S3 URL for inline viewing
        key: fileKey,
        category
      };

    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(prev => {
        const newUploading = { ...prev };
        delete newUploading[fileId];
        return newUploading;
      });
      throw new Error('Upload failed');
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError('');

    if (files.length === 0) return;

    try {
      // Validate all files first
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(`${file.name}: ${validationError}`);
          return;
        }
      }

      // Upload all files
      const uploadPromises = files.map(uploadFileToS3);
      const newUploadedFiles = await Promise.all(uploadPromises);

      const updatedFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(updatedFiles);
      onFilesChange(updatedFiles);

    } catch (error) {
      setError('Upload failed. Please try again.');
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get all accepted file types for input
  const getAllAcceptedTypes = () => {
    return Object.values(ACCEPTED_FILE_TYPES)
      .map(type => type.accept)
      .join(',');
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`w-full bg-white border border-dashed border-[#D2D2D4] rounded px-6 py-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#2A2B2E] transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex gap-4">
          {ACCEPTED_FILE_TYPES.images.icon}
          {ACCEPTED_FILE_TYPES.videos.icon}
          {ACCEPTED_FILE_TYPES.docs.icon}
        </div>
        
        <div className="text-center">
          <p className="text-base font-normal text-[#2A2B2E] leading-[1.6] mb-1">
            Upload Images, Videos, or Documents
          </p>
          <p className="text-sm text-[#646469] leading-[1.6]">
            Click to browse files or drag and drop here
          </p>
          <p className="text-xs text-[#646469] mt-2">
            Max file size: {maxFileSize}MB each
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAllAcceptedTypes()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <P3 className="text-[#D11919] mt-2">
          {error}
        </P3>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-[#F9F4F3] border border-[#E4E4E4] rounded"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 flex items-center justify-center">
                  {file.category === 'images' && (
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      📷
                    </div>
                  )}
                  {file.category === 'videos' && (
                    <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                      🎥
                    </div>
                  )}
                  {file.category === 'docs' && (
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      📄
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2A2B2E] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#646469]">
                    {formatFileSize(file.size)} • {file.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveFile(file.id)}
                className="ml-2 p-1 text-[#D11919] hover:bg-red-50 rounded"
                type="button"
              >
                <Close 
                  sx={{ 
                    fontSize: 16,
                    color: 'currentColor'
                  }} 
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploading).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploading).map(([fileId, progress]) => (
            <div key={fileId} className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">Uploading...</span>
                <span className="text-sm text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;