// Generated TypeScript model for ProjectMilestones
// Source: ProjectMilestones.csv (142 records)

export interface ProjectMilestones {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  description?: string;
  projectId?: number;
  order?: number;
  isComplete?: boolean;
  estimatedStart?: string;
  estimatedFinish?: boolean;
  isCategory?: boolean;
  isInternal?: boolean;
}

export interface CreateProjectMilestonesInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  description?: string;
  projectId?: number;
  order?: number;
  isComplete?: boolean;
  estimatedStart?: string;
  estimatedFinish?: boolean;
  isCategory?: boolean;
  isInternal?: boolean;
}

export interface UpdateProjectMilestonesInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  description?: string;
  projectId?: number;
  order?: number;
  isComplete?: boolean;
  estimatedStart?: string;
  estimatedFinish?: boolean;
  isCategory?: boolean;
  isInternal?: boolean;
}