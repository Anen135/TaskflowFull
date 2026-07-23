import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Workspace } from '@/workspaces/entities/workspace.entity';
import { User } from '@/rbac/entities/user.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  async findAll(@Req() req: any): Promise<Task[]> {
    return this.tasksService.findAll(req.user.workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Task | null> {
    return this.tasksService.findById(id);
  }

  @Post()
  async create(@Req() req: any, @Body() data: Partial<Task>): Promise<Task> {
    return this.tasksService.create({
      ...data,
      workspace: { id: req.user.workspaceId } as Partial<Workspace>,
      createdBy: { id: req.user.id } as Partial<User>,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Task>,
  ): Promise<Task> {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.delete(id);
  }
}