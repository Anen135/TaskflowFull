/**
 * Granular permissions, namespaced as "resource:action".
 * Guards check for these strings; Roles are just named sets of them.
 */
export enum Permission {
  // Workspace / org
  WORKSPACE_MANAGE = 'workspace:manage',
  WORKSPACE_BILLING = 'workspace:billing',

  // Users
  USER_INVITE = 'user:invite',
  USER_REMOVE = 'user:remove',
  USER_ROLE_ASSIGN = 'user:role:assign',

  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_VIEW = 'project:view',

  // Tasks
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  TASK_VIEW = 'task:view',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
}

/** Default permission sets per role — seeded on workspace creation. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(Permission),
  admin: [
    Permission.USER_INVITE,
    Permission.USER_REMOVE,
    Permission.USER_ROLE_ASSIGN,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
  ],
  manager: [
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    Permission.TASK_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  member: [
    Permission.PROJECT_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_VIEW,
  ],
  viewer: [Permission.PROJECT_VIEW, Permission.TASK_VIEW],
};