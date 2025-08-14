import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Section } from '../common/layout';
import Button from '../common/buttons/Button';
import ProjectCard from './ProjectCard';
import { optimizedProjectsAPI } from '../../utils/amplifyAPI';
import { Project, ProjectFilter } from '../../types/projects';
import { createLogger } from '../../utils/logger';
import { useProjectImagePreload } from '../../hooks/useImagePreload';
import { enhancedProjectsService } from '../../services/enhancedProjectsService';

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

        // Unified read: Single GraphQL query with nested relations
        const result = await enhancedProjectsService.getFullyEnhancedProjects();

        if (result.success && result.data) {
          // Apply client-side filters (match previous behavior)
          const filtered = result.data.filter((p: any) => {
            if (!p) return false;
            if (!filter?.includeArchived && p.status === 'Archived') return false;
            if (filter?.category && p.status !== filter.category) return false;
            if (filter?.status && p.status !== filter.status) return false;
            if (filter?.featured !== undefined && (p.status === 'Completed') !== filter.featured) return false;
            if (filter?.search) {
              const s = filter.search.toLowerCase();
              return (
                (p.title && p.title.toLowerCase().includes(s)) ||
                (p.description && p.description.toLowerCase().includes(s)) ||
                (p.status && p.status.toLowerCase().includes(s))
              );
            }
            return true;
          });

          // Map to Project interface consumed by ProjectCard
          const mappedProjects: Project[] = filtered.map((ep: any) => ({
            id: ep.id,
            // Prefer propertyAddress for display; fallback to title
            title: ep.propertyAddress || ep.title || '',
            description: ep.description || '',
            imageUrl: ep.image || '',
            category: ep.status || '',
            location: '',
            completionDate: ep.updatedDate || ep.createdDate || ep.createdAt || '',
            budget: ep.budget || '',
            featured: ep.status === 'Completed',
            createdAt: ep.createdAt || '',
            updatedAt: ep.updatedDate || ep.createdAt || '',
            status: ep.status,
            bedrooms: ep.bedrooms ? Number(ep.bedrooms) : 0,
            bathrooms: ep.bathrooms ? Number(ep.bathrooms) : 0,
            floors: ep.floors ? Number(ep.floors) : 0,
            sizeSqft: ep.sizeSqft ? Number(ep.sizeSqft) : 0,
            addedValue: ep.addedValue,
            boosterEstimatedCost: ep.boosterEstimatedCost,
            boostPrice: ep.boostPrice,
            salePrice: ep.salePrice
          }));

          setProjects(mappedProjects);

          // Seed enriched map for first page for snappy detail navigation
          const firstPageProjects = result.data.slice(0, projectsPerPage);
          const map = new Map<string, any>();
          firstPageProjects.forEach((p: any) => map.set(p.id, p));
          setEnrichedProjects(map);
          setBackgroundLoading(false);
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
