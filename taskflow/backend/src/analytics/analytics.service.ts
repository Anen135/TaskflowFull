import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

export interface ThroughputPoint {
  bucket: string;
  created: number;
  completed: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface AssigneeLoad {
  assigneeId: string;
  assigneeName: string;
  openTasks: number;
  overdueTasks: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  private cacheKey(workspaceId: string, name: string, query: AnalyticsQueryDto) {
    return `analytics:${workspaceId}:${name}:${JSON.stringify(query)}`;
  }

  private async cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    if (!this.redis) return compute();

    try {
      const hit = await this.redis.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      // redis down — fall through
    }

    const value = await compute();

    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // best-effort caching
    }

    return value;
  }

  async getThroughput(
    workspaceId: string,
    query: AnalyticsQueryDto,
  ): Promise<ThroughputPoint[]> {
    const key = this.cacheKey(workspaceId, 'throughput', query);
    return this.cached(key, 60, async () => {
      try {
        const trunc = query.granularity ?? 'day';
        const rows = await this.dataSource.query(
          `
          SELECT
            date_trunc($1, t.created_at) AS bucket,
            COUNT(*) FILTER (WHERE t.created_at IS NOT NULL) AS created,
            COUNT(*) FILTER (WHERE t.completed_at IS NOT NULL
                             AND date_trunc($1, t.completed_at) = date_trunc($1, t.created_at)) AS completed
          FROM tasks t
          WHERE t.workspace_id = $2
            AND t.created_at BETWEEN $3 AND $4
            AND ($5::uuid IS NULL OR t.project_id = $5)
          GROUP BY bucket
          ORDER BY bucket ASC
          `,
          [trunc, workspaceId, query.from, query.to, query.projectId ?? null],
        );
        return rows.map((r: any) => ({
          bucket: r.bucket,
          created: Number(r.created),
          completed: Number(r.completed),
        }));
      } catch (err) {
        // If analytics queries fail (e.g. no tables seeded yet), return empty
        return [];
      }
    });
  }

  async getStatusBreakdown(
    workspaceId: string,
    query: AnalyticsQueryDto,
  ): Promise<StatusBreakdown[]> {
    const key = this.cacheKey(workspaceId, 'status-breakdown', query);
    return this.cached(key, 60, async () => {
      try {
        const rows = await this.dataSource.query(
          `
          SELECT status, COUNT(*) AS count
          FROM tasks
          WHERE workspace_id = $1
            AND created_at BETWEEN $2 AND $3
            AND ($4::uuid IS NULL OR project_id = $4)
          GROUP BY status
          `,
          [workspaceId, query.from, query.to, query.projectId ?? null],
        );
        return rows.map((r: any) => ({ status: r.status, count: Number(r.count) }));
      } catch {
        return [];
      }
    });
  }

  async getAssigneeLoad(
    workspaceId: string,
    query: AnalyticsQueryDto,
  ): Promise<AssigneeLoad[]> {
    const key = this.cacheKey(workspaceId, 'assignee-load', query);
    return this.cached(key, 60, async () => {
      try {
        const rows = await this.dataSource.query(
          `
          SELECT
            u.id AS "assigneeId",
            u.full_name AS "assigneeName",
            COUNT(*) FILTER (WHERE t.status != 'done') AS "openTasks",
            COUNT(*) FILTER (WHERE t.status != 'done' AND t.due_date < NOW()) AS "overdueTasks"
          FROM tasks t
          JOIN users u ON u.id = t.assignee_id
          WHERE t.workspace_id = $1
            AND ($2::uuid IS NULL OR t.project_id = $2)
          GROUP BY u.id, u.full_name
          ORDER BY "openTasks" DESC
          `,
          [workspaceId, query.projectId ?? null],
        );
        return rows.map((r: any) => ({
          assigneeId: r.assigneeId,
          assigneeName: r.assigneeName,
          openTasks: Number(r.openTasks),
          overdueTasks: Number(r.overdueTasks),
        }));
      } catch {
        return [];
      }
    });
  }

  async invalidateWorkspaceCache(workspaceId: string) {
    if (!this.redis) return;
    try {
      const keys = await this.redis.keys(`analytics:${workspaceId}:*`);
      if (keys.length) await this.redis.del(...keys);
    } catch {
      // best-effort
    }
  }
}