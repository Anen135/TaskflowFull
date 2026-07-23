import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../rbac/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column()
    name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'active' })
    status!: string;

  @OneToMany(() => User, (user) => user.workspaceId)
    members!: User[];

  @OneToMany(() => Role, (role) => role.workspaceId)
    roles!: Role[];

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}