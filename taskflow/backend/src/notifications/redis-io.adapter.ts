import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';

/**
 * Without this adapter, socket.io keeps rooms/sessions in a single process's
 * memory — fine for one instance, broken the moment you scale to 2+ pods
 * (a notification emitted on pod A never reaches a socket connected to pod B).
 * The Redis adapter turns `server.to(room).emit(...)` into a pub/sub broadcast
 * that every instance subscribes to, so it works transparently behind a
 * load balancer.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;


  constructor(
    app: INestApplicationContext,
    private redisUrl: string,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: this.redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}