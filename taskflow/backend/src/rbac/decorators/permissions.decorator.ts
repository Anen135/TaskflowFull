import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Usage:
 *   @RequirePermissions(Permission.TASK_DELETE)
 *   @Delete(':id')
 *   remove(@Param('id') id: string) { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);