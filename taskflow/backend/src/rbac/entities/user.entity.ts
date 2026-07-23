import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

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

  /** Foreign key to workspace — kept as simple column for direct access. */
  @Column({ nullable: true })
  workspaceId?: string;

  // A user has exactly one role per workspace membership.
  @ManyToOne(() => Role, { eager: true })
    role!: Role;

  @CreateDateColumn()
    createdAt!: Date;
}