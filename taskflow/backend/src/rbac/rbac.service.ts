import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { DEFAULT_ROLE_PERMISSIONS, Permission } from './permissions.enum';
import { RoleName } from './roles.enum';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(PermissionEntity)
    private permissionRepo: Repository<PermissionEntity>,
  ) {}

  async ensurePermissionsExist(): Promise<void> {
    const existing = await this.permissionRepo.find();
    const existingKeys = new Set(existing.map((p) => p.key));

    const allKeys = Object.values(Permission);
    const missing = allKeys.filter((k) => !existingKeys.has(k));

    if (missing.length === 0) return;

    const entities = missing.map((key) =>
      this.permissionRepo.create({
        key,
        description: `Permission to ${key.replace(':', ' ')}`,
      }),
    );

    await this.permissionRepo.save(entities);
    this.logger.log(`Seeded ${entities.length} missing permissions`);
  }

  /** Called once when a workspace is created — seeds default roles. */
  async seedDefaultRoles(workspaceId: string): Promise<Role[]> {
    await this.ensurePermissionsExist();

    const allPermissionEntities = await this.permissionRepo.find();
    const byKey = new Map(allPermissionEntities.map((p) => [p.key, p]));

    const roles = Object.values(RoleName).map((name) => {
      const keys = DEFAULT_ROLE_PERMISSIONS[name] ?? [];
      const permissions = keys
        .map((k) => byKey.get(k))
        .filter((p): p is PermissionEntity => !!p);
      return this.roleRepo.create({
        name,
        workspaceId,
        permissions,
        isCustom: false,
      });
    });

    return this.roleRepo.save(roles);
  }

  async createCustomRole(
    workspaceId: string,
    name: string,
    permissionKeys: Permission[],
  ): Promise<Role> {
    const permissions = await this.permissionRepo.findBy({
      key: permissionKeys as unknown as any,
    });
    const role = this.roleRepo.create({
      name,
      workspaceId,
      permissions,
      isCustom: true,
    });
    return this.roleRepo.save(role);
  }

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