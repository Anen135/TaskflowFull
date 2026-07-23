import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Usage:
 *   @RequirePermissions(Permission.TASK_DELETE)
 *   @Delete(':id')
 *   remove(@Param('id') id: string) { ... }
 *
 * Multiple permissions => ALL must be present (AND semantics).
 * For OR semantics, apply the guard twice via two decorated route handlers,
 * or extend PermissionsGuard with a `mode: 'any' | 'all'` option.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
