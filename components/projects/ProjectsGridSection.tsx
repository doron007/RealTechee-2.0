import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Section } from '../common/layout';
import Button from '../common/buttons/Button';
import ProjectCard from './ProjectCard';
import { optimizedProjectsAPI } from '../../utils/amplifyAPI';
import { Project, ProjectFilter } from '../../types/projects';
import { createLogger } from '../../utils/logger';
import { useProjectImagePreload } from '../../hooks/useImagePreload';

// No need for fallback data - we'll use the CSV data from projectsService

interface ProjectsGridSectionProps {
  className?: string;
  projectsPerPage?: number;
  filter?: ProjectFilter;
}

const logger = createLogger('ProjectsGridSection');

export default function ProjectsGridSection({
  className = '',
  projectsPerPage = 6,
  filter
}: ProjectsGridSectionProps) {
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [enrichedProjects, setEnrichedProjects] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Three-tier loading strategy for UPL optimization
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError('');

        // Tier 1: Load essential card data immediately
        const amplifyFilter = {
          category: filter?.category,
          location: filter?.location,
          status: filter?.status,
          featured: filter?.featured,
          search: filter?.search,
          includeArchived: filter?.includeArchived
        };

        const result = await optimizedProjectsAPI.loadProjectCards(
          amplifyFilter, 
          1000 // Get all filtered projects for client-side pagination
        );

        if (result.success && result.data) {
          // Convert Amplify data to Project format (mapping Amplify fields to CSV field names)
          const mappedProjects = result.data.map((amplifyProject: any) => ({
            // Map Amplify fields to Project interface
            id: amplifyProject.id,
            title: amplifyProject.title || '',
            description: amplifyProject.description || '',
            imageUrl: amplifyProject.image || '',
            category: amplifyProject.status || '',
            location: '', // Will be filled from address relationship
            completionDate: amplifyProject.updatedAt || amplifyProject.createdAt || '',
            budget: amplifyProject.budget || '',
            featured: amplifyProject.status === 'Completed',
            createdAt: amplifyProject.createdAt || '',
            updatedAt: amplifyProject.updatedAt || '',
            
            // Map Amplify field names to CSV field names for ProjectCard compatibility
            'Status': amplifyProject.status,
            'Bedrooms': amplifyProject.bedrooms || 0,
            'Bathrooms': amplifyProject.bathrooms || 0,
            'Floors': amplifyProject.floors || 0,
            'Size Sqft.': amplifyProject.sizeSqft || 0,
            'Added value': amplifyProject.addedValue || 0,
            'Booster Estimated Cost': amplifyProject.boosterEstimatedCost || 0,
            'Boost Price': amplifyProject.boostPrice || 0,
            'Sale Price': amplifyProject.salePrice || 0,
            
            // Keep original Amplify data
            ...amplifyProject
          }));

          setProjects(mappedProjects);

          // Tier 2: Load related data in background for first page only (optimization)
          if (mappedProjects.length > 0) {
            setBackgroundLoading(true);
            // Only background load first page to optimize initial UPL
            const firstPageProjects = mappedProjects.slice(0, projectsPerPage);
            const projectIds = firstPageProjects.map((p: Project) => p.id);
            
            optimizedProjectsAPI.loadProjectsWithRelations(projectIds)
              .then(enrichedData => {
                setEnrichedProjects(enrichedData);
                setBackgroundLoading(false);
              })
              .catch(err => {
                logger.warn('Background loading failed', err);
                setBackgroundLoading(false);
              });
          }
        } else {
          setProjects([]);
          setError('No projects found matching your criteria.');
        }
      } catch (err) {
        logger.error('Error fetching projects', err);
        setProjects([]);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [filter, projectsPerPage]);

  // Calculate total number of pages
  const totalProjects = projects.length;
  const totalPages = Math.ceil(totalProjects / projectsPerPage);

  // Get current projects for this page
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  // Preload critical images for better perceived performance
  useProjectImagePreload(currentProjects, 3);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const router = useRouter();
  
  // Handle project card click with optimized data loading
  const handleProjectClick = async (projectId: string) => {
    try {
      logger.debug('Handling project click', { 
        projectId,
        enrichedProjectsAvailable: Array.from(enrichedProjects.keys())
      });
      
      // Check if we have enriched data already loaded
      let projectData = enrichedProjects.get(projectId);
      logger.debug('Enriched data check', { hasEnrichedData: !!projectData });
      
      if (!projectData) {
        logger.info('Loading project data from API', { projectId });
        // Tier 3: Load full project data with all related information
        const projectResult = await optimizedProjectsAPI.loadFullProject(projectId);
        
        if (projectResult.success && projectResult.data) {
          // Use the project id for related data lookups
          const projectIdForRelatedData = projectResult.data.id;
          logger.debug('Using project id for related data', { projectIdForRelatedData });
          
          const [milestonesResult, paymentsResult, commentsResult] = await Promise.all([
            optimizedProjectsAPI.getProjectMilestones(projectIdForRelatedData),
            optimizedProjectsAPI.getProjectPaymentTerms(projectIdForRelatedData),
            optimizedProjectsAPI.getProjectComments(projectIdForRelatedData)
          ]);

          logger.debug('API Results loaded', {
            project: projectResult.success,
            milestones: milestonesResult.success ? milestonesResult.data?.length : 'failed',
            payments: paymentsResult.success ? paymentsResult.data?.length : 'failed',
            comments: commentsResult.success ? commentsResult.data?.length : 'failed'
          });

          projectData = {
            ...projectResult.data,
            // Include all related data for instant loading on project page
            milestones: milestonesResult.success ? milestonesResult.data : [],
            payments: paymentsResult.success ? paymentsResult.data : [],
            comments: commentsResult.success ? commentsResult.data : []
          };
          logger.debug('Complete project data prepared', {
            id: projectData.id,
            hasMilestones: projectData.milestones?.length > 0,
            hasPayments: projectData.payments?.length > 0,
            hasComments: projectData.comments?.length > 0
          });
        }
      }

      if (projectData) {
        // Store complete project data with all related information in sessionStorage
        logger.info('Storing complete project data in sessionStorage', { projectId });
        sessionStorage.setItem('currentProject', JSON.stringify(projectData));
      }

      // Navigate to project page
      router.push({
        pathname: '/project',
        query: { projectId }
      });
    } catch (err) {
      logger.error('Failed to load project details', err);
      // Fallback to simple navigation
      router.push({
        pathname: '/project',
        query: { projectId }
      });
    }
  };

  return (
    <Section
      id="projects-grid"
      className={`${className}`}
      backgroundColor="#F6F6F6"
      spacing="none"
      constrained={false}
      marginTop={0}
      marginBottom={0}
      paddingTop={{ default: 50, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
    >
      {error && (
        <div className="w-full text-center mb-10">
          <div className="mt-4 text-amber-600 text-sm">{error}</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="w-full flex justify-center items-center py-16">
          <div className="animate-pulse text-gray-500">Loading projects...</div>
        </div>
      )}

      {/* Background Loading Indicator */}
      {backgroundLoading && !loading && (
        <div className="w-full text-center mb-4">
          <div className="text-blue-500 text-sm">Loading enhanced details...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="w-full flex justify-center items-center py-16">
          <div className="text-gray-500 text-center">
            <p className="text-xl mb-2">No projects found</p>
            <p className="text-base">Try adjusting your filters or check back later for new projects.</p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {currentProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
              // Priority loading for first 3 images (above fold)
              priority={index < 3 && currentPage === 1}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 gap-4">
          <Button
            variant="secondary"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="text-gray-600">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            variant="secondary"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Section>
  );
}
