import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { Permission } from '../rbac/permissions.enum';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('throughput')
  @RequirePermissions(Permission.ANALYTICS_VIEW)

  getThroughput(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getThroughput(req.user.workspaceId, query);
  }

  @Get('status-breakdown')
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  getStatusBreakdown(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getStatusBreakdown(req.user.workspaceId, query);
  }

  @Get('assignee-load')
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  getAssigneeLoad(@Req() req: any, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getAssigneeLoad(req.user.workspaceId, query);
  }
}
