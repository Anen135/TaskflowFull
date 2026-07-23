import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  async findAll(workspaceId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { workspace: { id: workspaceId } },
      relations: ['assignee', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.taskRepo.findOne({
      where: { id },
      relations: ['assignee', 'createdBy', 'workspace'],
    });
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepo.create(data);
    const saved = await this.taskRepo.save(task);
    this.logger.log(`Task created: ${saved.id}`);
    return saved;
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    Object.assign(task, data);

    // Auto-set completedAt when status changes to done
    if (data.status === TaskStatus.DONE && !task.completedAt) {
      task.completedAt = new Date();
    }
    if (data.status !== TaskStatus.DONE) {
      task.completedAt = null;
    }

    return this.taskRepo.save(task);
  }

  async delete(id: string): Promise<void> {
    const result = await this.taskRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Task not found');
  }

  /**
   * Seed sample tasks for the demo dashboard.
   * These make the analytics graphs actually render with data.
   */
  async seedSampleTasks(workspaceId: string, userId: string): Promise<Task[]> {
    const existing = await this.taskRepo.find({
      where: { workspace: { id: workspaceId } },
      take: 1,
    });
    if (existing.length > 0) return existing;

    const now = new Date();
    const day = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d;
    };

    const sampleTasks: Partial<Task>[] = [
      {
        title: 'Design new landing page',
        description: 'Create wireframes and high-fidelity mockups for the marketing site redesign.',
        status: TaskStatus.DONE,
        priority: 2,
        workspace: { id: workspaceId } as any,
        completedAt: day(-12),
        createdAt: day(-20),
      },
      {
        title: 'Implement user authentication',
        description: 'JWT-based auth with refresh tokens. Include social login providers.',
        status: TaskStatus.IN_REVIEW,
        priority: 3,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-15),
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'GitHub Actions workflow for lint, test, build, and deploy to staging.',
        status: TaskStatus.IN_PROGRESS,
        priority: 1,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-10),
      },
      {
        title: 'Write API documentation',
        description: 'OpenAPI/Swagger docs for all public endpoints.',
        status: TaskStatus.TODO,
        priority: 0,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-5),
      },
      {
        title: 'Database performance optimization',
        description: 'Add missing indexes, analyze slow queries, implement connection pooling.',
        status: TaskStatus.TODO,
        priority: 2,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-3),
      },
      {
        title: 'Add dark mode support',
        description: 'CSS variables-based theming with system preference detection.',
        status: TaskStatus.DONE,
        priority: 1,
        workspace: { id: workspaceId } as any,
        completedAt: day(-8),
        createdAt: day(-14),
      },
      {
        title: 'Fix notification badge overflow',
        description: 'Badge count exceeds 99 should show 99+',
        status: TaskStatus.DONE,
        priority: 0,
        workspace: { id: workspaceId } as any,
        completedAt: day(-6),
        createdAt: day(-7),
      },
      {
        title: 'Upgrade to React 19',
        description: 'Test all components for breaking changes, update dependencies.',
        status: TaskStatus.BLOCKED,
        priority: 1,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-2),
      },
      {
        title: 'Implement file upload for tasks',
        description: 'Drag-and-drop attachments with S3 storage backend.',
        status: TaskStatus.TODO,
        priority: 2,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-1),
      },
      {
        title: 'Quarterly security audit',
        description: 'Review dependencies, penetration testing, access control review.',
        status: TaskStatus.IN_PROGRESS,
        priority: 3,
        workspace: { id: workspaceId } as any,
        completedAt: null,
        createdAt: day(-4),
      },
    ];

    const tasks = this.taskRepo.create(sampleTasks);
    const saved = await this.taskRepo.save(tasks);
    this.logger.log(`Seeded ${saved.length} sample tasks`);
    return saved;
  }
}