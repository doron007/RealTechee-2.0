// Generated TypeScript model for ProjectComments
// Source: ProjectComments.csv (240 records)

export interface ProjectComments {
  postedByContactId?: string;
  nickname?: string;
  projectId?: number;
  files?: string;
  comment?: string;
  isPrivate?: boolean;
  postedByProfileImage?: string;
  addToGallery?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface CreateProjectCommentsInput {
  postedByContactId?: string;
  nickname?: string;
  projectId?: number;
  files?: string;
  comment?: string;
  isPrivate?: boolean;
  postedByProfileImage?: string;
  addToGallery?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface UpdateProjectCommentsInput {
  ID: string;
  postedByContactId?: string;
  nickname?: string;
  projectId?: number;
  files?: string;
  comment?: string;
  isPrivate?: boolean;
  postedByProfileImage?: string;
  addToGallery?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}