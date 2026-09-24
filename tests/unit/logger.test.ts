import { describe, expect, it } from 'vitest';
import type { Env } from '../../src/config/env';
import { createLoggerOptions } from '../../src/shared/logger/logger';

const baseEnv: Env = {
  NODE_ENV: 'production',
  PORT: 3333,
  HOST: '127.0.0.1',
  LOG_LEVEL: 'info',
  ENABLE_SWAGGER: false,
  DATABASE_URL: 'postgresql://user:password@localhost:5432/flowpilot',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  AUTH_RATE_LIMIT_MAX: 20,
  AUTH_RATE_LIMIT_WINDOW: '1 minute',
  ENABLE_METRICS: false,
  AI_PROVIDER: 'mock',
};

describe('createLoggerOptions', () => {
  it('does not use pino-pretty in production runtime', () => {
    const logger = createLoggerOptions(baseEnv);

    expect(typeof logger).toBe('object');
    expect(logger).not.toHaveProperty('transport');
  });

  it('keeps sensitive fields redacted', () => {
    const logger = createLoggerOptions(baseEnv);

    expect(typeof logger).toBe('object');
    expect(logger).toMatchObject({
      redact: {
        paths: expect.arrayContaining([
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'req.body.refreshToken',
          'req.body.secret',
          'req.body.clientSecret',
        ]),
        censor: '[REDACTED]',
      },
    });
  });
});
