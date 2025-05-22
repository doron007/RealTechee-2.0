import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { getProjectById } from '../utils/projectsApi';
import { Project } from '../types/projects';
import { HeroSectionDetail } from '../components/projects';
import { convertWixMediaUrl, isWixMediaUrl } from '../utils/wixMediaUtils';

const ProjectDetails: NextPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip effect if router is not ready yet
    if (!router.isReady) return;
    
    // Define async function
    async function loadProject() {
      setLoading(true);
      setError(null);

      try {
        // First, try to get project data from sessionStorage
        if (typeof window !== 'undefined') {
          try {
            const storedProject = sessionStorage.getItem('currentProject');
            if (storedProject) {
              const parsedProject = JSON.parse(storedProject) as Project;
              
              // Verify it's the project we're looking for
              if (parsedProject.id === projectId) {
                setProject(parsedProject);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to retrieve project from sessionStorage:', e);
            // Continue to API fetch if sessionStorage fails
          }
        }

        // If we have a projectId but no data (or parsing failed), fetch from API
        if (projectId && typeof projectId === 'string') {
          const fetchedProject = await getProjectById(projectId);
          
          if (fetchedProject) {
            setProject(fetchedProject);
          } else {
            setError('Project not found. It may have been removed or the ID is invalid.');
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

    if (router.isReady) {
      // Use a timeout to avoid immediate loading which can interfere with debugging
      const loadTimeout = setTimeout(() => {
        loadProject();
      }, 100);
      
      // Clean up function
      return () => {
        clearTimeout(loadTimeout);
        // Any other cleanup needed
      };
    }
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
        {/* Hero Section */}
        <HeroSectionDetail title={project?.title || 'Project Details'} />
        
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
            <button 
              onClick={() => router.push('/projects')}
              className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
            >
              Return to Projects
            </button>
          </div>
        )}

        {/* Project Details */}
        {!loading && !error && project && (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-8 border-b pb-4">Project Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(project).map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <div className="appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-50">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value?.toString() || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-between">
                <button 
                  onClick={() => router.push('/projects')}
                  className="bg-secondary text-gray-800 py-2 px-6 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;
