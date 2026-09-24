import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { FakeAuthRepository } from '../helpers/fake-auth-repository';
import { testEnv } from '../helpers/test-app';

describe('app foundation', () => {
  it('starts without opening a real port', async () => {
    const app = await buildApp({
      env: testEnv,
      authRepository: new FakeAuthRepository(),
      healthCheck: {
        database: async () => 'up',
        redis: async () => 'up',
      },
    });

    await app.ready();
    await app.close();
  });

  it('responds to /health as a liveness check', async () => {
    const app = await buildApp({
      env: testEnv,
      authRepository: new FakeAuthRepository(),
      healthCheck: {
        database: async () => 'up',
        redis: async () => 'up',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': 'test-request-id',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe('test-request-id');
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });

  it('allows configured web origins and mutating methods for browser requests', async () => {
    const app = await buildApp({
      env: testEnv,
      authRepository: new FakeAuthRepository(),
      healthCheck: {
        database: async () => 'up',
        redis: async () => 'up',
      },
    });

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/workflows',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'authorization,content-type',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');

    const loopbackResponse = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/tasks/example',
      headers: {
        origin: 'http://127.0.0.1:5173',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'authorization,content-type',
      },
    });

    expect(loopbackResponse.statusCode).toBe(204);
    expect(loopbackResponse.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');

    await app.close();
  });

  it('returns a degraded readiness response when a dependency is down', async () => {
    const app = await buildApp({
      env: testEnv,
      authRepository: new FakeAuthRepository(),
      healthCheck: {
        database: async () => 'up',
        redis: async () => 'down',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: 'degraded',
      services: {
        database: 'up',
        redis: 'down',
      },
    });

    await app.close();
  });

  it('returns 404 errors in the standard format', async () => {
    const app = await buildApp({
      env: testEnv,
      authRepository: new FakeAuthRepository(),
      healthCheck: {
        database: async () => 'up',
        redis: async () => 'up',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/missing-route',
      headers: {
        'x-request-id': 'missing-route-request',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: 'missing-route-request',
      },
    });

    await app.close();
  });
});
