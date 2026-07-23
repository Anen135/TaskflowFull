import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { User } from '../rbac/entities/user.entity';

interface CreateNotificationInput {
  recipient: User;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private gateway: NotificationsGateway,
  ) {}

  /**
   * Write-then-push pattern: persist first so the notification survives even
   * if the recipient is offline (they'll see it on next login via `listUnread`),
   * then push it live if a socket is connected.
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipient: input.recipient,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? {},
    });
    const saved = await this.notificationRepo.save(notification);
    this.gateway.emitToUser(input.recipient.id, saved);
    return saved;
  }

  async listUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipient: { id: userId }, read: false },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId, recipient: { id: userId } },
      { read: true },
    );
  }

  /** Example domain hook — call this from TasksService.assign(). */
  async notifyTaskAssigned(assignee: User, taskId: string, taskTitle: string) {
    return this.create({
      recipient: assignee,
      type: NotificationType.TASK_ASSIGNED,
      title: `You were assigned: ${taskTitle}`,
      metadata: { taskId },
    });
  }
}
