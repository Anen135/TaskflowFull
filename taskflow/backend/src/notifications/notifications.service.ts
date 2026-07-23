import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

interface CreateNotificationInput {
  recipientId: string;
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

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      metadata: input.metadata ?? {},
    });
    const saved = await this.notificationRepo.save(notification);
    this.gateway.emitToUser(input.recipientId, saved);
    return saved;
  }

  async listUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipientId: userId, read: false },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId, recipientId: userId },
      { read: true },
    );
  }

  async notifyTaskAssigned(assigneeId: string, taskId: string, taskTitle: string) {
    return this.create({
      recipientId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: `You were assigned: ${taskTitle}`,
      metadata: { taskId },
    });
  }
}