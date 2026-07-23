import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../rbac/entities/user.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_COMMENT = 'task_comment',
  MENTION = 'mention',
  PROJECT_INVITE = 'project_invite',
  DEADLINE_REMINDER = 'deadline_reminder',
}

@Entity('notifications')
@Index(['recipient', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ nullable: true })
  recipientId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
    recipient!: User;

  @Column({ type: 'varchar' })
    type!: NotificationType;

  @Column()
    title!: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'jsonb', default: {} })
    metadata!: Record<string, unknown>;

  @Column({ default: false })
    read!: boolean;

  @CreateDateColumn()
    createdAt!: Date;
}