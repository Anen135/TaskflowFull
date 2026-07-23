import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get(':id')
  async getWorkspace(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }

  @Post()
  async createWorkspace(@Body('name') name: string, @Body('description') description?: string) {
    return this.workspacesService.create(name, description);
  }
}