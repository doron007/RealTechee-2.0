/**
 * Projects data service for interacting with CSV data
 */

import path from 'path';
import fs from 'fs';
// Import uuid dynamically to avoid issues with server/client rendering
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectFilter } from '../types/projects';
import { readCsvFile, writeCsvFile } from './csvUtils';

// Define the path to the projects CSV file
const PROJECTS_CSV_PATH = path.join(process.cwd(), 'data', 'csv', 'Projects.csv');

// Default projects data to use if CSV file doesn't exist
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'project-001',
    title: 'Modern Kitchen Renovation',
    description: 'A complete kitchen renovation with high-end appliances and custom cabinetry.',
    category: 'Kitchen',
    location: 'San Francisco CA',
    completionDate: '2024-03-15',
    imageUrl: '/assets/images/hero-bg.png',
    budget: '85000',
    featured: true,
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-03-20T15:30:00Z'
  },
  {
    id: 'project-002',
    title: 'Master Bathroom Remodel',
    description: 'Luxurious bathroom remodel with walk-in shower and heated floors.',
    category: 'Bathroom',
    location: 'Los Angeles CA',
    completionDate: '2024-02-28',
    imageUrl: '/assets/images/hero-bg.png',
    budget: '42000',
    featured: false,
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-03-01T14:45:00Z'
  },
  {
    id: 'project-003',
    title: 'Open Concept Living Room',
    description: 'Created an open concept living space by removing walls and updating finishes.',
    category: 'Living Room',
    location: 'Seattle WA',
    completionDate: '2024-04-10',
    imageUrl: '/assets/images/hero-bg.png',
    budget: '65000',
    featured: true,
    createdAt: '2024-02-05T11:30:00Z',
    updatedAt: '2024-04-15T16:20:00Z'
  }
];

/**
 * Maps a raw CSV project to the format expected by the UI
 */
function mapProjectForUI(project: Project): Project {
  // Extract location from title if possible (format is often "Address, City, State")
  const titleParts = project.Title?.split(',') || [];
  const locationPart = titleParts.length > 1 ? 
    titleParts.slice(1).join(',').trim() : 
    "";

  // For any project coming from the CSV, ensure it has the UI-compatible fields
  return {
    ...project,
    id: project.ID || project.projectID || uuidv4(),
    title: project.Title || "",
    description: project.Description || "",
    imageUrl: project.Image || "/assets/images/hero-bg.png",
    category: project["Property Type"] || "",
    location: locationPart,
    completionDate: project["Created Date"] || "",
    budget: project.Budget || "",
    featured: project.Status === "Completed",
    createdAt: project["Created Date"] || "",
    updatedAt: project["Updated Date"] || ""
  };
}

// Initialize CSV file with default data if it doesn't exist
function initializeProjectsFile(): void {
  try {
    if (!fs.existsSync(PROJECTS_CSV_PATH)) {
      console.log('Projects CSV file not found, creating with default data');
      const dirPath = path.dirname(PROJECTS_CSV_PATH);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      writeCsvFile(PROJECTS_CSV_PATH, DEFAULT_PROJECTS);
    }
  } catch (error) {
    console.error('Error initializing projects file:', error);
  }
}

// Initialize the projects CSV file if it doesn't exist
initializeProjectsFile();

/**
 * Get all projects, with optional filtering
 */
export async function getProjects(filter?: ProjectFilter): Promise<Project[]> {
  try {
    // Initialize if needed (ensures CSV exists before reading)
    initializeProjectsFile();
    const rawProjects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    
    // Map the raw CSV projects to the UI-friendly format
    const projects = rawProjects.map(mapProjectForUI);
    
    if (!filter) {
      return projects;
    }
    
    return projects.filter(project => {
      // Apply category filter if provided
      if (filter.category && project.category !== filter.category) {
        return false;
      }
      
      // Apply location filter if provided
      if (filter.location && project.location && !project.location.includes(filter.location)) {
        return false;
      }
      
      // Apply featured filter if provided
      if (filter.featured !== undefined && 
          project.featured?.toString() !== filter.featured.toString()) {
        return false;
      }
      
      // Apply search filter if provided
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        return (
          (project.title && project.title.toLowerCase().includes(searchTerm)) || 
          (project.description && project.description.toLowerCase().includes(searchTerm)) ||
          (project.category && project.category.toLowerCase().includes(searchTerm)) ||
          (project.location && project.location.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const rawProjects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    const project = rawProjects.find(p => p.ID === id || p.id === id || p.projectID === id);
    return project ? mapProjectForUI(project) : null;
  } catch (error) {
    console.error(`Error fetching project with id ${id}:`, error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const projects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    
    // Create a new project with generated ID and timestamps
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectData,
      id: `project-${uuidv4().substring(0, 8)}`,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to projects and write back to CSV
    projects.push(newProject);
    writeCsvFile(PROJECTS_CSV_PATH, projects);
    
    return newProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const projects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    const projectIndex = projects.findIndex(project => project.id === id);
    
    if (projectIndex === -1) {
      return null;
    }
    
    // Update the project with new data
    const updatedProject: Project = {
      ...projects[projectIndex],
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    
    // Replace the project in the array and write back to CSV
    projects[projectIndex] = updatedProject;
    writeCsvFile(PROJECTS_CSV_PATH, projects);
    
    return updatedProject;
  } catch (error) {
    console.error(`Error updating project with id ${id}:`, error);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const projects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length === projects.length) {
      // No project was removed
      return false;
    }
    
    // Write the filtered projects back to CSV
    writeCsvFile(PROJECTS_CSV_PATH, filteredProjects);
    return true;
  } catch (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    return false;
  }
}

/**
 * Get available project categories
 */
export async function getProjectCategories(): Promise<string[]> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const projects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    
    // Create array of categories, filter unique values
    const categoriesSet = new Set<string>();
    projects.forEach(project => {
      if (project.category) {
        categoriesSet.add(project.category);
      }
    });
    
    return Array.from(categoriesSet);
  } catch (error) {
    console.error('Error fetching project categories:', error);
    return [];
  }
}

/**
 * Get available project locations
 */
export async function getProjectLocations(): Promise<string[]> {
  try {
    // Initialize if needed
    initializeProjectsFile();
    const projects = readCsvFile<Project>(PROJECTS_CSV_PATH);
    
    // Create array of locations, filter unique values
    const locationsSet = new Set<string>();
    projects.forEach(project => {
      if (project.location) {
        locationsSet.add(project.location);
      }
    });
    
    return Array.from(locationsSet);
  } catch (error) {
    console.error('Error fetching project locations:', error);
    return [];
  }
}
