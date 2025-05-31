import React from 'react';
import Image from 'next/image';
import { Modal, Box } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import { BodyContent } from '../Typography';
import { formatDate } from '../../utils/formatUtils';
import Button from '../common/buttons/Button';
import AddCommentDialog from './AddCommentDialog';

export interface Comment {
    ID: string;
    'Project ID': string;
    'Posted By': string;
    Nickname: string;
    Comment: string;
    Files?: string;
    'Is Private': boolean;
    'Posted By Profile Image'?: string;
    'Add To Gallery'?: string;
    'Created Date': string;
    'Updated Date': string;
    Owner: string;
    images?: string[]; // Add processed image URLs field
}

interface CommentsListProps {
    commentsData: Comment[];
    title?: string;
    initialExpanded?: boolean;
    className?: string;
    projectId: string;
    onCommentAdded?: (comment: Comment) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({
    commentsData,
    title = "Comments",
    initialExpanded = true,
    className = "",
    projectId,
    onCommentAdded
}) => {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');
    const [isAddingComment, setIsAddingComment] = React.useState(false);

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'auto',
        maxWidth: '90vw',
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 0,
        outline: 'none',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    };

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Sort comments by creation date based on sort order
    const sortedComments = React.useMemo(() => {
        return [...commentsData].sort((a, b) => {
            const dateA = new Date(a['Created Date']);
            const dateB = new Date(b['Created Date']);
            return sortOrder === 'newest' 
                ? dateB.getTime() - dateA.getTime() 
                : dateA.getTime() - dateB.getTime();
        });
    }, [commentsData, sortOrder]);

    const handleAddComment = async (comment: string, files: File[]) => {
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('comment', comment);
        formData.append('nickname', 'User'); // You might want to make this dynamic
        formData.append('userImageUrl', ''); // And this too
        files.forEach(file => formData.append('images[]', file));

        // Submit the comment
        const response = await fetch('/api/projects/addComment', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to add comment');
        }

        const data = await response.json();
        if (onCommentAdded) {
            onCommentAdded(data.comment);
        }
    };

    const handleImageClick = (imageUrl: string) => {
        setIsLoading(true);
        setSelectedImage(imageUrl);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
        setIsLoading(false);
    };

    const handleSort = (order: 'newest' | 'oldest') => {
        setSortOrder(order);
    };

    return (
        <div className={className}>
            <CollapsibleSection title={title} initialExpanded={initialExpanded}>
                <div className="flex justify-between items-center mb-4">
                    {/* Sort buttons */}
                    <div className="flex gap-2">
                        <Button 
                            variant={sortOrder === 'newest' ? 'secondary' : 'link'}
                            onClick={() => handleSort('newest')}
                            className="!py-1 !px-3 text-sm"
                        >
                            Newest
                        </Button>
                        <Button 
                            variant={sortOrder === 'oldest' ? 'secondary' : 'link'}
                            onClick={() => handleSort('oldest')}
                            className="!py-1 !px-3 text-sm"
                        >
                            Oldest
                        </Button>
                    </div>

                    {/* Add comment button */}
                    <Button
                        variant="primary"
                        onClick={() => setIsAddingComment(true)}
                        className="!py-1 !px-3 text-sm flex items-center gap-2"
                    >
                        <span>Add Comment</span>
                    </Button>
                </div>

                {/* Comments list */}
                <div className="space-y-6">
                    {sortedComments.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <BodyContent className="text-gray-500 text-center">No comments yet</BodyContent>
                        </div>
                    ) : 
                    sortedComments.map((comment) => (
                        <div
                            key={comment.ID}
                            className="bg-gray-50 p-4 rounded-lg"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {comment['Posted By Profile Image'] ? (
                                    <Image
                                        src={comment['Posted By Profile Image']}
                                        alt={comment.Nickname}
                                        width={30}
                                        height={30}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-sm">
                                            {comment.Nickname.substring(0, 1).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <BodyContent className="font-medium !mb-0">
                                    {comment.Nickname}
                                </BodyContent>
                            </div>

                            <BodyContent className="whitespace-pre-line mb-3">
                                {comment.Comment}
                            </BodyContent>

                            {comment.images && comment.images.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {comment.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="relative w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleImageClick(image)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`View image ${index + 1}`}
                                            style={{ aspectRatio: '1/1' }}
                                        >
                                            <Image
                                                src={image}
                                                alt={`Comment image ${index + 1}`}
                                                fill
                                                className="object-cover rounded-md"
                                                sizes="80px"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <BodyContent className="text-sm text-gray-500 !mb-0 mt-2">
                                {formatDate(new Date(comment['Created Date']), { timeZone: 'America/Los_Angeles' })}
                            </BodyContent>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Image preview modal */}
            <Modal
                open={!!selectedImage}
                onClose={handleCloseModal}
                aria-labelledby="image-preview-modal"
            >
                <Box sx={modalStyle}>
                    {selectedImage && (
                        <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                            <Image
                                src={selectedImage}
                                alt="Preview"
                                width={1920}
                                height={1080}
                                className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                                onLoad={() => setIsLoading(false)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    )}
                </Box>
            </Modal>
            
            {/* Add comment dialog */}
            <AddCommentDialog 
                open={isAddingComment}
                onClose={() => setIsAddingComment(false)}
                onSubmit={handleAddComment}
            />
        </div>
    );
};

export default CommentsList;
