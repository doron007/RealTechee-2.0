// Generated TypeScript model for ProjectPermissions
// Source: ProjectPermissions.csv (68 records)

export interface ProjectPermissions {
  createdDate?: string;
  updatedDate?: string;
  projectId?: number;
  ID: string;
  owner?: string;
  na?: string;
  permissions?: boolean;
}

export interface CreateProjectPermissionsInput {
  createdDate?: string;
  updatedDate?: string;
  projectId?: number;
  ID: string;
  owner?: string;
  na?: string;
  permissions?: boolean;
}

export interface UpdateProjectPermissionsInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  projectId?: number;
  owner?: string;
  na?: string;
  permissions?: boolean;
}