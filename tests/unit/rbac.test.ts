import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/test-app';

describe('RBAC', () => {
  it('blocks users without an allowed role', async () => {
    const { app } = await buildTestApp();

    const register = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: 'Acme',
        name: 'Admin User',
        email: 'admin@acme.com',
        password: 'valid-password',
      },
    });
    const adminBody = register.json<{ accessToken: string }>();

    const member = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${adminBody.accessToken}`,
      },
      payload: {
        name: 'Member User',
        email: 'member@acme.com',
        password: 'valid-password',
        role: 'MEMBER',
      },
    });

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: member.json<{ email: string }>().email,
        password: 'valid-password',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${login.json<{ accessToken: string }>().accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_FORBIDDEN');

    await app.close();
  });
});
