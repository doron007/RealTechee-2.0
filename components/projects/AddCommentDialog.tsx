import React from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import Image from 'next/image';
import Button from '../common/buttons/Button';

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string, files: File[]) => Promise<void>;
}

export default function AddCommentDialog({ open, onClose, onSubmit }: AddCommentDialogProps) {
  const [comment, setComment] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setComment('');
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);

    // Generate previews for the new files
    selectedFiles.forEach(file => {
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

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(comment.trim(), files);
      handleClose();
    } catch (error) {
      console.error('Error submitting comment:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Add Comment
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          multiline
          rows={4}
          variant="outlined"
          placeholder="Write your comment..."
          fullWidth
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mb-4"
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <Image 
                  src={preview} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <IconButton
                  size="small"
                  className="absolute top-0 right-0 bg-white"
                  onClick={() => handleRemoveImage(index)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button
            variant="link"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<ImageIcon />}
          >
            Add Images
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Post Comment
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
