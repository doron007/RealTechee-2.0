import React from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, IconButton, Box, FormControl, FormHelperText, CircularProgress, InputLabel, Checkbox, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Image from 'next/image';
import Button from '../common/buttons/Button';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string, files: File[], nickname: string, isPrivate?: boolean) => Promise<void>;
  projectId: string;
}

export default function AddCommentDialog({ open, onClose, onSubmit, projectId }: AddCommentDialogProps) {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [comment, setComment] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [loadToGallery, setLoadToGallery] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    comment?: string;
    nickname?: string;
    submit?: string;
  }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const isAuthenticated = authStatus === 'authenticated' && !!user;

  // Set initial values based on user attributes when dialog opens
  React.useEffect(() => {
    if (open) {
      if (user) {
        // Set nickname from user attributes or username for authenticated users
// signInDetails = {loginId: 'info@realtechee.com', authFlowType: 'USER_SRP_AUTH'}
// authFlowType = 'USER_SRP_AUTH'
// loginId = 'info@realtechee.com'
// [[Prototype]] = Object
// userId = '09e9797e-1071-7052-1b46-4c866309fd2f'
// username = '09e9797e-1071-7052-1b46-4c866309fd2f'
// [[Prototype]] = Object        
        const username = user.signInDetails?.loginId || '';
        const email = username; //(user as any).attributes?.email || '';
        const preferredName = username; //(user as any).attributes?.['name'] || email.split('@')[0] || username;
        setNickname(preferredName);
      } else {
        // Clear nickname for anonymous users
        setNickname('');
      }
    }
  }, [user, open]);

  const handleClose = () => {
    setComment('');
    setNickname('');
    setFiles([]);
    setPreviews([]);
    setUploadProgress(0);
    setIsPrivate(false);
    setLoadToGallery(false);
    setErrors({});
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter files by size (max 15MB per Figma design) and type
    const validFiles = selectedFiles.filter(file => {
      const isValidSize = file.size <= 15 * 1024 * 1024; // 15MB limit per Figma
      const isValidType = /^(image\/(jpeg|png|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/i.test(file.type);
      return isValidSize && isValidType;
    });
    
    setFiles(prev => [...prev, ...validFiles]);

    // Generate previews for the new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: {comment?: string; nickname?: string} = {};
    
    if (!comment.trim()) {
      newErrors.comment = 'Comment is required';
    }
    
    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, submit: undefined }));
    
    try {
      // Submit comment with files via the provided onSubmit callback
      // This will be handled by our parent component using the useCommentsData hook
      await onSubmit(comment.trim(), files, nickname.trim(), isPrivate);
      
      // Close dialog after a brief delay to ensure data is processed
      setTimeout(handleClose, 500);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: 'Failed to submit comment. Please try again.' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isSubmitting ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Add Comment
          {!isSubmitting && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent className="p-6">
        {/* User Info Section */}
        <Box className="flex items-center gap-3 mb-4">
          {/* Avatar placeholder */}
          {/* <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs">
              {nickname?.substring(0, 1).toUpperCase() || 'U'}
            </span>
          </div> */}
          
          <TextField
            placeholder="{username}"
            variant="outlined"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            disabled={isSubmitting || isAuthenticated}
            error={!!errors.nickname}
            helperText={errors.nickname}
            size="small"
            sx={{
              minWidth: '150px',
              '& .MuiOutlinedInput-root': {
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'Roboto',
                color: '#2A2B2E',
                backgroundColor: isAuthenticated ? '#f5f5f5' : 'white',
              },
            }}
          />
          
          {isAuthenticated && (user as any)?.attributes?.email && (
            <span className="text-sm text-gray-500">
              {(user as any).attributes.email}
            </span>
          )}
        </Box>

        {/* Comment Input - moved to top per Figma design */}
        <FormControl fullWidth error={!!errors.comment} className="mb-4">
          <TextField
            autoFocus
            multiline
            rows={4}
            variant="outlined"
            placeholder="It looks great. Thank you for the update."
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            required
            error={!!errors.comment}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#F6F6F6',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'Roboto',
                '& fieldset': {
                  borderColor: '#D2D2D4',
                },
                '&:hover fieldset': {
                  borderColor: '#646469',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2A2B2E',
                },
              },
            }}
          />
          {errors.comment && <FormHelperText>{errors.comment}</FormHelperText>}
        </FormControl>

        {/* File Uploads Section - match Figma grid layout */}
        {previews.length > 0 && (
          <Box className="my-4">
            <div className="flex flex-wrap gap-2 justify-end">
              {previews.map((preview, index) => (
                <div key={index} className="relative w-20 h-20 border border-gray-200 rounded-md">
                  {files[index]?.type.startsWith('image/') ? (
                    <Image 
                      src={preview} 
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                      fill
                      sizes="80px"
                      style={{ padding: '10px' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1">
                      <FileUploadIcon fontSize="small" />
                      <span className="text-xs text-center mt-1 truncate w-full">
                        {files[index]?.name}
                      </span>
                    </div>
                  )}
                  {!isSubmitting && (
                    <IconButton
                      size="small"
                      className="absolute -top-2 -right-2 bg-white shadow-sm w-6 h-6"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        backgroundColor: 'white',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          </Box>
        )}

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <Box mt={2} mb={2} display="flex" alignItems="center">
            <CircularProgress 
              variant="determinate" 
              value={uploadProgress} 
              size={24} 
              sx={{ mr: 2 }} 
            />
            <span>Uploading files... {Math.round(uploadProgress)}%</span>
          </Box>
        )}

        {/* Error display */}
        {errors.submit && (
          <Box className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <span className="text-red-700 text-sm">{errors.submit}</span>
          </Box>
        )}

        {/* Action Buttons Section - match Figma design */}
        <Box className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-start">
            {/* Left side - File upload and checkboxes */}
            <div className="flex flex-col space-y-3">
              {/* Attach media button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ImageIcon fontSize="small" />
                <div className="text-left">
                  <div className="text-sm font-medium">Attach media</div>
                  <div className="text-xs">Max file size 15MB</div>
                </div>
              </button>

              {/* Checkboxes - only show for authenticated users */}
              {isAuthenticated && (
                <div className="space-y-2">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        size="small"
                        sx={{
                          color: '#646469',
                          '&.Mui-checked': { color: '#2A2B2E' },
                        }}
                      />
                    }
                    label={
                      <span className="text-sm text-gray-500">Make it private</span>
                    }
                    className="m-0"
                  />
                </div>
              )}
            </div>

            {/* Right side - Submit button */}
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!comment.trim() || (!isAuthenticated && !nickname.trim()) || isSubmitting}
              className="px-6 py-2"
              sx={{
                backgroundColor: '#2A2B2E',
                color: 'white',
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'Nunito Sans',
                textTransform: 'none',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#1a1b1e',
                },
                '&:disabled': {
                  backgroundColor: '#BCBCBF',
                  color: 'white',
                },
              }}
            >
              {isSubmitting ? 'Posting...' : isAuthenticated ? 'Update' : 'Add Comment'}
            </Button>
          </div>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          className="hidden"
        />
      </DialogContent>

    </Dialog>
  );
}
