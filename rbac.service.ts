import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { DEFAULT_ROLE_PERMISSIONS, Permission } from './permissions.enum';
import { RoleName } from './roles.enum';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(PermissionEntity)
    private permissionRepo: Repository<PermissionEntity>,
  ) {}

  /** Called once when a workspace is created — seeds the 5 default roles. */
  async seedDefaultRoles(workspace: Workspace): Promise<Role[]> {
    const allPermissionEntities = await this.permissionRepo.find();
    const byKey = new Map(allPermissionEntities.map((p) => [p.key, p]));

    const roles = Object.values(RoleName).map((name) => {
      const keys = DEFAULT_ROLE_PERMISSIONS[name] ?? [];
      const permissions = keys
        .map((k) => byKey.get(k))
        .filter((p): p is PermissionEntity => !!p);
      return this.roleRepo.create({ name, workspace, permissions, isCustom: false });
    });

    return this.roleRepo.save(roles);
  }

  /** Create a custom role scoped to a workspace with an arbitrary permission set. */
  async createCustomRole(
    workspace: Workspace,
    name: string,
    permissionKeys: Permission[],
  ): Promise<Role> {
    const permissions = await this.permissionRepo.findBy({
      key: permissionKeys as unknown as any,
    });
    const role = this.roleRepo.create({
      name,
      workspace,
      permissions,
      isCustom: true,
    });
    return this.roleRepo.save(role);
  }

  /** Guard against privilege escalation: only users who already hold ALL the
   * permissions in a role may assign that role to someone else. */
  assertCanAssignRole(assignerPermissionKeys: Set<string>, targetRole: Role) {
    const missing = targetRole.permissions
      .map((p) => p.key)
      .filter((key) => !assignerPermissionKeys.has(key));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Cannot assign a role with permissions you do not hold: ${missing.join(', ')}`,
      );
    }
  }

  hasPermission(userPermissionKeys: Set<string>, required: Permission): boolean {
    return userPermissionKeys.has(required);
  }
}
