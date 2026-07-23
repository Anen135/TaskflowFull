import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../rbac/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
      select: ['id', 'email', 'passwordHash', 'fullName', 'workspaceId'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const permissions = user.role?.permissions?.map((p) => p.key) ?? [];

    const payload = {
      sub: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role?.name,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        workspaceId: user.workspaceId,
        role: {
          name: user.role?.name,
          permissions,
        },
      },
    };
  }

  /**
   * Seed a demo user for development purposes.
   * Called once from AppModule on startup if the DB is empty.
   */
  async seedDemoUser(): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: 'admin@taskflow.dev' },
    });
    if (existing) return existing;

    const hash = await bcrypt.hash('password123', 10);

    // We need to create a minimal user without workspace for demo mode.
    // In production this would be part of workspace creation flow.
    const user = this.userRepo.create({
      email: 'admin@taskflow.dev',
      passwordHash: hash,
      fullName: 'Alice Walker',
      // workspaceId will be set by the workspace seed
    });

    const saved = await this.userRepo.save(user);
    this.logger.log('Seeded demo user: admin@taskflow.dev / password123');
    return saved;
  }
}