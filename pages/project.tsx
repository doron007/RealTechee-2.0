import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useProjectData } from '../hooks';
import { Comment } from '../components/projects/CommentsList';
import { getProjectGalleryImages } from '../utils/galleryUtils';
import { GalleryImage } from '../components/projects/ProjectImageGallery';
import { generatePropertyDescription } from '../utils/descriptionUtils';

// Import components
import Button from '../components/common/buttons/Button';
import {
  PropertyDetailsCard,
  ProjectDetailsCard,
  AgentInfoCard,
  MilestonesList,
  PaymentList,
  CommentsList,
  ProjectDescriptionSection,
} from '../components/projects';
// import { ImageGallery } from 'components/common/ui';
import ProjectImageGalleryMUI from '../components/projects/ProjectImageGalleryMUI';

const ProjectDetails: NextPage = () => {
  const router = useRouter();
  const projectIdParam = router.query.projectId;
  const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;

  // Extract projectId from URL - wait for router to be ready
  const currentProjectId = useMemo(() => {
    // First priority: router query param (after router is ready)
    if (router.isReady && projectId) {
      return projectId;
    }
    
    // Second priority: manual URL parsing (client-side only)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      return urlProjectId || undefined;
    }
    
    return undefined;
  }, [router.isReady, projectId]);

  // Detect if this is a direct URL access or page refresh
  // Only force refresh if there's no sessionStorage data for this project
  const isDirectAccess = useMemo(() => {
    if (typeof window === 'undefined') return true;
    
    try {
      const storedProject = sessionStorage.getItem('currentProject');
      if (storedProject) {
        const parsedProject = JSON.parse(storedProject);
        // If we have stored data for this project, don't force refresh
        return parsedProject.id !== currentProjectId;
      }
      return true; // No stored data, force refresh
    } catch (e) {
      return true; // Error reading sessionStorage, force refresh
    }
  }, [currentProjectId]);

  // Use the reusable project data hook - only when we have a projectId
  const { project, milestones, payments, comments: initialComments, loading, error } = useProjectData({
    projectId: currentProjectId,
    loadFromSessionStorage: true,
    forceRefresh: isDirectAccess // Force fresh data on direct access/refresh
  });
  
  // Show loading if router is not ready yet or if we're loading data
  const isLoading = !router.isReady || loading;

  // Local state for comments to handle real-time updates
  const [comments, setComments] = useState<Comment[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Update local comments when initial comments are loaded
  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  // Helper function to convert string URLs to GalleryImage objects
  const convertToGalleryImages = (urls: string[]): GalleryImage[] => {
    return urls.map((url, index) => ({
      url,
      alt: `Project image ${index + 1}`,
      description: `` //`Project image ${index + 1}`
    }));
  };

  // Load gallery images when project data is available
  useEffect(() => {
    async function loadGalleryImages() {
      if (!project) {
        return;
      }

      try {
        // With the latest data migration, URLs should already be public URLs
        // getProjectGalleryImages handles both legacy Wix URLs (with fallback conversion) and public URLs
        const resolvedImages = await getProjectGalleryImages(project);
        
        if (!resolvedImages || resolvedImages.length === 0) {
          console.warn('No gallery images found for project, using placeholder.');
          setGalleryImages([{
            url: '/assets/images/hero-bg.png',
            alt: 'Project placeholder image',
            description: 'No images available'
          }]);
        } else {
          setGalleryImages(convertToGalleryImages(resolvedImages));
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        setGalleryImages([{
          url: '/assets/images/hero-bg.png',
          alt: 'Project placeholder image',
          description: 'Error loading images'
        }]);
      }
    }

    loadGalleryImages();
  }, [project]);

  // Handler for adding new comments using Amplify API
  const handleCommentAdded = async (newComment: Comment) => {
    // Add the new comment to local state so it appears immediately
    setComments(prevComments => [newComment, ...prevComments]);
    console.log('New comment added:', newComment);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{project ? `${project.title} | RealTechee` : 'Project Details | RealTechee'}</title>
        <meta
          name="description"
          content={project ? `View details for ${project.title}` : 'Project details page for RealTechee projects'}
        />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        {/* Loading State - show while router is not ready or data is loading */}
        {isLoading && (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="animate-pulse text-gray-500 text-lg">
              {!router.isReady ? 'Initializing...' : 'Loading project details...'}
            </div>
          </div>
        )}

        {/* Error State - only show when router is ready */}
        {router.isReady && !loading && error && (
          <div className="container mx-auto px-4 py-16 flex flex-col items-center">
            <div className="text-amber-600 text-lg mb-6">{error}</div>
            <Button
              variant="primary"
              onClick={() => router.push('/projects')}
            >
              Return to Projects
            </Button>
          </div>
        )}

        {/* Project Details - only show when router is ready */}
        {router.isReady && !loading && !error && project && (
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column (60%) */}
              <div className="lg:col-span-3">
                {/* Image Slideshow */}
                <ProjectImageGalleryMUI images={galleryImages} />

                {/* Project Description */}
                <ProjectDescriptionSection description={project.description || generatePropertyDescription(project)} />

                {/* Milestones List */}
                <MilestonesList milestones={milestones} />

                {/* Payment Schedule */}
                <PaymentList payments={payments} />

                {/* Project Comments */}
                <CommentsList 
                  commentsData={comments} 
                  projectId={project.id}
                  projectData={project}
                  onCommentAdded={handleCommentAdded} 
                />
              </div>

              {/* Right Column (40%) */}
              <div className="lg:col-span-2">
                {/* Property Details */}
                <PropertyDetailsCard project={project} />

                {/* Project Details */}
                <ProjectDetailsCard project={project} />

                {/* Agent Information */}
                <AgentInfoCard project={project} />
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button
                variant="secondary"
                onClick={() => router.push('/projects')}
              >
                Back to Projects
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;