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

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ type: 'varchar' })
    name!: string;

  @Column({ default: false })
    isCustom!: boolean;

  @Column({ nullable: true })
  workspaceId?: string;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, { eager: true })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_id' },
        inverseJoinColumn: { name: 'permission_id' },
    })
    permissions!: PermissionEntity[];
}