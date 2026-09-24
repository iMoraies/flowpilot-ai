import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/test-app';

async function registerAdmin(app: Awaited<ReturnType<typeof buildTestApp>>['app'], suffix: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      organizationName: `Tenant ${suffix}`,
      name: `Admin ${suffix}`,
      email: `admin-${suffix}@example.com`,
      password: 'valid-password',
    },
  });

  expect(response.statusCode).toBe(201);
  return response.json<{
    accessToken: string;
    user: { id: string; organizationId: string; email: string };
  }>();
}

describe('users flow and tenant isolation', () => {
  it('lists only users from the authenticated organization', async () => {
    const { app } = await buildTestApp();
    const firstTenant = await registerAdmin(app, 'first');
    await registerAdmin(app, 'second');

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${firstTenant.accessToken}`,
      },
      payload: {
        name: 'Manager First',
        email: 'manager-first@example.com',
        password: 'valid-password',
        role: 'MANAGER',
      },
    });

    expect(created.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${firstTenant.accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const users = response.json<Array<{ email: string; organizationId: string }>>();
    expect(users).toHaveLength(2);
    expect(users.every((user) => user.organizationId === firstTenant.user.organizationId)).toBe(true);
    expect(users.map((user) => user.email)).not.toContain('admin-second@example.com');

    await app.close();
  });

  it('blocks MEMBER from administrative user routes', async () => {
    const { app } = await buildTestApp();
    const admin = await registerAdmin(app, 'member-block');

    await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${admin.accessToken}`,
      },
      payload: {
        name: 'Member Block',
        email: 'member-block@example.com',
        password: 'valid-password',
        role: 'MEMBER',
      },
    });

    const memberLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'member-block@example.com',
        password: 'valid-password',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${memberLogin.json<{ accessToken: string }>().accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_FORBIDDEN');

    await app.close();
  });

  it('prevents cross-tenant role changes', async () => {
    const { app } = await buildTestApp();
    const firstTenant = await registerAdmin(app, 'tenant-a');
    const secondTenant = await registerAdmin(app, 'tenant-b');

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${secondTenant.user.id}/role`,
      headers: {
        authorization: `Bearer ${firstTenant.accessToken}`,
      },
      payload: {
        role: 'MANAGER',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('USER_NOT_FOUND');

    await app.close();
  });

  it('prevents removing the last ADMIN role from an organization', async () => {
    const { app } = await buildTestApp();
    const admin = await registerAdmin(app, 'last-admin');

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${admin.user.id}/role`,
      headers: {
        authorization: `Bearer ${admin.accessToken}`,
      },
      payload: {
        role: 'MANAGER',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('AUTH_FORBIDDEN');

    await app.close();
  });
});
