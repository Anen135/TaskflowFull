import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../rbac/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { PermissionEntity } from '../rbac/entities/permission.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Task } from '../tasks/task.entity';
import { RbacService } from '../rbac/rbac.service';
import { AuthService } from '../auth/auth.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { TasksService } from '../tasks/tasks.service';
import { RbacModule } from '../rbac/rbac.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TasksModule } from '../tasks/tasks.module';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * This module seeds demo data on startup so the portfolio project
 * looks alive without needing to run a separate seed script.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, PermissionEntity, Workspace, Task]),
    RbacModule,
    AuthModule,
    WorkspacesModule,
    TasksModule,
  ],
})
export class SeedModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedModule.name);

  constructor(
    private rbacService: RbacService,
    private workspacesService: WorkspacesService,
    private tasksService: TasksService,
    private jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seed();
    } catch (err) {
      this.logger.warn(`Seed skipped (likely no DB connection): ${(err as Error).message}`);
    }
  }

  private async seed() {
    // 1. Ensure permissions exist in DB
    await this.rbacService.ensurePermissionsExist();

    // 2. Seed default workspace
    const workspace = await this.workspacesService.seedDefaultWorkspace();

    // 3. Seed roles for this workspace
    const roles = await this.rbacService.seedDefaultRoles(workspace.id);
    const adminRole = roles.find((r) => r.name === 'admin');
    if (!adminRole) throw new Error('Admin role not seeded');

    // 4. Create demo user
    const existingUser = await this.workspacesService['workspaceRepo']?.manager
      ?.getRepository(User)
      ?.findOne({ where: { email: 'admin@taskflow.dev' } });

    if (!existingUser) {
      const hash = await bcrypt.hash('password123', 10);
      const userRepo = this.workspacesService['workspaceRepo']?.manager?.getRepository(User);
      if (userRepo) {
        const user = userRepo.create({
          email: 'admin@taskflow.dev',
          passwordHash: hash,
          fullName: 'Alice Walker',
          workspaceId: workspace.id,
          role: adminRole,
        });
        const saved = await userRepo.save(user);
        this.logger.log(`Demo user created: admin@taskflow.dev / password123`);

        // 5. Seed sample tasks
        await this.tasksService.seedSampleTasks(workspace.id, saved.id);
        this.logger.log('Sample tasks seeded');
      }
    } else {
      this.logger.log('Demo data already exists, skipping seed');
    }
  }
}