import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Section } from '../common/layout';
import Button from '../common/buttons/Button';
import { SectionTitle, SubContent } from '../Typography';
import ProjectCard from './ProjectCard';
import { getProjects } from '../../utils/projectsApi';
import { Project, ProjectFilter } from '../../types/projects';

// No need for fallback data - we'll use the CSV data from projectsService

interface ProjectsGridSectionProps {
  title?: string;
  className?: string;
  projectsPerPage?: number;
  filter?: ProjectFilter;
}

export default function ProjectsGridSection({
  title = 'Our Recent Projects',
  className = '',
  projectsPerPage = 6,
  filter
}: ProjectsGridSectionProps) {
  // console.log('ProjectsGridSection component rendered');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch projects from API
  useEffect(() => {
    // console.log('ProjectsGridSection useEffect triggered', { filter });

    async function fetchProjects() {
      try {
        // console.log('fetchProjects function called');
        setLoading(true);
        const fetchedProjects = await getProjects(filter);
        // console.log('API response:', fetchedProjects);

        // If API returns projects, use them
        if (fetchedProjects && fetchedProjects.length > 0) {
          setProjects(fetchedProjects);
          setError('');
        } else {
          // console.log('No projects returned from API');
          setProjects([]);
          setError('No projects found matching your criteria.');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [filter]);

  // Calculate total number of pages
  const totalProjects = projects.length;
  const totalPages = Math.ceil(totalProjects / projectsPerPage);

  // Get current projects for this page
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

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
  
  // Handle project card click
  const handleProjectClick = (projectId: string) => {
    // Find the project details from our loaded projects
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Store project data in sessionStorage instead of passing via URL
      // This is cleaner, more efficient, and avoids URL length limitations
      try {
        sessionStorage.setItem('currentProject', JSON.stringify(project));
        // Just navigate with the ID
        router.push({
          pathname: '/project',
          query: { projectId }
        });
      } catch (err) {
        console.error('Failed to store project in sessionStorage:', err);
        // Fallback to simple navigation if sessionStorage fails
        router.push({
          pathname: '/project',
          query: { projectId }
        });
      }
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
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
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
