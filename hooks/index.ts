// Reusable hooks for Amplify data management
// These hooks provide consistent patterns for data loading, error handling, and state management

export { useProjectData } from './useProjectData';
export { useAmplifyData, usePaginatedAmplifyData } from './useAmplifyData';
export { useListData } from './useListData';
export { useCommentsData } from './useCommentsData';

// Form-related hooks
export { useFormFocus } from './useFormFocus';
export { useFormSubmission } from './useFormSubmission';

export type { 
  ProjectDataState, 
  UseProjectDataOptions 
} from './useProjectData';

export type { 
  AmplifyDataState, 
  UseAmplifyDataOptions,
  PaginatedDataState,
  UsePaginatedAmplifyDataOptions 
} from './useAmplifyData';

export type { 
  ListDataState, 
  ListFilter, 
  UseListDataOptions 
} from './useListData';

// Form hook types
export type { FormFieldRef, UseFormFocusOptions } from './useFormFocus';
export type { SubmissionStatus, UseFormSubmissionOptions } from './useFormSubmission';