import "reflect-metadata";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RbacModule } from './rbac/rbac.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TasksModule } from './tasks/tasks.module';
import { SeedModule } from './seed/seed.module';

// Import all entities for TypeORM
import { User } from './rbac/entities/user.entity';
import { Role } from './rbac/entities/role.entity';
import { PermissionEntity } from './rbac/entities/permission.entity';
import { Workspace } from './workspaces/entities/workspace.entity';
import { Task } from './tasks/task.entity';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL ?? 'postgres://taskflow:taskflow@localhost:5432/taskflow',
      entities: [User, Role, PermissionEntity, Workspace, Task, Notification],
      synchronize: true, // dev convenience — use migrations in production
      logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }),
    AuthModule,
    RbacModule,
    WorkspacesModule,
    TasksModule,
    AnalyticsModule,
    NotificationsModule,
    SeedModule,
  ],
})
export class AppModule {}