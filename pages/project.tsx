import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { getProjectById } from '../utils/projectsApi';
import { Project } from '../types/projects';
import { HeroSectionDetail } from '../components/projects';
import { convertWixMediaUrl, isWixMediaUrl } from '../utils/wixMediaUtils';

// Import components using direct imports to avoid naming conflicts
import Button from '../components/common/buttons/Button';
import Card from '../components/common/ui/Card';
import StatusPill from '../components/common/ui/StatusPill';
import Layout from '../components/common/layout/Layout';
import Section from '../components/common/layout/Section';
import ContentWrapper from '../components/common/layout/ContentWrapper';
import ContainerTwoColumns from '../components/common/layout/ContainerTwoColumns';

// Typography components
import { 
  PageHeader, 
  SectionTitle, 
  Subtitle, 
  SectionLabel, 
  BodyContent, 
  SubContent, 
  CardTitle, 
  CardContent 
} from '../components/Typography';

// Import typography components
import { 
  PageHeader,
  SectionTitle,
  Subtitle,
  SectionLabel,
  BodyContent,
  SubContent,
  CardTitle,
  CardContent
} from '../components';

// Import UI and layout components directly
import Button from '../components/common/buttons/Button';
import Card from '../components/common/ui/Card';
import StatusPill from '../components/common/ui/StatusPill';
import Layout from '../components/common/layout/Layout';
import Section from '../components/common/layout/Section';
import ContentWrapper from '../components/common/layout/ContentWrapper';
import ContainerTwoColumns from '../components/common/layout/ContainerTwoColumns';

// Import typography components
import { 
  PageHeader,
  SectionTitle,
  Subtitle,
  SectionLabel,
  BodyContent,
  SubContent,
  CardTitle,
  CardContent
} from '../components';

// Import UI and layout components from CommonComponents
import { 
  Button, 
  Card,
  StatusPill
} from '../components/common/ui';

import {
  Layout,
  Section,
  ContentWrapper,
  ContainerTwoColumns
} from '../components/common/layout';
import { 
  Layout,
  Section,
  ContentWrapper,
  ContainerTwoColumns,
  Button,
  Card,
  PageHeader,
  SectionTitle,
  Subtitle,
  SectionLabel,
  BodyContent,
  SubContent
} from '../components';

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
        {!loading && !error && project && (
          <div className="bg-gray-50 py-8 border-b border-gray-200">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{project.title}</h1>
            </div>
          </div>
        )}
        
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column (60%) */}
              <div className="lg:col-span-3">
                {/* Image Slideshow Placeholder */}
                <div className="bg-gray-200 rounded-lg h-96 mb-8 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-600">Slideshow will be implemented here</p>
                  </div>
                  {/* Prev/Next Buttons */}
                  <button className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow">
                    <span className="text-gray-700">&lt;</span>
                  </button>
                  <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow">
                    <span className="text-gray-700">&gt;</span>
                  </button>
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="h-16 w-16 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
                
                {/* Project Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Project Description</h2>
                  <div className="prose max-w-none">
                    <p>{project.description || 'No description available for this project.'}</p>
                  </div>
                </div>
                
                {/* Milestones (Collapsible) */}
                <div className="mb-8 border rounded-lg overflow-hidden">
                  <button className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                    <h2 className="text-xl font-semibold">Milestones</h2>
                    <span>▼</span>
                  </button>
                  <div className="p-4">
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Design Phase</span>
                        <span className="text-green-600">Completed</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Foundation Work</span>
                        <span className="text-green-600">Completed</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Framing</span>
                        <span className="text-blue-600">In Progress</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Electrical & Plumbing</span>
                        <span className="text-gray-400">Pending</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Finishing</span>
                        <span className="text-gray-400">Pending</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Payment Schedule (Collapsible) */}
                <div className="mb-8 border rounded-lg overflow-hidden">
                  <button className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                    <h2 className="text-xl font-semibold">Payment Schedule</h2>
                    <span>▼</span>
                  </button>
                  <div className="p-4">
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Initial Deposit (25%)</span>
                        <span className="text-green-600">Paid</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Foundation Complete (15%)</span>
                        <span className="text-green-600">Paid</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Framing Complete (20%)</span>
                        <span className="text-blue-600">Due June 15, 2025</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Utilities Installed (15%)</span>
                        <span className="text-gray-400">TBD</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Final Payment (25%)</span>
                        <span className="text-gray-400">TBD</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Right Column (40%) */}
              <div className="lg:col-span-2">
                {/* Property Details */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Property Details</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <dt className="text-gray-600">Address:</dt>
                    <dd className="font-medium">{project.address || '123 Main St'}</dd>
                    
                    <dt className="text-gray-600">Property Type:</dt>
                    <dd className="font-medium">{project.propertyType || 'Single Family'}</dd>
                    
                    <dt className="text-gray-600">Year Built:</dt>
                    <dd className="font-medium">{project.yearBuilt || '2020'}</dd>
                    
                    <dt className="text-gray-600">Bedrooms:</dt>
                    <dd className="font-medium">{project.bedrooms || '4'}</dd>
                    
                    <dt className="text-gray-600">Bathrooms:</dt>
                    <dd className="font-medium">{project.bathrooms || '3'}</dd>
                    
                    <dt className="text-gray-600">Stories:</dt>
                    <dd className="font-medium">{project.stories || '2'}</dd>
                    
                    <dt className="text-gray-600">Square Feet:</dt>
                    <dd className="font-medium">{project.squareFeet || '2,500'}</dd>
                  </dl>
                  
                  {/* External Links */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <a 
                      href="#" 
                      className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      View on Zillow
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      View on Redfin
                    </a>
                  </div>
                </div>
                
                {/* Project Details */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Project Details</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <dt className="text-gray-600">Status:</dt>
                    <dd>
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        In Progress
                      </span>
                    </dd>
                    
                    <dt className="text-gray-600">Original Price:</dt>
                    <dd className="font-medium">${project.originalPrice || '850,000'}</dd>
                    
                    <dt className="text-gray-600">Boost Price:</dt>
                    <dd className="font-medium">${project.boostPrice || '150,000'}</dd>
                    
                    <dt className="text-gray-600">Value Added:</dt>
                    <dd className="font-medium text-green-600">${project.valueAdded || '300,000'}</dd>
                  </dl>
                </div>
                
                {/* Agent Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Agent Information</h2>
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300 mr-4"></div>
                    <div>
                      <h3 className="font-semibold text-lg">{project.agentName || 'John Smith'}</h3>
                      <p className="text-gray-600 text-sm">Real Estate Specialist</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-y-2">
                    <dt className="text-gray-600">Phone:</dt>
                    <dd className="font-medium">{project.agentPhone || '(123) 456-7890'}</dd>
                    
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium">{project.agentEmail || 'agent@realtechee.com'}</dd>
                  </dl>
                  
                  <button className="w-full mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors">
                    Contact Agent
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <button 
                onClick={() => router.push('/projects')}
                className="bg-secondary text-gray-800 py-2 px-6 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;
