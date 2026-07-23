import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../rbac/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  BLOCKED = 'blocked',
}

@Entity('tasks')
@Index(['workspace', 'status'])
@Index(['assignee'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column({ type: 'int', default: 0 })
  priority!: number; // higher = more urgent

  @Column({ nullable: true })
  dueDate?: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignee?: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy!: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace!: Workspace;

  @Column({ nullable: true })
  projectId?: string;

  @Column({ nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}