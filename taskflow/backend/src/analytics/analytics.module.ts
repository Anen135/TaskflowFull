import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        // Redis client — gracefully handles if Redis isn't available
        try {
          const Redis = require('ioredis');
          const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
          client.on('error', () => {}); // suppress connection errors
          return client;
        } catch {
          return null;
        }
      },
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}