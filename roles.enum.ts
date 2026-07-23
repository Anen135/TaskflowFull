/**
 * System-level roles. Roles are coarse buckets; fine-grained access is
 * controlled by Permission entries attached to each Role (many-to-many),
 * so new roles can be composed from existing permissions without code changes.
 */
export enum RoleName {
  OWNER = 'owner',       // full control over the workspace/org
  ADMIN = 'admin',       // manage users, projects, settings
  MANAGER = 'manager',   // manage projects & tasks within assigned teams
  MEMBER = 'member',     // create/update own tasks, comment, view assigned projects
  VIEWER = 'viewer',     // read-only access
}
