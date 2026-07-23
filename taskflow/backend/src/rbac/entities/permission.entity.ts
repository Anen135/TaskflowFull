import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ type: 'varchar', unique: true })
    key!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
    roles!: Role[];
}