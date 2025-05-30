import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { getProjectById, getProjectMilestones, getProjectPayments, getProjectComments } from '../utils/projectsApi';
import { Project } from '../types/projects';
import { ProjectMilestone, ProjectPayment, ProjectComment } from '../types/projectItems';
import { getProjectGalleryImages } from '../utils/galleryUtils';
import { GalleryImage } from '../components/projects/ProjectImageGallery';
import { generatePropertyDescription } from '../utils/descriptionUtils';

// Import components
import Button from '../components/common/buttons/Button';
import {
  ProjectImageGallery,
  PropertyDetailsCard,
  ProjectDetailsCard,
  AgentInfoCard,
  MilestonesList,
  PaymentList,
  CommentsList,
  ProjectDescriptionSection,
  type Milestone,
  type Payment,
  type Comment,
} from '../components/projects';
import { CollapsibleSection } from '../components/common/ui';
import { ImageGallery } from 'components/common/ui';

// Typography components
import { PageHeader, SectionTitle, BodyContent, CardTitle } from '../components/Typography';

const ProjectDetails: NextPage = () => {
  const router = useRouter();
  const projectIdParam = router.query.projectId;
  const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);

  // Helper function to convert string URLs to GalleryImage objects
  const convertToGalleryImages = (urls: string[]): GalleryImage[] => {
    return urls.map((url, index) => ({
      url,
      alt: `Project image ${index + 1}`,
      description: `` //`Project image ${index + 1}`
    }));
  };

  useEffect(() => {
    // Skip effect if router is not ready
    if (!router.isReady || !projectId) {
      return;
    }

    async function loadProject() {
      setLoading(true);
      setError(null);

      try {
        // Try to get project data from sessionStorage first
        if (typeof window !== 'undefined') {
          try {
            const storedProject = sessionStorage.getItem('currentProject');
            if (storedProject) {
              const parsedProject = JSON.parse(storedProject) as Project;                // Verify it's the project we're looking for
              if (parsedProject.id === projectId) {
                setProject(parsedProject);
                const resolvedImages = await getProjectGalleryImages(parsedProject);
                setGalleryImages(convertToGalleryImages(resolvedImages));
                
                // Fetch milestones and payments
                const [projectMilestones, projectPayments, projectComments] = await Promise.all([
                  getProjectMilestones(parsedProject.projectID || parsedProject.id),
                  getProjectPayments(parsedProject.projectID || parsedProject.id),
                  getProjectComments(parsedProject.projectID || parsedProject.id)
                ]);
                
                setMilestones(projectMilestones);
                setPayments(projectPayments);
                setComments(projectComments);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to retrieve project from sessionStorage:', e);
            // Continue to API fetch if sessionStorage fails
          }
        }

        // If we couldn't get from sessionStorage, fetch from API
        if (projectId && typeof projectId === 'string') {
          try {
            const fetchedProject = await getProjectById(projectId);

            if (fetchedProject) {
              setProject(fetchedProject);
              try {
                // Fetch all data in parallel
                const projectIdForItems = fetchedProject.projectID || fetchedProject.id;
                console.log('Fetching data for project:', projectIdForItems);
                
                const [images, projectMilestones, projectPayments, projectComments] = await Promise.all([
                  getProjectGalleryImages(fetchedProject),
                  getProjectMilestones(projectIdForItems),
                  getProjectPayments(projectIdForItems),
                  getProjectComments(projectIdForItems)
                ]);

                console.log('Fetched comments:', projectComments);

                // Handle images
                if (!images || images.length === 0) {
                  console.warn('No gallery images found for project, using placeholder.');
                  setGalleryImages([{
                    url: '/assets/images/hero-bg.png',
                    alt: 'Project placeholder image',
                    description: 'No images available'
                  }]);
                } else {
                  setGalleryImages(convertToGalleryImages(images));
                }

                // Set milestones, payments and comments
                setMilestones(projectMilestones);
                setPayments(projectPayments);
                setComments(projectComments);
                
                console.log('Set comments:', projectComments);

              } catch (error) {
                console.error('Error loading project data:', error);
                setGalleryImages([{
                  url: '/assets/images/hero-bg.png',
                  alt: 'Project placeholder image',
                  description: 'Error loading images'
                }]);
              }
            } else {
              setError('Project not found. It may have been removed or the ID is invalid.');
            }
          } catch (error) {
            console.error('Error fetching project from API:', error);
            setError('Failed to fetch project details. Please try again later.');
          }
        } else {
          setError('No project selected. Please return to the projects page and select a project.');
        }
      } catch (err) {
        console.error('Error loading project details:', err);
        setError('Failed to load project details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    // Use a timeout to avoid immediate loading which can interfere with debugging
    const loadTimeout = setTimeout(() => {
      try {
        loadProject();
      } catch (error) {
        console.error('Uncaught error in loadProject:', error);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
      }
    }, 100);

    // Clean up function
    return () => {
      clearTimeout(loadTimeout);
    };
  }, [projectId, router.isReady]);

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
                {comments.length > 0 ? (
                  <CommentsList commentsData={comments} />
                ) : (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <BodyContent className="text-gray-500 text-center">No comments yet</BodyContent>
                  </div>
                )}
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