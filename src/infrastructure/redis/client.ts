import Redis from 'ioredis';
import type { Env } from '../../config/env';

let redis: Redis | null = null;

export function getRedisClient(env: Env): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  return redis;
}

export async function checkRedisConnection(env: Env): Promise<'up' | 'down'> {
  try {
    const response = await getRedisClient(env).ping();
    return response === 'PONG' ? 'up' : 'down';
  } catch {
    return 'down';
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
