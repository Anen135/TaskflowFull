import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Role } from './role.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column()
  fullName!: string;

  @ManyToOne(() => Workspace, (workspace: { members: any; }) => workspace.members, { onDelete: 'CASCADE' })
  workspace: Workspace;

  // A user has exactly one role per workspace membership (simple, easy to reason
  // about, and matches most PM-tool UX). Cross-workspace membership is modeled
  // via separate User rows keyed by (email, workspace) or a join table if
  // one login should span multiple workspaces — swap this for a
  // WorkspaceMembership join entity if that requirement appears.
  @ManyToOne(() => Role, { eager: true })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;
}
