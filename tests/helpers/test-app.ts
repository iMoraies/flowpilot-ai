import { buildApp } from '../../src/app';
import type { Env } from '../../src/config/env';
import { FakeAuthRepository } from './fake-auth-repository';

export const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3333,
  HOST: '127.0.0.1',
  LOG_LEVEL: 'silent',
  ENABLE_SWAGGER: false,
  WEB_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/flowpilot',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  AUTH_RATE_LIMIT_MAX: 100,
  AUTH_RATE_LIMIT_WINDOW: '1 minute',
  ENABLE_METRICS: false,
  AI_PROVIDER: 'mock',
};

export async function buildTestApp() {
  const repository = new FakeAuthRepository();
  const app = await buildApp({
    env: testEnv,
    authRepository: repository,
    healthCheck: {
      database: async () => 'up',
      redis: async () => 'up',
    },
  });

  return {
    app,
    repository,
  };
}
