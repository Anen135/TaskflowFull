/**
 * System-level roles. Roles are coarse buckets; fine-grained access is
 * controlled by Permission entries attached to each Role (many-to-many),
 * so new roles can be composed from existing permissions without code changes.
 */
export enum RoleName {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}