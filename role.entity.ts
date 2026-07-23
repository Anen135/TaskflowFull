import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  Index,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { RoleName } from '../roles.enum';

@Entity('roles')
@Index(['workspace', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: RoleName | string; // string allows custom roles beyond the built-in enum

  @Column({ default: false })
  isCustom: boolean;

  // Roles are scoped per workspace so each tenant can customize permission sets
  // without affecting other tenants (multi-tenant SaaS requirement).
  @ManyToOne(() => Workspace, (workspace) => workspace.roles, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: PermissionEntity[];
}
