import React from 'react';
import Image from 'next/image';
import { Modal, Box } from '@mui/material';
import { 
    PictureAsPdf, 
    Description, 
    InsertDriveFile, 
    Image as ImageIcon,
    Close 
} from '@mui/icons-material';
import { CollapsibleSection, AuthRequiredDialog } from '../common/ui';
import P2 from '../typography/P2';
import { formatDate } from '../../utils/formatUtils';
import Button from '../common/buttons/Button';
import AddCommentDialog from './AddCommentDialog';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useCommentsData } from '../../hooks';
import { useRouter } from 'next/router';
import { createLogger } from '../../utils/logger';
import { parseFileUrlsToRelativePaths, convertPathsToUrls } from '../../utils/s3Utils';

export interface Comment {
    id: string;
    projectId: string;
    postedByContactId: string;
    nickname: string;
    comment: string;
    files?: string;
    isPrivate: boolean;
    postedByProfileImage?: string;
    addToGallery?: string;
    createdAt: string;
    updatedAt: string;
    owner: string;
}

interface CommentsListProps {
    commentsData: Comment[];
    title?: string;
    initialExpanded?: boolean;
    className?: string;
    projectId: string;
    onCommentAdded?: (comment: Comment) => void;
}

const logger = createLogger('CommentsList');

// File type detection utilities
const getFileExtension = (url: string): string => {
    try {
        // Remove query parameters and get the path
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const lastDot = pathname.lastIndexOf('.');
        return lastDot !== -1 ? pathname.substring(lastDot + 1).toLowerCase() : '';
    } catch {
        // Fallback for relative paths
        const lastDot = url.lastIndexOf('.');
        return lastDot !== -1 ? url.substring(lastDot + 1).toLowerCase() : '';
    }
};

const getFileType = (url: string): 'image' | 'document' => {
    const extension = getFileExtension(url);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    return imageExtensions.includes(extension) ? 'image' : 'document';
};

const getDocumentIcon = (url: string) => {
    const extension = getFileExtension(url);
    const iconProps = { sx: { fontSize: 48, color: '#2A2B2E' } };
    
    switch (extension) {
        case 'pdf':
            return <PictureAsPdf {...iconProps} />;
        case 'doc':
        case 'docx':
            return <Description {...iconProps} />;
        case 'txt':
        case 'rtf':
            return <Description {...iconProps} />;
        default:
            return <InsertDriveFile {...iconProps} />;
    }
};

const getFileName = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/');
        return segments[segments.length - 1] || 'document';
    } catch {
        // Fallback for relative paths
        const segments = url.split('/');
        return segments[segments.length - 1] || 'document';
    }
};

const CommentsList: React.FC<CommentsListProps> = ({
    commentsData,
    title = "Comments",
    initialExpanded = true,
    className = "",
    projectId,
    onCommentAdded
}) => {
    const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
    const { addComment, loading: commentSubmitLoading } = useCommentsData();
    const router = useRouter();
    const [selectedFile, setSelectedFile] = React.useState<{ url: string; type: 'image' | 'document'; name: string } | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');
    const [isAddingComment, setIsAddingComment] = React.useState(false);
    const [isAuthRequiredOpen, setIsAuthRequiredOpen] = React.useState(false);

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: selectedFile?.type === 'document' ? '90vw' : 'auto',
        height: selectedFile?.type === 'document' ? '90vh' : 'auto',
        maxWidth: '90vw',
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: selectedFile?.type === 'document' ? 2 : 0,
        outline: 'none',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: selectedFile?.type === 'document' ? 'hidden' : 'visible'
    };

    // Handle escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedFile(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Handle post-authentication actions
    React.useEffect(() => {
        const { action } = router.query;
        
        if (action === 'add comments' && authStatus === 'authenticated' && user) {
            // User just authenticated and wanted to add a comment
            setIsAddingComment(true);
            
            // Clean up the URL by removing the action parameter
            const cleanQuery = { ...router.query };
            delete cleanQuery.action;
            router.replace({
                pathname: router.pathname,
                query: cleanQuery
            }, undefined, { shallow: true });
        }
    }, [router.query.action, authStatus, user, router]);

    // Sort comments by creation date based on sort order
    const sortedComments = React.useMemo(() => {
        return [...commentsData].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'newest' 
                ? dateB.getTime() - dateA.getTime() 
                : dateA.getTime() - dateB.getTime();
        });
    }, [commentsData, sortOrder]);

    const handleAddComment = async (comment: string, files: File[], nickname: string, isPrivate = false) => {
        try {
            setIsLoading(true);
            
            // For authenticated users, try to get their contact ID using their email
            let contactId = 'anonymous';
            let profileImage = '';
            let ownerValue = 'anonymous';
            
            if (user) {
                const userEmail = user.signInDetails?.loginId || (user as any)?.attributes?.email;
                ownerValue = user?.username || user?.userId || userEmail || 'anonymous';
                
                // Try to get existing contactId from user attributes first
                const existingContactId = (user as any)?.attributes?.['custom:contactId'];
                if (existingContactId) {
                    contactId = existingContactId;
                } else if (userEmail) {
                    // If no contactId in user attributes, we'll need to create/find the contact
                    // For now, use the email as contactId - this should be handled better in production
                    contactId = userEmail;
                }
                
                profileImage = (user as any)?.attributes?.['picture'] || '';
            }
            
            // Use our hook to add the comment directly via GraphQL
            // Support both authenticated and anonymous users
            const commentData = {
                projectId, // This should be the Projects.projectId field
                comment,
                nickname,
                postedByContactId: contactId,
                postedByProfileImage: profileImage,
                isPrivate,
                owner: ownerValue
            };
            
            // Add comment and upload files
            const newComment = await addComment(
                commentData, 
                files, 
                (progress) => logger.debug('File upload progress', { progress: `${progress}%` })
            );
            
            // Notify parent component of the new comment
            if (onCommentAdded) {
                onCommentAdded(newComment);
            }
            
            // Wait a brief moment to ensure the comment is saved
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            logger.error('Failed to add comment', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileClick = (fileUrl: string) => {
        const fileType = getFileType(fileUrl);
        const fileName = getFileName(fileUrl);
        setIsLoading(true);
        setSelectedFile({ url: fileUrl, type: fileType, name: fileName });
    };

    const handleCloseModal = () => {
        setSelectedFile(null);
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
                        onClick={() => {
                            // Check auth status and show appropriate dialog
                            if (authStatus === 'authenticated' && user) {
                                setIsAddingComment(true);
                            } else {
                                setIsAuthRequiredOpen(true);
                            }
                        }}
                        className="!py-1 !px-3 text-sm flex items-center gap-2"
                    >
                        <span>Add Comment</span>
                    </Button>
                </div>

                {/* Comments list */}
                <div className="space-y-6">
                    {sortedComments.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <P2 className="text-gray-500 text-center">No comments yet</P2>
                        </div>
                    ) : 
                    sortedComments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-gray-50 p-4 rounded-lg"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {comment.postedByProfileImage ? (
                                    <Image
                                        src={comment.postedByProfileImage}
                                        alt={comment.nickname}
                                        width={30}
                                        height={30}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-sm">
                                            {comment.nickname?.substring(0, 1).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <P2 className="font-medium mb-0">
                                    {comment.nickname}
                                </P2>
                            </div>

                            <P2 className="whitespace-pre-line mb-3">
                                {comment.comment}
                            </P2>

                            {comment.files && comment.files.length > 0 && (() => {
                                // Parse file paths and convert to display URLs
                                let fileUrls: string[] = [];
                                try {
                                    // Parse JSON string containing relative paths
                                    const parsed = JSON.parse(comment.files);
                                    if (Array.isArray(parsed)) {
                                        // Filter for valid paths and convert to full URLs
                                        const validPaths = parsed.filter(item => typeof item === 'string' && item.length > 0);
                                        
                                        // Check if paths are already full URLs (legacy data) or relative paths (new format)
                                        const relativePaths = validPaths.map(path => 
                                            path.startsWith('http') ? parseFileUrlsToRelativePaths(JSON.stringify([path]))[0] : path
                                        );
                                        
                                        // Convert relative paths to full URLs for display
                                        fileUrls = convertPathsToUrls(relativePaths);
                                    }
                                } catch {
                                    // Fallback for legacy comma-separated format
                                    const paths = comment.files.split(',')
                                        .map(f => f.trim())
                                        .filter(f => f && f.length > 0);
                                    
                                    // Convert legacy URLs to relative paths, then back to current URLs
                                    const relativePaths = paths.map(path => 
                                        path.startsWith('http') ? parseFileUrlsToRelativePaths(JSON.stringify([path]))[0] : path
                                    );
                                    fileUrls = convertPathsToUrls(relativePaths);
                                }
                                
                                return fileUrls.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {fileUrls.map((file, index) => {
                                            const fileType = getFileType(file);
                                            const fileName = getFileName(file);
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    className="relative w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center"
                                                    onClick={() => handleFileClick(file)}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`View ${fileType} ${fileName}`}
                                                    title={fileName}
                                                    style={{ aspectRatio: '1/1' }}
                                                >
                                                    {fileType === 'image' ? (
                                                        <Image
                                                            src={file}
                                                            alt={`Comment image ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center w-full h-full p-1">
                                                            {getDocumentIcon(file)}
                                                            <P2 className="text-xs text-center mt-1 leading-tight truncate w-full">
                                                                {getFileExtension(file).toUpperCase()}
                                                            </P2>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null;
                            })()}

                            <P2 className="text-sm text-gray-500 mb-0 mt-2">
                                {formatDate(new Date(comment.createdAt), { timeZone: 'America/Los_Angeles' })}
                            </P2>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* File preview modal */}
            <Modal
                open={!!selectedFile}
                onClose={handleCloseModal}
                aria-labelledby="file-preview-modal"
            >
                <Box sx={modalStyle}>
                    {selectedFile && (
                        <>
                            {/* Close button for documents */}
                            {selectedFile.type === 'document' && (
                                <div className="w-full flex justify-between items-center mb-2 px-2">
                                    <P2 className="font-medium truncate mr-4">{selectedFile.name}</P2>
                                    <Button
                                        variant="link"
                                        onClick={handleCloseModal}
                                        className="!p-1 !min-w-0"
                                        aria-label="Close preview"
                                    >
                                        <Close />
                                    </Button>
                                </div>
                            )}
                            
                            {selectedFile.type === 'image' ? (
                                <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                                    <Image
                                        src={selectedFile.url}
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
                            ) : (
                                <div className="w-full h-full flex flex-col">
                                    <iframe
                                        src={selectedFile.url}
                                        className="w-full flex-1 border-0 rounded"
                                        title={`Preview of ${selectedFile.name}`}
                                        onLoad={() => setIsLoading(false)}
                                    />
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <P2 className="text-gray-600">Loading document...</P2>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Fallback link if iframe doesn't work */}
                                    <div className="mt-2 text-center">
                                        <P2 className="text-sm text-gray-600 mb-2">
                                            Document not displaying correctly?
                                        </P2>
                                        <Button
                                            variant="link"
                                            onClick={() => window.open(selectedFile.url, '_blank')}
                                            className="text-sm"
                                        >
                                            Open in new tab
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Box>
            </Modal>
            
            {/* Add comment dialog */}
            <AddCommentDialog 
                open={isAddingComment}
                onClose={() => setIsAddingComment(false)}
                onSubmit={handleAddComment}
                projectId={projectId}
            />

            {/* Auth required dialog */}
            <AuthRequiredDialog
                open={isAuthRequiredOpen}
                onClose={() => setIsAuthRequiredOpen(false)}
                action="add comments"
            />
        </div>
    );
};

export default CommentsList;
