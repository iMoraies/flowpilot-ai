import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env';

describe('loadEnv', () => {
  it('throws when required environment variables are invalid', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'not-a-url',
        REDIS_URL: '',
      }),
    ).toThrow('Invalid environment variables');
  });

  it('loads a valid environment configuration', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/flowpilot',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
      ENABLE_SWAGGER: 'false',
    });

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3333);
    expect(env.ENABLE_SWAGGER).toBe(false);
  });
});
