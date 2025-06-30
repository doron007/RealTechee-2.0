import { UserService, type UserRole } from './userService';

// Role hierarchy - higher roles inherit permissions from lower roles
const ROLE_HIERARCHY: { [key in UserRole]: number } = {
  guest: 0,
  homeowner: 1,
  provider: 2,
  agent: 3,
  srm: 4,
  accounting: 5,
  admin: 6,
  super_admin: 7
};

// Permission groups
export const PERMISSIONS = {
  // Public access
  VIEW_PUBLIC_PAGES: 'view_public_pages',
  SUBMIT_FORMS: 'submit_forms',
  
  // User account
  MANAGE_OWN_PROFILE: 'manage_own_profile',
  VIEW_OWN_NOTIFICATIONS: 'view_own_notifications',
  
  // Contact/Client permissions
  VIEW_OWN_PROJECTS: 'view_own_projects',
  SUBMIT_ESTIMATES: 'submit_estimates',
  
  // Agent permissions
  VIEW_ASSIGNED_PROJECTS: 'view_assigned_projects',
  MANAGE_CLIENT_COMMUNICATIONS: 'manage_client_communications',
  
  // Back office permissions
  VIEW_ALL_PROJECTS: 'view_all_projects',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  
  // Admin permissions
  FULL_SYSTEM_ACCESS: 'full_system_access'
} as const;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions mapping
const ROLE_PERMISSIONS: { [key in UserRole]: Permission[] } = {
  guest: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS
  ],
  homeowner: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.SUBMIT_ESTIMATES
  ],
  provider: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS
  ],
  agent: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.SUBMIT_ESTIMATES,
    PERMISSIONS.VIEW_ASSIGNED_PROJECTS,
    PERMISSIONS.MANAGE_CLIENT_COMMUNICATIONS
  ],
  srm: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.VIEW_ASSIGNED_PROJECTS,
    PERMISSIONS.MANAGE_CLIENT_COMMUNICATIONS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.VIEW_REPORTS
  ],
  accounting: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.VIEW_REPORTS
  ],
  admin: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.SUBMIT_ESTIMATES,
    PERMISSIONS.VIEW_ASSIGNED_PROJECTS,
    PERMISSIONS.MANAGE_CLIENT_COMMUNICATIONS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.FULL_SYSTEM_ACCESS
  ],
  super_admin: [
    PERMISSIONS.VIEW_PUBLIC_PAGES,
    PERMISSIONS.SUBMIT_FORMS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.SUBMIT_ESTIMATES,
    PERMISSIONS.VIEW_ASSIGNED_PROJECTS,
    PERMISSIONS.MANAGE_CLIENT_COMMUNICATIONS,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.FULL_SYSTEM_ACCESS
  ]
};

export class AuthorizationService {
  
  /**
   * Check if current user has a specific permission
   */
  static async hasPermission(permission: Permission): Promise<boolean> {
    try {
      const userProfile = await UserService.getUserProfile();
      if (!userProfile || !userProfile.role) {
        // Default to guest permissions if no role set
        return ROLE_PERMISSIONS.guest.includes(permission);
      }

      const userPermissions = ROLE_PERMISSIONS[userProfile.role] || ROLE_PERMISSIONS.guest;
      return userPermissions.includes(permission);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  /**
   * Check if current user has any of the specified permissions
   */
  static async hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (await this.hasPermission(permission)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Check if current user has all of the specified permissions
   */
  static async hasAllPermissions(permissions: Permission[]): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (!(await this.hasPermission(permission))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Check if current user has minimum role level
   */
  static async hasMinimumRole(minRole: UserRole): Promise<boolean> {
    try {
      const userProfile = await UserService.getUserProfile();
      const userRole = userProfile?.role || 'guest';
      
      return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
    } catch (error) {
      console.error('Failed to check role:', error);
      return false;
    }
  }

  /**
   * Get all permissions for current user
   */
  static async getUserPermissions(): Promise<Permission[]> {
    try {
      const userProfile = await UserService.getUserProfile();
      const userRole = userProfile?.role || 'guest';
      
      return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.guest;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return ROLE_PERMISSIONS.guest;
    }
  }

  /**
   * Check if user can access back-office features
   */
  static async canAccessBackOffice(): Promise<boolean> {
    return this.hasMinimumRole('srm');
  }

  /**
   * Check if user can manage other users
   */
  static async canManageUsers(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.MANAGE_USERS);
  }

  /**
   * Check if user can view all projects
   */
  static async canViewAllProjects(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.VIEW_ALL_PROJECTS);
  }

  /**
   * Require specific permission (throws error if not authorized)
   */
  static async requirePermission(permission: Permission): Promise<void> {
    const hasAccess = await this.hasPermission(permission);
    if (!hasAccess) {
      throw new Error(`Access denied: Required permission '${permission}' not granted`);
    }
  }

  /**
   * Require minimum role (throws error if not authorized)
   */
  static async requireMinimumRole(minRole: UserRole): Promise<void> {
    const hasAccess = await this.hasMinimumRole(minRole);
    if (!hasAccess) {
      throw new Error(`Access denied: Required role '${minRole}' or higher`);
    }
  }
}

// React hook for permission checking
export function usePermissions() {
  return {
    hasPermission: AuthorizationService.hasPermission,
    hasAnyPermission: AuthorizationService.hasAnyPermission,
    hasAllPermissions: AuthorizationService.hasAllPermissions,
    hasMinimumRole: AuthorizationService.hasMinimumRole,
    getUserPermissions: AuthorizationService.getUserPermissions,
    canAccessBackOffice: AuthorizationService.canAccessBackOffice,
    canManageUsers: AuthorizationService.canManageUsers,
    canViewAllProjects: AuthorizationService.canViewAllProjects
  };
}