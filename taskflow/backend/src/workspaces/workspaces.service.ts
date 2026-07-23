import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
  ) {}

  async findById(id: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({ where: { id }, relations: ['members', 'roles'] });
  }

  async create(name: string, description?: string): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({ name, description: description ?? "" });
    return this.workspaceRepo.save(workspace);
  }

  async seedDefaultWorkspace(): Promise<Workspace> {
    const existing = await this.workspaceRepo.findOne({ where: { name: 'Acme Corp' } });
    if (existing) return existing;

    const workspace = this.workspaceRepo.create({
      name: 'Acme Corp',
      description: 'Demo workspace for TaskFlow portfolio',
    });
    const saved = await this.workspaceRepo.save(workspace);
    this.logger.log(`Seeded default workspace: ${saved.id}`);
    return saved;
  }
}