import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './notifications/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Redis adapter for horizontal scaling of WebSocket
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redisIoAdapter = new RedisIoAdapter(app, redisUrl);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    Logger.log('Redis IO adapter connected', 'Bootstrap');
  } catch (err) {
    Logger.warn(
      `Redis not available (${(err as Error).message}), falling back to in-memory adapter`,
      'Bootstrap',
    );
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`TaskFlow API running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();