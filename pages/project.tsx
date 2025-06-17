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
import { ImageGallery } from 'components/common/ui';

const ProjectDetails: NextPage = () => {
  const router = useRouter();
  const projectIdParam = router.query.projectId;
  const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;

  // Extract projectId from URL if router.query is not ready yet
  const getProjectIdFromUrl = (): string | undefined => {
    if (projectId) {
      return projectId;
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      return urlProjectId || undefined; // Convert null to undefined
    }
    return undefined;
  };

  const currentProjectId = getProjectIdFromUrl();

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

  // Use the reusable project data hook
  const { project, milestones, payments, comments, loading, error } = useProjectData({
    projectId: currentProjectId,
    loadFromSessionStorage: true,
    forceRefresh: isDirectAccess // Force fresh data on direct access/refresh
  });

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

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
    // The CommentsList component handles local state updates
    // and the hook will refresh data on the next page load
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
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        {/* Loading State */}
        {loading && (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="animate-pulse text-gray-500 text-lg">Loading project details...</div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
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

        {/* Project Details */}
        {!loading && !error && project && (
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column (60%) */}
              <div className="lg:col-span-3">
                {/* Image Slideshow */}
                <ImageGallery images={galleryImages} />

                {/* Project Description */}
                <ProjectDescriptionSection description={project.description || generatePropertyDescription(project)} />

                {/* Milestones List */}
                <MilestonesList milestones={milestones} />

                {/* Payment Schedule */}
                <PaymentList payments={payments} />

                {/* Project Comments */}
                <CommentsList 
                  commentsData={comments} 
                  projectId={project.projectID || project.id} 
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