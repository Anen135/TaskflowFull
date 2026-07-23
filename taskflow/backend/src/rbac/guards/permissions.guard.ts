import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../permissions.enum';

/**
 * Assumes an upstream AuthGuard (JWT) has already populated `request.user`
 * with { id, workspaceId, role: { name, permissions: [{key}] } }.
 * Register order matters: @UseGuards(JwtAuthGuard, PermissionsGuard).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('No role assigned to this account.');
    }

    const grantedKeys: Set<string> = new Set(
      user.role.permissions.map((p: { key: string }) => p.key),
    );

    const hasAll = required.every((perm) => grantedKeys.has(perm));

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required
          .filter((p) => !grantedKeys.has(p))
          .join(', ')}`,
      );
    }

    return true;
  }
}